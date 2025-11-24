
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
import MenuImagesPage from './pages/MenuImagesPage';
import ProteinInventoryPage from './pages/ProteinInventoryPage';
import { useState, useEffect } from 'react';
import { useResponsive } from './hooks/useResponsive';

function Navigation() {
  const location = useLocation();
  const { meseroActual, logout } = useApp();
  const { isMobile } = useResponsive();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => (location.pathname === path ? 'active' : '');

  useEffect(() => {
    // Cerrar el menú hamburguesa al navegar
    setMenuOpen(false);
  }, [location.pathname]);

  const AdminLinks = (
    <>
      <Link className={`nav-link ${isActive('/')}`} to="/">📊 Dashboard</Link>
      <Link className={`nav-link ${isActive('/cocina')}`} to="/cocina">🍳 Cocina</Link>
      <Link className={`nav-link ${isActive('/estadisticas-meseros')}`} to="/estadisticas-meseros">📈 Ventas Meseros</Link>
      <Link className={`nav-link ${isActive('/gestion-menu')}`} to="/gestion-menu">📋 Gestión Menu</Link>
      <Link className={`nav-link ${isActive('/imagenes-platos')}`} to="/imagenes-platos">🖼️ Imágenes Platos</Link>
      <Link className={`nav-link ${isActive('/inventario-proteinas')}`} to="/inventario-proteinas">📦 Inventario Proteínas</Link>
      <Link className={`nav-link ${isActive('/admin')}`} to="/admin">🛡️ Admin</Link>
      <Link className={`nav-link ${isActive('/auditoria')}`} to="/auditoria">📝 Auditoría</Link>
    </>
  );

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
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <Link className={`nav-link ${isActive('/mesero')}`} to="/mesero">👨‍💼 Mesero</Link>

          {meseroActual?.esAdmin && (
            <>
              {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  {AdminLinks}
                </div>
              )}

              {isMobile && (
                <div style={{ position: 'relative' }}>
                  <button
                    className="btn"
                    aria-label="Abrir menú"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen(v => !v)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: 'white',
                      fontWeight: 700
                    }}
                  >
                    ☰ Menú
                  </button>

                  {menuOpen && (
                    <div
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.35)',
                        zIndex: 1000
                      }}
                      onClick={() => setMenuOpen(false)}
                    >
                      <div
                        role="menu"
                        aria-label="Menú de administración"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          position: 'absolute',
                          top: '0.75rem',
                          left: '0.75rem',
                          right: '0.75rem',
                          borderRadius: '14px',
                          background: 'white',
                          boxShadow: '0 15px 40px rgba(0,0,0,0.25)',
                          padding: '0.75rem',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '0.5rem'
                        }}
                      >
                        {/* Cerrar */}
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div style={{ fontWeight: 700, color: '#374151' }}>Menú de administración</div>
                          <button className="btn btn-secondary" onClick={() => setMenuOpen(false)}>✖️</button>
                        </div>

                        {/* Links en rejilla para móvil (solo texto, sin iconos) */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          {[
                            { to: '/', label: 'Dashboard' },
                            { to: '/cocina', label: 'Cocina' },
                            { to: '/estadisticas-meseros', label: 'Ventas Meseros' },
                            { to: '/gestion-menu', label: 'Gestión Menu' },
                            { to: '/imagenes-platos', label: 'Imágenes Platos' },
                            { to: '/inventario-proteinas', label: 'Inventario Proteínas' },
                            { to: '/admin', label: 'Admin' },
                            { to: '/auditoria', label: 'Auditoría' },
                          ].map(({ to, label }) => (
                            <Link
                              key={to}
                              to={to}
                              onClick={() => setMenuOpen(false)}
                              style={{
                                display: 'block',
                                border: '1px solid #e5e7eb',
                                borderRadius: '10px',
                                padding: '0.75rem',
                                textAlign: 'center',
                                fontWeight: 600,
                                background: '#f9fafb',
                                color: '#374151',
                                textDecoration: 'none',
                                fontSize: '0.95rem'
                              }}
                            >
                              {label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                <Route path="/imagenes-platos" element={
                  <AdminRoute>
                    <MenuImagesPage />
                  </AdminRoute>
                } />
                <Route path="/inventario-proteinas" element={
                  <AdminRoute>
                    <ProteinInventoryPage />
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