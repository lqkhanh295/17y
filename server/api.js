import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { rateLimit } from 'express-rate-limit';
import { supabase } from './supabase.js';
import { sendRegistrationEmail, generateEmailContent } from './emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, 'data', 'db.json');

const app = express();
app.set('trust proxy', 1);

// Secure CORS configuration
const defaultAllowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
];

const configuredOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()).filter(Boolean)
  : [];

const allAllowedOrigins = new Set([...defaultAllowedOrigins, ...configuredOrigins]);

// Pattern strictly limited to CSG 17Y project Vercel deployments
const isProjectVercelDomain = (origin) => {
  return typeof origin === 'string' && /^https:\/\/(csg-17y|17y)(-[a-z0-9-]+)?\.vercel\.app$/i.test(origin);
};

app.use(cors({
  origin: function (origin, callback) {
    // Allow same-origin / server-to-server or strictly verified project domains
    if (!origin || allAllowedOrigins.has(origin) || isProjectVercelDomain(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate Limiting Middlewares
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // max 5 attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Quá nhiều lần thử mã PIN Ban Tổ Chức. Vui lòng chờ 15 phút trước khi thử lại.'
  }
});

// Dedicated rate limiter for sending emails to protect Gmail daily quotas and prevent spam
export const emailSendLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // max 20 email sends per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Tốc độ gửi email quá nhanh. Nhằm bảo vệ hạn mức và an toàn tài khoản Gmail CLB, vui lòng chờ ít phút trước khi gửi tiếp.'
  }
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Bạn đang gửi quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.'
  }
});

// Admin JWT Authentication Helpers (HMAC SHA-256)
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || process.env.SUPABASE_SECRET_KEY || 'csg17y-secure-admin-token-secret-2026';

export function generateAdminToken(username = 'BTC_Admin') {
  const payload = {
    user: username,
    role: 'SUPER_ADMIN',
    iat: Date.now(),
    exp: Date.now() + 12 * 60 * 60 * 1000 // 12 hours valid
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encodedPayload, signature] = parts;
  const expectedSignature = crypto.createHmac('sha256', JWT_SECRET).update(encodedPayload).digest('base64url');
  
  const sigBuf = Buffer.from(signature);
  const expSigBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function requireAdminAuth(req, res, next) {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.query && req.query.token) {
    // Allow token via query param strictly for file downloads like CSV export
    token = String(req.query.token).trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Truy cập bị từ chối: Yêu cầu đăng nhập Ban Tổ Chức (Missing token).'
    });
  }

  const payload = verifyAdminToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Phiên làm việc Ban Tổ Chức không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.'
    });
  }

  req.adminUser = payload.user || 'BTC_Admin';
  next();
}

// Helper: Read DB with failover
function getDB() {
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json:', err);
    return { members: [], memories: [], registrations: [], wishes: [], characters: [], auditLogs: [] };
  }
}

// Helper: Atomic Save DB for backup
function saveDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving db.json:', err);
    return false;
  }
}

// Helper: Sanitize existing registration record for public responses (prevent leaking phone/email/receipts)
function sanitizeExistingRecordForPublic(record) {
  if (!record) return null;
  return {
    id: record.id,
    ticketCode: record.ticketCode,
    fullName: record.fullName,
    mssv: record.mssv,
    role: record.role,
    status: record.status,
    paymentStatus: record.paymentStatus,
    remainingAmount: record.remainingAmount,
    totalRequired: record.totalRequired,
    paidAmount: record.paidAmount,
    isApproved100: record.isApproved100
  };
}

