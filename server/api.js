import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// Helper: Atomic Save DB
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
  return str
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

/* ================= 1. PUBLIC MEMORIES ================= */
app.get('/api/memories', (req, res) => {
  const db = getDB();
  res.json({ success: true, data: db.memories || [] });
});

/* ================= 2. MEMBER VERIFICATION ================= */
app.post('/api/members/verify', (req, res) => {
  const { query } = req.body;
  if (!query || !query.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp MSSV hoặc Họ tên.' });
  }

  const db = getDB();
  const qNorm = normalizeVN(query);
  const qUpper = query.trim().toUpperCase();

  // 1. Direct MSSV check
  let match = db.members.find(m => m.mssv && m.mssv.toUpperCase() === qUpper);

  // 2. Fuzzy name check
  if (!match) {
    match = db.members.find(m => {
      const nameNorm = normalizeVN(m.fullName);
      return nameNorm === qNorm || nameNorm.includes(qNorm) || qNorm.includes(nameNorm);
    });
  }

  if (match) {
    // Check if participant already has an existing registration
    const existing = db.registrations.find(r => r.mssv.toUpperCase() === match.mssv.toUpperCase());
    return res.json({
      success: true,
      data: match,
      hasExistingRegistration: !!existing,
      existingRegistrationId: existing?.id || null,
      message: 'Xác thực danh tính thành công.'
    });
  }

  return res.status(404).json({
    success: false,
    message: 'Không tìm thấy thông tin trong danh sách thành viên CLB. Vui lòng kiểm tra lại MSSV hoặc liên hệ BTC.'
  });
});

/* ================= 3. REGISTRATIONS ================= */
app.post('/api/registrations', (req, res) => {
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

  const db = getDB();

  // Check duplicate registration
  const duplicate = db.registrations.find(r => r.mssv.toUpperCase() === mssv.trim().toUpperCase());
  if (duplicate) {
    return res.status(409).json({
      success: false,
      message: 'MSSV này đã được đăng ký trên hệ thống. Bạn có thể tra cứu thông tin vé tại mục Tra cứu vé.'
    });
  }

  const isAlumni = (role === 'ALUMNI');
  const totalRequired = isAlumni ? 449000 : 349000;
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
  const ticketCode = 'CSG17Y-' + mssv.trim().slice(-4) + '-' + Math.floor(100 + Math.random() * 900);

  const initialPaymentSubmission = {
    id: 'pay-' + Date.now(),
    phase: 1,
    amount: paidAmount,
    receiptUrl: receiptImage,
    submittedAt: new Date().toISOString(),
    status: 'PENDING'
  };

  const newReg = {
    id: regId,
    memberId: memberId || 'custom',
    fullName: sanitizeText(fullName),
    mssv: mssv.trim().toUpperCase(),
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
    isApproved100: false, // Requires Admin verification
    isPublicConsent: isPublicConsent !== false,
    receiptPhase1Url: receiptImage,
    receiptPhase2Url: null,
    ticketCode,
    ticketToken: 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
    createdAt: new Date().toISOString(),
    paymentHistory: [initialPaymentSubmission],
    verifiedBy: null,
    verifiedAt: null
  };

  db.registrations.unshift(newReg);

  // If wish is provided, save it
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
    db.wishes.unshift(wishObj);

    // Also spawn a character on the celebration stage
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
    db.characters.push(charObj);
  }

  saveDB(db);

  return res.json({
    success: true,
    data: newReg,
    message: 'Đăng ký thành công! Thông tin và biên lai đã được lưu trữ an toàn.'
  });
});

/* ================= 4. RETURNING USER LOOKUP ================= */
app.get('/api/registrations/lookup', (req, res) => {
  const { query } = req.query;
  if (!query) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp MSSV, SĐT hoặc Họ Tên.' });
  }

  const db = getDB();
  const qClean = String(query).trim().toLowerCase();
  const reg = db.registrations.find(r => 
    r.mssv.toLowerCase() === qClean || 
    r.personalPhone === qClean ||
    normalizeVN(r.fullName).includes(normalizeVN(qClean))
  );

  if (!reg) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ đăng ký nào trùng khớp.' });
  }

  return res.json({ success: true, data: reg });
});

