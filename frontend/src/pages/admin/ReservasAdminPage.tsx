import React, { useEffect, useState } from 'react';
import { 
  getReservas, 
  updateEstadoReserva, 
  getTodosLosEspacios, 
  crearEspacio, 
  actualizarEspacio, 
  Reserva, 
  EspacioComun 
} from '../../api/reservasApi';

const ReservasAdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'reservas' | 'espacios'>('reservas');
  
  // Reservas States
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState<'all' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA'>('all');
  const [loading, setLoading] = useState(true);
  
  // Espacios States
  const [espacios, setEspacios] = useState<EspacioComun[]>([]);
  const [loadingEspacios, setLoadingEspacios] = useState(false);
  const [showEspacioModal, setShowEspacioModal] = useState(false);
  const [editingEspacio, setEditingEspacio] = useState<EspacioComun | null>(null);
  const [espacioForm, setEspacioForm] = useState({
    nombre: '',
    descripcion: '',
    capacidadMaxima: '',
    costoReserva: '',
    activa: true
  });

  // Global messages
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'reservas') {
      fetchReservas();
    } else {
      fetchEspacios();
    }
  }, [activeTab]);

  const fetchReservas = async () => {
    try {
      setLoading(true);
      const data = await getReservas();
      setReservas(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener la lista de reservaciones.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEspacios = async () => {
    try {
      setLoadingEspacios(true);
      const data = await getTodosLosEspacios();
      setEspacios(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener la lista de áreas comunes.');
    } finally {
      setLoadingEspacios(false);
    }
  };

  const handleUpdateStatus = async (id: number, nuevoEstado: 'APROBADA' | 'RECHAZADA' | 'CANCELADA') => {
    const actionVerb = nuevoEstado === 'APROBADA' ? 'aprobar' : nuevoEstado === 'RECHAZADA' ? 'rechazar' : 'cancelar';
    if (!window.confirm(`¿Está seguro de que desea ${actionVerb} esta reservación?`)) return;

    try {
      setError(null);
      setSuccess(null);
      await updateEstadoReserva(id, nuevoEstado);
      setSuccess(`Reservación actualizada a ${nuevoEstado} exitosamente.`);
      fetchReservas();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al actualizar el estado de la reservación.');
    }
  };

  // Espacio Form handlers
  const openCreateEspacioModal = () => {
    setEditingEspacio(null);
    setEspacioForm({
      nombre: '',
      descripcion: '',
      capacidadMaxima: '',
      costoReserva: '',
      activa: true
    });
    setShowEspacioModal(true);
  };

  const openEditEspacioModal = (espacio: EspacioComun) => {
    setEditingEspacio(espacio);
    setEspacioForm({
      nombre: espacio.nombre,
      descripcion: espacio.descripcion || '',
      capacidadMaxima: espacio.capacidadMaxima?.toString() || '',
      costoReserva: espacio.costoReserva.toString(),
      activa: espacio.activa
    });
    setShowEspacioModal(true);
  };

  const handleEspacioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      const payload = {
        nombre: espacioForm.nombre.trim(),
        descripcion: espacioForm.descripcion.trim() || undefined,
        capacidadMaxima: espacioForm.capacidadMaxima ? parseInt(espacioForm.capacidadMaxima) : undefined,
        costoReserva: parseFloat(espacioForm.costoReserva) || 0,
        activa: espacioForm.activa
      };

      if (editingEspacio?.id) {
        await actualizarEspacio(editingEspacio.id, { ...payload, id: editingEspacio.id });
        setSuccess(`Área común "${payload.nombre}" actualizada correctamente.`);
      } else {
        await crearEspacio(payload);
        setSuccess(`Área común "${payload.nombre}" creada correctamente.`);
      }

      setShowEspacioModal(false);
      fetchEspacios();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar el área común.');
    }
  };

  const filteredReservas = reservas.filter(r => {
    const matchesSearch = r.unidadNumero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.espacioNombre?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'all' || r.estado === filterEstado;
    return matchesSearch && matchesEstado;
  });

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
            📅 Control de Reservaciones y Áreas
          </h1>
          <p style={{ color: '#A0AEC0', fontSize: '0.875rem' }}>
            Aprobación de uso y configuración de las áreas comunes del condominio.
          </p>
        </div>
        
        {activeTab === 'espacios' && (
          <button className="btn btn-primary" onClick={openCreateEspacioModal}>
            ➕ Nueva Área
          </button>
        )}
      </div>

      {/* Tabs Row */}
      <div style={{ display: 'flex', gap: '12px', padding: '0 4px' }}>
        <button
          className={`btn ${activeTab === 'reservas' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('reservas')}
        >
          📅 Ver Reservaciones
        </button>
        <button
          className={`btn ${activeTab === 'espacios' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('espacios')}
        >
          🏡 Configurar Áreas Comunes
        </button>
      </div>

      {error && <div className="glass-card" style={{ padding: '16px 24px', background: 'rgba(252,92,125,0.1)', border: '1px solid var(--color-error)', color: 'var(--color-error)', borderRadius: '12px', fontWeight: 600 }}>❌ {error}</div>}
      {success && <div className="glass-card" style={{ padding: '16px 24px', background: 'rgba(72,187,120,0.1)', border: '1px solid var(--color-success)', color: 'var(--color-success)', borderRadius: '12px', fontWeight: 600 }}>✅ {success}</div>}

      {/* TAB 1: RESERVAS */}
      {activeTab === 'reservas' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por casa o área común..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '12px 16px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--color-border)',
                borderRadius: '10px',
                color: 'white',
                fontSize: '0.9rem'
              }}
            />

            <div style={{ display: 'flex', gap: '6px' }}>
              {(['all', 'PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA'] as const).map(estado => (
                <button
                  key={estado}
                  onClick={() => setFilterEstado(estado)}
                  style={{
                    padding: '8px 16px',
                    background: filterEstado === estado ? 'rgba(106,17,203,0.2)' : 'rgba(255,255,255,0.05)',
                    border: filterEstado === estado ? '1px solid rgba(106,17,203,0.5)' : '1px solid var(--color-border)',
                    color: filterEstado === estado ? 'white' : '#718096',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {estado === 'all' ? 'Todas' : estado}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#A0AEC0' }}>⏳ Cargando reservaciones...</div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Área Común</th>
                    <th>Casa</th>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReservas.map((res) => (
                    <tr key={res.id}>
                      <td>
                        <strong style={{ color: 'white' }}>🏡 {res.espacioNombre}</strong>
                      </td>
                      <td>
                        <span style={{ color: 'white', fontWeight: 600 }}>#{res.unidadNumero}</span>
                      </td>
                      <td>{new Date(res.fechaReserva + 'T00:00:00').toLocaleDateString()}</td>
                      <td>
                        {res.horaInicio.slice(0, 5)} a {res.horaFin.slice(0, 5)}
                      </td>
                      <td>
                        <span className={`badge ${
                          res.estado === 'PENDIENTE' ? 'badge-warning' :
                          res.estado === 'APROBADA' ? 'badge-success' :
                          res.estado === 'RECHAZADA' ? 'badge-error' : 'badge-info'
                        }`}>
                          {res.estado === 'PENDIENTE' ? '⏳ Pendiente' :
                           res.estado === 'APROBADA' ? '✅ Aprobada' :
                           res.estado === 'RECHAZADA' ? '❌ Rechazada' : '🚫 Cancelada'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {res.estado === 'PENDIENTE' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'APROBADA')}
                                style={{
                                  padding: '6px 12px',
                                  background: 'rgba(72,187,120,0.1)',
                                  border: '1px solid var(--color-success)',
                                  borderRadius: '6px',
                                  color: 'var(--color-success)',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 600
                                }}
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => handleUpdateStatus(res.id, 'RECHAZADA')}
                                style={{
                                  padding: '6px 12px',
                                  background: 'rgba(252,92,125,0.1)',
                                  border: '1px solid var(--color-error)',
                                  borderRadius: '6px',
                                  color: 'var(--color-error)',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  fontWeight: 600
                                }}
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {['PENDIENTE', 'APROBADA'].includes(res.estado) && (
                            <button
                              onClick={() => handleUpdateStatus(res.id, 'CANCELADA')}
                              style={{
                                padding: '6px 12px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                color: '#A0AEC0',
                                cursor: 'pointer',
                                fontSize: '0.8rem'
                              }}
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredReservas.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#A0AEC0', padding: '24px' }}>
                        No se encontraron reservaciones.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ESPACIOS (ÁREAS COMUNES) */}
      {activeTab === 'espacios' && (
        <div className="glass-card" style={{ padding: '24px' }}>
          {loadingEspacios ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#A0AEC0' }}>⏳ Cargando áreas comunes...</div>
          ) : (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre de Área</th>
                    <th>Descripción</th>
                    <th>Capacidad Máxima</th>
                    <th>Costo de Reserva</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {espacios.map((esp) => (
                    <tr key={esp.id}>
                      <td>
                        <strong style={{ color: 'white' }}>🏡 {esp.nombre}</strong>
                      </td>
                      <td>{esp.descripcion || <span style={{ color: '#718096' }}>Sin descripción</span>}</td>
                      <td>
                        {esp.capacidadMaxima ? `${esp.capacidadMaxima} personas` : <span style={{ color: '#718096' }}>Sin límite</span>}
                      </td>
                      <td>
                        <span style={{ color: '#48BB78', fontWeight: 600 }}>
                          ₡{esp.costoReserva.toLocaleString('es-CR')}
                        </span>
                      </td>
                      <td>
                        {esp.activa ? (
                          <span className="badge badge-success">Activa</span>
                        ) : (
                          <span className="badge badge-error">Inactiva</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => openEditEspacioModal(esp)}
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
                      </td>
                    </tr>
                  ))}
                  {espacios.length === 0 && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#A0AEC0', padding: '24px' }}>
                        No hay áreas comunes configuradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CREATE/EDIT ESPACIO MODAL */}
      {showEspacioModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 8, 25, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '60px 0',
          overflowY: 'auto',
          zIndex: 1000,
        }} className="fade-in">
          <div className="glass-card" style={{ width: '480px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#1A1A2E' }}>
            <h2 className="section-title" style={{ margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              {editingEspacio ? `✏️ Editar Área: ${editingEspacio.nombre}` : '🏡 Crear Nueva Área Común'}
            </h2>
            <form onSubmit={handleEspacioSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Nombre del Área</label>
                <input
                  type="text"
                  value={espacioForm.nombre}
                  onChange={(e) => setEspacioForm({ ...espacioForm, nombre: e.target.value })}
                  className="form-input"
                  placeholder="Ej: Rancho BBQ Principal"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Descripción</label>
                <textarea
                  value={espacioForm.descripcion}
                  onChange={(e) => setEspacioForm({ ...espacioForm, descripcion: e.target.value })}
                  className="form-input"
                  placeholder="Detalles sobre el uso, equipamiento, etc."
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Capacidad Máxima</label>
                  <input
                    type="number"
                    value={espacioForm.capacidadMaxima}
                    onChange={(e) => setEspacioForm({ ...espacioForm, capacidadMaxima: e.target.value })}
                    className="form-input"
                    placeholder="Opcional"
                    min="1"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Costo por Reserva (₡)</label>
                  <input
                    type="number"
                    value={espacioForm.costoReserva}
                    onChange={(e) => setEspacioForm({ ...espacioForm, costoReserva: e.target.value })}
                    className="form-input"
                    placeholder="Ej: 5000"
                    min="0"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  id="checkbox-espacio-activa"
                  checked={espacioForm.activa}
                  onChange={(e) => setEspacioForm({ ...espacioForm, activa: e.target.checked })}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <label htmlFor="checkbox-espacio-activa" style={{ color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>Área Habilitada para Reservaciones</label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowEspacioModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEspacio ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservasAdminPage;
