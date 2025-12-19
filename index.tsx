
import React from 'react';
import ReactDOM from 'react-dom/client';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, asyncRedisPersister } from './lib/react-query';
import DashboardPage from './app/page';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <PersistQueryClientProvider 
      client={queryClient} 
      persistOptions={{ persister: asyncRedisPersister }}
    >
      <DashboardPage />
    </PersistQueryClientProvider>
  </React.StrictMode>
);