/* ================= 5. BALANCE PAYMENT (PHASE 2) ================= */
app.post('/api/registrations/:id/balance-payment', (req, res) => {
  const { id } = req.params;
  const { receiptPhase2Url } = req.body;

  if (!receiptPhase2Url) {
    return res.status(400).json({ success: false, message: 'Vui lòng tải lên ảnh chụp biên lai đợt 2.' });
  }

  const db = getDB();
  const reg = db.registrations.find(r => r.id === id);
  if (!reg) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ đăng ký.' });
  }

  reg.receiptPhase2Url = receiptPhase2Url;
  const phase2Amount = reg.remainingAmount > 0 ? reg.remainingAmount : (reg.totalRequired - reg.paidAmount);
  
  if (!reg.paymentHistory) {
    reg.paymentHistory = [];
  }

  reg.paymentHistory.push({
    id: 'pay-' + Date.now(),
    phase: 2,
    amount: phase2Amount,
    receiptUrl: receiptPhase2Url,
    submittedAt: new Date().toISOString(),
    status: 'PENDING'
  });

  reg.status = 'PENDING';
  reg.paymentStatus = 'PENDING';

  saveDB(db);

  return res.json({
    success: true,
    data: reg,
    message: 'Đã cập nhật biên lai thanh toán phần còn lại! BTC sẽ kiểm tra và duyệt vé cho bạn.'
  });
});

/* ================= 6. PUBLIC WISHES & CHARACTERS ================= */
app.get('/api/wishes/public', (req, res) => {
  const db = getDB();
  const approved = (db.wishes || []).filter(w => w.moderationStatus === 'APPROVED' && w.isPublic);
  res.json({ success: true, data: approved });
});

app.get('/api/characters/stage', (req, res) => {
  const db = getDB();
  res.json({ success: true, data: db.characters || [] });
});

/* ================= 7. ADMIN ENDPOINTS ================= */
app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  if (pin === 'csg17y' || pin === '1717' || pin === 'btc') {
    return res.json({ success: true, token: 'btc-auth-token-17y', user: 'BTC_Admin' });
  }
  return res.status(401).json({ success: false, message: 'Mã PIN Ban Tổ Chức không chính xác.' });
});

app.get('/api/admin/registrations', (req, res) => {
  const db = getDB();
  res.json({
    success: true,
    data: db.registrations || [],
    wishes: db.wishes || [],
    auditLogs: db.auditLogs || []
  });
});

// Admin Approve Payment (Specific or 100%)
app.put('/api/admin/registrations/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, isApproved100, adminUser } = req.body;

  const db = getDB();
  const reg = db.registrations.find(r => r.id === id);
  if (!reg) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ.' });
  }

  if (status) {
    reg.status = status;
    reg.paymentStatus = status;
  }

  if (isApproved100 !== undefined) {
    reg.isApproved100 = Boolean(isApproved100);
    if (reg.isApproved100) {
      reg.status = 'FULLY_PAID';
      reg.paymentStatus = 'FULLY_PAID';
      reg.paidAmount = reg.totalRequired;
      reg.remainingAmount = 0;
      reg.verifiedBy = adminUser || 'BTC_Admin';
      reg.verifiedAt = new Date().toISOString();

      // Mark all payment submissions verified
      if (reg.paymentHistory) {
        reg.paymentHistory.forEach(p => {
          if (p.status === 'PENDING') {
            p.status = 'VERIFIED';
            p.verifiedBy = adminUser || 'BTC_Admin';
            p.verifiedAt = new Date().toISOString();
          }
        });
      }
    }
  }

  // Audit log
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: isApproved100 ? 'APPROVE_100' : 'STATUS_CHANGE',
    targetId: id,
    adminUser: adminUser || 'BTC_Admin',
    details: `Duyệt thanh toán cho ${reg.fullName} (${reg.mssv}) -> ${reg.status}`,
    timestamp: new Date().toISOString()
  });

  saveDB(db);

  return res.json({ success: true, data: reg, message: 'Đã cập nhật trạng thái thành công.' });
});

// Admin Reject Payment with Reason
app.put('/api/admin/registrations/:id/reject', (req, res) => {
  const { id } = req.params;
  const { rejectReason, adminUser } = req.body;

  const db = getDB();
  const reg = db.registrations.find(r => r.id === id);
  if (!reg) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy hồ sơ.' });
  }

  reg.status = 'REJECTED';
  reg.paymentStatus = 'REJECTED';
  reg.rejectReason = rejectReason || 'Biên lai chuyển khoản không hợp lệ hoặc không đối soát được.';
  reg.isApproved100 = false;

  // Mark latest submission rejected
  if (reg.paymentHistory && reg.paymentHistory.length > 0) {
    const latest = reg.paymentHistory[reg.paymentHistory.length - 1];
    latest.status = 'REJECTED';
    latest.rejectReason = reg.rejectReason;
  }

  // Audit log
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'REJECT_PAYMENT',
    targetId: id,
    adminUser: adminUser || 'BTC_Admin',
    details: `Từ chối biên lai của ${reg.fullName} (${reg.mssv}). Lý do: ${reg.rejectReason}`,
    timestamp: new Date().toISOString()
  });

  saveDB(db);

  return res.json({ success: true, data: reg, message: 'Đã từ chối biên lai và cập nhật trạng thái.' });
});

