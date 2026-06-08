import React, { useEffect, useState } from 'react';
import { getAllAvisos, createAviso, updateAviso, deleteAviso, Aviso } from '../../api/avisosApi';

const AvisosAdminPage: React.FC = () => {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal Control
  const [showModal, setShowModal] = useState(false);
  const [editingAviso, setEditingAviso] = useState<Aviso | null>(null);
  const [formData, setFormData] = useState({
    titulo: '',
    contenido: '',
    vigenteHasta: '',
  });

  useEffect(() => {
    fetchAvisos();
  }, []);

  const fetchAvisos = async () => {
    try {
      setLoading(true);
      const data = await getAllAvisos();
      setAvisos(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener la lista de avisos.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const openCreateModal = () => {
    setEditingAviso(null);
    setFormData({
      titulo: '',
      contenido: '',
      vigenteHasta: '',
    });
    setShowModal(true);
  };

  const openEditModal = (a: Aviso) => {
    setEditingAviso(a);
    setFormData({
      titulo: a.titulo,
      contenido: a.contenido,
      vigenteHasta: a.vigenteHasta || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      const payload = {
        titulo: formData.titulo,
        contenido: formData.contenido,
        vigenteHasta: formData.vigenteHasta || undefined,
      };

      if (editingAviso?.id) {
        const updated = await updateAviso(editingAviso.id, payload);
        setSuccess(`Aviso "${updated.titulo}" actualizado correctamente.`);
      } else {
        const created = await createAviso(payload);
        setSuccess(`Aviso "${created.titulo}" publicado correctamente.`);
      }
      setShowModal(false);
      fetchAvisos();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar el aviso.');
    }
  };

  const handleDelete = async (id: number, titulo: string) => {
    if (!window.confirm(`¿Está seguro de que desea eliminar el aviso "${titulo}"?`)) return;
    try {
      setError(null);
      setSuccess(null);
      await deleteAviso(id);
      setSuccess(`Aviso "${titulo}" eliminado correctamente.`);
      fetchAvisos();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError('Error al eliminar el aviso.');
    }
  };

  const filteredAvisos = avisos.filter(a =>
    a.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.contenido.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '1.7rem',
            fontWeight: 800,
            background: 'var(--gradient-primary)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '6px'
          }}>
            📢 Comunicados y Avisos
          </h1>
          <p style={{ color: '#A0AEC0', fontSize: '0.875rem' }}>Administración de anuncios y comunicados para los residentes.</p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            padding: '10px 20px',
            background: 'var(--gradient-accent)',
            border: 'none',
            borderRadius: 'var(--radius-button)',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(255, 107, 53, 0.3)',
            transition: 'all 0.2s'
          }}
        >
          ➕ Crear Comunicado
        </button>
      </div>

      {/* Alerts */}
      {error && <div className="glass-card" style={{ padding: '16px 24px', background: 'rgba(252,92,125,0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)', borderRadius: '12px', fontWeight: 600 }}>❌ {error}</div>}
      {success && <div className="glass-card" style={{ padding: '16px 24px', background: 'rgba(72,187,120,0.1)', border: '1px solid var(--color-success)', color: 'var(--color-success)', borderRadius: '12px', fontWeight: 600 }}>✅ {success}</div>}

      {/* Main Section */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="🔍 Buscar comunicado por título o contenido..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '0.9rem'
            }}
          />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#A0AEC0' }}>⏳ Cargando comunicados...</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Fecha Publicación</th>
                  <th>Vigente Hasta</th>
                  <th>Autor</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAvisos.map((aviso) => (
                  <tr key={aviso.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'white' }}>{aviso.titulo}</div>
                      <div style={{ fontSize: '0.78rem', color: '#A0AEC0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '350px', marginTop: '4px' }}>
                        {aviso.contenido}
                      </div>
                    </td>
                    <td>{aviso.fechaPublicacion ? new Date(aviso.fechaPublicacion).toLocaleString() : '—'}</td>
                    <td>
                      {aviso.vigenteHasta ? (
                        new Date(aviso.vigenteHasta + 'T00:00:00').toLocaleDateString()
                      ) : (
                        <span style={{ color: '#48BB78', fontWeight: 600 }}>Siempre vigente</span>
                      )}
                    </td>
                    <td>{aviso.creadoPorNombre || 'Administración'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditModal(aviso)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--color-border)',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleDelete(aviso.id, aviso.titulo)}
                          style={{
                            padding: '6px 12px',
                            background: 'rgba(252,92,125,0.1)',
                            border: '1px solid var(--color-error)',
                            borderRadius: '6px',
                            color: 'var(--color-error)',
                            cursor: 'pointer',
                            fontSize: '0.8rem'
                          }}
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredAvisos.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: '#A0AEC0', padding: '24px' }}>
                      No se encontraron comunicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-card" style={{ padding: '32px', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', color: 'white', fontWeight: 700, margin: 0 }}>
              {editingAviso ? '✏️ Editar Comunicado' : '📢 Nuevo Comunicado'}
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', fontWeight: 600 }}>Título del Comunicado</label>
                <input
                  type="text"
                  name="titulo"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  required
                  placeholder="Ej: Suspensión temporal de servicio eléctrico"
                  style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', fontWeight: 600 }}>Contenido</label>
                <textarea
                  name="contenido"
                  value={formData.contenido}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  placeholder="Detalle completo del comunicado..."
                  style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'white',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', fontWeight: 600 }}>Vigente Hasta (Opcional)</label>
                <input
                  type="date"
                  name="vigenteHasta"
                  value={formData.vigenteHasta}
                  onChange={handleInputChange}
                  style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
                <span style={{ fontSize: '0.75rem', color: '#718096' }}>Si se deja en blanco, el aviso se considerará visible de forma indefinida.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: 'var(--gradient-primary)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  {editingAviso ? 'Guardar Cambios' : 'Publicar Aviso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvisosAdminPage;
