import React, { useEffect, useState } from 'react';
import { getUsuarios, createUsuario, updateUsuario, resetPassword, Usuario } from '../../api/usuariosApi';
import { getUnidades, Unidad } from '../../api/unidadesApi';

const UsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal control
  const [showModal, setShowModal] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'CONDOMINO' as Usuario['rol'],
    activo: true,
    unidadId: '' as string | number,
  });

  // Reset password control
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetUserId, setResetUserId] = useState<number | null>(null);
  const [nuevaContrasena, setNuevaContrasena] = useState('');

  useEffect(() => {
    fetchUsuarios();
    fetchUnidades();
  }, []);

  const fetchUsuarios = async () => {
    try {
      setLoading(true);
      const data = await getUsuarios();
      setUsuarios(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Error al obtener la lista de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnidades = async () => {
    try {
      const data = await getUnidades();
      const sorted = [...data].sort((a, b) =>
        a.numero.localeCompare(b.numero, undefined, { numeric: true, sensitivity: 'base' })
      );
      setUnidades(sorted);
    } catch (err) {
      console.error('Error fetching units:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData({
      ...formData,
      [name]: val,
    });
  };

  const openCreateModal = () => {
    setEditingUsuario(null);
    setFormData({
      nombre: '',
      email: '',
      password: '',
      rol: 'CONDOMINO',
      activo: true,
      unidadId: '',
    });
    setShowModal(true);
  };

  const openEditModal = (u: Usuario) => {
    setEditingUsuario(u);
    setFormData({
      nombre: u.nombre,
      email: u.email,
      password: '', // Contraseña vacía por defecto al editar
      rol: u.rol,
      activo: u.activo,
      unidadId: u.unidadId || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);
      
      const parsedUnidadId = formData.rol === 'CONDOMINO' && formData.unidadId
        ? Number(formData.unidadId)
        : undefined;

      if (editingUsuario?.id) {
        // Edit flow
        const updated = await updateUsuario(editingUsuario.id, {
          nombre: formData.nombre,
          email: formData.email,
          rol: formData.rol,
          activo: formData.activo,
          password: formData.password || undefined, // Solo enviar si se rellenó
          unidadId: parsedUnidadId
        });
        setSuccess(`Usuario '${updated.nombre}' actualizado correctamente.`);
      } else {
        // Create flow
        if (!formData.password) {
          setError('La contraseña es requerida para crear un usuario.');
          return;
        }
        const created = await createUsuario({
          nombre: formData.nombre,
          email: formData.email,
          password: formData.password,
          rol: formData.rol,
          activo: formData.activo,
          unidadId: parsedUnidadId
        });
        setSuccess(`Usuario '${created.nombre}' creado correctamente.`);
      }
      setShowModal(false);
      fetchUsuarios();
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al guardar el usuario.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserId || !nuevaContrasena) return;
    try {
      setError(null);
      setSuccess(null);
      await resetPassword(resetUserId, nuevaContrasena);
      setSuccess('Contraseña restablecida exitosamente.');
      setShowResetModal(false);
      setNuevaContrasena('');
      setResetUserId(null);
      setTimeout(() => setSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Error al restablecer la contraseña.');
    }
  };

  const filteredUsuarios = usuarios.filter(
    (u) =>
      u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '4px' }}>
      {/* Page Header */}
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
            👥 Gestión de Usuarios
          </h1>
          <p style={{ color: '#A0AEC0', fontSize: '0.875rem' }}>
            Administre las cuentas del sistema, controle accesos y asigne roles a administradores, técnicos, guardias y residentes.
          </p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          ➕ Nuevo Usuario
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

      {/* Search and Table Area */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o correo electrónico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ maxWidth: '400px' }}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
            <div className="spinner" style={{ width: '32px', height: '32px' }}></div>
            <p style={{ color: '#A0AEC0', fontSize: '0.9rem' }}>Cargando usuarios...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Último Acceso</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsuarios.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <strong style={{ color: 'white' }}>{u.nombre}</strong>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      {u.rol === 'ADMIN' && <span className="badge badge-success">🛡️ Admin</span>}
                      {u.rol === 'TECNICO' && <span className="badge badge-info">💧 Técnico</span>}
                      {u.rol === 'GUARDIA' && <span className="badge badge-warning">👮 Guardia</span>}
                      {u.rol === 'CONDOMINO' && (
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid var(--color-border)' }}>
                          🏠 Residente {u.unidadId ? `(Casa #${unidades.find(un => un.id === u.unidadId)?.numero || u.unidadId})` : ''}
                        </span>
                      )}
                    </td>
                    <td>
                      {u.activo ? (
                        <span className="badge badge-success">Activo</span>
                      ) : (
                        <span className="badge badge-error">Inactivo</span>
                      )}
                    </td>
                    <td>
                      {u.ultimoAcceso ? new Date(u.ultimoAcceso).toLocaleString('es-CR') : <span style={{ color: '#718096' }}>Nunca</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                          onClick={() => openEditModal(u)}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: 'rgba(255,107,53,0.3)', color: '#FF6B35' }}
                          onClick={() => {
                            setResetUserId(u.id || null);
                            setShowResetModal(true);
                          }}
                        >
                          🔑 Contraseña
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsuarios.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#718096' }}>
                      No se encontraron usuarios coincidentes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE/EDIT USER MODAL */}
      {showModal && (
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
          padding: '30px 0',
          overflowY: 'auto',
          zIndex: 1000,
        }} className="fade-in">
          <div className="glass-card" style={{ width: '480px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#1A1A2E' }}>
            <h2 className="section-title" style={{ margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              {editingUsuario ? '✏️ Editar Usuario' : '➕ Crear Nuevo Usuario'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Nombre Completo</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
              
              {/* Ocultar o deshabilitar contraseña obligatoria al editar */}
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>
                  {editingUsuario ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder={editingUsuario ? 'Dejar vacío para no cambiar' : 'Escriba la contraseña'}
                  required={!editingUsuario}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Rol en el Sistema</label>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                    className="form-input"
                    style={{ background: '#1A1A2E', cursor: 'pointer' }}
                  >
                    <option value="CONDOMINO">Residente (Condómino)</option>
                    <option value="ADMIN">Administrador</option>
                    <option value="TECNICO">Técnico de Medidores</option>
                    <option value="GUARDIA">Guardia de Vigilancia</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Estado</label>
                  <div style={{ display: 'flex', alignItems: 'center', height: '42px', gap: '8px' }}>
                    <input
                      type="checkbox"
                      name="activo"
                      id="checkbox-activo"
                      checked={formData.activo}
                      onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <label htmlFor="checkbox-activo" style={{ color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>Activo</label>
                  </div>
                </div>
              </div>

              {formData.rol === 'CONDOMINO' && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Asociar a Filial (Casa)</label>
                  <select
                    name="unidadId"
                    value={formData.unidadId}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    style={{ background: '#1A1A2E', cursor: 'pointer' }}
                  >
                    <option value="">-- Seleccione una casa --</option>
                    {unidades.map(u => (
                      <option key={u.id} value={u.id}>
                        Casa #{u.numero} — {u.propietario}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUsuario ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {showResetModal && (
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
          padding: '30px 0',
          overflowY: 'auto',
          zIndex: 1000,
        }} className="fade-in">
          <div className="glass-card" style={{ width: '400px', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px', background: '#1A1A2E' }}>
            <h2 className="section-title" style={{ margin: 0, borderBottom: '1px solid var(--color-border)', paddingBottom: '12px' }}>
              🔑 Cambiar Contraseña
            </h2>
            <p style={{ color: '#A0AEC0', fontSize: '0.85rem', lineHeight: '1.5' }}>
              Establezca una nueva contraseña para este usuario. El usuario perderá el acceso hasta que ingrese con sus nuevas credenciales.
            </p>
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#A0AEC0', display: 'block', marginBottom: '6px' }}>Nueva Contraseña</label>
                <input
                  type="password"
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  className="form-input"
                  placeholder="Escriba la nueva contraseña"
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => {
                  setShowResetModal(false);
                  setResetUserId(null);
                  setNuevaContrasena('');
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-accent">
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosPage;
