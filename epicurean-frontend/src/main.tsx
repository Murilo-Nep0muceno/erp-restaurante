import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './styles/global.css';
import App from './App';
import { AuthProvider } from './store/AuthProvider';
import { NotifProvider } from './store/NotifProvider';
import { OrderProvider } from './store/OrderProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <NotifProvider>
          <OrderProvider>
            <App />
          </OrderProvider>
        </NotifProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
