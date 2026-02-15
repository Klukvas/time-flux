'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { extractApiError } from '@lifespan/api';
import { getErrorTranslationKey, validateEmail, validatePassword } from '@lifespan/domain';
import { useRegister, useTranslation } from '@lifespan/hooks';
import { MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } from '@lifespan/constants';
import { useAuthStore } from '@/stores/auth-store';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoogleButton } from './google-button';

interface RegisterFormProps {
  open: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterForm({ open, onClose, onSwitchToLogin }: RegisterFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const register = useRegister();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [timezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    const emailResult = validateEmail(email);
    const passwordResult = validatePassword(password);
    if (!emailResult.valid || !passwordResult.valid) {
      setErrors({
        email: emailResult.errorCode
          ? t(`validation.email.${emailResult.errorCode}`)
          : undefined,
        password: passwordResult.errorCode
          ? t(`validation.password.${passwordResult.errorCode}`, { min: MIN_PASSWORD_LENGTH, max: MAX_PASSWORD_LENGTH })
          : undefined,
      });
      return;
    }
    setErrors({});
    register.mutate(
      { email, password, timezone },
      {
        onSuccess: (data) => {
          setAuth(data.access_token, data.refresh_token, data.user);
          onClose();
          router.replace('/timeline');
        },
        onError: (err) => {
          const apiError = extractApiError(err);
          const translationKey = getErrorTranslationKey(apiError);
          const message = t(translationKey);

          if (apiError.error_code === 'VALIDATION_ERROR' && apiError.details) {
            const details = apiError.details as Record<string, string>;
            const fieldErrors: { email?: string; password?: string } = {};
            if (details.email) {
              fieldErrors.email = details.email.includes('already')
                ? t('errors.email_already_exists')
                : t('errors.invalid_email');
            }
            if (details.password) {
              fieldErrors.password = t('errors.weak_password');
            }
            setErrors(fieldErrors);
            if (!fieldErrors.email && !fieldErrors.password) {
              setFormError(message);
              toast.error(message);
            }
          } else {
            setFormError(message);
            toast.error(message);
          }
        },
      },
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={t('auth.register.title')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="email"
          label={t('auth.email.label')}
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            if (formError) setFormError('');
          }}
          error={errors.email}
          placeholder={t('auth.email.placeholder')}
        />
        <div className="relative">
          <Input
            id="password"
            label={t('auth.password.label')}
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
              if (formError) setFormError('');
            }}
            error={errors.password}
            placeholder={t('auth.password.placeholder')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-[34px] text-content-tertiary hover:text-content-secondary transition-colors"
            aria-label={showPassword ? t('auth.password.hide') : t('auth.password.show')}
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>
        {formError && (
          <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">{formError}</p>
        )}
        <Button type="submit" className="w-full" loading={register.isPending}>
          {t('auth.register.submit')}
        </Button>
        <GoogleButton />
        <p className="text-center text-sm text-content-secondary">
          {t('auth.register.has_account')}{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-accent hover:text-accent-hover"
          >
            {t('auth.register.has_account_link')}
          </button>
        </p>
      </form>
    </Modal>
  );
}
