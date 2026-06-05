import React, { useEffect, useState, useRef } from 'react';
import { getUnidades, Unidad } from '../../api/unidadesApi';
import { cargarLecturaInicial, importarLecturasCSV } from '../../api/lecturasApi';
import { getAjustesPorUnidad, createAjuste, importarAjustesCSV, AjusteSaldo } from '../../api/ajustesApi';

const SaldosPage: React.FC = () => {
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [activeTab, setActiveTab] = useState<'lecturas' | 'ajustes'>('lecturas');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selections
  const [selectedUnidadId, setSelectedUnidadId] = useState<number | null>(null);
  const [unitAjustes, setUnitAjustes] = useState<AjusteSaldo[]>([]);
  const [loadingAjustes, setLoadingAjustes] = useState(false);

  // Form: Lectura Inicial
  const [inicialM3, setInicialM3] = useState('');
  const [inicialFecha, setInicialFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loadingLecturaForm, setLoadingLecturaForm] = useState(false);

  // Form: Ajuste Saldo
  const [ajusteMonto, setAjusteMonto] = useState('');
  const [ajusteDescripcion, setAjusteDescripcion] = useState('');
  const [ajusteFecha, setAjusteFecha] = useState(new Date().toISOString().split('T')[0]);
  const [loadingAjusteForm, setLoadingAjusteForm] = useState(false);

  // CSV Drag and Drop
  const fileInputLecturas = useRef<HTMLInputElement>(null);
  const fileInputAjustes = useRef<HTMLInputElement>(null);
  const [draggingLecturas, setDraggingLecturas] = useState(false);
  const [draggingAjustes, setDraggingAjustes] = useState(false);
  const [uploadingCSV, setUploadingCSV] = useState(false);

  useEffect(() => {
    fetchUnidades();
  }, []);

  useEffect(() => {
    if (selectedUnidadId && activeTab === 'ajustes') {
      fetchAjustes(selectedUnidadId);
    } else {
      setUnitAjustes([]);
    }
  }, [selectedUnidadId, activeTab]);

  const fetchUnidades = async () => {
    try {
      setLoading(true);
      const data = await getUnidades();
      // Ordenar unidades numéricamente si es posible
      const sorted = [...data].sort((a, b) => {
        const numA = parseInt(a.numero);
        const numB = parseInt(b.numero);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.numero.localeCompare(b.numero);
      });
      setUnidades(sorted);
      if (sorted.length > 0) {
        setSelectedUnidadId(sorted[0].id);
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener la lista de unidades habitacionales.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAjustes = async (unidadId: number) => {
    try {
      setLoadingAjustes(true);
      const data = await getAjustesPorUnidad(unidadId);
      setUnitAjustes(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoadingAjustes(false);
    }
  };

  const handleLecturaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnidadId || !inicialM3) return;
    try {
      setLoadingLecturaForm(true);
      setError(null);
      setSuccess(null);
      await cargarLecturaInicial({
        unidadId: selectedUnidadId,
        lecturaInicial: parseFloat(inicialM3),
        fecha: inicialFecha
      });
      setSuccess(`Lectura inicial de ${inicialM3} m³ registrada correctamente.`);
      setInicialM3('');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar la lectura inicial.');
    } finally {
      setLoadingLecturaForm(false);
    }
  };

  const handleAjusteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnidadId || !ajusteMonto || !ajusteDescripcion) return;
    try {
      setLoadingAjusteForm(true);
      setError(null);
      setSuccess(null);
      const created = await createAjuste({
        unidadId: selectedUnidadId,
        monto: parseFloat(ajusteMonto),
        descripcion: ajusteDescripcion,
        fechaEfectiva: ajusteFecha
      });
      setSuccess(`Ajuste de saldo de ₡${parseFloat(ajusteMonto).toLocaleString()} registrado.`);
      setAjusteMonto('');
      setAjusteDescripcion('');
      fetchAjustes(selectedUnidadId);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar el ajuste de saldo.');
    } finally {
      setLoadingAjusteForm(false);
    }
  };

  // CSV Imports
  const handleCSVUpload = async (file: File, type: 'lecturas' | 'ajustes') => {
    try {
      setUploadingCSV(true);
      setError(null);
      setSuccess(null);
      if (type === 'lecturas') {
        const res = await importarLecturasCSV(file);
        setSuccess(`Carga masiva finalizada. Lecturas importadas: ${res.importadas}. Errores u omitidas: ${res.errores}.`);
      } else {
        const res = await importarAjustesCSV(file);
        setSuccess(`Carga masiva finalizada. Ajustes importados: ${res.importados}. Errores u omitidos: ${res.errores}.`);
        if (selectedUnidadId) fetchAjustes(selectedUnidadId);
      }
      setTimeout(() => setSuccess(null), 6000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al importar archivo CSV. Verifique el formato.');
    } finally {
      setUploadingCSV(false);
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent, tab: 'lecturas' | 'ajustes') => {
    e.preventDefault();
    if (tab === 'lecturas') setDraggingLecturas(true);
    else setDraggingAjustes(true);
  };

  const handleDragLeave = (tab: 'lecturas' | 'ajustes') => {
    if (tab === 'lecturas') setDraggingLecturas(false);
    else setDraggingAjustes(false);
  };

  const handleDrop = (e: React.DragEvent, tab: 'lecturas' | 'ajustes') => {
    e.preventDefault();
    if (tab === 'lecturas') {
      setDraggingLecturas(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleCSVUpload(e.dataTransfer.files[0], 'lecturas');
      }
    } else {
      setDraggingAjustes(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleCSVUpload(e.dataTransfer.files[0], 'ajustes');
      }
    }
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '4px' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '28px 32px' }}>
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
          📋 Carga de Saldos y Puntos de Partida
        </h1>
        <p style={{ color: '#A0AEC0', fontSize: '0.875rem' }}>
          Defina el valor m³ inicial de cada medidor para posibilitar el cálculo de consumos, o registre ajustes de deuda/crédito en colones de periodos históricos.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '16px' }}>
        <button
          className={`btn ${activeTab === 'lecturas' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('lecturas')}
        >
          💧 Lectura Inicial (m³)
        </button>
        <button
          className={`btn ${activeTab === 'ajustes' ? 'btn-primary' : 'btn-ghost'}`}
          onClick={() => setActiveTab('ajustes')}
        >
          💰 Ajustes de Saldo (₡)
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

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
          {/* Main Area */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 className="section-title" style={{ margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              👤 Carga Individual
            </h2>

            {/* Selection */}
            <div>
              <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Seleccione la Unidad Habitacional</label>
              <select
                className="form-input"
                value={selectedUnidadId || ''}
                onChange={(e) => setSelectedUnidadId(parseInt(e.target.value) || null)}
                style={{ background: '#1A1A2E', cursor: 'pointer', maxWidth: '300px' }}
              >
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    Casa #{u.numero} — {u.propietario}
                  </option>
                ))}
              </select>
            </div>

            {activeTab === 'lecturas' ? (
              /* TAB: LECTURAS FORM */
              <form onSubmit={handleLecturaSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Lectura Inicial (m³)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      placeholder="Ej. 124.5"
                      value={inicialM3}
                      onChange={(e) => setInicialM3(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Fecha de Corte</label>
                    <input
                      type="date"
                      className="form-input"
                      value={inicialFecha}
                      onChange={(e) => setInicialFecha(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="submit" className="btn btn-primary" disabled={loadingLecturaForm}>
                    {loadingLecturaForm ? <div className="spinner"></div> : '💾 Guardar Lectura Inicial'}
                  </button>
                </div>
              </form>
            ) : (
              /* TAB: AJUSTES FORM */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                <form onSubmit={handleAjusteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Monto (₡)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        placeholder="Ej. -15000 (Deuda) o 8000 (Crédito)"
                        value={ajusteMonto}
                        onChange={(e) => setAjusteMonto(e.target.value)}
                        required
                      />
                      <span style={{ fontSize: '0.7rem', color: '#718096', display: 'block', marginTop: '4px' }}>
                        Use valores negativos para indicar saldos pendientes (deudas).
                      </span>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Fecha Efectiva</label>
                      <input
                        type="date"
                        className="form-input"
                        value={ajusteFecha}
                        onChange={(e) => setAjusteFecha(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Descripción / Concepto</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej. Saldo deudor de mayo 2026 antes de sistema"
                      value={ajusteDescripcion}
                      onChange={(e) => setAjusteDescripcion(e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                    <button type="submit" className="btn btn-primary" disabled={loadingAjusteForm}>
                      {loadingAjusteForm ? <div className="spinner"></div> : '💾 Guardar Ajuste de Saldo'}
                    </button>
                  </div>
                </form>

                {/* Adjustments History */}
                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '20px' }}>
                  <h3 style={{ fontSize: '0.9rem', color: '#A0AEC0', marginBottom: '12px' }}>⏳ Historial de Ajustes para la Unidad Seleccionada</h3>
                  {loadingAjustes ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                      <div className="spinner"></div>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Fecha</th>
                            <th>Descripción</th>
                            <th style={{ textAlign: 'right' }}>Monto</th>
                            <th>Usuario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {unitAjustes.map((a) => (
                            <tr key={a.id}>
                              <td>{new Date(a.fechaEfectiva).toLocaleDateString('es-CR')}</td>
                              <td>{a.descripcion}</td>
                              <td style={{ textAlign: 'right', fontWeight: 600, color: a.monto < 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
                                ₡{a.monto.toLocaleString()}
                              </td>
                              <td style={{ fontSize: '0.8rem' }}>{a.creadoPorNombre || 'Sistema'}</td>
                            </tr>
                          ))}
                          {unitAjustes.length === 0 && (
                            <tr>
                              <td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: '#718096' }}>
                                No hay ajustes de saldo registrados para esta casa.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: CSV Import */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {activeTab === 'lecturas' ? (
              /* Drag & Drop Lecturas */
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 className="section-title" style={{ margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                  📤 Importar CSV
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#A0AEC0', lineHeight: 1.5 }}>
                  Suba un archivo delimitado por comas (.csv) para registrar lecturas iniciales masivamente.
                </p>
                <div
                  onDragOver={(e) => handleDragOver(e, 'lecturas')}
                  onDragLeave={() => handleDragLeave('lecturas')}
                  onDrop={(e) => handleDrop(e, 'lecturas')}
                  onClick={() => fileInputLecturas.current?.click()}
                  style={{
                    height: '160px',
                    borderRadius: '12px',
                    border: '2px dashed',
                    borderColor: draggingLecturas ? '#6A11CB' : 'var(--color-border)',
                    background: draggingLecturas ? 'rgba(106,17,203,0.1)' : 'rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    textAlign: 'center',
                    padding: '16px',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputLecturas}
                    accept=".csv"
                    onChange={(e) => e.target.files && e.target.files[0] && handleCSVUpload(e.target.files[0], 'lecturas')}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '2rem', marginBottom: '8px' }}>📊</span>
                  <span style={{ fontSize: '0.8rem', color: 'white', fontWeight: 600 }}>Arrastre su CSV aquí</span>
                  <span style={{ fontSize: '0.7rem', color: '#718096', marginTop: '4px' }}>o haga clic para buscar</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.75rem', color: '#A0AEC0', lineHeight: 1.4 }}>
                  <strong>Formato esperado:</strong>
                  <pre style={{ marginTop: '6px', fontSize: '0.7rem', color: 'white', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px' }}>
                    numero_unidad,lectura_m3,fecha_corte<br />
                    1,120.50,01/06/2026<br />
                    2,341.20,01/06/2026
                  </pre>
                </div>
              </div>
            ) : (
              /* Drag & Drop Ajustes */
              <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 className="section-title" style={{ margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
                  📤 Importar CSV
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#A0AEC0', lineHeight: 1.5 }}>
                  Suba un archivo delimitado por comas (.csv) para registrar ajustes de saldo masivamente.
                </p>
                <div
                  onDragOver={(e) => handleDragOver(e, 'ajustes')}
                  onDragLeave={() => handleDragLeave('ajustes')}
                  onDrop={(e) => handleDrop(e, 'ajustes')}
                  onClick={() => fileInputAjustes.current?.click()}
                  style={{
                    height: '160px',
                    borderRadius: '12px',
                    border: '2px dashed',
                    borderColor: draggingAjustes ? '#6A11CB' : 'var(--color-border)',
                    background: draggingAjustes ? 'rgba(106,17,203,0.1)' : 'rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    textAlign: 'center',
                    padding: '16px',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputAjustes}
                    accept=".csv"
                    onChange={(e) => e.target.files && e.target.files[0] && handleCSVUpload(e.target.files[0], 'ajustes')}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '2rem', marginBottom: '8px' }}>💸</span>
                  <span style={{ fontSize: '0.8rem', color: 'white', fontWeight: 600 }}>Arrastre su CSV aquí</span>
                  <span style={{ fontSize: '0.7rem', color: '#718096', marginTop: '4px' }}>o haga clic para buscar</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.75rem', color: '#A0AEC0', lineHeight: 1.4 }}>
                  <strong>Formato esperado:</strong>
                  <pre style={{ marginTop: '6px', fontSize: '0.7rem', color: 'white', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '4px' }}>
                    numero_unidad,monto,descripcion,fecha_efectiva<br />
                    1,-15000.00,Saldo deudor anterior,01/06/2026<br />
                    2,8500.00,Ajuste de crédito,01/06/2026
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading overlay for CSV imports */}
      {uploadingCSV && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(10, 8, 25, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
        }} className="fade-in">
          <div className="glass-card" style={{ padding: '32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
            <div>
              <h4 style={{ color: 'white', fontSize: '1.1rem', fontWeight: 600, marginBottom: '6px' }}>Procesando Carga Masiva</h4>
              <p style={{ color: '#A0AEC0', fontSize: '0.85rem' }}>Analizando y registrando filas del archivo CSV, por favor espere...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaldosPage;
