import { Navigate, Route, Routes } from 'react-router-dom';
import { PrivateRoute } from './router/PrivateRoute';
import Login from './pages/Login';
import Balcao from './pages/Balcao';
import Admin from './pages/Admin';
import Garcom from './pages/Garcom';
import Cozinha from './pages/Cozinha';
import Cliente from './pages/Cliente';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cardapio" element={<Cliente />} />

      <Route
        path="/balcao"
        element={
          <PrivateRoute allow={['BALCONISTA']}>
            <Balcao />
          </PrivateRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <PrivateRoute allow={['GERENTE']}>
            <Admin />
          </PrivateRoute>
        }
      />
      <Route
        path="/garcom"
        element={
          <PrivateRoute allow={['GARCOM', 'GERENTE']}>
            <Garcom />
          </PrivateRoute>
        }
      />
      <Route
        path="/cozinha"
        element={
          <PrivateRoute allow={['GERENTE', 'COZINHA']}>
            <Cozinha />
          </PrivateRoute>
        }
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