// Helper: Normalize Vietnamese text
function normalizeVN(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper: Deduplicate member candidates by MSSV or ID
function deduplicateByMssv(list) {
  const result = [];
  const seen = new Set();
  for (const item of (list || [])) {
    const key = (item.mssv || item.id || '').toUpperCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

// Helper: Sanitize text (Escape HTML)
function sanitizeText(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Helper: Mask sensitive phone numbers for public lookup
function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const trimmed = phone.trim();
  if (trimmed.length < 7) return trimmed;
  return trimmed.slice(0, 3) + '****' + trimmed.slice(-3);
}

// Helper: Upload base64 image to Supabase Storage bucket 'receipts' with validation
async function uploadBase64ToStorage(base64Data, filenamePrefix = 'receipt') {
  if (!base64Data || typeof base64Data !== 'string') {
    return null;
  }
  if (base64Data.startsWith('https://') || base64Data.startsWith('http://')) {
    return base64Data;
  }
  if (!base64Data.startsWith('data:image/')) {
    throw new Error('Tệp tải lên phải là hình ảnh (JPEG, PNG, WEBP).');
  }

  const matches = base64Data.match(/^data:([A-Za-z0-9\-+\/]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Định dạng ảnh base64 không hợp lệ.');
  }

  const contentType = matches[1].toLowerCase();
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(contentType)) {
    throw new Error('Định dạng ảnh không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WEBP (Không chấp nhận SVG).');
  }

  const buffer = Buffer.from(matches[2], 'base64');
  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error('Kích thước ảnh biên lai vượt quá giới hạn cho phép (tối đa 5MB).');
  }

  // Validate magic bytes
  const isJpeg = buffer.length > 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
  const isPng = buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
  const isWebp = buffer.length > 12 && buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;

  if (!isJpeg && !isPng && !isWebp) {
    throw new Error('Dữ liệu tệp không đúng định dạng hình ảnh thực tế.');
  }

  if (!supabase) return base64Data;

  const ext = contentType === 'image/png' ? 'png' : (contentType === 'image/webp' ? 'webp' : 'jpg');
  const fileName = `${filenamePrefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;

  try {
    const { data, error } = await supabase.storage.from('receipts').upload(fileName, buffer, {
      contentType,
      upsert: false
    });

    if (!error && data) {
      const { data: pubData } = supabase.storage.from('receipts').getPublicUrl(fileName);
      console.log(`[Storage] Uploaded ${fileName} -> ${pubData.publicUrl}`);
      return pubData.publicUrl;
    }
  } catch (err) {
    console.error('Failed to upload image to Supabase Storage:', err);
  }
  return base64Data;
}

/* ================= 1. PUBLIC MEMORIES ================= */
app.get('/api/memories', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return res.json({ success: true, data });
      }
    }
  } catch (err) {
    console.error('Supabase memories fetch error:', err);
  }
  const db = getDB();
  res.json({ success: true, data: db.memories || [] });
});

/* ================= 2. MEMBER SEARCH & VERIFICATION ================= */
app.get('/api/members/search', async (req, res) => {
  const query = (req.query.q || '').toString().trim();
  if (!query) {
    return res.json({ success: true, data: [] });
  }

  try {
    if (supabase) {
      const { data: results, error: rpcErr } = await supabase.rpc('search_members', {
        query_text: query,
        max_limit: 8
      });

      if (!rpcErr && results) {
        return res.json({ success: true, data: results });
      }

      // Fallback direct query
      const { data: directMembers } = await supabase
        .from('members')
        .select('id, mssv, "fullName", role, honorific, generation, department')
        .or(`fullName.ilike.%${query}%,mssv.ilike.%${query}%`)
        .limit(8);

      return res.json({ success: true, data: directMembers || [] });
    }
  } catch (err) {
    console.error('Member search error:', err);
  }

  const db = getDB();
  const qNorm = normalizeVN(query);
  const qUpper = query.toUpperCase();
  const matches = (db.members || []).filter(m => {
    return (m.mssv && m.mssv.toUpperCase().includes(qUpper)) ||
           (m.fullName && normalizeVN(m.fullName).includes(qNorm));
  }).slice(0, 8);

  res.json({ success: true, data: matches });
});

app.post('/api/members/verify', async (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp MSSV hoặc Họ tên.' });
  }

  const qNorm = normalizeVN(query);
  const qUpper = query.trim().toUpperCase();

  try {
    if (supabase) {
      // 1. Prioritize search_members RPC (unaccented, ranked match)
      const { data: rawCandidates, error: rpcErr } = await supabase.rpc('search_members', {
        query_text: query.trim(),
        max_limit: 25
      });

      if (!rpcErr && rawCandidates && rawCandidates.length > 0) {
        // 1a. Check exact MSSV match (always unique)
        const mssvMatch = rawCandidates.find(m => m.mssv && m.mssv.toUpperCase() === qUpper);
        if (mssvMatch) {
          const { data: existingRegs } = await supabase
            .from('registrations')
            .select('*')
            .ilike('mssv', mssvMatch.mssv);
          const existing = existingRegs?.find(r => r.status !== 'REJECTED') || null;

          return res.json({
            success: true,
            multiple: false,
            data: mssvMatch,
            hasExistingRegistration: !!existing,
            existingRecord: sanitizeExistingRecordForPublic(existing),
            existingRegistrationId: existing?.id || null,
            message: existing ? `Bạn đã đăng ký tham dự rồi (Mã vé: ${existing.ticketCode || 'Chờ duyệt'}).` : 'Xác thực MSSV thành công.'
          });
        }

        // 1b. Check multiple exact full name matches (distinct members by MSSV)
        const exactNameMatches = deduplicateByMssv(
          rawCandidates.filter(m => normalizeVN(m.fullName) === qNorm)
        );
        if (exactNameMatches.length > 1) {
          return res.json({
            success: true,
            multiple: true,
            candidates: exactNameMatches,
            message: `Tìm thấy ${exactNameMatches.length} thành viên mang tên "${query.trim()}".`
          });
        }

        if (exactNameMatches.length === 1) {
          const singleMatch = exactNameMatches[0];
          const { data: existingRegs } = await supabase
            .from('registrations')
            .select('*')
            .ilike('mssv', singleMatch.mssv);
          const existing = existingRegs?.find(r => r.status !== 'REJECTED') || null;

          return res.json({
            success: true,
            multiple: false,
            data: singleMatch,
            hasExistingRegistration: !!existing,
            existingRecord: sanitizeExistingRecordForPublic(existing),
            existingRegistrationId: existing?.id || null,
            message: existing ? `Bạn đã đăng ký tham dự rồi (Mã vé: ${existing.ticketCode || 'Chờ duyệt'}).` : 'Xác thực danh tính thành công từ Supabase.'
          });
        }

        // 1c. Partial name matches (e.g. user typed "Minh Đức" or "Khánh Linh")
        const partialMatches = deduplicateByMssv(
          rawCandidates.filter(m => {
            const normName = normalizeVN(m.fullName);
            return normName.includes(qNorm) || qNorm.split(' ').every(w => normName.includes(w));
          })
        );

        if (partialMatches.length > 1) {
          return res.json({
            success: true,
            multiple: true,
            candidates: partialMatches,
            message: `Tìm thấy ${partialMatches.length} thành viên phù hợp với "${query.trim()}".`
          });
        }

        if (partialMatches.length === 1) {
          const singleMatch = partialMatches[0];
          const { data: existingRegs } = await supabase
            .from('registrations')
            .select('*')
            .ilike('mssv', singleMatch.mssv);
          const existing = existingRegs?.find(r => r.status !== 'REJECTED') || null;

          return res.json({
            success: true,
            multiple: false,
            data: singleMatch,
            hasExistingRegistration: !!existing,
            existingRecord: sanitizeExistingRecordForPublic(existing),
            existingRegistrationId: existing?.id || null,
            message: existing ? `Bạn đã đăng ký tham dự rồi (Mã vé: ${existing.ticketCode || 'Chờ duyệt'}).` : 'Xác thực danh tính thành công từ Supabase.'
          });
        }

        // Fallback to first candidate
        const firstCand = rawCandidates[0];
        return res.json({
          success: true,
          multiple: false,
          data: firstCand,
          hasExistingRegistration: false,
          message: 'Xác thực danh tính thành công.'
        });
      }

      // Fallback direct select
      const { data: members, error } = await supabase.from('members').select('*');
      if (!error && members && members.length > 0) {
        const mssvMatch = members.find(m => m.mssv && m.mssv.toUpperCase() === qUpper);
        if (mssvMatch) {
          return res.json({
            success: true,
            multiple: false,
            data: mssvMatch,
            message: 'Xác thực thành công.'
          });
        }

        const nameMatches = deduplicateByMssv(
          members.filter(m => normalizeVN(m.fullName) === qNorm)
        );
        if (nameMatches.length > 1) {
          return res.json({
            success: true,
            multiple: true,
            candidates: nameMatches,
            message: `Tìm thấy ${nameMatches.length} thành viên mang tên "${query.trim()}".`
          });
        }

        if (nameMatches.length === 1) {
          return res.json({
            success: true,
            multiple: false,
            data: nameMatches[0],
            message: 'Xác thực thành công.'
          });
        }

        const partialMatches = deduplicateByMssv(
          members.filter(m => {
            const nameNorm = normalizeVN(m.fullName);
            return nameNorm.includes(qNorm) || qNorm.split(' ').every(w => nameNorm.includes(w));
          })
        );

        if (partialMatches.length > 1) {
          return res.json({
            success: true,
            multiple: true,
            candidates: partialMatches,
            message: `Tìm thấy ${partialMatches.length} thành viên phù hợp với "${query.trim()}".`
          });
        }

        if (partialMatches.length === 1) {
          return res.json({
            success: true,
            multiple: false,
            data: partialMatches[0],
            message: 'Xác thực thành công.'
          });
        }
      }
    }
  } catch (err) {
    console.error('Supabase member verify error:', err);
  }

  // Fallback to local DB if Supabase search didn't match
  const db = getDB();
  const mssvMatch = (db.members || []).find(m => m.mssv && m.mssv.toUpperCase() === qUpper);
  if (mssvMatch) {
    const existing = (db.registrations || []).find(r => r.mssv && r.mssv.toUpperCase() === mssvMatch.mssv.toUpperCase());
    return res.json({
      success: true,
      multiple: false,
      data: mssvMatch,
      hasExistingRegistration: !!existing,
      existingRegistrationId: existing?.id || null,
      message: 'Xác thực MSSV thành công.'
    });
  }

  const exactDbMatches = (db.members || []).filter(m => normalizeVN(m.fullName) === qNorm);
  if (exactDbMatches.length > 1) {
    return res.json({
      success: true,
      multiple: true,
      candidates: exactDbMatches,
      message: `Tìm thấy ${exactDbMatches.length} thành viên mang tên "${query.trim()}".`
    });
  }

  let match = exactDbMatches[0];
  if (!match) {
    match = (db.members || []).find(m => {
      const nameNorm = normalizeVN(m.fullName);
      return nameNorm === qNorm || nameNorm.includes(qNorm) || qNorm.includes(nameNorm);
    });
  }

  if (match) {
    const existing = db.registrations.find(r => r.mssv.toUpperCase() === match.mssv.toUpperCase());
    return res.json({
      success: true,
      data: match,
      hasExistingRegistration: !!existing,
      existingRegistrationId: existing?.id || null,
      message: 'Xác thực danh tính thành công.'
    });
  }

  // Auto-bypass: Allow any name or MSSV to proceed seamlessly as a valid attendee
  const isMssv = /^[A-Z]{2}[0-9]{6}$/i.test(query.trim());
  const customMember = {
    id: `m-custom-${Date.now()}`,
    mssv: isMssv ? query.trim().toUpperCase() : `CSG-${Math.floor(100000 + Math.random() * 900000)}`,
    fullName: isMssv ? 'Thành viên Cóc Sài Gòn' : query.trim(),
    role: 'ACTIVE',
    honorific: 'Bạn',
    generation: 'Khóa 17',
    department: 'Gia đình Cóc Sài Gòn'
  };

  return res.json({
    success: true,
    data: customMember,
    hasExistingRegistration: false,
    message: 'Đã tạo hồ sơ đăng ký tham dự.'
  });
});

/* ================= 3. REGISTRATIONS ================= */
app.post('/api/registrations', generalLimiter, async (req, res) => {
  const {
    memberId,
    fullName,
    mssv,
    role,
    honorific,
    gmail,
    personalPhone,
    emergencyPhone,
    allergies,
    allergyNote,
    paymentPlan,
    plan,
    receiptImage,
    wishes,
    isPublicConsent
  } = req.body;

  if (!fullName || !mssv || !gmail || !personalPhone || !emergencyPhone || !receiptImage) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng điền đầy đủ các trường bắt buộc và tải lên biên lai chuyển khoản.'
    });
  }

  // 1. Strict Input Validations
  const trimmedName = String(fullName).trim();
  if (trimmedName.length < 2 || trimmedName.length > 100) {
    return res.status(400).json({ success: false, message: 'Họ và tên phải từ 2 đến 100 ký tự.' });
  }

  const cleanMssv = String(mssv).trim().toUpperCase();
  if (!/^[A-Z0-9\-_]{4,15}$/.test(cleanMssv)) {
    return res.status(400).json({ success: false, message: 'Mã số sinh viên không hợp lệ (từ 4-15 ký tự chữ và số).' });
  }

  const cleanEmail = String(gmail).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail) || cleanEmail.length > 120) {
    return res.status(400).json({ success: false, message: 'Địa chỉ Gmail không đúng định dạng.' });
  }

  const cleanPersonalPhone = String(personalPhone).trim();
  const cleanEmergencyPhone = String(emergencyPhone).trim();
  const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
  if (!phoneRegex.test(cleanPersonalPhone)) {
    return res.status(400).json({ success: false, message: 'Số điện thoại cá nhân không hợp lệ (10 chữ số).' });
  }
  if (!phoneRegex.test(cleanEmergencyPhone)) {
    return res.status(400).json({ success: false, message: 'Số điện thoại người thân đón về không hợp lệ (10 chữ số).' });
  }

  if (wishes && String(wishes).length > 1000) {
    return res.status(400).json({ success: false, message: 'Lời chúc không được vượt quá 1000 ký tự.' });
  }
  if (allergyNote && String(allergyNote).length > 500) {
    return res.status(400).json({ success: false, message: 'Ghi chú dị ứng không được vượt quá 500 ký tự.' });
  }

  // Check duplicate registration in Supabase (by MSSV, Gmail, or Phone)
  let supabaseChecked = false;
  try {
    if (supabase) {
      const { data: duplicates, error: dupErr } = await supabase
        .from('registrations')
        .select('*')
        .or(`mssv.ilike.${cleanMssv},gmail.ilike.${gmail.trim().toLowerCase()},personalPhone.eq.${personalPhone.trim()}`);

      if (!dupErr) {
        supabaseChecked = true;
        const validDuplicate = duplicates?.find(d => d.status !== 'REJECTED');

        if (validDuplicate) {
          let reason = 'Thông tin này';
          if (validDuplicate.mssv && validDuplicate.mssv.toUpperCase() === cleanMssv) {
            reason = `Mã sinh viên "${cleanMssv}"`;
          } else if (validDuplicate.gmail && validDuplicate.gmail.toLowerCase() === cleanEmail) {
            reason = `Địa chỉ Gmail "${cleanEmail}"`;
          } else if (validDuplicate.personalPhone && validDuplicate.personalPhone === cleanPersonalPhone) {
            reason = `Số điện thoại "${cleanPersonalPhone}"`;
          }

          return res.status(409).json({
            success: false,
            alreadyRegistered: true,
            conflictField: reason,
            existingRecord: sanitizeExistingRecordForPublic(validDuplicate),
            message: `${reason} đã được sử dụng để đăng ký vé trước đó (Mã vé: ${validDuplicate.ticketCode || 'Chờ cấp'}). Vui lòng kiểm tra lại hoặc vào mục Tra cứu vé.`
          });
        }
      }
    }
  } catch (err) {
    console.error('Supabase check duplicate error:', err);
  }

  // Check duplicate in local DB ONLY IF Supabase was not available
  if (!supabaseChecked) {
    const db = getDB();
    const localDup = (db.registrations || []).find(r => 
      r.status !== 'REJECTED' && 
      ((r.mssv && r.mssv.toUpperCase() === cleanMssv) || 
       (r.gmail && r.gmail.toLowerCase() === cleanEmail) ||
       (r.personalPhone && r.personalPhone === cleanPersonalPhone))
    );
    if (localDup) {
      let reason = 'Thông tin này';
      if (localDup.mssv && localDup.mssv.toUpperCase() === cleanMssv) {
        reason = `Mã sinh viên "${cleanMssv}"`;
      } else if (localDup.gmail && localDup.gmail.toLowerCase() === cleanEmail) {
        reason = `Địa chỉ Gmail "${cleanEmail}"`;
      } else if (localDup.personalPhone && localDup.personalPhone === cleanPersonalPhone) {
        reason = `Số điện thoại "${cleanPersonalPhone}"`;
      }

      return res.status(409).json({
        success: false,
        alreadyRegistered: true,
        conflictField: reason,
        existingRecord: sanitizeExistingRecordForPublic(localDup),
        message: `${reason} đã được sử dụng để đăng ký vé trước đó (Mã vé: ${localDup.ticketCode || 'Chờ cấp'}). Vui lòng kiểm tra lại hoặc vào mục Tra cứu vé.`
      });
    }
  }

  const isHighTier = (role === 'ALUMNI' || role === 'GUEST');
  const totalRequired = isHighTier ? 389000 : 349000;
  const effectivePlan = plan || paymentPlan || 'FULL';

  let paidAmount = 0;
  let remainingAmount = totalRequired;
  let paymentStatus = 'PENDING';

  if (effectivePlan === 'FULL') {
    paidAmount = totalRequired;
    remainingAmount = 0;
    paymentStatus = 'PENDING';
  } else if (effectivePlan === 'DEPOSIT_150') {
    paidAmount = 150000;
    remainingAmount = totalRequired - 150000;
    paymentStatus = 'PARTIAL';
  } else if (effectivePlan === 'DEPOSIT_100') {
    paidAmount = 100000;
    remainingAmount = totalRequired - 100000;
    paymentStatus = 'PARTIAL';
  }

  const regId = 'CSG26-' + Math.floor(100000 + Math.random() * 900000);
  const ticketCode = 'CSG17Y-' + cleanMssv.slice(-4) + '-' + Math.floor(100 + Math.random() * 900);

  // Upload receipt image to Supabase Storage
  const storedReceiptUrl = await uploadBase64ToStorage(receiptImage, `rec_phase1_${cleanMssv}`);

  const initialPaymentSubmission = {
    id: 'pay-' + Date.now(),
    phase: 1,
    amount: paidAmount,
    receiptUrl: storedReceiptUrl,
    submittedAt: new Date().toISOString(),
    status: 'PENDING'
  };

  const newReg = {
    id: regId,
    memberId: memberId || 'custom',
    fullName: sanitizeText(fullName),
    mssv: cleanMssv,
    role: role || (isHighTier ? (role === 'GUEST' ? 'GUEST' : 'ALUMNI') : 'ACTIVE'),
    honorific: honorific || 'Bạn',
    gmail: gmail.trim().toLowerCase(),
    personalPhone: personalPhone.trim(),
    emergencyPhone: emergencyPhone.trim(),
    allergies: Array.isArray(allergies) ? allergies : [],
    allergyNote: sanitizeText(allergyNote || ''),
    package: role === 'GUEST' ? 'GUEST' : (isHighTier ? 'ALUMNI' : 'ACTIVE'),
    totalRequired,
    paidAmount,
    remainingAmount,
    plan: effectivePlan,
    paymentPlan: effectivePlan,
    status: paymentStatus,
    paymentStatus,
    isApproved100: false,
    isPublicConsent: isPublicConsent !== false,
    receiptPhase1Url: storedReceiptUrl,
    receiptPhase2Url: null,
    ticketCode,
    ticketToken: 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    createdAt: new Date().toISOString(),
    paymentHistory: [initialPaymentSubmission],
    verifiedBy: null,
    verifiedAt: null
  };

  // 1. Save to Supabase Registrations
  try {
    if (supabase) {
      const { error: insErr } = await supabase.from('registrations').insert(newReg);
      if (insErr) {
        console.error('Supabase registration insert error:', insErr);
      }
    }
  } catch (err) {
    console.error('Supabase insert error:', err);
  }

  // 2. If wish is provided, save to Supabase Wishes & Characters
  const sanitizedWish = sanitizeText(wishes || '');
  if (sanitizedWish.trim().length > 0) {
    const wishObj = {
      id: 'w-' + Date.now(),
      registrationId: regId,
      authorName: `${honorific || ''} ${fullName}`.trim(),
      role: role || (isHighTier ? (role === 'GUEST' ? 'GUEST' : 'ALUMNI') : 'ACTIVE'),
      content: sanitizedWish,
      isPublic: isPublicConsent !== false,
      moderationStatus: 'APPROVED',
      createdAt: new Date().toISOString()
    };

    const charObj = {
      id: 'char-' + Date.now(),
      registrationId: regId,
      name: fullName,
      honorific: honorific || 'Bạn',
      role: role || (isHighTier ? (role === 'GUEST' ? 'GUEST' : 'ALUMNI') : 'ACTIVE'),
      wish: sanitizedWish,
      x: 15 + Math.floor(Math.random() * 70),
      y: 72 + Math.floor(Math.random() * 12),
      direction: Math.random() > 0.5 ? 1 : -1
    };

    try {
      if (supabase) {
        await Promise.allSettled([
          supabase.from('wishes').insert(wishObj),
          supabase.from('characters').insert(charObj)
        ]);
      }
    } catch (err) {
      console.error('Supabase wish/character insert error:', err);
    }

    const db = getDB();
    db.wishes = [wishObj, ...(db.wishes || [])];
    db.characters = [charObj, ...(db.characters || [])];
    saveDB(db);
  }

  // Local backup
  db.registrations = [newReg, ...(db.registrations || [])];
  saveDB(db);

  return res.json({
    success: true,
    data: newReg,
    message: 'Đăng ký thành công! Dữ liệu đã được lưu trực tiếp vào cơ sở dữ liệu Supabase.'
  });
});

/* ================= 4. RETURNING USER LOOKUP ================= */
app.get('/api/registrations/lookup', generalLimiter, async (req, res) => {
  const { query } = req.query;
  if (!query || String(query).trim().length < 4) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp chính xác MSSV, SĐT hoặc Mã Vé (tối thiểu 4 ký tự).' });
  }

  const qClean = String(query).trim().toLowerCase();
  const qUpper = String(query).trim().toUpperCase();

  try {
    if (supabase) {
      const { data: foundRegs, error } = await supabase
        .from('registrations')
        .select('*')
        .or(`mssv.ilike.${qUpper},personalPhone.eq.${qClean},gmail.ilike.${qClean},ticketCode.ilike.${qUpper},ticketToken.eq.${qUpper}`)
        .limit(1);

      if (!error) {
        if (foundRegs && foundRegs.length > 0) {
          const found = foundRegs[0];
          const safeData = {
            ...found,
            emergencyPhone: maskPhone(found.emergencyPhone)
          };
          return res.json({ success: true, found: true, data: safeData });
        }
        // Supabase lookup completed with 0 results - do not fallback to stale local DB
        return res.status(200).json({
          success: true,
          found: false,
          data: null,
          message: 'Không tìm thấy hồ sơ đăng ký nào trùng khớp.'
        });
      }
    }
  } catch (err) {
    console.error('Supabase lookup error:', err);
  }

  // Fallback to local DB only when Supabase is completely unavailable
  const db = getDB();
  const reg = (db.registrations || []).find(r => 
    (r.mssv && r.mssv.toUpperCase() === qUpper) || 
    (r.personalPhone && r.personalPhone === qClean) ||
    (r.gmail && r.gmail.toLowerCase() === qClean) ||
    (r.ticketCode && r.ticketCode.toUpperCase() === qUpper) ||
    (r.ticketToken && r.ticketToken.toUpperCase() === qUpper)
  );

  if (!reg) {
    return res.status(200).json({
      success: true,
      found: false,
      data: null,
      message: 'Không tìm thấy hồ sơ đăng ký nào trùng khớp.'
    });
  }

  const safeData = {
    ...reg,
    emergencyPhone: maskPhone(reg.emergencyPhone)
  };
  return res.json({ success: true, found: true, data: safeData });
});

/* ================= 5. BALANCE PAYMENT (PHASE 2) ================= */
app.post('/api/registrations/:id/balance-payment', generalLimiter, async (req, res) => {
  const { id } = req.params;
  const { receiptPhase2Url, mssv, phone } = req.body;

  if (!receiptPhase2Url) {
    return res.status(400).json({ success: false, message: 'Vui lòng tải lên ảnh chụp biên lai đợt 2.' });
  }

  let reg = null;

  try {
    if (supabase) {
      const { data } = await supabase.from('registrations').select('*').eq('id', id).maybeSingle();
      if (data) reg = data;
    }
  } catch (err) {
    console.error('Supabase balance payment lookup error:', err);
  }

  if (!reg) {
    const db = getDB();
    reg = db.registrations.find(r => r.id === id);
  }

  if (!reg) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ đăng ký.' });
  }

  // IDOR Ownership verification: REQUIRE either MSSV or phone to match the record
  const checkMssv = mssv ? String(mssv).trim().toUpperCase() : null;
  const checkPhone = phone ? String(phone).trim() : null;

  if (!checkMssv && !checkPhone) {
    return res.status(400).json({ 
      success: false, 
      message: 'Xác thực quyền sở hữu thất bại: Vui lòng cung cấp MSSV hoặc Số điện thoại đăng ký.' 
    });
  }

  const matchesMssv = Boolean(checkMssv && reg.mssv && reg.mssv.toUpperCase() === checkMssv);
  const matchesPhone = Boolean(checkPhone && reg.personalPhone && reg.personalPhone.trim() === checkPhone);

  if (!matchesMssv && !matchesPhone) {
    return res.status(403).json({ 
      success: false, 
      message: 'Xác thực quyền sở hữu hồ sơ không hợp lệ (MSSV hoặc SĐT không khớp với hồ sơ gốc).' 
    });
  }

  const storedReceiptPhase2Url = await uploadBase64ToStorage(receiptPhase2Url, `rec_phase2_${id}`);

  reg.receiptPhase2Url = storedReceiptPhase2Url;
  const phase2Amount = (reg.remainingAmount && reg.remainingAmount > 0) 
    ? reg.remainingAmount 
    : (reg.totalRequired - reg.paidAmount);
  
  const paymentHistory = Array.isArray(reg.paymentHistory) ? [...reg.paymentHistory] : [];
  paymentHistory.push({
    id: 'pay-' + Date.now(),
    phase: 2,
    amount: phase2Amount,
    receiptUrl: storedReceiptPhase2Url,
    submittedAt: new Date().toISOString(),
    status: 'PENDING'
  });

  const updateFields = {
    receiptPhase2Url: storedReceiptPhase2Url,
    paymentHistory,
    status: 'PENDING',
    paymentStatus: 'PENDING'
  };

  try {
    if (supabase) {
      await supabase.from('registrations').update(updateFields).eq('id', id);
    }
  } catch (err) {
    console.error('Supabase balance update error:', err);
  }

  const db = getDB();
  const localReg = db.registrations.find(r => r.id === id);
  if (localReg) {
    Object.assign(localReg, updateFields);
    saveDB(db);
  }

  Object.assign(reg, updateFields);

  return res.json({
    success: true,
    data: reg,
    message: 'Đã cập nhật biên lai thanh toán phần còn lại! BTC sẽ kiểm tra và duyệt vé cho bạn.'
  });
});

/* ================= 6. PUBLIC WISHES & CHARACTERS ================= */
app.get('/api/wishes/public', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('wishes')
        .select('*')
        .eq('moderationStatus', 'APPROVED')
        .eq('isPublic', true)
        .order('createdAt', { ascending: false });
      if (!error && data) {
        return res.json({ success: true, data });
      }
    }
  } catch (err) {
    console.error('Supabase wishes fetch error:', err);
  }

  const db = getDB();
  const approved = (db.wishes || []).filter(w => w.moderationStatus === 'APPROVED' && w.isPublic);
  res.json({ success: true, data: approved });
});

app.get('/api/characters/stage', async (req, res) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('characters').select('*');
      if (!error && data) {
        return res.json({ success: true, data });
      }
    }
  } catch (err) {
    console.error('Supabase characters fetch error:', err);
  }

  const db = getDB();
  res.json({ success: true, data: db.characters || [] });
});

/* ================= 7. ADMIN ENDPOINTS ================= */
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const { pin } = req.body;
  if (!pin || typeof pin !== 'string' || !pin.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã PIN Ban Tổ Chức.' });
  }

  const cleanPin = pin.trim();
  let isAuthenticated = false;
  let adminUsername = 'BTC_Admin';

  // 1. If ADMIN_PIN is explicitly configured in environment, use it as primary authority
  const configuredPin = process.env.ADMIN_PIN ? process.env.ADMIN_PIN.trim() : null;

  if (configuredPin) {
    if (cleanPin.toLowerCase() === configuredPin.toLowerCase()) {
      isAuthenticated = true;
    }
  } else {
    // 2. Otherwise verify against Supabase DB admin_users
    if (supabase) {
      try {
        const pinHash = crypto.createHash('sha256').update(cleanPin).digest('hex');
        const { data: adminMatch } = await supabase
          .from('admin_users')
          .select('*')
          .eq('pin_hash', pinHash)
          .maybeSingle();

        if (adminMatch) {
          isAuthenticated = true;
          adminUsername = adminMatch.username || 'BTC_Admin';
        }
      } catch (err) {
        console.error('Supabase admin login verify error:', err);
      }
    }
  }

  // Log login attempt in audit_logs
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const loginAudit = {
    id: 'log-' + Date.now(),
    action: isAuthenticated ? 'ADMIN_LOGIN_SUCCESS' : 'ADMIN_LOGIN_FAILED',
    targetId: 'admin-portal',
    adminUser: isAuthenticated ? adminUsername : `FAILED_ATTEMPT (${clientIp})`,
    details: isAuthenticated 
      ? `Đăng nhập quản trị thành công từ IP: ${clientIp}` 
      : `Đăng nhập quản trị thất bại từ IP: ${clientIp}`,
    timestamp: new Date().toISOString()
  };

  if (supabase) {
    try {
      await supabase.from('audit_logs').insert(loginAudit);
    } catch (e) {
      console.warn('Login audit insert failed:', e);
    }
  }

  if (isAuthenticated) {
    const token = generateAdminToken(adminUsername);
    return res.json({ 
      success: true, 
      token, 
      user: adminUsername,
      message: 'Đăng nhập Ban Tổ Chức thành công.' 
    });
  }

  return res.status(401).json({ success: false, message: 'Mã PIN Ban Tổ Chức không chính xác.' });
});

app.get('/api/admin/registrations', requireAdminAuth, async (req, res) => {
  try {
    if (supabase) {
      const [regsRes, wishesRes, logsRes] = await Promise.all([
        supabase.from('registrations').select('*').order('createdAt', { ascending: false }),
        supabase.from('wishes').select('*').order('createdAt', { ascending: false }),
        supabase.from('audit_logs').select('*').order('timestamp', { ascending: false })
      ]);

      if (!regsRes.error) {
        return res.json({
          success: true,
          data: regsRes.data || [],
          wishes: wishesRes.data || [],
          auditLogs: logsRes.data || []
        });
      }
    }
  } catch (err) {
    console.error('Supabase admin registrations fetch error:', err);
  }

  const db = getDB();
  res.json({
    success: true,
    data: db.registrations || [],
    wishes: db.wishes || [],
    auditLogs: db.auditLogs || []
  });
});

// Admin Approve Payment (Specific or 100%) & Auto Send Email
app.put('/api/admin/registrations/:id/status', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { status, isApproved100, action, adminUser, templateType } = req.body;

  let reg = null;
  try {
    if (supabase) {
      const { data } = await supabase.from('registrations').select('*').eq('id', id).maybeSingle();
      if (data) reg = data;
    }
  } catch (err) {
    console.error('Supabase admin status lookup error:', err);
  }

  if (!reg) {
    const db = getDB();
    reg = (db.registrations || []).find(r => r.id === id);
  }

  if (!reg) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ.' });
  }

  const updates = {};
  if (status) {
    updates.status = status;
    updates.paymentStatus = status;
  }

  // Handle APPROVE_DEPOSIT action
  if (action === 'APPROVE_DEPOSIT' || status === 'DEPOSITED') {
    updates.isApproved100 = false;
    updates.status = 'DEPOSITED';
    updates.paymentStatus = 'DEPOSITED';
    updates.paidAmount = 150000;
    const isHighTier = (reg.role === 'ALUMNI' || reg.role === 'GUEST');
    const total = reg.totalRequired || (isHighTier ? 389000 : 349000);
    updates.totalRequired = total;
    updates.remainingAmount = Math.max(0, total - 150000);
    updates.verifiedBy = adminUser || 'BTC_Admin';
    updates.verifiedAt = new Date().toISOString();

    if (reg.paymentHistory && Array.isArray(reg.paymentHistory)) {
      updates.paymentHistory = reg.paymentHistory.map(p => ({
        ...p,
        status: p.phase === 1 ? 'VERIFIED' : p.status,
        verifiedBy: adminUser || 'BTC_Admin',
        verifiedAt: new Date().toISOString()
      }));
    }
  }

  // Handle APPROVE 100%
  if (isApproved100 !== undefined || action === 'APPROVE_100') {
    updates.isApproved100 = isApproved100 !== undefined ? Boolean(isApproved100) : true;
    if (updates.isApproved100) {
      updates.status = 'FULLY_PAID';
      updates.paymentStatus = 'FULLY_PAID';
      const isHighTier = (reg.role === 'ALUMNI' || reg.role === 'GUEST');
      updates.paidAmount = reg.totalRequired || (isHighTier ? 389000 : 349000);
      updates.remainingAmount = 0;
      updates.verifiedBy = adminUser || 'BTC_Admin';
      updates.verifiedAt = new Date().toISOString();

      if (reg.paymentHistory && Array.isArray(reg.paymentHistory)) {
        updates.paymentHistory = reg.paymentHistory.map(p => ({
          ...p,
          status: p.status === 'PENDING' ? 'VERIFIED' : p.status,
          verifiedBy: adminUser || 'BTC_Admin',
          verifiedAt: new Date().toISOString()
        }));
      }
    }
  }

  // Auto Send Email ONLY on approval actions (DEPOSIT or 100%) and NEVER when rejecting
  let emailResult = null;
  const isApprovalAction = (action === 'APPROVE_DEPOSIT' || 
                            action === 'APPROVE_100' || 
                            updates.status === 'DEPOSITED' || 
                            updates.status === 'FULLY_PAID' || 
                            updates.isApproved100 === true) && updates.status !== 'REJECTED';

  if (isApprovalAction) {
    try {
      const mergedRecord = { ...reg, ...updates };
      let selectedTemplate = templateType;
      if (!selectedTemplate) {
        if (updates.isApproved100) {
          selectedTemplate = 'FULL_100';
        } else if (reg.role === 'ALUMNI' || reg.role === 'GUEST') {
          selectedTemplate = 'DEPOSIT_ALUMNI';
        } else {
          selectedTemplate = 'DEPOSIT_ACTIVE';
        }
      }

      emailResult = await sendRegistrationEmail(mergedRecord, { templateType: selectedTemplate });
      if (emailResult && emailResult.sent) {
        updates.isEmailSent = true;
        updates.emailSentAt = emailResult.timestamp;
        updates.lastEmailTemplate = emailResult.templateType;
      }
    } catch (emailErr) {
      console.error('[API] Auto send email error on approval:', emailErr);
    }
  }

  const emailDetail = updates.isEmailSent ? ` [Đã gửi email ${updates.lastEmailTemplate} tới ${reg.gmail}]` : '';
  const auditEntry = {
    id: 'log-' + Date.now(),
    action: updates.isApproved100 ? 'APPROVE_100' : (action === 'APPROVE_DEPOSIT' ? 'APPROVE_DEPOSIT' : 'STATUS_CHANGE'),
    targetId: id,
    adminUser: adminUser || 'BTC_Admin',
    details: `Duyệt thanh toán cho ${reg.fullName} (${reg.mssv}) -> ${updates.status || reg.status}.${emailDetail}`,
    timestamp: new Date().toISOString()
  };

  try {
    if (supabase) {
      await supabase.from('registrations').update(updates).eq('id', id);
      await supabase.from('audit_logs').insert(auditEntry);
    }
  } catch (err) {
    console.error('Supabase status update error:', err);
  }

  const db = getDB();
  const localReg = (db.registrations || []).find(r => r.id === id);
  if (localReg) {
    Object.assign(localReg, updates);
    db.auditLogs = [auditEntry, ...(db.auditLogs || [])];
    saveDB(db);
  }

  Object.assign(reg, updates);
  return res.json({
    success: true,
    data: reg,
    emailResult,
    message: updates.isEmailSent 
      ? `Đã duyệt thành công và tự động gửi email (${updates.lastEmailTemplate}) tới ${reg.gmail}!`
      : 'Đã cập nhật trạng thái thành công.'
  });
});

// Admin Manually Send / Resend Email
app.post('/api/admin/registrations/:id/send-email', requireAdminAuth, emailSendLimiter, async (req, res) => {
  const { id } = req.params;
  const { templateType, adminUser } = req.body;

  let reg = null;
  try {
    if (supabase) {
      const { data } = await supabase.from('registrations').select('*').eq('id', id).maybeSingle();
      if (data) reg = data;
    }
  } catch (err) {
    console.error('Supabase send-email lookup error:', err);
  }

  if (!reg) {
    const db = getDB();
    reg = (db.registrations || []).find(r => r.id === id);
  }

  if (!reg) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ người đăng ký.' });
  }

  // Anti-spam cooldown: block duplicate resend within 30 seconds
  if (reg.emailSentAt) {
    const elapsed = Date.now() - new Date(reg.emailSentAt).getTime();
    if (elapsed < 30000) {
      const waitSeconds = Math.ceil((30000 - elapsed) / 1000);
      return res.status(429).json({
        success: false,
        message: `Vui lòng đợi ${waitSeconds} giây nữa trước khi gửi lại email cho người này.`
      });
    }
  }

  try {
    const optTemplate = (templateType && templateType !== 'AUTO') ? templateType : undefined;
    const emailResult = await sendRegistrationEmail(reg, { templateType: optTemplate });

    if (!emailResult.success) {
      return res.status(500).json({
        success: false,
        message: emailResult.error || 'Gửi email không thành công. Vui lòng kiểm tra lại dịch vụ gửi thư.'
      });
    }

    const updates = {
      isEmailSent: true,
      emailSentAt: emailResult.timestamp,
      lastEmailTemplate: emailResult.templateType
    };

    const auditEntry = {
      id: 'log-' + Date.now(),
      action: 'RESEND_EMAIL',
      targetId: id,
      adminUser: adminUser || req.adminUser || 'BTC_Admin',
      details: `Gửi email thủ công (${emailResult.templateType}) cho ${reg.fullName} (${reg.mssv}) tới ${reg.gmail}`,
      timestamp: new Date().toISOString()
    };

    try {
      if (supabase) {
        await supabase.from('registrations').update(updates).eq('id', id);
        await supabase.from('audit_logs').insert(auditEntry);
      }
    } catch (dbErr) {
      console.error('Supabase save email status error:', dbErr);
    }

    const db = getDB();
    const localReg = (db.registrations || []).find(r => r.id === id);
    if (localReg) {
      Object.assign(localReg, updates);
      db.auditLogs = [auditEntry, ...(db.auditLogs || [])];
      saveDB(db);
    }

    Object.assign(reg, updates);
    return res.json({
      success: true,
      data: reg,
      emailResult,
      message: `Đã gửi email (${emailResult.templateType}) thành công tới ${reg.gmail}`
    });
  } catch (err) {
    console.error('Manual email send failed:', err);
    return res.status(500).json({ success: false, message: 'Lỗi trong quá trình gửi mail: ' + err.message });
  }
});

// Admin Preview Email Endpoint
app.get('/api/admin/registrations/:id/preview-email', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { templateType } = req.query;

  let reg = null;
  try {
    if (supabase) {
      const { data } = await supabase.from('registrations').select('*').eq('id', id).maybeSingle();
      if (data) reg = data;
    }
  } catch (err) {
    console.error('Supabase preview-email lookup error:', err);
  }

  if (!reg) {
    const db = getDB();
    reg = (db.registrations || []).find(r => r.id === id);
  }

  if (!reg) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ người đăng ký.' });
  }

  const optTemplate = (templateType && templateType !== 'AUTO') ? templateType : undefined;
  const preview = generateEmailContent(reg, optTemplate);
  return res.json({ success: true, data: preview });
});

// Admin Reject Payment with Reason
app.put('/api/admin/registrations/:id/reject', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { rejectReason, adminUser } = req.body;

  let reg = null;
  try {
    if (supabase) {
      const { data } = await supabase.from('registrations').select('*').eq('id', id).maybeSingle();
      if (data) reg = data;
    }
  } catch (err) {
    console.error('Supabase reject lookup error:', err);
  }

  if (!reg) {
    const db = getDB();
    reg = (db.registrations || []).find(r => r.id === id);
  }

  if (!reg) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ.' });
  }

  const updates = {
    status: 'REJECTED',
    paymentStatus: 'REJECTED',
    rejectReason: rejectReason || 'Biên lai chuyển khoản không hợp lệ hoặc không đối soát được.',
    isApproved100: false
  };

  if (reg.paymentHistory && Array.isArray(reg.paymentHistory) && reg.paymentHistory.length > 0) {
    const history = [...reg.paymentHistory];
    const latest = { ...history[history.length - 1], status: 'REJECTED', rejectReason: updates.rejectReason };
    history[history.length - 1] = latest;
    updates.paymentHistory = history;
  }

  const auditEntry = {
    id: 'log-' + Date.now(),
    action: 'REJECT_PAYMENT',
    targetId: id,
    adminUser: adminUser || req.adminUser || 'BTC_Admin',
    details: `Từ chối biên lai của ${reg.fullName} (${reg.mssv}). Lý do: ${updates.rejectReason}`,
    timestamp: new Date().toISOString()
  };

  try {
    if (supabase) {
      await supabase.from('registrations').update(updates).eq('id', id);
      await supabase.from('audit_logs').insert(auditEntry);
    }
  } catch (err) {
    console.error('Supabase reject error:', err);
  }

  const db = getDB();
  const localReg = (db.registrations || []).find(r => r.id === id);
  if (localReg) {
    Object.assign(localReg, updates);
    db.auditLogs = [auditEntry, ...(db.auditLogs || [])];
    saveDB(db);
  }

  Object.assign(reg, updates);
  return res.json({ success: true, data: reg, message: 'Đã từ chối biên lai và cập nhật trạng thái trên Supabase.' });
});

// Admin Ticket Check-in Endpoint
app.post('/api/admin/tickets/checkin', requireAdminAuth, async (req, res) => {
  const { tokenOrCode, adminUser } = req.body;
  if (!tokenOrCode || !tokenOrCode.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã vé hoặc mã token để check-in.' });
  }

  const searchKey = tokenOrCode.trim().toUpperCase();
  let reg = null;

  try {
    if (supabase) {
      const { data: matchRegs, error } = await supabase
        .from('registrations')
        .select('*')
        .or(`ticketCode.ilike.${searchKey},ticketToken.ilike.${searchKey},mssv.ilike.${searchKey},id.eq.${tokenOrCode.trim()}`)
        .limit(1);

      if (!error && matchRegs && matchRegs.length > 0) {
        reg = matchRegs[0];
      }
    }
  } catch (err) {
    console.error('Supabase checkin lookup error:', err);
  }

  if (!reg) {
    const db = getDB();
    reg = (db.registrations || []).find(r => 
      (r.ticketCode && r.ticketCode.toUpperCase() === searchKey) ||
      (r.ticketToken && r.ticketToken.toUpperCase() === searchKey) ||
      (r.mssv && r.mssv.toUpperCase() === searchKey) ||
      r.id === tokenOrCode.trim()
    );
  }

  if (!reg) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ vé với mã: ' + tokenOrCode });
  }

  if (!reg.isApproved100) {
    return res.status(400).json({ 
      success: false, 
      message: `Vé của ${reg.fullName} (${reg.mssv}) chưa hoàn tất 100% phí tham dự (Đang ở trạng thái: ${reg.status || reg.paymentStatus || 'Chưa hoàn tất'}). Không thể check-in!` 
    });
  }

  if (reg.isCheckedIn) {
    return res.status(409).json({
      success: false,
      alreadyCheckedIn: true,
      message: `CẢNH BÁO: Vé của ${reg.fullName} đã được check-in vào lúc ${new Date(reg.checkedInAt).toLocaleTimeString('vi-VN')} ngày ${new Date(reg.checkedInAt).toLocaleDateString('vi-VN')} bởi ${reg.checkedInBy || 'BTC'}. Vui lòng đối soát lại người sử dụng vé!`,
      data: reg
    });
  }

  const updates = {
    isCheckedIn: true,
    checkedInAt: new Date().toISOString(),
    checkedInBy: adminUser || req.adminUser || 'BTC_Admin'
  };

  const auditEntry = {
    id: 'log-' + Date.now(),
    action: 'CHECK_IN_TICKET',
    targetId: reg.id,
    adminUser: adminUser || req.adminUser || 'BTC_Admin',
    details: `Soát vé thành công cho ${reg.fullName} (${reg.mssv}) - Mã vé ${reg.ticketCode}`,
    timestamp: new Date().toISOString()
  };

  try {
    if (supabase) {
      await supabase.from('registrations').update(updates).eq('id', reg.id);
      await supabase.from('audit_logs').insert(auditEntry);
    }
  } catch (err) {
    console.error('Supabase checkin update error:', err);
  }

  const db = getDB();
  const localReg = (db.registrations || []).find(r => r.id === reg.id);
  if (localReg) {
    Object.assign(localReg, updates);
    db.auditLogs = [auditEntry, ...(db.auditLogs || [])];
    saveDB(db);
  }

  Object.assign(reg, updates);

  return res.json({
    success: true,
    data: reg,
    message: `Xác nhận check-in thành công! Chào mừng ${reg.honorific || ''} ${reg.fullName} đến với Đại tiệc Cóc Sài Gòn 17Y 🎉`
  });
});

// Google Sheets Sync Simulator
app.post('/api/admin/sheets/sync', requireAdminAuth, async (req, res) => {
  let count = 20;
  if (supabase) {
    const { count: c } = await supabase.from('members').select('*', { count: 'exact', head: true });
    if (c !== null && c !== undefined) count = c;
  }

  const auditEntry = {
    id: 'log-' + Date.now(),
    action: 'SYNC_GOOGLE_SHEETS',
    targetId: 'google-sheets-whitelist',
    adminUser: req.adminUser || 'BTC_Admin',
    details: `Đồng bộ danh sách mời từ Google Sheet thành công (${count} thành viên)`,
    timestamp: new Date().toISOString()
  };

  if (supabase) {
    await supabase.from('audit_logs').insert(auditEntry);
  }

  return res.json({
    success: true,
    lastSynced: new Date().toISOString(),
    totalMembers: count,
    added: 0,
    updated: 0,
    message: `Đồng bộ thành công ${count} thành viên từ Google Sheet whitelist.`
  });
});

app.put('/api/admin/wishes/:id/moderate', requireAdminAuth, async (req, res) => {
  const { id } = req.params;
  const { moderationStatus, adminUser } = req.body;

  let wish = null;
  if (supabase) {
    const { data } = await supabase.from('wishes').select('*').eq('id', id).maybeSingle();
    if (data) wish = data;
  }

  if (!wish) {
    const db = getDB();
    wish = (db.wishes || []).find(w => w.id === id);
  }

  if (!wish) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lời chúc.' });
  }

  const updates = { moderationStatus };
  const auditEntry = {
    id: 'log-' + Date.now(),
    action: 'MODERATE_WISH',
    targetId: id,
    adminUser: adminUser || req.adminUser || 'BTC_Admin',
    details: `Kiểm duyệt lời chúc của ${wish.authorName} -> ${moderationStatus}`,
    timestamp: new Date().toISOString()
  };

  if (supabase) {
    await supabase.from('wishes').update(updates).eq('id', id);
    await supabase.from('audit_logs').insert(auditEntry);
  }

  const db = getDB();
  const localWish = (db.wishes || []).find(w => w.id === id);
  if (localWish) {
    localWish.moderationStatus = moderationStatus;
    db.auditLogs = [auditEntry, ...(db.auditLogs || [])];
    saveDB(db);
  }

  Object.assign(wish, updates);
  return res.json({ success: true, data: wish, message: 'Đã kiểm duyệt lời chúc thành công.' });
});

app.get('/api/admin/export', requireAdminAuth, async (req, res) => {
  let registrations = [];
  if (supabase) {
    const { data } = await supabase.from('registrations').select('*').order('createdAt', { ascending: false });
    if (data) registrations = data;
  }
  if (registrations.length === 0) {
    const db = getDB();
    registrations = db.registrations || [];
  }

  const auditEntry = {
    id: 'log-' + Date.now(),
    action: 'EXPORT_CSV',
    targetId: 'all-registrations',
    adminUser: req.adminUser || 'BTC_Admin',
    details: `Xuất toàn bộ ${registrations.length} hồ sơ đăng ký ra file CSV`,
    timestamp: new Date().toISOString()
  };

  if (supabase) {
    try {
      await supabase.from('audit_logs').insert(auditEntry);
    } catch (e) {
      console.warn('Export audit failed:', e);
    }
  }

  const headers = ['Mã ĐK,Họ Tên,MSSV,Vai Trò,Gmail,SĐT,SĐT Khẩn Cấp,Dị Ứng,Tổng Phí,Đã Đóng,Còn Thiếu,Trạng Thái,Đã Duyệt 100%,Mã Vé'];
  const rows = registrations.map(r => 
    `"${r.id}","${r.fullName}","${r.mssv}","${r.role}","${r.gmail}","${r.personalPhone}","${r.emergencyPhone}","${(r.allergies || []).join('; ')}",${r.totalRequired},${r.paidAmount},${r.remainingAmount},"${r.paymentStatus || r.status}","${r.isApproved100 ? 'YES' : 'NO'}","${r.ticketCode}"`
  );

  const csv = '\uFEFF' + [headers, ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=CSG17Y_Registrations_${Date.now()}.csv`);
  res.send(csv);
});

// Global Error Handling Middleware (Prevents stack trace leaks in production)
app.use((err, req, res, next) => {
  console.error('[API Server Error]:', err.message);
  if (res.headersSent) {
    return next(err);
  }
  const isProd = process.env.NODE_ENV === 'production';
  res.status(err.status || 500).json({
    success: false,
    message: isProd ? 'Đã có lỗi xảy ra trên hệ thống.' : err.message
  });
});

export default app;
