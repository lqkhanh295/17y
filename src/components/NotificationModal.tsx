import React, { useEffect, useRef } from 'react';
import {
  CloseIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  InfoIcon,
  CheckCircleIcon,
  FrogIcon,
  ArrowRightIcon
} from 'naive-icons';

export interface NotificationModalProps {
  isOpen: boolean;
  type?: 'warning' | 'error' | 'info' | 'success';
  title?: string;
  message: string;
  confirmText?: string;
  onClose: () => void;
  actionText?: string;
  onAction?: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  type = 'warning',
  title,
  message,
  confirmText = 'ĐÃ HIỂU',
  onClose,
  actionText,
  onAction
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    // Focus confirmation button for seamless keyboard dismiss
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Determine badge styling and default titles
  let headerBg = 'bg-csg-yellow text-csg-ink';
  let badgeLabel = 'LƯU Ý QUAN TRỌNG';
  let iconComponent = <AlertTriangleIcon size={20} className="shrink-0 text-csg-ink" />;
  let defaultTitle = 'Thông báo từ Ban Tổ Chức';

  if (type === 'error') {
    headerBg = 'bg-csg-red text-white';
    badgeLabel = 'CẢNH BÁO';
    iconComponent = <AlertCircleIcon size={20} className="shrink-0 text-white" />;
    defaultTitle = 'Có lỗi xảy ra';
  } else if (type === 'success') {
    headerBg = 'bg-[#3D6B45] text-white';
    badgeLabel = 'THÀNH CÔNG';
    iconComponent = <CheckCircleIcon size={20} className="shrink-0 text-white" />;
    defaultTitle = 'Thao tác thành công';
  } else if (type === 'info') {
    headerBg = 'bg-csg-ink text-csg-yellow';
    badgeLabel = 'THÔNG BÁO';
    iconComponent = <InfoIcon size={20} className="shrink-0 text-csg-yellow" />;
    defaultTitle = 'Thông tin sự kiện';
  }

  const displayTitle = title || defaultTitle;
  const paragraphs = message.split('\n\n').filter(Boolean);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-modal-title"
      className="fixed inset-0 z-[120] bg-[#20231F]/65 backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-[#FFFDF8] border-2 border-csg-ink shadow-[6px_6px_0px_#20231F] rounded-sm overflow-hidden animate-paper-unfold text-csg-ink"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Vintage Postal Header Bar */}
        <div className={`px-4 py-3 border-b-2 border-csg-ink flex items-center justify-between ${headerBg}`}>
          <div className="flex items-center gap-2">
            {iconComponent}
            <span className="font-mono text-[11px] font-bold tracking-wider uppercase">
              {badgeLabel}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded flex items-center justify-center hover:bg-black/10 active:scale-95 transition-all text-current"
            aria-label="Đóng thông báo"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 p-1 bg-csg-paper border border-csg-ink/30 rounded shadow-sm shrink-0 flex items-center justify-center">
              <img src="/images/coc_mascot.png" alt="Cóc Sài Gòn" className="w-7 h-7 object-contain" />
            </div>
            <div>
              <h3
                id="notification-modal-title"
                className="font-display font-extrabold text-base sm:text-lg text-csg-ink leading-snug tracking-tight"
              >
                {displayTitle}
              </h3>
              <p className="font-mono text-[10px] text-csg-ink/60 uppercase tracking-widest mt-0.5">
                Cóc Sài Gòn • The Next Signal 17Y
              </p>
            </div>
          </div>

          {/* Formatted Message Box */}
          <div className="p-3.5 sm:p-4 bg-csg-paper/70 border-l-4 border-csg-ink rounded-r text-sm leading-relaxed text-csg-ink font-body space-y-2">
            {paragraphs.length > 0 ? (
              paragraphs.map((para, idx) => (
                <p key={idx} className={idx === 0 ? 'font-medium text-csg-ink leading-relaxed' : 'text-csg-ink/80 text-xs sm:text-sm leading-relaxed'}>
                  {para}
                </p>
              ))
            ) : (
              <p className="font-medium text-csg-ink leading-relaxed">{message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
            {actionText && onAction && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onAction();
                }}
                className="min-h-[44px] px-4 py-2.5 font-display font-bold text-xs uppercase bg-white text-csg-ink border-2 border-csg-ink shadow-poster hover:bg-csg-paper hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csg-ink transition-all text-center flex items-center justify-center gap-1.5"
              >
                <span>{actionText}</span>
                <ArrowRightIcon size={14} className="shrink-0" />
              </button>
            )}

            <button
              ref={confirmBtnRef}
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-6 py-2.5 font-display font-bold text-xs uppercase bg-csg-yellow text-csg-ink border-2 border-csg-ink shadow-poster hover:bg-csg-yellow-light hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-csg-ink transition-all text-center flex items-center justify-center gap-1.5"
            >
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
