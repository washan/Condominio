import React from 'react';

interface PlaceholderProps {
  icon: string;
  title: string;
  description: string;
}

const PlaceholderPage: React.FC<PlaceholderProps> = ({ icon, title, description }) => {
  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
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
          {icon} {title}
        </h1>
        <p style={{ color: '#A0AEC0', fontSize: '0.875rem' }}>{description}</p>
      </div>

      {/* Coming Soon Card */}
      <div className="glass-card" style={{
        padding: '64px 32px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #6A11CB, #2575FC)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          boxShadow: '0 8px 30px rgba(106, 17, 203, 0.4)'
        }}>
          {icon}
        </div>
        <div>
          <h2 style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '1.4rem',
            fontWeight: 700,
            color: 'white',
            marginBottom: '8px'
          }}>
            {title}
          </h2>
          <p style={{ color: '#A0AEC0', maxWidth: '400px', lineHeight: 1.6, fontSize: '0.9rem' }}>
            Esta sección está en desarrollo. Pronto estará disponible con todas las funcionalidades.
          </p>
        </div>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 20px',
          background: 'rgba(255,107,53,0.1)',
          border: '1px solid rgba(255,107,53,0.3)',
          borderRadius: '20px',
          color: '#FF6B35',
          fontSize: '0.8rem',
          fontWeight: 600
        }}>
          🚧 Próximamente disponible
        </div>
      </div>
    </div>
  );
};

export const CobrosPage: React.FC = () => (
  <PlaceholderPage
    icon="💰"
    title="Gestión de Cobros"
    description="Genera, gestiona y descarga los cobros mensuales del condominio."
  />
);

export const SaldosPage: React.FC = () => (
  <PlaceholderPage
    icon="📋"
    title="Saldos Iniciales"
    description="Configuración de saldos iniciales por unidad habitacional."
  />
);

export const RubrosPage: React.FC = () => (
  <PlaceholderPage
    icon="⚙️"
    title="Rubros y Tarifas"
    description="Administración de rubros de cobro y estructura tarifaria del agua."
  />
);

export const UsuariosPage: React.FC = () => (
  <PlaceholderPage
    icon="👥"
    title="Usuarios"
    description="Gestión de usuarios del sistema: administradores, condóminos y guardias."
  />
);

export const ConfiguracionPage: React.FC = () => (
  <PlaceholderPage
    icon="🔧"
    title="Configuración"
    description="Configuración general del sistema: nombre del condominio, tarifas y parámetros."
  />
);
