import React, { useState, useEffect } from 'react';
import { 
  CloseIcon, CheckIcon, CheckCircleIcon, ClockIcon, EyeIcon, DownloadIcon, SearchIcon, 
  FilterIcon, CalendarIcon, MailIcon, ShieldCheckIcon, QrCodeIcon, AlertTriangleIcon, 
  ExternalLinkIcon, FileSpreadsheetIcon, LockIcon, ArrowRightIcon, ArrowUpRightIcon, MessageSquareIcon,
  ThumbsUpIcon, ThumbsDownIcon, RefreshIcon, ZoomInIcon, ZoomOutIcon, 
  DatabaseIcon, UserCheckIcon, CheckSquareIcon, LayersIcon, AlertCircleIcon
} from 'naive-icons';
import { RegistrationRecord } from '../types';
import { apiClient } from '../services/apiClient';
import { EmailPreviewModal } from './EmailPreviewModal';
import { createGoogleCalendarUrl } from '../utils/calendarUtils';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  registrations: RegistrationRecord[];
  onApprove100: (id: string) => void;
  onSimulateEmailDispatch?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  registrations: initialRegistrations,
  onApprove100,
  onSimulateEmailDispatch: _onSimulateEmailDispatch
}) => {
  // Authentication PIN for BTC
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Navigation Module
  const [activeModule, setActiveModule] = useState<
    'OVERVIEW' | 'REGISTRATIONS' | 'PAYMENT_REVIEW' | 'TICKETS' | 'WISHES' | 'SHEETS_SYNC'
  >('OVERVIEW');

  // Live registrations list from API
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>(initialRegistrations);
  const [publicWishes, setPublicWishes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtering & Search for Registrations
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ACTIVE' | 'ALUMNI' | 'GUEST'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'DEPOSIT_ONLY'>('ALL');

  // Payment Review Center State
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotate, setImageRotate] = useState(0);
  const [rejectReason, setRejectReason] = useState('Không đọc được nội dung/mã giao dịch');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Google Sheet Sync state
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // Google Calendar Auto-open State (Mặc định FALSE để không nhảy tab khi duyệt, hệ thống tự gửi file lịch invite.ics qua email)
  const [autoOpenCalendar, setAutoOpenCalendar] = useState<boolean>(() => {
    try {
      return localStorage.getItem('csg_admin_auto_open_cal') === 'true';
    } catch {
      return false;
    }
  });

  const handleToggleAutoOpenCalendar = (checked: boolean) => {
    setAutoOpenCalendar(checked);
    try {
      localStorage.setItem('csg_admin_auto_open_cal', String(checked));
    } catch {}
  };

  // On-Site Check-in Desk State
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInResult, setCheckInResult] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
    record?: RegistrationRecord;
  } | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  // Email Preview & Dispatch States
  const [emailPreviewRecord, setEmailPreviewRecord] = useState<RegistrationRecord | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Fetch live registrations & wishes from backend API
  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const regRes = await apiClient.getAdminRegistrations();
      if (regRes && regRes.data) {
        setRegistrations(regRes.data);
      }
      const wishRes = await apiClient.getPublicWishes();
      if (wishRes) {
        setPublicWishes(wishRes);
      }
    } catch (err) {
      console.warn('Fallback to local state:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Restore session token if previously logged in
  useEffect(() => {
    if (isOpen) {
      const token = sessionStorage.getItem('csg_admin_token');
      if (token) {
        setIsAuthenticated(true);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    sessionStorage.removeItem('csg_admin_token');
    setIsAuthenticated(false);
    setPin('');
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setAuthError('Vui lòng nhập mã PIN xác thực Ban Tổ Chức.');
      return;
    }
    setAuthError('');
    setIsLoading(true);
    try {
      const res = await apiClient.adminLogin(pin.trim());
      if (res && res.success) {
        setIsAuthenticated(true);
        setAuthError('');
      } else {
        setAuthError(res.message || 'Mã PIN xác thực không chính xác.');
      }
    } catch (err: unknown) {
      const error = err as Error;
      setAuthError(error.message || 'Mã PIN xác thực không chính xác.');
    } finally {
      setIsLoading(false);
    }
  };

  // Stats calculation
  const totalReg = registrations.length;
  const totalApproved = registrations.filter(r => r.isApproved100).length;
  const totalMembers = registrations.filter(r => r.role === 'ACTIVE').length;
  const totalAlumni = registrations.filter(r => r.role === 'ALUMNI').length;
  const pendingReviewList = registrations.filter(r => !r.isApproved100 && r.status !== 'REJECTED' && (r.receiptPhase1Url || r.receiptPhase2Url));
  const totalPending = pendingReviewList.length;
  const totalRejected = registrations.filter(r => r.status === 'REJECTED').length;
  const totalRevenue = registrations.reduce((sum, r) => sum + r.paidAmount, 0);
  const totalExpected = registrations.reduce((sum, r) => sum + r.totalRequired, 0);
  const totalOutstanding = Math.max(0, totalExpected - totalRevenue);

  // Active reviewing record
  const currentReviewRecord = registrations.find(r => r.id === (selectedReviewId || pendingReviewList[0]?.id));

  // Handle Approve Deposit (150.000đ)
  const handleApproveDeposit = async (id: string) => {
    const reg = registrations.find(r => r.id === id);
    if (!reg) return;
    setIsLoading(true);
    try {
      const isHighTier = reg.role === 'ALUMNI' || reg.role === 'GUEST';
      const template = isHighTier ? 'DEPOSIT_ALUMNI' : 'DEPOSIT_ACTIVE';
      await apiClient.updateRegistrationStatus(id, {
        action: 'APPROVE_DEPOSIT',
        status: 'DEPOSITED',
        templateType: template,
        adminUser: 'BTC_Admin'
      });

      const total = reg.totalRequired || (isHighTier ? 389000 : 349000);
      const remaining = Math.max(0, total - 150000);

      setRegistrations(prev => prev.map(r => r.id === id ? {
        ...r,
        status: 'DEPOSITED',
        paymentStatus: 'DEPOSITED',
        paidAmount: 150000,
        totalRequired: total,
        remainingAmount: remaining,
        isApproved100: false,
        isEmailSent: true,
        emailSentAt: new Date().toISOString(),
        lastEmailTemplate: template,
        verifiedBy: 'BTC_Admin',
        verifiedAt: new Date().toISOString()
      } : r));

      // Open Google Calendar if enabled
      if (autoOpenCalendar) {
        const calUrl = createGoogleCalendarUrl(reg);
        window.open(calUrl, '_blank');
      }

      const roleLabel = reg.role === 'GUEST' ? 'Khách mời - 389k' : (reg.role === 'ALUMNI' ? 'Alumni - 389k' : 'Active - 349k');
      showToast(`✓ Đã duyệt đặt cọc 150k và gửi email xác nhận (${roleLabel}) tới ${reg.gmail}!`, 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showToast('Lỗi duyệt đặt cọc: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Approve 100%
  const handleApprove100 = async (id: string) => {
    const reg = registrations.find(r => r.id === id);
    if (!reg) return;
    setIsLoading(true);
    try {
      await apiClient.updateRegistrationStatus(id, {
        isApproved100: true,
        action: 'APPROVE_100',
        status: 'FULLY_PAID',
        templateType: 'FULL_100',
        adminUser: 'BTC_Admin'
      });
      onApprove100(id);
      setRegistrations(prev => prev.map(r => r.id === id ? {
        ...r,
        isApproved100: true,
        status: 'FULLY_PAID',
        paymentStatus: 'FULLY_PAID',
        paidAmount: r.totalRequired || ((r.role === 'ALUMNI' || r.role === 'GUEST') ? 389000 : 349000),
        remainingAmount: 0,
        isEmailSent: true,
        emailSentAt: new Date().toISOString(),
        lastEmailTemplate: 'FULL_100',
        approvedBy: 'BTC_Admin',
        approvedAt: new Date().toISOString(),
        verifiedBy: 'BTC_Admin',
        verifiedAt: new Date().toISOString()
      } : r));

      // Open Google Calendar if enabled
      if (autoOpenCalendar) {
        const calUrl = createGoogleCalendarUrl(reg);
        window.open(calUrl, '_blank');
      }

      showToast(`✓ Đã phê duyệt 100% & đồng bộ sự kiện Google Calendar tới ${reg.gmail}!`, 'success');
    } catch (err: unknown) {
      const error = err as Error;
      showToast('Lỗi duyệt 100%: ' + error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Send/Resend Email manually
  const handleSendEmail = async (id: string, templateType: string) => {
    const reg = registrations.find(r => r.id === id);
    if (!reg) return;
    setIsSendingEmail(true);
    try {
      await apiClient.sendRegistrationEmail(id, { templateType, adminUser: 'BTC_Admin' });
      setRegistrations(prev => prev.map(r => r.id === id ? {
        ...r,
        isEmailSent: true,
        emailSentAt: new Date().toISOString(),
        lastEmailTemplate: templateType
      } : r));
      showToast(`✓ Đã gửi email (${templateType}) thành công tới ${reg.gmail}!`, 'success');
      setEmailPreviewRecord(null);
    } catch (err: unknown) {
      const error = err as Error;
      showToast('Lỗi gửi email: ' + error.message, 'error');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Handle Reject
  const handleReject = async (id: string) => {
    try {
      await apiClient.rejectRegistrationPayment(id, rejectReason, 'BTC_Admin');
      setRegistrations(prev => prev.map(r => r.id === id ? {
        ...r,
        isApproved100: false,
        status: 'REJECTED',
        rejectReason
      } : r));
      setShowRejectModal(false);
    } catch (err: unknown) {
      const error = err as Error;
      setToast({ type: 'error', message: 'Lỗi từ chối: ' + error.message });
    }
  };

  // On-site Ticket Check-in
  const handleCheckInTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkInCode.trim()) return;

    setIsCheckingIn(true);
    setCheckInResult(null);

    try {
      const res = await apiClient.checkInTicket(checkInCode, 'BTC_Admin');
      if (res.success && res.data) {
        setCheckInResult({
          type: 'success',
          message: res.message,
          record: res.data
        });
        setRegistrations(prev => prev.map(r => r.id === res.data.id ? res.data : r));
        setCheckInCode('');
      }
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message.includes('CẢNH BÁO')) {
        setCheckInResult({
          type: 'warning',
          message: error.message
        });
      } else {
        setCheckInResult({
          type: 'error',
          message: error.message || 'Mã vé không hợp lệ hoặc chưa hoàn tất 100%.'
        });
      }
    } finally {
      setIsCheckingIn(false);
    }
  };

  // Google Sheets Sync
  const handleSyncSheets = async () => {
    setIsSyncingSheets(true);
    try {
      const res = await apiClient.syncGoogleSheets();
      setSyncResult(res.message);
      loadAdminData();
    } catch (err: unknown) {
      const error = err as Error;
      setToast({ type: 'error', message: 'Lỗi đồng bộ: ' + error.message });
    } finally {
      setIsSyncingSheets(false);
    }
  };

  // Moderate Wish
  const handleModerateWish = async (wishId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await apiClient.moderateWish(wishId, status, 'BTC_Admin');
      setPublicWishes(prev => prev.map(w => w.id === wishId ? { ...w, moderationStatus: status } : w));
    } catch (err: unknown) {
      const error = err as Error;
      setToast({ type: 'error', message: 'Lỗi kiểm duyệt: ' + error.message });
    }
  };

  // Filter records
  const filtered = registrations.filter(r => {
    const matchesSearch = 
      r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.mssv.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.gmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.personalPhone.includes(searchTerm);

    const matchesRole = roleFilter === 'ALL' || r.role === roleFilter;

    let matchesStatus = true;
    if (statusFilter === 'APPROVED') matchesStatus = r.isApproved100;
    if (statusFilter === 'DEPOSIT_ONLY') matchesStatus = (r.status === 'DEPOSITED' || r.status === 'PARTIAL') && !r.isApproved100;
    if (statusFilter === 'PENDING') matchesStatus = !r.isApproved100 && r.status !== 'REJECTED';
    if (statusFilter === 'REJECTED') matchesStatus = r.status === 'REJECTED';

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Mã ĐK,Họ Tên,MSSV,Vai Trò,Gmail,SĐT,SĐT Khẩn Cấp,Dị Ứng,Gói Đăng Ký,Tổng Phí,Đã Đóng,Còn Lại,Đã Duyệt 100%,Mã Vé,Ngày Tạo'];
    const rows = registrations.map(r => 
      `"${r.id}","${r.fullName}","${r.mssv}","${r.role}","${r.gmail}","${r.personalPhone}","${r.emergencyPhone}","${r.allergies?.join('; ') || ''}","${r.plan}",${r.totalRequired},${r.paidAmount},${r.remainingAmount},"${r.isApproved100 ? 'YES' : 'NO'}","${r.ticketCode}","${r.createdAt}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DS_DANG_KY_CSG17Y_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md overflow-y-auto animate-fadeIn font-body text-[#F4F0E6]">
      <div 
        className="relative w-full max-w-7xl bg-[#111111] border-2 border-[#383838] rounded-2xl shadow-2xl overflow-hidden my-4 flex flex-col h-[94vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-[#383838] bg-[#181818]">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-[#F5C400] text-[#111111] font-display text-xl font-black flex items-center justify-center">
              CSG
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display tracking-widest text-base uppercase text-[#F4F0E6]">
                  EVENT CONTROL WORKSPACE
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#F5C400]/20 text-[#F5C400] border border-[#F5C400]/40">
                  BTC 17Y
                </span>
              </div>
              <p className="text-[11px] text-[#A8A8A8]">
                Bảng điều phối vận hành, đối soát thanh toán & quản trị vé check-in
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <label 
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#222222] border border-[#383838] text-[11px] font-mono text-[#F5C400] cursor-pointer hover:bg-[#2a2a2a] select-none transition-colors"
                title="Mặc định TẮT để duyệt nhanh liên tục không bị nhảy tab. Hệ thống tự động gửi email kèm file lịch invite.ics trực tiếp tới người đăng ký."
              >
                <input
                  type="checkbox"
                  checked={autoOpenCalendar}
                  onChange={(e) => handleToggleAutoOpenCalendar(e.target.checked)}
                  className="rounded bg-[#181818] border-[#444] text-[#F5C400] w-3.5 h-3.5 cursor-pointer accent-[#F5C400]"
                />
                <span>📅 Tự mở tab GG Calendar</span>
              </label>
            )}
            <button
              onClick={loadAdminData}
              disabled={isLoading}
              className="p-1.5 rounded-lg border border-[#383838] hover:bg-[#222222] text-[#A8A8A8] hover:text-white transition-colors"
              title="Làm mới dữ liệu"
            >
              <RefreshIcon size={16} className={isLoading ? 'animate-spin' : ''} />
            </button>
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="px-2.5 py-1 rounded-lg border border-red-900/60 hover:bg-red-950/40 text-red-400 text-xs font-bold transition-colors"
                title="Đăng xuất quản trị"
              >
                Đăng xuất
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[#383838] hover:bg-[#222222] text-[#A8A8A8] hover:text-white transition-colors"
            >
              <CloseIcon size={20} />
            </button>
          </div>
        </div>

        {/* PIN Authentication Gate */}
        {!isAuthenticated ? (
          <div className="p-12 text-center max-w-md mx-auto my-auto space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#222222] border-2 border-[#F5C400] flex items-center justify-center text-2xl shadow-poster-sm">
              <LockIcon size={32} className="text-[#F5C400]" />
            </div>
            <div>
              <h4 className="text-3xl font-display uppercase tracking-wide text-white mb-1">
                BTC ACCESS GATEWAY
              </h4>
              <p className="text-xs text-[#A8A8A8]">
                Khu vực mật dành cho Ban Điều Hành & Thủ quỹ CLB Truyền thông Cóc Sài Gòn.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Nhập mã PIN Ban Tổ Chức..."
                className="w-full px-4 py-3 rounded-xl bg-[#181818] border-2 border-[#383838] text-white text-center font-mono text-lg focus:outline-none focus:border-[#F5C400] tracking-widest"
                autoFocus
              />
              {authError && <p className="text-xs text-[#D94C2B] font-bold">{authError}</p>}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-[#F5C400] hover:bg-[#F8D879] text-[#111111] font-display text-xl uppercase tracking-wider transition-all font-black flex items-center justify-center gap-2"
              >
                <span>MỞ BẢNG QUẢN TRỊ</span>
                <ArrowUpRightIcon size={18} />
              </button>
            </form>
          </div>
        ) : (
          /* ================= MAIN DASHBOARD SHELL ================= */
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <aside className="w-56 bg-[#181818] border-r border-[#383838] flex flex-col justify-between shrink-0 font-mono text-xs">
              <div className="p-3 space-y-1">
                <button
                  type="button"
                  onClick={() => setActiveModule('OVERVIEW')}
                  className={`w-full px-3 py-2.5 rounded-lg text-left font-bold transition-colors flex items-center gap-2 ${
                    activeModule === 'OVERVIEW'
                      ? 'bg-[#222222] text-[#F5C400] border border-[#383838]'
                      : 'text-[#A8A8A8] hover:text-white hover:bg-[#222222]/50'
                  }`}
                >
                  <span>▰ Tổng quan (Overview)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModule('REGISTRATIONS')}
                  className={`w-full px-3 py-2.5 rounded-lg text-left font-bold transition-colors flex items-center justify-between ${
                    activeModule === 'REGISTRATIONS'
                      ? 'bg-[#222222] text-[#F5C400] border border-[#383838]'
                      : 'text-[#A8A8A8] hover:text-white hover:bg-[#222222]/50'
                  }`}
                >
                  <span>▰ Danh sách đăng ký</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#383838] text-[#F4F0E6]">
                    {registrations.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModule('PAYMENT_REVIEW')}
                  className={`w-full px-3 py-2.5 rounded-lg text-left font-bold transition-colors flex items-center justify-between ${
                    activeModule === 'PAYMENT_REVIEW'
                      ? 'bg-[#222222] text-[#F5C400] border border-[#383838]'
                      : 'text-[#A8A8A8] hover:text-white hover:bg-[#222222]/50'
                  }`}
                >
                  <span>▰ Duyệt thanh toán</span>
                  {totalPending > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#D94C2B] text-white font-bold">
                      {totalPending}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModule('TICKETS')}
                  className={`w-full px-3 py-2.5 rounded-lg text-left font-bold transition-colors flex items-center justify-between ${
                    activeModule === 'TICKETS'
                      ? 'bg-[#222222] text-[#F5C400] border border-[#383838]'
                      : 'text-[#A8A8A8] hover:text-white hover:bg-[#222222]/50'
                  }`}
                >
                  <span>▰ Quản lý vé VIP</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#383838] text-[#F4F0E6]">
                    {totalApproved}
                  </span>
                </button>


                <button
                  type="button"
                  onClick={() => setActiveModule('WISHES')}
                  className={`w-full px-3 py-2.5 rounded-lg text-left font-bold transition-colors flex items-center justify-between ${
                    activeModule === 'WISHES'
                      ? 'bg-[#222222] text-[#F5C400] border border-[#383838]'
                      : 'text-[#A8A8A8] hover:text-white hover:bg-[#222222]/50'
                  }`}
                >
                  <span>▰ Lời chúc ({publicWishes.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModule('SHEETS_SYNC')}
                  className={`w-full px-3 py-2.5 rounded-lg text-left font-bold transition-colors flex items-center gap-2 ${
                    activeModule === 'SHEETS_SYNC'
                      ? 'bg-[#222222] text-[#F5C400] border border-[#383838]'
                      : 'text-[#A8A8A8] hover:text-white hover:bg-[#222222]/50'
                  }`}
                >
                  <span>▰ Google Sheets Sync</span>
                </button>
              </div>

              {/* Sidebar footer */}
              <div className="p-3 border-t border-[#383838] space-y-2">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full py-2 px-2.5 rounded-lg bg-[#222222] hover:bg-[#292929] border border-[#383838] text-white font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <FileSpreadsheetIcon size={14} className="text-emerald-400" />
                  <span>Xuất file Excel</span>
                </button>
              </div>
            </aside>

            {/* Main Content Pane */}
            <main className="flex-1 bg-[#111111] overflow-y-auto p-6 space-y-6">

              {/* ================= 1. OVERVIEW MODULE ================= */}
              {activeModule === 'OVERVIEW' && (
                <div className="space-y-6 animate-fadeIn">
                  <div>
                    <h3 className="font-display text-3xl uppercase tracking-wider text-white">
                      EXECUTIVE METRICS DASHBOARD
                    </h3>
                    <p className="text-xs text-[#A8A8A8]">
                      Tổng hợp thời gian thực tiến độ đăng ký và thu quỹ đêm tiệc CSG 17Y
                    </p>
                  </div>

                  {/* 8 KPI Cards (Dense, High contrast, No decorative gradient) */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl bg-[#222222] border border-[#383838]">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#A8A8A8] block">
                        Tổng người đăng ký
                      </span>
                      <span className="text-3xl font-display font-black text-white">{totalReg}</span>
                      <span className="text-[10px] text-[#A8A8A8] block mt-0.5">Mục tiêu: 200 Cóc Vàng</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#222222] border border-[#3D6B45]">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#3D6B45] block">
                        Đã duyệt 100% (Vé cấp)
                      </span>
                      <span className="text-3xl font-display font-black text-[#3D6B45]">{totalApproved}</span>
                      <span className="text-[10px] text-[#A8A8A8] block mt-0.5">Đủ điều kiện check-in</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#222222] border border-[#D99B26]">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#D99B26] block">
                        Chờ duyệt đối soát
                      </span>
                      <span className="text-3xl font-display font-black text-[#D99B26]">{totalPending}</span>
                      <span className="text-[10px] text-[#A8A8A8] block mt-0.5">Biên lai mới nộp</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#222222] border border-[#D94C2B]">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#D94C2B] block">
                        Biên lai từ chối
                      </span>
                      <span className="text-3xl font-display font-black text-[#D94C2B]">{totalRejected}</span>
                      <span className="text-[10px] text-[#A8A8A8] block mt-0.5">Cần upload lại</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#222222] border border-[#383838]">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#A8A8A8] block">
                        Thành viên hiện tại
                      </span>
                      <span className="text-2xl font-display font-black text-white">{totalMembers}</span>
                      <span className="text-[10px] text-[#A8A8A8] block">Gói 349.000 đ</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#222222] border border-[#383838]">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#A8A8A8] block">
                        Cựu thành viên
                      </span>
                      <span className="text-2xl font-display font-black text-[#F5C400]">{totalAlumni}</span>
                      <span className="text-[10px] text-[#A8A8A8] block">Gói 389.000 đ</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#222222] border border-[#F5C400]">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#F5C400] block">
                        Tổng quỹ đã thu
                      </span>
                      <span className="text-2xl font-display font-black text-[#F5C400]">
                        {totalRevenue.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-[#A8A8A8] block">Thực nhận tài khoản VietinBank</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#222222] border border-[#383838]">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#A8A8A8] block">
                        Còn phải thu
                      </span>
                      <span className="text-2xl font-display font-black text-white">
                        {totalOutstanding.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-[#A8A8A8] block">Từ các trường hợp mới cọc</span>
                    </div>
                  </div>

                  {/* Quick Action Banner */}
                  <div className="p-5 rounded-xl bg-[#222222] border border-[#383838] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-display text-xl uppercase tracking-wide text-white">
                        HÀNG ĐỢI DUYỆT BIÊN LAI (PAYMENT REVIEW CENTER)
                      </h4>
                      <p className="text-xs text-[#A8A8A8]">
                        Hiện có <strong>{totalPending} giao dịch</strong> đang chờ BTC kiểm tra đối chiếu sao kê để cấp vé.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveModule('PAYMENT_REVIEW')}
                      className="px-5 py-2.5 rounded-xl bg-[#F5C400] hover:bg-[#F8D879] text-[#111111] font-display text-lg uppercase font-black transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <span>MỞ KHÔNG GIAN ĐỐI SOÁT</span>
                      <ArrowRightIcon size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ================= 2. REGISTRATIONS MODULE ================= */}
              {activeModule === 'REGISTRATIONS' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-2xl uppercase tracking-wide text-white">
                        REGISTRATION MANAGEMENT ({registrations.length})
                      </h3>
                      <p className="text-xs text-[#A8A8A8]">
                        Tìm kiếm, lọc danh sách thành viên và kiểm tra chi tiết hồ sơ
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="px-3.5 py-2 rounded-lg bg-[#222222] hover:bg-[#292929] border border-[#383838] text-xs font-bold flex items-center gap-1.5 transition-colors text-white"
                    >
                      <FileSpreadsheetIcon size={16} className="text-emerald-400" />
                      <span>Xuất Excel (.CSV)</span>
                    </button>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[220px]">
                      <SearchIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A8A8] pointer-events-none" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm Tên, MSSV, SĐT, Gmail..."
                        className="w-full pl-9 pr-3 py-2 rounded-lg bg-[#181818] border border-[#383838] text-xs text-white focus:outline-none focus:border-[#F5C400]"
                      />
                    </div>

                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'ACTIVE' | 'ALUMNI' | 'GUEST')}
                      className="px-3 py-2 rounded-lg bg-[#181818] border border-[#383838] text-xs text-white focus:outline-none focus:border-[#F5C400]"
                    >
                      <option value="ALL">Tất cả vai trò</option>
                      <option value="ACTIVE">Thành viên</option>
                      <option value="ALUMNI">Cựu thành viên</option>
                      <option value="GUEST">Khách mời</option>
                    </select>

                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'DEPOSIT_ONLY')}
                      className="px-3 py-2 rounded-lg bg-[#181818] border border-[#383838] text-xs text-white focus:outline-none focus:border-[#F5C400]"
                    >
                      <option value="ALL">Tất cả trạng thái</option>
                      <option value="APPROVED">Đã duyệt 100%</option>
                      <option value="PENDING">Chờ duyệt</option>
                      <option value="DEPOSIT_ONLY">Mới đặt cọc</option>
                      <option value="REJECTED">Bị từ chối</option>
                    </select>
                  </div>

                  {/* Dense Table */}
                  <div className="border border-[#383838] rounded-xl overflow-hidden bg-[#181818]">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-[#222222] text-[#A8A8A8] uppercase font-mono font-bold border-b border-[#383838]">
                          <tr>
                            <th className="py-2.5 px-3">Họ Tên & MSSV</th>
                            <th className="py-2.5 px-3">Vai Trò</th>
                            <th className="py-2.5 px-3">Đã Đóng</th>
                            <th className="py-2.5 px-3">Liên Hệ</th>
                            <th className="py-2.5 px-3">Trạng Thái</th>
                            <th className="py-2.5 px-3">Email Vé</th>
                            <th className="py-2.5 px-3">Vé VIP</th>
                            <th className="py-2.5 px-3 text-right">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#383838] font-body text-[#F4F0E6]">
                          {filtered.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-8 text-center text-[#A8A8A8]">
                                Không tìm thấy người tham dự nào khớp với bộ lọc.
                              </td>
                            </tr>
                          ) : (
                            filtered.map((r) => (
                              <tr key={r.id} className="hover:bg-[#222222]/60 transition-colors">
                                <td className="py-2.5 px-3">
                                  <div className="font-bold text-white">{r.fullName}</div>
                                  <div className="text-[11px] font-mono text-[#F5C400]">{r.mssv}</div>
                                  {r.allergies?.length > 0 && (
                                    <span className="text-[10px] text-[#D94C2B] flex items-center gap-1">
                                      <AlertTriangleIcon size={12} className="shrink-0" />
                                      <span>{r.allergies.join(', ')}</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    r.role === 'GUEST'
                                      ? 'bg-purple-500/20 text-purple-300'
                                      : r.role === 'ALUMNI'
                                      ? 'bg-[#F5C400]/20 text-[#F5C400]'
                                      : 'bg-emerald-500/20 text-emerald-300'
                                  }`}>
                                    {r.role === 'GUEST' ? 'Khách mời' : (r.role === 'ALUMNI' ? 'Cựu TV' : 'Thành viên')}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="font-mono font-bold">{r.paidAmount.toLocaleString('vi-VN')} đ</div>
                                  {r.remainingAmount > 0 && (
                                    <span className="text-[10px] text-[#D94C2B] font-mono block">
                                      Thiếu: {r.remainingAmount.toLocaleString('vi-VN')}đ
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-[11px]">
                                  <div>SĐT: <span className="font-mono">{r.personalPhone}</span></div>
                                  <div className="text-[#A8A8A8]">Rước: <span className="font-mono text-[#D94C2B]">{r.emergencyPhone}</span></div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                                    r.isApproved100
                                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/40'
                                      : r.status === 'REJECTED'
                                      ? 'bg-red-500/10 text-red-400 border-red-500/40'
                                      : 'bg-amber-500/10 text-amber-400 border-amber-500/40'
                                  }`}>
                                    {r.isApproved100 ? 'ĐÃ DUYỆT 100%' : (r.status === 'REJECTED' ? 'TỪ CHỐI' : 'CHỜ DUYỆT')}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3">
                                  {r.isEmailSent ? (
                                    <div className="flex flex-col gap-0.5">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 w-fit">
                                        <MailIcon size={10} />
                                        <span>{r.lastEmailTemplate === 'FULL_100' ? 'Vé VIP' : (r.lastEmailTemplate === 'DEPOSIT_ALUMNI' ? 'Cọc Alumni' : (r.lastEmailTemplate === 'DEPOSIT_ACTIVE' ? 'Cọc Active' : 'Đã gửi'))}</span>
                                      </span>
                                      {r.emailSentAt && (
                                        <span className="text-[9px] text-[#A8A8A8] font-mono">
                                          {new Date(r.emailSentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#242424] text-[#888888] border border-[#383838] flex items-center gap-1 w-fit">
                                      <MailIcon size={10} />
                                      <span>Chưa gửi</span>
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 font-mono text-[11px]">
                                  {r.isApproved100 ? (
                                    <span className="text-emerald-400 font-bold">{r.ticketCode}</span>
                                  ) : (
                                    <span className="text-[#A8A8A8]">Chưa cấp</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setEmailPreviewRecord(r)}
                                      title="Xem trước & Gửi mail"
                                      className="p-1.5 rounded-lg bg-[#222222] hover:bg-[#333333] border border-[#383838] text-[#F5C400] transition-colors"
                                    >
                                      <MailIcon size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedReviewId(r.id);
                                        setActiveModule('PAYMENT_REVIEW');
                                      }}
                                      className="px-2.5 py-1 rounded-lg bg-[#222222] hover:bg-[#383838] border border-[#383838] text-[11px] font-bold text-white transition-colors"
                                    >
                                      Chi tiết
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= 3. PAYMENT REVIEW CENTER ================= */}
              {activeModule === 'PAYMENT_REVIEW' && (
                <div className="space-y-4 animate-fadeIn h-full flex flex-col">
                  <div>
                    <h3 className="font-display text-2xl uppercase tracking-wide text-white">
                      PAYMENT REVIEW CENTER
                    </h3>
                    <p className="text-xs text-[#A8A8A8]">
                      Không gian 3 vùng đối soát trực tiếp biên lai chuyển khoản và phê duyệt vé
                    </p>
                  </div>

                  {/* 3-Column Review Workspace */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-[520px]">
                    {/* Left: Submission Queue */}
                    <div className="lg:col-span-3 bg-[#181818] border border-[#383838] rounded-xl p-3 flex flex-col space-y-2 overflow-y-auto">
                      <span className="text-xs font-mono font-bold uppercase text-[#A8A8A8] block pb-1 border-b border-[#383838]">
                        HÀNG ĐỢI XỬ LÝ ({pendingReviewList.length})
                      </span>
                      {pendingReviewList.length === 0 ? (
                        <div className="text-center py-12 text-[#A8A8A8] space-y-1">
                          <CheckCircleIcon size={32} className="text-[#3D6B45] mx-auto" />
                          <p className="text-xs font-bold">ALL CAUGHT UP!</p>
                          <p className="text-[11px]">Không còn giao dịch nào chờ duyệt.</p>
                        </div>
                      ) : (
                        pendingReviewList.map((r) => (
                          <div
                            key={r.id}
                            onClick={() => setSelectedReviewId(r.id)}
                            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                              currentReviewRecord?.id === r.id
                                ? 'bg-[#222222] border-[#F5C400] text-white shadow-sm'
                                : 'bg-[#181818] border-[#383838] text-[#A8A8A8] hover:bg-[#222222]'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-0.5">
                              <span className="font-bold text-xs text-white truncate">{r.fullName}</span>
                              <span className="text-[9px] font-mono px-1 rounded bg-[#383838]">
                                {r.role === 'GUEST' ? 'Khách' : (r.role === 'ALUMNI' ? 'Cựu' : 'Active')}
                              </span>
                            </div>
                            <div className="flex justify-between text-[11px] font-mono">
                              <span>{r.mssv}</span>
                              <span className="text-[#F5C400] font-bold">{r.paidAmount.toLocaleString('vi-VN')} đ</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Center: Receipt Image Viewer with Zoom, Rotate, Fit */}
                    <div className="lg:col-span-5 bg-[#181818] border border-[#383838] rounded-xl p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between border-b border-[#383838] pb-2 mb-2">
                        <span className="text-xs font-mono font-bold text-[#A8A8A8] uppercase">
                          CHỨNG TỪ BIÊN LAI
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setImageZoom(z => Math.max(0.6, z - 0.2))}
                            className="p-1 rounded bg-[#222222] hover:bg-[#383838] text-white text-xs"
                            title="Thu nhỏ"
                          >
                            <ZoomOutIcon size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageZoom(z => Math.min(2.5, z + 0.2))}
                            className="p-1 rounded bg-[#222222] hover:bg-[#383838] text-white text-xs"
                            title="Phóng to"
                          >
                            <ZoomInIcon size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageRotate(r => (r + 90) % 360)}
                            className="p-1 rounded bg-[#222222] hover:bg-[#383838] text-white text-xs"
                            title="Xoay ảnh"
                          >
                            <RefreshIcon size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setImageZoom(1); setImageRotate(0); }}
                            className="px-2 py-1 rounded bg-[#222222] hover:bg-[#383838] text-[10px] text-white"
                          >
                            Reset
                          </button>
                        </div>
                      </div>

                      {/* Image Canvas */}
                      <div className="flex-1 bg-[#111111] rounded-lg border border-[#383838] overflow-hidden flex items-center justify-center p-2 min-h-[360px] relative">
                        {currentReviewRecord?.receiptPhase1Url || currentReviewRecord?.receiptPhase2Url ? (
                          <img
                            src={currentReviewRecord.receiptPhase2Url || currentReviewRecord.receiptPhase1Url}
                            alt="Biên lai đối soát"
                            style={{
                              transform: `scale(${imageZoom}) rotate(${imageRotate}deg)`,
                              transition: 'transform 0.15s ease-out'
                            }}
                            className="max-h-[380px] max-w-full object-contain mx-auto"
                          />
                        ) : (
                          <span className="text-xs text-[#A8A8A8]">Không có ảnh biên lai</span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#A8A8A8] text-center mt-2 block">
                        Đang xem: {currentReviewRecord?.receiptPhase2Url ? 'Biên lai đợt 2 (Bổ sung)' : 'Biên lai đợt 1 (Đăng ký)'}
                      </span>
                    </div>

                    {/* Right: Participant & Payment Detail + Approve/Reject Action */}
                    <div className="lg:col-span-4 bg-[#181818] border border-[#383838] rounded-xl p-4 flex flex-col justify-between space-y-4">
                      {currentReviewRecord ? (
                        <div className="space-y-3 text-xs">
                          <div className="border-b border-[#383838] pb-2">
                            <span className="text-[10px] font-mono uppercase text-[#A8A8A8]">Hồ sơ tham dự</span>
                            <h4 className="text-lg font-bold text-white">{currentReviewRecord.fullName}</h4>
                            <span className="text-[11px] font-mono text-[#F5C400]">
                              MSSV: {currentReviewRecord.mssv} • {currentReviewRecord.role === 'GUEST' ? 'Khách mời' : (currentReviewRecord.role === 'ALUMNI' ? 'Cựu thành viên' : 'Thành viên')}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 bg-[#222222] p-3 rounded-lg border border-[#383838]">
                            <div>
                              <span className="text-[#A8A8A8] text-[10px] block">Tổng phí</span>
                              <span className="font-mono font-bold text-white">{currentReviewRecord.totalRequired.toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div>
                              <span className="text-[#A8A8A8] text-[10px] block">Đã khai báo nộp</span>
                              <span className="font-mono font-bold text-emerald-400">{currentReviewRecord.paidAmount.toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div>
                              <span className="text-[#A8A8A8] text-[10px] block">Còn thiếu</span>
                              <span className="font-mono font-bold text-[#D94C2B]">{currentReviewRecord.remainingAmount.toLocaleString('vi-VN')} đ</span>
                            </div>
                            <div>
                              <span className="text-[#A8A8A8] text-[10px] block">Gói</span>
                              <span className="font-mono font-bold">{currentReviewRecord.plan}</span>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[#A8A8A8]">Gmail nhận vé: <span className="font-mono text-white">{currentReviewRecord.gmail}</span></p>
                            <p className="text-[#A8A8A8]">SĐT: <span className="font-mono text-white">{currentReviewRecord.personalPhone}</span></p>
                            <p className="text-[#A8A8A8]">SĐT người thân đón về: <span className="font-mono text-[#D94C2B] font-bold">{currentReviewRecord.emergencyPhone}</span></p>
                            {currentReviewRecord.allergies?.length > 0 && (
                              <p className="text-[#D94C2B]">Dị ứng: {currentReviewRecord.allergies.join(', ')}</p>
                            )}
                          </div>

                          {currentReviewRecord.wishes && (
                            <div className="p-2.5 rounded bg-[#222222] border border-[#383838]">
                              <span className="text-[10px] font-mono text-[#A8A8A8] block">Lời chúc gửi Cóc:</span>
                              <p className="italic text-[11px] text-[#F4F0E6]">"{currentReviewRecord.wishes}"</p>
                            </div>
                          )}

                          {currentReviewRecord.isApproved100 && (
                            <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-bold text-center">
                              ✓ HỒ SƠ NÀY ĐÃ ĐƯỢC DUYỆT 100%
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-[#A8A8A8]">
                          Chọn một giao dịch bên trái để đối soát
                        </div>
                      )}

                      {/* Action Buttons with distinct spacing and confirmation hierarchy */}
                      {currentReviewRecord && (
                        <div className="space-y-2 pt-2 border-t border-[#383838]">
                          {/* Live Email Dispatch Status Box */}
                          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-[#222222] border border-[#383838]">
                            <span className="text-[#A8A8A8] flex items-center gap-1.5 font-medium">
                              <MailIcon size={14} className="text-[#F5C400]" />
                              <span>Email xác nhận:</span>
                            </span>
                            {currentReviewRecord.isEmailSent ? (
                              <span className="text-emerald-400 font-mono font-bold text-[11px] flex items-center gap-1">
                                <CheckIcon size={12} />
                                <span>ĐÃ GỬI ({currentReviewRecord.lastEmailTemplate === 'FULL_100' ? 'VÉ VIP 100%' : (currentReviewRecord.lastEmailTemplate === 'DEPOSIT_ALUMNI' ? 'CỌC ALUMNI' : 'CỌC ACTIVE')})</span>
                              </span>
                            ) : (
                              <span className="text-amber-400 font-mono font-bold text-[11px]">
                                CHƯA ĐI MAIL
                              </span>
                            )}
                          </div>

                          {!currentReviewRecord.isApproved100 && (
                            <>
                              {/* Option 1: Approve 150k Deposit if remaining balance exists */}
                              {(currentReviewRecord.remainingAmount > 0 || currentReviewRecord.plan === 'DEPOSIT_150' || currentReviewRecord.plan === 'DEPOSIT_100') && (
                                <button
                                  type="button"
                                  disabled={isLoading}
                                  onClick={() => handleApproveDeposit(currentReviewRecord.id)}
                                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                                >
                                  <CheckIcon size={16} />
                                  <span>DUYỆT ĐẶT CỌC 150K & GỬI MAIL (THIẾU {currentReviewRecord.remainingAmount.toLocaleString('vi-VN')}Đ)</span>
                                </button>
                              )}

                              {/* Option 2: Approve 100% Full Payment with Check-in QR */}
                              <button
                                type="button"
                                disabled={isLoading}
                                onClick={() => handleApprove100(currentReviewRecord.id)}
                                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                              >
                                <CheckIcon size={16} />
                                <span>PHÊ DUYỆT 100% & GỬI VÉ VIP (QR CHECK-IN)</span>
                              </button>

                              {/* Option 3: Reject Payment */}
                              <button
                                type="button"
                                onClick={() => setShowRejectModal(true)}
                                className="w-full py-2 rounded-xl bg-[#222222] hover:bg-red-950/40 text-[#D94C2B] border border-[#D94C2B]/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                              >
                                <CloseIcon size={16} />
                                <span>TỪ CHỐI BIÊN LAI (REJECT)</span>
                              </button>
                            </>
                          )}

                          {/* Secondary Toolbar: Preview & Manual Dispatch */}
                          <div className="flex gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEmailPreviewRecord(currentReviewRecord)}
                              className="flex-1 py-2 rounded-lg bg-[#222222] hover:bg-[#2c2c2c] border border-[#383838] text-[11px] font-bold text-[#F5C400] flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <EyeIcon size={14} />
                              <span>Xem trước & Chọn mẫu</span>
                            </button>
                            <button
                              type="button"
                              disabled={isSendingEmail}
                              onClick={() => handleSendEmail(currentReviewRecord.id, currentReviewRecord.isApproved100 ? 'FULL_100' : (currentReviewRecord.role === 'ALUMNI' ? 'DEPOSIT_ALUMNI' : 'DEPOSIT_ACTIVE'))}
                              className="flex-1 py-2 rounded-lg bg-[#222222] hover:bg-[#2c2c2c] border border-[#383838] text-[11px] font-bold text-emerald-400 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                            >
                              <MailIcon size={14} />
                              <span>{currentReviewRecord.isEmailSent ? 'Gửi lại email' : 'Gửi mail ngay'}</span>
                            </button>
                          </div>

                          {/* Direct Google Calendar Link */}
                          <a
                            href={createGoogleCalendarUrl(currentReviewRecord)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 rounded-lg bg-[#181818] hover:bg-[#222222] border border-[#383838] text-xs font-mono font-bold text-[#F5C400] flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
                            title="Mở Google Calendar để thêm sự kiện hoặc mời người tham dự"
                          >
                            <CalendarIcon size={14} />
                            <span>Thêm vào Google Calendar (12/12)</span>
                            <ArrowUpRightIcon size={12} />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= 4. TICKETS MODULE ================= */}
              {activeModule === 'TICKETS' && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="font-display text-2xl uppercase tracking-wide text-white">
                        TICKET & CHECK-IN MANAGEMENT
                      </h3>
                      <p className="text-xs text-[#A8A8A8]">
                        Điều phối danh sách vé QR VIP và bàn soát vé check-in tại cửa sự kiện
                      </p>
                    </div>

                    {/* Quick Metric Badges */}
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <div className="px-3 py-1.5 rounded-lg bg-[#181818] border border-[#383838]">
                        <span className="text-[#A8A8A8] block text-[10px]">ĐÃ CẤP VÉ</span>
                        <span className="text-[#F5C400] font-bold text-sm">
                          {registrations.filter(r => r.isApproved100).length}
                        </span>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-[#181818] border border-[#383838]">
                        <span className="text-[#A8A8A8] block text-[10px]">ĐÃ CHECK-IN</span>
                        <span className="text-emerald-400 font-bold text-sm">
                          {registrations.filter(r => r.isCheckedIn).length}
                        </span>
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-[#181818] border border-[#383838]">
                        <span className="text-[#A8A8A8] block text-[10px]">CHƯA TỚI</span>
                        <span className="text-white font-bold text-sm">
                          {registrations.filter(r => r.isApproved100 && !r.isCheckedIn).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive On-Site Check-in Desk */}
                  <div className="p-5 rounded-xl bg-[#181818] border-2 border-[#F5C400]/40 space-y-4">
                    <div className="flex items-center gap-2">
                      <QrCodeIcon size={20} className="text-[#F5C400]" />
                      <h4 className="font-display font-bold text-base uppercase text-white tracking-wider">
                        BÀN SOÁT VÉ CHECK-IN TẠI SỰ KIỆN (CHECK-IN DESK)
                      </h4>
                    </div>

                    <form onSubmit={handleCheckInTicket} className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={checkInCode}
                          onChange={(e) => setCheckInCode(e.target.value)}
                          placeholder="Quét mã QR hoặc nhập Mã vé / Token / MSSV (VD: CSG17Y-HP12 hoặc SE120101)..."
                          className="w-full px-4 py-3 rounded-xl bg-[#222222] border border-[#383838] text-white font-mono text-sm placeholder:text-[#A8A8A8]/60 focus:border-[#F5C400] focus:outline-none"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={isCheckingIn || !checkInCode.trim()}
                        className="px-6 py-3 rounded-xl bg-[#F5C400] hover:bg-[#F5C400]/90 text-[#111111] font-display font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
                      >
                        {isCheckingIn ? <RefreshIcon size={16} className="animate-spin" /> : <CheckCircleIcon size={16} />}
                        <span>XÁC NHẬN CHECK-IN</span>
                      </button>
                    </form>

                    {/* Result Alert Message */}
                    {checkInResult && (
                      <div className={`p-4 rounded-xl border text-xs font-mono flex items-start gap-3 ${
                        checkInResult.type === 'success'
                          ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-300'
                          : checkInResult.type === 'warning'
                          ? 'bg-amber-950/40 border-amber-500/60 text-amber-300'
                          : 'bg-red-950/40 border-red-500/60 text-red-300'
                      }`}>
                        {checkInResult.type === 'success' && <CheckCircleIcon size={20} className="text-emerald-400 shrink-0 mt-0.5" />}
                        {checkInResult.type === 'warning' && <AlertTriangleIcon size={20} className="text-amber-400 shrink-0 mt-0.5" />}
                        {checkInResult.type === 'error' && <AlertCircleIcon size={20} className="text-red-400 shrink-0 mt-0.5" />}
                        <div className="space-y-1">
                          <p className="font-bold text-sm">{checkInResult.message}</p>
                          {checkInResult.record && (
                            <p className="text-[11px] opacity-80">
                              Người tham dự: {checkInResult.record.fullName} • Vai trò: {checkInResult.record.role} • MSSV: {checkInResult.record.mssv}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Issued Tickets List */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {registrations.filter(r => r.isApproved100).map((r) => (
                      <div key={r.id} className="p-4 rounded-xl bg-[#181818] border border-[#383838] space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-display font-bold text-lg text-white">{r.fullName}</span>
                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            r.isCheckedIn
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}>
                            {r.isCheckedIn ? '✓ CHECKED IN' : 'ISSUED'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(r.ticketToken || r.ticketCode)}`}
                            alt="QR Check-in"
                            className="w-16 h-16 bg-white p-1 rounded border border-[#383838]"
                          />
                          <div className="text-xs font-mono space-y-0.5">
                            <span className="text-[#F5C400] font-bold block">{r.ticketCode}</span>
                            <span className="text-[#A8A8A8] block">MSSV: {r.mssv}</span>
                            <span className="text-[#A8A8A8] block">{r.personalPhone}</span>
                            {r.isCheckedIn && r.checkedInAt && (
                              <span className="text-emerald-400 text-[10px] block font-bold">
                                Vào lúc: {new Date(r.checkedInAt).toLocaleTimeString('vi-VN')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}


              {/* ================= 6. WISHES MODULE ================= */}
              {activeModule === 'WISHES' && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <h3 className="font-display text-2xl uppercase tracking-wide text-white">
                      WISH MODERATION ({publicWishes.length})
                    </h3>
                    <p className="text-xs text-[#A8A8A8]">
                      Kiểm duyệt các lời chúc gửi về sinh nhật 17 năm trước khi hiển thị trên Sân Khấu Kỷ Niệm
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {publicWishes.map((w) => (
                      <div key={w.id} className="p-4 rounded-xl bg-[#181818] border border-[#383838] space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-sm text-white">{w.authorName}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            w.moderationStatus === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {w.moderationStatus}
                          </span>
                        </div>
                        <p className="text-xs text-[#F4F0E6] italic">"{w.content}"</p>
                        <div className="flex justify-end gap-2 pt-2 border-t border-[#383838]">
                          <button
                            onClick={() => handleModerateWish(w.id, 'APPROVED')}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1"
                          >
                            <ThumbsUpIcon size={12} />
                            <span>Duyệt</span>
                          </button>
                          <button
                            onClick={() => handleModerateWish(w.id, 'REJECTED')}
                            className="px-2.5 py-1 rounded bg-[#D94C2B] hover:bg-red-700 text-white text-[11px] font-bold flex items-center gap-1"
                          >
                            <ThumbsDownIcon size={12} />
                            <span>Ẩn</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= 7. SHEETS SYNC MODULE ================= */}
              {activeModule === 'SHEETS_SYNC' && (
                <div className="space-y-4 animate-fadeIn max-w-2xl">
                  <div>
                    <h3 className="font-display text-2xl uppercase tracking-wide text-white">
                      GOOGLE SHEETS WHITELIST INTEGRATION
                    </h3>
                    <p className="text-xs text-[#A8A8A8]">
                      Đồng bộ danh sách Thành viên & Cựu thành viên được mời từ Google Sheet vào cơ sở dữ liệu
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-[#181818] border border-[#383838] space-y-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between p-2.5 bg-[#222222] rounded-lg border border-[#383838]">
                        <span className="text-[#A8A8A8]">Tài khoản kết nối:</span>
                        <span className="font-mono text-white">btc.cocsagon@gmail.com</span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-[#222222] rounded-lg border border-[#383838]">
                        <span className="text-[#A8A8A8]">Tệp Google Sheet:</span>
                        <span className="font-mono text-white">DANH_SACH_THANH_VIEN_CSG17Y</span>
                      </div>
                      <div className="flex justify-between p-2.5 bg-[#222222] rounded-lg border border-[#383838]">
                        <span className="text-[#A8A8A8]">Trạng thái đồng bộ gần nhất:</span>
                        <span className="font-mono text-emerald-400 font-bold">✓ SYNCED (Hôm nay)</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isSyncingSheets}
                      onClick={handleSyncSheets}
                      className="w-full py-3 rounded-xl bg-[#F5C400] hover:bg-[#F8D879] text-[#111111] font-display text-xl uppercase font-black tracking-wider transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshIcon size={16} className={isSyncingSheets ? 'animate-spin' : ''} />
                      <span>{isSyncingSheets ? 'ĐANG ĐỒNG BỘ...' : 'ĐỒNG BỘ GOOGLE SHEETS NGAY'}</span>
                      {!isSyncingSheets && <ArrowUpRightIcon size={18} />}
                    </button>

                    {syncResult && (
                      <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs">
                        {syncResult}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </main>
          </div>
        )}

        {/* Modal: Reject Reason Selector */}
        {showRejectModal && currentReviewRecord && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#181818] border-2 border-[#D94C2B] rounded-2xl p-6 max-w-md w-full space-y-4 text-[#F4F0E6]">
              <div className="flex justify-between items-center border-b border-[#383838] pb-2">
                <h4 className="font-display text-xl text-white uppercase">
                  TỪ CHỐI BIÊN LAI CỦA {currentReviewRecord.fullName}
                </h4>
                <button onClick={() => setShowRejectModal(false)} className="text-[#A8A8A8] hover:text-white">
                  <CloseIcon size={20} />
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <label className="block text-[#A8A8A8] uppercase font-bold">Lý do từ chối (hiển thị cho người tham dự):</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-2.5 bg-[#222222] border border-[#383838] rounded-lg text-white"
                >
                  <option value="Không đọc được nội dung/mã giao dịch">Không đọc được nội dung/mã giao dịch</option>
                  <option value="Số tiền chuyển không khớp gói đã chọn">Số tiền chuyển không khớp gói đã chọn</option>
                  <option value="Sai cú pháp nội dung chuyển khoản">Sai cú pháp nội dung chuyển khoản</option>
                  <option value="Ảnh tải lên không phải biên lai thanh toán">Ảnh tải lên không phải biên lai thanh toán</option>
                  <option value="Giao dịch chưa khớp sao kê ngân hàng VietinBank">Giao dịch chưa khớp sao kê ngân hàng VietinBank</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 rounded-lg bg-[#222222] text-xs font-bold"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(currentReviewRecord.id)}
                  className="px-4 py-2 rounded-lg bg-[#D94C2B] hover:bg-red-700 text-white text-xs font-bold uppercase"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Email Preview and Dispatch */}
        <EmailPreviewModal
          isOpen={Boolean(emailPreviewRecord)}
          onClose={() => setEmailPreviewRecord(null)}
          record={emailPreviewRecord}
          onSendEmail={handleSendEmail}
          isSending={isSendingEmail}
        />

        {/* Global Action Toast Notification */}
        {toast && (
          <div className={`fixed bottom-6 right-6 z-[130] px-4 py-3 rounded-xl border shadow-2xl flex items-center gap-2.5 text-xs font-bold transition-all ${
            toast.type === 'success' 
              ? 'bg-emerald-950/95 border-emerald-500 text-emerald-200 shadow-emerald-950/50' 
              : toast.type === 'error'
              ? 'bg-red-950/95 border-red-500 text-red-200 shadow-red-950/50'
              : 'bg-amber-950/95 border-amber-500 text-amber-200 shadow-amber-950/50'
          }`}>
            {toast.type === 'success' ? <CheckCircleIcon size={18} /> : <AlertTriangleIcon size={18} />}
            <span>{toast.message}</span>
            <button type="button" onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 text-base">✕</button>
          </div>
        )}

      </div>
    </div>
  );
};
