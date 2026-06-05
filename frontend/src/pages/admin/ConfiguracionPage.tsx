import React, { useEffect, useState } from 'react';
import { getConfiguracion, updateConfiguracion, uploadLogo, Configuracion } from '../../api/configuracionApi';

const ConfiguracionPage: React.FC = () => {
  const [config, setConfig] = useState<Configuracion | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState<boolean>(false);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const data = await getConfiguracion();
      setConfig(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al cargar la configuración. Asegúrese de que el backend está corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!config) return;
    const { name, value } = e.target;
    const isNumeric = ['tarifaBloque1Hasta', 'tarifaBloque1Precio', 'tarifaBloque2Hasta', 'tarifaBloque2Precio', 'tarifaBloque3Precio', 'cuotaAdministracion', 'diasMora', 'porcentajeMora'].includes(name);

    setConfig({
      ...config,
      [name]: isNumeric ? parseFloat(value) || 0 : value
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const updated = await updateConfiguracion(config);
      setConfig(updated);
      setSuccess('Configuración guardada correctamente.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile || !config) return;
    try {
      setUploadingLogo(true);
      setError(null);
      setSuccess(null);
      const response = await uploadLogo(logoFile);
      setConfig({
        ...config,
        logoUrl: response.logoUrl
      });
      setLogoFile(null);
      setSuccess('Logo subido y actualizado correctamente.');
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al subir el logo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
        <p style={{ color: '#A0AEC0' }}>Cargando configuración...</p>
      </div>
    );
  }

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
          🔧 Configuración del Condominio
        </h1>
        <p style={{ color: '#A0AEC0', fontSize: '0.875rem' }}>
          Personalice los datos generales del condominio, tarifas del agua y configure el logo institucional para los estados de cuenta PDF.
        </p>
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
        {/* Main Settings Form */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Section: General Info */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 className="section-title" style={{ margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              📝 Información General
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Nombre Comercial</label>
                <input
                  type="text"
                  name="nombreCondominio"
                  value={config?.nombreCondominio || ''}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Teléfono de Contacto</label>
                <input
                  type="text"
                  name="telefonoContacto"
                  value={config?.telefonoContacto || ''}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Email de Contacto</label>
              <input
                type="email"
                name="emailContacto"
                value={config?.emailContacto || ''}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Dirección Física</label>
              <textarea
                name="direccion"
                value={config?.direccion || ''}
                onChange={handleInputChange}
                className="form-input"
                rows={3}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>

          {/* Section: Water Tariff Configuration */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h2 className="section-title" style={{ margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              💧 Tarifas de Agua y Cuota
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Límite Bloque 1 (m³)</label>
                <input
                  type="number"
                  name="tarifaBloque1Hasta"
                  value={config?.tarifaBloque1Hasta || 0}
                  onChange={handleInputChange}
                  className="form-input"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Precio Bloque 1 (₡/m³)</label>
                <input
                  type="number"
                  name="tarifaBloque1Precio"
                  value={config?.tarifaBloque1Precio || 0}
                  onChange={handleInputChange}
                  className="form-input"
                  step="0.01"
                  required
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                <span style={{ fontSize: '0.8rem', color: '#718096' }}>Consumos desde 0 hasta límite.</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Límite Bloque 2 (m³)</label>
                <input
                  type="number"
                  name="tarifaBloque2Hasta"
                  value={config?.tarifaBloque2Hasta || 0}
                  onChange={handleInputChange}
                  className="form-input"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Precio Bloque 2 (₡/m³)</label>
                <input
                  type="number"
                  name="tarifaBloque2Precio"
                  value={config?.tarifaBloque2Precio || 0}
                  onChange={handleInputChange}
                  className="form-input"
                  step="0.01"
                  required
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                <span style={{ fontSize: '0.8rem', color: '#718096' }}>Consumos entre Bloque 1 y Bloque 2.</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Excedente Bloque 3</label>
                <input
                  type="text"
                  value="Excedente (+)"
                  disabled
                  className="form-input"
                  style={{ opacity: 0.6, background: 'rgba(255,255,255,0.02)' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Precio Bloque 3 (₡/m³)</label>
                <input
                  type="number"
                  name="tarifaBloque3Precio"
                  value={config?.tarifaBloque3Precio || 0}
                  onChange={handleInputChange}
                  className="form-input"
                  step="0.01"
                  required
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '20px' }}>
                <span style={{ fontSize: '0.8rem', color: '#718096' }}>Consumos que superen el límite 2.</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px', marginTop: '8px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Cuota de Administración Base (₡)</label>
                <input
                  type="number"
                  name="cuotaAdministracion"
                  value={config?.cuotaAdministracion || 0}
                  onChange={handleInputChange}
                  className="form-input"
                  step="0.01"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Recargo de Mora (%)</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="number"
                    name="porcentajeMora"
                    value={config?.porcentajeMora || 0}
                    onChange={handleInputChange}
                    className="form-input"
                    step="0.01"
                    style={{ flex: 1 }}
                    required
                  />
                  <input
                    type="number"
                    name="diasMora"
                    value={config?.diasMora || 0}
                    onChange={handleInputChange}
                    className="form-input"
                    style={{ width: '100px' }}
                    placeholder="Días"
                    required
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block', marginTop: '4px' }}>
                  Recargo porcentual aplicado pasados los días configurados.
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <div className="spinner"></div> Guardando...
                </>
              ) : (
                '💾 Guardar Cambios'
              )}
            </button>
          </div>
        </form>

        {/* Sidebar: Logo Upload */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 className="section-title" style={{ margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              🖼️ Logo Institucional
            </h3>
            
            {/* Logo Preview */}
            <div style={{
              width: '100%',
              height: '180px',
              borderRadius: '12px',
              border: '2px dashed var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              background: 'rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              {config?.logoUrl ? (
                <img
                  src={config.logoUrl}
                  alt="Logo Condominio"
                  style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }}
                />
              ) : (
                <div style={{ textAlign: 'center', color: '#718096', padding: '16px' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>🏢</span>
                  <span style={{ fontSize: '0.8rem' }}>Sin logo cargado</span>
                </div>
              )}
            </div>

            {/* Logo Selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="file"
                id="logo-file-input"
                accept="image/*"
                onChange={handleLogoChange}
                style={{ display: 'none' }}
              />
              <label
                htmlFor="logo-file-input"
                className="btn btn-ghost"
                style={{ justifyContent: 'center', width: '100%', cursor: 'pointer' }}
              >
                📁 Seleccionar Imagen
              </label>
              
              {logoFile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#A0AEC0', wordBreak: 'break-all' }}>
                    📎 {logoFile.name}
                  </span>
                  <button
                    type="button"
                    className="btn btn-accent"
                    onClick={handleLogoUpload}
                    disabled={uploadingLogo}
                    style={{ fontSize: '0.75rem', padding: '6px 12px', width: '100%', justifyContent: 'center' }}
                  >
                    {uploadingLogo ? (
                      <div className="spinner" style={{ width: '12px', height: '12px' }}></div>
                    ) : (
                      '📤 Subir Logo'
                    )}
                  </button>
                </div>
              )}
            </div>
            
            <p style={{ fontSize: '0.75rem', color: '#718096', lineHeight: '1.4' }}>
              Soporta formatos JPG, PNG y WEBP. Se recomienda una imagen cuadrada o rectangular con fondo transparente.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionPage;
