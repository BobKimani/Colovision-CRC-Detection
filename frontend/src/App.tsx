import React from 'react';
import { Router } from './routes/Router';
import { routes } from './routes/index';

export default function App() {
  return <Router routes={routes} defaultRoute="/" />;
}