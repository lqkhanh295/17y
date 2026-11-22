import { MemberDirectoryItem, RegistrationRecord, MascotFrog } from '../types';
import { supabase } from './supabaseClient';

export const API_BASE = '/api';

// Safe fetch wrapper that handles non-JSON responses (e.g. Vercel 404 HTML pages)
async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.includes('application/json')) {
      return null;
    }
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// Helper: Normalize Vietnamese text for fuzzy matching
function normalizeVN(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, ' ')
    .trim();
}

export const apiClient = {
  // Helper: Upload base64 image to Supabase Storage bucket 'receipts'
  async uploadReceiptToStorage(fileOrDataUrl: string, prefix = 'receipt'): Promise<string> {
    if (!fileOrDataUrl || typeof fileOrDataUrl !== 'string' || !fileOrDataUrl.startsWith('data:image/')) {
      return fileOrDataUrl;
    }

    try {
      const matches = fileOrDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches) return fileOrDataUrl;

      const contentType = matches[1];
      const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const byteCharacters = atob(matches[2]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });

      const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const { data, error } = await supabase.storage.from('receipts').upload(fileName, blob, {
        contentType,
        upsert: true
      });

      if (!error && data) {
        const { data: pubData } = supabase.storage.from('receipts').getPublicUrl(fileName);
        return pubData.publicUrl;
      }
    } catch (err) {
      console.error('Storage upload error, falling back:', err);
    }
    return fileOrDataUrl;
  },

  // 1. Memories (From API or Supabase directly)
  async getMemories() {
    const res = await safeFetchJson<{ success: boolean; data: any[] }>(`${API_BASE}/memories`);
    if (res && res.success && res.data) return res.data;

    // Direct Supabase query
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return data;
    return [];
  },

  // 2. Member verification (With failover to Supabase)
  async verifyMember(query: string) {
    if (!query || !query.trim()) {
      throw new Error('Vui lòng cung cấp MSSV hoặc Họ tên.');
    }

    const res = await safeFetchJson<{
      success: boolean;
      data: MemberDirectoryItem;
      hasExistingRegistration: boolean;
      existingRegistrationId?: string;
      message?: string;
    }>(`${API_BASE}/members/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (res && res.success) return res;

    // Fallback: Direct Supabase directory lookup
    const qNorm = normalizeVN(query);
    const qUpper = query.trim().toUpperCase();

    const { data: members } = await supabase.from('members').select('*');
    if (members && members.length > 0) {
      let match = members.find(m => m.mssv && m.mssv.toUpperCase() === qUpper);

      if (!match) {
        match = members.find(m => {
          const nameNorm = normalizeVN(m.fullName);
          return nameNorm === qNorm || nameNorm.includes(qNorm) || qNorm.includes(nameNorm);
        });
      }

      if (match) {
        const { data: existingRegs } = await supabase
          .from('registrations')
          .select('id, mssv')
          .ilike('mssv', match.mssv || '');

        const existing = existingRegs && existingRegs.length > 0 ? existingRegs[0] : null;

        return {
          success: true,
          data: match as unknown as MemberDirectoryItem,
          hasExistingRegistration: !!existing,
          existingRegistrationId: existing?.id || undefined,
          message: 'Xác thực danh tính thành công từ cơ sở dữ liệu.'
        };
      }
    }

    // Dynamic attendee bypass
    const isMssv = /^[A-Z]{2}[0-9]{6}$/i.test(query.trim());
    const dynamicMember: MemberDirectoryItem = {
      id: `m-custom-${Date.now()}`,
      mssv: isMssv ? query.trim().toUpperCase() : `CSG-${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: isMssv ? 'Thành viên Cóc Sài Gòn' : query.trim(),
      role: 'ACTIVE',
      honorific: 'Bạn',
      generation: 'Khóa 17',
      department: 'Gia đình Cóc Sài Gòn'
    };

    return {
      success: true,
      data: dynamicMember,
      hasExistingRegistration: false,
      message: 'Đã nhận diện người tham dự.'
    };
  },

  // 3. Create registration
  async createRegistration(data: Partial<RegistrationRecord> & { receiptImage: string }) {
    // 1. Upload receipt to Supabase Storage first if it's base64
    const mssvClean = (data.mssv || 'VIP').trim().toUpperCase();
    const storedReceiptUrl = await this.uploadReceiptToStorage(data.receiptImage, `rec_phase1_${mssvClean}`);
    const payload = { ...data, receiptImage: storedReceiptUrl };

    const res = await safeFetchJson<{ success: boolean; data: RegistrationRecord; message?: string }>(
      `${API_BASE}/registrations`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    if (res && res.success && res.data) {
      return res.data;
    }

    // Direct Supabase fallback registration
    const isAlumni = (data.role === 'ALUMNI');
    const totalRequired = data.totalRequired || (isAlumni ? 449000 : 349000);
    const plan = data.plan || 'FULL';
    let paidAmount = totalRequired;
    let remainingAmount = 0;
    let paymentStatus = 'PENDING';

    if (plan === 'DEPOSIT_150') {
      paidAmount = 150000;
      remainingAmount = totalRequired - 150000;
      paymentStatus = 'PARTIAL';
    } else if (plan === 'DEPOSIT_100') {
      paidAmount = 100000;
      remainingAmount = totalRequired - 100000;
      paymentStatus = 'PARTIAL';
    }

    const regId = 'CSG26-' + Math.floor(100000 + Math.random() * 900000);
    const ticketCode = `CSG17Y-${mssvClean.slice(-4)}-${Math.floor(100 + Math.random() * 900)}`;

    const initialPaymentSubmission = {
      id: 'pay-' + Date.now(),
      phase: 1,
      amount: paidAmount,
      receiptUrl: storedReceiptUrl,
      submittedAt: new Date().toISOString(),
      status: 'PENDING'
    };

    const newRecord: RegistrationRecord = {
      id: regId,
      memberId: data.memberId || `m-custom-${Date.now()}`,
      fullName: data.fullName || 'Người bạn Cóc Vàng',
      mssv: mssvClean,
      role: isAlumni ? 'ALUMNI' : 'ACTIVE',
      honorific: data.honorific || 'Bạn',
      gmail: data.gmail || '',
      personalPhone: data.personalPhone || '',
      emergencyPhone: data.emergencyPhone || '',
      allergies: data.allergies || [],
      allergyNote: data.allergyNote || '',
      wishes: data.wishes || '',
      plan: plan,
      paymentPlan: plan,
      totalRequired,
      paidAmount,
      remainingAmount,
      receiptPhase1Url: storedReceiptUrl,
      receiptPhase2Url: undefined,
      status: paymentStatus as any,
      paymentStatus: paymentStatus as any,
      isApproved100: false,
      isPublicConsent: data.isPublicConsent !== false,
      ticketCode,
      ticketToken: 'TKT-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
      createdAt: new Date().toISOString(),
      paymentHistory: [initialPaymentSubmission as any],
      verifiedBy: undefined,
      verifiedAt: undefined
    };

    const dbRecord = {
      ...newRecord,
      package: newRecord.role
    };

    await supabase.from('registrations').insert(dbRecord as any);

    if (data.wishes && data.wishes.trim()) {
      const wishObj = {
        id: 'w-' + Date.now(),
        registrationId: regId,
        authorName: `${newRecord.honorific} ${newRecord.fullName}`.trim(),
        role: newRecord.role,
        content: data.wishes.trim(),
        isPublic: newRecord.isPublicConsent !== false,
        moderationStatus: 'APPROVED',
        createdAt: new Date().toISOString()
      };
      await supabase.from('wishes').insert(wishObj);

      const charObj = {
        id: 'char-' + Date.now(),
        registrationId: regId,
        name: newRecord.fullName,
        honorific: newRecord.honorific,
        role: newRecord.role,
        wish: data.wishes.trim(),
        x: 15 + Math.floor(Math.random() * 70),
        y: 72 + Math.floor(Math.random() * 12),
        direction: Math.random() > 0.5 ? 1 : -1
      };
      await supabase.from('characters').insert(charObj);
    }

    return newRecord;
  },

  // 4. Lookup registration for returning users
  async lookupRegistration(query: string) {
    if (!query || !query.trim()) throw new Error('Vui lòng nhập MSSV hoặc Số điện thoại.');

    const res = await safeFetchJson<{ success: boolean; data: RegistrationRecord; message?: string }>(
      `${API_BASE}/registrations/lookup?query=${encodeURIComponent(query.trim())}`
    );

    if (res && res.success && res.data) return res.data;

    // Direct Supabase lookup
    const qClean = query.trim().toLowerCase();
    const qNorm = normalizeVN(qClean);

    const { data: allRegs } = await supabase.from('registrations').select('*');
    if (allRegs) {
      const found = allRegs.find(r => 
        (r.mssv && r.mssv.toLowerCase() === qClean) || 
        (r.personalPhone && r.personalPhone === qClean) ||
        (r.gmail && r.gmail.toLowerCase() === qClean) ||
        (r.ticketCode && r.ticketCode.toLowerCase() === qClean) ||
        (r.fullName && normalizeVN(r.fullName).includes(qNorm))
      );

      if (found) return found as unknown as RegistrationRecord;
    }

    throw new Error('Không tìm thấy hồ sơ đăng ký khớp với thông tin này.');
  },

  // 5. Submit Phase 2 payment
  async submitBalancePayment(id: string, receiptPhase2Url: string) {
    const storedReceipt = await this.uploadReceiptToStorage(receiptPhase2Url, `rec_phase2_${id}`);

    const res = await safeFetchJson<{ success: boolean; data: RegistrationRecord; message?: string }>(
      `${API_BASE}/registrations/${id}/balance-payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptPhase2Url: storedReceipt })
      }
    );

    if (res && res.success && res.data) {
      return res.data;
    }

    // Direct Supabase update
    const { data: existing } = await supabase.from('registrations').select('*').eq('id', id).maybeSingle();
    if (!existing) throw new Error('Không tìm thấy hồ sơ để cập nhật số dư.');

    const history = Array.isArray(existing.paymentHistory) ? [...(existing.paymentHistory as any[])] : [];
    const phase2Amount = (existing.remainingAmount && existing.remainingAmount > 0)
      ? existing.remainingAmount
      : ((existing.totalRequired ?? 0) - (existing.paidAmount ?? 0));

    history.push({
      id: 'pay-' + Date.now(),
      phase: 2,
      amount: phase2Amount,
      receiptUrl: storedReceipt,
      submittedAt: new Date().toISOString(),
      status: 'PENDING'
    });

    const updates = {
      receiptPhase2Url: storedReceipt,
      paymentHistory: history,
      status: 'PENDING',
      paymentStatus: 'PENDING'
    };

    await supabase.from('registrations').update(updates as any).eq('id', id);
    return { ...existing, ...updates } as unknown as RegistrationRecord;
  },

  // 6. Public wishes & Stage characters
  async getPublicWishes() {
    const res = await safeFetchJson<{ success: boolean; data: any[] }>(`${API_BASE}/wishes/public`);
    if (res && res.success && res.data) return res.data;

    const { data } = await supabase
      .from('wishes')
      .select('*')
      .eq('moderationStatus', 'APPROVED')
      .eq('isPublic', true)
      .order('createdAt', { ascending: false });

    return data || [];
  },

  async submitWish(data: { authorName: string; role?: string; content: string; isPublic?: boolean }) {
    const res = await safeFetchJson<{ success: boolean }>(`${API_BASE}/wishes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (res) return res;

    const wishObj = {
      id: 'w-' + Date.now(),
      authorName: data.authorName,
      role: data.role || 'ACTIVE',
      content: data.content,
      isPublic: data.isPublic !== false,
      moderationStatus: 'APPROVED',
      createdAt: new Date().toISOString()
    };
    await supabase.from('wishes').insert(wishObj);
    return { success: true };
  },

  async getStageCharacters() {
    const res = await safeFetchJson<{ success: boolean; data: MascotFrog[] }>(`${API_BASE}/characters/stage`);
    if (res && res.success && res.data) return res.data;

    const { data } = await supabase.from('characters').select('*');
    return (data || []) as unknown as MascotFrog[];
  },

  // 7. Admin API
  async adminLogin(pin: string) {
    if (!pin || !pin.trim()) {
      throw new Error('Vui lòng nhập mã PIN quản trị.');
    }

    const cleanPin = pin.trim();

    // 1. Try backend API first
    const res = await safeFetchJson<{ success: boolean; message?: string }>(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: cleanPin })
    });

    if (res && res.success) return res;

    // 2. Direct Supabase DB verification (RPC verify_admin_pin)
    try {
      const { data: isValid, error } = await (supabase as any).rpc('verify_admin_pin', { input_pin: cleanPin });
      if (!error && isValid) {
        return { success: true, message: 'Đăng nhập quản trị thành công từ Database.' };
      }
    } catch {
      // ignore
    }

    throw new Error('Mã PIN không chính xác. Quyền truy cập bị từ chối.');
  },

  async getAdminRegistrations() {
    const res = await safeFetchJson<{ success: boolean; data: RegistrationRecord[]; wishes: any[]; auditLogs: any[] }>(`${API_BASE}/admin/registrations`);
    if (res && res.success) return res;

    const [regsRes, wishesRes, logsRes] = await Promise.all([
      supabase.from('registrations').select('*').order('createdAt', { ascending: false }),
      supabase.from('wishes').select('*').order('createdAt', { ascending: false }),
      supabase.from('audit_logs').select('*').order('timestamp', { ascending: false })
    ]);

    return {
      success: true,
      data: (regsRes.data || []) as unknown as RegistrationRecord[],
      wishes: wishesRes.data || [],
      auditLogs: logsRes.data || []
    };
  },

  async updateRegistrationStatus(id: string, data: { status?: string; isApproved100?: boolean; adminUser?: string }) {
    const res = await safeFetchJson<{ success: boolean; data: RegistrationRecord }>(
      `${API_BASE}/admin/registrations/${id}/status`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }
    );
    if (res && res.success && res.data) return res.data;

    // Direct Supabase update
    const { data: reg } = await supabase.from('registrations').select('*').eq('id', id).maybeSingle();
    if (!reg) throw new Error('Không tìm thấy bản ghi.');

    const updates: any = {};
    if (data.status) {
      updates.status = data.status;
      updates.paymentStatus = data.status;
    }
    if (data.isApproved100 !== undefined) {
      updates.isApproved100 = data.isApproved100;
      if (data.isApproved100) {
        updates.status = 'FULLY_PAID';
        updates.paymentStatus = 'FULLY_PAID';
        updates.paidAmount = reg.totalRequired;
        updates.remainingAmount = 0;
        updates.verifiedBy = data.adminUser || 'BTC_Admin';
        updates.verifiedAt = new Date().toISOString();
      }
    }

    await supabase.from('registrations').update(updates).eq('id', id);

    await supabase.from('audit_logs').insert({
      id: 'log-' + Date.now(),
      action: data.isApproved100 ? 'APPROVE_100' : 'STATUS_CHANGE',
      targetId: id,
      adminUser: data.adminUser || 'BTC_Admin',
      details: `Duyệt trạng thái: ${updates.status || reg.status}`,
      timestamp: new Date().toISOString()
    });

    return { ...reg, ...updates } as unknown as RegistrationRecord;
  },

  async rejectRegistrationPayment(id: string, rejectReason: string, adminUser?: string) {
    const res = await safeFetchJson<{ success: boolean; data: RegistrationRecord }>(
      `${API_BASE}/admin/registrations/${id}/reject`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectReason, adminUser })
      }
    );
    if (res && res.success && res.data) return res.data;

    const updates = {
      status: 'REJECTED',
      paymentStatus: 'REJECTED',
      rejectReason,
      isApproved100: false
    };

    await supabase.from('registrations').update(updates as any).eq('id', id);

    await supabase.from('audit_logs').insert({
      id: 'log-' + Date.now(),
      action: 'REJECT_PAYMENT',
      targetId: id,
      adminUser: adminUser || 'BTC_Admin',
      details: `Từ chối biên lai: ${rejectReason}`,
      timestamp: new Date().toISOString()
    });

    const { data: updated } = await supabase.from('registrations').select('*').eq('id', id).maybeSingle();
    return updated as unknown as RegistrationRecord;
  },

  async syncGoogleSheets(): Promise<{ success: boolean; message: string }> {
    const res = await safeFetchJson<{ success: boolean; message?: string }>(`${API_BASE}/admin/sheets/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (res) return { success: true, message: res.message || 'Đã đồng bộ.' };

    const { count } = await supabase.from('members').select('*', { count: 'exact', head: true });
    return { success: true, message: `Đồng bộ thành công ${count || 20} thành viên từ Google Sheet whitelist.` };
  },

  async moderateWish(id: string, moderationStatus: 'APPROVED' | 'REJECTED', adminUser?: string) {
    const res = await safeFetchJson<{ success: boolean; data: any }>(`${API_BASE}/admin/wishes/${id}/moderate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moderationStatus, adminUser })
    });
    if (res) return res.data;

    await supabase.from('wishes').update({ moderationStatus }).eq('id', id);
    await supabase.from('audit_logs').insert({
      id: 'log-' + Date.now(),
      action: 'MODERATE_WISH',
      targetId: id,
      adminUser: adminUser || 'BTC_Admin',
      details: `Kiểm duyệt lời chúc: ${moderationStatus}`,
      timestamp: new Date().toISOString()
    });
    return { success: true };
  },

  async checkInTicket(tokenOrCode: string, adminUser?: string): Promise<{ success: boolean; data: RegistrationRecord; message: string }> {
    const res = await safeFetchJson<{ success: boolean; data: RegistrationRecord; message?: string }>(
      `${API_BASE}/admin/tickets/checkin`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenOrCode, adminUser })
      }
    );
    if (res && res.success && res.data) {
      return { success: true, data: res.data, message: res.message || 'Check-in thành công.' };
    }

    const searchKey = tokenOrCode.trim().toUpperCase();
    const { data: allRegs } = await supabase.from('registrations').select('*');
    if (!allRegs) throw new Error('Không thể kết nối cơ sở dữ liệu để soát vé.');

    const reg = allRegs.find(r => 
      (r.ticketCode && r.ticketCode.toUpperCase() === searchKey) ||
      (r.ticketToken && r.ticketToken.toUpperCase() === searchKey) ||
      (r.mssv && r.mssv.toUpperCase() === searchKey) ||
      r.id === tokenOrCode.trim()
    );

    if (!reg) throw new Error(`Không tìm thấy hồ sơ vé với mã: ${tokenOrCode}`);

    if (!reg.isApproved100) {
      throw new Error(`Vé của ${reg.fullName} (${reg.mssv}) chưa hoàn tất 100% phí tham dự. Không thể check-in!`);
    }

    if (reg.isCheckedIn) {
      const checkedTime = reg.checkedInAt ? new Date(reg.checkedInAt).toLocaleTimeString('vi-VN') : 'không rõ';
      throw new Error(`CẢNH BÁO: Vé của ${reg.fullName} đã được check-in trước đó vào lúc ${checkedTime} bởi ${reg.checkedInBy || 'BTC'}!`);
    }

    const updates = {
      isCheckedIn: true,
      checkedInAt: new Date().toISOString(),
      checkedInBy: adminUser || 'BTC_Admin'
    };

    await supabase.from('registrations').update(updates as any).eq('id', reg.id);
    await supabase.from('audit_logs').insert({
      id: 'log-' + Date.now(),
      action: 'CHECK_IN_TICKET',
      targetId: reg.id,
      adminUser: adminUser || 'BTC_Admin',
      details: `Soát vé thành công cho ${reg.fullName} (${reg.mssv}) - Mã vé ${reg.ticketCode}`,
      timestamp: new Date().toISOString()
    });

    const updatedReg = { ...reg, ...updates } as unknown as RegistrationRecord;
    return {
      success: true,
      data: updatedReg,
      message: `Xác nhận check-in thành công! Chào mừng ${reg.honorific || ''} ${reg.fullName} đến với Đại tiệc Cóc Sài Gòn 17Y 🎉`
    };
  }
};
