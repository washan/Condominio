import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const mockEstado = {
  unidadNumero: '05',
  propietario: 'Patricia Mora',
  saldoAnterior: 0,
  cobros: [
    { rubro: 'Consumo de Agua (189 m³)', monto: 347500 },
    { rubro: 'Cuota de Administración', monto: 15000 },
    { rubro: 'Mantenimiento de Jardines', monto: 5000 },
  ],
  lecturaAnterior: 1890,
  lecturaActual: 2079,
  consumo: 189,
  periodo: 'Junio 2026',
  historial: [
    { periodo: 'Mayo 2026', monto: 325000, estado: 'PAGADO' },
    { periodo: 'Abril 2026', monto: 312000, estado: 'PAGADO' },
    { periodo: 'Marzo 2026', monto: 341000, estado: 'PAGADO' },
    { periodo: 'Febrero 2026', monto: 298000, estado: 'PAGADO' },
    { periodo: 'Enero 2026', monto: 335000, estado: 'PAGADO' },
    { periodo: 'Diciembre 2025', monto: 410000, estado: 'PAGADO' },
  ],
};

const total = mockEstado.cobros.reduce((s, c) => s + c.monto, 0) + mockEstado.saldoAnterior;

const EstadoCuentaPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'Inter', sans-serif" }}>
      {/* Welcome */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: '28px 32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        borderLeft: '4px solid #6A11CB',
      }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', color: '#1A1A2E', fontWeight: 800, marginBottom: 4 }}>
          👋 Bienvenido/a, {user?.nombre || mockEstado.propietario}
        </h2>
        <p style={{ color: '#718096', fontSize: '0.9rem' }}>
          Casa #{mockEstado.unidadNumero} — Estado de cuenta: {mockEstado.periodo}
        </p>
      </div>

      {/* Resumen de Cobro */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}>
        {[
          { label: 'Saldo Anterior', value: `₡${mockEstado.saldoAnterior.toLocaleString()}`, color: '#718096', icon: '📂' },
          { label: 'Cobros del Mes', value: `₡${mockEstado.cobros.reduce((s, c) => s + c.monto, 0).toLocaleString()}`, color: '#6A11CB', icon: '💰' },
          { label: 'Total a Pagar', value: `₡${total.toLocaleString()}`, color: '#2575FC', icon: '💳' },
        ].map(item => (
          <div key={item.label} style={{
            background: 'white',
            borderRadius: 16,
            padding: '24px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: item.color, fontFamily: "'Outfit', sans-serif" }}>
              {item.value}
            </div>
            <div style={{ color: '#718096', fontSize: '0.8rem', marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Detalle de Rubros */}
      <div style={{ background: 'white', borderRadius: 16, padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, marginBottom: 16, color: '#1A1A2E' }}>
          📋 Detalle de Rubros
        </h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
              <th style={{ textAlign: 'left', padding: '10px 0', color: '#718096', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Concepto</th>
              <th style={{ textAlign: 'right', padding: '10px 0', color: '#718096', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {mockEstado.cobros.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '14px 0', color: '#1A1A2E', fontSize: '0.9rem' }}>{c.rubro}</td>
                <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 600, color: '#1A1A2E' }}>₡{c.monto.toLocaleString()}</td>
              </tr>
            ))}
            <tr>
              <td style={{ padding: '16px 0', fontWeight: 700, fontSize: '1rem', color: '#6A11CB' }}>TOTAL</td>
              <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: '#6A11CB' }}>₡{total.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Lectura del Medidor */}
      <div style={{ background: 'white', borderRadius: 16, padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, marginBottom: 20, color: '#1A1A2E' }}>
          💧 Lectura del Medidor
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Lectura Anterior', value: mockEstado.lecturaAnterior.toLocaleString(), unit: 'm³' },
            { label: 'Lectura Actual', value: mockEstado.lecturaActual.toLocaleString(), unit: 'm³' },
            { label: 'Consumo', value: mockEstado.consumo, unit: 'm³', color: '#6A11CB' },
          ].map(item => (
            <div key={item.label} style={{
              background: '#f8f9fc',
              borderRadius: 12,
              padding: '20px',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: item.color || '#1A1A2E', fontFamily: "'Outfit', sans-serif" }}>
                {item.value} <span style={{ fontSize: '0.9rem', fontWeight: 400 }}>{item.unit}</span>
              </div>
              <div style={{ color: '#718096', fontSize: '0.8rem', marginTop: 4 }}>{item.label}</div>
            </div>
          ))}
        </div>
        {/* Meter photo placeholders */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {['Foto Anterior', 'Foto Actual'].map(label => (
            <div key={label} style={{
              background: '#f0f0f0',
              borderRadius: 12,
              height: 160,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              border: '2px dashed #d0d0d0',
            }}>
              <span style={{ fontSize: '2rem' }}>📷</span>
              <span style={{ color: '#718096', fontSize: '0.8rem' }}>{label} del Medidor</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button style={{
          background: 'linear-gradient(135deg, #6A11CB, #2575FC)',
          color: 'white', border: 'none',
          padding: '12px 24px', borderRadius: 10,
          fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 4px 15px rgba(106,17,203,0.3)',
        }}>
          📄 Descargar PDF
        </button>
        <button style={{
          background: 'white', color: '#6A11CB',
          border: '2px solid #6A11CB',
          padding: '12px 24px', borderRadius: 10,
          fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
        }}>
          📧 Enviar por Email
        </button>
      </div>

      {/* Historial */}
      <div style={{ background: 'white', borderRadius: 16, padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', marginBottom: 32 }}>
        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, marginBottom: 16, color: '#1A1A2E' }}>
          📅 Historial de Períodos
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mockEstado.historial.map((h, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 10, background: '#f8f9fc',
            }}>
              <span style={{ color: '#1A1A2E', fontWeight: 500 }}>{h.periodo}</span>
              <span style={{ color: '#6A11CB', fontWeight: 700 }}>₡{h.monto.toLocaleString()}</span>
              <span style={{
                background: '#E8F5E9', color: '#48BB78',
                padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600
              }}>
                ✅ {h.estado}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EstadoCuentaPage;
