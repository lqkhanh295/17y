import { MemberDirectoryItem, RegistrationRecord, MascotFrog } from '../types';
import { supabase } from './supabaseClient';

export const API_BASE = '/api';

// Safe fetch wrapper that handles non-JSON responses and network timeouts
async function safeFetchJson<T>(url: string, options?: RequestInit, timeoutMs = 7000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timer);
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return (await res.json()) as T;
    }
    return null;
  } catch {
    clearTimeout(timer);
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
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper: Deduplicate member candidates by MSSV
function deduplicateByMssv<T extends { mssv?: string; id?: string }>(list: T[]): T[] {
  const result: T[] = [];
  const seen = new Set<string>();
  for (const item of list || []) {
    const key = (item.mssv || item.id || '').toUpperCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

// Helper: Get Admin Authorization headers
export function getAdminAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('csg_admin_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export const apiClient = {
  // Helper: Upload image to Supabase Storage bucket 'receipts' with native high-speed blob decoding
  async uploadReceiptToStorage(fileOrDataUrl: string, prefix = 'receipt'): Promise<string> {
    if (!fileOrDataUrl || typeof fileOrDataUrl !== 'string') {
      return fileOrDataUrl;
    }

    // If already an HTTP/HTTPS URL (e.g. pre-uploaded in background), return immediately
    if (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://')) {
      return fileOrDataUrl;
    }

    if (!fileOrDataUrl.startsWith('data:image/')) {
      return fileOrDataUrl;
    }

    try {
      let blob: Blob;
      let contentType = 'image/jpeg';

      // Fast native conversion in browser C++ layer
      try {
        const res = await fetch(fileOrDataUrl);
        blob = await res.blob();
        contentType = blob.type || 'image/jpeg';
      } catch {
        const matches = fileOrDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches) return fileOrDataUrl;
        contentType = matches[1];
        const byteCharacters = atob(matches[2]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: contentType });
      }

      const ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const fileName = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const { data, error } = await supabase.storage.from('receipts').upload(fileName, blob, {
        contentType,
        upsert: false
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

  // 2. Member search (Auto-complete candidate search)
  async searchMembers(query: string): Promise<MemberDirectoryItem[]> {
    if (!query || !query.trim() || query.trim().length < 2) return [];

    const cleanQ = query.trim();
    const res = await safeFetchJson<{ success: boolean; data: MemberDirectoryItem[] }>(
      `${API_BASE}/members/search?q=${encodeURIComponent(cleanQ)}`
    );

    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }

    // Direct Supabase RPC failover
    try {
      const { data: candidates, error: rpcErr } = await (supabase as any).rpc('search_members', {
        query_text: cleanQ,
        max_limit: 8
      });

      if (!rpcErr && candidates && (candidates as any[]).length > 0) {
        return candidates as MemberDirectoryItem[];
      }

      // Fallback direct ilike
      const { data: directData } = await supabase
        .from('members')
        .select('id, mssv, fullName, role, honorific, generation, department')
        .or(`fullName.ilike.%${cleanQ}%,mssv.ilike.%${cleanQ}%`)
        .limit(8);

      if (directData && directData.length > 0) {
        return directData as unknown as MemberDirectoryItem[];
      }
    } catch (err) {
      console.warn('Direct search failover error:', err);
    }

    return [];
  },

  // 2b. Member verification (With failover to Supabase)
  async verifyMember(query: string): Promise<{
    success: boolean;
    multiple?: boolean;
    candidates?: MemberDirectoryItem[];
    data?: MemberDirectoryItem;
    hasExistingRegistration?: boolean;
    existingRecord?: RegistrationRecord;
    existingRegistrationId?: string;
    message?: string;
  }> {
    if (!query || !query.trim()) {
      throw new Error('Vui lòng cung cấp MSSV hoặc Họ tên.');
    }

    const res = await safeFetchJson<{
      success: boolean;
      multiple?: boolean;
      candidates?: MemberDirectoryItem[];
      data?: MemberDirectoryItem;
      hasExistingRegistration?: boolean;
      existingRecord?: RegistrationRecord;
      existingRegistrationId?: string;
      message?: string;
    }>(`${API_BASE}/members/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (res && res.success) return res;

    // Fallback: Direct Supabase directory lookup via search_members RPC
    try {
      const qNorm = normalizeVN(query);
      const qUpper = query.trim().toUpperCase();

      const { data: candidates, error: rpcErr } = await (supabase as any).rpc('search_members', {
        query_text: query.trim(),
        max_limit: 25
      });

      if (!rpcErr && candidates && (candidates as any[]).length > 0) {
        const candidateList = candidates as MemberDirectoryItem[];

        // 1a. Check exact MSSV match (always unique)
        const mssvMatch = candidateList.find(m => m.mssv && m.mssv.toUpperCase() === qUpper);
        if (mssvMatch) {
          const { data: existingRegs } = await supabase
            .from('registrations')
            .select('*')
            .ilike('mssv', mssvMatch.mssv || '');
          const existing = existingRegs?.find(r => r.status !== 'REJECTED') || null;

          return {
            success: true,
            multiple: false,
            data: mssvMatch,
            hasExistingRegistration: !!existing,
            existingRecord: existing as unknown as RegistrationRecord,
            existingRegistrationId: existing?.id || undefined,
            message: existing ? 'Hồ sơ này đã đăng ký vé.' : 'Xác thực MSSV thành công.'
          };
        }

        // 1b. Check multiple exact name matches (collision detection)
        const exactNameMatches = deduplicateByMssv(
          candidateList.filter(m => normalizeVN(m.fullName) === qNorm)
        );
        if (exactNameMatches.length > 1) {
          return {
            success: true,
            multiple: true,
            candidates: exactNameMatches,
            message: `Tìm thấy ${exactNameMatches.length} thành viên mang tên "${query.trim()}".`
          };
        }

        if (exactNameMatches.length === 1) {
          const singleMatch = exactNameMatches[0];
          const { data: existingRegs } = await supabase
            .from('registrations')
            .select('*')
            .ilike('mssv', singleMatch.mssv || '');
          const existing = existingRegs?.find(r => r.status !== 'REJECTED') || null;

          return {
            success: true,
            multiple: false,
            data: singleMatch,
            hasExistingRegistration: !!existing,
            existingRecord: existing as unknown as RegistrationRecord,
            existingRegistrationId: existing?.id || undefined,
            message: existing ? 'Hồ sơ này đã đăng ký vé.' : 'Xác thực danh tính thành công từ cơ sở dữ liệu.'
          };
        }

        // 1c. Partial name matches (e.g. user typed "Minh Đức" or "Khánh Linh")
        const partialMatches = deduplicateByMssv(
          candidateList.filter(m => {
            const normName = normalizeVN(m.fullName);
            return normName.includes(qNorm) || qNorm.split(' ').every(w => normName.includes(w));
          })
        );

        if (partialMatches.length > 1) {
          return {
            success: true,
            multiple: true,
            candidates: partialMatches,
            message: `Tìm thấy ${partialMatches.length} thành viên phù hợp với "${query.trim()}".`
          };
        }

        if (partialMatches.length === 1) {
          const singleMatch = partialMatches[0];
          const { data: existingRegs } = await supabase
            .from('registrations')
            .select('id, mssv')
            .ilike('mssv', singleMatch.mssv || '');
          const existing = existingRegs && existingRegs.length > 0 ? existingRegs[0] : null;

          return {
            success: true,
            multiple: false,
            data: singleMatch,
            hasExistingRegistration: !!existing,
            existingRegistrationId: existing?.id || undefined,
            message: 'Xác thực danh tính thành công từ cơ sở dữ liệu.'
          };
        }

        // 1d. Fallback single match
        const firstMatch = candidateList[0];
        return {
          success: true,
          multiple: false,
          data: firstMatch,
          hasExistingRegistration: false,
          message: 'Xác thực danh tính thành công.'
        };
      }

      // Fallback direct select
      const { data: members } = await supabase.from('members').select('*');
      if (members && members.length > 0) {
        const memberList = members as MemberDirectoryItem[];
        const mssvMatch = memberList.find(m => m.mssv && m.mssv.toUpperCase() === qUpper);
        if (mssvMatch) {
          return {
            success: true,
            multiple: false,
            data: mssvMatch,
            message: 'Xác thực MSSV thành công.'
          };
        }

        const exactNameMatches = deduplicateByMssv(
          memberList.filter(m => normalizeVN(m.fullName) === qNorm)
        );
        if (exactNameMatches.length > 1) {
          return {
            success: true,
            multiple: true,
            candidates: exactNameMatches,
            message: `Tìm thấy ${exactNameMatches.length} thành viên mang tên "${query.trim()}".`
          };
        }

        if (exactNameMatches.length === 1) {
          return {
            success: true,
            multiple: false,
            data: exactNameMatches[0],
            message: 'Xác thực danh tính thành công.'
          };
        }

        const partialMatches = deduplicateByMssv(
          memberList.filter(m => {
            const nameNorm = normalizeVN(m.fullName);
            return nameNorm.includes(qNorm) || qNorm.split(' ').every(w => nameNorm.includes(w));
          })
        );

        if (partialMatches.length > 1) {
          return {
            success: true,
            multiple: true,
            candidates: partialMatches,
            message: `Tìm thấy ${partialMatches.length} thành viên phù hợp với "${query.trim()}".`
          };
        }

        if (partialMatches.length === 1) {
          return {
            success: true,
            multiple: false,
            data: partialMatches[0],
            message: 'Xác thực danh tính thành công.'
          };
        }
      }
    } catch (err) {
      console.warn('Direct member verification failover error:', err);
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
      multiple: false,
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

    if (res && res.message) {
      throw new Error(res.message);
    }

    // Direct Supabase fallback registration
    const isHighTier = (data.role === 'ALUMNI' || data.role === 'GUEST');
    const totalRequired = data.totalRequired || (isHighTier ? 389000 : 349000);
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

    // Direct duplicate verification
    try {
      const gClean = (data.gmail || '').trim().toLowerCase();
      const pClean = (data.personalPhone || '').trim();
      const conditions: string[] = [`mssv.ilike.${mssvClean}`];
      if (gClean) conditions.push(`gmail.ilike.${gClean}`);
      if (pClean) conditions.push(`personalPhone.eq.${pClean}`);

      const { data: existingList } = await supabase
        .from('registrations')
        .select('*')
        .or(conditions.join(','));

      const validDup = existingList?.find((r: any) => r.status !== 'REJECTED');
      if (validDup) {
        throw new Error(`Hồ sơ với MSSV hoặc Email này đã được đăng ký trước đó (Mã vé: ${validDup.ticketCode || 'Chờ duyệt'}). Vui lòng vào mục Tra cứu vé để xem chi tiết.`);
      }
    } catch (checkErr: any) {
      if (checkErr.message?.includes('đã được đăng ký')) throw checkErr;
    }

    const regId = 'CSG17-' + Math.floor(100000 + Math.random() * 900000);
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
      role: data.role || (isHighTier ? (data.role === 'GUEST' ? 'GUEST' : 'ALUMNI') : 'ACTIVE'),
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
        authorName: newRecord.fullName.trim(),
        role: newRecord.role,
        content: data.wishes.trim(),
        isPublic: newRecord.isPublicConsent !== false,
        moderationStatus: 'APPROVED',
        createdAt: new Date().toISOString()
      };
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

      // High-speed parallel insert
      await Promise.allSettled([
        supabase.from('wishes').insert(wishObj),
        supabase.from('characters').insert(charObj)
      ]);
    }

    return newRecord;
  },

  // 4. Lookup registration for returning users
  async lookupRegistration(query: string) {
    if (!query || !query.trim()) throw new Error('Vui lòng nhập MSSV hoặc Số điện thoại.');

    const res = await safeFetchJson<{ success: boolean; found?: boolean; data: RegistrationRecord | null; message?: string }>(
      `${API_BASE}/registrations/lookup?query=${encodeURIComponent(query.trim())}`
    );

    if (res && res.success && res.data && res.found !== false) return res.data;

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
  async submitBalancePayment(id: string, receiptPhase2Url: string, mssv?: string, phone?: string) {
    const storedReceipt = await this.uploadReceiptToStorage(receiptPhase2Url, `rec_phase2_${id}`);

    const res = await safeFetchJson<{ success: boolean; data: RegistrationRecord; message?: string }>(
      `${API_BASE}/registrations/${id}/balance-payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiptPhase2Url: storedReceipt, mssv, phone })
      }
    );

    if (res && res.success && res.data) {
      return res.data;
    }

    if (res && res.message) {
      throw new Error(res.message);
    }
    throw new Error(res?.message || 'Không thể cập nhật biên lai thanh toán. Vui lòng kiểm tra lại.');
  },

  // 6. Public wishes & Stage characters
  async getPublicWishes() {
    const res = await safeFetchJson<{ success: boolean; data: any[] }>(`${API_BASE}/wishes/public`);
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) return res.data;

    try {
      const { data, error } = await supabase
        .from('wishes')
        .select('*')
        .eq('moderationStatus', 'APPROVED')
        .eq('isPublic', true)
        .order('createdAt', { ascending: false });

      if (!error && data && data.length > 0) return data;
    } catch (err) {
      console.warn('Supabase getPublicWishes error:', err);
    }

    return [];
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

  async getStageCharacters(): Promise<MascotFrog[]> {
    let rawChars: any[] = [];
    const res = await safeFetchJson<{ success: boolean; data: MascotFrog[] }>(`${API_BASE}/characters/stage`);
    if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
      rawChars = res.data;
    } else {
      try {
        const { data, error } = await supabase.from('characters').select('*');
        if (!error && data && data.length > 0) {
          rawChars = data;
        }
      } catch (err) {
        console.warn('Supabase getStageCharacters error:', err);
      }
    }

    // Also fetch public wishes to ensure no wish in the database is omitted from stage
    let publicWishes: any[] = [];
    try {
      publicWishes = await this.getPublicWishes();
    } catch {
      // fallback safe
    }

    const charMap = new Map<string, MascotFrog>();

    // 1. Process all raw characters from character table
    rawChars.forEach((c: any, idx: number) => {
      const id = String(c.id || `char-${idx}`);
      const displayName = c.name || 'Thành viên Cóc Sài Gòn';

      charMap.set(id, {
        id,
        name: displayName,
        role: (c.role === 'ALUMNI' ? 'ALUMNI' : 'ACTIVE') as any,
        wish: c.wish?.trim() || 'Mừng sinh nhật 17 năm Cóc Sài Gòn rực rỡ và bùng cháy!',
        x: typeof c.x === 'number' ? c.x : 14 + ((idx * 16) % 72),
        y: typeof c.y === 'number' ? c.y : 66 + ((idx * 6) % 16),
        scale: typeof c.scale === 'number' ? c.scale : 1,
        direction: c.direction === -1 ? -1 : 1,
        hearts: typeof c.hearts === 'number' ? c.hearts : 0
      });
    });

    // 2. Synthesize characters for any public wish not already represented
    publicWishes.forEach((w: any, idx: number) => {
      if (!w.content || !w.content.trim()) return;
      const cleanWish = w.content.trim();

      const alreadyHas = Array.from(charMap.values()).some(
        c => c.wish.trim() === cleanWish || (w.authorName && c.name.toLowerCase().includes(w.authorName.toLowerCase()))
      );

      if (!alreadyHas) {
        const charId = `char-w-${w.id || idx}`;
        charMap.set(charId, {
          id: charId,
          name: w.authorName || 'Thành viên CSG',
          role: (w.role === 'ALUMNI' ? 'ALUMNI' : 'ACTIVE') as any,
          wish: cleanWish,
          x: 14 + ((idx * 19) % 72),
          y: 67 + ((idx * 7) % 15),
          scale: 1,
          direction: idx % 2 === 0 ? 1 : -1,
          hearts: typeof w.hearts === 'number' ? w.hearts : 0
        });
      }
    });

    return Array.from(charMap.values());
  },

  // 6b. Heart / Clap Sync to Supabase Database
  async incrementWishHearts(targetId: string, amount = 1): Promise<number | null> {
    try {
      const { data, error } = await (supabase as any).rpc('increment_hearts', {
        target_id: targetId,
        amount
      });
      if (!error && typeof data === 'number') {
        return data;
      }
    } catch (err) {
      console.warn('incrementWishHearts RPC error:', err);
    }
    return null;
  },

  // 7. Admin API
  async adminLogin(pin: string) {
    if (!pin || !pin.trim()) {
      throw new Error('Vui lòng nhập mã PIN quản trị.');
    }

    const cleanPin = pin.trim();

    const res = await safeFetchJson<{ success: boolean; token?: string; user?: string; message?: string }>(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: cleanPin })
    });

    if (res && res.success && res.token) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('csg_admin_token', res.token);
      }
      return res;
    }

    throw new Error(res?.message || 'Mã PIN không chính xác. Quyền truy cập bị từ chối.');
  },

  async getAdminRegistrations() {
    const res = await safeFetchJson<{ success: boolean; data: RegistrationRecord[]; wishes: any[]; auditLogs: any[] }>(
      `${API_BASE}/admin/registrations`,
      { headers: getAdminAuthHeaders() }
    );
    if (res && res.success) return res;

    throw new Error('Không thể tải dữ liệu quản trị. Phiên đăng nhập có thể đã hết hạn.');
  },

  async updateRegistrationStatus(id: string, data: { status?: string; isApproved100?: boolean; action?: string; adminUser?: string; templateType?: string }) {
    const res = await safeFetchJson<{ success: boolean; data: RegistrationRecord; emailResult?: any; message?: string }>(
      `${API_BASE}/admin/registrations/${id}/status`,
      {
        method: 'PUT',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(data)
      }
    );
    if (res && res.success && res.data) return res.data;
    throw new Error(res?.message || 'Không thể cập nhật trạng thái thanh toán.');
  },

  async sendRegistrationEmail(id: string, options?: { templateType?: string; adminUser?: string }) {
    const res = await safeFetchJson<{ success: boolean; data: RegistrationRecord; emailResult?: any; message?: string }>(
      `${API_BASE}/admin/registrations/${id}/send-email`,
      {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify(options || {})
      }
    );
    if (res && res.success && res.data) return res.data;
    throw new Error(res?.message || 'Không thể gửi email xác nhận.');
  },

  async previewRegistrationEmail(id: string, templateType?: string) {
    const query = templateType ? `?templateType=${encodeURIComponent(templateType)}` : '';
    const res = await safeFetchJson<{ success: boolean; data: { subject: string; html: string; text: string; templateType: string } }>(
      `${API_BASE}/admin/registrations/${id}/preview-email${query}`,
      { headers: getAdminAuthHeaders() }
    );
    return res?.data || null;
  },

  async rejectRegistrationPayment(id: string, rejectReason: string, adminUser?: string) {
    const res = await safeFetchJson<{ success: boolean; data: RegistrationRecord }>(
      `${API_BASE}/admin/registrations/${id}/reject`,
      {
        method: 'PUT',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ rejectReason, adminUser })
      }
    );
    if (res && res.success && res.data) return res.data;
    throw new Error('Không thể từ chối biên lai thanh toán.');
  },

  async syncGoogleSheets(): Promise<{ success: boolean; message: string }> {
    const res = await safeFetchJson<{ success: boolean; message?: string }>(`${API_BASE}/admin/sheets/sync`, {
      method: 'POST',
      headers: getAdminAuthHeaders()
    });
    if (res) return { success: true, message: res.message || 'Đã đồng bộ.' };
    return { success: false, message: 'Đồng bộ thất bại.' };
  },

  async moderateWish(id: string, moderationStatus: 'APPROVED' | 'REJECTED', adminUser?: string) {
    const res = await safeFetchJson<{ success: boolean; data: any }>(`${API_BASE}/admin/wishes/${id}/moderate`, {
      method: 'PUT',
      headers: getAdminAuthHeaders(),
      body: JSON.stringify({ moderationStatus, adminUser })
    });
    if (res) return res.data;
    throw new Error('Không thể kiểm duyệt lời chúc.');
  },

  async checkInTicket(tokenOrCode: string, adminUser?: string): Promise<{ success: boolean; data: RegistrationRecord; message: string }> {
    const res = await safeFetchJson<{ success: boolean; data: RegistrationRecord; message?: string }>(
      `${API_BASE}/admin/tickets/checkin`,
      {
        method: 'POST',
        headers: getAdminAuthHeaders(),
        body: JSON.stringify({ tokenOrCode, adminUser })
      }
    );
    if (res && res.success && res.data) {
      return { success: true, data: res.data, message: res.message || 'Check-in thành công.' };
    }
    throw new Error(res?.message || 'Không thể xác nhận check-in vé.');
  }
};
