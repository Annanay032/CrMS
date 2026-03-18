import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider } from 'antd';
import { store } from '@/store';
import './styles/main.scss';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <ConfigProvider theme={{
      token: {
        colorPrimary: '#4f46e5',
        colorSuccess: '#16a34a',
        colorWarning: '#d97706',
        colorError: '#dc2626',
        colorInfo: '#6366f1',
        borderRadius: 8,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        fontSize: 14,
      },
    }}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </Provider>,
);
