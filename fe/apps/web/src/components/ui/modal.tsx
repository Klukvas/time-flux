'use client';

import { type ReactNode } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useTranslation } from '@timeflux/hooks';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
}: ModalProps) {
  const { t } = useTranslation();

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-[var(--color-overlay)] data-[state=open]:animate-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className={`fixed left-1/2 top-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2 rounded-xl border border-edge bg-[var(--color-surface)] p-6 shadow-lg focus:outline-none data-[state=open]:animate-fade-in ${sizeClasses[size]}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold text-content">
              {title}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label={t('common.close')}
                className="rounded-lg p-1 text-content-tertiary hover:bg-[var(--color-surface-alt)] hover:text-content-secondary"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </Dialog.Close>
          </div>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
