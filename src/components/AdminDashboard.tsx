import React, { useState, useEffect } from 'react';
import { 
  X, Check, CheckCircle2, Clock, Eye, Download, Search, 
  Filter, Calendar, Mail, ShieldCheck, QrCode, AlertTriangle, 
  ExternalLink, FileSpreadsheet, Lock, ArrowRight, MessageSquare,
  ThumbsUp, ThumbsDown, RefreshCw, ZoomIn, ZoomOut, RotateCw, 
  Database, UserCheck, CheckSquare, Layers, AlertCircle
} from 'lucide-react';
import { RegistrationRecord } from '../types';
import { apiClient } from '../services/apiClient';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  registrations: RegistrationRecord[];
  onApprove100: (id: string) => void;
  onSimulateEmailDispatch: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  isOpen,
  onClose,
  registrations: initialRegistrations,
  onApprove100,
  onSimulateEmailDispatch
}) => {
  // Authentication PIN for BTC
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Navigation Module
  const [activeModule, setActiveModule] = useState<
    'OVERVIEW' | 'REGISTRATIONS' | 'PAYMENT_REVIEW' | 'TICKETS' | 'CAMPAIGNS' | 'WISHES' | 'SHEETS_SYNC'
  >('OVERVIEW');

  // Live registrations list from API
  const [registrations, setRegistrations] = useState<RegistrationRecord[]>(initialRegistrations);
  const [publicWishes, setPublicWishes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtering & Search for Registrations
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ACTIVE' | 'ALUMNI'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED' | 'DEPOSIT_ONLY'>('ALL');

  // Payment Review Center State
  const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imageRotate, setImageRotate] = useState(0);
  const [rejectReason, setRejectReason] = useState('Không đọc được nội dung/mã giao dịch');
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Email Campaigns state
  const [dispatchDate, setDispatchDate] = useState('2026-12-10T08:00');
  const [dispatchSuccess, setDispatchSuccess] = useState(false);

  // Google Sheet Sync state
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  // On-Site Check-in Desk State
  const [checkInCode, setCheckInCode] = useState('');
  const [checkInResult, setCheckInResult] = useState<{
    type: 'success' | 'warning' | 'error';
    message: string;
    record?: RegistrationRecord;
  } | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

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

  useEffect(() => {
    if (isAuthenticated) {
      loadAdminData();
    }
  }, [isAuthenticated]);

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

  // Handle Approve 100%
  const handleApprove = async (id: string) => {
    try {
      await apiClient.updateRegistrationStatus(id, {
        isApproved100: true,
        status: 'FULLY_PAID',
        adminUser: 'BTC_Admin'
      });
      onApprove100(id);
      setRegistrations(prev => prev.map(r => r.id === id ? {
        ...r,
        isApproved100: true,
        status: 'FULLY_PAID',
        paidAmount: r.totalRequired,
        remainingAmount: 0,
        approvedBy: 'BTC_Admin',
        approvedAt: new Date().toISOString()
      } : r));
    } catch (err: unknown) {
      const error = err as Error;
      alert('Lỗi cập nhật: ' + error.message);
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
      alert('Lỗi từ chối: ' + error.message);
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
      alert('Lỗi đồng bộ: ' + error.message);
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
      alert('Lỗi kiểm duyệt: ' + error.message);
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
            <button
              onClick={loadAdminData}
              disabled={isLoading}
              className="p-1.5 rounded-lg border border-[#383838] hover:bg-[#222222] text-[#A8A8A8] hover:text-white transition-colors"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-[#383838] hover:bg-[#222222] text-[#A8A8A8] hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PIN Authentication Gate */}
        {!isAuthenticated ? (
          <div className="p-12 text-center max-w-md mx-auto my-auto space-y-6">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#222222] border-2 border-[#F5C400] flex items-center justify-center text-2xl shadow-poster-sm">
              <Lock className="w-8 h-8 text-[#F5C400]" />
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
                placeholder="Nhập mã PIN BTC (Mặc định: csg17y)"
                className="w-full px-4 py-3 rounded-xl bg-[#181818] border-2 border-[#383838] text-white text-center font-mono text-lg focus:outline-none focus:border-[#F5C400] tracking-widest"
                autoFocus
              />
              {authError && <p className="text-xs text-[#D94C2B] font-bold">{authError}</p>}
              <button
                type="submit"
                className="w-full py-3.5 px-6 rounded-xl bg-[#F5C400] hover:bg-[#F8D879] text-[#111111] font-display text-xl uppercase tracking-wider transition-all font-black"
              >
                MỞ BẢNG QUẢN TRỊ ↗
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
                  onClick={() => setActiveModule('CAMPAIGNS')}
                  className={`w-full px-3 py-2.5 rounded-lg text-left font-bold transition-colors flex items-center gap-2 ${
                    activeModule === 'CAMPAIGNS'
                      ? 'bg-[#222222] text-[#F5C400] border border-[#383838]'
                      : 'text-[#A8A8A8] hover:text-white hover:bg-[#222222]/50'
                  }`}
                >
                  <span>▰ Email tự động</span>
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
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
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
                      <span className="text-[10px] text-[#A8A8A8] block">Gói 449.000 đ</span>
                    </div>

                    <div className="p-4 rounded-xl bg-[#222222] border border-[#F5C400]">
                      <span className="text-[10px] font-mono uppercase font-bold text-[#F5C400] block">
                        Tổng quỹ đã thu
                      </span>
                      <span className="text-2xl font-display font-black text-[#F5C400]">
                        {totalRevenue.toLocaleString('vi-VN')} đ
                      </span>
                      <span className="text-[10px] text-[#A8A8A8] block">Thực nhận tài khoản MB</span>
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
                      className="px-5 py-2.5 rounded-xl bg-[#F5C400] hover:bg-[#F8D879] text-[#111111] font-display text-lg uppercase font-black transition-colors shrink-0"
                    >
                      MỞ KHÔNG GIAN ĐỐI SOÁT →
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
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      <span>Xuất Excel (.CSV)</span>
                    </button>
                  </div>

                  {/* Filter & Search Bar */}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 min-w-[220px]">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A8A8]" />
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
                      onChange={(e) => setRoleFilter(e.target.value as 'ALL' | 'ACTIVE' | 'ALUMNI')}
                      className="px-3 py-2 rounded-lg bg-[#181818] border border-[#383838] text-xs text-white focus:outline-none focus:border-[#F5C400]"
                    >
                      <option value="ALL">Tất cả vai trò</option>
                      <option value="ACTIVE">Thành viên</option>
                      <option value="ALUMNI">Cựu thành viên</option>
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
                            <th className="py-2.5 px-3">Vé VIP</th>
                            <th className="py-2.5 px-3 text-right">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#383838] font-body text-[#F4F0E6]">
                          {filtered.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="py-8 text-center text-[#A8A8A8]">
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
                                    <span className="text-[10px] text-[#D94C2B] block">
                                      ⚠️ {r.allergies.join(', ')}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    r.role === 'ALUMNI' ? 'bg-[#F5C400]/20 text-[#F5C400]' : 'bg-emerald-500/20 text-emerald-300'
                                  }`}>
                                    {r.role === 'ALUMNI' ? 'Cựu TV' : 'Thành viên'}
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
                                <td className="py-2.5 px-3 font-mono text-[11px]">
                                  {r.isApproved100 ? (
                                    <span className="text-emerald-400 font-bold">{r.ticketCode}</span>
                                  ) : (
                                    <span className="text-[#A8A8A8]">Chưa cấp</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedReviewId(r.id);
                                      setActiveModule('PAYMENT_REVIEW');
                                    }}
                                    className="px-2.5 py-1 rounded bg-[#222222] hover:bg-[#383838] border border-[#383838] text-[11px] font-bold text-white transition-colors"
                                  >
                                    Chi tiết
                                  </button>
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
                          <CheckCircle2 className="w-8 h-8 text-[#3D6B45] mx-auto" />
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
                              <span className="text-[9px] font-mono px-1 rounded bg-[#383838]">{r.role === 'ALUMNI' ? 'Cựu' : 'Active'}</span>
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
                            <ZoomOut className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageZoom(z => Math.min(2.5, z + 0.2))}
                            className="p-1 rounded bg-[#222222] hover:bg-[#383838] text-white text-xs"
                            title="Phóng to"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setImageRotate(r => (r + 90) % 360)}
                            className="p-1 rounded bg-[#222222] hover:bg-[#383838] text-white text-xs"
                            title="Xoay ảnh"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
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
                              MSSV: {currentReviewRecord.mssv} • {currentReviewRecord.role === 'ALUMNI' ? 'Cựu thành viên' : 'Thành viên'}
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
                      {currentReviewRecord && !currentReviewRecord.isApproved100 && (
                        <div className="space-y-2 pt-2 border-t border-[#383838]">
                          <button
                            type="button"
                            onClick={() => handleApprove(currentReviewRecord.id)}
                            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                          >
                            <Check className="w-4 h-4" />
                            <span>PHÊ DUYỆT THANH TOÁN (APPROVE 100%)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowRejectModal(true)}
                            className="w-full py-2.5 rounded-xl bg-[#222222] hover:bg-red-950/40 text-[#D94C2B] border border-[#D94C2B]/40 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            <span>TỪ CHỐI BIÊN LAI (REJECT)</span>
                          </button>
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
                      <QrCode className="w-5 h-5 text-[#F5C400]" />
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
                        {isCheckingIn ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
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
                        {checkInResult.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                        {checkInResult.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                        {checkInResult.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
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

              {/* ================= 5. CAMPAIGNS MODULE ================= */}
              {activeModule === 'CAMPAIGNS' && (
                <div className="space-y-4 animate-fadeIn max-w-3xl">
                  <div>
                    <h3 className="font-display text-2xl uppercase tracking-wide text-white">
                      EMAIL CAMPAIGN AUTOMATION
                    </h3>
                    <p className="text-xs text-[#A8A8A8]">
                      Lên lịch và gửi email vé mời QR Check-in kèm tệp Apple/Google Calendar .ics
                    </p>
                  </div>

                  <div className="p-5 rounded-xl bg-[#181818] border border-[#383838] space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs">
                      <ShieldCheck className="w-5 h-5 shrink-0" />
                      <span>
                        Quy tắc bảo vệ: Hệ thống chỉ gửi email cho những người đạt trạng thái <strong>Fully Paid ({totalApproved} người)</strong>. Chống gửi email trùng lặp tự động.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="block text-[#A8A8A8] uppercase font-bold mb-1">Thời gian gửi chiến dịch</label>
                        <input
                          type="datetime-local"
                          value={dispatchDate}
                          onChange={(e) => setDispatchDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg bg-[#222222] border border-[#383838] text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[#A8A8A8] uppercase font-bold mb-1">Đối tượng nhận</label>
                        <input
                          type="text"
                          value={`Tất cả đã đóng đủ 100% (${totalApproved} người)`}
                          disabled
                          className="w-full px-3 py-2 rounded-lg bg-[#222222] border border-[#383838] text-[#F5C400] font-bold"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onSimulateEmailDispatch();
                        setDispatchSuccess(true);
                        setTimeout(() => setDispatchSuccess(false), 4000);
                      }}
                      className="w-full py-3 rounded-xl bg-[#F5C400] hover:bg-[#F8D879] text-[#111111] font-display text-xl uppercase tracking-wider font-black transition-colors"
                    >
                      KÍCH HOẠT GỬI EMAIL VÉ MỜI NGAY ↗
                    </button>

                    {dispatchSuccess && (
                      <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Đã kích hoạt gửi thành công vé mời QR và nhắc lịch cho {totalApproved} thành viên!</span>
                      </div>
                    )}
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
                            <ThumbsUp className="w-3 h-3" />
                            <span>Duyệt</span>
                          </button>
                          <button
                            onClick={() => handleModerateWish(w.id, 'REJECTED')}
                            className="px-2.5 py-1 rounded bg-[#D94C2B] hover:bg-red-700 text-white text-[11px] font-bold flex items-center gap-1"
                          >
                            <ThumbsDown className="w-3 h-3" />
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
                      <RefreshCw className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`} />
                      <span>{isSyncingSheets ? 'ĐANG ĐỒNG BỘ...' : 'ĐỒNG BỘ GOOGLE SHEETS NGAY ↗'}</span>
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
                  <X className="w-5 h-5" />
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
                  <option value="Giao dịch chưa khớp sao kê ngân hàng MB">Giao dịch chưa khớp sao kê ngân hàng MB</option>
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

      </div>
    </div>
  );
};
