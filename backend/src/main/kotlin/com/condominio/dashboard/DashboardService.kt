package com.condominio.dashboard

import com.condominio.domain.EstadoCobro
import com.condominio.domain.EstadoPeriodo
import com.condominio.domain.Periodo
import com.condominio.exception.BusinessException
import com.condominio.repository.*
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.math.RoundingMode

@Service
class DashboardService(
    private val periodoRepository: PeriodoRepository,
    private val unidadRepository: UnidadRepository,
    private val medidorRepository: MedidorRepository,
    private val lecturaMedidorRepository: LecturaMedidorRepository,
    private val cobroRepository: CobroRepository
) {

    fun getResumenMes(): ResumenMesDto {
        val periodo = getPeriodoActivo() ?: return ResumenMesDto(0, 0, 0, 0, BigDecimal.ZERO, 0)

        val totalUnidades = unidadRepository.findAllByActivaTrue().size
        val todasLecturas = lecturaMedidorRepository.findAll().filter { it.periodo?.id == periodo.id }
        val lecturasCompletadas = todasLecturas.filter { it.consumoM3 != null }.size
        val lecturasPendientes = totalUnidades - lecturasCompletadas

        val cobros = cobroRepository.findByPeriodoId(periodo.id)
        val cobrosEmitidos = cobros.filter { it.estado != EstadoCobro.BORRADOR }.size
        val totalFacturado = cobros.map { it.totalCobros }.fold(BigDecimal.ZERO, BigDecimal::add)

        val progresoRecorrido = if (totalUnidades > 0) {
            (lecturasCompletadas * 100) / totalUnidades
        } else {
            0
        }

        return ResumenMesDto(
            totalUnidades = totalUnidades,
            lecturasCompletadas = lecturasCompletadas,
            lecturasPendientes = lecturasPendientes,
            cobrosEmitidos = cobrosEmitidos,
            totalFacturado = totalFacturado,
            progresoRecorrido = progresoRecorrido
        )
    }

    fun getConsumoHistorico(): List<ConsumoHistoricoDto> {
        // Obtener los últimos 12 períodos facturados
        val periodos = periodoRepository.findAll()
            .sortedByDescending { it.anio * 100 + it.mes }
            .take(12)
            .reversed()

        val lecturas = lecturaMedidorRepository.findAll()

        val nombresMeses = arrayOf("Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic")

        return periodos.map { per ->
            val lecturasPeriodo = lecturas.filter { it.periodo?.id == per.id && it.consumoM3 != null }
            val consumoTotal = lecturasPeriodo.map { it.consumoM3!! }.fold(BigDecimal.ZERO, BigDecimal::add)
            val totalUnidades = lecturasPeriodo.size
            val promedio = if (totalUnidades > 0) {
                consumoTotal.divide(BigDecimal(totalUnidades), 2, RoundingMode.HALF_UP)
            } else {
                BigDecimal.ZERO
            }

            val nombreMes = if (per.mes in 1..12) nombresMeses[per.mes - 1] else "Mes"

            ConsumoHistoricoDto(
                mes = "$nombreMes ${per.anio}",
                consumoTotal = consumoTotal,
                promedioPorUnidad = promedio
            )
        }
    }

    fun getTopConsumidores(): List<TopConsumidorDto> {
        val periodo = getPeriodoActivo() ?: return emptyList()

        val lecturas = lecturaMedidorRepository.findAll()
            .filter { it.periodo?.id == periodo.id && it.consumoM3 != null }
            .sortedByDescending { it.consumoM3!! }
            .take(5)

        return lecturas.map { lect ->
            TopConsumidorDto(
                unidadNumero = lect.medidor.unidad.numero,
                propietario = lect.medidor.unidad.nombrePropietario,
                consumo = lect.consumoM3!!
            )
        }
    }

    fun getAlertas(): List<AlertaDashboardDto> {
        val periodo = getPeriodoActivo() ?: return emptyList()
        val alertas = mutableListOf<AlertaDashboardDto>()
        var counter = 1L

        // 1. Alertas de consumo alto (anomalías)
        val todasLecturas = lecturaMedidorRepository.findAll()
        val lecturasActuales = todasLecturas.filter { it.periodo?.id == periodo.id && it.consumoM3 != null }
        
        lecturasActuales.forEach { lect ->
            val consumoActual = lect.consumoM3!!
            
            // Promedio histórico del mismo medidor
            val lecturasHistoricas = todasLecturas.filter { it.medidor.id == lect.medidor.id && it.periodo?.id != periodo.id && it.consumoM3 != null }
            if (lecturasHistoricas.size >= 2) {
                val sumaHistorico = lecturasHistoricas.map { it.consumoM3!! }.fold(BigDecimal.ZERO, BigDecimal::add)
                val promedioHistorico = sumaHistorico.divide(BigDecimal(lecturasHistoricas.size), 2, RoundingMode.HALF_UP)
                
                // Si el consumo actual es > 2.0 veces (+100%) el promedio histórico
                val umbralAnomalia = promedioHistorico.multiply(BigDecimal("2.0"))
                if (consumoActual > umbralAnomalia && consumoActual > BigDecimal("30.0")) {
                    val porcentajeIncremento = consumoActual.subtract(promedioHistorico)
                        .divide(promedioHistorico, 4, RoundingMode.HALF_UP)
                        .multiply(BigDecimal("100.0"))
                        .toInt()
                    
                    alertas.add(
                        AlertaDashboardDto(
                            id = counter++,
                            tipo = "CONSUMO_ALTO",
                            unidadNumero = lect.medidor.unidad.numero,
                            propietario = lect.medidor.unidad.nombrePropietario,
                            descripcion = "Consumo de $consumoActual m³ — +$porcentajeIncremento% sobre el promedio histórico (${promedioHistorico.toInt()} m³). Posible fuga.",
                            severidad = "HIGH"
                        )
                    )
                }
            }
        }

        // 2. Alertas de lecturas pendientes
        val unidades = unidadRepository.findAllByActivaTrue()
        val medidoresActivos = unidades.flatMap { medidorRepository.findByUnidadIdAndActivoTrue(it.id) }
        val medidoresConLectura = lecturasActuales.map { it.medidor.id }.toSet()

        val pendientes = medidoresActivos.filter { !medidoresConLectura.contains(it.id) }
        pendientes.forEach { med ->
            alertas.add(
                AlertaDashboardDto(
                    id = counter++,
                    tipo = "LECTURA_PENDIENTE",
                    unidadNumero = med.unidad.numero,
                    propietario = med.unidad.nombrePropietario,
                    descripcion = "Lectura del mes pendiente de registrar.",
                    severidad = "MEDIUM"
                )
            )
        }

        // 3. Alertas de morosidad
        val cobrosMora = cobroRepository.findAll().filter { it.estado == EstadoCobro.MORA || (it.estado == EstadoCobro.EMITIDO && it.totalPagar > BigDecimal.ZERO) }
        cobrosMora.forEach { cobro ->
            alertas.add(
                AlertaDashboardDto(
                    id = counter++,
                    tipo = "MORA",
                    unidadNumero = cobro.unidad.numero,
                    propietario = cobro.unidad.nombrePropietario,
                    descripcion = "Saldo pendiente de pago por ₡${String.format("%,.2f", cobro.totalPagar.toDouble())}.",
                    severidad = if (cobro.estado == EstadoCobro.MORA) "HIGH" else "LOW"
                )
            )
        }

        return alertas.sortedBy { if (it.severidad == "HIGH") 0 else if (it.severidad == "MEDIUM") 1 else 2 }
    }

    fun getConsumosUnidad(): List<ConsumoUnidadDto> {
        val activePeriod = getPeriodoActivo() ?: return emptyList()
        val allUnits = unidadRepository.findAllByActivaTrue().sortedWith(
            compareBy( { it.numero.length }, { it.numero } )
        )
        
        // Find previous period
        val prevAnio: Short
        val prevMes: Short
        if (activePeriod.mes == 1.toShort()) {
            prevAnio = (activePeriod.anio - 1).toShort()
            prevMes = 12.toShort()
        } else {
            prevAnio = activePeriod.anio
            prevMes = (activePeriod.mes - 1).toShort()
        }
        val prevPeriod = periodoRepository.findByAnioAndMes(prevAnio, prevMes).orElse(null)

        val lecturasActuales = lecturaMedidorRepository.findAll().filter { it.periodo?.id == activePeriod.id }
        val lecturasAnteriores = if (prevPeriod != null) {
            lecturaMedidorRepository.findAll().filter { it.periodo?.id == prevPeriod.id }
        } else {
            emptyList()
        }

        return allUnits.map { unit ->
            val medidores = medidorRepository.findByUnidadIdAndActivoTrue(unit.id)
            val medidor = medidores.firstOrNull()
            
            val actualConsumo = if (medidor != null) {
                lecturasActuales.find { it.medidor.id == medidor.id }?.consumoM3?.toDouble() ?: 0.0
            } else {
                0.0
            }

            val anteriorConsumo = if (medidor != null) {
                lecturasAnteriores.find { it.medidor.id == medidor.id }?.consumoM3?.toDouble() ?: 0.0
            } else {
                0.0
            }

            ConsumoUnidadDto(
                name = "C${unit.numero}",
                actual = actualConsumo,
                anterior = anteriorConsumo
            )
        }
    }

    fun getEstadoCobros(): List<EstadoCobrosMesDto> {
        val periodos = periodoRepository.findAll()
            .sortedByDescending { it.anio * 12 + it.mes }
            .take(6)
            .reversed()

        val nombresMeses = arrayOf("Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic")

        return periodos.map { per ->
            val cobros = cobroRepository.findByPeriodoId(per.id)
            
            val pagados = cobros.filter { it.estado == EstadoCobro.PAGADO }.size
            val mora = cobros.filter { it.estado == EstadoCobro.MORA }.size
            val emitidos = cobros.filter { it.estado == EstadoCobro.EMITIDO || it.estado == EstadoCobro.BORRADOR }.size

            val nombreMes = if (per.mes in 1..12) nombresMeses[per.mes - 1] else "Mes"

            EstadoCobrosMesDto(
                mes = "$nombreMes ${per.anio}",
                pagados = pagados,
                emitidos = emitidos,
                mora = mora
            )
        }
    }

    fun getProgresoRecorrido(): List<ProgresoRecorridoDto> {
        val activePeriod = getPeriodoActivo() ?: return emptyList()
        val allUnits = unidadRepository.findAllByActivaTrue().sortedWith(
            compareBy( { it.numero.length }, { it.numero } )
        )
        
        // Find previous period
        val prevAnio: Short
        val prevMes: Short
        if (activePeriod.mes == 1.toShort()) {
            prevAnio = (activePeriod.anio - 1).toShort()
            prevMes = 12.toShort()
        } else {
            prevAnio = activePeriod.anio
            prevMes = (activePeriod.mes - 1).toShort()
        }
        val prevPeriod = periodoRepository.findByAnioAndMes(prevAnio, prevMes).orElse(null)

        val lecturasActuales = lecturaMedidorRepository.findAll().filter { it.periodo?.id == activePeriod.id }
        val lecturasAnteriores = if (prevPeriod != null) {
            lecturaMedidorRepository.findAll().filter { it.periodo?.id == prevPeriod.id }
        } else {
            emptyList()
        }
        
        val cobros = cobroRepository.findByPeriodoId(activePeriod.id)

        return allUnits.map { unit ->
            val medidores = medidorRepository.findByUnidadIdAndActivoTrue(unit.id)
            val medidor = medidores.firstOrNull()

            val lecturaActualEntity = medidor?.let { m -> lecturasActuales.find { it.medidor.id == m.id } }
            val lecturaAnteriorEntity = medidor?.let { m -> lecturasAnteriores.find { it.medidor.id == m.id } }

            val lecturaActual = lecturaActualEntity?.valorM3?.toDouble()
            
            val lecturaAnteriorVal = lecturaAnteriorEntity?.valorM3?.toDouble()
                ?: lecturaActualEntity?.let { it.valorM3.toDouble() - (it.consumoM3?.toDouble() ?: 0.0) }
                ?: 0.0

            val consumo = lecturaActualEntity?.consumoM3?.toDouble()
            val monto = cobros.find { it.unidad.id == unit.id }?.totalCobros?.toDouble()

            val estado = when {
                medidor == null -> "ERROR"
                lecturaActualEntity == null -> "PENDIENTE"
                lecturaActualEntity.consumoM3 != null && lecturaActualEntity.consumoM3!! < java.math.BigDecimal.ZERO -> "ERROR"
                else -> "COMPLETADA"
            }

            ProgresoRecorridoDto(
                unidadId = unit.id,
                unidadNumero = unit.numero,
                propietario = unit.nombrePropietario,
                lecturaAnterior = lecturaAnteriorVal,
                lecturaActual = lecturaActual,
                consumo = consumo,
                monto = monto,
                estado = estado
            )
        }
    }

    private fun getPeriodoActivo(): Periodo? {
        val abiertos = periodoRepository.findByEstado(EstadoPeriodo.ABIERTO)
        if (abiertos.isNotEmpty()) return abiertos.first()
        
        // Si no hay abierto, retornar el último cerrado
        return periodoRepository.findAll().sortedByDescending { it.anio * 100 + it.mes }.firstOrNull()
    }
}
