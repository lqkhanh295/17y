import React, { useState, useEffect } from 'react';
import { CloseIcon, MailIcon, CheckCircleIcon, EyeIcon, RefreshIcon } from 'naive-icons';
import { RegistrationRecord } from '../types';
import { generateEmailContent, EmailContent } from '../utils/emailTemplates';

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: RegistrationRecord | null;
  onSendEmail: (id: string, templateType: string) => Promise<void>;
  isSending?: boolean;
}

export const EmailPreviewModal: React.FC<EmailPreviewModalProps> = ({
  isOpen,
  onClose,
  record,
  onSendEmail,
  isSending = false
}) => {
  if (!isOpen || !record) return null;

  // Determine initial template
  const defaultTemplate = record.isApproved100 || record.status === 'FULLY_PAID' || record.remainingAmount === 0
    ? 'FULL_100'
    : (record.role === 'ALUMNI' ? 'DEPOSIT_ALUMNI' : 'DEPOSIT_ACTIVE');

  const [selectedTemplate, setSelectedTemplate] = useState<'DEPOSIT_ALUMNI' | 'DEPOSIT_ACTIVE' | 'FULL_100'>(defaultTemplate);
  const [viewMode, setViewMode] = useState<'RENDER' | 'TEXT'>('RENDER');
  const [content, setContent] = useState<EmailContent>(() => generateEmailContent(record, defaultTemplate));

  useEffect(() => {
    setContent(generateEmailContent(record, selectedTemplate));
  }, [record, selectedTemplate]);

  const handleSend = async () => {
    await onSendEmail(record.id, selectedTemplate);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#181818] border border-[#383838] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden font-body text-[#F4F0E6]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#383838] bg-[#222222] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5C400]/15 border border-[#F5C400]/30 flex items-center justify-center text-[#F5C400]">
              <MailIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                  TRÌNH XEM TRƯỚC VÀ ĐIỀU PHỐI EMAIL
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F5C400]/20 text-[#F5C400]">
                  LIVE DISPATCH
                </span>
              </div>
              <p className="text-xs text-[#A8A8A8]">
                Người nhận: <span className="text-white font-bold">{record.fullName}</span> ({record.mssv}) • Email: <span className="font-mono text-[#F5C400]">{record.gmail}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#2a2a2a] hover:bg-[#383838] text-[#A8A8A8] hover:text-white transition-colors"
          >
            <CloseIcon size={18} />
          </button>
        </div>

        {/* Template Selector Bar */}
        <div className="px-6 py-3 bg-[#1B1B1B] border-b border-[#383838] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#A8A8A8] uppercase">Chọn mẫu:</span>
            <div className="flex rounded-lg bg-[#242424] p-1 border border-[#383838]">
              <button
                type="button"
                onClick={() => setSelectedTemplate('DEPOSIT_ALUMNI')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  selectedTemplate === 'DEPOSIT_ALUMNI'
                    ? 'bg-[#F5C400] text-black shadow-sm'
                    : 'text-[#A8A8A8] hover:text-white'
                }`}
              >
                1. Đặt Cọc Alumni (389k - Thiếu 239k)
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemplate('DEPOSIT_ACTIVE')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  selectedTemplate === 'DEPOSIT_ACTIVE'
                    ? 'bg-[#F5C400] text-black shadow-sm'
                    : 'text-[#A8A8A8] hover:text-white'
                }`}
              >
                2. Đặt Cọc Active (349k - Thiếu 199k)
              </button>
              <button
                type="button"
                onClick={() => setSelectedTemplate('FULL_100')}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  selectedTemplate === 'FULL_100'
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'text-[#A8A8A8] hover:text-white'
                }`}
              >
                3. Hoàn Tất 100% (Xác nhận tham dự)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode(m => m === 'RENDER' ? 'TEXT' : 'RENDER')}
              className="px-2.5 py-1.5 rounded-lg bg-[#242424] border border-[#383838] text-xs text-[#A8A8A8] hover:text-white flex items-center gap-1.5"
            >
              <EyeIcon size={14} />
              <span>{viewMode === 'RENDER' ? 'Xem Plain Text' : 'Xem Giao Diện Mail'}</span>
            </button>
          </div>
        </div>

        {/* Subject Header */}
        <div className="px-6 py-2.5 bg-[#141414] border-b border-[#2D2D2D] text-xs flex items-center gap-2">
          <span className="font-mono text-[#A8A8A8] shrink-0 font-bold uppercase">Tiêu đề:</span>
          <span className="font-bold text-white truncate">{content.subject}</span>
        </div>

        {/* Email Preview Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#0E0D0C]">
          {viewMode === 'RENDER' ? (
            <div className="max-w-[620px] mx-auto bg-white rounded-xl shadow-xl overflow-hidden border border-[#333333]">
              <iframe
                title="Email Preview"
                srcDoc={content.html}
                sandbox="allow-same-origin"
                className="w-full h-[480px] border-none block"
              />
            </div>
          ) : (
            <pre className="max-w-2xl mx-auto p-4 bg-[#181818] border border-[#383838] rounded-xl text-xs text-white font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
              {content.text}
            </pre>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#383838] bg-[#222222] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-[#A8A8A8]">
            {record.isEmailSent ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircleIcon size={14} />
                <span>Người này đã từng được gửi mail lúc: {record.emailSentAt ? new Date(record.emailSentAt).toLocaleString('vi-VN') : 'Đã ghi nhận'}</span>
              </span>
            ) : (
              <span className="text-amber-400">
                ⚠ Người này chưa từng được gửi email xác nhận.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#2a2a2a] hover:bg-[#383838] border border-[#383838] text-xs font-bold text-white transition-colors flex-1 sm:flex-initial"
            >
              Đóng
            </button>

            <button
              type="button"
              disabled={isSending}
              onClick={handleSend}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all flex-1 sm:flex-initial shadow-md disabled:opacity-50 ${
                selectedTemplate === 'FULL_100'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-600 hover:bg-amber-500 text-white'
              }`}
            >
              {isSending ? (
                <>
                  <RefreshIcon size={16} className="animate-spin" />
                  <span>ĐANG GỬI EMAIL...</span>
                </>
              ) : (
                <>
                  <MailIcon size={16} />
                  <span>
                    GỬI EMAIL NÀY CHO {record.fullName.toUpperCase()} NGAY
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
