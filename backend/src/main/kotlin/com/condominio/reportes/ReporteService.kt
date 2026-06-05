package com.condominio.reportes

import com.condominio.domain.EstadoCobro
import com.condominio.domain.TipoLectura
import com.condominio.exception.BusinessException
import com.condominio.repository.*
import org.springframework.stereotype.Service
import java.math.BigDecimal

@Service
class ReporteService(
    private val unidadRepository: UnidadRepository,
    private val medidorRepository: MedidorRepository,
    private val lecturaMedidorRepository: LecturaMedidorRepository,
    private val cobroRepository: CobroRepository,
    private val periodoRepository: PeriodoRepository
) {

    fun getConsumoAnual(anio: Short): List<ConsumoAnualDto> {
        val unidades = unidadRepository.findAllByActivaTrue()
        val todasLecturas = lecturaMedidorRepository.findAll()
            .filter { it.tipo == TipoLectura.REGULAR && it.periodo?.anio == anio && it.consumoM3 != null }

        return unidades.map { unidad ->
            val medidores = medidorRepository.findByUnidadIdAndActivoTrue(unidad.id)
            val medidor = medidores.firstOrNull()

            val consumosMeses = MutableList(12) { BigDecimal.ZERO }
            var totalAnual = BigDecimal.ZERO

            if (medidor != null) {
                val lecturasUnidad = todasLecturas.filter { it.medidor.id == medidor.id }
                lecturasUnidad.forEach { lect ->
                    val mesIndex = (lect.periodo!!.mes - 1)
                    if (mesIndex in 0..11) {
                        consumosMeses[mesIndex] = lect.consumoM3!!
                        totalAnual = totalAnual.add(lect.consumoM3!!)
                    }
                }
            }

            ConsumoAnualDto(
                unidadNumero = unidad.numero,
                propietario = unidad.nombrePropietario,
                consumos = consumosMeses,
                totalAnual = totalAnual
            )
        }
    }

    fun getMorosidad(): List<MorosidadDto> {
        val unidades = unidadRepository.findAllByActivaTrue()
        val todosCobros = cobroRepository.findAll()
            .filter { it.estado == EstadoCobro.MORA || (it.estado == EstadoCobro.EMITIDO && it.totalPagar > BigDecimal.ZERO) }

        val result = mutableListOf<MorosidadDto>()

        unidades.forEach { unidad ->
            val cobrosUnidad = todosCobros.filter { it.unidad.id == unidad.id }
            if (cobrosUnidad.isNotEmpty()) {
                val periodos = cobrosUnidad.map { cob ->
                    PeriodoMoraDto(
                        periodoId = cob.periodo.id,
                        periodoMes = cob.periodo.mes,
                        periodoAnio = cob.periodo.anio,
                        monto = cob.totalPagar
                    )
                }.sortedBy { it.periodoAnio * 100 + it.periodoMes }

                val totalMora = cobrosUnidad.map { it.totalPagar }.fold(BigDecimal.ZERO, BigDecimal::add)

                result.add(
                    MorosidadDto(
                        unidadId = unidad.id,
                        unidadNumero = unidad.numero,
                        propietario = unidad.nombrePropietario,
                        periodosMora = periodos,
                        totalMora = totalMora
                    )
                )
            }
        }

        return result.sortedByDescending { it.totalMora }
    }

    fun getIngresoMensual(anio: Short): List<IngresoMensualDto> {
        val periodos = periodoRepository.findAll().filter { it.anio == anio }
        val cobros = cobroRepository.findAll().filter { it.periodo.anio == anio }

        val nombresMeses = arrayOf("Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic")

        return (1..12).map { mes ->
            val periodosMes = periodos.filter { it.mes.toInt() == mes }
            val cobrosMes = cobros.filter { it.periodo.mes.toInt() == mes }

            val facturado = cobrosMes.map { it.totalCobros }.fold(BigDecimal.ZERO, BigDecimal::add)
            val recaudado = cobrosMes.filter { it.estado == EstadoCobro.PAGADO }
                .map { it.totalCobros }
                .fold(BigDecimal.ZERO, BigDecimal::add)

            IngresoMensualDto(
                mes = nombresMeses[mes - 1],
                facturado = facturado,
                recaudado = recaudado
            )
        }
    }
}
