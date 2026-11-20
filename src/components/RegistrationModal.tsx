import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, CheckCircle, ArrowRight, ArrowLeft, Upload, 
  Copy, Check, Sparkles, AlertCircle, HeartHandshake,
  UserCheck, ShieldAlert, FileText, Cake, Edit3, MessageSquare,
  HelpCircle, ExternalLink
} from 'lucide-react';
import { MemberDirectoryItem, PaymentPlan, RegistrationRecord } from '../types';
import { apiClient } from '../services/apiClient';
import { audioService } from '../services/audioService';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistrationComplete: (record: RegistrationRecord) => void;
  onOpenPortal?: () => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegistrationComplete,
  onOpenPortal
}) => {
  // 6-Screen Guided Flow:
  // Screen 1: Identity Verification (MSSV / Name Lookup)
  // Screen 2: Personalized Welcome (Alumni vs Member)
  // Screen 3: Payment Selection & VietQR (Full 100%, Deposit 100k, Deposit 150k + Receipt)
  // Screen 4: Participant Information (About you, Just in case, A little note)
  // Screen 5: Review & Confirm
  // Screen 6: Registration Success & Mascot Reveal
  const [screen, setScreen] = useState<number>(1);

  // Screen 1: Lookup state
  const [query, setQuery] = useState('');
  const [identifiedMember, setIdentifiedMember] = useState<MemberDirectoryItem | null>(null);
  const [searchError, setSearchError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Screen 3: Payment selection state
  const [plan, setPlan] = useState<PaymentPlan>('FULL');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [copiedBank, setCopiedBank] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState<{ [key: string]: string }>({});

  // Screen 4: Personal info & Wish state
  const [gmail, setGmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyNote, setAllergyNote] = useState('');
  const [wishes, setWishes] = useState('');
  const [isPublicConsent, setIsPublicConsent] = useState(true);
  const [infoErrors, setInfoErrors] = useState<{ [key: string]: string }>({});

  // Screen 6: Completed state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedRecord, setCompletedRecord] = useState<RegistrationRecord | null>(null);

  if (!isOpen) return null;

  // Pricing calculation
  const isAlumni = identifiedMember?.role === 'ALUMNI';
  const totalFee = isAlumni ? 449000 : 349000;
  
  let currentPayAmount = totalFee;
  if (plan === 'DEPOSIT_100') currentPayAmount = 100000;
  if (plan === 'DEPOSIT_150') currentPayAmount = 150000;
  const remainingAmount = totalFee - currentPayAmount;

  // VietQR Config
  const BANK_ID = 'MB';
  const ACCOUNT_NO = '0987654321';
  const ACCOUNT_NAME = 'CLB TRUYEN THONG COC SAI GON';
  const transferContent = `CSG26 ${identifiedMember?.mssv || 'KH'} ${phone || 'SDT'}`;
  const vietQrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${currentPayAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  // Screen 1: Verify member identity via API
  const handleIdentify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearchError('');
    setIsVerifying(true);
    try {
      const res = await apiClient.verifyMember(query);
      if (res.success && res.data) {
        setIdentifiedMember(res.data);
        setScreen(2); // Personalized welcome
      }
    } catch (err: unknown) {
      const error = err as Error;
      setSearchError(error.message || 'Không tìm thấy thông tin trong danh sách.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Screen 3: Handle Receipt Image Upload
  const handleReceiptUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setPaymentErrors(prev => ({ ...prev, receipt: 'Kích thước ảnh tối đa 10MB.' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        setPaymentErrors(prev => ({ ...prev, receipt: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  const toggleAllergy = (item: string) => {
    setAllergies(prev => 
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  // Validate Screen 3 (Payment)
  const validateScreen3 = () => {
    const errors: { [key: string]: string } = {};
    if (!receiptImage) errors.receipt = 'Vui lòng tải lên ảnh chụp màn hình biên lai chuyển khoản.';
    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate Screen 4 (Personal Info)
  const validateScreen4 = () => {
    const errors: { [key: string]: string } = {};
    if (!gmail.includes('@')) errors.gmail = 'Vui lòng nhập địa chỉ Gmail hợp lệ để nhận vé.';
    if (!phone || phone.length < 9) errors.phone = 'Vui lòng nhập số điện thoại cá nhân.';
    if (!emergencyPhone || emergencyPhone.length < 9) errors.emergencyPhone = 'Vui lòng nhập SĐT người thân đón về khi say tiệc.';

    setInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Final submit on Screen 5
  const handleFinalSubmit = async () => {
    if (!identifiedMember) return;

    setIsSubmitting(true);
    try {
      const record = await apiClient.createRegistration({
        memberId: identifiedMember.id,
        fullName: identifiedMember.fullName,
        mssv: identifiedMember.mssv,
        role: identifiedMember.role,
        honorific: identifiedMember.honorific,
        gmail,
        personalPhone: phone,
        emergencyPhone,
        allergies,
        allergyNote,
        plan,
        paymentPlan: plan,
        receiptImage,
        wishes: wishes.trim(),
        isPublicConsent
      });

      setCompletedRecord(record);
      onRegistrationComplete(record);

      // Play audio & Confetti celebration
      audioService.playCelebrationChime();
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F5C400', '#D94C2B', '#111111', '#3D6B45', '#F4F0E6']
      });

      setScreen(6); // Success screen
    } catch (err: unknown) {
      const error = err as Error;
      alert(error.message || 'Lỗi khi gửi đăng ký. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#111111]/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className="relative w-full max-w-2xl bg-[#F4F0E6] border-2 border-[#111111] rounded-2xl shadow-poster-lg overflow-hidden my-6 flex flex-col max-h-[92vh] animate-paper-unfold"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#111111] bg-[#FFFFFF]">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#F5C400] border-2 border-[#111111] flex items-center justify-center text-xl shadow-poster-sm">
              🐸
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg tracking-wider text-[#111111] uppercase">
                  CÓC SÀI GÒN 17Y
                </span>
                <span className="stamp-seal text-[9px]">
                  BƯỚC 0{screen} / 06
                </span>
              </div>
              <p className="text-[11px] font-body text-[#111111]/70">
                Đại tiệc kỷ niệm 17 năm • Đăng ký tham dự chính thức
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border-2 border-[#111111] hover:bg-[#F4F0E6] text-[#111111] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#EAE4D6] h-1.5 border-b border-[#111111]/20">
          <div 
            className="bg-[#F5C400] h-full transition-all duration-300"
            style={{ width: `${(screen / 6) * 100}%` }}
          />
        </div>

        {/* Wizard Screens Container */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 font-body">

          {/* ================= SCREEN 01: IDENTITY VERIFICATION ================= */}
          {screen === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center max-w-md mx-auto space-y-2">
                <span className="text-xs font-mono font-bold tracking-widest text-[#D94C2B] uppercase">
                  01 / 06 · IDENTITY VERIFICATION
                </span>
                <h3 className="text-4xl sm:text-5xl font-display uppercase tracking-tight text-[#111111]">
                  LET'S SEE WHO YOU ARE.
                </h3>
                <p className="text-sm text-[#111111]/75">
                  Nhập Mã số sinh viên (MSSV) hoặc Họ và tên để chúng mình tìm lại vị trí của bạn trong gia đình Cóc Sài Gòn.
                </p>
              </div>

              <form onSubmit={handleIdentify} className="max-w-md mx-auto space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                    MÃ SỐ SINH VIÊN HOẶC HỌ TÊN *
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="VD: SE120101 hoặc Huỳnh Tấn Phát"
                    className="w-full px-4 py-3.5 rounded-xl bg-white border-2 border-[#111111] text-[#111111] font-mono text-base focus:outline-none focus:ring-2 focus:ring-[#F5C400] shadow-poster-sm"
                    autoFocus
                  />
                  {searchError && (
                    <div className="mt-2 p-3 rounded-lg bg-red-50 border-2 border-[#D94C2B] text-[#D94C2B] text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{searchError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || !query.trim()}
                  className="btn-editorial-primary w-full py-4 rounded-xl font-display text-xl tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isVerifying ? 'ĐANG ĐỐI CHIẾU...' : 'TÌM TÊN CỦA BẠN ↗'}</span>
                </button>

                <div className="text-center pt-2">
                  <p className="text-xs text-[#111111]/60">
                    Chưa có tên trong danh sách?{' '}
                    <span className="text-[#D94C2B] font-bold underline cursor-pointer" onClick={() => alert('Vui lòng liên hệ Hotline BTC: 0987.654.321 (Thủ Quỹ) để được cập nhật vào danh sách whitelist!')}>
                      Liên hệ Ban tổ chức
                    </span>
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* ================= SCREEN 02: PERSONALIZED WELCOME ================= */}
          {screen === 2 && identifiedMember && (
            <div className="space-y-6 animate-fadeIn text-center max-w-lg mx-auto">
              <span className="text-xs font-mono font-bold tracking-widest text-[#D94C2B] uppercase">
                02 / 06 · WELCOME HOME
              </span>

              {/* Dynamic Personalized Letter */}
              {isAlumni ? (
                <div className="space-y-4">
                  <h3 className="text-4xl sm:text-5xl font-display uppercase tracking-tight text-[#111111] leading-none">
                    WELCOME BACK HOME,
                    <br />
                    <span className="text-[#D94C2B] underline decoration-[#F5C400] decoration-4">
                      {identifiedMember.honorific} {identifiedMember.fullName}!
                    </span>
                  </h3>
                  <div className="p-6 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111] shadow-poster text-left space-y-3 relative">
                    <span className="stamp-seal text-[10px] absolute -top-3 right-4">
                      CỰU THÀNH VIÊN · KHÓA {identifiedMember.generation || 'K14'}
                    </span>
                    <p className="font-handwriting text-2xl text-[#111111] leading-relaxed pt-2">
                      "Có những nơi dù đã đi qua, vẫn luôn có một chỗ dành cho mình để trở về. 17 năm Cóc Sài Gòn, tụi em mong được gặp lại {identifiedMember.honorific.toLowerCase()} trong đêm hội ngộ đặc biệt này."
                    </p>
                    <div className="pt-2 border-t border-[#111111]/15 text-xs text-[#111111]/60 font-mono">
                      📍 Điểm danh: {identifiedMember.department || 'Cựu thành viên'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-4xl sm:text-5xl font-display uppercase tracking-tight text-[#111111] leading-none">
                    HEY, {identifiedMember.fullName.toUpperCase()}!
                    <br />
                    <span className="text-[#D94C2B] underline decoration-[#F5C400] decoration-4">
                      YOU'RE STILL ONE OF US.
                    </span>
                  </h3>
                  <div className="p-6 rounded-2xl bg-[#FFFFFF] border-2 border-[#111111] shadow-poster text-left space-y-3 relative">
                    <span className="stamp-seal text-[10px] absolute -top-3 right-4">
                      THÀNH VIÊN ĐƯƠNG NHIỆM
                    </span>
                    <p className="font-handwriting text-2xl text-[#111111] leading-relaxed pt-2">
                      "Sẵn sàng cho một đêm cháy hết mình chưa? Sinh nhật 17 tuổi của Cóc Sài Gòn nhất định phải có mặt bạn để cùng thổi nến và quẩy tung nóc nhà!"
                    </p>
                    <div className="pt-2 border-t border-[#111111]/15 text-xs text-[#111111]/60 font-mono">
                      ⚡ Đội ngũ: {identifiedMember.department || 'Thành viên'}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen(1)}
                  className="btn-editorial-secondary flex-1 py-3.5 rounded-xl font-bold text-xs uppercase"
                >
                  ← Đổi người khác
                </button>
                <button
                  type="button"
                  onClick={() => setScreen(3)}
                  className="btn-editorial-primary flex-2 py-3.5 px-6 rounded-xl font-display text-xl tracking-wider uppercase flex items-center justify-center gap-2"
                >
                  <span>TIẾP TỤC ĐẾN BUỔI TIỆC ↗</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= SCREEN 03: PAYMENT SELECTION & VIETQR ================= */}
          {screen === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#111111] pb-3 flex items-end justify-between">
                <div>
                  <span className="text-xs font-mono font-bold tracking-widest text-[#D94C2B] uppercase">
                    03 / 06 · PAYMENT SELECTION
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-display uppercase tracking-tight text-[#111111]">
                    CHỌN HÌNH THỨC ĐÓNG PHÍ
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#111111]/60 block">
                    MỨC PHÍ DÀNH CHO BẠN
                  </span>
                  <span className="text-xl sm:text-2xl font-display font-black text-[#D94C2B]">
                    {totalFee.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>

              {/* 3 Payment Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setPlan('FULL')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    plan === 'FULL'
                      ? 'bg-[#F5C400] border-[#111111] shadow-poster-sm'
                      : 'bg-white border-[#111111] hover:bg-[#F4F0E6]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-bold uppercase">100% TRỌN GÓI</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#111111] text-[#F5C400] font-bold">KHUYÊN DÙNG</span>
                  </div>
                  <div className="text-xl font-display font-bold">{totalFee.toLocaleString('vi-VN')} đ</div>
                  <p className="text-[11px] text-[#111111]/70 mt-1">Hoàn tất ngay, nhận vé VIP sớm.</p>
                </div>

                <div
                  onClick={() => setPlan('DEPOSIT_150')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    plan === 'DEPOSIT_150'
                      ? 'bg-[#F5C400] border-[#111111] shadow-poster-sm'
                      : 'bg-white border-[#111111] hover:bg-[#F4F0E6]'
                  }`}
                >
                  <span className="text-xs font-mono font-bold uppercase block mb-1">ĐẶT CỌC 150K</span>
                  <div className="text-xl font-display font-bold">150.000 đ</div>
                  <p className="text-[11px] text-[#111111]/70 mt-1">Còn lại: {(totalFee - 150000).toLocaleString('vi-VN')}đ đóng sau.</p>
                </div>

                <div
                  onClick={() => setPlan('DEPOSIT_100')}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    plan === 'DEPOSIT_100'
                      ? 'bg-[#F5C400] border-[#111111] shadow-poster-sm'
                      : 'bg-white border-[#111111] hover:bg-[#F4F0E6]'
                  }`}
                >
                  <span className="text-xs font-mono font-bold uppercase block mb-1">ĐẶT CỌC 100K</span>
                  <div className="text-xl font-display font-bold">100.000 đ</div>
                  <p className="text-[11px] text-[#111111]/70 mt-1">Còn lại: {(totalFee - 100000).toLocaleString('vi-VN')}đ đóng sau.</p>
                </div>
              </div>

              {/* VietQR & Banking Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-white border-2 border-[#111111] shadow-poster-sm">
                {/* QR Code Container */}
                <div className="text-center flex flex-col items-center justify-center p-3 bg-[#F4F0E6] rounded-xl border-2 border-[#111111]">
                  <span className="text-xs font-mono font-bold text-[#111111] uppercase mb-2">
                    QUÉT MÃ VIETQR ĐỂ CHUYỂN KHOẢN
                  </span>
                  <div className="p-2 bg-white rounded-xl border-2 border-[#111111] inline-block shadow-sm">
                    <img
                      src={vietQrUrl}
                      alt="VietQR Chuyển khoản"
                      className="w-44 h-44 object-contain"
                    />
                  </div>
                  <span className="text-xs font-bold text-[#D94C2B] mt-2">
                    Số tiền: {currentPayAmount.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>

                {/* Bank Account Details & Transfer Memo */}
                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 bg-[#F4F0E6] rounded-xl border border-[#111111]">
                    <span className="text-[#111111]/60 block text-[10px] uppercase font-bold">Ngân hàng thụ hưởng</span>
                    <span className="font-bold text-sm text-[#111111]">MB Bank (Quân Đội)</span>
                  </div>

                  <div className="p-2.5 bg-[#F4F0E6] rounded-xl border border-[#111111] flex items-center justify-between">
                    <div>
                      <span className="text-[#111111]/60 block text-[10px] uppercase font-bold">Số tài khoản</span>
                      <span className="font-mono font-bold text-sm text-[#111111]">{ACCOUNT_NO}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(ACCOUNT_NO)}
                      className="px-2.5 py-1 rounded bg-[#111111] text-white text-[11px] font-bold"
                    >
                      {copiedBank ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </div>

                  <div className="p-2.5 bg-[#F4F0E6] rounded-xl border-2 border-[#D94C2B] flex items-center justify-between">
                    <div>
                      <span className="text-[#D94C2B] block text-[10px] uppercase font-bold">Nội dung chuyển khoản (bắt buộc)</span>
                      <span className="font-mono font-bold text-sm text-[#111111]">{transferContent}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(transferContent)}
                      className="px-2.5 py-1 rounded bg-[#D94C2B] text-white text-[11px] font-bold"
                    >
                      {copiedBank ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </div>

                  {/* Receipt Upload Area */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#111111] mb-1">
                      TẢI LÊN BIÊN LAI CHUYỂN KHOẢN *
                    </label>
                    <label className="border-2 border-dashed border-[#111111] rounded-xl p-3 bg-white flex items-center justify-center gap-2 cursor-pointer hover:bg-[#F4F0E6] transition-colors">
                      <Upload className="w-4 h-4 text-[#111111]" />
                      <span className="text-xs font-bold text-[#111111]">
                        {receiptImage ? '✓ Đã chọn ảnh biên lai (Nhấp để đổi)' : 'Chọn ảnh biên lai giao dịch'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptUpload}
                        className="hidden"
                      />
                    </label>
                    {paymentErrors.receipt && (
                      <p className="text-[11px] text-[#D94C2B] font-bold mt-1">{paymentErrors.receipt}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen(2)}
                  className="btn-editorial-secondary flex-1 py-3 rounded-xl font-bold text-xs uppercase"
                >
                  ← Quay lại
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateScreen3()) {
                      setScreen(4); // Go to participant info
                    }
                  }}
                  className="btn-editorial-primary flex-2 py-3 rounded-xl font-display text-xl uppercase tracking-wider"
                >
                  ĐIỀN THÔNG TIN THAM DỰ →
                </button>
              </div>
            </div>
          )}

          {/* ================= SCREEN 04: PARTICIPANT INFORMATION ================= */}
          {screen === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#111111] pb-3">
                <span className="text-xs font-mono font-bold tracking-widest text-[#D94C2B] uppercase">
                  04 / 06 · PARTICIPANT DETAILS
                </span>
                <h3 className="text-3xl sm:text-4xl font-display uppercase tracking-tight text-[#111111]">
                  THÔNG TIN CÁ NHÂN & LỜI CHÚC
                </h3>
              </div>

              <div className="space-y-4">
                {/* Block 1: About You */}
                <div className="p-4 rounded-xl bg-white border-2 border-[#111111] space-y-3">
                  <h4 className="text-xs font-mono font-bold text-[#111111] uppercase border-b border-[#111111]/15 pb-1.5">
                    1. VỀ BẠN (ABOUT YOU)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#111111] uppercase mb-1">
                        HỌ VÀ TÊN *
                      </label>
                      <input
                        type="text"
                        value={identifiedMember?.fullName || ''}
                        disabled
                        className="w-full px-3 py-2 rounded-lg bg-[#EAE4D6] border border-[#111111] text-xs font-bold text-[#111111]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#111111] uppercase mb-1">
                        GMAIL NHẬN VÉ QR *
                      </label>
                      <input
                        type="email"
                        value={gmail}
                        onChange={(e) => setGmail(e.target.value)}
                        placeholder="tenban@gmail.com"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#111111] text-xs font-mono text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#F5C400]"
                      />
                      {infoErrors.gmail && <p className="text-[10px] text-[#D94C2B] font-bold mt-0.5">{infoErrors.gmail}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-[#111111] uppercase mb-1">
                        SỐ ĐIỆN THOẠI CÁ NHÂN *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901234567"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#111111] text-xs font-mono text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#F5C400]"
                      />
                      {infoErrors.phone && <p className="text-[10px] text-[#D94C2B] font-bold mt-0.5">{infoErrors.phone}</p>}
                    </div>
                  </div>
                </div>

                {/* Block 2: Just in Case */}
                <div className="p-4 rounded-xl bg-white border-2 border-[#111111] space-y-3">
                  <h4 className="text-xs font-mono font-bold text-[#D94C2B] uppercase border-b border-[#111111]/15 pb-1.5 flex items-center justify-between">
                    <span>2. PHÒNG KHI CẦN (JUST IN CASE)</span>
                    <span className="text-[10px] font-normal text-[#111111]/60">Bảo mật nội bộ</span>
                  </h4>
                  <div>
                    <label className="block text-[11px] font-bold text-[#111111] uppercase mb-0.5">
                      SỐ ĐIỆN THOẠI NGƯỜI THÂN (LIÊN HỆ KHẨN CẤP / ĐÓN VỀ KHI SAY) *
                    </label>
                    <p className="text-[10px] text-[#111111]/60 mb-1.5">
                      Dành cho trường hợp bạn cần hỗ trợ hoặc cần người thân đến đón sau tiệc. Dữ liệu này chỉ Admin có quyền truy cập.
                    </p>
                    <input
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="SĐT bạn cùng phòng, người yêu hoặc gia đình..."
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#111111] text-xs font-mono text-[#111111] focus:outline-none focus:ring-1 focus:ring-[#F5C400]"
                    />
                    {infoErrors.emergencyPhone && <p className="text-[10px] text-[#D94C2B] font-bold mt-0.5">{infoErrors.emergencyPhone}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#111111] uppercase mb-1">
                      LƯU Ý DỊ ỨNG THỰC PHẨM / ĐỒ UỐNG (NẾU CÓ)
                    </label>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {['Hải sản', 'Đậu phộng', 'Không uống được cồn', 'Ăn chay'].map((item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleAllergy(item)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors ${
                            allergies.includes(item)
                              ? 'bg-[#D94C2B] text-white border-[#D94C2B]'
                              : 'bg-[#F4F0E6] text-[#111111] border-[#111111]/30 hover:border-[#111111]'
                          }`}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={allergyNote}
                      onChange={(e) => setAllergyNote(e.target.value)}
                      placeholder="Ghi chú dị ứng cụ thể khác nếu có..."
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#111111] text-xs text-[#111111]"
                    />
                  </div>
                </div>

                {/* Block 3: A Little Note (Birthday Wish) */}
                <div className="p-4 rounded-xl bg-white border-2 border-[#111111] space-y-2">
                  <div className="flex items-center justify-between border-b border-[#111111]/15 pb-1.5">
                    <h4 className="text-xs font-mono font-bold text-[#111111] uppercase">
                      3. LỜI CHÚC GỬI CÓC SÀI GÒN (A LITTLE NOTE)
                    </h4>
                    <span className="text-[10px] font-mono text-[#111111]/60">
                      {wishes.length} / 250 ký tự
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={250}
                    value={wishes}
                    onChange={(e) => setWishes(e.target.value)}
                    placeholder="Gửi một lời chúc mừng sinh nhật 17 năm tới CLB. Lời chúc sẽ xuất hiện cùng chú Cóc Áo Vàng đại diện của bạn trên Sân Khấu Kỷ Niệm!"
                    className="w-full px-3 py-2 rounded-lg bg-[#F4F0E6] border border-[#111111] text-xs text-[#111111] font-body focus:outline-none focus:ring-1 focus:ring-[#F5C400]"
                  />
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={isPublicConsent}
                      onChange={(e) => setIsPublicConsent(e.target.checked)}
                      className="rounded border-[#111111] text-[#F5C400] focus:ring-[#F5C400]"
                    />
                    <span className="text-[11px] text-[#111111]/80">
                      Đồng ý hiển thị lời chúc công khai tại Sân khấu Kỷ niệm 17Y
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen(3)}
                  className="btn-editorial-secondary flex-1 py-3 rounded-xl font-bold text-xs uppercase"
                >
                  ← Chọn lại thanh toán
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validateScreen4()) {
                      setScreen(5); // Go to review
                    }
                  }}
                  className="btn-editorial-primary flex-2 py-3 rounded-xl font-display text-xl uppercase tracking-wider"
                >
                  XEM LẠI & XÁC NHẬN →
                </button>
              </div>
            </div>
          )}

          {/* ================= SCREEN 05: REVIEW & CONFIRM ================= */}
          {screen === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#111111] pb-3">
                <span className="text-xs font-mono font-bold tracking-widest text-[#D94C2B] uppercase">
                  05 / 06 · REVIEW & CONFIRM
                </span>
                <h3 className="text-3xl sm:text-4xl font-display uppercase tracking-tight text-[#111111]">
                  XÁC NHẬN THÔNG TIN ĐĂNG KÝ
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                {/* Identity Review */}
                <div className="p-3.5 rounded-xl bg-white border-2 border-[#111111] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#111111]/60 uppercase block">Người tham dự</span>
                    <span className="font-bold text-sm text-[#111111]">{identifiedMember?.honorific} {identifiedMember?.fullName}</span>
                    <span className="text-xs text-[#111111]/70 block font-mono">MSSV: {identifiedMember?.mssv} • {isAlumni ? 'Cựu thành viên' : 'Thành viên'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen(1)}
                    className="p-1.5 rounded-lg border border-[#111111] hover:bg-[#F4F0E6] flex items-center gap-1 text-[11px] font-bold"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa</span>
                  </button>
                </div>

                {/* Payment Review */}
                <div className="p-3.5 rounded-xl bg-white border-2 border-[#111111] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#111111]/60 uppercase block">Gói & Biên lai thanh toán</span>
                    <span className="font-bold text-sm text-[#D94C2B]">
                      {plan === 'FULL' ? 'Đóng trọn gói 100%' : (plan === 'DEPOSIT_150' ? 'Đặt cọc 150.000đ' : 'Đặt cọc 100.000đ')}
                    </span>
                    <span className="text-xs text-[#111111]/70 block">
                      Đã nộp: {currentPayAmount.toLocaleString('vi-VN')}đ {remainingAmount > 0 && `(Còn lại: ${remainingAmount.toLocaleString('vi-VN')}đ)`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen(3)}
                    className="p-1.5 rounded-lg border border-[#111111] hover:bg-[#F4F0E6] flex items-center gap-1 text-[11px] font-bold"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa</span>
                  </button>
                </div>

                {/* Contact Review */}
                <div className="p-3.5 rounded-xl bg-white border-2 border-[#111111] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-[#111111]/60 uppercase block">Thông tin liên lạc</span>
                    <p>Gmail: <span className="font-mono font-bold">{gmail}</span></p>
                    <p>SĐT: <span className="font-mono font-bold">{phone}</span> • Người thân đón về: <span className="font-mono font-bold text-[#D94C2B]">{emergencyPhone}</span></p>
                    {allergies.length > 0 && (
                      <p className="text-[#D94C2B]">Dị ứng: {allergies.join(', ')} {allergyNote ? `(${allergyNote})` : ''}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen(4)}
                    className="p-1.5 rounded-lg border border-[#111111] hover:bg-[#F4F0E6] flex items-center gap-1 text-[11px] font-bold"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa</span>
                  </button>
                </div>

                {/* Wish Review */}
                {wishes && (
                  <div className="p-3.5 rounded-xl bg-[#FFFFFF] border-2 border-[#111111]">
                    <span className="text-[10px] font-mono text-[#111111]/60 uppercase block mb-1">Lời chúc gửi Cóc</span>
                    <p className="font-handwriting text-xl text-[#111111] leading-tight">"{wishes}"</p>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-xl bg-amber-50 border border-[#F5C400] text-xs text-[#111111]/80">
                🔒 Biên lai chuyển khoản của bạn sẽ được Ban Tổ Chức kiểm tra và duyệt vé chính thức. Khi đã duyệt đủ 100%, vé QR sẽ được phát hành.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen(4)}
                  className="btn-editorial-secondary flex-1 py-3.5 rounded-xl font-bold text-xs uppercase"
                >
                  ← Sửa thông tin
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="btn-editorial-primary flex-2 py-3.5 px-6 rounded-xl font-display text-2xl tracking-wider uppercase flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? 'ĐANG GỬI HỒ SƠ...' : 'HOÀN TẤT ĐĂNG KÝ ↗'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= SCREEN 06: REGISTRATION SUCCESS ================= */}
          {screen === 6 && completedRecord && (
            <div className="text-center space-y-6 py-4 animate-fadeIn">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-[#F5C400] border-2 border-[#111111] flex items-center justify-center text-4xl shadow-poster animate-bounce">
                🐸
              </div>

              <div className="space-y-1">
                <span className="text-xs font-mono font-bold tracking-widest text-[#D94C2B] uppercase">
                  REGISTRATION COMPLETED
                </span>
                <h3 className="text-4xl sm:text-5xl font-display uppercase tracking-tight text-[#111111]">
                  YOU'RE IN THE STORY NOW.
                </h3>
                <p className="text-sm text-[#111111]/75 max-w-md mx-auto">
                  Chào mừng {completedRecord.honorific} {completedRecord.fullName} đã chính thức có mặt tại Đại tiệc sinh nhật 17 năm Cóc Sài Gòn!
                </p>
              </div>

              {/* Status summary receipt */}
              <div className="p-4 rounded-xl bg-white border-2 border-[#111111] text-xs max-w-sm mx-auto text-left space-y-2 shadow-poster-sm">
                <div className="flex justify-between pb-1.5 border-b border-[#111111]/20">
                  <span className="text-[#111111]/60">Mã đăng ký:</span>
                  <span className="font-mono font-bold text-[#111111]">{completedRecord.id}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-[#111111]/20">
                  <span className="text-[#111111]/60">Số tiền đã nộp:</span>
                  <span className="font-bold text-[#111111]">{completedRecord.paidAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                {completedRecord.remainingAmount > 0 && (
                  <div className="flex justify-between pb-1.5 border-b border-[#111111]/20">
                    <span className="text-[#111111]/60">Số dư còn thiếu:</span>
                    <span className="font-bold text-[#D94C2B]">{completedRecord.remainingAmount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-[#111111]/60">Trạng thái:</span>
                  <span className="font-bold text-[#D99B26]">
                    Chờ BTC đối soát biên lai
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#111111]/70 max-w-sm mx-auto font-body">
                ✨ Nhân vật Cóc Áo Vàng đại diện cho bạn mang lời chúc vừa xuất hiện tại Sân Khấu Kỷ Niệm!
              </p>

              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenPortal) onOpenPortal();
                  }}
                  className="btn-editorial-secondary flex-1 py-3 rounded-xl font-bold text-xs uppercase"
                >
                  Xem Portal Vé & Thanh toán
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-editorial-primary flex-1 py-3 rounded-xl font-display text-xl uppercase tracking-wider"
                >
                  XEM SÂN KHẤU 17Y 🎉
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
