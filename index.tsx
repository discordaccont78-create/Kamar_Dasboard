
import React from 'react';
import ReactDOM from 'react-dom/client';
import DashboardPage from './app/page';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Could not find root element");

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <DashboardPage />
  </React.StrictMode>
);
