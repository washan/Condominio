import React, { useEffect, useState } from 'react';
import { getMisInvitados, createInvitado, updateEstadoInvitado, Invitado } from '../../api/invitadosApi';

const InvitadosPage: React.FC = () => {
  const [invitados, setInvitados] = useState<Invitado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    identificacion: '',
    placaVehiculo: '',
    fechaHoraDesde: '',
    fechaHoraHasta: '',
  });

  useEffect(() => {
    fetchInvitados();
  }, []);

  const fetchInvitados = async () => {
    try {
      setLoading(true);
      const data = await getMisInvitados();
      setInvitados(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener la lista de invitados.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      if (new Date(formData.fechaHoraDesde) >= new Date(formData.fechaHoraHasta)) {
        setError('La fecha y hora de inicio debe ser anterior a la de finalización.');
        return;
      }

      await createInvitado({
        nombre: formData.nombre,
        identificacion: formData.identificacion || undefined,
        placaVehiculo: formData.placaVehiculo || undefined,
        fechaHoraDesde: formData.fechaHoraDesde,
        fechaHoraHasta: formData.fechaHoraHasta,
      });

      setSuccess('Invitado registrado exitosamente. Ya está autorizado en la aguja de seguridad.');
      setShowForm(false);
      setFormData({
        nombre: '',
        identificacion: '',
        placaVehiculo: '',
        fechaHoraDesde: '',
        fechaHoraHasta: '',
      });
      fetchInvitados();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al registrar el invitado.');
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea cancelar esta invitación? El visitante ya no podrá ingresar.')) return;
    try {
      setError(null);
      setSuccess(null);
      await updateEstadoInvitado(id, 'CANCELADO');
      setSuccess('Invitación cancelada.');
      fetchInvitados();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError('Error al cancelar la invitación.');
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
            👥 Control de Invitados
          </h2>
          <p style={{ color: '#718096', fontSize: '0.85rem', margin: 0 }}>Programa las visitas de familiares, amigos o servicios para un acceso rápido y seguro.</p>
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
            ➕ Programar Invitado
          </button>
        )}
      </div>

      {error && <div style={{ padding: '16px 24px', background: '#FFF5F5', border: '1px solid #FED7D7', color: '#C53030', borderRadius: '12px', fontWeight: 600 }}>❌ {error}</div>}
      {success && <div style={{ padding: '16px 24px', background: '#F0FFF4', border: '1px solid #C6F6D5', color: '#2F855A', borderRadius: '12px', fontWeight: 600 }}>✅ {success}</div>}

      {/* Form Card */}
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
            📝 Registrar Nuevo Invitado
          </h3>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#4A5568', fontWeight: 600 }}>Nombre Completo</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
                placeholder="Nombre de la visita"
                style={{ padding: '10px 12px', border: '1px solid #CBD5E0', borderRadius: '8px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#4A5568', fontWeight: 600 }}>Cédula / Identificación (Opcional)</label>
              <input
                type="text"
                name="identificacion"
                value={formData.identificacion}
                onChange={handleInputChange}
                placeholder="Ej: 1-1234-5678"
                style={{ padding: '10px 12px', border: '1px solid #CBD5E0', borderRadius: '8px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#4A5568', fontWeight: 600 }}>Placa del Vehículo (Opcional)</label>
              <input
                type="text"
                name="placaVehiculo"
                value={formData.placaVehiculo}
                onChange={handleInputChange}
                placeholder="Ej: BCD-123"
                style={{ padding: '10px 12px', border: '1px solid #CBD5E0', borderRadius: '8px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {/* Spacer */}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#4A5568', fontWeight: 600 }}>Ingreso Autorizado Desde</label>
              <input
                type="datetime-local"
                name="fechaHoraDesde"
                value={formData.fechaHoraDesde}
                onChange={handleInputChange}
                required
                style={{ padding: '10px 12px', border: '1px solid #CBD5E0', borderRadius: '8px', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.8rem', color: '#4A5568', fontWeight: 600 }}>Ingreso Autorizado Hasta</label>
              <input
                type="datetime-local"
                name="fechaHoraHasta"
                value={formData.fechaHoraHasta}
                onChange={handleInputChange}
                required
                style={{ padding: '10px 12px', border: '1px solid #CBD5E0', borderRadius: '8px', outline: 'none' }}
              />
            </div>

            <div style={{ gridColumn: '1 / span 2', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => setShowForm(false)}
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
                Autorizar Entrada
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History Card */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: '#2D3748', marginBottom: '16px' }}>
          📋 Historial de Invitados del Mes
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: '#718096' }}>⏳ Cargando historial...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#718096', fontSize: '0.85rem' }}>
                  <th style={{ padding: '12px 8px' }}>Nombre</th>
                  <th style={{ padding: '12px 8px' }}>Placa Vehículo</th>
                  <th style={{ padding: '12px 8px' }}>Desde</th>
                  <th style={{ padding: '12px 8px' }}>Hasta</th>
                  <th style={{ padding: '12px 8px' }}>Estado</th>
                  <th style={{ padding: '12px 8px', textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9rem', color: '#4A5568' }}>
                {invitados.map((inv) => (
                  <tr key={inv.id} style={{ borderBottom: '1px solid #EDF2F7' }}>
                    <td style={{ padding: '14px 8px' }}>
                      <div style={{ fontWeight: 600, color: '#2D3748' }}>{inv.nombre}</div>
                      {inv.identificacion && <div style={{ fontSize: '0.75rem', color: '#A0AEC0' }}>ID: {inv.identificacion}</div>}
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      {inv.placaVehiculo ? (
                        <span style={{ background: '#EDF2F7', padding: '4px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.8rem' }}>{inv.placaVehiculo}</span>
                      ) : (
                        <span style={{ color: '#A0AEC0' }}>Sin vehículo</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 8px' }}>{new Date(inv.fechaHoraDesde).toLocaleString()}</td>
                    <td style={{ padding: '14px 8px' }}>{new Date(inv.fechaHoraHasta).toLocaleString()}</td>
                    <td style={{ padding: '14px 8px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background:
                          inv.estado === 'PENDIENTE' ? '#FEFCBF' :
                          inv.estado === 'INGRESADO' ? '#EBF8FF' :
                          inv.estado === 'SALIDO' ? '#EDF2F7' : '#FED7D7',
                        color:
                          inv.estado === 'PENDIENTE' ? '#B7791F' :
                          inv.estado === 'INGRESADO' ? '#2B6CB0' :
                          inv.estado === 'SALIDO' ? '#4A5568' : '#C53030',
                      }}>
                        {inv.estado}
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px', textAlign: 'right' }}>
                      {inv.estado === 'PENDIENTE' && (
                        <button
                          onClick={() => handleCancel(inv.id)}
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
                          Cancelar Acceso
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {invitados.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#A0AEC0' }}>
                      No has registrado ningún invitado este mes.
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

export default InvitadosPage;
