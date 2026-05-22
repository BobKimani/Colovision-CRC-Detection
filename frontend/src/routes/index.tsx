import React, { lazy } from 'react';

// Lazy load components to avoid circular dependencies
const LandingPage = lazy(() => import('../components/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = lazy(() => import('../components/LoginPage').then(m => ({ default: m.LoginPage })));
const SignupPage = lazy(() => import('../components/SignupPage').then(m => ({ default: m.SignupPage })));
const DetectionPage = lazy(() => import('../components/DetectionPage').then(m => ({ default: m.DetectionPage })));
const TwoFactorAuth = lazy(() => import('../components/TwoFactorAuth').then(m => ({ default: m.TwoFactorAuth })));

// Create wrapper components for TwoFactorAuth
const TwoFactorSetupPage: React.FC = () => (
  <React.Suspense fallback={<div>Loading...</div>}>
    <TwoFactorAuth isSetup={true} />
  </React.Suspense>
);

const TwoFactorVerifyPage: React.FC = () => (
  <React.Suspense fallback={<div>Loading...</div>}>
    <TwoFactorAuth isSetup={false} />
  </React.Suspense>
);

// Route Configuration
export const routes = [
  {
    path: '/',
    component: LandingPage,
    isPublic: true
  },
  {
    path: '/login',
    component: LoginPage,
    isPublic: true
  },
  {
    path: '/signup',
    component: SignupPage,
    isPublic: true
  },
  {
    path: '/2fa-setup',
    component: TwoFactorSetupPage,
    requiresAuth: true,
    redirectTo: '/login'
  },
  {
    path: '/2fa-verify',
    component: TwoFactorVerifyPage,
    requiresAuth: true,
    redirectTo: '/login'
  },
  {
    path: '/detection',
    component: DetectionPage,
    requiresAuth: true,
    redirectTo: '/login'
  }
];