import React, { useState, useEffect } from 'react';
import { useApp } from '../context/appcontext';
import type { Mesero } from '../types';
import axios from 'axios';

export default function AdminPanel() {
  const { meseroActual, logout } = useApp();
  const [meseros, setMeseros] = useState<Mesero[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMesero, setEditingMesero] = useState<Mesero | null>(null);
  const [estadoFilter, setEstadoFilter] = useState<'activos' | 'inactivos' | 'todos'>('activos');
  type Turno = 'mañana' | 'tarde' | 'noche' | 'completo';
  const [formData, setFormData] = useState<{ nombre: string; identificacion: string; usuario: string; password: string; telefono: string; email: string; turno: Turno; esAdmin: boolean; }>(
    {
      nombre: '',
      identificacion: '',
      usuario: '',
      password: '',
      telefono: '',
      email: '',
      turno: 'mañana',
      esAdmin: false
    }
  );

  // Ventas por mesero (hoy)
  const [selectedMeseroId, setSelectedMeseroId] = useState<string>('');
  const [ventasHoyMesero, setVentasHoyMesero] = useState<number>(0);
  const [pedidosHoyMesero, setPedidosHoyMesero] = useState<number>(0);
  const [loadingVentas, setLoadingVentas] = useState<boolean>(false);
  const [errorVentas, setErrorVentas] = useState<string | null>(null);

  useEffect(() => {
    if (meseroActual?.esAdmin) {
      fetchMeseros();
    }
  }, [meseroActual, estadoFilter]);

  const fetchMeseros = async () => {
    try {
      let url = '/api/meseros';
      if (estadoFilter === 'activos') {
        url = '/api/meseros?activo=true';
      } else if (estadoFilter === 'inactivos') {
        url = '/api/meseros?activo=false';
      }
      const response = await axios.get(url);
      setMeseros(response.data);
    } catch (error) {
      console.error('Error fetching meseros:', error);
    }
  };

  // Cargar ventas de hoy para el mesero seleccionado
  useEffect(() => {
    async function fetchVentasHoy() {
      if (!selectedMeseroId) {
        setVentasHoyMesero(0);
        setPedidosHoyMesero(0);
        setErrorVentas(null);
        return;
      }
      try {
        setLoadingVentas(true);
        setErrorVentas(null);
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const fecha = `${yyyy}-${mm}-${dd}`;
        const { data } = await axios.get('/api/pedidos', { params: { fecha, mesero: selectedMeseroId } });
        const pedidos = Array.isArray(data) ? data : [];
        const ventasTotal = pedidos.reduce((sum: number, p: any) => sum + (Number(p?.total) || 0), 0);
        setPedidosHoyMesero(pedidos.length);
        setVentasHoyMesero(ventasTotal);
      } catch (err: any) {
        setErrorVentas(err?.response?.data?.error || 'Error cargando ventas del día');
        setPedidosHoyMesero(0);
        setVentasHoyMesero(0);
      } finally {
        setLoadingVentas(false);
      }
    }
    fetchVentasHoy();
  }, [selectedMeseroId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { ...formData };
      // Si estamos editando y el password está vacío, no enviarlo para evitar validación
      if (editingMesero && !payload.password) {
        delete payload.password;
      }
      // Eliminar salario del payload en creación; si backend lo requiere, asignar valor por defecto mínimo
      if (!editingMesero) {
        // No queremos pedir salario; backend actual requiere un valor truthy
        // Asignamos un valor por defecto mínimo para evitar 400 mientras se ajusta backend
        payload.salario = payload.salario ?? 1;
      }
      if (editingMesero) {
        await axios.put(`/api/meseros/${editingMesero._id}`, payload);
      } else {
        await axios.post('/api/meseros', payload);
      }
      await fetchMeseros();
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.error || error.response?.data?.message || 'Error al guardar mesero');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Esto desactivará al usuario y lo ocultará de la lista de activos. ¿Confirmas?')) {
      try {
        await axios.delete(`/api/meseros/${id}`);
        alert('Mesero desactivado correctamente');
        await fetchMeseros();
      } catch (error) {
        alert('Error al eliminar mesero');
      }
    }
  };

  const handleToggleStatus = async (id: string, activo: boolean) => {
    try {
      await axios.patch(`/api/meseros/${id}/estado`, { activo: !activo });
      alert(!activo ? 'Mesero activado correctamente' : 'Mesero desactivado correctamente');
      await fetchMeseros();
    } catch (error) {
      alert('Error al cambiar estado del mesero');
    }
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      identificacion: '',
      usuario: '',
      password: '',
      telefono: '',
      email: '',
      turno: 'mañana',
      esAdmin: false
    });
    setShowCreateForm(false);
    setEditingMesero(null);
  };

  const startEdit = (mesero: Mesero) => {
    setEditingMesero(mesero);
    setFormData({
      nombre: mesero.nombre,
      identificacion: mesero.identificacion,
      usuario: mesero.usuario,
      password: '',
      telefono: mesero.telefono || '',
      email: mesero.email || '',
      turno: (mesero.turno as Turno) || 'mañana',
      esAdmin: mesero.esAdmin || false
    });
    setShowCreateForm(true);
  };

  if (!meseroActual?.esAdmin) {
    return (
      <div className="container">
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <h2 style={{ color: '#e53e3e', marginBottom: '1rem' }}>Acceso Denegado</h2>
          <p style={{ color: '#718096', marginBottom: '2rem' }}>
            No tienes permisos de administrador para acceder a esta página.
          </p>
          <button onClick={() => window.history.back()} className="btn">
            Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ color: '#000', fontSize: '2.5rem', fontWeight: '700', margin: 0 }}>
          🛡️ Panel de Administración
        </h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setShowCreateForm(true)} 
            className="btn"
            style={{ background: 'linear-gradient(135deg, #48bb78, #38a169)' }}
          >
            ➕ Nuevo Usuario
          </button>
          <button onClick={logout} className="btn" style={{ background: 'linear-gradient(135deg, #e53e3e, #c53030)' }}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Ventas del día por mesero */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div className="card-title">📈 Ventas del día por mesero</div>
          <div className="card-subtitle">Selecciona un mesero para ver sus ventas de hoy</div>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <label style={{ color: '#4a5568', fontWeight: 600 }}>Mesero:</label>
            <select
              value={selectedMeseroId}
              onChange={(e) => setSelectedMeseroId(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', minWidth: '220px' }}
            >
              <option value="">-- Seleccionar --</option>
              {meseros.map(m => (
                <option key={m._id} value={m._id}>{m.nombre} ({m.usuario})</option>
              ))}
            </select>
            {loadingVentas && <span style={{ color: '#64748b' }}>Cargando…</span>}
            {errorVentas && <span style={{ color: '#ef4444' }}>❌ {errorVentas}</span>}
          </div>
          {selectedMeseroId && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{pedidosHoyMesero}</div>
                <div className="stat-label">Pedidos hoy</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{ventasHoyMesero.toLocaleString()}</div>
                <div className="stat-label">Ventas hoy</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{pedidosHoyMesero > 0 ? (Math.round((ventasHoyMesero / pedidosHoyMesero))).toLocaleString() : 0}</div>
                <div className="stat-label">Ticket promedio</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {(showCreateForm || editingMesero) && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#4a5568' }}>
            {editingMesero ? 'Editar Usuario' : 'Crear Usuario'}
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label>Nombre</label>
              <input
                value={formData.nombre}
                onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Identificación</label>
              <input
                value={formData.identificacion}
                onChange={e => setFormData({ ...formData, identificacion: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Usuario</label>
              <input
                value={formData.usuario}
                onChange={e => setFormData({ ...formData, usuario: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Contraseña {editingMesero && '(dejar vacío para mantener)'}</label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required={!editingMesero}
              />
            </div>
            <div>
              <label>Teléfono</label>
              <input
                value={formData.telefono}
                onChange={e => setFormData({ ...formData, telefono: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label>Turno</label>
              <select
                value={formData.turno}
                onChange={e => setFormData({ ...formData, turno: e.target.value as Turno })}
                required
              >
                <option value="mañana">Mañana</option>
                <option value="tarde">Tarde</option>
                <option value="noche">Noche</option>
                <option value="completo">Completo</option>
              </select>
            </div>
            {/* Campo de salario eliminado según requerimiento */}
            <div>
              <label>Rol</label>
              <select
                value={formData.esAdmin ? 'admin' : 'mesero'}
                onChange={e => setFormData({ ...formData, esAdmin: e.target.value === 'admin' })}
              >
                <option value="mesero">Mesero</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button type="button" onClick={resetForm} className="btn" style={{ background: '#718096' }}>
                Cancelar
              </button>
              <button type="submit" className="btn">
                {editingMesero ? 'Actualizar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#4a5568', margin: 0 }}>Lista de Usuarios</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ color: '#4a5568', fontWeight: 600 }}>Estado:</label>
            <select
              value={estadoFilter}
              onChange={e => setEstadoFilter(e.target.value as 'activos' | 'inactivos' | 'todos')}
              style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
            >
              <option value="todos">Todos</option>
              <option value="activos">Activos</option>
              <option value="inactivos">Inactivos</option>
            </select>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#4a5568' }}>Nombre</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#4a5568' }}>Usuario</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#4a5568' }}>Identificación</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#4a5568' }}>Estado</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#4a5568' }}>Rol</th>
                <th style={{ padding: '1rem', textAlign: 'left', color: '#4a5568' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {meseros.map(mesero => (
                <tr key={mesero._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '1rem' }}>{mesero.nombre}</td>
                  <td style={{ padding: '1rem' }}>{mesero.usuario}</td>
                  <td style={{ padding: '1rem' }}>{mesero.identificacion}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      background: mesero.activo ? 'linear-gradient(135deg, #34d399, #10b981)' : 'linear-gradient(135deg, #f56565, #e53e3e)',
                      color: 'white'
                    }}>
                      {mesero.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      background: mesero.esAdmin ? 'linear-gradient(135deg, #9f7aea, #805ad5)' : 'linear-gradient(135deg, #4299e1, #3182ce)',
                      color: 'white'
                    }}>
                      {mesero.esAdmin ? 'Admin' : 'Mesero'}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => startEdit(mesero)}
                        style={{
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          background: 'linear-gradient(135deg, #4299e1, #3182ce)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleToggleStatus(mesero._id, mesero.activo)}
                        style={{
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          background: mesero.activo 
                            ? 'linear-gradient(135deg, #f56565, #e53e3e)' 
                            : 'linear-gradient(135deg, #34d399, #10b981)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        🔄 Alternar estado
                      </button>
                      <button
                        onClick={() => handleDelete(mesero._id)}
                        style={{
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          background: 'linear-gradient(135deg, #e53e3e, #c53030)',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        🗑️ Eliminar (desactivar)
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}