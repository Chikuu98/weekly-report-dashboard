import React from 'react';
import { AlertTriangle, LogOut, Info, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary' | 'info';
  icon?: React.ReactNode;
  isLoading?: boolean;
}

const variantStyles = {
  danger: {
    badgeBg: 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20',
    buttonVariant: 'danger' as const,
    defaultIcon: <LogOut className="w-5 h-5" />,
  },
  warning: {
    badgeBg: 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20',
    buttonVariant: 'primary' as const,
    defaultIcon: <AlertTriangle className="w-5 h-5" />,
  },
  primary: {
    badgeBg: 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 border-primary-500/20',
    buttonVariant: 'primary' as const,
    defaultIcon: <Info className="w-5 h-5" />,
  },
  info: {
    badgeBg: 'bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/20',
    buttonVariant: 'primary' as const,
    defaultIcon: <AlertCircle className="w-5 h-5" />,
  },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this action?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  icon,
  isLoading = false,
}) => {
  const currentVariant = variantStyles[variant] || variantStyles.danger;
  const displayIcon = icon || currentVariant.defaultIcon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="text-center py-2">
        <div
          className={`mx-auto w-12 h-12 rounded-2xl flex items-center justify-center border mb-4 shadow-xs ${currentVariant.badgeBg}`}
        >
          {displayIcon}
        </div>
        <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
          {title}
        </h3>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-5">
          {message}
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={currentVariant.buttonVariant}
            fullWidth
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
