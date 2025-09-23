import React from 'react';

// Simple test routes without component dependencies
const TestLanding = () => <div>Landing Page</div>;
const TestLogin = () => <div>Login Page</div>;

export const simpleRoutes = [
  {
    path: '/',
    component: TestLanding,
    isPublic: true
  },
  {
    path: '/login',
    component: TestLogin,
    isPublic: true
  }
];