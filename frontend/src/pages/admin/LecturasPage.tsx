import React, { useEffect, useState, useRef } from 'react';
import {
  getPeriodos,
  getLecturasPendientes,
  updateLectura,
  registrarLectura,
  importarLecturasCSV,
  subirFotoLectura,
  PeriodoDto,
  Lectura
} from '../../api/lecturasApi';
import { getUnidades, Unidad } from '../../api/unidadesApi';
import './LecturasPage.css';

type FilterType = 'all' | 'COMPLETADA' | 'PENDIENTE' | 'ERROR';

const LecturasPage: React.FC = () => {
  const [periodos, setPeriodos] = useState<PeriodoDto[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<PeriodoDto | null>(null);
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Hidden File Input Ref for CSV
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newFileRef = useRef<HTMLInputElement>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  // New Reading Modal State
  const [showNewModal, setShowNewModal] = useState(false);
  const [newUnidadId, setNewUnidadId] = useState<string>('');
  const [newValorM3, setNewValorM3] = useState<string>('');
  const [newFotoUrl, setNewFotoUrl] = useState<string>('');
  const [uploadingNew, setUploadingNew] = useState(false);

  // Edit Reading Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editLecturaId, setEditLecturaId] = useState<number | null>(null);
  const [editUnidadNumero, setEditUnidadNumero] = useState<string>('');
  const [editPropietario, setEditPropietario] = useState<string>('');
  const [editValorM3, setEditValorM3] = useState<string>('');
  const [editFotoUrl, setEditFotoUrl] = useState<string>('');
  const [uploadingEdit, setUploadingEdit] = useState(false);

  // View Details Modal State
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewLectura, setViewLectura] = useState<Lectura | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [periodsData, unitsData] = await Promise.all([
        getPeriodos(),
        getUnidades()
      ]);
      setUnidades(unitsData);

      // Sort periods by ID desc (latest first)
      const sortedPeriods = [...periodsData].sort((a, b) => b.id - a.id);
      setPeriodos(sortedPeriods);

      if (sortedPeriods.length > 0) {
        // Default to the open period or the latest one
        const open = sortedPeriods.find(p => p.estado === 'ABIERTO') || sortedPeriods[0];
        setSelectedPeriodo(open);
        await fetchLecturas(open.anio, open.mes);
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al inicializar los datos de lecturas.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLecturas = async (anio: number, mes: number) => {
    try {
      setLoading(true);
      const data = await getLecturasPendientes(anio, mes);
      setLecturas(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener las lecturas de medidores del período.');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = periodos.find(p => p.id === parseInt(e.target.value));
    if (selected) {
      setSelectedPeriodo(selected);
      fetchLecturas(selected.anio, selected.mes);
    }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      const res = await importarLecturasCSV(file);
      setSuccess(`Importación de CSV exitosa: se registraron ${res.importadas} lecturas correctamente (con ${res.errores} errores).`);
      if (selectedPeriodo) {
        fetchLecturas(selectedPeriodo.anio, selectedPeriodo.mes);
      }
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al procesar el archivo CSV de lecturas.');
    } finally {
      setLoadingAction(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnidadId || !newValorM3) return;
    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      await registrarLectura(
        parseInt(newUnidadId),
        parseFloat(newValorM3),
        newFotoUrl || undefined
      );
      setSuccess('Lectura del medidor registrada correctamente.');
      setShowNewModal(false);
      setNewUnidadId('');
      setNewValorM3('');
      setNewFotoUrl('');
      if (selectedPeriodo) {
        fetchLecturas(selectedPeriodo.anio, selectedPeriodo.mes);
      }
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar la nueva lectura.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLecturaId || !editValorM3) return;
    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      await updateLectura(
        editLecturaId,
        parseFloat(editValorM3),
        editFotoUrl || undefined
      );
      setSuccess('Lectura del medidor actualizada correctamente.');
      setShowEditModal(false);
      if (selectedPeriodo) {
        fetchLecturas(selectedPeriodo.anio, selectedPeriodo.mes);
      }
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al actualizar la lectura.');
    } finally {
      setLoadingAction(false);
    }
  };

  const openNewModal = () => {
    setNewUnidadId('');
    setNewValorM3('');
    setNewFotoUrl('');
    setShowNewModal(true);
  };

  const openEditModal = (l: Lectura) => {
    setEditLecturaId(l.id);
    setEditUnidadNumero(l.unidadNumero);
    setEditPropietario(l.propietario);
    setEditValorM3(l.lecturaActual !== null ? l.lecturaActual.toString() : '');
    setEditFotoUrl(l.fotoUrl || '');
    setShowEditModal(true);
  };

  const getFotoUrl = (url: string | null | undefined): string => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${apiBase}${cleanUrl}`;
  };

  const handleNewFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingNew(true);
      setError(null);
      const url = await subirFotoLectura(file);
      setNewFotoUrl(url);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al subir la imagen de evidencia.');
    } finally {
      setUploadingNew(false);
      if (newFileRef.current) newFileRef.current.value = '';
    }
  };

  const handleEditFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploadingEdit(true);
      setError(null);
      const url = await subirFotoLectura(file);
      setEditFotoUrl(url);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al subir la imagen de evidencia.');
    } finally {
      setUploadingEdit(false);
      if (editFileRef.current) editFileRef.current.value = '';
    }
  };

  const openViewModal = (l: Lectura) => {
    setViewLectura(l);
    setShowViewModal(true);
  };

  const getMesNombre = (mesNum: number): string => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mesNum - 1] || mesNum.toString();
  };

  // Stats calculation
  const totalUnidades = lecturas.length;
  const completadas = lecturas.filter(l => l.estado === 'COMPLETADA').length;
  const pendientes = lecturas.filter(l => l.estado === 'PENDIENTE').length;
  const errores = lecturas.filter(l => l.estado === 'ERROR').length;
  const progresoRecorrido = totalUnidades > 0 ? Math.round((completadas / totalUnidades) * 100) : 0;

  // Filtered readings list
  const filteredLecturas = lecturas
    .filter(l => filter === 'all' || l.estado === filter)
    .filter(l => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase().trim();
      const owner = (l.propietario || '').toLowerCase();
      const unit = (l.unidadNumero || '').toLowerCase();
      return owner.includes(term) || unit.includes(term);
    });

  // Naturally/numerically sorted readings list by house number
  const sortedLecturas = [...filteredLecturas].sort((a, b) =>
    a.unidadNumero.localeCompare(b.unidadNumero, undefined, { numeric: true, sensitivity: 'base' })
  );

  // Sorted units for new reading dropdown (only show units with pending readings in the selected period)
  const sortedUnidades = [...unidades]
    .filter(u => {
      const reading = lecturas.find(l => l.unidadId === u.id);
      return !reading || reading.estado === 'PENDIENTE';
    })
    .sort((a, b) =>
      a.numero.localeCompare(b.numero, undefined, { numeric: true, sensitivity: 'base' })
    );

  return (
    <div className="lecturas-page fade-in">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleCsvImport}
        accept=".csv"
        style={{ display: 'none' }}
      />

      {/* Header */}
      <div className="lecturas-header glass-card">
        <div>
          <h1 className="page-title gradient-text" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            💧 Registro de Lecturas de Agua
          </h1>
          <p className="page-desc">
            Registre y gestione el volumen mensual consumido en cada filial para el cobro correspondiente.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', color: '#A0AEC0' }}>Período:</label>
            <select
              className="form-input"
              value={selectedPeriodo?.id || ''}
              onChange={handlePeriodoChange}
              style={{ background: '#1A1A2E', cursor: 'pointer', width: '180px' }}
            >
              {periodos.map((p) => (
                <option key={p.id} value={p.id}>
                  {getMesNombre(p.mes)} {p.anio} ({p.estado})
                </option>
              ))}
            </select>
          </div>
          {selectedPeriodo?.estado === 'ABIERTO' && (
            <div className="lecturas-actions">
              <button 
                className="btn btn-ghost" 
                onClick={() => fileInputRef.current?.click()}
                disabled={loadingAction}
              >
                📥 Importar CSV
              </button>
              <button 
                className="btn btn-accent" 
                onClick={openNewModal}
                disabled={loadingAction}
              >
                📷 Nueva Lectura
              </button>
            </div>
          )}
        </div>
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

      {/* Stats Row */}
      <div className="lecturas-stats">
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #2575FC, #6A11CB)' }}>📊</div>
          <div>
            <div className="stat-val">{totalUnidades}</div>
            <div className="stat-label">Total Unidades</div>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #48BB78, #38A169)' }}>✅</div>
          <div>
            <div className="stat-val" style={{ color: '#48BB78' }}>{completadas}</div>
            <div className="stat-label">Completadas</div>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #F6AD55, #ED8936)' }}>⏳</div>
          <div>
            <div className="stat-val" style={{ color: '#F6AD55' }}>{pendientes}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #FC5C7D, #E53E3E)' }}>❌</div>
          <div>
            <div className="stat-val" style={{ color: '#FC5C7D' }}>{errores}</div>
            <div className="stat-label">Con Error</div>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="lecturas-progress glass-card">
        <div className="progress-row">
          <span>Progreso de registro de medidores</span>
          <strong style={{ color: '#60A5FA' }}>{progresoRecorrido}%</strong>
        </div>
        <div className="progress-bar" style={{ height: 8, marginTop: 8 }}>
          <div className="progress-bar-fill" style={{ width: `${progresoRecorrido}%`, background: 'var(--gradient-primary)' }} />
        </div>
      </div>

      {/* Controls */}
      <div className="lecturas-controls glass-card">
        <div className="filter-tabs">
          {(['all', 'COMPLETADA', 'PENDIENTE', 'ERROR'] as FilterType[]).map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? `📋 Todas (${totalUnidades})`
                : f === 'COMPLETADA' ? `✅ Completadas (${completadas})`
                : f === 'PENDIENTE' ? `⏳ Pendientes (${pendientes})`
                : `❌ Errores (${errores})`}
            </button>
          ))}
        </div>
        <div className="lecturas-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por casa o propietario..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="lecturas-table-card glass-card">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="table-scroll-x">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Casa #</th>
                  <th>Propietario</th>
                  <th style={{ textAlign: 'right' }}>Lect. Anterior (m³)</th>
                  <th style={{ textAlign: 'right' }}>Lect. Actual (m³)</th>
                  <th style={{ textAlign: 'right' }}>Consumo</th>
                  <th>Fecha Registro</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedLecturas.map(l => (
                  <tr key={l.unidadId}>
                    <td>
                      <span className="casa-badge">#{l.unidadNumero}</span>
                    </td>
                    <td style={{ color: 'white', fontWeight: 500 }}>{l.propietario}</td>
                    <td style={{ textAlign: 'right' }}>{l.lecturaAnterior.toLocaleString()} m³</td>
                    <td style={{ textAlign: 'right' }}>
                      {l.lecturaActual !== null
                        ? <strong style={{ color: 'white' }}>{l.lecturaActual.toLocaleString()} m³</strong>
                        : <span style={{ color: '#718096' }}>Sin registrar</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {l.consumo !== null ? (
                        <span className={`consumo-val ${l.consumo > 30 ? 'high' : l.consumo > 15 ? 'medium' : 'low'}`}>
                          {l.consumo} m³
                        </span>
                      ) : '—'}
                    </td>
                    <td style={{ color: '#718096', fontSize: '0.82rem' }}>
                      {l.fecha ? new Date(l.fecha).toLocaleDateString('es-CR') : '—'}
                    </td>
                    <td>
                      {l.estado === 'COMPLETADA' && <span className="badge badge-success">✅ Registrada</span>}
                      {l.estado === 'PENDIENTE' && <span className="badge badge-warning">⏳ Pendiente</span>}
                      {l.estado === 'ERROR' && <span className="badge badge-error">❌ Error OCR</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="action-btns" style={{ justifyContent: 'flex-end' }}>
                        <button 
                          className="action-btn view" 
                          onClick={() => openViewModal(l)}
                          title="Ver evidencia"
                        >
                          👁
                        </button>
                        {selectedPeriodo?.estado === 'ABIERTO' && (
                          <button 
                            className="action-btn edit" 
                            onClick={() => openEditModal(l)}
                            title="Modificar lectura"
                          >
                            ✏️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {sortedLecturas.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '30px', color: '#718096' }}>
                      No se encontraron registros de lectura para los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW LECTURA MODAL */}
      {showNewModal && (
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
          <div className="glass-card" style={{ width: '450px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#1A1A2E' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>
                📷 Registrar Lectura de Agua
              </h2>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#A0AEC0', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleNewSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Seleccionar Filial (Unidad)</label>
                <select
                  value={newUnidadId}
                  onChange={(e) => setNewUnidadId(e.target.value)}
                  className="form-input"
                  required
                  style={{ background: '#1A1A2E', cursor: 'pointer' }}
                >
                  <option value="">-- Seleccione una casa --</option>
                  {sortedUnidades.map(u => (
                    <option key={u.id} value={u.id}>
                      Casa #{u.numero} — {u.propietario}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Valor del Medidor Actual (m³)</label>
                <input
                  type="number"
                  step="0.001"
                  value={newValorM3}
                  onChange={(e) => setNewValorM3(e.target.value)}
                  className="form-input"
                  placeholder="Ej. 1045.2"
                  min="0"
                  required
                  disabled={loadingAction}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block' }}>Foto de Evidencia del Medidor (Opcional)</label>
                
                {newFotoUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <img src={getFotoUrl(newFotoUrl)} alt="Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.75rem', color: '#A0AEC0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{newFotoUrl}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>✓ Foto lista para registrar</div>
                    </div>
                    <button type="button" className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', minHeight: 'auto', color: 'var(--color-error)' }} onClick={() => setNewFotoUrl('')}>
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <div 
                    style={{
                      border: '2px dashed var(--color-border)',
                      borderRadius: '8px',
                      padding: '20px 16px',
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.01)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'border-color var(--transition-fast)'
                    }}
                    onClick={() => newFileRef.current?.click()}
                  >
                    {uploadingNew ? (
                      <>
                        <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2px' }}></div>
                        <span style={{ fontSize: '0.8rem', color: '#A0AEC0' }}>Subiendo archivo...</span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '1.6rem' }}>📷</span>
                        <span style={{ fontSize: '0.8rem', color: '#A0AEC0', fontWeight: 500 }}>Subir foto desde archivo (llave maya, PC)</span>
                        <span style={{ fontSize: '0.7rem', color: '#718096' }}>Formatos aceptados: PNG, JPG, WEBP</span>
                      </>
                    )}
                    
                    <input
                      type="file"
                      ref={newFileRef}
                      onChange={handleNewFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={uploadingNew || loadingAction}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                  <span style={{ fontSize: '0.65rem', color: '#718096', fontWeight: 600 }}>O ENLACE DIRECTO</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                </div>

                <input
                  type="text"
                  value={newFotoUrl}
                  onChange={(e) => setNewFotoUrl(e.target.value)}
                  className="form-input"
                  placeholder="Pegue la URL externa de la foto..."
                  disabled={loadingAction || uploadingNew}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setShowNewModal(false)}
                  disabled={loadingAction || uploadingNew}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-accent" disabled={loadingAction || uploadingNew}>
                  {loadingAction ? 'Guardando...' : uploadingNew ? 'Subiendo foto...' : 'Registrar Lectura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT LECTURA MODAL */}
      {showEditModal && (
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
          <div className="glass-card" style={{ width: '450px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#1A1A2E' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>
                ✏️ Editar Lectura
              </h2>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#A0AEC0', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                <span style={{ color: '#718096', display: 'block' }}>Filial seleccionada</span>
                <strong style={{ color: 'white' }}>Casa #{editUnidadNumero} — {editPropietario}</strong>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Valor del Medidor Actual (m³)</label>
                <input
                  type="number"
                  step="0.001"
                  value={editValorM3}
                  onChange={(e) => setEditValorM3(e.target.value)}
                  className="form-input"
                  placeholder="Ej. 1045.2"
                  min="0"
                  required
                  disabled={loadingAction}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block' }}>Foto de Evidencia del Medidor (Opcional)</label>
                
                {editFotoUrl ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                    <img src={getFotoUrl(editFotoUrl)} alt="Preview" style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.75rem', color: '#A0AEC0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{editFotoUrl}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--color-success)' }}>✓ Foto lista para registrar</div>
                    </div>
                    <button type="button" className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.75rem', height: 'auto', minHeight: 'auto', color: 'var(--color-error)' }} onClick={() => setEditFotoUrl('')}>
                      Eliminar
                    </button>
                  </div>
                ) : (
                  <div 
                    style={{
                      border: '2px dashed var(--color-border)',
                      borderRadius: '8px',
                      padding: '20px 16px',
                      textAlign: 'center',
                      background: 'rgba(255,255,255,0.01)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'border-color var(--transition-fast)'
                    }}
                    onClick={() => editFileRef.current?.click()}
                  >
                    {uploadingEdit ? (
                      <>
                        <div className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2px' }}></div>
                        <span style={{ fontSize: '0.8rem', color: '#A0AEC0' }}>Subiendo archivo...</span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '1.6rem' }}>📷</span>
                        <span style={{ fontSize: '0.8rem', color: '#A0AEC0', fontWeight: 500 }}>Subir foto desde archivo (llave maya, PC)</span>
                        <span style={{ fontSize: '0.7rem', color: '#718096' }}>Formatos aceptados: PNG, JPG, WEBP</span>
                      </>
                    )}
                    
                    <input
                      type="file"
                      ref={editFileRef}
                      onChange={handleEditFileChange}
                      accept="image/*"
                      style={{ display: 'none' }}
                      disabled={uploadingEdit || loadingAction}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '6px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                  <span style={{ fontSize: '0.65rem', color: '#718096', fontWeight: 600 }}>O ENLACE DIRECTO</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--color-border)' }} />
                </div>

                <input
                  type="text"
                  value={editFotoUrl}
                  onChange={(e) => setEditFotoUrl(e.target.value)}
                  className="form-input"
                  placeholder="Pegue la URL externa de la foto..."
                  disabled={loadingAction || uploadingEdit}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-ghost" 
                  onClick={() => setShowEditModal(false)}
                  disabled={loadingAction || uploadingEdit}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loadingAction || uploadingEdit}>
                  {loadingAction ? 'Guardando...' : uploadingEdit ? 'Subiendo foto...' : 'Actualizar Lectura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {showViewModal && viewLectura && (
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
          <div className="glass-card" style={{ width: '500px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#1A1A2E' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>
                👁️ Detalle de Lectura — Casa #{viewLectura.unidadNumero}
              </h2>
              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#A0AEC0', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block' }}>Propietario</span>
                  <span style={{ color: 'white', fontWeight: 600 }}>{viewLectura.propietario}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block' }}>Estado Registro</span>
                  <span className={`badge ${viewLectura.estado === 'COMPLETADA' ? 'badge-success' : viewLectura.estado === 'PENDIENTE' ? 'badge-warning' : 'badge-error'}`} style={{ display: 'inline-block', marginTop: '4px' }}>
                    {viewLectura.estado}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block' }}>Lectura Anterior</span>
                  <span style={{ color: 'white', fontSize: '1rem', fontWeight: 600 }}>{viewLectura.lecturaAnterior} m³</span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block' }}>Lectura Actual</span>
                  <span style={{ color: 'white', fontSize: '1rem', fontWeight: 600 }}>
                    {viewLectura.lecturaActual !== null ? `${viewLectura.lecturaActual} m³` : '—'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block' }}>Consumo</span>
                  <span style={{ color: 'var(--color-accent-orange)', fontSize: '1rem', fontWeight: 700 }}>
                    {viewLectura.consumo !== null ? `${viewLectura.consumo} m³` : '—'}
                  </span>
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '8px' }}>Foto de Evidencia del Medidor</span>
                {viewLectura.fotoUrl ? (
                  <div style={{ width: '100%', height: '240px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                    <img 
                      src={getFotoUrl(viewLectura.fotoUrl)} 
                      alt={`Evidencia Casa #${viewLectura.unidadNumero}`} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '100%', padding: '40px', borderRadius: '12px', border: '1px dashed var(--color-border)', textAlign: 'center', color: '#718096', fontSize: '0.85rem' }}>
                    No se ha adjuntado ninguna foto de evidencia para esta lectura.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-primary" onClick={() => setShowViewModal(false)}>
                  Cerrar Detalle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LecturasPage;
