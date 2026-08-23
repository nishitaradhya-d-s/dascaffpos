import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  itemIdentifier?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title = 'Confirm Deletion',
  message,
  itemIdentifier,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2D241E]/60 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-sm w-full overflow-hidden shadow-2xl border border-rose-200 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{title}</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-rose-400 hover:text-rose-700 p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-2">
          <p className="text-xs text-[#2D241E] leading-relaxed">
            {message}
          </p>
          {itemIdentifier && (
            <div className="p-2.5 bg-[#F9F7F5] rounded-lg border border-[#E0D7D0] text-xs font-mono font-bold text-[#4B3621] text-center">
              {itemIdentifier}
            </div>
          )}
          <p className="text-[11px] text-rose-600 font-medium">
            ⚠️ This will permanently remove the record from your sales register.
          </p>
        </div>

        {/* Actions */}
        <div className="p-3 bg-[#F4F1EE] border-t border-[#E0D7D0] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 bg-white border border-[#E0D7D0] text-[#8B7E74] hover:text-[#2D241E] text-xs font-bold rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Yes, Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
