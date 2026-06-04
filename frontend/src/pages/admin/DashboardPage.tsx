import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  mockResumenMes,
  mockConsumoHistorico,
  mockDistribucionTarifaria,
  mockEstadoCobros6Meses,
  mockAlertas,
  mockLecturas,
  mockConsumosPorUnidad,
} from '../../data/mockDashboardData';
import './DashboardPage.css';

// Count-up hook
function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);
  return count;
}

// KPI Card
interface KpiCardProps {
  icon: string;
  label: string;
  value: string | number;
  rawValue: number;
  subtitle?: string;
  gradient: string;
  color: string;
  showProgress?: boolean;
  progressValue?: number;
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, label, value, rawValue, subtitle, gradient, color, showProgress, progressValue }) => {
  const animatedValue = useCountUp(rawValue);
  const displayValue = typeof value === 'string' ? value.replace(String(rawValue), String(animatedValue)) : animatedValue;

  return (
    <div className="kpi-card glass-card">
      <div className="kpi-icon" style={{ background: gradient }}>
        <span>{icon}</span>
      </div>
      <div className="kpi-body">
        <div className="kpi-value" style={{ color }}>
          {displayValue}
        </div>
        <div className="kpi-label">{label}</div>
        {subtitle && <div className="kpi-subtitle">{subtitle}</div>}
        {showProgress && progressValue !== undefined && (
          <div className="kpi-progress">
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${progressValue}%`, background: gradient }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Custom Tooltip
const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ color: string; name: string; value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-label">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>
            {p.name}: <strong>{p.value.toLocaleString()}</strong>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Donut center label as a proper SVG component
const DonutCenterLabel: React.FC<{ total: number }> = ({ total }) => (
  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
    <tspan x="50%" dy="-0.3em" fontSize="22" fontWeight="700" fill="white">{total}</tspan>
    <tspan x="50%" dy="1.5em" fontSize="11" fill="#A0AEC0">unidades</tspan>
  </text>
);

const DashboardPage: React.FC = () => {
  const now = new Date();
  const monthYear = now.toLocaleDateString('es-CR', { month: 'long', year: 'numeric' });
  const [filterEstado, setFilterEstado] = useState<'all' | 'COMPLETADA' | 'PENDIENTE' | 'ERROR'>('all');
  const totalUnidades = mockDistribucionTarifaria.reduce((a, b) => a + b.value, 0);

  const filteredLecturas = filterEstado === 'all'
    ? mockLecturas
    : mockLecturas.filter(l => l.estado === filterEstado);

  return (
    <div className="dashboard fade-in">
      {/* ─── Page Header ─── */}
      <div className="dashboard-header glass-card">
        <div className="dashboard-header-left">
          <h1 className="dashboard-title">Dashboard</h1>
          <p className="dashboard-subtitle">
            📅 {monthYear.charAt(0).toUpperCase() + monthYear.slice(1)} — Vista general del condominio
          </p>
        </div>
        <div className="dashboard-header-right">
          <div className="dashboard-badge">
            <span className="badge badge-success">● Sistema Activo</span>
          </div>
          <div className="dashboard-date">
            {now.toLocaleDateString('es-CR', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
        </div>
        <div className="dashboard-header-bg" />
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="kpi-grid">
        <KpiCard
          icon="💧"
          label="Recorrido del Mes"
          value={`${mockResumenMes.progresoRecorrido}%`}
          rawValue={mockResumenMes.progresoRecorrido}
          subtitle={`${mockResumenMes.lecturasCompletadas} / ${mockResumenMes.totalUnidades} casas`}
          gradient="linear-gradient(135deg, #2575FC, #6A11CB)"
          color="#60A5FA"
          showProgress
          progressValue={mockResumenMes.progresoRecorrido}
        />
        <KpiCard
          icon="🏠"
          label="Cobros Emitidos"
          value={mockResumenMes.cobrosEmitidos}
          rawValue={mockResumenMes.cobrosEmitidos}
          subtitle={`de ${mockResumenMes.totalUnidades} unidades`}
          gradient="linear-gradient(135deg, #48BB78, #38A169)"
          color="#48BB78"
        />
        <KpiCard
          icon="⚠️"
          label="Lecturas Pendientes"
          value={mockResumenMes.lecturasPendientes}
          rawValue={mockResumenMes.lecturasPendientes}
          subtitle="requieren atención"
          gradient="linear-gradient(135deg, #F6AD55, #ED8936)"
          color="#F6AD55"
        />
        <KpiCard
          icon="💰"
          label="Total Facturado"
          value={`₡${mockResumenMes.totalFacturado.toLocaleString()}`}
          rawValue={mockResumenMes.totalFacturado}
          subtitle="período actual"
          gradient="linear-gradient(135deg, #FC5C7D, #6A82FB)"
          color="#FC5C7D"
        />
      </div>

      {/* ─── Charts Grid ─── */}
      <div className="charts-grid">
        {/* Chart 1: Consumo por Unidad */}
        <div className="chart-card glass-card">
          <div className="chart-header">
            <h3 className="chart-title">💧 Consumo por Unidad (m³)</h3>
            <span className="chart-legend-dot" style={{ background: 'linear-gradient(135deg, #FF6B35, #FFD166)' }}>Actual</span>
            <span className="chart-legend-dot" style={{ background: 'linear-gradient(135deg, #6A11CB, #2575FC)' }}>Anterior</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mockConsumosPorUnidad} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: '#718096', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#718096', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="actual" name="Actual" fill="#FF6B35" radius={[3, 3, 0, 0]} />
              <Bar dataKey="anterior" name="Anterior" fill="#6A11CB" radius={[3, 3, 0, 0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Historial 12 Meses */}
        <div className="chart-card glass-card">
          <div className="chart-header">
            <h3 className="chart-title">📈 Historial 12 Meses (m³ Total)</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={mockConsumoHistorico} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6A11CB" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#6A11CB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="consumoTotal"
                name="Consumo total"
                stroke="#2575FC"
                strokeWidth={2.5}
                fill="url(#areaGrad)"
                dot={{ fill: '#6A11CB', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, fill: '#FF6B35' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 3: Distribución Tarifaria */}
        <div className="chart-card glass-card">
          <div className="chart-header">
            <h3 className="chart-title">🥧 Distribución Tarifaria</h3>
          </div>
          <div className="donut-wrapper">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={mockDistribucionTarifaria}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={false}
                >
                  {mockDistribucionTarifaria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(val) => [`${val} unidades`]} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central">
                  <tspan x="50%" fontSize="22" fontWeight="700" fill="white" dy="-0.3em">{totalUnidades}</tspan>
                  <tspan x="50%" fontSize="11" fill="#A0AEC0" dy="1.5em">unidades</tspan>
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="donut-legend">
            {mockDistribucionTarifaria.map((item) => (
              <div key={item.name} className="donut-legend-item">
                <span className="donut-legend-dot" style={{ background: item.color }} />
                <span>{item.name}</span>
                <span className="donut-legend-val">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 4: Estado Cobros Stacked */}
        <div className="chart-card glass-card">
          <div className="chart-header">
            <h3 className="chart-title">💵 Estado de Cobros (6 meses)</h3>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={mockEstadoCobros6Meses} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="mes" tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#718096', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#A0AEC0' }} />
              <Bar dataKey="pagados" name="Pagados" stackId="a" fill="#48BB78" radius={[0, 0, 0, 0]} />
              <Bar dataKey="emitidos" name="Emitidos" stackId="a" fill="#2575FC" />
              <Bar dataKey="mora" name="Mora" stackId="a" fill="#FC5C7D" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ─── Two-column bottom section ─── */}
      <div className="bottom-grid">
        {/* Progreso del Recorrido Table */}
        <div className="table-section glass-card">
          <div className="table-header">
            <div>
              <h3 className="section-title">📍 Progreso del Recorrido</h3>
              <div className="table-progress-bar">
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${mockResumenMes.progresoRecorrido}%` }} />
                </div>
                <span className="progress-pct">{mockResumenMes.progresoRecorrido}% completado</span>
              </div>
            </div>
            <div className="table-filter-btns">
              {(['all', 'COMPLETADA', 'PENDIENTE', 'ERROR'] as const).map(f => (
                <button
                  key={f}
                  className={`filter-btn ${filterEstado === f ? 'active' : ''}`}
                  onClick={() => setFilterEstado(f)}
                >
                  {f === 'all' ? 'Todas' : f === 'COMPLETADA' ? '✅' : f === 'PENDIENTE' ? '⏳' : '❌'}
                </button>
              ))}
            </div>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Casa</th>
                  <th>Propietario</th>
                  <th>Lect. Ant.</th>
                  <th>Lect. Act.</th>
                  <th>Consumo</th>
                  <th>Monto</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredLecturas.map((l) => (
                  <tr key={l.id}>
                    <td><strong style={{ color: 'white' }}>#{l.unidadNumero}</strong></td>
                    <td>{l.propietario}</td>
                    <td>{l.lecturaAnterior.toLocaleString()}</td>
                    <td>{l.lecturaActual !== null ? l.lecturaActual.toLocaleString() : <span style={{ color: '#718096' }}>—</span>}</td>
                    <td>
                      {l.consumo !== null
                        ? <span style={{ color: l.consumo > 200 ? '#FC5C7D' : '#48BB78', fontWeight: 600 }}>{l.consumo} m³</span>
                        : <span style={{ color: '#718096' }}>—</span>}
                    </td>
                    <td>
                      {l.monto !== null
                        ? <span style={{ color: 'white' }}>₡{l.monto.toLocaleString()}</span>
                        : <span style={{ color: '#718096' }}>—</span>}
                    </td>
                    <td>
                      {l.estado === 'COMPLETADA' && <span className="badge badge-success">✅ OK</span>}
                      {l.estado === 'PENDIENTE' && <span className="badge badge-warning">⏳ Pendiente</span>}
                      {l.estado === 'ERROR' && <span className="badge badge-error">❌ Error</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas */}
        <div className="alertas-section glass-card">
          <h3 className="section-title">⚠️ Alertas del Mes</h3>
          <div className="alertas-list">
            {mockAlertas.map((alerta) => (
              <div
                key={alerta.id}
                className={`alerta-card ${
                  alerta.severidad === 'HIGH' ? 'alerta-high'
                  : alerta.severidad === 'MEDIUM' ? 'alerta-medium'
                  : 'alerta-low'
                }`}
              >
                <div className="alerta-icon">
                  {alerta.tipo === 'CONSUMO_ALTO' ? '💧' : alerta.tipo === 'LECTURA_PENDIENTE' ? '📋' : '💸'}
                </div>
                <div className="alerta-body">
                  <div className="alerta-title">Casa #{alerta.unidadNumero} — {alerta.propietario}</div>
                  <div className="alerta-desc">{alerta.descripcion}</div>
                </div>
                <span className={`alerta-badge ${
                  alerta.severidad === 'HIGH' ? 'badge-error' : alerta.severidad === 'MEDIUM' ? 'badge-warning' : 'badge-info'
                } badge`}>
                  {alerta.severidad}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
