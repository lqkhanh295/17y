import React, { useState } from 'react';
import { 
  CloseIcon, SearchIcon, CheckCircleIcon, UploadIcon, AlertCircleIcon, 
  CalendarIcon, ExternalLinkIcon, CreditCardIcon, TicketIcon, AlertTriangleIcon,
  ArrowRightIcon, ArrowUpRightIcon
} from 'naive-icons';
import { RegistrationRecord, PaymentSubmission } from '../types';
import { apiClient } from '../services/apiClient';
import { compressImage } from '../utils/imageCompressor';
import { formatTransferContent } from '../utils/formatters';

interface PaymentLookupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export const PaymentLookupModal: React.FC<PaymentLookupModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [foundRecord, setFoundRecord] = useState<RegistrationRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  
  // Portal active tab: OVERVIEW | HISTORY | PAY_PHASE2 | TICKET
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HISTORY' | 'PAY_PHASE2' | 'TICKET'>('OVERVIEW');
  
  // Phase 2 receipt upload state
  const [receiptPhase2, setReceiptPhase2] = useState<string>('');
  const [copiedBank, setCopiedBank] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successSubmitted, setSuccessSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setSearchError('');
    setHasSearched(true);
    setSuccessSubmitted(false);

    try {
      const record = await apiClient.lookupRegistration(searchTerm);
      setFoundRecord(record);
      setActiveTab('OVERVIEW');
    } catch (err: unknown) {
      const error = err as Error;
      setFoundRecord(null);
      setSearchError(error.message || 'Không tìm thấy hồ sơ đăng ký.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1280, 0.82);
        setReceiptPhase2(compressed);
      } catch (err) {
        console.error('Compression failed:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPhase2(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmitPhase2 = async () => {
    if (!foundRecord || !receiptPhase2) return;

    setIsSubmitting(true);
    try {
      const updated = await apiClient.submitBalancePayment(foundRecord.id, receiptPhase2);
      setFoundRecord(updated);
      setSuccessSubmitted(true);
      setReceiptPhase2('');
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Lỗi khi cập nhật biên lai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const BANK_ID = 'ICB';
  const ACCOUNT_NO = '104881849322';
  const ACCOUNT_NAME = 'NGUYEN PHUONG THAO';
  const transferContent = formatTransferContent(foundRecord?.fullName || '', foundRecord?.personalPhone || '');
  const remainingDue = foundRecord ? (foundRecord.remainingAmount > 0 ? foundRecord.remainingAmount : Math.max(0, foundRecord.totalRequired - foundRecord.paidAmount)) : 0;
  const vietQrUrl = foundRecord ? `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${remainingDue}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}` : '';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  // Google Calendar generator
  const getGoogleCalendarUrl = (r: RegistrationRecord) => {
    const title = encodeURIComponent('Đại Tiệc Sinh Nhật 17 Năm CLB Truyền Thông Cóc Sài Gòn');
    const details = encodeURIComponent(`Chào mừng ${r.fullName} đến với CSG 17Y!\nMã vé Check-in của bạn: ${r.ticketCode}\nĐịa điểm: Đồi Sứ Villa.`);
    const location = encodeURIComponent('Đồi Sứ Villa');
    const start = '20261212T080000';
    const end = '20261212T220000';
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
  };

  const downloadIcsFile = (r: RegistrationRecord) => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Coc Sai Gon//CSG 17Y Event//VI
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:Đại Tiệc Sinh Nhật 17 Năm Cóc Sài Gòn (CSG 17Y)
DESCRIPTION:Vé Check-in: ${r.ticketCode} - Họ Tên: ${r.fullName}\\nĐêm hội ngộ 17 năm thanh xuân áo vàng!
LOCATION:Đồi Sứ Villa
DTSTART:20261212T010000Z
DTEND:20261212T150000Z
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT2H
ACTION:DISPLAY
DESCRIPTION:Nhắc lịch: Đại tiệc sinh nhật Cóc Sài Gòn 17Y (12.12.2026)!
END:VALARM
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `CSG17Y_Ticket_${r.mssv}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-[#20231F]/85 backdrop-blur-md overflow-y-auto animate-fadeIn pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <div 
        className="relative w-full max-w-3xl bg-[#F4EEDF] border-2 border-[#20231F] rounded-sm shadow-poster-lg overflow-hidden my-auto sm:my-6 flex flex-col max-h-[96dvh] sm:max-h-[92vh] animate-paper-unfold font-body"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b-2 border-[#20231F] bg-[#FFFFFF] shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-sm bg-[#F4C542] border-2 border-[#20231F] flex items-center justify-center shadow-poster-sm shrink-0">
              <TicketIcon size={20} className="text-[#20231F]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base sm:text-lg tracking-wider text-[#20231F] uppercase">
                  PARTICIPANT PORTAL
                </span>
                <span className="stamp-seal text-[9px]">
                  CỔNG THÀNH VIÊN
                </span>
              </div>
              <p className="text-[11px] text-[#20231F]/70">
                Tra cứu hồ sơ, đóng nốt số dư đợt 2 & nhận vé Check-in VIP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border-2 border-[#20231F] hover:bg-[#F4EEDF] text-[#20231F] transition-colors active:scale-95 shrink-0"
            title="Đóng cửa sổ"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3.5 sm:p-6 bg-[#FFFFFF] border-b-2 border-[#20231F] shrink-0">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon size={16} className="text-[#20231F]/50 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoCapitalize="characters"
                inputMode="text"
                placeholder="Nhập MSSV (VD: SE120101) hoặc Số điện thoại, Mã vé CSG17..."
                className="w-full pl-9 pr-3 py-2.5 min-h-[44px] rounded-sm bg-[#F4EEDF] border-2 border-[#20231F] text-base sm:text-xs font-mono text-[#20231F] focus:outline-none focus:ring-2 focus:ring-[#F4C542]"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !searchTerm.trim()}
              className="btn-editorial-primary px-4 sm:px-5 py-2.5 min-h-[44px] rounded-sm font-display text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-1.5 shrink-0 active:scale-95"
            >
              <SearchIcon size={16} />
              <span>{isLoading ? 'Đang tra...' : 'TRA CỨU'}</span>
            </button>
          </form>

          {searchError && (
            <div className="mt-3 p-3 rounded-lg bg-red-50 border-2 border-[#B94D35] text-[#B94D35] text-xs flex items-center gap-2">
              <AlertCircleIcon size={16} className="shrink-0" />
              <span>{searchError}</span>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!foundRecord && !hasSearched && (
            <div className="text-center py-12 text-[#20231F]/60 space-y-2">
              <div className="w-16 h-16 mx-auto rounded-sm bg-[#EAE4D6] border-2 border-[#20231F] flex items-center justify-center">
                <SearchIcon size={28} className="text-[#20231F]" />
              </div>
              <h4 className="font-display text-2xl text-[#20231F] uppercase tracking-wide">
                TRA CỨU VÉ & THÔNG TIN THANH TOÁN
              </h4>
              <p className="text-xs max-w-sm mx-auto">
                Nhập MSSV hoặc số điện thoại bạn đã dùng khi đăng ký để kiểm tra tiến độ duyệt vé hoặc đóng số dư còn lại.
              </p>
            </div>
          )}

          {foundRecord && (
            <div className="space-y-6 animate-fadeIn">
              {/* Navigation Tabs inside Portal */}
              <div className="flex border-b-2 border-[#20231F] pb-2 gap-2 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setActiveTab('OVERVIEW')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
                    activeTab === 'OVERVIEW'
                      ? 'bg-[#20231F] text-white'
                      : 'bg-[#FFFFFF] border border-[#20231F] text-[#20231F] hover:bg-[#F4EEDF]'
                  }`}
                >
                  Tổng quan hồ sơ
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('HISTORY')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
                    activeTab === 'HISTORY'
                      ? 'bg-[#20231F] text-white'
                      : 'bg-[#FFFFFF] border border-[#20231F] text-[#20231F] hover:bg-[#F4EEDF]'
                  }`}
                >
                  Lịch sử thanh toán
                </button>
                {foundRecord.remainingAmount > 0 && !foundRecord.isApproved100 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('PAY_PHASE2')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap ${
                      activeTab === 'PAY_PHASE2'
                        ? 'bg-[#B94D35] text-white'
                        : 'bg-[#FFFFFF] border border-[#B94D35] text-[#B94D35] hover:bg-red-50'
                    }`}
                  >
                    Đóng số dư đợt 2 ({remainingDue.toLocaleString('vi-VN')}đ)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveTab('TICKET')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'TICKET'
                      ? 'bg-[#3D6B45] text-white'
                      : 'bg-[#FFFFFF] border border-[#20231F] text-[#20231F] hover:bg-[#F4EEDF]'
                  }`}
                >
                  <TicketIcon size={14} />
                  <span>Vé Check-in QR</span>
                </button>
              </div>

              {/* ================= TAB 1: OVERVIEW ================= */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-4">
                  {/* Status Badges Header */}
                  <div className="p-4 rounded-sm bg-white border-2 border-[#20231F] shadow-poster-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-display uppercase tracking-wide text-[#20231F]">
                          CHÀO MỪNG TRỞ VỀ, {foundRecord.fullName.toUpperCase()}!
                        </h4>
                        <span className="stamp-seal text-[9px]">
                          {foundRecord.role === 'ALUMNI' ? 'CỰU THÀNH VIÊN' : 'THÀNH VIÊN'}
                        </span>
                      </div>
                      <p className="text-xs text-[#20231F]/70 font-mono mt-0.5">
                        Mã đăng ký: <span className="font-bold text-[#20231F]">{foundRecord.id}</span> • MSSV: {foundRecord.mssv}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border ${
                        foundRecord.isApproved100
                          ? 'bg-emerald-50 text-[#3D6B45] border-[#3D6B45]'
                          : foundRecord.status === 'REJECTED'
                          ? 'bg-red-50 text-[#B94D35] border-[#B94D35]'
                          : 'bg-amber-50 text-[#D99B26] border-[#D99B26]'
                      }`}>
                        {foundRecord.isApproved100 
                          ? 'ĐÃ DUYỆT 100%' 
                          : (foundRecord.status === 'REJECTED' ? 'BIÊN LAI BỊ TỪ CHỐI' : 'CHỜ DUYỆT ĐỐI SOÁT')}
                      </span>
                    </div>
                  </div>

                  {/* Rejected Warning Alert if applicable */}
                  {foundRecord.status === 'REJECTED' && (
                    <div className="p-4 rounded-sm bg-red-50 border-2 border-[#B94D35] text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-[#B94D35]">
                        <AlertTriangleIcon size={16} className="shrink-0" />
                        <span>Biên lai thanh toán chưa được xác nhận bởi Ban Tổ Chức</span>
                      </div>
                      <p className="text-[#20231F]/80 pl-6">
                        Lý do: <strong>{foundRecord.rejectReason || 'Ảnh chụp không rõ ràng hoặc không khớp cú pháp chuyển khoản.'}</strong>
                      </p>
                      <div className="pl-6 pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveTab('PAY_PHASE2')}
                          className="px-3 py-1.5 rounded-lg bg-[#B94D35] text-white font-bold text-[11px] uppercase inline-flex items-center gap-1.5"
                        >
                          <span>Tải lại biên lai hợp lệ ngay</span>
                          <ArrowRightIcon size={12} />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Payment Financial Summary */}
                  <div className="p-5 rounded-sm bg-white border-2 border-[#20231F] shadow-poster-sm space-y-3">
                    <div className="flex items-center justify-between border-b border-[#20231F]/15 pb-2">
                      <span className="text-xs font-mono font-bold text-[#20231F] uppercase">
                        TỔNG QUAN CHI PHÍ THAM DỰ
                      </span>
                      <span className="text-xs font-bold text-[#20231F]">
                        Gói {foundRecord.role === 'ALUMNI' ? 'Cựu thành viên' : 'Thành viên'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 sm:gap-3 text-center py-2">
                      <div className="p-2 sm:p-2.5 bg-[#F4EEDF] rounded-sm border border-[#20231F]">
                        <span className="text-[9px] sm:text-[10px] text-[#20231F]/60 block uppercase font-bold truncate">Tổng chi phí</span>
                        <span className="text-sm sm:text-lg font-display font-bold text-[#20231F] whitespace-nowrap block truncate">
                          {foundRecord.totalRequired.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div className="p-2 sm:p-2.5 bg-emerald-50 rounded-sm border border-[#3D6B45]">
                        <span className="text-[9px] sm:text-[10px] text-[#3D6B45] block uppercase font-bold truncate">Đã nộp</span>
                        <span className="text-sm sm:text-lg font-display font-bold text-[#3D6B45] whitespace-nowrap block truncate">
                          {foundRecord.paidAmount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div className="p-2 sm:p-2.5 bg-amber-50 rounded-sm border border-[#B94D35]">
                        <span className="text-[9px] sm:text-[10px] text-[#B94D35] block uppercase font-bold truncate">Còn thiếu</span>
                        <span className="text-sm sm:text-lg font-display font-bold text-[#B94D35] whitespace-nowrap block truncate">
                          {remainingDue.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-[11px] font-mono text-[#20231F]/70 mb-1">
                        <span>Tiến độ thanh toán</span>
                        <span>{Math.round((foundRecord.paidAmount / foundRecord.totalRequired) * 100)}%</span>
                      </div>
                      <div className="w-full bg-[#EAE4D6] h-2.5 rounded-full overflow-hidden border border-[#20231F]">
                        <div 
                          className="bg-[#F4C542] h-full"
                          style={{ width: `${Math.min(100, (foundRecord.paidAmount / foundRecord.totalRequired) * 100)}%` }}
                        />
                      </div>
                    </div>

                    {foundRecord.remainingAmount > 0 && !foundRecord.isApproved100 && (
                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setActiveTab('PAY_PHASE2')}
                          className="btn-editorial-primary px-4 py-2 rounded-sm text-xs font-bold uppercase flex items-center gap-1.5"
                        >
                          <CreditCardIcon size={14} />
                          <span>Đóng nốt {remainingDue.toLocaleString('vi-VN')}đ tại đây</span>
                          <ArrowRightIcon size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ================= TAB 2: PAYMENT HISTORY ================= */}
              {activeTab === 'HISTORY' && (
                <div className="space-y-4">
                  <div className="border-2 border-[#20231F] rounded-sm overflow-hidden bg-white shadow-poster-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#EAE4D6] text-[#20231F] uppercase font-mono font-bold border-b-2 border-[#20231F]">
                        <tr>
                          <th className="py-2.5 px-3">Đợt / Ngày nộp</th>
                          <th className="py-2.5 px-3">Số tiền</th>
                          <th className="py-2.5 px-3">Hình thức</th>
                          <th className="py-2.5 px-3">Biên lai</th>
                          <th className="py-2.5 px-3">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#20231F]/15 font-body">
                        {/* Phase 1 record */}
                        <tr className="hover:bg-[#F4EEDF]/50">
                          <td className="py-3 px-3">
                            <span className="font-bold text-[#20231F] block">Đợt 1 (Đăng ký)</span>
                            <span className="text-[10px] font-mono text-[#20231F]/60">
                              {new Date(foundRecord.createdAt).toLocaleDateString('vi-VN')}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold">
                            {(foundRecord.plan === 'FULL' ? foundRecord.totalRequired : (foundRecord.plan === 'DEPOSIT_150' ? 150000 : 100000)).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-3 px-3">Chuyển khoản VietQR</td>
                          <td className="py-3 px-3">
                            {foundRecord.receiptPhase1Url ? (
                              <a 
                                href={foundRecord.receiptPhase1Url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[#315D91] underline text-[11px] font-bold"
                              >
                                Xem ảnh
                              </a>
                            ) : 'Chưa có'}
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              foundRecord.isApproved100 
                                ? 'bg-emerald-100 text-[#3D6B45]' 
                                : 'bg-amber-100 text-[#D99B26]'
                            }`}>
                              {foundRecord.isApproved100 ? 'Đã xác minh' : 'Chờ kiểm tra'}
                            </span>
                          </td>
                        </tr>

                        {/* Phase 2 record if submitted */}
                        {foundRecord.receiptPhase2Url && (
                          <tr className="hover:bg-[#F4EEDF]/50">
                            <td className="py-3 px-3">
                              <span className="font-bold text-[#20231F] block">Đợt 2 (Bổ sung số dư)</span>
                              <span className="text-[10px] font-mono text-[#20231F]/60">Gần đây</span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-[#B94D35]">
                              {remainingDue.toLocaleString('vi-VN')} đ
                            </td>
                            <td className="py-3 px-3">Chuyển khoản VietQR</td>
                            <td className="py-3 px-3">
                              <a 
                                href={foundRecord.receiptPhase2Url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-[#315D91] underline text-[11px] font-bold"
                              >
                                Xem ảnh
                              </a>
                            </td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                foundRecord.isApproved100 
                                  ? 'bg-emerald-100 text-[#3D6B45]' 
                                  : 'bg-amber-100 text-[#D99B26]'
                              }`}>
                                {foundRecord.isApproved100 ? 'Đã xác minh' : 'Chờ kiểm tra'}
                              </span>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[11px] text-[#20231F]/60 italic font-mono">
                    * Lịch sử thanh toán được lưu trữ bất biến để đảm bảo tính minh bạch đối soát của BTC.
                  </p>
                </div>
              )}

              {/* ================= TAB 3: UPLOAD PHASE 2 ================= */}
              {activeTab === 'PAY_PHASE2' && (
                <div className="space-y-4">
                  {successSubmitted ? (
                    <div className="p-6 rounded-sm bg-emerald-50 border-2 border-[#3D6B45] text-center space-y-3">
                      <CheckCircleIcon size={48} className="text-[#3D6B45] mx-auto" />
                      <h4 className="font-display text-2xl text-[#20231F] uppercase">
                        ĐÃ GỬI BIÊN LAI ĐỢT 2 THÀNH CÔNG!
                      </h4>
                      <p className="text-xs text-[#20231F]/75 max-w-sm mx-auto">
                        Ban Tổ Chức đã nhận được ảnh chụp giao dịch bổ sung. Sau khi kiểm tra đối soát, vé QR sẽ tự động được phát hành cho bạn!
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('OVERVIEW')}
                        className="btn-editorial-primary px-5 py-2.5 rounded-sm font-bold text-xs uppercase"
                      >
                        Về trang tổng quan
                      </button>
                    </div>
                  ) : (
                    <div className="p-5 rounded-sm bg-white border-2 border-[#20231F] shadow-poster-sm space-y-4">
                      <div className="border-b border-[#20231F]/15 pb-2">
                        <h4 className="font-display text-2xl uppercase tracking-wide text-[#20231F]">
                          HOÀN TẤT SỐ DƯ CÒN THIẾU ({remainingDue.toLocaleString('vi-VN')} VNĐ)
                        </h4>
                        <p className="text-xs text-[#20231F]/70">
                          Quét mã VietQR dưới đây để thanh toán số tiền còn lại và tải lên biên lai giao dịch.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-[#F4EEDF] rounded-sm border-2 border-[#20231F]">
                          <img
                            src={vietQrUrl}
                            alt="VietQR Thanh toán đợt 2"
                            className="w-44 h-44 mx-auto object-contain bg-white p-2 rounded-lg border border-[#20231F]"
                          />
                          <span className="text-xs font-bold text-[#B94D35] block mt-1.5 font-mono">
                            Số tiền: {remainingDue.toLocaleString('vi-VN')} VNĐ
                          </span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                          <div className="p-2.5 bg-[#F4EEDF] rounded-sm border border-[#20231F] space-y-1">
                            <span className="text-[#20231F]/60 block text-[10px] uppercase font-bold">Tài khoản thụ hưởng VietinBank</span>
                            <div className="flex justify-between items-center">
                              <span className="font-mono font-bold text-sm text-[#20231F]">{ACCOUNT_NO}</span>
                              <span className="text-[11px] font-bold text-[#20231F]/80">VietinBank</span>
                            </div>
                            <span className="text-[11px] text-[#20231F]/70 block font-medium">Chủ TK: {ACCOUNT_NAME}</span>
                          </div>

                          <div className="p-2.5 bg-[#F4EEDF] rounded-sm border-2 border-[#B94D35] flex items-center justify-between">
                            <div>
                              <span className="text-[#B94D35] block text-[10px] uppercase font-bold">Nội dung chuyển khoản</span>
                              <span className="font-mono font-bold text-sm text-[#20231F]">{transferContent}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(transferContent)}
                              className="px-2.5 py-1 rounded bg-[#B94D35] text-white text-[11px] font-bold"
                            >
                              {copiedBank ? 'Đã chép' : 'Sao chép'}
                            </button>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold uppercase text-[#20231F] mb-1">
                              TẢI LÊN BIÊN LAI ĐỢT 2 *
                            </label>
                            <label className="border-2 border-dashed border-[#20231F] rounded-sm p-3 bg-white flex items-center justify-center gap-2 cursor-pointer hover:bg-[#F4EEDF] transition-colors">
                              <UploadIcon size={16} className="text-[#20231F]" />
                              <span className="text-xs font-bold text-[#20231F]">
                                {receiptPhase2 ? '✓ Đã chọn ảnh biên lai đợt 2' : 'Chọn ảnh biên lai giao dịch'}
                              </span>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleReceiptUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          disabled={isSubmitting || !receiptPhase2}
                          onClick={handleSubmitPhase2}
                          className="btn-editorial-primary px-6 py-3 rounded-sm font-display text-xl uppercase tracking-wider disabled:opacity-50 flex items-center gap-2"
                        >
                          <span>{isSubmitting ? 'ĐANG GỬI...' : 'XÁC NHẬN GỬI BIÊN LAI ĐỢT 2'}</span>
                          {!isSubmitting && <ArrowUpRightIcon size={18} />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ================= TAB 4: TICKET STUB ================= */}
              {activeTab === 'TICKET' && (
                <div className="space-y-4">
                  {!foundRecord.isApproved100 ? (
                    <div className="p-8 rounded-sm bg-white border-2 border-[#20231F] shadow-poster-sm text-center space-y-3">
                      <div className="w-14 h-14 mx-auto rounded-sm bg-amber-50 border-2 border-[#D99B26] flex items-center justify-center">
                        <AlertCircleIcon size={28} className="text-[#D99B26]" />
                      </div>
                      <h4 className="font-display text-2xl text-[#20231F] uppercase tracking-wide">
                        VÉ CHECK-IN CHƯA ĐƯỢC PHÁT HÀNH
                      </h4>
                      <p className="text-xs text-[#20231F]/75 max-w-md mx-auto">
                        Theo quy định của BTC, vé mời QR Check-in chính thức chỉ được phát hành cho những người đã thanh toán đủ 100% chi phí và được Admin xác nhận đối soát.
                      </p>
                      {foundRecord.remainingAmount > 0 && (
                        <button
                          type="button"
                          onClick={() => setActiveTab('PAY_PHASE2')}
                          className="btn-editorial-primary px-5 py-2.5 rounded-sm font-bold text-xs uppercase"
                        >
                          Hoàn tất số dư còn lại để nhận vé →
                        </button>
                      )}
                    </div>
                  ) : (
                    /* VIP Ticket Card */
                    <div className="p-6 rounded-sm bg-[#FFFFFF] border-2 border-[#20231F] shadow-poster-lg text-center space-y-4 relative overflow-hidden animate-fadeIn">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-[#20231F] font-mono font-bold uppercase border-b-2 border-[#20231F] pb-2">
                        <span className="truncate whitespace-nowrap">CLB TRUYỀN THÔNG CÓC SÀI GÒN</span>
                        <span className="stamp-seal text-[9px] whitespace-nowrap w-fit">VÉ CHECK-IN VIP 17Y</span>
                      </div>

                      <div>
                        <h3 className="text-3xl sm:text-4xl font-display font-black text-[#20231F] uppercase tracking-wide">
                          {foundRecord.fullName}
                        </h3>
                        <span className="text-xs text-[#20231F]/70 font-mono">
                          MSSV: {foundRecord.mssv} • {foundRecord.role === 'ALUMNI' ? 'Cựu Thành Viên' : 'Thành Viên Đương Nhiệm'}
                        </span>
                      </div>

                      {/* QR Code Container */}
                      <div className="p-3 bg-white border-2 border-[#20231F] rounded-sm inline-block shadow-poster-sm">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(foundRecord.ticketToken || foundRecord.ticketCode)}`}
                          alt="Mã QR Check-in VIP"
                          className="w-40 h-40"
                        />
                        <span className="text-xs font-mono font-bold text-[#20231F] block mt-1.5">
                          {foundRecord.ticketCode}
                        </span>
                      </div>

                      <div className="text-xs text-[#20231F] space-y-1">
                        <p><CalendarIcon size={14} className="inline mr-1" /> <strong>12.12.2026</strong></p>
                        <p><strong>Địa điểm: Đồi Sứ Villa</strong></p>
                      </div>

                      {/* Calendar Sync Buttons */}
                      <div className="pt-3 border-t-2 border-[#20231F] flex flex-col sm:flex-row gap-2">
                        <a
                          href={getGoogleCalendarUrl(foundRecord)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2.5 px-3 min-h-[44px] rounded-sm bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors active:scale-[0.98]"
                        >
                          <ExternalLinkIcon size={14} />
                          <span>Lưu Google Calendar</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => downloadIcsFile(foundRecord)}
                          className="btn-editorial-primary flex-1 py-2.5 px-3 min-h-[44px] rounded-sm font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98]"
                        >
                          <CalendarIcon size={14} />
                          <span>Tải tệp Apple/Outlook (.ics)</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
