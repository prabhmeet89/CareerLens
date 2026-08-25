import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import Button from '../common/Button';

const RejectConfirmModal = ({
  isOpen = false,
  application = null,
  onConfirm,
  onCancel,
  isSubmitting = false,
}) => {
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen || !application) return null;

  const jobTitle = application.job?.title || 'this position';
  const companyName = application.job?.company || 'Company';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reject-dialog-title"
    >
      <div className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-4 border border-linkedin-border relative">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-linkedin-blue"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
            <AlertTriangle className="w-5 h-5" aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <h3 id="reject-dialog-title" className="text-base font-bold text-linkedin-text-primary">
              Mark Application as Rejected?
            </h3>
            <p className="text-xs text-linkedin-text-secondary leading-relaxed">
              Move <span className="font-semibold text-linkedin-text-primary">{jobTitle}</span> at <span className="font-semibold text-linkedin-text-primary">{companyName}</span> to the Rejected stage.
            </p>
          </div>
        </div>

        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-linkedin-text-secondary leading-relaxed">
          <span>Note: This updates your personal dashboard tracking only. You can reopen or change this status anytime.</span>
        </div>

        <div className="pt-2 flex flex-col-reverse sm:flex-row justify-end gap-2.5">
          <Button
            variant="outline"
            size="md"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-xs font-semibold min-h-[44px]"
          >
            Cancel
          </Button>

          <Button
            ref={confirmBtnRef}
            variant="primary"
            size="md"
            onClick={onConfirm}
            loading={isSubmitting}
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs min-h-[44px]"
          >
            Confirm Rejection
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RejectConfirmModal;
