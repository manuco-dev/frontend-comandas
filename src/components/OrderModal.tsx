import { useEffect, useState } from 'react';
import axios from 'axios';
import type { MenuItem } from '../types';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItem: MenuItem | null;
  onSubmit: (orderData: {
    customerName: string;
    customerLocation: string;
    observations: string;
    menuItem: MenuItem;
  }) => void;
}

export default function OrderModal({ isOpen, onClose, menuItem, onSubmit }: OrderModalProps) {
  const [customerName, setCustomerName] = useState('');
  const [customerLocation, setCustomerLocation] = useState('');
  const [observations, setObservations] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAcomps, setSelectedAcomps] = useState<string[]>([]);
  const [generalAcomps, setGeneralAcomps] = useState<string[]>(() => {
    // Inicializar desde localStorage o variable de entorno
    try {
      const raw = localStorage.getItem('acompanamientosGenerales');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    try {
      const envRaw = (import.meta as any)?.env?.VITE_GENERAL_ACOMPS as string | undefined;
      if (!envRaw) return [];
      let list: string[] = [];
      if (envRaw.trim().startsWith('[')) {
        const parsed = JSON.parse(envRaw);
        if (Array.isArray(parsed)) list = parsed;
      } else {
        list = envRaw.split(',').map(s => s.trim()).filter(Boolean);
      }
      return Array.from(new Set(list));
    } catch {
      return [];
    }
  });

  // Lista de acompañamientos generales: usa estado (precargado) o vacío
  const getGeneralAcompList = (): string[] => generalAcomps;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuItem || !customerName.trim() || !customerLocation.trim()) return;

    setIsSubmitting(true);
    try {
      const acompText = selectedAcomps.length ? `\nAcompañamientos: ${selectedAcomps.join(', ')}` : '';
      const finalObservations = `${observations.trim()}${acompText}`.trim();
      await onSubmit({
        customerName: customerName.trim(),
        customerLocation: customerLocation.trim(),
        observations: finalObservations,
        menuItem
      });
      
      // Limpiar formulario
      setCustomerName('');
      setCustomerLocation('');
      setObservations('');
      setSelectedAcomps([]);
      onClose();
    } catch (error) {
      console.error('Error al crear pedido:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setCustomerName('');
      setCustomerLocation('');
      setObservations('');
      setSelectedAcomps([]);
      onClose();
    }
  };

  // Reiniciar selección de acompañamientos cuando cambie el plato
  useEffect(() => {
    setSelectedAcomps([]);
  }, [menuItem]);

  // Cargar acompañamientos desde API si no están en local/local env
  useEffect(() => {
    let cancelled = false;
    async function fetchGeneralAcomps() {
      try {
        const { data } = await axios.get('/api/menu/acompanamientos-generales');
        const list = Array.isArray(data?.acompanamientos) ? data.acompanamientos : [];
        if (!cancelled && list.length) {
          setGeneralAcomps(list);
          try { localStorage.setItem('acompanamientosGenerales', JSON.stringify(list)); } catch {}
        }
      } catch {
        // Silencioso: si falla, se queda con local/env
      }
    }
    // Solo intentar si no hay nada local
    if (!generalAcomps || generalAcomps.length === 0) {
      fetchGeneralAcomps();
    }
    return () => { cancelled = true; };
  }, []);

  if (!isOpen || !menuItem) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '20px',
        padding: '2rem',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          paddingBottom: '1rem',
          borderBottom: '2px solid #f3f4f6'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1f2937',
            margin: 0
          }}>
            📝 Nuevo Pedido
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              color: '#6b7280',
              padding: '0.5rem',
              borderRadius: '8px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
            }}
          >
            ✕
          </button>
        </div>

        {/* Plato seleccionado */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '2px solid #e2e8f0',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#1f2937',
            margin: 0,
            marginBottom: '0.5rem'
          }}>
            🍽️ {menuItem.nombre}
          </h3>
          <p style={{
            color: '#6b7280',
            fontSize: '0.875rem',
            margin: 0,
            marginBottom: '0.5rem'
          }}>
            {menuItem.descripcion}
          </p>
          <p style={{
            fontSize: '1.125rem',
            fontWeight: '700',
            color: '#059669',
            margin: 0
          }}>
            ${menuItem.precio.toLocaleString('es-CO')} COP
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}>
          {/* Selección de acompañamientos: usa los del plato o los generales si no hay */}
          {(() => {
            const availableAcomps = (menuItem.acompanamientos && menuItem.acompanamientos.length > 0)
              ? menuItem.acompanamientos
              : getGeneralAcompList();
            if (!availableAcomps || availableAcomps.length === 0) return null;
            const usingFallback = !(menuItem.acompanamientos && menuItem.acompanamientos.length > 0);
            return (
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                🍟 Acompañamientos {usingFallback ? ' (generales)' : ''}
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {availableAcomps.map((opt, idx) => {
                  const selected = selectedAcomps.includes(opt);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedAcomps(prev => prev.includes(opt) ? prev.filter(a => a !== opt) : [...prev, opt]);
                      }}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '9999px',
                        border: selected ? '2px solid #10b981' : '2px solid #e5e7eb',
                        background: selected ? 'rgba(16,185,129,0.1)' : 'white',
                        color: selected ? '#065f46' : '#374151',
                        cursor: 'pointer'
                      }}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
            );
          })()}
          {/* Nombre del solicitante */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              👤 Nombre del solicitante *
            </label>
            <input
              type="text"
              placeholder="Ingrese el nombre del cliente"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.2s',
                outline: 'none',
                backgroundColor: isSubmitting ? '#f9fafb' : 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Ubicación */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              📍 Ubicación del solicitante *
            </label>
            <input
              type="text"
              placeholder="Mesa 5, Terraza, Sala VIP, etc."
              value={customerLocation}
              onChange={(e) => setCustomerLocation(e.target.value)}
              required
              disabled={isSubmitting}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.2s',
                outline: 'none',
                backgroundColor: isSubmitting ? '#f9fafb' : 'white'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Observaciones */}
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '0.5rem'
            }}>
              📝 Observaciones (opcional)
            </label>
            <textarea
              placeholder="Sin cebolla, extra salsa, término medio, etc."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                border: '2px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '1rem',
                transition: 'all 0.2s',
                outline: 'none',
                backgroundColor: isSubmitting ? '#f9fafb' : 'white',
                resize: 'vertical',
                minHeight: '80px'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Botones */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginTop: '1rem'
          }}>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              style={{
                flex: 1,
                padding: '0.875rem',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  (e.currentTarget as HTMLElement).style.backgroundColor = '#e5e7eb';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#f3f4f6';
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !customerName.trim() || !customerLocation.trim()}
              style={{
                flex: 2,
                padding: '0.875rem',
                background: isSubmitting || !customerName.trim() || !customerLocation.trim()
                  ? '#9ca3af' 
                  : 'linear-gradient(135deg, #059669, #047857)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: isSubmitting || !customerName.trim() || !customerLocation.trim() 
                  ? 'not-allowed' 
                  : 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Creando pedido...
                </>
              ) : (
                <>
                  ✅ Crear Pedido
                </>
              )}
            </button>
          </div>
        </form>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
}