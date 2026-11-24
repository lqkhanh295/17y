import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  CloseIcon, AlertCircleIcon, SparklesIcon, UploadIcon,
  EditIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpRightIcon,
  FrogIcon
} from 'naive-icons';
import { MemberDirectoryItem, PaymentPlan, RegistrationRecord, MascotFrog } from '../types';
import { apiClient } from '../services/apiClient';
import { audioService } from '../services/audioService';
import { compressImage } from '../utils/imageCompressor';
import { formatTransferContent } from '../utils/formatters';
import { CelebrationStage } from './CelebrationStage';
import { NotificationModal } from './NotificationModal';

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
  // Screen 3: Participant Information (About you, Just in case, A little note)
  // Screen 4: Payment Selection & VietQR (Full 100%, Deposit 150k + Receipt)
  // Screen 5: Review & Confirm
  // Screen 6: Registration Success & Mascot Reveal
  const [screen, setScreen] = useState<number>(1);

  // Screen 1: Lookup state
  const [query, setQuery] = useState('');
  const [identifiedMember, setIdentifiedMember] = useState<MemberDirectoryItem | null>(null);
  const [collisionCandidates, setCollisionCandidates] = useState<MemberDirectoryItem[]>([]);
  const [searchError, setSearchError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [alreadyRegisteredRecord, setAlreadyRegisteredRecord] = useState<RegistrationRecord | null>(null);
  const [isCheckingCandidate, setIsCheckingCandidate] = useState(false);

  // Screen 3: Payment selection state
  const [plan, setPlan] = useState<PaymentPlan>('FULL');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [copiedBank, setCopiedBank] = useState(false);
  const [paymentErrors, setPaymentErrors] = useState<{ [key: string]: string }>({});
  const [isCompressingReceipt, setIsCompressingReceipt] = useState(false);
  const [preuploadedReceiptUrl, setPreuploadedReceiptUrl] = useState<string | null>(null);
  const bgUploadPromiseRef = useRef<Promise<string> | null>(null);

  // Screen 4: Personal info & Wish state
  const [gmail, setGmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [allergyNote, setAllergyNote] = useState('');
  const [wishes, setWishes] = useState('');
  const [isPublicConsent, setIsPublicConsent] = useState(true);
  const [infoErrors, setInfoErrors] = useState<{ [key: string]: string }>({});
  const [isCheckingStep3, setIsCheckingStep3] = useState(false);

  // Screen 6: Completed state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatusText, setSubmitStatusText] = useState('');
  const [completedRecord, setCompletedRecord] = useState<RegistrationRecord | null>(null);
  const screensContainerRef = useRef<HTMLDivElement>(null);

  // Custom in-app notification popup state
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type?: 'warning' | 'error' | 'info' | 'success';
    title?: string;
    message: string;
    confirmText?: string;
    actionText?: string;
    onAction?: () => void;
  }>({
    isOpen: false,
    type: 'warning',
    message: ''
  });

  useEffect(() => {
    if (!isOpen) return;
    if (screensContainerRef.current) {
      screensContainerRef.current.scrollTop = 0;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [isOpen, screen]);

  // Pricing calculation
  const isAlumni = identifiedMember?.role === 'ALUMNI' || identifiedMember?.role === 'GUEST';
  const totalFee = isAlumni ? 389000 : 349000;

  let currentPayAmount = totalFee;
  if (plan === 'DEPOSIT_150' || plan === 'DEPOSIT_100') currentPayAmount = 150000;
  const remainingAmount = totalFee - currentPayAmount;

  // VietQR Config (VietinBank - NGUYEN PHUONG THAO)
  const BANK_ID = 'ICB';
  const ACCOUNT_NO = '104881849322';
  const ACCOUNT_NAME = 'NGUYEN PHUONG THAO';
  const transferContent = formatTransferContent(identifiedMember?.fullName || query, phone);
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
    setAlreadyRegisteredRecord(null);
    setIsVerifying(true);
    try {
      const res = await apiClient.verifyMember(query);

      // 1. Check if member already has active registration
      if (res.hasExistingRegistration && res.existingRecord) {
        setAlreadyRegisteredRecord(res.existingRecord);
        return;
      }

      if (res.multiple && res.candidates && res.candidates.length > 1) {
        setCollisionCandidates(res.candidates);
        return;
      }

      if (res.success && res.data) {
        // Double check duplicate registration by MSSV or name
        try {
          const existing = await apiClient.lookupRegistration(res.data.mssv || res.data.fullName);
          if (existing && existing.status !== 'REJECTED') {
            setAlreadyRegisteredRecord(existing);
            return;
          }
        } catch {
          // not registered yet
        }

        setCollisionCandidates([]);
        setIdentifiedMember(res.data);
        setScreen(2); // Personalized welcome
      } else {
        // Fallback: check if query itself matches an existing registration
        try {
          const existing = await apiClient.lookupRegistration(query);
          if (existing && existing.status !== 'REJECTED') {
            setAlreadyRegisteredRecord(existing);
            return;
          }
        } catch {
          // not found
        }
        handleQuickBypass();
      }
    } catch {
      // Auto-bypass so any attendee is never blocked!
      handleQuickBypass();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSelectCandidate = async (cand: MemberDirectoryItem) => {
    setIsCheckingCandidate(true);
    try {
      const existing = await apiClient.lookupRegistration(cand.mssv || cand.fullName);
      if (existing && existing.status !== 'REJECTED') {
        setCollisionCandidates([]);
        setAlreadyRegisteredRecord(existing);
        return;
      }
      setIdentifiedMember(cand);
      setCollisionCandidates([]);
      setScreen(2);
    } catch {
      setIdentifiedMember(cand);
      setCollisionCandidates([]);
      setScreen(2);
    } finally {
      setIsCheckingCandidate(false);
    }
  };

  // Screen 3: Handle Receipt Image Upload with high-speed client compression and background pre-upload
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setPaymentErrors(prev => ({ ...prev, receipt: 'Kích thước ảnh tối đa 15MB.' }));
      return;
    }

    setIsCompressingReceipt(true);
    try {
      // 1. Instant client-side compression (reduces 10MB down to ~100KB in ~100ms)
      const compressedDataUrl = await compressImage(file, 1280, 0.82);
      setReceiptImage(compressedDataUrl);
      setPaymentErrors(prev => ({ ...prev, receipt: '' }));

      // 2. Proactive Background Upload while user completes Screens 4 and 5
      setPreuploadedReceiptUrl(null);
      const mssvClean = (identifiedMember?.mssv || 'VIP').trim().toUpperCase();
      const uploadPromise = apiClient.uploadReceiptToStorage(compressedDataUrl, `rec_phase1_${mssvClean}`);
      bgUploadPromiseRef.current = uploadPromise;

      uploadPromise
        .then(url => {
          if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
            setPreuploadedReceiptUrl(url);
          }
        })
        .catch(err => {
          console.warn('[Background Upload] Will retry on submit:', err);
        });
    } catch (err) {
      console.error('Image compression failed, using fallback:', err);
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
        setPaymentErrors(prev => ({ ...prev, receipt: '' }));
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingReceipt(false);
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

  // Validate Screen 3 (Personal Info Form)
  const validatePersonalInfo = () => {
    const errors: { [key: string]: string } = {};
    if (!gmail.includes('@')) errors.gmail = 'Vui lòng nhập địa chỉ Gmail hợp lệ.';
    if (!phone || phone.length < 9) errors.phone = 'Vui lòng nhập số điện thoại cá nhân.';
    if (!emergencyPhone || emergencyPhone.length < 9) errors.emergencyPhone = 'Vui lòng nhập SĐT người thân đón về khi say tiệc.';

    setInfoErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Proactive duplicate check before advancing to payment screen
  const handleStep3Continue = async () => {
    if (!validatePersonalInfo()) return;

    setIsCheckingStep3(true);
    try {
      // 1. Check if MSSV has already been registered
      if (identifiedMember?.mssv) {
        try {
          const existingByMssv = await apiClient.lookupRegistration(identifiedMember.mssv.trim());
          if (existingByMssv && existingByMssv.status !== 'REJECTED') {
            setNotification({
              isOpen: true,
              type: 'warning',
              title: 'Mã sinh viên đã được đăng ký',
              message: `Mã sinh viên "${identifiedMember.mssv}" đã được dùng để đăng ký vé ${existingByMssv.ticketCode} (Họ tên: ${existingByMssv.fullName}).\n\nMỗi thành viên chỉ được đăng ký một vé duy nhất.`,
              confirmText: 'ĐÃ HIỂU',
              actionText: onOpenPortal ? 'TRA CỨU VÉ NGAY' : undefined,
              onAction: onOpenPortal ? () => { onClose(); onOpenPortal(); } : undefined
            });
            setIsCheckingStep3(false);
            return;
          }
        } catch {
          // clean
        }
      }

      // 2. Check if Gmail has already been registered
      if (gmail.trim()) {
        try {
          const existingByEmail = await apiClient.lookupRegistration(gmail.trim());
          if (existingByEmail && existingByEmail.status !== 'REJECTED') {
            setInfoErrors(prev => ({
              ...prev,
              gmail: `Địa chỉ Gmail này đã được dùng cho vé ${existingByEmail.ticketCode} (${existingByEmail.fullName}).`
            }));
            setNotification({
              isOpen: true,
              type: 'warning',
              title: 'Gmail đã được đăng ký',
              message: `Địa chỉ Gmail "${gmail.trim()}" đã được dùng để đăng ký vé ${existingByEmail.ticketCode} (Họ tên: ${existingByEmail.fullName}).\n\nVui lòng kiểm tra lại địa chỉ Gmail hoặc tra cứu vé đã đăng ký.`,
              confirmText: 'KIỂM TRA LẠI',
              actionText: onOpenPortal ? 'TRA CỨU VÉ NGAY' : undefined,
              onAction: onOpenPortal ? () => { onClose(); onOpenPortal(); } : undefined
            });
            setIsCheckingStep3(false);
            return;
          }
        } catch {
          // clean
        }
      }

      // 3. Check if Personal Phone has already been registered
      if (phone.trim()) {
        try {
          const existingByPhone = await apiClient.lookupRegistration(phone.trim());
          if (existingByPhone && existingByPhone.status !== 'REJECTED') {
            setInfoErrors(prev => ({
              ...prev,
              phone: `Số điện thoại này đã được dùng cho vé ${existingByPhone.ticketCode} (${existingByPhone.fullName}).`
            }));
            setNotification({
              isOpen: true,
              type: 'warning',
              title: 'Số điện thoại đã được đăng ký',
              message: `Số điện thoại "${phone.trim()}" đã được dùng để đăng ký vé ${existingByPhone.ticketCode} (Họ tên: ${existingByPhone.fullName}).\n\nVui lòng kiểm tra lại số điện thoại hoặc tra cứu vé đã đăng ký.`,
              confirmText: 'KIỂM TRA LẠI',
              actionText: onOpenPortal ? 'TRA CỨU VÉ NGAY' : undefined,
              onAction: onOpenPortal ? () => { onClose(); onOpenPortal(); } : undefined
            });
            setIsCheckingStep3(false);
            return;
          }
        } catch {
          // clean
        }
      }

      // Clear errors & proceed to Screen 4 (Payment)
      setInfoErrors({});
      setScreen(4);
    } catch {
      // In case of unexpected network timeout during pre-check, proceed to avoid blocking user
      setScreen(4);
    } finally {
      setIsCheckingStep3(false);
    }
  };

  // Validate Screen 4 (Payment & Receipt)
  const validatePayment = () => {
    const errors: { [key: string]: string } = {};
    if (!receiptImage) errors.receipt = 'Vui lòng tải lên ảnh chụp màn hình biên lai chuyển khoản.';
    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Final submit on Screen 5 with progress states
  const handleFinalSubmit = async () => {
    if (!identifiedMember) return;

    setIsSubmitting(true);
    setSubmitStatusText('Đang xử lý hồ sơ...');
    try {
      // If background upload is still finishing, wait for it with a short timeout
      let finalReceipt = preuploadedReceiptUrl || receiptImage;
      if (!preuploadedReceiptUrl && bgUploadPromiseRef.current) {
        try {
          const timeoutPromise = new Promise<string>((_, reject) => setTimeout(() => reject('timeout'), 2500));
          finalReceipt = await Promise.race([bgUploadPromiseRef.current, timeoutPromise]);
        } catch {
          finalReceipt = receiptImage;
        }
      }

      setSubmitStatusText('Đang lưu thông tin đăng ký...');
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
        receiptImage: finalReceipt,
        wishes: wishes.trim(),
        isPublicConsent
      });

      setCompletedRecord(record);
      onRegistrationComplete(record);

      // Play audio & Confetti celebration
      audioService.playCelebrationChime();
      confetti({
        particleCount: 75,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#F4C542', '#B94D35', '#20231F', '#3D6B45', '#F4EEDF']
      });

      setScreen(6); // Success screen
    } catch (err: unknown) {
      const error = err as Error;
      const msg = error.message || 'Lỗi khi gửi đăng ký. Vui lòng thử lại.';
      if (msg.includes('đã được đăng ký') || msg.includes('đã được sử dụng') || msg.includes('trùng lặp') || msg.includes('Conflict')) {
        setNotification({
          isOpen: true,
          type: 'warning',
          title: 'Thông tin đã được sử dụng',
          message: msg,
          confirmText: 'ĐÃ HIỂU',
          actionText: onOpenPortal ? 'TRA CỨU VÉ NGAY' : undefined,
          onAction: onOpenPortal ? () => { onClose(); onOpenPortal(); } : undefined
        });
        apiClient
          .lookupRegistration(identifiedMember?.mssv || gmail || phone)
          .then((rec) => {
            if (rec && rec.status !== 'REJECTED') {
              setAlreadyRegisteredRecord(rec);
              setScreen(1);
            }
          })
          .catch(() => {});
      } else {
        setNotification({
          isOpen: true,
          type: 'error',
          title: 'Lỗi gửi đăng ký',
          message: msg,
          confirmText: 'ĐÓNG'
        });
      }
    } finally {
      setIsSubmitting(false);
      setSubmitStatusText('');
    }
  };

  if (!isOpen) return null;

  // When registration is complete, render the 100vw x 100vh full-screen immersive celebration stage
  if (screen === 6 && completedRecord) {
    return (
      <CelebrationStage
        isModal={true}
        characters={stageCharacters}
        newRegistrant={completedRecord}
        onClose={onClose}
        onOpenPortal={() => {
          onClose();
          if (onOpenPortal) onOpenPortal();
        }}
      />
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-5 bg-[#20231F]/90 backdrop-blur-md overflow-hidden animate-fadeIn pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <div
        className="relative w-full max-w-2xl max-h-[96dvh] sm:max-h-[95vh] my-auto bg-[#F4EEDF] border-2 border-[#20231F] rounded-sm shadow-poster-lg overflow-hidden flex flex-col animate-paper-unfold"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b-2 border-[#20231F] bg-[#FFFFFF] shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-sm bg-[#F4C542] border-2 border-[#20231F] flex items-center justify-center shadow-poster-sm shrink-0 p-1.5">
              <img src="/images/coc_mascot.png" alt="Cóc Sài Gòn" className="w-full h-full object-contain" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-base sm:text-lg tracking-wider text-[#20231F] uppercase">
                  CÓC SÀI GÒN 17Y
                </span>
                <span className="stamp-seal text-[9px]">
                  {`BƯỚC 0${screen} / 05`}
                </span>
              </div>
              <p className="text-[11px] font-body text-[#20231F]/70">
                Đại tiệc kỷ niệm 17 năm • Đăng ký tham dự chính thức
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 min-h-[44px] min-w-[44px] rounded-sm bg-[#20231F] text-white hover:bg-[#B94D35] text-xs font-mono font-bold uppercase transition-colors flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
            title="Thoát ra trang chủ"
          >
            <CloseIcon size={16} />
            <span className="hidden sm:inline">VỀ TRANG CHỦ</span>
          </button>
        </div>

        {/* Progress Bar (Only during registration steps 1-5) */}
        <div className="w-full bg-[#EAE4D6] h-1.5 border-b border-[#20231F]/20 shrink-0">
          <div
            className="bg-[#F4C542] h-full transition-all duration-300"
            style={{ width: `${(screen / 5) * 100}%` }}
          />
        </div>

        {/* Wizard Screens Container */}
        <div
          ref={screensContainerRef}
          className="p-4 sm:p-8 overflow-y-auto flex-1 font-body overscroll-contain"
        >

          {/* ================= SCREEN 01: IDENTITY VERIFICATION ================= */}
          {screen === 1 && (
            <div className="space-y-6 animate-fadeIn">
              {alreadyRegisteredRecord ? (
                <div className="max-w-md mx-auto p-5 sm:p-6 bg-white border-2 border-[#20231F] rounded-sm shadow-poster space-y-4 animate-fadeIn">
                  {/* Top VIP Badge */}
                  <div className="flex items-start gap-3 pb-3 border-b-2 border-[#20231F]">
                    <div className="w-10 h-10 rounded-sm bg-[#F4C542] border-2 border-[#20231F] flex items-center justify-center shrink-0 font-bold text-lg text-[#20231F] shadow-poster-sm">
                      🎟️
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="inline-block px-2 py-0.5 rounded-xs bg-[#20231F] text-[#F4C542] text-[10px] font-mono font-bold uppercase tracking-wider mb-1">
                        HỒ SƠ ĐÃ ĐĂNG KÝ
                      </span>
                      <h4 className="font-display text-lg sm:text-xl uppercase text-[#20231F] tracking-tight truncate leading-tight">
                        {alreadyRegisteredRecord.fullName}
                      </h4>
                      <p className="text-xs font-mono text-[#20231F]/70 mt-0.5">
                        MÃ: <strong className="text-[#20231F]">{alreadyRegisteredRecord.mssv}</strong> • MÃ VÉ:{' '}
                        <span className="font-bold text-[#B94D35]">{alreadyRegisteredRecord.ticketCode || 'Chờ cấp'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Box */}
                  <div className="p-3.5 rounded-sm bg-[#FAF8F5] border-2 border-[#20231F]/20 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#20231F]/70 font-mono">Trạng thái vé:</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-xs font-mono font-bold uppercase text-[11px] ${
                          alreadyRegisteredRecord.isApproved100 || alreadyRegisteredRecord.status === 'FULLY_PAID'
                            ? 'bg-[#3D6B45] text-white'
                            : alreadyRegisteredRecord.status === 'DEPOSITED'
                            ? 'bg-[#D99B26] text-white'
                            : 'bg-[#315D91] text-white'
                        }`}
                      >
                        {alreadyRegisteredRecord.isApproved100 || alreadyRegisteredRecord.status === 'FULLY_PAID'
                          ? '✓ ĐÃ DUYỆT 100%'
                          : alreadyRegisteredRecord.status === 'DEPOSITED'
                          ? '⚡ ĐÃ ĐẶT CỌC 150K'
                          : '⏳ ĐANG CHỜ DUYỆT'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#20231F]/70 font-mono">Đã thanh toán:</span>
                      <span className="font-mono font-bold text-[#20231F]">
                        {(alreadyRegisteredRecord.paidAmount || (alreadyRegisteredRecord.status === 'DEPOSITED' ? 150000 : 0)).toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>

                    {(alreadyRegisteredRecord.remainingAmount && alreadyRegisteredRecord.remainingAmount > 0) ? (
                      <div className="flex items-center justify-between pt-1 border-t border-[#20231F]/10 text-[#B94D35]">
                        <span className="font-mono font-bold">Còn lại đợt 2:</span>
                        <span className="font-mono font-bold text-sm">
                          {alreadyRegisteredRecord.remainingAmount.toLocaleString('vi-VN')} VNĐ
                        </span>
                      </div>
                    ) : null}
                  </div>

                  <p className="text-xs text-[#20231F]/80 leading-relaxed font-body">
                    Hồ sơ với thông tin này đã được đăng ký tham gia sự kiện. Hệ thống không cho phép đăng ký trùng lặp.
                    {(alreadyRegisteredRecord.remainingAmount && alreadyRegisteredRecord.remainingAmount > 0)
                      ? ' Bạn có thể kiểm tra vé và quét QR hoàn tất thanh toán đợt 2 ngay bây giờ:'
                      : ' Bạn có thể xem vé điện tử VIP và mã check-in sự kiện ngay bây giờ:'}
                  </p>

                  {/* Actions */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        if (onOpenPortal) onOpenPortal();
                      }}
                      className="btn-editorial-primary w-full py-3 min-h-[46px] rounded-sm font-display text-base tracking-wider uppercase flex items-center justify-center gap-2 shadow-poster-sm active:scale-[0.98]"
                    >
                      <span>
                        {(alreadyRegisteredRecord.remainingAmount && alreadyRegisteredRecord.remainingAmount > 0)
                          ? '⚡ BỔ SUNG THANH TOÁN ĐỢT 2'
                          : '🎟️ TRA CỨU & XEM VÉ VIP NGAY'}
                      </span>
                      <ArrowUpRightIcon size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAlreadyRegisteredRecord(null);
                        setQuery('');
                        setSearchError('');
                      }}
                      className="w-full py-2 min-h-[40px] text-xs font-mono font-bold text-[#20231F]/70 hover:text-[#20231F] hover:underline transition-colors text-center"
                    >
                      ← Đăng ký cho người khác / Tìm lại
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="text-center max-w-md mx-auto space-y-2">
                    <span className="text-xs font-mono font-bold tracking-widest text-[#B94D35] uppercase">
                      01 / 05 · XÁC THỰC THÔNG TIN
                    </span>
                    <h3 className="text-2xl sm:text-4xl font-display uppercase tracking-tight text-[#20231F]">
                      CÙNG CÓC TÌM LẠI THÔNG TIN CỦA BẠN
                    </h3>
                    <p className="text-sm text-[#20231F]/75 leading-relaxed">
                      Nhập mã số sinh viên (MSSV) hoặc họ và tên để Cóc xác nhận thông tin và tìm lại dấu ấn của bạn trong hành trình 17 năm.
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
                          if (collisionCandidates.length > 0) setCollisionCandidates([]);
                        }}
                        autoComplete="name"
                        autoCapitalize="characters"
                        inputMode="text"
                        placeholder="VD: SE171224 hoặc Nguyễn Tiến Cường"
                        className="w-full px-4 py-3 min-h-[48px] rounded-sm bg-white border-2 border-[#20231F] text-[#20231F] font-mono text-base focus:outline-none focus:ring-2 focus:ring-[#F4C542] shadow-poster-sm"
                        autoFocus
                      />
                      {searchError && (
                        <div className="mt-2 p-3 rounded-lg bg-red-50 border-2 border-[#B94D35] text-[#B94D35] text-xs space-y-2">
                          <div className="flex items-center gap-2">
                            <AlertCircleIcon size={16} className="shrink-0" />
                            <span>{searchError}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleQuickBypass()}
                            className="w-full py-2.5 min-h-[44px] px-3 bg-[#B94D35] text-white font-bold rounded-sm text-center hover:bg-[#20231F] transition-colors active:scale-[0.98] flex items-center justify-center gap-1.5"
                          >
                            <span>Tiếp tục đăng ký với tên "{query.trim() || 'Khách mời'}"</span>
                            <ArrowUpRightIcon size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Disambiguation: Multiple Members with Same Name */}
                    {collisionCandidates.length > 0 && (
                      <div className="p-4 sm:p-5 rounded-sm bg-[#FFFFFF] border-2 border-[#20231F] shadow-poster space-y-3.5 animate-fadeIn text-left">
                        <div className="flex items-start gap-2.5 pb-3 border-b-2 border-[#20231F]">
                          <span className="w-8 h-8 rounded-sm bg-[#F4C542] border-2 border-[#20231F] flex items-center justify-center shrink-0 font-display text-sm font-bold text-[#20231F] shadow-poster-sm">
                            ⚡
                          </span>
                          <div>
                            <h4 className="font-display text-base uppercase text-[#20231F] tracking-wide leading-tight">
                              Phát hiện {collisionCandidates.length} bạn trùng tên
                            </h4>
                            <p className="text-xs text-[#20231F]/80 font-body mt-0.5">
                              CLB có {collisionCandidates.length} thành viên mang tên <strong className="font-bold text-[#B94D35]">"{query.trim()}"</strong>. Vui lòng bấm chọn đúng hồ sơ của bạn:
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 overscroll-contain">
                          {collisionCandidates.map((cand, idx) => {
                            const candIsAlumni = cand.role === 'ALUMNI';
                            const candIsGuest = cand.role === 'GUEST';
                            const candGen = cand.generation
                              ? (cand.generation.toLowerCase().startsWith('k') || cand.generation.toLowerCase().startsWith('gen')
                                  ? cand.generation.toUpperCase()
                                  : (candIsGuest ? cand.generation.toUpperCase() : `KHÓA ${cand.generation}`))
                              : (candIsGuest ? 'KHÁCH MỜI' : 'CÓC SÀI GÒN');

                            return (
                              <button
                                key={cand.id || `cand-${cand.mssv}-${idx}`}
                                type="button"
                                disabled={isCheckingCandidate}
                                onClick={() => handleSelectCandidate(cand)}
                                className={`w-full text-left p-3 sm:p-3.5 rounded-sm border-2 border-[#20231F] transition-all group active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-poster-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 cursor-pointer disabled:opacity-50 ${
                                  candIsGuest
                                    ? 'bg-[#FAF5FF] hover:bg-[#F3E8FF]'
                                    : candIsAlumni
                                    ? 'bg-[#FFF8F6] hover:bg-[#FFEAE4]'
                                    : 'bg-[#F6FAF7] hover:bg-[#EBF5EE]'
                                }`}
                              >
                                <div className="space-y-0.5 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-display text-base uppercase text-[#20231F] tracking-wide group-hover:text-[#B94D35] transition-colors">
                                      {cand.fullName}
                                    </span>
                                    <span className="text-[11px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-white border border-[#20231F]/40 text-[#20231F]">
                                      {candGen}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs font-mono text-[#20231F]/70 flex-wrap">
                                    <span className="font-bold text-[#20231F]">MÃ: {cand.mssv}</span>
                                    {cand.department && <span>• {cand.department}</span>}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#20231F]/15">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-mono font-bold uppercase border ${
                                      candIsGuest
                                        ? 'bg-[#7C3AED] text-white border-[#20231F]'
                                        : candIsAlumni
                                        ? 'bg-[#B94D35] text-white border-[#20231F]'
                                        : 'bg-[#286640] text-white border-[#20231F]'
                                    }`}
                                  >
                                    <span>{candIsGuest ? 'KHÁCH MỜI' : (candIsAlumni ? 'CỰU THÀNH VIÊN' : 'THÀNH VIÊN')}</span>
                                    <span>•</span>
                                    <span>{(candIsAlumni || candIsGuest) ? '389k' : '349k'}</span>
                                  </span>
                                  <span className="w-8 h-8 rounded-sm bg-[#20231F] text-white flex items-center justify-center font-bold text-sm group-hover:bg-[#F4C542] group-hover:text-[#20231F] group-hover:border-2 group-hover:border-[#20231F] transition-all">
                                    →
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="pt-2 text-center border-t border-[#20231F]/15 space-y-1">
                          <p className="text-[11px] font-mono text-[#20231F]/60">
                            💡 Hoặc nhập trực tiếp <span className="font-bold text-[#20231F]">MSSV</span> để chính xác 100%.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleQuickBypass()}
                            className="text-xs font-mono text-[#B94D35] hover:underline font-bold"
                          >
                            Không phải bạn ở trên? Tiếp tục đăng ký với tên "{query.trim()}" →
                          </button>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isVerifying || !query.trim()}
                      className="btn-editorial-primary w-full py-3.5 min-h-[48px] rounded-sm font-display text-xl tracking-wider uppercase flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
                    >
                      <span>{isVerifying ? 'ĐANG ĐỐI CHIẾU...' : 'TÌM TÊN CỦA BẠN'}</span>
                      {!isVerifying && <ArrowUpRightIcon size={18} />}
                    </button>
                  </form>
                </>
              )}
            </div>
          )}

          {/* ================= SCREEN 02: PERSONALIZED WELCOME ================= */}
          {screen === 2 && identifiedMember && (
            <div className="space-y-6 animate-fadeIn text-center max-w-lg mx-auto">
              <span className="text-xs font-mono font-bold tracking-widest text-[#B94D35] uppercase">
                02 / 05 · CHÀO MỪNG TRỞ VỀ
              </span>

              {/* Dynamic Personalized Letter */}
              {isAlumni ? (
                <div className="space-y-4">
                  <h3 className="text-2xl sm:text-4xl font-display uppercase tracking-tight text-[#20231F] leading-tight">
                    CHÀO MỪNG TRỞ VỀ NHÀ,
                    <br />
                    <span className="text-[#B94D35] underline decoration-[#F4C542] decoration-4">
                      {identifiedMember.fullName.toUpperCase()}!
                    </span>
                  </h3>
                  <div className="p-4 sm:p-6 rounded-sm bg-[#FFFFFF] border-2 border-[#20231F] shadow-poster text-left space-y-3 relative">
                    {/* High-contrast Role & Gen Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#20231F]/15">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#B94D35] text-white border-2 border-[#20231F] shadow-poster-sm font-mono font-bold text-xs uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-[#F4C542] shrink-0"></span>
                        <span>CỰU THÀNH VIÊN · KHÓA {identifiedMember.generation || 'K14'}</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#20231F]/60 font-semibold hidden sm:inline">
                        CSG 17Y GALA
                      </span>
                    </div>

                    <div className="font-handwriting text-lg sm:text-xl text-[#20231F] leading-relaxed pt-1 sm:pt-2 space-y-2">
                      <p className="font-bold text-[#B94D35] text-xl sm:text-2xl">
                        Thương gửi {identifiedMember.fullName},
                      </p>
                      <p>
                        Có những hành trình dù đã khép lại, những yêu thương và ký ức vẫn luôn còn ở đó. Cảm ơn bạn vì đã từng góp một phần thanh xuân để viết nên câu chuyện của Cóc Sài Gòn. 17 năm nhìn lại, thật hạnh phúc khi giữa muôn vàn ngã rẽ, chúng ta vẫn có một dịp để trở về, gặp lại những gương mặt thân quen và cùng nhau viết tiếp những kỉ niệm đẹp 💛!
                      </p>
                    </div>
                    <div className="pt-2 border-t border-[#20231F]/15 text-xs text-[#20231F]/60 font-mono truncate">
                      Điểm danh: {identifiedMember.department || 'Cựu thành viên'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-2xl sm:text-4xl font-display uppercase tracking-tight text-[#20231F] leading-tight">
                    CHÀO BẠN, {identifiedMember.fullName.toUpperCase()}!
                    <br />
                    <span className="text-[#B94D35] underline decoration-[#F4C542] decoration-4">
                      BẠN MÃI LÀ MỘT PHẦN CỦA CÓC.
                    </span>
                  </h3>
                  <div className="p-4 sm:p-6 rounded-sm bg-[#FFFFFF] border-2 border-[#20231F] shadow-poster text-left space-y-3 relative">
                    {/* High-contrast Role & Gen Header */}
                    <div className="flex items-center justify-between pb-2.5 border-b border-[#20231F]/15">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#286640] text-white border-2 border-[#20231F] shadow-poster-sm font-mono font-bold text-xs uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-[#F4C542] shrink-0"></span>
                        <span>THÀNH VIÊN</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#20231F]/60 font-semibold hidden sm:inline">
                        CSG 17Y GALA
                      </span>
                    </div>

                    <div className="font-handwriting text-lg sm:text-xl text-[#20231F] leading-relaxed pt-1 sm:pt-2 space-y-2">
                      <p className="font-bold text-[#B94D35] text-xl sm:text-2xl">
                        Thân gửi {identifiedMember.fullName},
                      </p>
                      <p>
                        Có thể bạn chưa biết, nhưng từ khoảnh khắc trở thành một phần của Cóc, bạn đã góp thêm một nét vẽ vào bức tranh 17 năm đầy màu sắc này. Mỗi câu chuyện, mỗi trải nghiệm và mỗi dấu ấn của bạn đều đang góp phần tạo nên Cóc Sài Gòn của hôm nay. Mong rằng khi nhìn lại, bạn sẽ luôn tự hào vì đã có một thanh xuân mang tên Cóc Sài Gòn 💛!
                      </p>
                    </div>
                    <div className="pt-2 border-t border-[#20231F]/15 text-xs text-[#20231F]/60 font-mono truncate">
                      Đội ngũ: {identifiedMember.department || 'Thành viên'}
                    </div>
                  </div>
                </div>
              )}

              {/* Role & Ticket Tier Status (Direct from Database) */}
              <div className="p-3.5 bg-[#FFFFFF] border-2 border-[#20231F] rounded-sm shadow-poster-sm flex items-center justify-between text-left">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#20231F]/60 block">
                    VAI TRÒ THAM DỰ
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-mono font-bold border ${isAlumni ? 'bg-red-50 text-[#B94D35] border-[#B94D35]/40' : 'bg-emerald-50 text-[#286640] border-[#286640]/40'}`}>
                      {isAlumni ? 'CỰU THÀNH VIÊN' : 'THÀNH VIÊN'}
                    </span>
                    {identifiedMember.generation && (
                      <span className="text-xs font-mono text-[#20231F]/70 font-semibold">
                        Khóa {identifiedMember.generation}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#20231F]/60 block">
                    MỨC VÉ
                  </span>
                  <span className="font-mono font-bold text-base sm:text-lg text-[#B94D35]">
                    {totalFee.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen(1)}
                  className="btn-editorial-secondary w-full sm:w-auto sm:px-6 py-3.5 min-h-[48px] rounded-sm font-display text-base tracking-wider uppercase active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 whitespace-nowrap shadow-poster-sm"
                >
                  <ArrowLeftIcon size={16} />
                  <span>Đổi người khác</span>
                </button>
                <button
                  type="button"
                  onClick={() => setScreen(3)}
                  className="btn-editorial-primary flex-1 py-3.5 min-h-[48px] px-6 rounded-sm font-display text-base sm:text-lg tracking-wider uppercase flex items-center justify-center gap-2 active:scale-[0.98] shadow-poster-sm"
                >
                  <span>TIẾP TỤC ĐẾN BUỔI TIỆC</span>
                  <ArrowUpRightIcon size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ================= SCREEN 03: PARTICIPANT INFORMATION ================= */}
          {screen === 3 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#20231F] pb-3">
                <span className="text-xs font-mono font-bold tracking-widest text-[#B94D35] uppercase">
                  03 / 05 · THÔNG TIN THAM DỰ
                </span>
                <h3 className="text-2xl sm:text-4xl font-display uppercase tracking-tight text-[#20231F]">
                  THÔNG TIN CÁ NHÂN & LỜI CHÚC
                </h3>
              </div>

              <div className="space-y-4">
                {/* Block 1: About You */}
                <div className="p-3.5 sm:p-4 rounded-sm bg-white border-2 border-[#20231F] space-y-3">
                  <h4 className="text-xs font-mono font-bold text-[#20231F] uppercase border-b border-[#20231F]/15 pb-1.5">
                    1. THÔNG TIN CỦA BẠN
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
                        autoComplete="name"
                        autoCapitalize="words"
                        placeholder="Họ và tên của bạn"
                        className="w-full px-3.5 py-2.5 min-h-[44px] rounded-lg bg-white border border-[#20231F] text-base sm:text-xs font-bold text-[#20231F] focus:outline-none focus:ring-1 focus:ring-[#F4C542]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-[#20231F] uppercase mb-1">
                        ĐỊA CHỈ GMAIL LIÊN HỆ *
                      </label>
                      <input
                        type="email"
                        value={gmail}
                        onChange={(e) => setGmail(e.target.value)}
                        autoComplete="email"
                        autoCapitalize="none"
                        inputMode="email"
                        placeholder="tenban@gmail.com"
                        className="w-full px-3.5 py-2.5 min-h-[44px] rounded-lg bg-white border border-[#20231F] text-base sm:text-xs font-mono text-[#20231F] focus:outline-none focus:ring-1 focus:ring-[#F4C542]"
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
                        autoComplete="tel"
                        inputMode="tel"
                        placeholder="0901234567"
                        className="w-full px-3.5 py-2.5 min-h-[44px] rounded-lg bg-white border border-[#20231F] text-base sm:text-xs font-mono text-[#20231F] focus:outline-none focus:ring-1 focus:ring-[#F4C542]"
                      />
                      {infoErrors.phone && <p className="text-[10px] text-[#B94D35] font-bold mt-0.5">{infoErrors.phone}</p>}
                    </div>
                  </div>
                </div>

                {/* Block 2: Just in Case */}
                <div className="p-3.5 sm:p-4 rounded-sm bg-white border-2 border-[#20231F] space-y-3">
                  <h4 className="text-xs font-mono font-bold text-[#B94D35] uppercase border-b border-[#20231F]/15 pb-1.5 flex items-center justify-between">
                    <span>2. GIÚP BTC HIỂU BẠN HƠN</span>
                  </h4>
                  <div>
                    <label className="block text-[11px] font-bold text-[#20231F] uppercase mb-0.5">
                      SỐ ĐIỆN THOẠI NGƯỜI THÂN
                    </label>
                    <input
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      autoComplete="tel"
                      inputMode="tel"
                      placeholder="SĐT bạn cùng phòng, người yêu hoặc gia đình..."
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-lg bg-white border border-[#20231F] text-base sm:text-xs font-mono text-[#20231F] focus:outline-none focus:ring-1 focus:ring-[#F4C542]"
                    />
                    {infoErrors.emergencyPhone && <p className="text-[10px] text-[#B94D35] font-bold mt-0.5">{infoErrors.emergencyPhone}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#20231F] uppercase mb-1">
                      BẠN CÓ DỊ ỨNG VỚI GÌ HEM
                    </label>

                    <input
                      type="text"
                      value={allergyNote}
                      onChange={(e) => setAllergyNote(e.target.value)}
                      placeholder="Ghi chú dị ứng cụ thể khác nếu có..."
                      className="w-full px-3.5 py-2.5 min-h-[44px] rounded-lg bg-white border border-[#20231F] text-base sm:text-xs text-[#20231F]"
                    />
                  </div>
                </div>

                {/* Block 3: A Little Note (Birthday Wish) */}
                <div className="p-3.5 sm:p-4 rounded-sm bg-white border-2 border-[#20231F] space-y-2">
                  <div className="flex items-center justify-between border-b border-[#20231F]/15 pb-1.5">
                    <h4 className="text-xs font-mono font-bold text-[#20231F] uppercase">
                      3. LỜI CHÚC GỬI CÓC SÀI GÒN
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
                    className="w-full px-3.5 py-2.5 min-h-[80px] rounded-lg bg-[#F4EEDF] border border-[#20231F] text-base sm:text-xs text-[#20231F] font-body focus:outline-none focus:ring-1 focus:ring-[#F4C542] leading-relaxed"
                  />
                  <label className="flex items-center gap-2.5 cursor-pointer pt-2 min-h-[44px] select-none">
                    <input
                      type="checkbox"
                      checked={isPublicConsent}
                      onChange={(e) => setIsPublicConsent(e.target.checked)}
                      className="w-5 h-5 rounded border-[#20231F] text-[#F4C542] focus:ring-[#F4C542] shrink-0"
                    />
                    <span className="text-xs sm:text-[11px] text-[#20231F]/90 leading-snug">
                      Đồng ý hiển thị lời chúc công khai tại Sân khấu Kỷ niệm 17Y
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen(2)}
                  className="btn-editorial-secondary w-full sm:w-auto sm:px-6 py-3.5 min-h-[48px] rounded-sm font-display text-base tracking-wider uppercase active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 whitespace-nowrap shadow-poster-sm"
                >
                  <ArrowLeftIcon size={16} />
                  <span>Quay lại</span>
                </button>
                <button
                  type="button"
                  disabled={isCheckingStep3}
                  onClick={handleStep3Continue}
                  className="btn-editorial-primary flex-1 py-3.5 min-h-[48px] px-6 rounded-sm font-display text-base sm:text-lg tracking-wider uppercase flex items-center justify-center gap-2 active:scale-[0.98] shadow-poster-sm disabled:opacity-60 cursor-pointer"
                >
                  {isCheckingStep3 ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#20231F] border-t-transparent rounded-full animate-spin" />
                      <span>ĐANG KIỂM TRA THÔNG TIN...</span>
                    </>
                  ) : (
                    <>
                      <span>TIẾP TỤC: ĐÓNG PHÍ THAM DỰ</span>
                      <ArrowRightIcon size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================= SCREEN 04: PAYMENT SELECTION & VIETQR ================= */}
          {screen === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#20231F] pb-3 flex items-end justify-between">
                <div>
                  <span className="text-xs font-mono font-bold tracking-widest text-[#B94D35] uppercase">
                    04 / 05 · ĐÓNG PHÍ THAM DỰ
                  </span>
                  <h3 className="text-2xl sm:text-4xl font-display uppercase tracking-tight text-[#20231F]">
                    CHỌN HÌNH THỨC ĐÓNG PHÍ & VIETQR
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
                  className={`p-3.5 sm:p-4 rounded-sm border-2 cursor-pointer transition-all active:scale-[0.99] min-h-[76px] ${plan === 'FULL'
                    ? 'bg-[#F4C542] border-[#20231F] shadow-poster-sm'
                    : 'bg-white border-[#20231F] hover:bg-[#F4EEDF]'
                    }`}
                >
                  <div className="flex justify-between items-center mb-1 gap-2">
                    <span className="text-xs font-mono font-bold uppercase whitespace-nowrap">100% TRỌN GÓI</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#20231F] text-[#F4C542] font-bold whitespace-nowrap">KHUYÊN DÙNG</span>
                  </div>
                  <div className="text-2xl font-display font-bold whitespace-nowrap">{totalFee.toLocaleString('vi-VN')} đ</div>
                  <p className="text-[11px] text-[#20231F]/70 mt-1 whitespace-nowrap">Hoàn tất ngay toàn bộ chi phí</p>
                </div>

                <div
                  onClick={() => setPlan('DEPOSIT_150')}
                  className={`p-3.5 sm:p-4 rounded-sm border-2 cursor-pointer transition-all active:scale-[0.99] min-h-[76px] ${plan === 'DEPOSIT_150'
                    ? 'bg-[#F4C542] border-[#20231F] shadow-poster-sm'
                    : 'bg-white border-[#20231F] hover:bg-[#F4EEDF]'
                    }`}
                >
                  <div className="flex justify-between items-center mb-1 gap-2">
                    <span className="text-xs font-mono font-bold uppercase whitespace-nowrap">ĐẶT CỌC GIỮ CHỖ</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#B94D35] text-white font-bold whitespace-nowrap">CỌC 150K</span>
                  </div>
                  <div className="text-2xl font-display font-bold whitespace-nowrap">150.000 đ</div>
                  <p className="text-[11px] text-[#20231F]/70 mt-1 whitespace-nowrap sm:whitespace-normal">Còn lại: {(totalFee - 150000).toLocaleString('vi-VN')}đ (đóng trước sự kiện)</p>
                </div>
              </div>

              {/* VietQR & Banking Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 p-3 sm:p-4 rounded-sm bg-white border-2 border-[#20231F] shadow-poster-sm">
                {/* QR Code Container */}
                <div className="text-center flex flex-col items-center justify-center p-2.5 sm:p-3 bg-[#F4EEDF] rounded-sm border-2 border-[#20231F]">
                  <span className="text-[11px] sm:text-xs font-mono font-bold text-[#20231F] uppercase mb-1.5">
                    QUÉT MÃ VIETQR ĐỂ CHUYỂN KHOẢN
                  </span>
                  <div className="p-1.5 sm:p-2 bg-white rounded-sm border-2 border-[#20231F] inline-block shadow-sm">
                    <img
                      src={vietQrUrl}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/images/vietinbank_qr.jpg';
                      }}
                      alt="VietQR Chuyển khoản VietinBank"
                      className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
                    />
                  </div>
                  <span className="text-xs font-bold text-[#B94D35] mt-1.5">
                    Số tiền: {currentPayAmount.toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>

                {/* Bank Account Details & Transfer Memo */}
                <div className="space-y-2 text-xs">
                  {/* Compact Bank + Account Name 2-Column Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 sm:p-2.5 bg-[#F4EEDF] rounded-sm border border-[#20231F]">
                      <span className="text-[#20231F]/60 block text-[9px] sm:text-[10px] uppercase font-bold">Ngân hàng</span>
                      <span className="font-bold text-xs sm:text-sm text-[#20231F] truncate block">VietinBank</span>
                    </div>

                    <div className="p-2 sm:p-2.5 bg-[#F4EEDF] rounded-sm border border-[#20231F]">
                      <span className="text-[#20231F]/60 block text-[9px] sm:text-[10px] uppercase font-bold">Chủ tài khoản</span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-[#20231F] uppercase truncate block">{ACCOUNT_NAME}</span>
                    </div>
                  </div>

                  <div className="p-2 sm:p-2.5 bg-[#F4EEDF] rounded-sm border border-[#20231F] flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[#20231F]/60 block text-[9px] sm:text-[10px] uppercase font-bold truncate">Số tài khoản</span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-[#20231F] tracking-wide truncate block">{ACCOUNT_NO}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(ACCOUNT_NO)}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-2 min-h-[40px] min-w-[65px] rounded bg-[#20231F] text-white text-[11px] font-bold active:scale-95 flex items-center justify-center shrink-0 whitespace-nowrap"
                    >
                      {copiedBank ? 'Đã chép' : 'Sao chép'}
                    </button>
                  </div>

                  <div className="p-2 sm:p-2.5 bg-[#F4EEDF] rounded-sm border-2 border-[#B94D35] flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="text-[#B94D35] block text-[9px] sm:text-[10px] uppercase font-bold truncate">Nội dung chuyển khoản (bắt buộc)</span>
                      <span className="font-mono font-bold text-xs sm:text-sm text-[#20231F] truncate block select-all">{transferContent}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(transferContent)}
                      className="px-2.5 py-1.5 sm:px-3 sm:py-2 min-h-[40px] min-w-[65px] rounded bg-[#B94D35] text-white text-[11px] font-bold active:scale-95 flex items-center justify-center shrink-0 whitespace-nowrap"
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
                            <span className="text-xs font-bold text-emerald-800 block">Đã đính kèm ảnh biên lai</span>
                            {isCompressingReceipt ? (
                              <span className="text-[10px] font-mono text-amber-700 flex items-center gap-1">
                                <span className="w-2.5 h-2.5 border border-amber-600 border-t-transparent rounded-full animate-spin" />
                                Đang tối ưu dung lượng...
                              </span>
                            ) : preuploadedReceiptUrl ? (
                              <span className="text-[10px] font-mono text-emerald-700 flex items-center gap-1 font-bold">
                                ✓ Đã sẵn sàng gửi ngay
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-[#20231F]/60">
                                Đã nén tối ưu (sẵn sàng đối soát)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="px-3 py-2 min-h-[44px] bg-[#EAE4D6] hover:bg-[#F4EEDF] border border-[#20231F] text-xs font-bold cursor-pointer transition-colors active:scale-95 flex items-center justify-center">
                            <span>Thay ảnh</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              onChange={handleReceiptUpload}
                              className="hidden"
                              disabled={isCompressingReceipt}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setReceiptImage('');
                              setPreuploadedReceiptUrl(null);
                            }}
                            className="px-3 py-2 min-h-[44px] bg-red-100 hover:bg-red-200 text-[#B94D35] border border-[#B94D35] text-xs font-bold transition-colors active:scale-95 flex items-center justify-center"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="border-2 border-dashed border-[#20231F] p-4 min-h-[84px] bg-white flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-[#F4EEDF] transition-colors active:scale-[0.99]">
                        {isCompressingReceipt ? (
                          <div className="flex flex-col items-center gap-2">
                            <span className="w-6 h-6 border-2 border-[#B94D35] border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold text-[#B94D35]">Đang tối ưu dung lượng ảnh...</span>
                          </div>
                        ) : (
                          <>
                            <UploadIcon size={20} className="text-[#20231F]" />
                            <span className="text-xs font-bold text-[#20231F] text-center">
                              Nhấp để tải lên ảnh chụp màn hình chuyển khoản
                            </span>
                            <span className="text-[10px] font-mono text-[#20231F]/60 text-center">
                              Tự động tối ưu dung lượng siêu tốc (Hỗ trợ JPG, PNG, WEBP)
                            </span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleReceiptUpload}
                          className="hidden"
                          disabled={isCompressingReceipt}
                        />
                      </label>
                    )}

                    {paymentErrors.receipt && (
                      <p className="text-[11px] text-[#B94D35] font-bold mt-1">{paymentErrors.receipt}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Support Helpline Notice */}
              <div className="p-3 rounded-sm bg-[#FFFDF5] border-2 border-[#20231F] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs shadow-poster-sm">
                <div className="flex items-start sm:items-center gap-2.5">
                  <span className="text-lg shrink-0">💬</span>
                  <div className="space-y-0.5">
                    <span className="font-bold text-[#20231F] block text-xs">
                      Cần hỗ trợ chuyển khoản hoặc đối soát thanh toán?
                    </span>
                    <span className="text-[11px] text-[#20231F]/75 block">
                      Nếu gặp vấn đề khi chuyển tiền hoặc cần hỗ trợ gấp, vui lòng liên hệ hotline/Zalo BTC.
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <a
                    href="tel:0901325178"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-[#B94D35] hover:bg-[#20231F] text-white font-mono font-bold text-xs shrink-0 transition-colors shadow-xs active:scale-95 whitespace-nowrap"
                    title="Gọi ngay 0901 325 178"
                  >
                    <span>📞 0901 325 178</span>
                  </a>
                  <a
                    href="https://zalo.me/0901325178"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-[#F4EEDF] hover:bg-[#EAE4D6] border border-[#20231F] text-[#20231F] font-bold text-xs shrink-0 transition-colors active:scale-95 whitespace-nowrap"
                    title="Nhắn tin Zalo 0901 325 178"
                  >
                    <span>Zalo</span>
                  </a>
                </div>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen(3)}
                  className="btn-editorial-secondary w-full sm:w-auto sm:px-6 py-3.5 min-h-[48px] rounded-sm font-display text-base tracking-wider uppercase active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 whitespace-nowrap shadow-poster-sm"
                >
                  <ArrowLeftIcon size={16} />
                  <span>Quay lại</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (validatePayment()) {
                      setScreen(5); // Go to review
                    }
                  }}
                  className="btn-editorial-primary flex-1 py-3.5 min-h-[48px] px-6 rounded-sm font-display text-base sm:text-lg tracking-wider uppercase flex items-center justify-center gap-2 active:scale-[0.98] shadow-poster-sm"
                >
                  <span>KIỂM TRA & XÁC NHẬN</span>
                  <ArrowRightIcon size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ================= SCREEN 05: REVIEW & CONFIRM ================= */}
          {screen === 5 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="border-b-2 border-[#20231F] pb-3">
                <span className="text-xs font-mono font-bold tracking-widest text-[#B94D35] uppercase">
                  05 / 05 · KIỂM TRA & XÁC NHẬN
                </span>
                <h3 className="text-2xl sm:text-4xl font-display uppercase tracking-tight text-[#20231F]">
                  XÁC NHẬN THÔNG TIN ĐĂNG KÝ
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                {/* Identity Review */}
                <div className="p-3 sm:p-3.5 rounded-sm bg-white border-2 border-[#20231F] flex items-center justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-[#20231F]/60 uppercase block">Người tham dự</span>
                    <span className="font-bold text-sm text-[#20231F] truncate block">
                      {identifiedMember?.fullName}
                    </span>
                    <span className="text-[11px] sm:text-xs text-[#20231F]/70 block font-mono truncate">
                      MÃ: {identifiedMember?.mssv} • {identifiedMember?.role === 'GUEST' ? 'Khách mời' : (isAlumni ? 'Cựu thành viên' : 'Thành viên')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen(1)}
                    className="px-2.5 py-1.5 min-h-[44px] min-w-[56px] rounded-sm border border-[#20231F] hover:bg-[#F4EEDF] flex items-center justify-center gap-1 text-[11px] font-bold active:scale-95 shrink-0 whitespace-nowrap"
                  >
                    <EditIcon size={14} />
                    <span>Sửa</span>
                  </button>
                </div>

                {/* Contact Review */}
                <div className="p-3 sm:p-3.5 rounded-sm bg-white border-2 border-[#20231F] flex items-center justify-between gap-2.5">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-[#20231F]/60 uppercase block">Thông tin liên lạc</span>
                    <p className="text-[11px] sm:text-xs truncate">Gmail: <span className="font-mono font-bold">{gmail}</span></p>
                    <p className="text-[11px] sm:text-xs truncate">SĐT: <span className="font-mono font-bold">{phone}</span> • Người thân: <span className="font-mono font-bold text-[#B94D35]">{emergencyPhone}</span></p>
                    {allergies.length > 0 && (
                      <p className="text-[11px] sm:text-xs text-[#B94D35] truncate">Dị ứng: {allergies.join(', ')} {allergyNote ? `(${allergyNote})` : ''}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen(3)}
                    className="px-2.5 py-1.5 min-h-[44px] min-w-[56px] rounded-sm border border-[#20231F] hover:bg-[#F4EEDF] flex items-center justify-center gap-1 text-[11px] font-bold active:scale-95 shrink-0 whitespace-nowrap"
                  >
                    <EditIcon size={14} />
                    <span>Sửa</span>
                  </button>
                </div>

                {/* Payment Review */}
                <div className="p-3 sm:p-3.5 rounded-sm bg-white border-2 border-[#20231F] flex items-center justify-between gap-2.5">
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-mono text-[#20231F]/60 uppercase block">Gói & Biên lai thanh toán</span>
                    <span className="font-bold text-sm text-[#B94D35] truncate block">
                      {plan === 'FULL' ? 'Đóng trọn gói 100%' : 'Đặt cọc giữ chỗ 150.000đ'}
                    </span>
                    <span className="text-[11px] sm:text-xs text-[#20231F]/70 block truncate">
                      Đã nộp: {currentPayAmount.toLocaleString('vi-VN')}đ {remainingAmount > 0 ? `• Còn lại: ${remainingAmount.toLocaleString('vi-VN')}đ` : '• Đã đủ 100%'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setScreen(4)}
                    className="px-2.5 py-1.5 min-h-[44px] min-w-[56px] rounded-sm border border-[#20231F] hover:bg-[#F4EEDF] flex items-center justify-center gap-1 text-[11px] font-bold active:scale-95 shrink-0 whitespace-nowrap"
                  >
                    <EditIcon size={14} />
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

              <div className="p-3.5 rounded-sm bg-amber-50 border-2 border-[#F4C542] text-xs text-[#20231F]/90 space-y-1">
                <p>
                  Thông tin đăng ký và xác nhận đóng phí tham gia sẽ được Ban Tổ Chức kiểm tra và liên hệ thông báo sớm nhất đến bạn.
                </p>
                <p className="text-[11px] font-mono text-[#20231F]/70 flex items-center gap-1.5 flex-wrap">
                  <span>Mọi thắc mắc cần giải đáp, liên hệ hotline/Zalo BTC:</span>
                  <a href="tel:0901325178" className="font-bold text-[#B94D35] hover:underline font-mono">
                    0901 325 178
                  </a>
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScreen(4)}
                  className="btn-editorial-secondary w-full sm:w-auto sm:px-6 py-3.5 min-h-[48px] rounded-sm font-display text-base tracking-wider uppercase active:scale-[0.98] flex items-center justify-center gap-2 shrink-0 whitespace-nowrap shadow-poster-sm"
                >
                  <ArrowLeftIcon size={16} />
                  <span>Quay lại</span>
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleFinalSubmit}
                  className="btn-editorial-primary flex-1 py-3.5 min-h-[48px] px-4 sm:px-6 rounded-sm font-display text-base sm:text-xl tracking-wider uppercase flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-85 disabled:cursor-wait shadow-poster-sm"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 border-2 border-[#20231F] border-t-transparent rounded-full animate-spin shrink-0" />
                      <span className="text-xs sm:text-sm font-mono font-bold tracking-normal normal-case">
                        {submitStatusText || 'Đang xử lý hồ sơ...'}
                      </span>
                    </div>
                  ) : (
                    <>
                      <span>HOÀN TẤT ĐĂNG KÝ</span>
                      <ArrowUpRightIcon size={18} />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Persistent Hotline Support Footer */}
        <div className="px-3.5 sm:px-6 py-2.5 bg-[#FFFFFF] border-t-2 border-[#20231F] shrink-0 flex items-center justify-between gap-2 text-xs font-mono shadow-sm">
          <div className="flex items-center gap-2 text-[#20231F]/80 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[11px] sm:text-xs truncate font-medium">
              Có thắc mắc gì khi đăng ký? Liên hệ hotline BTC:
            </span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href="tel:0901325178"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-[#F4C542] hover:bg-[#F8D56A] border-2 border-[#20231F] text-[#20231F] font-bold text-xs shrink-0 shadow-poster-sm transition-all active:scale-95 whitespace-nowrap"
              title="Gọi hotline hỗ trợ: 0901 325 178"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
              <span>0901 325 178</span>
            </a>
            <a
              href="https://zalo.me/0901325178"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden xs:inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-[#F4EEDF] hover:bg-[#EAE4D6] border border-[#20231F] text-[#20231F] font-bold text-[11px] shrink-0 transition-all active:scale-95 whitespace-nowrap"
              title="Nhắn tin Zalo hỗ trợ: 0901 325 178"
            >
              <span>Zalo</span>
            </a>
          </div>
        </div>
      </div>
    </div>

    {/* Custom Retro Editorial Notification Modal */}
    <NotificationModal
      isOpen={notification.isOpen}
      type={notification.type}
      title={notification.title}
      message={notification.message}
      confirmText={notification.confirmText}
      actionText={notification.actionText}
      onAction={notification.onAction}
      onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
    />
  </>
  );
};
