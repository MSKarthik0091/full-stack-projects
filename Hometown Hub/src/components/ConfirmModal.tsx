import React from 'react';
import { AlertTriangle, LogOut, Info, Check, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = true,
  onConfirm,
  onCancel,
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
      onClick={onCancel}
    >
      <div 
        className="bg-[#FAF8F3] border border-[#2D6A4F]/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 transform transition-all cursor-default"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
            isDestructive ? 'bg-[#C85A32]/15 text-[#C85A32]' : 'bg-[#2D6A4F]/15 text-[#2D6A4F]'
          }`}>
            {isDestructive ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <h3 className="text-lg font-bold text-[#183120] leading-snug">{title}</h3>
            <p className="text-xs text-[#1F2D24]/80 leading-relaxed whitespace-pre-line">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#2D6A4F]/10">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-[#2D6A4F]/30 text-[#183120] hover:bg-white text-xs font-bold transition disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-white text-xs font-bold transition flex items-center gap-2 shadow-sm disabled:opacity-50 ${
              isDestructive 
                ? 'bg-[#C85A32] hover:bg-[#A34320]' 
                : 'bg-[#2D6A4F] hover:bg-[#183120]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                {isDestructive && <LogOut className="w-3.5 h-3.5" />}
                <span>{confirmLabel}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
