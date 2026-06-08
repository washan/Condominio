import React, { useEffect, useState } from 'react';
import { getEspaciosActivos, getReservas, createReserva, updateEstadoReserva, EspacioComun, Reserva } from '../../api/reservasApi';

const ReservasPage: React.FC = () => {
  const [espacios, setEspacios] = useState<EspacioComun[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [selectedEspacio, setSelectedEspacio] = useState<EspacioComun | null>(null);
  const [formData, setFormData] = useState({
    espacioId: '',
    fechaReserva: '',
    horaInicio: '',
    horaFin: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [espaciosList, reservasList] = await Promise.all([
        getEspaciosActivos(),
        getReservas(),
      ]);
      setEspacios(espaciosList);
      setReservas(reservasList);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener la información de reservas y áreas comunes.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    if (name === 'espacioId') {
      const espacio = espacios.find(es => es.id === Number(value));
      setSelectedEspacio(espacio || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      if (!formData.espacioId || !formData.fechaReserva || !formData.horaInicio || !formData.horaFin) {
        setError('Por favor complete todos los campos.');
        return;
      }

      if (formData.horaInicio >= formData.horaFin) {
        setError('La hora de inicio debe ser anterior a la hora de finalización.');
        return;
      }

      // Convert times to HH:mm:ss format for backend
      const formatTime = (timeStr: string) => {
        return timeStr.length === 5 ? `${timeStr}:00` : timeStr;
      };

      await createReserva({
        espacioId: Number(formData.espacioId),
        fechaReserva: formData.fechaReserva,
        horaInicio: formatTime(formData.horaInicio) as any,
        horaFin: formatTime(formData.horaFin) as any,
      });

      setSuccess('Solicitud de reservación registrada. Administración revisará y aprobará tu reserva.');
      setShowForm(false);
      setFormData({
        espacioId: '',
        fechaReserva: '',
        horaInicio: '',
        horaFin: '',
      });
      setSelectedEspacio(null);
      fetchData();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al solicitar la reservación.');
    }
  };

  const handleCancelReserva = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea cancelar esta reservación?')) return;
    try {
      setError(null);
      setSuccess(null);
      await updateEstadoReserva(id, 'CANCELADA');
      setSuccess('Reservación cancelada.');
      fetchData();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError('Error al cancelar la reservación.');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{
        background: 'white',
        padding: '24px 32px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 800, color: '#2D3748', margin: '0 0 4px 0' }}>
            📅 Reserva de Áreas Comunes
          </h2>
          <p style={{ color: '#718096', fontSize: '0.85rem', margin: 0 }}>Gestiona y reserva el Rancho BBQ, salón de eventos u otros espacios disponibles.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #6A11CB 0%, #2575FC 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(106,17,203,0.2)'
            }}
          >
            ➕ Nueva Reserva
          </button>
        )}
      </div>

      {error && <div style={{ padding: '16px 24px', background: '#FFF5F5', border: '1px solid #FED7D7', color: '#C53030', borderRadius: '12px', fontWeight: 600 }}>❌ {error}</div>}
      {success && <div style={{ padding: '16px 24px', background: '#F0FFF4', border: '1px solid #C6F6D5', color: '#2F855A', borderRadius: '12px', fontWeight: 600 }}>✅ {success}</div>}

      {/* Available areas cards */}
      {!showForm && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          {espacios.map(esp => (
            <div key={esp.id} style={{
              background: 'white',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              border: '1px solid #E2E8F0'
            }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#2D3748', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>
                  🏡 {esp.nombre}
                </h4>
                <p style={{ color: '#718096', fontSize: '0.82rem', lineHeight: 1.5, margin: '0 0 12px 0' }}>{esp.descripcion}</p>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#4A5568', fontWeight: 600 }}>
                  <span>👥 Capacidad: {esp.capacidadMaxima || 'N/A'} pers.</span>
                  <span>💰 Costo: {esp.costoReserva > 0 ? `₡${esp.costoReserva.toLocaleString()}` : 'Gratis'}</span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedEspacio(esp);
                  setFormData({
                    ...formData,
                    espacioId: String(esp.id)
                  });
                  setShowForm(true);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#EDF2F7',
                  border: '1px solid #CBD5E0',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: '#4A5568',
                  transition: 'all 0.2s'
                }}
              >
                Reservar Área
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Booking Form Card */}
      {showForm && (
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '16px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: '#2D3748', margin: 0 }}>
            📝 Registrar Solicitud de Reservación
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#4A5568', fontWeight: 600 }}>Área Común</label>
              <select
                name="espacioId"
                value={formData.espacioId}
                onChange={handleInputChange}
                required
                style={{ padding: '10px 12px', border: '1px solid #CBD5E0', borderRadius: '8px', outline: 'none' }}
              >
                <option value="">Seleccione el espacio...</option>
                {espacios.map(e => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#4A5568', fontWeight: 600 }}>Fecha Requerida</label>
              <input
                type="date"
                name="fechaReserva"
                value={formData.fechaReserva}
                onChange={handleInputChange}
                required
                style={{ padding: '10px 12px', border: '1px solid #CBD5E0', borderRadius: '8px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#4A5568', fontWeight: 600 }}>Hora Inicio</label>
              <input
                type="time"
                name="horaInicio"
                value={formData.horaInicio}
                onChange={handleInputChange}
                required
                style={{ padding: '10px 12px', border: '1px solid #CBD5E0', borderRadius: '8px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#4A5568', fontWeight: 600 }}>Hora Fin</label>
              <input
                type="time"
                name="horaFin"
                value={formData.horaFin}
                onChange={handleInputChange}
                required
                style={{ padding: '10px 12px', border: '1px solid #CBD5E0', borderRadius: '8px', outline: 'none' }}
              />
            </div>

            {selectedEspacio && (
              <div style={{
                gridColumn: '1 / span 2',
                background: '#EDF2F7',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                color: '#4A5568'
              }}>
                <strong>Detalles del Área:</strong> {selectedEspacio.descripcion} <br />
                <strong>Costo de Reservación:</strong> {selectedEspacio.costoReserva > 0 ? `₡${selectedEspacio.costoReserva.toLocaleString()}` : 'Gratis'} (Se cargará a su próximo recibo de cobros)
              </div>
            )}

            <div style={{ gridColumn: '1 / span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => { setShowForm(false); setSelectedEspacio(null); }}
                style={{ padding: '10px 20px', border: '1px solid #CBD5E0', background: 'none', borderRadius: '8px', cursor: 'pointer' }}
              >
                Cancelar
              </button>
              <button
                type="submit"
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #6A11CB 0%, #2575FC 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Solicitar Reserva
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bookings List Card */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#2D3748', marginBottom: '16px' }}>
          📋 Mis Solicitudes y Reservaciones
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#718096' }}>⏳ Cargando reservaciones...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#718096', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 8px' }}>Área Común</th>
                  <th style={{ padding: '12px 8px' }}>Fecha</th>
                  <th style={{ padding: '12px 8px' }}>Horario</th>
                  <th style={{ padding: '12px 8px' }}>Estado</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9rem', color: '#4A5568' }}>
                {reservas.map((res) => (
                  <tr key={res.id} style={{ borderBottom: '1px solid #EDF2F7' }}>
                    <td style={{ padding: '14px 8px', fontWeight: 600, color: '#2D3748' }}>🏡 {res.espacioNombre}</td>
                    <td style={{ padding: '14px 8px' }}>{new Date(res.fechaReserva + 'T00:00:00').toLocaleDateString()}</td>
                    <td style={{ padding: '14px 8px' }}>
                      {res.horaInicio.slice(0, 5)} a {res.horaFin.slice(0, 5)}
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background:
                          res.estado === 'PENDIENTE' ? '#FEFCBF' :
                          res.estado === 'APROBADA' ? '#C6F6D5' :
                          res.estado === 'RECHAZADA' ? '#FED7D7' : '#EDF2F7',
                        color:
                          res.estado === 'PENDIENTE' ? '#B7791F' :
                          res.estado === 'APROBADA' ? '#22543D' :
                          res.estado === 'RECHAZADA' ? '#9B2C2C' : '#4A5568',
                      }}>
                        {res.estado}
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                      {['PENDIENTE', 'APROBADA'].includes(res.estado) && (
                        <button
                          onClick={() => handleCancelReserva(res.id)}
                          style={{
                            padding: '6px 12px',
                            background: 'none',
                            border: '1px solid #FC5C7D',
                            borderRadius: '6px',
                            color: '#FC5C7D',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600
                          }}
                        >
                          Cancelar Reserva
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {reservas.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#A0AEC0' }}>
                      No tienes solicitudes de reserva registradas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReservasPage;
