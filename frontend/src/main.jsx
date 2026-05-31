import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';
import router from './routes';
import { AppProvider } from './context/AppContext';
import { SocketProvider } from './context/SocketContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <LanguageProvider>
      <AuthProvider>
        <SocketProvider>
          <AppProvider>
            <RouterProvider router={router} />
          </AppProvider>
        </SocketProvider>
      </AuthProvider>
    </LanguageProvider>
  </React.StrictMode>
);

