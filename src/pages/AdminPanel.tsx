import React, { useState, useEffect } from 'react';
import { useApp } from '../context/appcontext';
import { Mesero } from '../types';
import axios from 'axios';

export default function AdminPanel() {
  const { meseroActual, logout } = useApp();
  const [meseros, setMeseros] = useState<Mesero[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingMesero, setEditingMesero] = useState<Mesero | null>(null);
  const [formData, setFormData] = useState({
    nombre: '',
    identificacion: '',
    usuario: '',
    password: '',
    telefono: '',
    email: '',
    salario: 0,
    esAdmin: false
  });

  useEffect(() => {
    if (meseroActual?.esAdmin) {
      fetchMeseros();
    }
  }, [meseroActual]);

  const fetchMeseros = async () => {
    try {
      const response = await axios.get('/api/meseros');
      setMeseros(response.data);
    } catch (error) {
      console.error('Error fetching meseros:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMesero) {
        await axios.put(`/api/meseros/${editingMesero._id}`, formData);
      } else {
        await axios.post('/api/meseros', formData);
      }
      await fetchMeseros();
      resetForm();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error al guardar mesero');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este mesero?')) {
      try {
        await axios.delete(`/api/meseros/${id}`);
        await fetchMeseros();
      } catch (error) {
        alert('Error al eliminar mesero');
      }
    }
  };

  const handleToggleStatus = async (id: string, activo: boolean) => {
    try {
      await axios.patch(`/api/meseros/${id}/estado`, { activo: !activo });
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
      salario: 0,
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
      salario: mesero.salario || 0,
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
        <h2 style={{ color: 'white', fontSize: '2.5rem', fontWeight: '700', margin: 0 }}>
          🛡️ Panel de Administración
        </h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => setShowCreateForm(true)} 
            className="btn"
            style={{ background: 'linear-gradient(135deg, #48bb78, #38a169)' }}
          >
            ➕ Nuevo Mesero
          </button>
          <button onClick={logout} className="btn" style={{ background: 'linear-gradient(135deg, #e53e3e, #c53030)' }}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {(showCreateForm || editingMesero) && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#4a5568' }}>
            {editingMesero ? 'Editar Mesero' : 'Crear Nuevo Mesero'}
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
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label>Salario</label>
              <input
                type="number"
                value={formData.salario}
                onChange={e => setFormData({ ...formData, salario: Number(e.target.value) })}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input
                type="checkbox"
                id="esAdmin"
                checked={formData.esAdmin}
                onChange={e => setFormData({ ...formData, esAdmin: e.target.checked })}
              />
              <label htmlFor="esAdmin">Es Administrador</label>
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
        <h3 style={{ marginBottom: '1.5rem', color: '#4a5568' }}>Lista de Meseros</h3>
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
                        {mesero.activo ? '🚫 Desactivar' : '✅ Activar'}
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
                        🗑️ Eliminar
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