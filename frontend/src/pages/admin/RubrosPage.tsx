import React, { useEffect, useState } from 'react';
import {
  getRubros, createRubro, updateRubro, deleteRubro,
  getHistorialTarifas, createTarifa, Rubro, TarifaRubro
} from '../../api/rubrosApi';

interface ConsumoRango {
  desde: number;
  hasta: number;
  precio: number;
}

const RubrosPage: React.FC = () => {
  const [rubros, setRubros] = useState<Rubro[]>([]);
  const [selectedRubro, setSelectedRubro] = useState<Rubro | null>(null);
  const [tarifas, setTarifas] = useState<TarifaRubro[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTarifas, setLoadingTarifas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Rubro Modal
  const [showRubroModal, setShowRubroModal] = useState(false);
  const [editingRubro, setEditingRubro] = useState<Rubro | null>(null);
  const [rubroForm, setRubroForm] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'FIJO' as Rubro['tipo'],
    ordenDisplay: 1,
    activo: true,
    porcentajeMora: 0,
  });

  // Tarifa Modal
  const [showTarifaModal, setShowTarifaModal] = useState(false);
  const [tarifaFechaInicio, setTarifaFechaInicio] = useState(new Date().toISOString().split('T')[0]);
  const [tarifaMontoFijo, setTarifaMontoFijo] = useState(0);
  const [consumoRangos, setConsumoRangos] = useState<ConsumoRango[]>([
    { desde: 0, hasta: 999999, precio: 1000 },
  ]);

  useEffect(() => {
    fetchRubros();
  }, []);

  useEffect(() => {
    if (selectedRubro?.id) {
      fetchTarifas(selectedRubro.id);
    } else {
      setTarifas([]);
    }
  }, [selectedRubro]);

  const fetchRubros = async () => {
    try {
      setLoading(true);
      const data = await getRubros();
      setRubros(data);
      if (data.length > 0 && !selectedRubro) {
        setSelectedRubro(data[0]);
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar los rubros de cobro.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTarifas = async (rubroId: number) => {
    try {
      setLoadingTarifas(true);
      const data = await getHistorialTarifas(rubroId);
      setTarifas(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingTarifas(false);
    }
  };

  const handleRubroInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRubroForm({
      ...rubroForm,
      [name]: name === 'ordenDisplay' ? parseInt(value) || 1 :
              name === 'porcentajeMora' ? parseFloat(value) || 0 : value,
    });
  };

  const openCreateRubro = () => {
    setEditingRubro(null);
    setRubroForm({
      nombre: '',
      descripcion: '',
      tipo: 'FIJO',
      ordenDisplay: (rubros.length + 1),
      activo: true,
      porcentajeMora: 0,
    });
    setShowRubroModal(true);
  };

  const openEditRubro = (r: Rubro) => {
    setEditingRubro(r);
    setRubroForm({
      nombre: r.nombre,
      descripcion: r.descripcion || '',
      tipo: r.tipo,
      ordenDisplay: r.ordenDisplay,
      activo: r.activo,
      porcentajeMora: r.porcentajeMora || 0,
    });
    setShowRubroModal(true);
  };

  const handleRubroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      if (editingRubro?.id) {
        const updated = await updateRubro(editingRubro.id, rubroForm);
        setSuccess(`Rubro '${updated.nombre}' actualizado correctamente.`);
        if (selectedRubro?.id === editingRubro.id) {
          setSelectedRubro(updated);
        }
      } else {
        const created = await createRubro(rubroForm);
        setSuccess(`Rubro '${created.nombre}' creado correctamente.`);
        setSelectedRubro(created);
      }
      setShowRubroModal(false);
      fetchRubros();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar el rubro.');
    }
  };

  const handleDeactivateRubro = async (id: number) => {
    if (!window.confirm('¿Está seguro de que desea desactivar este rubro?')) return;
    try {
      setError(null);
      setSuccess(null);
      await deleteRubro(id);
      setSuccess('Rubro desactivado correctamente.');
      fetchRubros();
      setSelectedRubro(null);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al desactivar el rubro.');
    }
  };

  // Rango handlers for CONSUMO
  const handleAddRango = () => {
    const updated = [...consumoRangos];
    const n = updated.length;
    if (n > 0) {
      // The current last bracket is going to become second-to-last
      const currentLast = updated[n - 1];
      const newHasta = currentLast.desde + 15;
      currentLast.hasta = newHasta;
      
      // The new last bracket goes from newHasta to 999999 (Sin Límite)
      updated.push({
        desde: newHasta,
        hasta: 999999,
        precio: currentLast.precio + 500
      });
    } else {
      updated.push({ desde: 0, hasta: 999999, precio: 1000 });
    }
    setConsumoRangos(updated);
  };

  const handleRemoveRango = (index: number) => {
    if (consumoRangos.length === 1) return;
    const filtered = consumoRangos.filter((_, i) => i !== index);
    // Enforce last bracket goes to 999999
    filtered[filtered.length - 1].hasta = 999999;
    setConsumoRangos(filtered);
  };

  const handleRangoChange = (index: number, field: keyof ConsumoRango, value: number) => {
    const updated = [...consumoRangos];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    // Auto align 'desde' of next row with 'hasta' of current row
    if (field === 'hasta' && updated[index + 1]) {
      updated[index + 1].desde = value;
    }
    setConsumoRangos(updated);
  };

  const handleTarifaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRubro?.id) return;
    try {
      setError(null);
      setSuccess(null);

      let configJson = '';
      if (selectedRubro.tipo === 'CONSUMO') {
        configJson = JSON.stringify(consumoRangos);
      } else {
        configJson = JSON.stringify({ monto: tarifaMontoFijo });
      }

      await createTarifa(selectedRubro.id, {
        rubroId: selectedRubro.id,
        fechaInicio: tarifaFechaInicio,
        configJson
      });

      setSuccess('Nueva tarifa registrada exitosamente.');
      setShowTarifaModal(false);
      fetchTarifas(selectedRubro.id);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar la nueva tarifa. Verifique que no solape vigencias.');
    }
  };

  const parseTarifaConfig = (configJson: string, tipo: string) => {
    try {
      const parsed = JSON.parse(configJson);
      if (tipo === 'CONSUMO') {
        const rangos = parsed as ConsumoRango[];
        return (
          <table style={{ width: '100%', fontSize: '0.8rem', marginTop: '6px' }}>
            <thead>
              <tr style={{ color: '#718096', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={{ padding: '4px', textAlign: 'left' }}>Rango (m³)</th>
                <th style={{ padding: '4px', textAlign: 'right' }}>Precio/m³</th>
              </tr>
            </thead>
            <tbody>
              {rangos.map((r, i) => (
                <tr key={i}>
                  <td style={{ padding: '4px' }}>
                    {r.desde} a {r.hasta >= 99999 ? 'Adelante' : `${r.hasta} m³`}
                  </td>
                  <td style={{ padding: '4px', textAlign: 'right', color: 'white', fontWeight: 600 }}>
                    ₡{r.precio.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      } else {
        return (
          <span style={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>
            ₡{(parsed.monto || 0).toLocaleString()}
          </span>
        );
      }
    } catch (e) {
      return <span style={{ color: '#FC5C7D' }}>Error de parseo JSON</span>;
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '4px' }}>
      {/* Header */}
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
            ⚙️ Rubros y Tarifas
          </h1>
          <p style={{ color: '#A0AEC0', fontSize: '0.875rem' }}>
            Defina los rubros de cobro mensuales (agua, seguridad, cuotas de condominio) y gestione los históricos de tarifas de agua por bloques.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateRubro}>
          ➕ Nuevo Rubro
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

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px' }}>
        {/* Left Column: Rubros List */}
        <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 className="section-title" style={{ margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
            🏷️ Rubros Registrados
          </h2>

          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
              <div className="spinner"></div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {rubros.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRubro(r)}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    border: '1px solid',
                    borderColor: selectedRubro?.id === r.id ? '#6A11CB' : 'var(--color-border)',
                    background: selectedRubro?.id === r.id ? 'rgba(106, 17, 203, 0.1)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                    <strong style={{ color: 'white', fontSize: '0.95rem' }}>{r.nombre}</strong>
                    <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#A0AEC0', border: '1px solid rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '4px' }}>
                      {r.tipo === 'CONSUMO' ? 'Por Consumo' : r.tipo === 'FIJO' ? 'Monto Fijo' : r.tipo}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#A0AEC0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4', marginBottom: '8px' }}>
                    {r.descripcion || 'Sin descripción.'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
                    <span style={{ color: '#718096' }}>
                      Orden: #{r.ordenDisplay} • Mora: <strong style={{ color: r.porcentajeMora > 0 ? 'var(--color-accent-orange)' : '#A0AEC0' }}>{r.porcentajeMora}%</strong>
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span onClick={(e) => { e.stopPropagation(); openEditRubro(r); }} style={{ color: '#60A5FA', cursor: 'pointer' }} title="Editar">✏️</span>
                      <span onClick={(e) => { e.stopPropagation(); handleDeactivateRubro(r.id!); }} style={{ color: '#FC5C7D', cursor: 'pointer' }} title="Eliminar / Desactivar">🗑️</span>
                    </div>
                  </div>
                  {!r.activo && (
                    <div style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(252,92,125,0.1)', color: '#FC5C7D', fontSize: '0.65rem', fontWeight: 600, padding: '2px 8px', borderRadius: '0 10px 0 10px', borderLeft: '1px solid var(--color-error)', borderBottom: '1px solid var(--color-error)' }}>
                      INACTIVO
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Tarifa Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {selectedRubro ? (
            <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#A0AEC0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tarifas de</span>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'white', marginTop: '2px' }}>
                    {selectedRubro.nombre}
                  </h2>
                </div>
                {selectedRubro.activo && (
                  <button
                    className="btn btn-accent"
                    onClick={() => {
                      setTarifaFechaInicio(new Date().toISOString().split('T')[0]);
                      setTarifaMontoFijo(0);
                      setConsumoRangos([{ desde: 0, hasta: 999999, precio: 1000 }]);
                      setShowTarifaModal(true);
                    }}
                  >
                    📈 Definir Nueva Tarifa
                  </button>
                )}
              </div>

              {/* History Table */}
              <div>
                <h3 style={{ fontSize: '0.9rem', color: '#A0AEC0', marginBottom: '12px' }}>⏳ Historial de Tarifas</h3>
                
                {loadingTarifas ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}>
                    <div className="spinner"></div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Validez (Inicio)</th>
                          <th>Validez (Fin)</th>
                          <th>Configuración de Cobro</th>
                          <th>Creado Por</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tarifas.map((t) => {
                          const esVigente = !t.fechaFin || new Date(t.fechaFin) >= new Date();
                          return (
                            <tr key={t.id} style={{ background: esVigente ? 'rgba(72, 187, 120, 0.02)' : 'transparent' }}>
                              <td>
                                <strong style={{ color: esVigente ? 'var(--color-success)' : 'white' }}>
                                  {new Date(t.fechaInicio).toLocaleDateString('es-CR')}
                                </strong>
                                {esVigente && (
                                  <span className="badge badge-success" style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '0.65rem' }}>
                                    Vigente
                                  </span>
                                )}
                              </td>
                              <td>
                                {t.fechaFin ? new Date(t.fechaFin).toLocaleDateString('es-CR') : <span style={{ color: '#48BB78' }}>Indefinido</span>}
                              </td>
                              <td style={{ maxWidth: '300px' }}>
                                {parseTarifaConfig(t.configJson, selectedRubro.tipo)}
                              </td>
                              <td>
                                <span style={{ fontSize: '0.8rem', color: '#A0AEC0' }}>
                                  {t.creadoPorNombre || 'Sistema'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                        {tarifas.length === 0 && (
                          <tr>
                            <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#718096' }}>
                              No se han definido tarifas para este rubro.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '48px', textAlign: 'center', color: '#718096' }}>
              Seleccione un rubro de cobro a la izquierda para ver su historial de tarifas.
            </div>
          )}
        </div>
      </div>

      {/* RUBRO MODAL */}
      {showRubroModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 8, 25, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} className="fade-in">
          <div className="glass-card" style={{ width: '460px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#1A1A2E' }}>
            <h2 className="section-title" style={{ margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              {editingRubro ? '✏️ Editar Rubro' : '➕ Crear Nuevo Rubro'}
            </h2>
            <form onSubmit={handleRubroSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Nombre del Rubro</label>
                <input
                  type="text"
                  name="nombre"
                  value={rubroForm.nombre}
                  onChange={handleRubroInputChange}
                  className="form-input"
                  placeholder="Ej. Seguridad, Mantenimiento..."
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Descripción</label>
                <textarea
                  name="descripcion"
                  value={rubroForm.descripcion}
                  onChange={handleRubroInputChange}
                  className="form-input"
                  placeholder="Detalle de qué incluye este cobro"
                  rows={2}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Tipo de Cobro</label>
                  <select
                    name="tipo"
                    value={rubroForm.tipo}
                    onChange={handleRubroInputChange}
                    className="form-input"
                    disabled={!!editingRubro} // No permitir cambiar tipo una vez creado
                    style={{ background: '#1A1A2E', cursor: editingRubro ? 'not-allowed' : 'pointer', fontSize: '0.8rem', padding: '8px' }}
                  >
                    <option value="FIJO">Monto Fijo</option>
                    <option value="CONSUMO">Por Consumo (Bloques)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Mora (% / mes)</label>
                  <input
                    type="number"
                    name="porcentajeMora"
                    value={rubroForm.porcentajeMora}
                    onChange={handleRubroInputChange}
                    className="form-input"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0.00"
                    required
                    style={{ fontSize: '0.8rem', padding: '8px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Orden Visual</label>
                  <input
                    type="number"
                    name="ordenDisplay"
                    value={rubroForm.ordenDisplay}
                    onChange={handleRubroInputChange}
                    className="form-input"
                    min="1"
                    required
                    style={{ fontSize: '0.8rem', padding: '8px' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: '#A0AEC0', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    name="activo"
                    checked={rubroForm.activo}
                    onChange={(e) => setRubroForm({ ...rubroForm, activo: e.target.checked })}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  Rubro Activo (se incluirá en el cálculo de facturación)
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowRubroModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingRubro ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TARIFA MODAL */}
      {showTarifaModal && selectedRubro && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 8, 25, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }} className="fade-in">
          <div className="glass-card" style={{ width: selectedRubro.tipo === 'CONSUMO' ? '600px' : '400px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#1A1A2E', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="section-title" style={{ margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              📈 Nueva Tarifa: {selectedRubro.nombre}
            </h2>
            <form onSubmit={handleTarifaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Fecha de Inicio de Vigencia</label>
                <input
                  type="date"
                  value={tarifaFechaInicio}
                  onChange={(e) => setTarifaFechaInicio(e.target.value)}
                  className="form-input"
                  required
                />
                <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block', marginTop: '4px' }}>
                  El sistema cerrará automáticamente la tarifa anterior el día antes de esta fecha.
                </span>
              </div>

              {selectedRubro.tipo === 'CONSUMO' ? (
                /* Consumption brackets editor */
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#A0AEC0' }}>Bloques de Consumo</label>
                    <button type="button" className="btn btn-ghost" onClick={handleAddRango} style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                      ➕ Agregar Bloque
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {consumoRangos.map((r, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 40px', gap: '8px', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#718096' }}>Desde (m³)</span>
                          <input
                            type="number"
                            value={r.desde}
                            className="form-input"
                            disabled
                            style={{ opacity: 0.6 }}
                          />
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#718096' }}>Hasta (m³)</span>
                          {i === consumoRangos.length - 1 ? (
                            <input
                              type="text"
                              value="Sin Límite"
                              className="form-input"
                              disabled
                              style={{ opacity: 0.8, background: '#111026', cursor: 'not-allowed', color: 'var(--color-accent-orange)', fontWeight: 'bold' }}
                            />
                          ) : (
                            <input
                              type="number"
                              value={r.hasta}
                              onChange={(e) => handleRangoChange(i, 'hasta', parseFloat(e.target.value) || 0)}
                              className="form-input"
                              placeholder="Ej. 100"
                              required
                            />
                          )}
                        </div>
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#718096' }}>Precio (₡/m³)</span>
                          <input
                            type="number"
                            value={r.precio}
                            onChange={(e) => handleRangoChange(i, 'precio', parseFloat(e.target.value) || 0)}
                            className="form-input"
                            placeholder="Ej. 1250"
                            required
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '16px' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveRango(i)}
                            disabled={consumoRangos.length === 1}
                            style={{ background: 'transparent', color: '#FC5C7D', fontSize: '1.1rem', cursor: consumoRangos.length === 1 ? 'not-allowed' : 'pointer' }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block', marginTop: '8px' }}>
                    Nota: El último bloque configurado representará el consumo excedente (hasta el infinito, ej: 99999).
                  </span>
                </div>
              ) : (
                /* Fixed rate editor */
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Monto Tarifario (₡)</label>
                  <input
                    type="number"
                    value={tarifaMontoFijo}
                    onChange={(e) => setTarifaMontoFijo(parseFloat(e.target.value) || 0)}
                    className="form-input"
                    placeholder="Monto a cobrar por periodo"
                    min="0"
                    required
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowTarifaModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Registrar Tarifa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RubrosPage;
