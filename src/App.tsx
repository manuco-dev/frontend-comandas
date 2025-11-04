
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './context/appcontext';
import Dashboard from './pages/dashboard';
import MeseroPage from './pages/MeseroPage';
import CocinaPage from './pages/CocinaPage';
import EstadisticasMeserosPage from './pages/EstadisticasMeserosPage';
import SessionTimer from './components/SessionTimer';
import ErrorBoundary from './components/ErrorBoundary';

function Navigation() {
  const location = useLocation();
  const { meseroActual, logout } = useApp();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link 
              to="/" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/') 
                  ? 'bg-white bg-opacity-20 text-white font-semibold' 
                  : 'text-blue-100 hover:text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              📊 Dashboard
            </Link>
            <Link 
              to="/mesero" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/mesero') 
                  ? 'bg-white bg-opacity-20 text-white font-semibold' 
                  : 'text-blue-100 hover:text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              👨‍🍳 Mesero
            </Link>
            <Link 
              to="/cocina" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/cocina') 
                  ? 'bg-white bg-opacity-20 text-white font-semibold' 
                  : 'text-blue-100 hover:text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              🍳 Cocina
            </Link>
            <Link 
              to="/estadisticas-meseros" 
              className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                isActive('/estadisticas-meseros') 
                  ? 'bg-white bg-opacity-20 text-white font-semibold' 
                  : 'text-blue-100 hover:text-white hover:bg-white hover:bg-opacity-10'
              }`}
            >
              📈 Ventas Meseros
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {meseroActual && <SessionTimer />}
            {meseroActual && (
              <div className="flex items-center space-x-3">
                <span className="text-blue-100">
                  Hola, <strong className="text-white">{meseroActual.nombre}</strong>
                  {meseroActual.esAdmin && <span className="ml-1 text-yellow-300">👑</span>}
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm transition-colors duration-200"
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
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
                <Route path="/" element={<Dashboard />} />
                <Route path="/mesero" element={<MeseroPage />} />
                <Route path="/cocina" element={<CocinaPage />} />
                <Route path="/estadisticas-meseros" element={<EstadisticasMeserosPage />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;