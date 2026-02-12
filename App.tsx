
import React from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncRedisPersister } from './lib/react-query';
import { ToastContainer } from './components/UI/Toast';
import { CursorGlobalStyle } from './components/UI/CursorGlobalStyle';
import { BackgroundStyle } from './components/UI/BackgroundStyle';
import DashboardPage from './app/page';
import { LoadingScreen } from './components/UI/LoadingScreen';
import { useServerSync } from './hooks/useServerSync';

/**
 * AppContent
 * Separated to use the hook inside the Provider context if needed, 
 * though here it's fine.
 */
const AppContent: React.FC = () => {
  const { isReady } = useServerSync();

  return (
    <>
      <CursorGlobalStyle />
      <BackgroundStyle />
      <ToastContainer />
      
      {isReady ? (
          <DashboardPage />
      ) : (
          <LoadingScreen />
      )}
    </>
  );
}

const App: React.FC = () => {
  return (
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister: asyncRedisPersister }}
    >
      <AppContent />
    </PersistQueryClientProvider>
  );
};

export default App;
