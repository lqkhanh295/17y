import { MemberDirectoryItem, RegistrationRecord, MascotFrog } from '../types';

export const API_BASE = '/api';

export const apiClient = {
  // 1. Memories
  async getMemories() {
    const res = await fetch(`${API_BASE}/memories`);
    if (!res.ok) throw new Error('Không thể tải kỷ niệm.');
    const json = await res.json();
    return json.data;
  },

  // 2. Member verification
  async verifyMember(query: string) {
    const res = await fetch(`${API_BASE}/members/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Xác thực thất bại.');
    return json;
  },

  // 3. Create registration
  async createRegistration(data: Partial<RegistrationRecord> & { receiptImage: string }) {
    const res = await fetch(`${API_BASE}/registrations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Lỗi khi gửi đăng ký.');
    return json.data as RegistrationRecord;
  },

  // 4. Lookup registration for returning users
  async lookupRegistration(query: string) {
    const res = await fetch(`${API_BASE}/registrations/lookup?query=${encodeURIComponent(query)}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Không tìm thấy hồ sơ.');
    return json.data as RegistrationRecord;
  },

  // 5. Submit Phase 2 payment
  async submitBalancePayment(id: string, receiptPhase2Url: string) {
    const res = await fetch(`${API_BASE}/registrations/${id}/balance-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiptPhase2Url })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Lỗi khi cập nhật biên lai.');
    return json.data as RegistrationRecord;
  },

  // 6. Public wishes & Stage characters
  async getPublicWishes() {
    const res = await fetch(`${API_BASE}/wishes/public`);
    const json = await res.json();
    return json.data;
  },

  async getStageCharacters() {
    const res = await fetch(`${API_BASE}/characters/stage`);
    const json = await res.json();
    return json.data as MascotFrog[];
  },

  // 7. Admin API
  async adminLogin(pin: string) {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Mã PIN sai.');
    return json;
  },

  async getAdminRegistrations() {
    const res = await fetch(`${API_BASE}/admin/registrations`);
    const json = await res.json();
    return json;
  },

  async updateRegistrationStatus(id: string, data: { status?: string; isApproved100?: boolean; adminUser?: string }) {
    const res = await fetch(`${API_BASE}/admin/registrations/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Cập nhật thất bại.');
    return json.data as RegistrationRecord;
  },

  async rejectRegistrationPayment(id: string, rejectReason: string, adminUser?: string) {
    const res = await fetch(`${API_BASE}/admin/registrations/${id}/reject`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rejectReason, adminUser })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Từ chối thất bại.');
    return json.data as RegistrationRecord;
  },

  async syncGoogleSheets() {
    const res = await fetch(`${API_BASE}/admin/sheets/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Đồng bộ thất bại.');
    return json;
  },

  async moderateWish(id: string, moderationStatus: 'APPROVED' | 'REJECTED', adminUser?: string) {
    const res = await fetch(`${API_BASE}/admin/wishes/${id}/moderate`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ moderationStatus, adminUser })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Kiểm duyệt thất bại.');
    return json.data;
  },

  async checkInTicket(tokenOrCode: string, adminUser?: string) {
    const res = await fetch(`${API_BASE}/admin/tickets/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenOrCode, adminUser })
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Soát vé thất bại.');
    return json;
  }
};
