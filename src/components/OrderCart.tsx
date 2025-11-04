import type { PedidoItem } from '../types';

interface OrderCartProps {
  items: PedidoItem[];
  onUpdateQuantity: (name: string, quantity: number) => void;
  onRemoveItem: (name: string) => void;
  total: number;
}

export default function OrderCart({ items, onUpdateQuantity, onRemoveItem, total }: OrderCartProps) {
  if (items.length === 0) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
        margin: '1rem 0'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛒</div>
        <h4 style={{ color: '#6b7280', marginBottom: '0.5rem' }}>Carrito vacío</h4>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
          Agrega algunos platos del menú para comenzar
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '2rem',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      margin: '1rem 0'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem'
      }}>
        <h4 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#1f2937',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🛒 Pedido Actual
        </h4>
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
        </div>
      </div>

      <div style={{
        background: 'linear-gradient(145deg, #f8fafc, #e2e8f0)',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        {items.map((item, index) => (
          <div
            key={item.name}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 0',
              borderBottom: index < items.length - 1 ? '1px solid rgba(148, 163, 184, 0.2)' : 'none'
            }}
          >
            <div style={{ flex: 1 }}>
              <h5 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '0.25rem'
              }}>
                {item.name}
              </h5>
              <div style={{
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                ${item.price.toLocaleString()} c/u
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              {/* Controles de cantidad */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'white',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => onUpdateQuantity(item.name, Math.max(1, item.quantity - 1))}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontSize: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px'
                  }}
                >
                  ➖
                </button>
                
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => onUpdateQuantity(item.name, Math.max(1, Number(e.target.value)))}
                  min={1}
                  style={{
                    width: '60px',
                    textAlign: 'center',
                    border: 'none',
                    outline: 'none',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    background: 'transparent'
                  }}
                />
                
                <button
                  onClick={() => onUpdateQuantity(item.name, item.quantity + 1)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '0.5rem',
                    cursor: 'pointer',
                    color: '#6b7280',
                    fontSize: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '40px',
                    height: '40px'
                  }}
                >
                  ➕
                </button>
              </div>

              {/* Subtotal */}
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '700',
                color: '#059669',
                minWidth: '100px',
                textAlign: 'right'
              }}>
                ${(item.price * item.quantity).toLocaleString()}
              </div>

              {/* Botón eliminar */}
              <button
                onClick={() => onRemoveItem(item.name)}
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                }}
                title="Eliminar del pedido"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        borderRadius: '16px',
        color: 'white'
      }}>
        <div>
          <div style={{
            fontSize: '1rem',
            opacity: 0.9,
            marginBottom: '0.25rem'
          }}>
            Total del pedido
          </div>
          <div style={{
            fontSize: '0.875rem',
            opacity: 0.8
          }}>
            {items.reduce((sum, item) => sum + item.quantity, 0)} artículos
          </div>
        </div>
        
        <div style={{
          fontSize: '2rem',
          fontWeight: '700'
        }}>
          ${total.toLocaleString()}
        </div>
      </div>

      {/* Resumen rápido */}
      <div style={{
        marginTop: '1rem',
        padding: '1rem',
        background: '#f0f9ff',
        borderRadius: '12px',
        border: '1px solid #bae6fd'
      }}>
        <div style={{
          fontSize: '0.875rem',
          color: '#0369a1',
          fontWeight: '600',
          marginBottom: '0.5rem'
        }}>
          📋 Resumen del pedido:
        </div>
        <div style={{
          fontSize: '0.75rem',
          color: '#0284c7',
          lineHeight: '1.4'
        }}>
          {items.map(item => `${item.name} (${item.quantity})`).join(' • ')}
        </div>
      </div>
    </div>
  );
}