import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Visitor {
  id: number;
  nombre: string;
  autorizadoPor: string;
  unidad: string;
  fechaDesde: string;
  fechaHasta: string;
  horaIngreso: string;
  pin: string;
  foto: string;
}

const mockVisitors: Visitor[] = [
  { id: 1, nombre: 'Juan Pérez', autorizadoPor: 'María González', unidad: '01', fechaDesde: '2026-06-04', fechaHasta: '2026-06-04', horaIngreso: '09:15', pin: '1234', foto: '👤' },
  { id: 2, nombre: 'Servicios XYZ', autorizadoPor: 'Carlos Rodríguez', unidad: '02', fechaDesde: '2026-06-04', fechaHasta: '2026-06-05', horaIngreso: '10:30', pin: '5678', foto: '🔧' },
  { id: 3, nombre: 'Ana Rojas', autorizadoPor: 'Patricia Mora', unidad: '05', fechaDesde: '2026-06-03', fechaHasta: '2026-06-06', horaIngreso: '14:00', pin: '9012', foto: '👤' },
];

const GuardiaPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  const [accessResult, setAccessResult] = useState<'allowed' | 'denied' | null>(null);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    const found = mockVisitors.find(v =>
      v.nombre.toLowerCase().includes(search.toLowerCase()) ||
      v.pin === search
    );
    setSelectedVisitor(found || null);
    setHasSearched(true);
    setAccessResult(null);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setHasSearched(false);
    if (!val) {
      setSelectedVisitor(null);
    }
  };

  const handleAccess = (allow: boolean) => {
    setAccessResult(allow ? 'allowed' : 'denied');
    setTimeout(() => {
      setAccessResult(null);
      setSelectedVisitor(null);
      setSearch('');
      setHasSearched(false);
    }, 3000);
  };

  const filteredVisitors = mockVisitors.filter(v =>
    v.nombre.toLowerCase().includes(search.toLowerCase()) ||
    v.pin.includes(search) ||
    v.unidad.includes(search) ||
    v.autorizadoPor.toLowerCase().includes(search.toLowerCase())
  );

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
          <span style={{ fontSize: '1.5rem' }}>🏘</span>
          <div>
            <div style={{ color: 'white', fontFamily: "'Outfit', sans-serif", fontWeight: 700 }}>Condominio</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>Control de Acceso</div>
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
            background: accessResult === 'allowed' ? 'rgba(72, 187, 120, 0.95)' : 'rgba(252, 92, 125, 0.95)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 20, animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{ fontSize: '5rem' }}>{accessResult === 'allowed' ? '✅' : '🚫'}</div>
            <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '3rem', fontWeight: 800, color: 'white' }}>
              {accessResult === 'allowed' ? 'ACCESO PERMITIDO' : 'ACCESO DENEGADO'}
            </h2>
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
              placeholder="Buscar por nombre o PIN de acceso..."
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
            <div style={{ fontSize: '4rem', marginBottom: 12 }}>{selectedVisitor.foto}</div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.8rem', fontWeight: 800, color: 'white', marginBottom: 8 }}>
              {selectedVisitor.nombre}
            </h3>
            <p style={{ color: '#A0AEC0', marginBottom: 24 }}>
              Autorizado por: <strong style={{ color: 'white' }}>{selectedVisitor.autorizadoPor}</strong> — 
              Casa #{selectedVisitor.unidad}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 32 }}>
              {[
                { label: 'Desde', value: selectedVisitor.fechaDesde },
                { label: 'Hasta', value: selectedVisitor.fechaHasta },
                { label: 'Hora', value: selectedVisitor.horaIngreso },
              ].map(item => (
                <div key={item.label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px' }}>
                  <div style={{ color: '#718096', fontSize: '0.75rem', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ color: 'white', fontWeight: 700 }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button onClick={() => handleAccess(true)} style={{
                flex: 1, padding: '18px', background: 'linear-gradient(135deg, #48BB78, #38A169)',
                border: 'none', borderRadius: 14, color: 'white', fontSize: '1.1rem',
                fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(72,187,120,0.4)',
              }}>
                ✅ PERMITIR ACCESO
              </button>
              <button onClick={() => handleAccess(false)} style={{
                flex: 1, padding: '18px', background: 'linear-gradient(135deg, #FC5C7D, #E53E3E)',
                border: 'none', borderRadius: 14, color: 'white', fontSize: '1.1rem',
                fontWeight: 800, cursor: 'pointer', boxShadow: '0 6px 20px rgba(252,92,125,0.4)',
              }}>
                🚫 DENEGAR ACCESO
              </button>
            </div>
          </div>
        )}

        {hasSearched && selectedVisitor === null && (
          <div style={{ color: '#FC5C7D', fontSize: '1rem', textAlign: 'center', padding: '20px' }}>
            ⚠️ Visitante no encontrado en la lista de autorizados
          </div>
        )}

        {/* Today's visitors */}
        <div style={{ width: '100%', maxWidth: 900 }}>
          <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, color: 'white', marginBottom: 16, fontSize: '1.1rem' }}>
            📋 Visitantes Autorizados Hoy
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredVisitors.map(v => (
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
                <span style={{ fontSize: '1.5rem' }}>{v.foto}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontWeight: 600 }}>{v.nombre}</div>
                  <div style={{ color: '#718096', fontSize: '0.8rem' }}>Casa #{v.unidad} — {v.autorizadoPor}</div>
                </div>
                <div style={{ color: '#60A5FA', fontSize: '0.8rem' }}>📅 {v.fechaDesde}</div>
                <div style={{
                  background: 'rgba(72,187,120,0.15)', color: '#48BB78',
                  border: '1px solid rgba(72,187,120,0.3)',
                  padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                }}>
                  Autorizado
                </div>
              </div>
            ))}
            {filteredVisitors.length === 0 && (
              <div style={{ color: '#718096', fontSize: '0.9rem', textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: 12, border: '1px dashed rgba(255,255,255,0.08)' }}>
                🔍 No se encontraron visitantes autorizados para "{search}".
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default GuardiaPage;
