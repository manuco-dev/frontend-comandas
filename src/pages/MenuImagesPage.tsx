import { useEffect, useState } from 'react';
import axios from 'axios';
import type { MenuItem } from '../types';
import PageHeader from '../components/PageHeader';
import { uploadImageToBlob } from '../services/blobService';

export default function MenuImagesPage() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [fileMap, setFileMap] = useState<Record<string, File | null>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    const { data } = await axios.get<MenuItem[]>('/api/menu');
    setItems(data);
  }

  function setFile(id: string, file: File | null) {
    setFileMap(prev => ({ ...prev, [id]: file }));
  }

  async function uploadImage(item: MenuItem) {
    const file = fileMap[item._id];
    if (!file) return;
    try {
      setLoadingMap(prev => ({ ...prev, [item._id]: true }));
      const res = await uploadImageToBlob(file, { folder: 'menu-images' });
      const url = res.url || res.downloadUrl;
      if (!url) throw new Error('No se obtuvo URL de Blob');
      const { data } = await axios.put(`/api/menu/${item._id}`, { imagen: url });
      // Cache-busting para forzar que el navegador recargue la imagen
      const newUrl = data.imagen || url;
      const bustedUrl = `${newUrl}${newUrl.includes('?') ? '&' : '?'}v=${Date.now()}`;
      setItems(prev => prev.map(it => (it._id === item._id ? { ...it, imagen: bustedUrl } : it)));
      setFile(item._id, null);
    } catch (e: any) {
      alert(e?.response?.data?.error || e?.message || 'Error subiendo imagen');
    } finally {
      setLoadingMap(prev => ({ ...prev, [item._id]: false }));
    }
  }

  const filtered = items.filter(it => 
    it.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (it.tipoPlato || '').toLowerCase().includes(search.toLowerCase())
  );

  const API_URL = (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:5000';

  return (
    <div>
      <PageHeader
        title="Imágenes de Platos"
        subtitle="Sube y gestiona las imágenes visibles para meseros"
      />
      <div style={{ marginBottom: '1rem' }}>
        <input
          className="input"
          placeholder="Buscar platos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '1rem'
      }}>
        {filtered.map(item => (
          <div key={item._id} className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="card-title" style={{ marginBottom: '0.25rem' }}>{item.nombre}</h3>
                <p className="card-subtitle" style={{ margin: 0 }}>{item.categoria}{item.proteina ? ` · ${item.proteina}` : ''}</p>
              </div>
            </div>
            {item.imagen && (
              <img
                key={`${item._id}-${item.imagen}`}
                src={item.imagen.startsWith('/uploads') ? `${API_URL}${item.imagen}` : item.imagen}
                alt={item.nombre}
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', alignItems: 'center' }}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(item._id, e.target.files?.[0] || null)}
              />
              <button
                className="btn"
                disabled={!fileMap[item._id] || !!loadingMap[item._id]}
                onClick={() => uploadImage(item)}
              >
                {loadingMap[item._id] ? 'Subiendo...' : (item.imagen ? 'Actualizar Imagen' : 'Subir Imagen')}
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="card">
            <div className="card-body">No hay platos que coincidan con la búsqueda</div>
          </div>
        )}
      </div>
    </div>
  );
}