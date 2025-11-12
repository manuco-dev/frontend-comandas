
import type { ReactElement } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/appcontext';
import Dashboard from './pages/dashboard';
import MeseroPage from './pages/MeseroPage';
import CocinaPage from './pages/CocinaPage';
import EstadisticasMeserosPage from './pages/EstadisticasMeserosPage';
import AdminPanel from './pages/AdminPanel';
import AuditoriaPage from './pages/AuditoriaPage';
import SessionTimer from './components/SessionTimer';
import ErrorBoundary from './components/ErrorBoundary';
import MenuManagementPage from './pages/MenuManagementPage';

function Navigation() {
  const location = useLocation();
  const { meseroActual, logout } = useApp();

  const isActive = (path: string) => (location.pathname === path ? 'active' : '');

  return (
    <nav>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Marca */}
        <Link 
          to="/" 
          style={{ 
            fontSize: '1.25rem', 
            fontWeight: 700, 
            textDecoration: 'none',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          🍽️ Comandas
        </Link>

        {/* Links de navegación */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link className={`nav-link ${isActive('/mesero')}`} to="/mesero">👨‍💼 Mesero</Link>
          {meseroActual?.esAdmin && (
            <>
              <Link className={`nav-link ${isActive('/')}`} to="/">📊 Dashboard</Link>
              <Link className={`nav-link ${isActive('/cocina')}`} to="/cocina">🍳 Cocina</Link>
              <Link className={`nav-link ${isActive('/estadisticas-meseros')}`} to="/estadisticas-meseros">📈 Ventas Meseros</Link>
              <Link className={`nav-link ${isActive('/gestion-menu')}`} to="/gestion-menu">📋 Gestión Menu</Link>
              <Link className={`nav-link ${isActive('/admin')}`} to="/admin">🛡️ Admin</Link>
              <Link className={`nav-link ${isActive('/auditoria')}`} to="/auditoria">📝 Auditoría</Link>
            </>
          )}
        </div>

        {/* Sesión y cierre */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {meseroActual && <SessionTimer />}
          {meseroActual && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.85)' }}>
                Hola, <strong style={{ color: '#fff' }}>{meseroActual.nombre}</strong>
                {meseroActual.esAdmin && <span style={{ marginLeft: '0.25rem' }}>👑</span>}
              </span>
              <button
                onClick={logout}
                className="btn"
                style={{ background: 'linear-gradient(135deg, #e53e3e, #c53030)', padding: '8px 14px', fontSize: '0.875rem' }}
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function AdminRoute({ children }: { children: ReactElement }) {
  const { meseroActual } = useApp();
  if (!meseroActual?.esAdmin) {
    return <Navigate to="/mesero" replace />;
  }
  return children;
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <div className="app-theme">
            <Navigation />
            
            <main className="container mx-auto px-6 py-8">
              <Routes>
                <Route path="/mesero" element={<MeseroPage />} />
                <Route path="/" element={
                  <AdminRoute>
                    <Dashboard />
                  </AdminRoute>
                } />
                <Route path="/cocina" element={
                  <AdminRoute>
                    <CocinaPage />
                  </AdminRoute>
                } />
                <Route path="/estadisticas-meseros" element={
                  <AdminRoute>
                    <EstadisticasMeserosPage />
                  </AdminRoute>
                } />
                <Route path="/admin" element={
                  <AdminRoute>
                    <AdminPanel />
                  </AdminRoute>
                } />
                <Route path="/auditoria" element={
                  <AdminRoute>
                    <AuditoriaPage />
                  </AdminRoute>
                } />
                <Route path="/gestion-menu" element={
                  <AdminRoute>
                    <MenuManagementPage />
                  </AdminRoute>
                } />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;