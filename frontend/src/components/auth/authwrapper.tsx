'use client';

import { useState } from 'react';
import LoginForm from './loginform';
import SignupForm from './signupform';

interface AuthWrapperProps {
  onBack?: () => void;
}

export default function AuthWrapper({ onBack }: AuthWrapperProps) {
  const [isLogin, setIsLogin] = useState(true);

  if (isLogin) {
    return (
      <LoginForm 
        onBack={onBack}
        onSwitchToSignup={() => setIsLogin(false)}
      />
    );
  }

  return (
    <SignupForm 
      onBack={onBack}
      onSwitchToLogin={() => setIsLogin(true)}
    />
  );
}