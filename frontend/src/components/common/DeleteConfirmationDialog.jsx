import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Lock } from 'lucide-react';
import Button from './Button';

const DeleteConfirmationDialog = ({
  isOpen = false,
  onClose,
  onConfirm,
  type = 'resume', // 'resume' | 'account'
  isLoading = false,
}) => {
  const [password, setPassword] = useState('');
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const isAccountDeletion = type === 'account';

  const handleSubmit = (e) => {
    e.preventDefault();
    setValidationError('');

    if (isAccountDeletion) {
      if (!password) {
        setValidationError('Please enter your account password to confirm deletion.');
        return;
      }
      onConfirm({ password });
    } else {
      if (!hasConfirmed) {
        setValidationError('Please confirm that you understand this action is permanent.');
        return;
      }
      onConfirm();
    }
  };

  const handleClose = () => {
    setPassword('');
    setHasConfirmed(false);
    setValidationError('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-dialog-title"
    >
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-linkedin-border overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-linkedin-border flex items-center justify-between bg-red-50/50">
          <div className="flex items-center gap-2.5 text-red-700">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-600" aria-hidden="true" />
            </div>
            <h2 id="delete-dialog-title" className="text-base font-bold text-red-900">
              {isAccountDeletion ? 'Delete Entire Account' : 'Delete Resume & Profile Data'}
            </h2>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {/* Explanation */}
          <div className="text-linkedin-text-secondary leading-relaxed space-y-2">
            <p className="font-semibold text-linkedin-text-primary text-sm">
              This action is permanent and cannot be undone.
            </p>

            {isAccountDeletion ? (
              <div className="space-y-1.5 bg-gray-50 border border-gray-200 rounded-lg p-3 text-[11px]">
                <p className="font-bold text-linkedin-text-primary">What will be permanently deleted:</p>
                <ul className="list-disc pl-4 space-y-1 text-linkedin-text-muted">
                  <li>Your user login credentials and account profile</li>
                  <li>All uploaded resume PDF documents</li>
                  <li>Extracted candidate profile and skill assessments</li>
                  <li>All tracked job applications and saved jobs</li>
                  <li>Generated learning roadmaps and AI fit explanations</li>
                </ul>
              </div>
            ) : (
              <div className="space-y-1.5 bg-gray-50 border border-gray-200 rounded-lg p-3 text-[11px]">
                <p className="font-bold text-linkedin-text-primary">What will be permanently deleted:</p>
                <ul className="list-disc pl-4 space-y-1 text-linkedin-text-muted">
                  <li>Your uploaded PDF resume file from storage</li>
                  <li>Your extracted candidate profile and skills list</li>
                  <li>Cached AI match explanations and roadmaps</li>
                </ul>
                <p className="text-emerald-700 font-semibold pt-1">
                  ✓ Your login account, saved jobs, and tracked applications will remain safe.
                </p>
              </div>
            )}
          </div>

          {/* Account Password Confirmation */}
          {isAccountDeletion ? (
            <div className="space-y-1.5 pt-1">
              <label
                htmlFor="delete-account-password"
                className="font-bold text-linkedin-text-primary flex items-center gap-1 text-[11px]"
              >
                <Lock className="w-3.5 h-3.5 text-linkedin-blue" />
                <span>Confirm your account password:</span>
              </label>
              <input
                id="delete-account-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                required
              />
            </div>
          ) : (
            /* Resume Deletion Checkbox Confirmation */
            <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasConfirmed}
                onChange={(e) => setHasConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500"
              />
              <span className="text-[11px] text-linkedin-text-secondary">
                I confirm that I want to remove my stored resume file and candidate profile.
              </span>
            </label>
          )}

          {/* Validation Error */}
          {validationError && (
            <p className="text-red-600 font-semibold text-[11px] animate-in fade-in duration-150">
              {validationError}
            </p>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClose}
              disabled={isLoading}
              className="text-xs"
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="danger"
              size="sm"
              disabled={isLoading}
              icon={Trash2}
              className="text-xs font-bold bg-red-600 hover:bg-red-700 text-white border-transparent"
            >
              {isLoading
                ? 'Deleting...'
                : isAccountDeletion
                ? 'Permanently Delete Account'
                : 'Delete Resume Data'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeleteConfirmationDialog;
