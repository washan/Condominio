// Mock data for Costa Rican condominium with 52 units

const nombres = [
  'María', 'Carlos', 'Ana', 'Luis', 'Patricia', 'Roberto', 'Sandra', 'Miguel',
  'Laura', 'Jorge', 'Carmen', 'Fernando', 'Isabel', 'Alejandro', 'Silvia', 'David',
  'Adriana', 'Ricardo', 'Gabriela', 'Eduardo', 'Melissa', 'Andrés', 'Stephanie', 'Juan',
  'José', 'Daniela', 'Francisco', 'Sofía', 'Manuel', 'Camila', 'Felipe', 'Valeria',
  'Diego', 'Mariana', 'Esteban', 'Lucía', 'Gabriel', 'Elena', 'Oscar', 'Mónica',
  'Walter', 'Lorena', 'Raúl', 'Natalia', 'Alvaro', 'Tatiana', 'Christian', 'Karla',
  'Víctor', 'Olga', 'Pablo', 'Paula'
];
const apellidos = [
  'González', 'Rodríguez', 'Jiménez', 'Hernández', 'Mora', 'Castro', 'Vargas', 'Soto',
  'Pérez', 'Ramírez', 'López', 'Alvarado', 'Brenes', 'Monge', 'Ulate', 'Rojas',
  'Fonseca', 'Solano', 'Navarro', 'Quesada', 'Chaves', 'Villalobos', 'Araya', 'Mata',
  'Montenegro', 'Guzmán', 'Sánchez', 'Herrera', 'Murillo', 'Salazar', 'Chinchilla', 'Cascante',
  'Zúñiga', 'Barquero', 'Cordero', 'Delgado', 'Esquivel', 'Fernández', 'Gutiérrez', 'Marín',
  'Morales', 'Orozco', 'Quirós', 'Ruiz', 'Segura', 'Valverde', 'Zamora', 'Acuña',
  'Campos', 'Cerdas', 'Díaz', 'Lara'
];

