
import React from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncRedisPersister } from './lib/react-query';
import { ToastContainer } from './components/UI/Toast';
import { CursorGlobalStyle } from './components/UI/CursorGlobalStyle';
import { BackgroundStyle } from './components/UI/BackgroundStyle';
import DashboardPage from './app/page';

/**
 * App.tsx
 * 
 * Responsibilities:
 * 1. Global Providers (React Query, State Hydration)
 * 2. Global UI Overlays (Toasts, Cursors, Backgrounds)
 * 3. Routing (Direct rendering of DashboardPage for now)
 */
const App: React.FC = () => {
  return (
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister: asyncRedisPersister }}
    >
      {/* Global Styles & Effects */}
      <CursorGlobalStyle />
      <BackgroundStyle />
      
      {/* Global Overlays */}
      <ToastContainer />
      
      {/* Main Application Logic */}
      <DashboardPage />
      
    </PersistQueryClientProvider>
  );
};

export default App;
