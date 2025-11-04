// React default import not needed for JSX
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/appcontext';

export default function Navbar() {
  const { meseroActual, logout } = useApp();
  const location = useLocation();
  const isActive = (path: string) => (location.pathname === path ? 'active' : '');

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem'
    }}>
      <Link 
        to="/" 
        style={{ 
          fontSize: '1.5rem', 
          fontWeight: '700', 
          textDecoration: 'none',
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}
      >
        🍽️ Comandas
      </Link>
      
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <Link className={`nav-link ${isActive('/')}`} to="/">
          📊 Dashboard
        </Link>
        <Link className={`nav-link ${isActive('/mesero')}`} to="/mesero">
          👨‍💼 Mesero
        </Link>
        <Link className={`nav-link ${isActive('/cocina')}`} to="/cocina">
          👨‍🍳 Cocina
        </Link>
        {meseroActual?.esAdmin && (
          <Link className={`nav-link ${isActive('/admin')}`} to="/admin">
            🛡️ Admin
          </Link>
        )}
      </div>
      
      <div>
        {meseroActual ? (
          <div style={{ 
            display: 'flex', 
            gap: '0.75rem', 
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.9)', 
              padding: '0.5rem 1rem', 
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#4a5568',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
            }}>
              👤 {meseroActual.nombre} 
              <span style={{ 
                marginLeft: '0.5rem',
                background: meseroActual.esAdmin 
                  ? 'linear-gradient(135deg, #9f7aea, #805ad5)' 
                  : 'linear-gradient(135deg, #34d399, #10b981)',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.75rem'
              }}>
                {meseroActual.esAdmin ? 'Admin' : meseroActual.turno}
              </span>
            </div>
            <button 
              onClick={logout}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
            >
              🚪 Salir
            </button>
          </div>
        ) : (
          <span style={{ 
            color: 'rgba(255, 255, 255, 0.7)', 
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            🔒 No autenticado
          </span>
        )}
      </div>
    </nav>
  );
}