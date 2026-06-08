import React, { useEffect, useState } from 'react';
import { getUnidades, createUnidad, updateUnidad, Unidad } from '../../api/unidadesApi';
import { getMedidoresPorUnidad, createMedidor, updateMedidor, Medidor } from '../../api/medidoresApi';

const UnidadesPage: React.FC = () => {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Unidades modal & form
  const [showUnidadModal, setShowUnidadModal] = useState(false);
  const [editingUnidad, setEditingUnidad] = useState<Unidad | null>(null);
  const [unidadFormData, setUnidadFormData] = useState({
    numero: '',
    nombrePropietario: '',
    email: '',
    telefono: '',
    activa: true,
  });

  // Medidores modal & list
  const [selectedUnidad, setSelectedUnidad] = useState<Unidad | null>(null);
  const [medidores, setMedidores] = useState<Medidor[]>([]);
  const [loadingMeters, setLoadingMeters] = useState(false);
  const [showMeterForm, setShowMeterForm] = useState(false);
  const [editingMeter, setEditingMeter] = useState<Medidor | null>(null);
  const [meterFormData, setMeterFormData] = useState({
    codigoInterno: '',
    activo: true,
    fechaInstalacion: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchUnidades();
  }, []);

  const fetchUnidades = async () => {
    try {
      setLoading(true);
      const data = await getUnidades();
      // Orden natural por número de casa
      const sorted = [...data].sort((a, b) =>
        a.numero.localeCompare(b.numero, undefined, { numeric: true, sensitivity: 'base' })
      );
      setUnidades(sorted);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener la lista de casas del condominio.');
    } finally {
      setLoading(false);
    }
  };

  const fetchMedidores = async (unidadId: number) => {
    try {
      setLoadingMeters(true);
      const data = await getMedidoresPorUnidad(unidadId);
      // Ordenar: activos primero, luego por fecha de instalación descendente
      const sorted = [...data].sort((a, b) => {
        if (a.activo && !b.activo) return -1;
        if (!a.activo && b.activo) return 1;
        return new Date(b.fechaInstalacion).getTime() - new Date(a.fechaInstalacion).getTime();
      });
      setMedidores(sorted);
    } catch (err) {
      console.error('Error al obtener medidores:', err);
    } finally {
      setLoadingMeters(false);
    }
  };

  // Unidad actions
  const openCreateUnidadModal = () => {
    setEditingUnidad(null);
    setUnidadFormData({
      numero: '',
      nombrePropietario: '',
      email: '',
      telefono: '',
      activa: true,
    });
    setShowUnidadModal(true);
  };

  const openEditUnidadModal = (u: Unidad) => {
    setEditingUnidad(u);
    setUnidadFormData({
      numero: u.numero,
      nombrePropietario: u.propietario || '',
      email: u.email || '',
      telefono: u.telefono || '',
      activa: u.activo,
    });
    setShowUnidadModal(true);
  };

  const handleUnidadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      const payload = {
        numero: unidadFormData.numero,
        nombrePropietario: unidadFormData.nombrePropietario,
        email: unidadFormData.email,
        telefono: unidadFormData.telefono,
        activa: unidadFormData.activa,
      };

      if (editingUnidad?.id) {
        await updateUnidad(editingUnidad.id, payload);
        setSuccess(`Casa #${unidadFormData.numero} actualizada correctamente.`);
      } else {
        await createUnidad(payload);
        setSuccess(`Casa #${unidadFormData.numero} creada correctamente.`);
      }
      
      setShowUnidadModal(false);
      fetchUnidades();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar la casa.');
    }
  };

  // Medidor actions
  const openGestionarMedidores = (u: Unidad) => {
    setSelectedUnidad(u);
    fetchMedidores(u.id);
    setShowMeterForm(false);
    setEditingMeter(null);
  };

  const handleMeterFormOpen = (m?: Medidor) => {
    if (m) {
      setEditingMeter(m);
      setMeterFormData({
        codigoInterno: m.codigoInterno,
        activo: m.activo,
        fechaInstalacion: m.fechaInstalacion,
      });
    } else {
      setEditingMeter(null);
      setMeterFormData({
        codigoInterno: `MED-${selectedUnidad?.numero}-${Date.now().toString().slice(-4)}`,
        activo: true,
        fechaInstalacion: new Date().toISOString().split('T')[0],
      });
    }
    setShowMeterForm(true);
  };

  const handleMeterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnidad) return;

    try {
      setError(null);
      const payload: Medidor = {
        unidadId: selectedUnidad.id,
        codigoInterno: meterFormData.codigoInterno,
        activo: meterFormData.activo,
        fechaInstalacion: meterFormData.fechaInstalacion,
      };

      if (editingMeter?.id) {
        await updateMedidor(editingMeter.id, payload);
      } else {
        await createMedidor(payload);
      }

      setShowMeterForm(false);
      fetchMedidores(selectedUnidad.id);
      fetchUnidades(); // Actualizar lista de unidades
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Error al guardar el medidor.');
    }
  };

  const filteredUnidades = unidades.filter(
    (u) =>
      u.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.propietario && u.propietario.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '4px' }}>
      {/* Page Header */}
      <div className="glass-card" style={{ padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '1.7rem',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #6A11CB, #2575FC)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '6px'
          }}>
            🏡 Gestión de Casas y Medidores
          </h1>
          <p style={{ color: '#A0AEC0', fontSize: '0.875rem' }}>
            Administre las viviendas (filiales) del condominio, asigne propietarios y controle el historial de medidores de agua instalados.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateUnidadModal}>
          ➕ Nueva Casa
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="glass-card" style={{ padding: '16px 20px', background: 'rgba(252, 92, 125, 0.1)', borderColor: 'var(--color-error)', color: 'var(--color-error)' }}>
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="glass-card" style={{ padding: '16px 20px', background: 'rgba(72, 187, 120, 0.1)', borderColor: 'var(--color-success)', color: 'var(--color-success)' }}>
          ✅ {success}
        </div>
      )}

      {/* Search and Table Area */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por número de casa, propietario o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ maxWidth: '400px' }}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
            <p style={{ color: '#A0AEC0', fontSize: '0.9rem' }}>Cargando unidades...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Casa #</th>
                  <th>Propietario</th>
                  <th>Correo Electrónico</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnidades.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong style={{ color: 'white', fontSize: '1.05rem' }}>Casa #{u.numero}</strong>
                    </td>
                    <td>{u.propietario || <span style={{ color: '#718096', fontSize: '0.9rem' }}>No asignado</span>}</td>
                    <td>{u.email || <span style={{ color: '#718096' }}>-</span>}</td>
                    <td>{u.telefono || <span style={{ color: '#718096' }}>-</span>}</td>
                    <td>
                      {u.activo ? (
                        <span className="badge badge-success">Activa</span>
                      ) : (
                        <span className="badge badge-error">Inactiva</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => openEditUnidadModal(u)}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'rgba(37,117,252,0.3)', color: '#2575FC' }}
                          onClick={() => openGestionarMedidores(u)}
                        >
                          💧 Medidores
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUnidades.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#718096' }}>
                      No se encontraron casas coincidentes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE/EDIT UNIDAD MODAL */}
      {showUnidadModal && (
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
          <div className="glass-card" style={{ width: '460px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#1A1A2E' }}>
            <h2 className="section-title" style={{ margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              {editingUnidad ? `✏️ Editar Casa #${unidadFormData.numero}` : '🏡 Crear Nueva Casa'}
            </h2>
            <form onSubmit={handleUnidadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Número de Casa</label>
                  <input
                    type="text"
                    value={unidadFormData.numero}
                    onChange={(e) => setUnidadFormData({ ...unidadFormData, numero: e.target.value })}
                    className="form-input"
                    placeholder="Ej: 45"
                    required
                    disabled={!!editingUnidad} // No permitir cambiar el número de casa al editar
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Estado</label>
                  <div style={{ display: 'flex', alignItems: 'center', height: '42px', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="checkbox-activa"
                      checked={unidadFormData.activa}
                      onChange={(e) => setUnidadFormData({ ...unidadFormData, activa: e.target.checked })}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <label htmlFor="checkbox-activa" style={{ color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>Activa</label>
                  </div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Propietario Completo</label>
                <input
                  type="text"
                  value={unidadFormData.nombrePropietario}
                  onChange={(e) => setUnidadFormData({ ...unidadFormData, nombrePropietario: e.target.value })}
                  className="form-input"
                  placeholder="Nombre y apellidos"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Correo Electrónico</label>
                <input
                  type="email"
                  value={unidadFormData.email}
                  onChange={(e) => setUnidadFormData({ ...unidadFormData, email: e.target.value })}
                  className="form-input"
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Teléfono de Contacto</label>
                <input
                  type="text"
                  value={unidadFormData.telefono}
                  onChange={(e) => setUnidadFormData({ ...unidadFormData, telefono: e.target.value })}
                  className="form-input"
                  placeholder="+506 8888-8888"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowUnidadModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUnidad ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGING METERS MODAL */}
      {selectedUnidad && (
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
          padding: '40px 0',
          overflowY: 'auto',
          zIndex: 900,
        }} className="fade-in">
          <div className="glass-card" style={{ width: '640px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#1A1A2E', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>
                💧 Medidores de Casa #{selectedUnidad.numero}
              </h2>
              <button 
                type="button" 
                className="btn btn-ghost" 
                style={{ padding: '6px 12px' }}
                onClick={() => setSelectedUnidad(null)}
              >
                Cerrar ✕
              </button>
            </div>

            {/* List and actions */}
            {!showMeterForm ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#A0AEC0', fontSize: '0.85rem' }}>
                    Historial de medidores instalados en esta unidad.
                  </span>
                  <button className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => handleMeterFormOpen()}>
                    ➕ Instalar Medidor
                  </button>
                </div>

                {loadingMeters ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                    <div className="spinner" style={{ width: '24px', height: '24px' }}></div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                    <table className="data-table" style={{ fontSize: '0.9rem' }}>
                      <thead>
                        <tr>
                          <th>Código Interno</th>
                          <th>Fecha Instalación</th>
                          <th>Estado</th>
                          <th style={{ textAlign: 'right' }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medidores.map((m) => (
                          <tr key={m.id}>
                            <td>
                              <strong style={{ color: m.activo ? 'white' : '#718096' }}>{m.codigoInterno}</strong>
                            </td>
                            <td>{m.fechaInstalacion}</td>
                            <td>
                              {m.activo ? (
                                <span className="badge badge-success">Activo</span>
                              ) : (
                                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#718096' }}>Inactivo</span>
                              )}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                              <button
                                className="btn btn-ghost"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                onClick={() => handleMeterFormOpen(m)}
                              >
                                ✏️ Editar
                              </button>
                            </td>
                          </tr>
                        ))}
                        {medidores.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: '#718096' }}>
                              Esta casa no tiene ningún medidor configurado.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            ) : (
              /* METER SUB-FORM */
              <form onSubmit={handleMeterSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <h3 style={{ margin: 0, fontSize: '1rem', color: 'white' }}>
                  {editingMeter ? '✏️ Editar Medidor' : '💧 Instalar Nuevo Medidor'}
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Código de Medidor</label>
                    <input
                      type="text"
                      value={meterFormData.codigoInterno}
                      onChange={(e) => setMeterFormData({ ...meterFormData, codigoInterno: e.target.value })}
                      className="form-input"
                      placeholder="Ej: MED-1"
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Estado</label>
                    <div style={{ display: 'flex', alignItems: 'center', height: '42px', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="checkbox-medidor-activo"
                        checked={meterFormData.activo}
                        onChange={(e) => setMeterFormData({ ...meterFormData, activo: e.target.checked })}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <label htmlFor="checkbox-medidor-activo" style={{ color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>Activo</label>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Fecha de Instalación</label>
                  <input
                    type="date"
                    value={meterFormData.fechaInstalacion}
                    onChange={(e) => setMeterFormData({ ...meterFormData, fechaInstalacion: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                {meterFormData.activo && !editingMeter && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-warning)', background: 'rgba(246,173,85,0.08)', padding: '10px', borderRadius: '6px', border: '1px solid var(--color-warning)' }}>
                    ⚠️ Instalar este medidor como <strong>Activo</strong> desactivará automáticamente cualquier medidor activo previo que tenga esta casa.
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
                  <button type="button" className="btn btn-ghost" style={{ padding: '6px 12px' }} onClick={() => setShowMeterForm(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ padding: '6px 16px' }}>
                    Guardar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UnidadesPage;
