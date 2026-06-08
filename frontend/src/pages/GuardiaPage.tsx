import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  getInvitadosVigentes,
  searchInvitados,
  updateEstadoInvitado,
  Invitado
} from '../api/invitadosApi';

const GuardiaPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Invitado | null>(null);
  const [accessResult, setAccessResult] = useState<'INGRESADO' | 'SALIDO' | null>(null);
  const [visitors, setVisitors] = useState<Invitado[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchVigentes();
  }, []);

  const fetchVigentes = async () => {
    try {
      setLoading(true);
      const list = await getInvitadosVigentes();
      setVisitors(list);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener la lista de visitantes vigentes.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setHasSearched(true);
      const query = search.trim();
      if (!query) {
        fetchVigentes();
        return;
      }
      const list = await searchInvitados(query);
      setVisitors(list);
      if (list.length > 0) {
        setSelectedVisitor(list[0]);
      } else {
        setSelectedVisitor(null);
      }
    } catch (err: any) {
      console.error(err);
      setError('Error al buscar visitantes.');
    }
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setHasSearched(false);
    if (!val) {
      setSelectedVisitor(null);
      fetchVigentes();
    }
  };

  const handleAccess = async (id: number, nuevoEstado: 'INGRESADO' | 'SALIDO') => {
    try {
      setError(null);
      await updateEstadoInvitado(id, nuevoEstado);
      setAccessResult(nuevoEstado);
      fetchVigentes();
      setTimeout(() => {
        setAccessResult(null);
        setSelectedVisitor(null);
        setSearch('');
        setHasSearched(false);
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al actualizar el acceso del visitante.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F0C29 0%, #1A1A2E 100%)',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #6A11CB, #2575FC)',
        padding: '16px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: '1.5rem' }}>🏡</span>
          <div>
            <div style={{ color: 'white', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>Veredas del Bosque</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Control de Acceso de Seguridad</div>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login'); }} style={{
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
          color: 'white', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem',
        }}>
          Salir
        </button>
      </header>

      <main style={{ flex: 1, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>
        {/* Access result overlay */}
        {accessResult && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: accessResult === 'INGRESADO' ? 'rgba(72, 187, 120, 0.95)' : 'rgba(37, 117, 252, 0.95)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 20, animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{ fontSize: '5rem' }}>{accessResult === 'INGRESADO' ? '✅' : '🚪'}</div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '3rem', fontWeight: 800, color: 'white', textAlign: 'center' }}>
              {accessResult === 'INGRESADO' ? 'INGRESO REGISTRADO' : 'SALIDA REGISTRADA'}
            </h2>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div style={{
            width: '100%', maxWidth: 700, padding: '16px 24px',
            background: 'rgba(252,92,125,0.1)', border: '1px solid var(--color-error)',
            color: 'var(--color-error)', borderRadius: '12px', fontWeight: 600, textAlign: 'center'
          }}>
            ❌ {error}
          </div>
        )}

        {/* Search section */}
        <div style={{ width: '100%', maxWidth: 700 }}>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', fontWeight: 700,
            color: 'white', textAlign: 'center', marginBottom: 20,
          }}>
            🔍 Verificar Visitante
          </h2>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Buscar por nombre o placa de vehículo..."
              style={{
                flex: 1, padding: '20px 24px', fontSize: '1.2rem',
                background: 'rgba(255,255,255,0.07)',
                border: '2px solid rgba(255,255,255,0.15)',
                borderRadius: 14, color: 'white', outline: 'none',
                fontFamily: "'Inter', sans-serif",
              }}
              autoFocus
            />
            <button type="submit" style={{
              background: 'linear-gradient(135deg, #6A11CB, #2575FC)',
              border: 'none', color: 'white', padding: '20px 28px',
              borderRadius: 14, fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
            }}>
              Buscar
            </button>
          </form>
        </div>

        {/* Selected visitor card */}
        {selectedVisitor && (
          <div style={{
            width: '100%', maxWidth: 700,
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 20, padding: '32px', textAlign: 'center',
          }}>
            <div style={{ fontSize: '4rem', marginBottom: 12 }}>👤</div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>
              {selectedVisitor.nombre}
            </h3>
            <p style={{ color: '#A0AEC0', marginBottom: 24, fontSize: '1.05rem' }}>
              Autorizado para: <strong style={{ color: 'white' }}>Casa #{selectedVisitor.unidadNumero}</strong>
              {selectedVisitor.placaVehiculo && (
                <> — Vehículo Placa: <strong style={{ color: 'white' }}>{selectedVisitor.placaVehiculo}</strong></>
              )}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
              {[
                { label: 'Desde', value: new Date(selectedVisitor.fechaHoraDesde).toLocaleString() },
                { label: 'Hasta', value: new Date(selectedVisitor.fechaHoraHasta).toLocaleString() },
                { label: 'Estado Actual', value: selectedVisitor.estado },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px' }}>
                  <div style={{ color: '#718096', fontSize: '0.75rem', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              {selectedVisitor.estado === 'PENDIENTE' && (
                <button onClick={() => handleAccess(selectedVisitor.id, 'INGRESADO')} style={{
                  flex: 1, padding: '18px', background: 'linear-gradient(135deg, #48BB78, #38A169)',
                  border: 'none', borderRadius: 14, color: 'white', fontSize: '1.1rem',
                  fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(72,187,120,0.4)',
                }}>
                  ✅ REGISTRAR INGRESO (CHECK-IN)
                </button>
              )}
              {selectedVisitor.estado === 'INGRESADO' && (
                <button onClick={() => handleAccess(selectedVisitor.id, 'SALIDO')} style={{
                  flex: 1, padding: '18px', background: 'linear-gradient(135deg, #2575FC, #1A1A2E)',
                  border: 'none', borderRadius: 14, color: 'white', fontSize: '1.1rem',
                  fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(37,117,252,0.4)',
                }}>
                  🚪 REGISTRAR SALIDA (CHECK-OUT)
                </button>
              )}
              {['SALIDO', 'CANCELADO'].includes(selectedVisitor.estado) && (
                <div style={{ color: '#A0AEC0', padding: '12px', fontSize: '1rem', fontWeight: 600 }}>
                  Este registro ya finalizó (Estado: {selectedVisitor.estado})
                </div>
              )}
            </div>
          </div>
        )}

        {hasSearched && selectedVisitor === null && (
          <div style={{ color: '#FC5C7D', fontSize: '1.1rem', textAlign: 'center', padding: '20px', fontWeight: 600 }}>
            ⚠️ Visitante no encontrado o sin autorización vigente.
          </div>
        )}

        {/* Today's visitors list */}
        <div style={{ width: '100%', maxWidth: 900 }}>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: 'white', marginBottom: 16, fontSize: '1.1rem' }}>
            📋 Visitantes Autorizados Vigentes
          </h3>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#718096' }}>Cargando lista de hoy...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {visitors.map(v => (
                <div key={v.id} style={{
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12, padding: '16px 20px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
                  onClick={() => { setSelectedVisitor(v); setSearch(v.nombre); setHasSearched(true); setAccessResult(null); }}
                >
                  <span style={{ fontSize: '1.5rem' }}>👤</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontWeight: 600 }}>{v.nombre}</div>
                    <div style={{ color: '#718096', fontSize: '0.8rem' }}>
                      Casa #{v.unidadNumero}
                      {v.placaVehiculo && <> — Placa: {v.placaVehiculo}</>}
                    </div>
                  </div>
                  <div style={{ color: '#60A5FA', fontSize: '0.8rem' }}>
                    🕒 Entrada: {new Date(v.fechaHoraDesde).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div style={{
                    background: v.estado === 'INGRESADO' ? 'rgba(37,117,252,0.15)' : 'rgba(72,187,120,0.15)',
                    color: v.estado === 'INGRESADO' ? '#2575FC' : '#48BB78',
                    border: v.estado === 'INGRESADO' ? '1px solid rgba(37,117,252,0.3)' : '1px solid rgba(72,187,120,0.3)',
                    padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                  }}>
                    {v.estado === 'PENDIENTE' ? 'Pendiente' : v.estado}
                  </div>
                </div>
              ))}
              {visitors.length === 0 && (
                <div style={{ color: '#718096', fontSize: '0.9rem', textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.08)' }}>
                  🔍 No hay visitantes vigentes autorizados registrados en este momento.
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default GuardiaPage;
