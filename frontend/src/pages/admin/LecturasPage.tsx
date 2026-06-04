import React, { useState } from 'react';
import { mockLecturas, mockResumenMes } from '../../data/mockDashboardData';
import './LecturasPage.css';

type FilterType = 'all' | 'COMPLETADA' | 'PENDIENTE' | 'ERROR';

const LecturasPage: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const completadas = mockLecturas.filter(l => l.estado === 'COMPLETADA').length;
  const pendientes = mockLecturas.filter(l => l.estado === 'PENDIENTE').length;
  const errores = mockLecturas.filter(l => l.estado === 'ERROR').length;

  const filtered = mockLecturas
    .filter(l => filter === 'all' || l.estado === filter)
    .filter(l =>
      searchTerm === '' ||
      l.propietario.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.unidadNumero.includes(searchTerm)
    );

  return (
    <div className="lecturas-page fade-in">
      {/* Header */}
      <div className="lecturas-header glass-card">
        <div>
          <h1 className="page-title gradient-text">💧 Lecturas de Agua</h1>
          <p className="page-desc">Gestión de lecturas de medidores — Junio 2026</p>
        </div>
        <div className="lecturas-actions">
          <button className="btn btn-ghost">📥 Importar CSV</button>
          <button className="btn btn-accent">📷 Nueva Lectura</button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="lecturas-stats">
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #2575FC, #6A11CB)' }}>📊</div>
          <div>
            <div className="stat-val">{mockLecturas.length}</div>
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
          <span>Progreso del recorrido</span>
          <strong style={{ color: '#60A5FA' }}>{mockResumenMes.progresoRecorrido}%</strong>
        </div>
        <div className="progress-bar" style={{ height: 8, marginTop: 8 }}>
          <div className="progress-bar-fill" style={{ width: `${mockResumenMes.progresoRecorrido}%` }} />
        </div>
      </div>

      {/* Filters & Search */}
      <div className="lecturas-controls glass-card">
        <div className="filter-tabs">
          {(['all', 'COMPLETADA', 'PENDIENTE', 'ERROR'] as FilterType[]).map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? `📋 Todas (${mockLecturas.length})`
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
        <div className="table-scroll-x">
          <table className="data-table">
            <thead>
              <tr>
                <th>Casa #</th>
                <th>Propietario</th>
                <th>Lect. Anterior (m³)</th>
                <th>Lect. Actual (m³)</th>
                <th>Consumo</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id}>
                  <td>
                    <span className="casa-badge">#{l.unidadNumero}</span>
                  </td>
                  <td style={{ color: 'white', fontWeight: 500 }}>{l.propietario}</td>
                  <td>{l.lecturaAnterior.toLocaleString()}</td>
                  <td>
                    {l.lecturaActual !== null
                      ? <strong style={{ color: 'white' }}>{l.lecturaActual.toLocaleString()}</strong>
                      : <span style={{ color: '#718096' }}>Sin registrar</span>}
                  </td>
                  <td>
                    {l.consumo !== null ? (
                      <span className={`consumo-val ${l.consumo > 200 ? 'high' : l.consumo > 100 ? 'medium' : 'low'}`}>
                        {l.consumo} m³
                      </span>
                    ) : '—'}
                  </td>
                  <td style={{ color: '#718096', fontSize: '0.82rem' }}>
                    {l.fecha || '—'}
                  </td>
                  <td>
                    {l.estado === 'COMPLETADA' && <span className="badge badge-success">✅ Completada</span>}
                    {l.estado === 'PENDIENTE' && <span className="badge badge-warning">⏳ Pendiente</span>}
                    {l.estado === 'ERROR' && <span className="badge badge-error">❌ Error</span>}
                  </td>
                  <td>
                    <div className="action-btns">
                      <button className="action-btn view">👁</button>
                      <button className="action-btn edit">✏️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LecturasPage;
