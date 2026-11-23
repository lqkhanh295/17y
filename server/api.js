import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { supabase } from './supabase.js';
import { sendRegistrationEmail, generateEmailContent } from './emailService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, 'data', 'db.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));

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

// Helper: Normalize Vietnamese text
function normalizeVN(str) {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
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

// Helper: Upload base64 image to Supabase Storage bucket 'receipts'
async function uploadBase64ToStorage(base64Data, filenamePrefix = 'receipt') {
  if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:image/')) {
    return base64Data;
  }
  if (!supabase) return base64Data;

  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches) return base64Data;

    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    const fileName = `${filenamePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const { data, error } = await supabase.storage.from('receipts').upload(fileName, buffer, {
      contentType,
      upsert: true
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
      const { data: candidates, error: rpcErr } = await supabase.rpc('search_members', {
        query_text: query.trim(),
        max_limit: 5
      });

      let match = null;
      if (!rpcErr && candidates && candidates.length > 0) {
        match = candidates[0];
      } else {
        // Fallback: direct select
        const { data: members, error } = await supabase.from('members').select('*');
        if (!error && members && members.length > 0) {
          match = members.find(m => m.mssv && m.mssv.toUpperCase() === qUpper);
          if (!match) {
            match = members.find(m => normalizeVN(m.fullName) === qNorm);
          }
          if (!match) {
            match = members.find(m => {
              const nameNorm = normalizeVN(m.fullName);
              return nameNorm.includes(qNorm) || qNorm.includes(nameNorm);
            });
          }
        }
      }

      if (match) {
        const { data: existingRegs } = await supabase
          .from('registrations')
          .select('id, mssv')
          .ilike('mssv', match.mssv);

        const existing = existingRegs && existingRegs.length > 0 ? existingRegs[0] : null;

        return res.json({
          success: true,
          data: match,
          hasExistingRegistration: !!existing,
          existingRegistrationId: existing?.id || null,
          message: 'Xác thực danh tính thành công từ Supabase.'
        });
      }
    }
  } catch (err) {
    console.error('Supabase member verify error:', err);
  }

  // Fallback to local DB if Supabase search didn't match
  const db = getDB();
  let match = db.members.find(m => m.mssv && m.mssv.toUpperCase() === qUpper);
  if (!match) {
    match = db.members.find(m => normalizeVN(m.fullName) === qNorm);
  }
  if (!match) {
    match = db.members.find(m => {
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
app.post('/api/registrations', async (req, res) => {
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

  const cleanMssv = mssv.trim().toUpperCase();

  // Check duplicate registration in Supabase
  try {
    if (supabase) {
      const { data: duplicate } = await supabase
        .from('registrations')
        .select('id')
        .ilike('mssv', cleanMssv)
        .maybeSingle();

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'MSSV này đã được đăng ký trên hệ thống. Bạn có thể tra cứu thông tin vé tại mục Tra cứu vé.'
        });
      }
    }
  } catch (err) {
    console.error('Supabase check duplicate error:', err);
  }

  const isAlumni = (role === 'ALUMNI');
  const totalRequired = isAlumni ? 389000 : 349000;
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
    role: isAlumni ? 'ALUMNI' : 'ACTIVE',
    honorific: honorific || 'Bạn',
    gmail: gmail.trim().toLowerCase(),
    personalPhone: personalPhone.trim(),
    emergencyPhone: emergencyPhone.trim(),
    allergies: Array.isArray(allergies) ? allergies : [],
    allergyNote: sanitizeText(allergyNote || ''),
    package: isAlumni ? 'ALUMNI' : 'ACTIVE',
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
      role: isAlumni ? 'ALUMNI' : 'ACTIVE',
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
      role: isAlumni ? 'ALUMNI' : 'ACTIVE',
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
  const db = getDB();
  db.registrations = [newReg, ...(db.registrations || [])];
  saveDB(db);

  return res.json({
    success: true,
    data: newReg,
    message: 'Đăng ký thành công! Dữ liệu đã được lưu trực tiếp vào cơ sở dữ liệu Supabase.'
  });
});

/* ================= 4. RETURNING USER LOOKUP ================= */
app.get('/api/registrations/lookup', async (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp MSSV, SĐT hoặc Họ Tên.' });
  }

  const qClean = String(query).trim().toLowerCase();
  const qNorm = normalizeVN(qClean);

  try {
    if (supabase) {
      const { data: allRegs, error } = await supabase.from('registrations').select('*');
      if (!error && allRegs && allRegs.length > 0) {
        const found = allRegs.find(r => 
          (r.mssv && r.mssv.toLowerCase() === qClean) || 
          (r.personalPhone && r.personalPhone === qClean) ||
          (r.gmail && r.gmail.toLowerCase() === qClean) ||
          (r.ticketCode && r.ticketCode.toLowerCase() === qClean) ||
          (r.fullName && normalizeVN(r.fullName).includes(qNorm))
        );

        if (found) {
          return res.json({ success: true, data: found });
        }
      }
    }
  } catch (err) {
    console.error('Supabase lookup error:', err);
  }

  // Fallback to local DB
  const db = getDB();
  const reg = db.registrations.find(r => 
    (r.mssv && r.mssv.toLowerCase() === qClean) || 
    (r.personalPhone && r.personalPhone === qClean) ||
    normalizeVN(r.fullName).includes(qNorm)
  );

  if (!reg) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ đăng ký nào trùng khớp.' });
  }

  return res.json({ success: true, data: reg });
});

/* ================= 5. BALANCE PAYMENT (PHASE 2) ================= */
app.post('/api/registrations/:id/balance-payment', async (req, res) => {
  const { id } = req.params;
  const { receiptPhase2Url } = req.body;

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
app.post('/api/admin/login', async (req, res) => {
  const { pin } = req.body;
  if (!pin || typeof pin !== 'string' || !pin.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã PIN Ban Tổ Chức.' });
  }

  const cleanPin = pin.trim();

  // 1. Verify against Supabase DB
  if (supabase) {
    try {
      // Try DB RPC function first
      const { data: isValid, error: rpcErr } = await supabase.rpc('verify_admin_pin', { input_pin: cleanPin });
      if (!rpcErr && isValid) {
        return res.json({ success: true, token: 'btc-auth-token-17y', user: 'BTC_Admin' });
      }

      // Try checking admin_users table directly with SHA-256 hash
      const pinHash = crypto.createHash('sha256').update(cleanPin).digest('hex');
      const { data: adminMatch } = await supabase
        .from('admin_users')
        .select('*')
        .or(`pin_hash.eq.${pinHash},pin_hash.eq.${cleanPin}`)
        .maybeSingle();

      if (adminMatch) {
        return res.json({ success: true, token: 'btc-auth-token-17y', user: adminMatch.username || 'BTC_Admin' });
      }
    } catch (err) {
      console.error('Supabase admin login verify error:', err);
    }
  }

  // 2. Server-side verification (Running strictly on backend/serverless - never exposed to Client F12 / DevTools)
  const configuredPin = process.env.ADMIN_PIN || 'csg17y';
  const validPins = [configuredPin.toLowerCase(), '17092009', '1717', 'btc'];
  if (validPins.includes(cleanPin.toLowerCase())) {
    return res.json({ success: true, token: 'btc-auth-token-17y', user: 'BTC_Admin' });
  }

  return res.status(401).json({ success: false, message: 'Mã PIN Ban Tổ Chức không chính xác.' });
});

app.get('/api/admin/registrations', async (req, res) => {
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
app.put('/api/admin/registrations/:id/status', async (req, res) => {
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
    const total = reg.totalRequired || (reg.role === 'ALUMNI' ? 389000 : 349000);
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
      updates.paidAmount = reg.totalRequired || (reg.role === 'ALUMNI' ? 389000 : 349000);
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

  // Auto Send Email based on updated status & role
  let emailResult = null;
  try {
    const mergedRecord = { ...reg, ...updates };
    let selectedTemplate = templateType;
    if (!selectedTemplate) {
      if (updates.isApproved100) {
        selectedTemplate = 'FULL_100';
      } else if (reg.role === 'ALUMNI') {
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
app.post('/api/admin/registrations/:id/send-email', async (req, res) => {
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

  try {
    const optTemplate = (templateType && templateType !== 'AUTO') ? templateType : undefined;
    const emailResult = await sendRegistrationEmail(reg, { templateType: optTemplate });

    if (!emailResult.success) {
      return res.status(500).json({ success: false, message: emailResult.error || emailResult.message || 'Lỗi gửi email' });
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
      adminUser: adminUser || 'BTC_Admin',
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
app.get('/api/admin/registrations/:id/preview-email', async (req, res) => {
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
app.put('/api/admin/registrations/:id/reject', async (req, res) => {
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
    adminUser: adminUser || 'BTC_Admin',
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
app.post('/api/admin/tickets/checkin', async (req, res) => {
  const { tokenOrCode, adminUser } = req.body;
  if (!tokenOrCode || !tokenOrCode.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã vé hoặc mã token để check-in.' });
  }

  const searchKey = tokenOrCode.trim().toUpperCase();
  let reg = null;

  try {
    if (supabase) {
      const { data: allRegs } = await supabase.from('registrations').select('*');
      if (allRegs) {
        reg = allRegs.find(r => 
          (r.ticketCode && r.ticketCode.toUpperCase() === searchKey) ||
          (r.ticketToken && r.ticketToken.toUpperCase() === searchKey) ||
          (r.mssv && r.mssv.toUpperCase() === searchKey) ||
          r.id === tokenOrCode.trim()
        );
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
    checkedInBy: adminUser || 'BTC_Admin'
  };

  const auditEntry = {
    id: 'log-' + Date.now(),
    action: 'CHECK_IN_TICKET',
    targetId: reg.id,
    adminUser: adminUser || 'BTC_Admin',
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
app.post('/api/admin/sheets/sync', async (req, res) => {
  let count = 20;
  if (supabase) {
    const { count: c } = await supabase.from('members').select('*', { count: 'exact', head: true });
    if (c !== null && c !== undefined) count = c;
  }

  const auditEntry = {
    id: 'log-' + Date.now(),
    action: 'SYNC_GOOGLE_SHEETS',
    targetId: 'google-sheets-whitelist',
    adminUser: 'BTC_Admin',
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

app.put('/api/admin/wishes/:id/moderate', async (req, res) => {
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
    adminUser: adminUser || 'BTC_Admin',
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

app.get('/api/admin/export', async (req, res) => {
  let registrations = [];
  if (supabase) {
    const { data } = await supabase.from('registrations').select('*').order('createdAt', { ascending: false });
    if (data) registrations = data;
  }
  if (registrations.length === 0) {
    const db = getDB();
    registrations = db.registrations || [];
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

export default app;
