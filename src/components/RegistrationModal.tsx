import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  X, CheckCircle, ArrowRight, ArrowLeft, Upload, 
  Copy, Check, Sparkles, AlertCircle, HeartHandshake,
  UserCheck, ShieldAlert, FileText, Cake, Edit3, MessageSquare,
  HelpCircle, ExternalLink
} from 'lucide-react';
import { MemberDirectoryItem, PaymentPlan, RegistrationRecord, MascotFrog } from '../types';
import { apiClient } from '../services/apiClient';
import { audioService } from '../services/audioService';
import { CelebrationStage } from './CelebrationStage';

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegistrationComplete: (record: RegistrationRecord) => void;
  onOpenPortal?: () => void;
  stageCharacters?: MascotFrog[];
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onRegistrationComplete,
  onOpenPortal,
  stageCharacters = []
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
  if (plan === 'DEPOSIT_150' || plan === 'DEPOSIT_100') currentPayAmount = 150000;
  const remainingAmount = totalFee - currentPayAmount;

  // VietQR Config
  const BANK_ID = 'MB';
  const ACCOUNT_NO = '0987654321';
  const ACCOUNT_NAME = 'CLB TRUYEN THONG COC SAI GON';
  const transferContent = `CSG26 ${identifiedMember?.mssv || 'KH'} ${phone || 'SDT'}`;
  const vietQrUrl = `https://img.vietqr.io/image/${BANK_ID}-${ACCOUNT_NO}-compact2.png?amount=${currentPayAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  // Screen 1: Verify member identity via API or auto-bypass
  const handleQuickBypass = (customName?: string) => {
    const rawName = (customName || query).trim() || 'Bạn Mới Của Cóc Sài Gòn';
    const isMssv = /^[A-Z]{2}[0-9]{6}$/i.test(rawName);
    const customMember: MemberDirectoryItem = {
      id: `m-custom-${Date.now()}`,
      mssv: isMssv ? rawName.toUpperCase() : `CSG-${Math.floor(100000 + Math.random() * 900000)}`,
      fullName: isMssv ? 'Thành viên Cóc Sài Gòn' : rawName,
      role: 'ACTIVE',
      honorific: 'Bạn',
      generation: 'Khóa 17',
      department: 'Gia đình Cóc Sài Gòn'
    };
    setIdentifiedMember(customMember);
    setSearchError('');
    setScreen(2);
  };

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
      } else {
        handleQuickBypass();
      }
    } catch {
      // Auto-bypass so any attendee is never blocked!
      handleQuickBypass();
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
        colors: ['#F4C542', '#B94D35', '#20231F', '#3D6B45', '#F4EEDF']
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-[#20231F]/90 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div 
        className={`relative w-full ${screen === 6 ? 'max-w-6xl' : 'max-w-2xl'} bg-[#F4EEDF] border-2 border-[#20231F] rounded-sm shadow-poster-lg overflow-hidden my-3 sm:my-6 flex flex-col max-h-[95vh] animate-paper-unfold`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b-2 border-[#20231F] bg-[#FFFFFF]">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-sm bg-[#F4C542] border-2 border-[#20231F] flex items-center justify-center text-xl shadow-poster-sm">
              🐸
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg tracking-wider text-[#20231F] uppercase">
                  CÓC SÀI GÒN 17Y
                </span>
                <span className="stamp-seal text-[9px]">
                  {screen === 6 ? 'SÂN KHẤU CÓC' : `BƯỚC 0${screen} / 06`}
                </span>
              </div>
              <p className="text-[11px] font-body text-[#20231F]/70">
                {screen === 6 ? 'Linh vật đại diện cho bạn đã lên sân khấu kỷ niệm 17 năm!' : 'Đại tiệc kỷ niệm 17 năm • Đăng ký tham dự chính thức'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-sm bg-[#20231F] text-white hover:bg-[#B94D35] text-xs font-mono font-bold uppercase transition-colors flex items-center gap-1.5 shadow-sm"
            title="Thoát ra trang chủ"
          >
            <X className="w-4 h-4" />
            <span className="hidden sm:inline">VỀ TRANG CHỦ</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#EAE4D6] h-1.5 border-b border-[#20231F]/20">
          <div 
            className="bg-[#F4C542] h-full transition-all duration-300"
            style={{ width: `${(screen / 6) * 100}%` }}
          />
        </div>

        {/* Wizard Screens Container */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 font-body">

          {/* ================= SCREEN 01: IDENTITY VERIFICATION ================= */}
          {screen === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center max-w-md mx-auto space-y-2">
                <span className="text-xs font-mono font-bold tracking-widest text-[#B94D35] uppercase">
                  01 / 06 · IDENTITY VERIFICATION
                </span>
                <h3 className="text-4xl sm:text-5xl font-display uppercase tracking-tight text-[#20231F]">
                  LET'S SEE WHO YOU ARE.
                </h3>
                <p className="text-sm text-[#20231F]/75">
                  Nhập Mã số sinh viên (MSSV) hoặc Họ và tên để chúng mình tìm lại vị trí của bạn trong gia đình Cóc Sài Gòn.
                </p>
              </div>

              <form onSubmit={handleIdentify} className="max-w-md mx-auto space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#20231F] mb-1.5">
                    MÃ SỐ SINH VIÊN HOẶC HỌ TÊN *
                  </label>
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      if (searchError) setSearchError('');
                    }}
                    placeholder="VD: SE120101 hoặc Nguyễn Tiến Cường"
                    className="w-full px-4 py-3.5 rounded-sm bg-white border-2 border-[#20231F] text-[#20231F] font-mono text-base focus:outline-none focus:ring-2 focus:ring-[#F4C542] shadow-poster-sm"
                    autoFocus
                  />
                  {searchError && (
                    <div className="mt-2 p-3 rounded-lg bg-red-50 border-2 border-[#B94D35] text-[#B94D35] text-xs space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{searchError}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleQuickBypass()}
                        className="w-full py-2 px-3 bg-[#B94D35] text-white font-bold rounded-sm text-center hover:bg-[#20231F] transition-colors"
                      >
                        Tiếp tục đăng ký với tên "{query.trim() || 'Khách mời'}" ↗
                      </button>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || !query.trim()}
                  className="btn-editorial-primary w-full py-4 rounded-sm font-display text-xl tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{isVerifying ? 'ĐANG ĐỐI CHIẾU...' : 'TÌM TÊN CỦA BẠN ↗'}</span>
                </button>

                <div className="pt-2 text-center space-y-2.5">
                  <button
                    type="button"
                    onClick={() => handleQuickBypass()}
                    className="w-full py-2.5 px-4 rounded-sm border-2 border-dashed border-[#20231F]/40 bg-[#FFFFFF]/80 hover:bg-[#FFFFFF] text-xs font-mono font-bold uppercase tracking-wider text-[#20231F] hover:border-[#20231F] transition-all flex items-center justify-center gap-2 shadow-poster-sm"
                  >
                    <Sparkles className="w-4 h-4 text-[#B94D35]" />
                    <span>⚡ Bỏ qua tra cứu · Đăng ký tự do ngay ↗</span>
                  </button>

                  <p className="text-[11px] text-[#20231F]/65 font-body">
                    Chưa có trong danh bạ? Mọi thành viên & bạn bè đều được chào đón tham dự!
                  </p>
                </div>
              </form>
            </div>
          )}

          {/* ================= SCREEN 02: PERSONALIZED WELCOME ================= */}
          {screen === 2 && identifiedMember && (
            <div className="space-y-6 animate-fadeIn text-center max-w-lg mx-auto">
              <span className="text-xs font-mono font-bold tracking-widest text-[#B94D35] uppercase">
                02 / 06 · WELCOME HOME
              </span>

              {/* Dynamic Personalized Letter */}
              {isAlumni ? (
                <div className="space-y-4">
                  <h3 className="text-4xl sm:text-5xl font-display uppercase tracking-tight text-[#20231F] leading-none">
                    WELCOME BACK HOME,
                    <br />
                    <span className="text-[#B94D35] underline decoration-[#F4C542] decoration-4">
                      {identifiedMember.honorific} {identifiedMember.fullName}!
                    </span>
                  </h3>
                  <div className="p-6 rounded-sm bg-[#FFFFFF] border-2 border-[#20231F] shadow-poster text-left space-y-3 relative">
                    <span className="stamp-seal text-[10px] absolute -top-3 right-4">
                      CỰU THÀNH VIÊN · KHÓA {identifiedMember.generation || 'K14'}
                    </span>
                    <p className="font-handwriting text-2xl text-[#20231F] leading-relaxed pt-2">
                      "Có những nơi dù đã đi qua, vẫn luôn có một chỗ dành cho mình để trở về. 17 năm Cóc Sài Gòn, tụi em mong được gặp lại {identifiedMember.honorific.toLowerCase()} trong đêm hội ngộ đặc biệt này."
                    </p>
                    <div className="pt-2 border-t border-[#20231F]/15 text-xs text-[#20231F]/60 font-mono">
                      📍 Điểm danh: {identifiedMember.department || 'Cựu thành viên'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-4xl sm:text-5xl font-display uppercase tracking-tight text-[#20231F] leading-none">
                    HEY, {identifiedMember.fullName.toUpperCase()}!
                    <br />
                    <span className="text-[#B94D35] underline decoration-[#F4C542] decoration-4">
                      YOU'RE STILL ONE OF US.
                    </span>
                  </h3>
                  <div className="p-6 rounded-sm bg-[#FFFFFF] border-2 border-[#20231F] shadow-poster text-left space-y-3 relative">
                    <span className="stamp-seal text-[10px] absolute -top-3 right-4">
                      THÀNH VIÊN ĐƯƠNG NHIỆM
                    </span>
                    <p className="font-handwriting text-2xl text-[#20231F] leading-relaxed pt-2">
                      "Sẵn sàng cho một đêm cháy hết mình chưa? Sinh nhật 17 tuổi của Cóc Sài Gòn nhất định phải có mặt bạn để cùng thổi nến và quẩy tung nóc nhà!"
                    </p>
                    <div className="pt-2 border-t border-[#20231F]/15 text-xs text-[#20231F]/60 font-mono">
                      ⚡ Đội ngũ: {identifiedMember.department || 'Thành viên'}
                    </div>
                  </div>
                </div>
              )}

              {/* Role & Ticket Tier Switcher */}
              <div className="p-3 bg-[#FFFFFF] border-2 border-[#20231F] rounded-sm space-y-2 text-left shadow-poster-sm">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#20231F]/70 block">
                  XÁC NHẬN HẠNG VÉ / VAI TRÒ CỦA BẠN:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIdentifiedMember(prev => prev ? { ...prev, role: 'ALUMNI', honorific: prev.honorific === 'Chị' ? 'Chị' : 'Anh' } : null)}
                    className={`py-2 px-2 rounded-sm text-xs font-mono font-bold border-2 transition-all text-center ${isAlumni ? 'bg-[#20231F] text-white border-[#20231F] shadow-sm' : 'bg-[#F4EEDF] text-[#20231F] border-[#20231F]/30 hover:border-[#20231F]'}`}
                  >
                    🎓 Cựu Thành Viên (449k)
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdentifiedMember(prev => prev ? { ...prev, role: 'ACTIVE', honorific: 'Bạn' } : null)}
                    className={`py-2 px-2 rounded-sm text-xs font-mono font-bold border-2 transition-all text-center ${!isAlumni ? 'bg-[#20231F] text-white border-[#20231F] shadow-sm' : 'bg-[#F4EEDF] text-[#20231F] border-[#20231F]/30 hover:border-[#20231F]'}`}
                  >
                    ⚡ Thành Viên / Khách Mời (349k)
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen(1)}
                  className="btn-editorial-secondary flex-1 py-3.5 rounded-sm font-bold text-xs uppercase"
                >
                  ← Đổi người khác
                </button>
                <button
                  type="button"
                  onClick={() => setScreen(3)}
                  className="btn-editorial-primary flex-2 py-3.5 px-6 rounded-sm font-display text-xl tracking-wider uppercase flex items-center justify-center gap-2"
                >
                  <span>TIẾP TỤC ĐẾN BUỔI TIỆC ↗</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= SCREEN 03: PAYMENT SELECTION & VIETQR ================= */}
          {screen === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#20231F] pb-3 flex items-end justify-between">
                <div>
                  <span className="text-xs font-mono font-bold tracking-widest text-[#B94D35] uppercase">
                    03 / 06 · PAYMENT SELECTION
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-display uppercase tracking-tight text-[#20231F]">
                    CHỌN HÌNH THỨC ĐÓNG PHÍ
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#20231F]/60 block">
                    MỨC PHÍ DÀNH CHO BẠN
                  </span>
                  <span className="text-xl sm:text-2xl font-display font-black text-[#B94D35]">
                    {totalFee.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>

              {/* 2 Payment Options: 100% Trọn Gói & Đặt Cọc 150K */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div
                  onClick={() => setPlan('FULL')}
                  className={`p-4 rounded-sm border-2 cursor-pointer transition-all ${
                    plan === 'FULL'
                      ? 'bg-[#F4C542] border-[#20231F] shadow-poster-sm'
                      : 'bg-white border-[#20231F] hover:bg-[#F4EEDF]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-bold uppercase">100% TRỌN GÓI</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#20231F] text-[#F4C542] font-bold">KHUYÊN DÙNG</span>
                  </div>
                  <div className="text-2xl font-display font-bold">{totalFee.toLocaleString('vi-VN')} đ</div>
                  <p className="text-[11px] text-[#20231F]/70 mt-1">Hoàn tất ngay, nhận vé VIP chính thức sớm.</p>
                </div>

                <div
                  onClick={() => setPlan('DEPOSIT_150')}
                  className={`p-4 rounded-sm border-2 cursor-pointer transition-all ${
                    plan === 'DEPOSIT_150'
                      ? 'bg-[#F4C542] border-[#20231F] shadow-poster-sm'
                      : 'bg-white border-[#20231F] hover:bg-[#F4EEDF]'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-mono font-bold uppercase">ĐẶT CỌC GIỮ CHỖ</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#B94D35] text-white font-bold">CỌC 150K</span>
                  </div>
                  <div className="text-2xl font-display font-bold">150.000 đ</div>
                  <p className="text-[11px] text-[#20231F]/70 mt-1">Còn lại: {(totalFee - 150000).toLocaleString('vi-VN')}đ đóng sau trước sự kiện.</p>
                </div>
              </div>

              {/* VietQR & Banking Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-sm bg-white border-2 border-[#20231F] shadow-poster-sm">
                {/* QR Code Container */}
                <div className="text-center flex flex-col items-center justify-center p-3 bg-[#F4EEDF] rounded-sm border-2 border-[#20231F]">
                  <span className="text-xs font-mono font-bold text-[#20231F] uppercase mb-2">
                    QUÉT MÃ VIETQR ĐỂ CHUYỂN KHOẢN
                  </span>
                  <div className="p-2 bg-white rounded-sm border-2 border-[#20231F] inline-block shadow-sm">
                    <img
                      src={vietQrUrl}
                      alt="VietQR Chuyển khoản"
                      className="w-44 h-44 object-contain"
                    />
                  </div>
                  <span className="text-xs font-bold text-[#B94D35] mt-2">
                    Số tiền: {currentPayAmount.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>

                {/* Bank Account Details & Transfer Memo */}
                <div className="space-y-2.5 text-xs">
                  <div className="p-2.5 bg-[#F4EEDF] rounded-sm border border-[#20231F]">
                    <span className="text-[#20231F]/60 block text-[10px] uppercase font-bold">Ngân hàng thụ hưởng</span>
                    <span className="font-bold text-sm text-[#20231F]">MB Bank (Quân Đội)</span>
                  </div>

                  <div className="p-2.5 bg-[#F4EEDF] rounded-sm border border-[#20231F] flex items-center justify-between">
                    <div>
                      <span className="text-[#20231F]/60 block text-[10px] uppercase font-bold">Số tài khoản</span>
                      <span className="font-mono font-bold text-sm text-[#20231F]">{ACCOUNT_NO}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(ACCOUNT_NO)}
                      className="px-2.5 py-1 rounded bg-[#20231F] text-white text-[11px] font-bold"
                    >
                      {copiedBank ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </div>

                  <div className="p-2.5 bg-[#F4EEDF] rounded-sm border-2 border-[#B94D35] flex items-center justify-between">
                    <div>
                      <span className="text-[#B94D35] block text-[10px] uppercase font-bold">Nội dung chuyển khoản (bắt buộc)</span>
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

                  {/* Receipt Upload Area with Preview & Remove/Replace */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-[#20231F] mb-1">
                      TẢI LÊN BIÊN LAI CHUYỂN KHOẢN (ẢNH CHỤP / HÓA ĐƠN) *
                    </label>

                    {receiptImage ? (
                      <div className="p-3 bg-white border-2 border-[#20231F] flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={receiptImage}
                            alt="Biên lai đã chọn"
                            className="w-14 h-14 object-cover border border-[#20231F]"
                          />
                          <div>
                            <span className="text-xs font-bold text-emerald-800 block">✓ Đã đính kèm ảnh biên lai</span>
                            <span className="text-[10px] font-mono text-[#20231F]/60">Sẵn sàng để BTC đối soát</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="px-2.5 py-1.5 bg-[#EAE4D6] hover:bg-[#F4EEDF] border border-[#20231F] text-xs font-bold cursor-pointer transition-colors">
                            <span>Thay ảnh</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={handleReceiptUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setReceiptImage('')}
                            className="px-2.5 py-1.5 bg-red-100 hover:bg-red-200 text-[#B94D35] border border-[#B94D35] text-xs font-bold transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-[#20231F] p-4 bg-white flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-[#F4EEDF] transition-colors">
                        <Upload className="w-5 h-5 text-[#20231F]" />
                        <span className="text-xs font-bold text-[#20231F]">
                          Nhấp để tải lên ảnh chụp màn hình chuyển khoản
                        </span>
                        <span className="text-[10px] font-mono text-[#20231F]/60">
                          Hỗ trợ định dạng JPG, PNG, WEBP (Tối đa 10MB)
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleReceiptUpload}
                          className="hidden"
                        />
                      </label>
                    )}

                    {paymentErrors.receipt && (
                      <p className="text-[11px] text-[#B94D35] font-bold mt-1">{paymentErrors.receipt}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen(2)}
                  className="btn-editorial-secondary flex-1 py-3 rounded-sm font-bold text-xs uppercase"
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
                  className="btn-editorial-primary flex-2 py-3 rounded-sm font-display text-xl uppercase tracking-wider"
                >
                  ĐIỀN THÔNG TIN THAM DỰ →
                </button>
              </div>
            </div>
          )}

          {/* ================= SCREEN 04: PARTICIPANT INFORMATION ================= */}
          {screen === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#20231F] pb-3">
                <span className="text-xs font-mono font-bold tracking-widest text-[#B94D35] uppercase">
                  04 / 06 · PARTICIPANT DETAILS
                </span>
                <h3 className="text-3xl sm:text-4xl font-display uppercase tracking-tight text-[#20231F]">
                  THÔNG TIN CÁ NHÂN & LỜI CHÚC
                </h3>
              </div>

              <div className="space-y-4">
                {/* Block 1: About You */}
                <div className="p-4 rounded-sm bg-white border-2 border-[#20231F] space-y-3">
                  <h4 className="text-xs font-mono font-bold text-[#20231F] uppercase border-b border-[#20231F]/15 pb-1.5">
                    1. VỀ BẠN (ABOUT YOU)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#20231F] uppercase mb-1">
                        HỌ VÀ TÊN *
                      </label>
                      <input
                        type="text"
                        value={identifiedMember?.fullName || ''}
                        onChange={(e) => setIdentifiedMember(prev => prev ? { ...prev, fullName: e.target.value } : null)}
                        placeholder="Họ và tên của bạn"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#20231F] text-xs font-bold text-[#20231F] focus:outline-none focus:ring-1 focus:ring-[#F4C542]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#20231F] uppercase mb-1">
                        GMAIL NHẬN VÉ QR *
                      </label>
                      <input
                        type="email"
                        value={gmail}
                        onChange={(e) => setGmail(e.target.value)}
                        placeholder="tenban@gmail.com"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#20231F] text-xs font-mono text-[#20231F] focus:outline-none focus:ring-1 focus:ring-[#F4C542]"
                      />
                      {infoErrors.gmail && <p className="text-[10px] text-[#B94D35] font-bold mt-0.5">{infoErrors.gmail}</p>}
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-[#20231F] uppercase mb-1">
                        SỐ ĐIỆN THOẠI CÁ NHÂN *
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0901234567"
                        className="w-full px-3 py-2 rounded-lg bg-white border border-[#20231F] text-xs font-mono text-[#20231F] focus:outline-none focus:ring-1 focus:ring-[#F4C542]"
                      />
                      {infoErrors.phone && <p className="text-[10px] text-[#B94D35] font-bold mt-0.5">{infoErrors.phone}</p>}
                    </div>
                  </div>
                </div>

                {/* Block 2: Just in Case */}
                <div className="p-4 rounded-sm bg-white border-2 border-[#20231F] space-y-3">
                  <h4 className="text-xs font-mono font-bold text-[#B94D35] uppercase border-b border-[#20231F]/15 pb-1.5 flex items-center justify-between">
                    <span>2. PHÒNG KHI CẦN (JUST IN CASE)</span>
                    <span className="text-[10px] font-normal text-[#20231F]/60">Bảo mật nội bộ</span>
                  </h4>
                  <div>
                    <label className="block text-[11px] font-bold text-[#20231F] uppercase mb-0.5">
                      SỐ ĐIỆN THOẠI NGƯỜI THÂN (LIÊN HỆ KHẨN CẤP / ĐÓN VỀ KHI SAY) *
                    </label>
                    <p className="text-[10px] text-[#20231F]/60 mb-1.5">
                      Dành cho trường hợp bạn cần hỗ trợ hoặc cần người thân đến đón sau tiệc. Dữ liệu này chỉ Admin có quyền truy cập.
                    </p>
                    <input
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      placeholder="SĐT bạn cùng phòng, người yêu hoặc gia đình..."
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#20231F] text-xs font-mono text-[#20231F] focus:outline-none focus:ring-1 focus:ring-[#F4C542]"
                    />
                    {infoErrors.emergencyPhone && <p className="text-[10px] text-[#B94D35] font-bold mt-0.5">{infoErrors.emergencyPhone}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#20231F] uppercase mb-1">
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
                              ? 'bg-[#B94D35] text-white border-[#B94D35]'
                              : 'bg-[#F4EEDF] text-[#20231F] border-[#20231F]/30 hover:border-[#20231F]'
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
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#20231F] text-xs text-[#20231F]"
                    />
                  </div>
                </div>

                {/* Block 3: A Little Note (Birthday Wish) */}
                <div className="p-4 rounded-sm bg-white border-2 border-[#20231F] space-y-2">
                  <div className="flex items-center justify-between border-b border-[#20231F]/15 pb-1.5">
                    <h4 className="text-xs font-mono font-bold text-[#20231F] uppercase">
                      3. LỜI CHÚC GỬI CÓC SÀI GÒN (A LITTLE NOTE)
                    </h4>
                    <span className="text-[10px] font-mono text-[#20231F]/60">
                      {wishes.length} / 250 ký tự
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={250}
                    value={wishes}
                    onChange={(e) => setWishes(e.target.value)}
                    placeholder="Gửi một lời chúc mừng sinh nhật 17 năm tới CLB. Lời chúc sẽ xuất hiện cùng chú Cóc Áo Vàng đại diện của bạn trên Sân Khấu Kỷ Niệm!"
                    className="w-full px-3 py-2 rounded-lg bg-[#F4EEDF] border border-[#20231F] text-xs text-[#20231F] font-body focus:outline-none focus:ring-1 focus:ring-[#F4C542]"
                  />
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={isPublicConsent}
                      onChange={(e) => setIsPublicConsent(e.target.checked)}
                      className="rounded border-[#20231F] text-[#F4C542] focus:ring-[#F4C542]"
                    />
                    <span className="text-[11px] text-[#20231F]/80">
                      Đồng ý hiển thị lời chúc công khai tại Sân khấu Kỷ niệm 17Y
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen(3)}
                  className="btn-editorial-secondary flex-1 py-3 rounded-sm font-bold text-xs uppercase"
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
                  className="btn-editorial-primary flex-2 py-3 rounded-sm font-display text-xl uppercase tracking-wider"
                >
                  XEM LẠI & XÁC NHẬN →
                </button>
              </div>
            </div>
          )}

          {/* ================= SCREEN 05: REVIEW & CONFIRM ================= */}
          {screen === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#20231F] pb-3">
                <span className="text-xs font-mono font-bold tracking-widest text-[#B94D35] uppercase">
                  05 / 06 · REVIEW & CONFIRM
                </span>
                <h3 className="text-3xl sm:text-4xl font-display uppercase tracking-tight text-[#20231F]">
                  XÁC NHẬN THÔNG TIN ĐĂNG KÝ
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                {/* Identity Review */}
                <div className="p-3.5 rounded-sm bg-white border-2 border-[#20231F] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#20231F]/60 uppercase block">Người tham dự</span>
                    <span className="font-bold text-sm text-[#20231F]">{identifiedMember?.honorific} {identifiedMember?.fullName}</span>
                    <span className="text-xs text-[#20231F]/70 block font-mono">MSSV: {identifiedMember?.mssv} • {isAlumni ? 'Cựu thành viên' : 'Thành viên'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen(1)}
                    className="p-1.5 rounded-lg border border-[#20231F] hover:bg-[#F4EEDF] flex items-center gap-1 text-[11px] font-bold"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa</span>
                  </button>
                </div>

                {/* Payment Review */}
                <div className="p-3.5 rounded-sm bg-white border-2 border-[#20231F] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#20231F]/60 uppercase block">Gói & Biên lai thanh toán</span>
                    <span className="font-bold text-sm text-[#B94D35]">
                      {plan === 'FULL' ? 'Đóng trọn gói 100%' : 'Đặt cọc giữ chỗ 150.000đ'}
                    </span>
                    <span className="text-xs text-[#20231F]/70 block">
                      Đã nộp: {currentPayAmount.toLocaleString('vi-VN')}đ {remainingAmount > 0 && `(Còn lại: ${remainingAmount.toLocaleString('vi-VN')}đ)`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen(3)}
                    className="p-1.5 rounded-lg border border-[#20231F] hover:bg-[#F4EEDF] flex items-center gap-1 text-[11px] font-bold"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa</span>
                  </button>
                </div>

                {/* Contact Review */}
                <div className="p-3.5 rounded-sm bg-white border-2 border-[#20231F] flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-[#20231F]/60 uppercase block">Thông tin liên lạc</span>
                    <p>Gmail: <span className="font-mono font-bold">{gmail}</span></p>
                    <p>SĐT: <span className="font-mono font-bold">{phone}</span> • Người thân đón về: <span className="font-mono font-bold text-[#B94D35]">{emergencyPhone}</span></p>
                    {allergies.length > 0 && (
                      <p className="text-[#B94D35]">Dị ứng: {allergies.join(', ')} {allergyNote ? `(${allergyNote})` : ''}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen(4)}
                    className="p-1.5 rounded-lg border border-[#20231F] hover:bg-[#F4EEDF] flex items-center gap-1 text-[11px] font-bold"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>Sửa</span>
                  </button>
                </div>

                {/* Wish Review */}
                {wishes && (
                  <div className="p-3.5 rounded-sm bg-[#FFFFFF] border-2 border-[#20231F]">
                    <span className="text-[10px] font-mono text-[#20231F]/60 uppercase block mb-1">Lời chúc gửi Cóc</span>
                    <p className="font-handwriting text-xl text-[#20231F] leading-tight">"{wishes}"</p>
                  </div>
                )}
              </div>

              <div className="p-3 rounded-sm bg-amber-50 border border-[#F4C542] text-xs text-[#20231F]/80">
                🔒 Biên lai chuyển khoản của bạn sẽ được Ban Tổ Chức kiểm tra và duyệt vé chính thức. Khi đã duyệt đủ 100%, vé QR sẽ được phát hành.
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen(4)}
                  className="btn-editorial-secondary flex-1 py-3.5 rounded-sm font-bold text-xs uppercase"
                >
                  ← Sửa thông tin
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="btn-editorial-primary flex-2 py-3.5 px-6 rounded-sm font-display text-2xl tracking-wider uppercase flex items-center justify-center gap-2"
                >
                  <span>{isSubmitting ? 'ĐANG GỬI HỒ SƠ...' : 'HOÀN TẤT ĐĂNG KÝ ↗'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= SCREEN 06: REGISTRATION SUCCESS & CELEBRATION STAGE ================= */}
          {screen === 6 && completedRecord && (
            <div className="space-y-4 animate-fadeIn">
              <CelebrationStage
                characters={stageCharacters}
                newRegistrant={completedRecord}
                onClose={onClose}
                onOpenPortal={() => {
                  onClose();
                  if (onOpenPortal) onOpenPortal();
                }}
              />
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