// Admin Ticket Check-in Endpoint
app.post('/api/admin/tickets/checkin', (req, res) => {
  const { tokenOrCode, adminUser } = req.body;
  if (!tokenOrCode || !tokenOrCode.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã vé hoặc mã token để check-in.' });
  }

  const db = getDB();
  const searchKey = tokenOrCode.trim().toUpperCase();

  const reg = db.registrations.find(r => 
    (r.ticketCode && r.ticketCode.toUpperCase() === searchKey) ||
    (r.ticketToken && r.ticketToken.toUpperCase() === searchKey) ||
    (r.mssv && r.mssv.toUpperCase() === searchKey) ||
    r.id === tokenOrCode.trim()
  );

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

  reg.isCheckedIn = true;
  reg.checkedInAt = new Date().toISOString();
  reg.checkedInBy = adminUser || 'BTC_Admin';

  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'CHECK_IN_TICKET',
    targetId: reg.id,
    adminUser: adminUser || 'BTC_Admin',
    details: `Soát vé thành công cho ${reg.fullName} (${reg.mssv}) - Mã vé ${reg.ticketCode}`,
    timestamp: new Date().toISOString()
  });

  saveDB(db);

  return res.json({
    success: true,
    data: reg,
    message: `Xác nhận check-in thành công! Chào mừng ${reg.honorific || ''} ${reg.fullName} đến với Đại tiệc Cóc Sài Gòn 17Y 🎉`
  });
});

// Google Sheets Sync Simulator
app.post('/api/admin/sheets/sync', (req, res) => {
  const db = getDB();
  const count = (db.members || []).length;
  
  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'SYNC_GOOGLE_SHEETS',
    targetId: 'google-sheets-whitelist',
    adminUser: 'BTC_Admin',
    details: `Đồng bộ danh sách mời từ Google Sheet thành công (${count} thành viên)`,
    timestamp: new Date().toISOString()
  });

  saveDB(db);

  return res.json({
    success: true,
    lastSynced: new Date().toISOString(),
    totalMembers: count,
    added: 0,
    updated: 0,
    message: `Đồng bộ thành công ${count} thành viên từ Google Sheet whitelist.`
  });
});

app.put('/api/admin/wishes/:id/moderate', (req, res) => {
  const { id } = req.params;
  const { moderationStatus, adminUser } = req.body; // 'APPROVED' | 'REJECTED'

  const db = getDB();
  const wish = db.wishes.find(w => w.id === id);
  if (!wish) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lời chúc.' });
  }

  wish.moderationStatus = moderationStatus;

  db.auditLogs.unshift({
    id: 'log-' + Date.now(),
    action: 'MODERATE_WISH',
    targetId: id,
    adminUser: adminUser || 'BTC_Admin',
    details: `Kiểm duyệt lời chúc của ${wish.authorName} -> ${moderationStatus}`,
    timestamp: new Date().toISOString()
  });

  saveDB(db);

  return res.json({ success: true, data: wish, message: 'Đã kiểm duyệt lời chúc thành công.' });
});

app.get('/api/admin/export', (req, res) => {
  const db = getDB();
  const headers = ['Mã ĐK,Họ Tên,MSSV,Vai Trò,Gmail,SĐT,SĐT Khẩn Cấp,Dị Ứng,Tổng Phí,Đã Đóng,Còn Thiếu,Trạng Thái,Đã Duyệt 100%,Mã Vé'];
  const rows = (db.registrations || []).map(r => 
    `"${r.id}","${r.fullName}","${r.mssv}","${r.role}","${r.gmail}","${r.personalPhone}","${r.emergencyPhone}","${(r.allergies || []).join('; ')}",${r.totalRequired},${r.paidAmount},${r.remainingAmount},"${r.paymentStatus || r.status}","${r.isApproved100 ? 'YES' : 'NO'}","${r.ticketCode}"`
  );

  const csv = '\uFEFF' + [headers, ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=CSG17Y_Registrations_${Date.now()}.csv`);
  res.send(csv);
});

export default app;
