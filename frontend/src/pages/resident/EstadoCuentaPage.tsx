import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import {
  getPerfilCondomino,
  getCobroActualCondomino,
  getHistorialCondomino,
  getLecturaActualCondomino,
  CondominoPerfil,
  LecturaCondomino
} from '../../api/condominoApi';
import { descargarPdf, enviarEmailCobro, Cobro } from '../../api/cobrosApi';
import { getAvisosVigentes, Aviso } from '../../api/avisosApi';

const obtenerNombreMes = (mes: number) => {
  const nombres = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return nombres[mes - 1] || '';
};

const EstadoCuentaPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [perfil, setPerfil] = useState<CondominoPerfil | null>(null);
  const [cobroActual, setCobroActual] = useState<Cobro | null>(null);
  const [lecturaActual, setLecturaActual] = useState<LecturaCondomino | null>(null);
  const [historial, setHistorial] = useState<Cobro[]>([]);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [descargando, setDescargando] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [emailExitoMensaje, setEmailExitoMensaje] = useState<string | null>(null);

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar perfil del condómino
        const profileData = await getPerfilCondomino();
        setPerfil(profileData);

        // Cargar lectura actual
        try {
          const readingData = await getLecturaActualCondomino();
          setLecturaActual(readingData);
        } catch (err) {
          console.warn('Error al cargar la lectura:', err);
        }

        // Cargar cobro del período activo
        try {
          const currentBill = await getCobroActualCondomino();
          setCobroActual(currentBill);
        } catch (err: any) {
          console.warn('No hay cobro generado en el periodo activo:', err);
        }

        // Cargar historial de cobros
        try {
          const historyList = await getHistorialCondomino();
          setHistorial(historyList);
        } catch (err) {
          console.warn('Error al cargar el historial:', err);
        }

        // Cargar avisos vigentes
        try {
          const avisosList = await getAvisosVigentes();
          setAvisos(avisosList);
        } catch (err) {
          console.warn('Error al cargar los avisos:', err);
        }

      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.error || 'No se pudo cargar la información de su cuenta. Asegúrese de tener una casa asociada.');
      } finally {
        setLoading(false);
      }
    };

    fetchDatos();
  }, []);

  const handleDescargarPdf = async () => {
    if (!cobroActual) return;
    try {
      setDescargando(true);
      const blob = await descargarPdf(cobroActual.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `estado_cuenta_casa_${perfil?.unidadNumero}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Error al generar o descargar el archivo PDF.');
    } finally {
      setDescargando(false);
    }
  };

  const handleEnviarEmail = async () => {
    if (!cobroActual) return;
    try {
      setEnviandoEmail(true);
      const res = await enviarEmailCobro(cobroActual.id);
      setEmailExitoMensaje(res.message);
      setEmailEnviado(true);
      setTimeout(() => {
        setEmailEnviado(false);
        setEmailExitoMensaje(null);
      }, 8000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.error || 'Error al intentar enviar el correo con el estado de cuenta.');
    } finally {
      setEnviandoEmail(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div className="spinner" style={{ width: '48px', height: '48px', border: '3px solid rgba(106, 17, 203, 0.2)', borderTopColor: '#6A11CB' }}></div>
        <p style={{ color: '#718096', fontSize: '1rem' }}>Cargando estado de cuenta...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
        <div style={{
          background: 'rgba(252, 92, 125, 0.1)',
          borderColor: 'var(--color-error)',
          color: 'var(--color-error)',
          padding: '24px',
          borderRadius: 16,
          border: '1px solid var(--color-error)',
          textAlign: 'center',
          fontSize: '1rem',
          lineHeight: '1.5'
        }}>
          ⚠️ {error}
        </div>
      </div>
    );
  }

  const total = (cobroActual?.totalCobros || 0) + (cobroActual?.saldoMonetarioAnterior || 0);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: "'Inter', sans-serif" }}>
      {/* Welcome banner */}
      <div style={{
        background: 'white',
        borderRadius: 16,
        padding: '28px 32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        borderLeft: '4px solid #6A11CB',
      }}>
        <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.4rem', color: '#1A1A2E', fontWeight: 800, marginBottom: 4 }}>
          👋 Bienvenido/a, {perfil?.nombre || user?.nombre}
        </h2>
        <p style={{ color: '#718096', fontSize: '0.9rem' }}>
          Casa #{perfil?.unidadNumero || '—'} — Estado de cuenta: {cobroActual ? `${obtenerNombreMes(cobroActual.periodoMes)} ${cobroActual.periodoAnio}` : 'Período Comercial Activo'}
        </p>
      </div>

      {emailEnviado && (
        <div style={{
          background: 'rgba(72, 187, 120, 0.1)',
          border: '1px solid rgba(72, 187, 120, 0.3)',
          color: '#38A169',
          padding: '16px 20px',
          borderRadius: 12,
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          <span>📧</span> {emailExitoMensaje || <>El estado de cuenta ha sido enviado a su correo registrado: <strong style={{ color: '#1A1A2E', marginLeft: 4 }}>{perfil?.email}</strong></>}
        </div>
      )}

      {/* Resumen de Cobro */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}>
        {[
          { label: 'Saldo Anterior', value: `₡${(cobroActual?.saldoMonetarioAnterior || 0).toLocaleString('es-CR')}`, color: '#718096', icon: '📂' },
          { label: 'Cobros del Mes', value: `₡${(cobroActual?.totalCobros || 0).toLocaleString('es-CR')}`, color: '#6A11CB', icon: '💰' },
          { label: 'Total a Pagar', value: `₡${total.toLocaleString('es-CR')}`, color: '#2575FC', icon: '💳' },
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

      {/* Avisos y Comunicados */}
      <div style={{ background: 'white', borderRadius: 16, padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)' }}>
        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, marginBottom: 16, color: '#1A1A2E' }}>
          📢 Avisos y Comunicados Recientes
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {avisos.slice(0, 3).map(aviso => (
            <div key={aviso.id} style={{ padding: '16px', background: '#F8F9FC', borderRadius: '12px', borderLeft: '3px solid #6A11CB' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <strong style={{ color: '#2D3748', fontSize: '0.9rem' }}>{aviso.titulo}</strong>
                <span style={{ fontSize: '0.75rem', color: '#718096' }}>
                  {aviso.fechaPublicacion ? new Date(aviso.fechaPublicacion).toLocaleDateString() : ''}
                </span>
              </div>
              <p style={{ fontSize: '0.82rem', color: '#4A5568', margin: 0, lineHeight: 1.4 }}>
                {aviso.contenido}
              </p>
            </div>
          ))}
          {avisos.length === 0 && (
            <div style={{ color: '#718096', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>
              No hay avisos recientes en este momento.
            </div>
          )}
        </div>
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
            {cobroActual?.items && cobroActual.items.map((c, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '14px 0', color: '#1A1A2E', fontSize: '0.9rem' }}>{c.descripcion}</td>
                <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 600, color: '#1A1A2E' }}>₡{c.subtotal.toLocaleString('es-CR')}</td>
              </tr>
            ))}
            {(!cobroActual?.items || cobroActual.items.length === 0) && (
              <tr>
                <td colSpan={2} style={{ padding: '20px 0', color: '#718096', textAlign: 'center', fontSize: '0.9rem' }}>
                  No hay cobros generados ni pendientes para este período.
                </td>
              </tr>
            )}
            <tr>
              <td style={{ padding: '16px 0', fontWeight: 700, fontSize: '1rem', color: '#6A11CB' }}>TOTAL</td>
              <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 800, fontSize: '1.1rem', color: '#6A11CB' }}>₡{total.toLocaleString('es-CR')}</td>
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
            { label: 'Lectura Anterior', value: lecturaActual?.lecturaAnterior.toLocaleString('es-CR') || '0', unit: 'm³' },
            { label: 'Lectura Actual', value: lecturaActual?.lecturaActual !== null ? lecturaActual?.lecturaActual.toLocaleString('es-CR') : '—', unit: 'm³' },
            { label: 'Consumo', value: lecturaActual?.consumoM3 !== null ? lecturaActual?.consumoM3 : '—', unit: 'm³,', color: '#6A11CB' },
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
          <div style={{
            background: '#f0f0f0',
            borderRadius: 12,
            height: 180,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            border: '2px dashed #d0d0d0',
            overflow: 'hidden'
          }}>
            {lecturaActual?.fotoAnteriorUrl ? (
              <img src={`http://localhost:8080${lecturaActual.fotoAnteriorUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Foto anterior" />
            ) : (
              <>
                <span style={{ fontSize: '2rem' }}>📷</span>
                <span style={{ color: '#718096', fontSize: '0.8rem' }}>Foto Anterior del Medidor</span>
              </>
            )}
          </div>
          <div style={{
            background: '#f0f0f0',
            borderRadius: 12,
            height: 180,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            border: '2px dashed #d0d0d0',
            overflow: 'hidden'
          }}>
            {lecturaActual?.fotoActualUrl ? (
              <img src={`http://localhost:8080${lecturaActual.fotoActualUrl}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Foto actual" />
            ) : (
              <>
                <span style={{ fontSize: '2rem' }}>📷</span>
                <span style={{ color: '#718096', fontSize: '0.8rem' }}>Foto Actual del Medidor</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {cobroActual && (
        <div style={{ display: 'flex', gap: 12 }}>
          <button 
            onClick={handleDescargarPdf}
            disabled={descargando}
            style={{
              background: 'linear-gradient(135deg, #6A11CB, #2575FC)',
              color: 'white', border: 'none',
              padding: '12px 24px', borderRadius: 10,
              fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              boxShadow: '0 4px 15px rgba(106,17,203,0.3)',
              opacity: descargando ? 0.7 : 1
            }}
          >
            {descargando ? (
              <>
                <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}></div>
                Generando...
              </>
            ) : (
              <>📄 Descargar PDF</>
            )}
          </button>
          <button 
            onClick={handleEnviarEmail}
            disabled={enviandoEmail}
            style={{
              background: 'white', color: '#6A11CB',
              border: '2px solid #6A11CB',
              padding: '12px 24px', borderRadius: 10,
              fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              opacity: enviandoEmail ? 0.7 : 1
            }}
          >
            {enviandoEmail ? (
              <>
                <div className="spinner" style={{ width: '14px', height: '14px', border: '2px solid rgba(106,17,203,0.3)', borderTopColor: '#6A11CB' }}></div>
                Enviando...
              </>
            ) : (
              <>📧 Enviar por Email</>
            )}
          </button>
        </div>
      )}

      {/* Historial */}
      <div style={{ background: 'white', borderRadius: 16, padding: '28px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', marginBottom: 32 }}>
        <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, marginBottom: 16, color: '#1A1A2E' }}>
          📅 Historial de Períodos
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {historial.map((h, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 10, background: '#f8f9fc',
            }}>
              <span style={{ color: '#1A1A2E', fontWeight: 500 }}>
                {obtenerNombreMes(h.periodoMes)} {h.periodoAnio}
              </span>
              <span style={{ color: '#6A11CB', fontWeight: 700 }}>
                ₡{h.totalPagar.toLocaleString('es-CR')}
              </span>
              <span style={{
                background: h.estado === 'PAGADO' ? '#E8F5E9' : h.estado === 'MORA' ? '#FFEBEE' : '#FFF3E0',
                color: h.estado === 'PAGADO' ? '#48BB78' : h.estado === 'MORA' ? '#FC5C7D' : '#F6AD55',
                padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600
              }}>
                {h.estado === 'PAGADO' ? '✅ PAGADO' : h.estado === 'MORA' ? '❌ EN MORA' : '⏳ EMITIDO'}
              </span>
            </div>
          ))}
          {historial.length === 0 && (
            <div style={{ color: '#718096', fontSize: '0.9rem', textAlign: 'center', padding: '16px 0' }}>
              No posee recibos históricos facturados anteriormente.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EstadoCuentaPage;
