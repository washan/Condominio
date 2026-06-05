import React, { useEffect, useState } from 'react';
import { getPeriodos, PeriodoDto, abrirPeriodo, cerrarPeriodo } from '../../api/lecturasApi';
import {
  getCobros, generarCobros, emitirCobros, pagarCobro,
  descargarPdf, descargarPdfMasivo, Cobro
} from '../../api/cobrosApi';

const CobrosPage: React.FC = () => {
  const [periodos, setPeriodos] = useState<PeriodoDto[]>([]);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState<number | null>(null);
  const [cobros, setCobros] = useState<Cobro[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'BORRADOR' | 'EMITIDO' | 'PAGADO' | 'MORA'>('all');

  // Detail Modal
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCobro, setSelectedCobro] = useState<Cobro | null>(null);

  // New Period Form State
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [newPeriodAnio, setNewPeriodAnio] = useState(new Date().getFullYear());
  const [newPeriodMes, setNewPeriodMes] = useState(new Date().getMonth() + 1);

  const handleAbrirPeriodo = async () => {
    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      await abrirPeriodo(newPeriodAnio, newPeriodMes);
      setSuccess(`Período ${getMesNombre(newPeriodMes)} ${newPeriodAnio} abierto exitosamente.`);
      await fetchPeriodos();
      // Advance forms to next month by default
      const nextMonth = newPeriodMes === 12 ? 1 : newPeriodMes + 1;
      const nextYear = newPeriodMes === 12 ? newPeriodAnio + 1 : newPeriodAnio;
      setNewPeriodMes(nextMonth);
      setNewPeriodAnio(nextYear);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al abrir el nuevo período. Asegúrese de que no exista o que el anterior esté cerrado.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleCerrarPeriodo = async (id: number) => {
    const p = periodos.find(x => x.id === id);
    const pName = p ? `${getMesNombre(p.mes)} ${p.anio}` : `ID ${id}`;
    if (!window.confirm(`¿Está seguro de que desea cerrar el período ${pName}? Esto bloqueará todas las lecturas y cobros de este mes de manera definitiva.`)) return;
    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      await cerrarPeriodo(id);
      setSuccess(`Período ${pName} cerrado exitosamente.`);
      await fetchPeriodos();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al cerrar el período.');
    } finally {
      setLoadingAction(false);
    }
  };

  useEffect(() => {
    fetchPeriodos();
  }, []);

  useEffect(() => {
    if (selectedPeriodoId) {
      fetchCobros(selectedPeriodoId);
    } else {
      setCobros([]);
    }
  }, [selectedPeriodoId]);

  const fetchPeriodos = async () => {
    try {
      setLoading(true);
      const data = await getPeriodos();
      // Ordenar periodos descendentemente por ID (más reciente primero)
      const sorted = [...data].sort((a, b) => b.id - a.id);
      setPeriodos(sorted);
      if (sorted.length > 0) {
        setSelectedPeriodoId(sorted[0].id);
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener la lista de períodos.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCobros = async (periodoId: number) => {
    try {
      setLoading(true);
      const data = await getCobros(periodoId);
      setCobros(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener la lista de cobros para el período seleccionado.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerarCobros = async () => {
    if (!selectedPeriodoId) return;
    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      await generarCobros(selectedPeriodoId);
      setSuccess('Cobros calculados e inicializados en estado BORRADOR correctamente.');
      fetchCobros(selectedPeriodoId);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al generar los cobros del período.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleEmitirCobros = async () => {
    if (!selectedPeriodoId) return;
    if (!window.confirm('¿Está seguro de que desea emitir los cobros? Esto bloqueará los montos y los hará visibles para los residentes.')) return;
    try {
      setLoadingAction(true);
      setError(null);
      setSuccess(null);
      await emitirCobros(selectedPeriodoId);
      setSuccess('Todos los cobros del período se han EMITIDO. Los residentes ya pueden verlos en su portal.');
      fetchCobros(selectedPeriodoId);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al emitir los cobros.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePagarCobro = async (id: number) => {
    if (!window.confirm('¿Confirmar registro de pago para este recibo?')) return;
    try {
      setError(null);
      setSuccess(null);
      const updated = await pagarCobro(id);
      setSuccess(`Pago registrado correctamente para la Casa #${updated.unidadNumero}.`);
      if (selectedPeriodoId) fetchCobros(selectedPeriodoId);
      if (selectedCobro?.id === id) {
        setSelectedCobro({ ...selectedCobro, estado: 'PAGADO' });
      }
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al registrar el pago.');
    }
  };

  const handleDescargarPdf = async (cobroId: number, numeroCasa: string) => {
    try {
      const blob = await descargarPdf(cobroId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estado_cuenta_casa_${numeroCasa}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert('Error al descargar el PDF del estado de cuenta.');
    }
  };

  const handleDescargarZip = async () => {
    if (!selectedPeriodoId) return;
    try {
      setLoadingAction(true);
      const blob = await descargarPdfMasivo(selectedPeriodoId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `estados_cuenta_periodo_${selectedPeriodoId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert('Error al descargar el archivo ZIP con los PDFs.');
    } finally {
      setLoadingAction(false);
    }
  };

  const getMesNombre = (mesNum: number): string => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mesNum - 1] || mesNum.toString();
  };

  const selectedPeriodo = periodos.find(p => p.id === selectedPeriodoId);

  // Filtered list
  const filteredCobros = cobros.filter(c => {
    const matchSearch = c.propietario.toLowerCase().includes(searchTerm.toLowerCase()) || c.unidadNumero.includes(searchTerm);
    const matchStatus = statusFilter === 'all' || c.estado === statusFilter;
    return matchSearch && matchStatus;
  });

  // Calculate totals
  const totalBilled = filteredCobros.reduce((acc, curr) => acc + curr.totalPagar, 0);
  const totalPaid = filteredCobros.filter(c => c.estado === 'PAGADO').reduce((acc, curr) => acc + curr.totalPagar, 0);
  const totalPending = filteredCobros.filter(c => c.estado !== 'PAGADO').reduce((acc, curr) => acc + curr.totalPagar, 0);

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
            💰 Gestión de Facturación y Cobros
          </h1>
          <p style={{ color: '#A0AEC0', fontSize: '0.875rem' }}>
            Calcule los cobros automáticos basados en consumo de agua y tarifas fijas, emita recibos de cobro y exporte PDFs consolidados por mes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ fontSize: '0.85rem', color: '#A0AEC0' }}>Período:</label>
          <select
            className="form-input"
            value={selectedPeriodoId || ''}
            onChange={(e) => setSelectedPeriodoId(parseInt(e.target.value) || null)}
            style={{ background: '#1A1A2E', cursor: 'pointer', width: '180px' }}
          >
            {periodos.map((p) => (
              <option key={p.id} value={p.id}>
                {getMesNombre(p.mes)} {p.anio} ({p.estado})
              </option>
            ))}
          </select>
          <button 
            type="button" 
            className="btn btn-ghost" 
            onClick={() => setShowPeriodModal(true)}
            style={{ padding: '8px 12px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
          >
            📅 Gestionar Períodos
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: '#A0AEC0' }}>Total Facturado (Filtro)</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'white' }}>
            ₡{totalBilled.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#718096' }}>Suma de cobros listados</span>
        </div>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid var(--color-success)' }}>
          <span style={{ fontSize: '0.8rem', color: '#A0AEC0' }}>Total Recaudado</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-success)' }}>
            ₡{totalPaid.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#718096' }}>Cobros en estado PAGADO</span>
        </div>
        <div className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '3px solid var(--color-warning)' }}>
          <span style={{ fontSize: '0.8rem', color: '#A0AEC0' }}>Pendiente de Cobro</span>
          <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-warning)' }}>
            ₡{totalPending.toLocaleString()}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#718096' }}>Emitidos, mora o borradores</span>
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

      {/* Main Panel */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Actions Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--color-border)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Buscar por casa o propietario..."
              className="form-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '280px' }}
            />
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '2px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
              {(['all', 'BORRADOR', 'EMITIDO', 'PAGADO', 'MORA'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: statusFilter === f ? 'white' : '#A0AEC0',
                    background: statusFilter === f ? 'var(--gradient-primary)' : 'transparent',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {f === 'all' ? 'Todos' : f}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            {selectedPeriodo?.estado === 'ABIERTO' && (
              <>
                <button
                  className="btn btn-ghost"
                  onClick={handleGenerarCobros}
                  disabled={loadingAction}
                >
                  ⚙️ Recalcular Período
                </button>
                <button
                  className="btn btn-accent"
                  onClick={handleEmitirCobros}
                  disabled={loadingAction}
                >
                  📤 Emitir Cobros
                </button>
              </>
            )}
            {cobros.length > 0 && (
              <button
                className="btn btn-primary"
                onClick={handleDescargarZip}
                disabled={loadingAction}
              >
                📦 Descargar PDFs (ZIP)
              </button>
            )}
          </div>
        </div>

        {/* Table list */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
            <div className="spinner"></div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Casa</th>
                  <th>Propietario</th>
                  <th style={{ textAlign: 'right' }}>Saldo Anterior</th>
                  <th style={{ textAlign: 'right' }}>Total Cobros</th>
                  <th style={{ textAlign: 'right' }}>Total a Pagar</th>
                  <th>Estado</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredCobros.map((c) => (
                  <tr key={c.id}>
                    <td><strong style={{ color: 'white' }}>#{c.unidadNumero}</strong></td>
                    <td>{c.propietario}</td>
                    <td style={{ textAlign: 'right' }}>₡{c.saldoMonetarioAnterior.toLocaleString()}</td>
                    <td style={{ textAlign: 'right' }}>₡{c.totalCobros.toLocaleString()}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'white' }}>₡{c.totalPagar.toLocaleString()}</td>
                    <td>
                      {c.estado === 'BORRADOR' && <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: '#A0AEC0' }}>📝 Borrador</span>}
                      {c.estado === 'EMITIDO' && <span className="badge badge-info">📤 Emitido</span>}
                      {c.estado === 'PAGADO' && <span className="badge badge-success">✅ Pagado</span>}
                      {c.estado === 'MORA' && <span className="badge badge-error">❌ Mora</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => {
                            setSelectedCobro(c);
                            setShowDetailModal(true);
                          }}
                        >
                          👁️ Detalle
                        </button>
                        {c.estado !== 'BORRADOR' && (
                          <button
                            className="btn btn-ghost"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'rgba(106, 17, 203, 0.4)' }}
                            onClick={() => handleDescargarPdf(c.id, c.unidadNumero)}
                          >
                            📄 PDF
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredCobros.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#718096' }}>
                      No se encontraron cobros para el período o filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COBRO DETAIL MODAL */}
      {showDetailModal && selectedCobro && (
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
          <div className="glass-card" style={{ width: '560px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#1A1A2E' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#A0AEC0', textTransform: 'uppercase' }}>Detalle de Cobro</span>
                <h2 style={{ fontSize: '1.25rem', color: 'white', fontWeight: 700, marginTop: '2px' }}>
                  Casa #{selectedCobro.unidadNumero} — {selectedCobro.propietario}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                style={{ background: 'transparent', color: '#A0AEC0', fontSize: '1.3rem' }}
              >
                ✕
              </button>
            </div>

            {/* General Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block' }}>Período de Cobro</span>
                <span style={{ color: 'white', fontSize: '0.9rem', fontWeight: 600 }}>
                  {getMesNombre(selectedCobro.periodoMes)} {selectedCobro.periodoAnio}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block' }}>Estado Actual</span>
                <span style={{ fontSize: '0.85rem' }}>
                  {selectedCobro.estado === 'BORRADOR' && <span style={{ color: '#A0AEC0' }}>📝 Borrador</span>}
                  {selectedCobro.estado === 'EMITIDO' && <span style={{ color: '#60A5FA', fontWeight: 600 }}>📤 Emitido</span>}
                  {selectedCobro.estado === 'PAGADO' && <span style={{ color: '#48BB78', fontWeight: 600 }}>✅ Pagado</span>}
                  {selectedCobro.estado === 'MORA' && <span style={{ color: '#FC5C7D', fontWeight: 600 }}>❌ Mora</span>}
                </span>
              </div>
            </div>

            {/* Itemized list */}
            <div>
              <h3 style={{ fontSize: '0.9rem', color: '#A0AEC0', marginBottom: '8px' }}>📋 Desglose de Rubros</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedCobro.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <div>
                      <span style={{ color: 'white', fontWeight: 500 }}>{item.descripcion}</span>
                      {item.cantidad > 1 && (
                        <span style={{ color: '#718096', marginLeft: '6px', fontSize: '0.75rem' }}>
                          ({item.cantidad} x ₡{item.precioUnitario.toLocaleString()})
                        </span>
                      )}
                    </div>
                    <span style={{ color: 'white' }}>₡{item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
                
                {/* Balance previous adjustment */}
                {selectedCobro.saldoMonetarioAnterior !== 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', color: selectedCobro.saldoMonetarioAnterior > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                    <span>Ajuste / Saldo de Periodo Anterior</span>
                    <span>₡{selectedCobro.saldoMonetarioAnterior.toLocaleString()}</span>
                  </div>
                )}

                {/* Total */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, padding: '12px 0 0 0', marginTop: '4px', borderTop: '2px solid var(--color-border)', color: 'white' }}>
                  <span>Total a Pagar</span>
                  <span style={{ color: '#FFD166' }}>₡{selectedCobro.totalPagar.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Actions in details */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <div>
                {selectedCobro.estado !== 'BORRADOR' && (
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleDescargarPdf(selectedCobro.id, selectedCobro.unidadNumero)}
                  >
                    📄 Descargar PDF
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowDetailModal(false)}>
                  Cerrar
                </button>
                {(selectedCobro.estado === 'EMITIDO' || selectedCobro.estado === 'MORA') && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handlePagarCobro(selectedCobro.id)}
                  >
                    💵 Registrar Pago
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PERIOD MANAGEMENT MODAL */}
      {showPeriodModal && (
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
          <div className="glass-card" style={{ width: '600px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#1A1A2E', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>
                📅 Control de Períodos de Facturación
              </h2>
              <button
                type="button"
                onClick={() => setShowPeriodModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#A0AEC0', fontSize: '1.3rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Form to open a new period */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '0.9rem', color: 'white', margin: 0 }}>➕ Abrir Nuevo Período</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px', gap: '12px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#A0AEC0', display: 'block', marginBottom: '4px' }}>Año</label>
                  <input
                    type="number"
                    value={newPeriodAnio}
                    onChange={(e) => setNewPeriodAnio(parseInt(e.target.value) || new Date().getFullYear())}
                    className="form-input"
                    min="2020"
                    max="2100"
                    style={{ background: '#1A1A2E' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: '#A0AEC0', display: 'block', marginBottom: '4px' }}>Mes</label>
                  <select
                    value={newPeriodMes}
                    onChange={(e) => setNewPeriodMes(parseInt(e.target.value) || 1)}
                    className="form-input"
                    style={{ background: '#1A1A2E', cursor: 'pointer' }}
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(m => (
                      <option key={m} value={m}>{getMesNombre(m)}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleAbrirPeriodo}
                  disabled={loadingAction}
                  style={{ height: '38px', padding: '0 12px', fontSize: '0.85rem' }}
                >
                  {loadingAction ? 'Abriendo...' : 'Abrir'}
                </button>
              </div>
            </div>

            {/* List of historical periods */}
            <div>
              <h3 style={{ fontSize: '0.9rem', color: '#A0AEC0', marginBottom: '12px' }}>⏳ Historial de Períodos</h3>
              <div style={{ overflowY: 'auto', maxHeight: '300px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Período</th>
                      <th>Fecha Apertura</th>
                      <th>Fecha Cierre</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodos.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{getMesNombre(p.mes)} {p.anio}</strong></td>
                        <td style={{ fontSize: '0.8rem' }}>{new Date(p.fechaApertura).toLocaleDateString('es-CR')}</td>
                        <td style={{ fontSize: '0.8rem' }}>
                          {p.fechaCierre ? new Date(p.fechaCierre).toLocaleDateString('es-CR') : <span style={{ color: '#718096' }}>-</span>}
                        </td>
                        <td>
                          {p.estado === 'ABIERTO' ? (
                            <span className="badge badge-success">ABIERTO</span>
                          ) : (
                            <span className="badge badge-info" style={{ background: 'rgba(255,255,255,0.05)', color: '#A0AEC0' }}>CERRADO</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {p.estado === 'ABIERTO' && (
                            <button
                              type="button"
                              className="btn btn-ghost"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', borderColor: 'var(--color-error)', color: 'var(--color-error)' }}
                              onClick={() => handleCerrarPeriodo(p.id)}
                              disabled={loadingAction}
                            >
                              🔒 Cerrar
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
              <button type="button" className="btn btn-primary" onClick={() => setShowPeriodModal(false)}>
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CobrosPage;
