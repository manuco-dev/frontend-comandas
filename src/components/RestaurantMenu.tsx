import React, { useState, useMemo } from 'react';
import { useApp } from '../context/appcontext';
import OrderModal from './OrderModal';
import type { MenuItem } from '../types';

interface RestaurantMenuProps {
  onCreateOrder: (orderData: {
    customerName: string;
    customerLocation: string;
    observations: string;
    menuItem: MenuItem;
  }) => void;
}

const categoryIcons: Record<string, string> = {
  'Entradas': '🥗',
  'Platos Principales': '🍽️',
  'Postres': '🍰',
  'Bebidas': '🥤',
  'Especiales': '⭐',
  'default': '🍴'
};

const categoryColors: Record<string, string> = {
  'Entradas': '#10b981',
  'Platos Principales': '#f59e0b',
  'Postres': '#ec4899',
  'Bebidas': '#3b82f6',
  'Especiales': '#8b5cf6',
  'default': '#6b7280'
};

export default function RestaurantMenu({ onCreateOrder }: RestaurantMenuProps) {
  const { menu } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(menu.map(item => item.categoria)));
    return ['all', ...cats];
  }, [menu]);

  const filteredMenu = useMemo(() => {
    let filtered = menu;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.categoria === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descripcion?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [menu, selectedCategory, searchTerm]);

  const handleItemClick = (item: MenuItem) => {
    if (item.disponible) {
      setSelectedMenuItem(item);
      setIsModalOpen(true);
    }
  };

  const handleOrderSubmit = async (orderData: {
    customerName: string;
    customerLocation: string;
    observations: string;
    menuItem: MenuItem;
  }) => {
    await onCreateOrder(orderData);
  };

  const getItemQuantityInCart = (itemName: string) => {
    return 0; // Ya no usamos carrito, siempre retorna 0
  };

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
        marginBottom: '2rem'
      }}>
        <h3 style={{
          fontSize: '1.875rem',
          fontWeight: '700',
          color: '#1f2937',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          🍽️ Menú del Restaurante
        </h3>
        <div style={{
          background: 'linear-gradient(135deg, #34d399, #10b981)',
          color: 'white',
          padding: '0.5rem 1rem',
          borderRadius: '20px',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          {filteredMenu.length} platos disponibles
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="🔍 Buscar platos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            border: '2px solid #e5e7eb',
            borderRadius: '12px',
            fontSize: '1rem',
            outline: 'none',
            transition: 'border-color 0.2s'
          }}
          onFocus={(e) => e.target.style.borderColor = '#667eea'}
          onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
        />
      </div>

      {/* Filtros de categoría */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        marginBottom: '2rem',
        flexWrap: 'wrap'
      }}>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '20px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: selectedCategory === category
                ? 'linear-gradient(135deg, #667eea, #764ba2)'
                : '#f8fafc',
              color: selectedCategory === category ? 'white' : '#64748b'
            }}
          >
            {category === 'all' ? '🍴' : categoryIcons[category] || categoryIcons.default}
            {category === 'all' ? 'Todos' : category}
          </button>
        ))}
      </div>

      {/* Grid de platos */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        {filteredMenu.map(item => {
          const quantityInCart = getItemQuantityInCart(item.nombre);
          const categoryColor = categoryColors[item.categoria] || categoryColors.default;
          
          return (
            <div
              key={item._id}
              style={{
                background: 'linear-gradient(145deg, #ffffff, #f8fafc)',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.5rem',
                transition: 'all 0.3s',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Indicador de categoría */}
              <div style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: categoryColor,
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '12px',
                fontSize: '0.75rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                {categoryIcons[item.categoria] || categoryIcons.default}
                {item.categoria}
              </div>

              {/* Contenido del plato */}
              <div style={{ marginBottom: '1rem', paddingRight: '4rem' }}>
                <h4 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: '#1f2937',
                  marginBottom: '0.5rem',
                  lineHeight: '1.3'
                }}>
                  {item.nombre}
                </h4>
                
                {item.descripcion && (
                  <p style={{
                    color: '#6b7280',
                    fontSize: '0.875rem',
                    lineHeight: '1.5',
                    marginBottom: '0.75rem'
                  }}>
                    {item.descripcion}
                  </p>
                )}

                {item.tiempoPreparacion && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#6b7280',
                    fontSize: '0.75rem',
                    marginBottom: '0.5rem'
                  }}>
                    ⏱️ {item.tiempoPreparacion} min
                  </div>
                )}
              </div>

              {/* Precio y botón */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: categoryColor
                }}>
                  ${item.precio.toLocaleString()}
                </div>

                <button
                  onClick={() => handleItemClick(item)}
                  disabled={!item.disponible}
                  style={{
                    background: item.disponible
                      ? 'linear-gradient(135deg, #34d399, #10b981)'
                      : '#9ca3af',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    cursor: item.disponible ? 'pointer' : 'not-allowed',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    position: 'relative'
                  }}
                >
                  {!item.disponible ? (
                    '❌ No disponible'
                  ) : (
                    '📝 Crear Pedido'
                  )}
                </button>
              </div>

              {/* Ingredientes/Alérgenos si existen */}
              {(item.ingredientes?.length || item.alergenos?.length) && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  color: '#64748b'
                }}>
                  {item.ingredientes?.length && (
                    <div style={{ marginBottom: '0.25rem' }}>
                      <strong>Ingredientes:</strong> {item.ingredientes.join(', ')}
                    </div>
                  )}
                  {item.alergenos?.length && (
                    <div>
                      <strong>⚠️ Alérgenos:</strong> {item.alergenos.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredMenu.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
          <h4 style={{ marginBottom: '0.5rem' }}>No se encontraron platos</h4>
          <p>Intenta cambiar los filtros o el término de búsqueda</p>
        </div>
      )}

      {/* Modal para crear pedido */}
      <OrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        menuItem={selectedMenuItem}
        onSubmit={handleOrderSubmit}
      />
    </div>
  );
}