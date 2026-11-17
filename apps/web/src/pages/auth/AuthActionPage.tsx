import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { ResetPasswordPage } from './ResetPasswordPage';
import { VerifyEmailPage } from './VerifyEmailPage';

/** Custom Firebase email action handler (set it as the action URL in Firebase Console → Authentication → Templates). */
export const AuthActionPage: React.FC = () => {
  const [params] = useSearchParams();
  return params.get('mode') === 'verifyEmail' ? <VerifyEmailPage /> : <ResetPasswordPage />;
};