export const mockUnidadesList = Array.from({ length: 52 }, (_, i) => ({
  id: i + 1,
  numero: `${i + 1}`.padStart(2, '0'),
  propietario: `${nombres[i % nombres.length]} ${apellidos[i % apellidos.length]}`,
  email: `usuario${i + 1}@condominio.com`,
  telefono: `8${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
  activo: true,
}));

export const mockConsumos = Array.from({ length: 52 }, (_, i) => {
  // stable pseudo-random consumption between 45 and 345 m3
  return 45 + ((i * 17) % 300);
});

export const mockConsumosAnterior = mockConsumos.map((c, i) => {
  const diff = ((i * 7) % 31) - 15; // -15 to +15 change
  return Math.max(30, c - diff);
});

const tarifaBloque1 = 1250; // 0-100 m³
const tarifaBloque2 = 2100; // 101-300 m³
const tarifaBloque3 = 3500; // 301+ m³
const cuotaAdmin = 15000;

export function calcularMonto(consumo: number): number {
  if (consumo <= 100) return consumo * tarifaBloque1 + cuotaAdmin;
  if (consumo <= 300) return 100 * tarifaBloque1 + (consumo - 100) * tarifaBloque2 + cuotaAdmin;
  return 100 * tarifaBloque1 + 200 * tarifaBloque2 + (consumo - 300) * tarifaBloque3 + cuotaAdmin;
}

export const mockEstados: Array<'COMPLETADA' | 'PENDIENTE' | 'ERROR'> = Array.from({ length: 52 }, (_, i) => {
  if (i === 14 || i === 18 || i === 21 || i === 35 || i === 48) return 'PENDIENTE';
  if (i === 23 || i === 50) return 'ERROR';
  return 'COMPLETADA';
});

export const mockEstadosCobro: Array<'PAGADO' | 'EMITIDO' | 'MORA'> = Array.from({ length: 52 }, (_, i) => {
  if (mockEstados[i] === 'PENDIENTE') return 'EMITIDO';
  if (i % 7 === 0 || i === 20) return 'MORA';
  if (i % 3 === 0) return 'EMITIDO';
  return 'PAGADO';
});

export const mockLecturaAnteriorBase = Array.from({ length: 52 }, (_, i) => {
  return 1000 + i * 150 + ((i * 13) % 100);
});

export const mockLecturas = mockUnidadesList.map((u, i) => ({
  id: i + 1,
  unidadId: u.id,
  unidadNumero: u.numero,
  propietario: u.propietario,
  lecturaAnterior: mockLecturaAnteriorBase[i],
  lecturaActual: mockEstados[i] !== 'PENDIENTE' ? mockLecturaAnteriorBase[i] + mockConsumos[i] : null,
  consumo: mockEstados[i] !== 'PENDIENTE' ? mockConsumos[i] : null,
  monto: mockEstados[i] !== 'PENDIENTE' ? calcularMonto(mockConsumos[i]) : null,
  fecha: mockEstados[i] !== 'PENDIENTE' ? '2026-06-02' : null,
  estado: mockEstados[i],
}));

const totalFacturadoCalculado = mockLecturas.reduce((sum, item) => sum + (item.monto || 0), 0);
const totalCompletadas = mockEstados.filter(e => e === 'COMPLETADA').length;
const totalPendientes = mockEstados.filter(e => e === 'PENDIENTE').length;

export const mockResumenMes = {
  totalUnidades: 52,
  lecturasCompletadas: totalCompletadas,
  lecturasPendientes: totalPendientes,
  cobrosEmitidos: 52 - totalPendientes,
  totalFacturado: Math.round(totalFacturadoCalculado),
  progresoRecorrido: Math.round((totalCompletadas / 52) * 100),
};

export const mockConsumoHistorico = [
  { mes: 'Jul', consumoTotal: 5845, promedioPorUnidad: 112 },
  { mes: 'Ago', consumoTotal: 6120, promedioPorUnidad: 118 },
  { mes: 'Sep', consumoTotal: 5980, promedioPorUnidad: 115 },
  { mes: 'Oct', consumoTotal: 6245, promedioPorUnidad: 120 },
  { mes: 'Nov', consumoTotal: 5756, promedioPorUnidad: 111 },
  { mes: 'Dic', consumoTotal: 7567, promedioPorUnidad: 145 },
  { mes: 'Ene', consumoTotal: 6512, promedioPorUnidad: 125 },
  { mes: 'Feb', consumoTotal: 6190, promedioPorUnidad: 119 },
  { mes: 'Mar', consumoTotal: 6878, promedioPorUnidad: 132 },
  { mes: 'Abr', consumoTotal: 7245, promedioPorUnidad: 139 },
  { mes: 'May', consumoTotal: 6467, promedioPorUnidad: 124 },
  { mes: 'Jun', consumoTotal: 6689, promedioPorUnidad: 129 },
];

const count0_100 = mockConsumos.filter(c => c <= 100).length;
const count101_300 = mockConsumos.filter(c => c > 100 && c <= 300).length;
const count301Plus = mockConsumos.filter(c => c > 300).length;

export const mockDistribucionTarifaria = [
  { name: '0–100 m³', value: count0_100, color: '#48BB78' },
  { name: '101–300 m³', value: count101_300, color: '#F6AD55' },
  { name: '301+ m³', value: count301Plus, color: '#FC5C7D' },
];

export const mockEstadoCobros6Meses = [
  { mes: 'Ene', pagados: 40, emitidos: 9, mora: 3 },
  { mes: 'Feb', pagados: 43, emitidos: 6, mora: 3 },
  { mes: 'Mar', pagados: 39, emitidos: 10, mora: 3 },
  { mes: 'Abr', pagados: 42, emitidos: 7, mora: 3 },
  { mes: 'May', pagados: 45, emitidos: 5, mora: 2 },
  { mes: 'Jun', pagados: 32, emitidos: 14, mora: 6 },
];

export const mockAlertas = [
  {
    id: 1,
    tipo: 'CONSUMO_ALTO' as const,
    unidadNumero: mockUnidadesList[6].numero,
    propietario: mockUnidadesList[6].propietario,
    descripcion: `Consumo de ${mockConsumos[6]} m³ — +278% sobre el promedio del condominio`,
    severidad: 'HIGH' as const,
  },
  {
    id: 2,
    tipo: 'CONSUMO_ALTO' as const,
    unidadNumero: mockUnidadesList[13].numero,
    propietario: mockUnidadesList[13].propietario,
    descripcion: `Consumo de ${mockConsumos[13]} m³ — posible fuga detectada`,
    severidad: 'MEDIUM' as const,
  },
  {
    id: 3,
    tipo: 'LECTURA_PENDIENTE' as const,
    unidadNumero: mockUnidadesList[14].numero,
    propietario: mockUnidadesList[14].propietario,
    descripcion: 'Lectura no registrada — 5 días sin respuesta',
    severidad: 'MEDIUM' as const,
  },
  {
    id: 4,
    tipo: 'LECTURA_PENDIENTE' as const,
    unidadNumero: mockUnidadesList[18].numero,
    propietario: mockUnidadesList[18].propietario,
    descripcion: 'Lectura pendiente para este período',
    severidad: 'LOW' as const,
  },
  {
    id: 5,
    tipo: 'MORA' as const,
    unidadNumero: mockUnidadesList[20].numero,
    propietario: mockUnidadesList[20].propietario,
    descripcion: 'Saldo en mora por ₡38,500 — 45 días de atraso',
    severidad: 'HIGH' as const,
  },
];

export const mockConsumosPorUnidad = mockUnidadesList.map((u, i) => ({
  name: `C${u.numero}`,
  actual: mockConsumos[i],
  anterior: mockConsumosAnterior[i],
}));

export { mockUnidadesList as mockUnidades };
