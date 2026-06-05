package com.condominio.cobros

import com.fasterxml.jackson.databind.ObjectMapper
import com.condominio.domain.*
import com.condominio.exception.BusinessException
import com.condominio.repository.*
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class MotorCobroService(
    private val cobroRepository: CobroRepository,
    private val itemCobroRepository: ItemCobroRepository,
    private val periodoRepository: PeriodoRepository,
    private val unidadRepository: UnidadRepository,
    private val medidorRepository: MedidorRepository,
    private val lecturaMedidorRepository: LecturaMedidorRepository,
    private val rubroRepository: RubroRepository,
    private val tarifaRubroRepository: TarifaRubroRepository,
    private val ajusteSaldoRepository: AjusteSaldoRepository,
    private val objectMapper: ObjectMapper
) {

    private val logger = LoggerFactory.getLogger(MotorCobroService::class.java)

    data class RangoTarifa(val desde: Int, val hasta: Int, val precio: Double)
    data class ConfigFijo(val monto: Double)
    data class ConfigPorcentaje(val porcentaje: Double, val sobreRubroId: Long)

    fun getCobrosPorPeriodo(periodoId: Long): List<CobroDto> {
        return cobroRepository.findByPeriodoId(periodoId).map { toCobroDto(it) }
    }

    fun getCobro(id: Long): CobroDto {
        val entity = cobroRepository.findById(id)
            .orElseThrow { BusinessException("Cobro no encontrado con id: $id") }
        val items = itemCobroRepository.findByCobroId(id).map { toItemDto(it) }
        return toCobroDto(entity, items)
    }

    @Transactional
    fun generarCobros(periodoId: Long): List<CobroDto> {
        val periodo = periodoRepository.findById(periodoId)
            .orElseThrow { BusinessException("Período no encontrado") }

        if (periodo.estado == EstadoPeriodo.CERRADO) {
            throw BusinessException("No se pueden generar o recalcular cobros para un período cerrado")
        }

        // Eliminar cobros en estado BORRADOR previos de este período para permitir recalculación limpia (idempotencia)
        val cobrosExistentes = cobroRepository.findByPeriodoId(periodoId)
        cobrosExistentes.forEach { exist ->
            if (exist.estado == EstadoCobro.BORRADOR) {
                // Eliminar items primero
                val items = itemCobroRepository.findByCobroId(exist.id)
                itemCobroRepository.deleteAll(items)
                cobroRepository.delete(exist)
            } else {
                throw BusinessException("No se pueden recalcular los cobros del período porque ya hay cobros emitidos o pagados.")
            }
        }

        val unidades = unidadRepository.findAllByActivaTrue()
        val rubrosActivos = rubroRepository.findAllByActivoTrue().sortedBy { it.ordenDisplay }
        val lecturasPeriodo = lecturaMedidorRepository.findAll().filter { it.periodo?.id == periodoId }
        val ajustesPeriodo = ajusteSaldoRepository.findAll().filter { 
            !it.fechaEfectiva.isBefore(periodo.fechaApertura) && !it.fechaEfectiva.isAfter(LocalDate.now()) 
        }

        // Buscar el período anterior para calcular el saldo anterior
        val todosPeriodos = periodoRepository.findAll().sortedBy { it.anio * 100 + it.mes }
        val index = todosPeriodos.indexOfFirst { it.id == periodoId }
        val periodoAnterior = if (index > 0) todosPeriodos[index - 1] else null

        val cobrosGenerados = mutableListOf<Cobro>()

        unidades.forEach { unidad ->
            // 1. Calcular Saldo Anterior
            var saldoAnterior = BigDecimal.ZERO
            if (periodoAnterior != null) {
                val cobroAnteriorOpt = cobroRepository.findByPeriodoIdAndUnidadId(periodoAnterior.id, unidad.id)
                if (cobroAnteriorOpt.isPresent) {
                    val cobroAnt = cobroAnteriorOpt.get()
                    if (cobroAnt.estado != EstadoCobro.PAGADO) {
                        saldoAnterior = cobroAnt.totalPagar
                    }
                }
            }

            // Crear Cobro base
            val cobro = Cobro(
                unidad = unidad,
                periodo = periodo,
                saldoMonetarioAnterior = saldoAnterior,
                totalCobros = BigDecimal.ZERO,
                totalPagar = BigDecimal.ZERO,
                estado = EstadoCobro.BORRADOR
            )
            val savedCobro = cobroRepository.save(cobro)

            val itemsGenerados = mutableListOf<ItemCobro>()
            var sumaCobros = BigDecimal.ZERO

            // Calcular recargos de mora del período anterior si aplica
            if (periodoAnterior != null) {
                val cobroAnteriorOpt = cobroRepository.findByPeriodoIdAndUnidadId(periodoAnterior.id, unidad.id)
                if (cobroAnteriorOpt.isPresent) {
                    val cobroAnt = cobroAnteriorOpt.get()
                    if (cobroAnt.estado != EstadoCobro.PAGADO) {
                        val itemsAnteriores = itemCobroRepository.findByCobroId(cobroAnt.id)
                        itemsAnteriores.forEach { itemAnt ->
                            val rubro = itemAnt.rubro
                            if (rubro != null && rubro.porcentajeMora > BigDecimal.ZERO) {
                                val rate = rubro.porcentajeMora.divide(BigDecimal("100.0"))
                                val montoMora = itemAnt.subtotal.multiply(rate).setScale(2, java.math.RoundingMode.HALF_UP)
                                if (montoMora > BigDecimal.ZERO) {
                                    val itemMora = ItemCobro(
                                        cobro = savedCobro,
                                        rubro = rubro,
                                        descripcion = "Recargo Mora: ${rubro.nombre} (${rubro.porcentajeMora}% s/ ${itemAnt.subtotal})",
                                        cantidad = BigDecimal.ONE,
                                        precioUnitario = montoMora,
                                        subtotal = montoMora
                                    )
                                    itemsGenerados.add(itemMora)
                                    sumaCobros = sumaCobros.add(montoMora)
                                }
                            }
                        }
                    }
                }
            }

            // 2. Procesar cada rubro activo
            rubrosActivos.forEach { rubro ->
                val tarifa = getTarifaVigente(rubro.id, periodo.fechaApertura) ?: return@forEach
                
                when (rubro.tipo) {
                    TipoRubro.CONSUMO -> {
                        // Buscar lectura de este medidor
                        val medidores = medidorRepository.findByUnidadIdAndActivoTrue(unidad.id)
                        val medidor = medidores.firstOrNull()
                        if (medidor != null) {
                            val lectura = lecturasPeriodo.firstOrNull { it.medidor.id == medidor.id }
                            if (lectura != null && lectura.consumoM3 != null) {
                                val consumo = lectura.consumoM3!!
                                val subtotal = calcularConsumo(consumo, tarifa.configJson)
                                val item = ItemCobro(
                                    cobro = savedCobro,
                                    rubro = rubro,
                                    descripcion = "${rubro.nombre} (${lectura.valorM3} m3 - lectura ant: ${lectura.valorM3 - consumo} m3)",
                                    cantidad = consumo,
                                    precioUnitario = if (consumo > BigDecimal.ZERO) subtotal.divide(consumo, 2, BigDecimal.ROUND_HALF_UP) else BigDecimal.ZERO,
                                    subtotal = subtotal
                                )
                                itemsGenerados.add(item)
                                sumaCobros = sumaCobros.add(subtotal)
                            }
                        }
                    }
                    TipoRubro.FIJO -> {
                        val config = try {
                            objectMapper.readValue(tarifa.configJson, ConfigFijo::class.java)
                        } catch (e: Exception) {
                            ConfigFijo(0.0)
                        }
                        val monto = BigDecimal(config.monto)
                        val item = ItemCobro(
                            cobro = savedCobro,
                            rubro = rubro,
                            descripcion = rubro.nombre,
                            cantidad = BigDecimal.ONE,
                            precioUnitario = monto,
                            subtotal = monto
                        )
                        itemsGenerados.add(item)
                        sumaCobros = sumaCobros.add(monto)
                    }
                    TipoRubro.PORCENTAJE -> {
                        val config = try {
                            objectMapper.readValue(tarifa.configJson, ConfigPorcentaje::class.java)
                        } catch (e: Exception) {
                            ConfigPorcentaje(0.0, 0)
                        }
                        
                        // Buscar el subtotal del rubro de referencia en los ítems ya calculados
                        val itemReferencia = itemsGenerados.firstOrNull { it.rubro?.id == config.sobreRubroId }
                        val baseCalculo = itemReferencia?.subtotal ?: BigDecimal.ZERO
                        
                        val porcentaje = BigDecimal(config.porcentaje).divide(BigDecimal("100.0"))
                        val monto = baseCalculo.multiply(porcentaje)
                        
                        val item = ItemCobro(
                            cobro = savedCobro,
                            rubro = rubro,
                            descripcion = "${rubro.nombre} (${config.porcentaje}% sobre ${rubroRepository.findById(config.sobreRubroId).get().nombre})",
                            cantidad = BigDecimal.ONE,
                            precioUnitario = monto,
                            subtotal = monto
                        )
                        itemsGenerados.add(item)
                        sumaCobros = sumaCobros.add(monto)
                    }
                    TipoRubro.VARIABLE -> {
                        // Los rubros variables inician en 0 y el administrador los edita o se aplican vía ajustes
                        val item = ItemCobro(
                            cobro = savedCobro,
                            rubro = rubro,
                            descripcion = rubro.nombre,
                            cantidad = BigDecimal.ONE,
                            precioUnitario = BigDecimal.ZERO,
                            subtotal = BigDecimal.ZERO
                        )
                        itemsGenerados.add(item)
                    }
                }
            }

            // 3. Procesar ajustes monetarios del período
            val ajustesUnidad = ajustesPeriodo.filter { it.unidad.id == unidad.id }
            ajustesUnidad.forEach { ajuste ->
                val item = ItemCobro(
                    cobro = savedCobro,
                    rubro = null, // Ajuste manual
                    descripcion = "Ajuste: ${ajuste.descripcion}",
                    cantidad = BigDecimal.ONE,
                    precioUnitario = ajuste.monto,
                    subtotal = ajuste.monto
                )
                itemsGenerados.add(item)
                sumaCobros = sumaCobros.add(ajuste.monto)
            }

            // Guardar todos los ítems
            itemCobroRepository.saveAll(itemsGenerados)

            // Actualizar montos totales en la cabecera
            val totalPagar = saldoAnterior.add(sumaCobros)
            
            // Bypass en Kotlin para modificar cabeceras
            val fieldTotalCobros = savedCobro.javaClass.getDeclaredField("totalCobros")
            fieldTotalCobros.isAccessible = true
            fieldTotalCobros.set(savedCobro, sumaCobros)

            val fieldTotalPagar = savedCobro.javaClass.getDeclaredField("totalPagar")
            fieldTotalPagar.isAccessible = true
            fieldTotalPagar.set(savedCobro, totalPagar)

            val updatedCobro = cobroRepository.save(savedCobro)
            cobrosGenerados.add(updatedCobro)
        }

        logger.info("Se generaron ${cobrosGenerados.size} cobros de forma exitosa para el período ID $periodoId")
        return cobrosGenerados.map { toCobroDto(it) }
    }

    @Transactional
    fun emitirCobros(periodoId: Long) {
        val cobros = cobroRepository.findByPeriodoId(periodoId)
        cobros.forEach { cobro ->
            if (cobro.estado == EstadoCobro.BORRADOR) {
                val field = cobro.javaClass.getDeclaredField("estado")
                field.isAccessible = true
                field.set(cobro, EstadoCobro.EMITIDO)
                cobroRepository.save(cobro)
            }
        }
        logger.info("Cobros emitidos para el período ID $periodoId")
    }

    @Transactional
    fun pagarCobro(cobroId: Long): CobroDto {
        val cobro = cobroRepository.findById(cobroId)
            .orElseThrow { BusinessException("Cobro no encontrado con id: $cobroId") }
        
        val field = cobro.javaClass.getDeclaredField("estado")
        field.isAccessible = true
        field.set(cobro, EstadoCobro.PAGADO)
        
        val saved = cobroRepository.save(cobro)
        logger.info("Se registró pago del cobro ID $cobroId (unidad ${cobro.unidad.numero})")
        return toCobroDto(saved)
    }

    private fun calcularConsumo(consumo: BigDecimal, configJson: String): BigDecimal {
        val rangos = try {
            objectMapper.readValue(
                configJson,
                objectMapper.typeFactory.constructCollectionType(List::class.java, RangoTarifa::class.java)
            ) as List<RangoTarifa>
        } catch (e: Exception) {
            logger.error("Error al parsear tarifas por rangos: $configJson", e)
            return consumo.multiply(BigDecimal("1250.0")) // tarifa fallback
        }

        var total = BigDecimal.ZERO
        val consVal = consumo.toDouble()

        rangos.sortedBy { it.desde }.forEach { rango ->
            if (consVal > rango.desde) {
                val limiteSuperior = if (rango.hasta == -1 || rango.hasta == 999999) consVal else Math.min(consVal, rango.hasta.toDouble())
                val consumidoEnRango = limiteSuperior - rango.desde
                if (consumidoEnRango > 0) {
                    total = total.add(BigDecimal(consumidoEnRango).multiply(BigDecimal(rango.precio)))
                }
            }
        }
        return total
    }

    private fun getTarifaVigente(rubroId: Long, fecha: LocalDate): TarifaRubro? {
        val list = tarifaRubroRepository.findByRubroIdAndFechaFinIsNullOrFechaFinAfter(rubroId, fecha)
        return list.firstOrNull { 
            !it.fechaInicio.isAfter(fecha) && (it.fechaFin == null || !it.fechaFin.isBefore(fecha)) 
        }
    }

    private fun toCobroDto(entity: Cobro, items: List<ItemCobroDto> = emptyList()): CobroDto {
        return CobroDto(
            id = entity.id,
            unidadId = entity.unidad.id,
            unidadNumero = entity.unidad.numero,
            propietario = entity.unidad.nombrePropietario,
            periodoId = entity.periodo.id,
            periodoMes = entity.periodo.mes,
            periodoAnio = entity.periodo.anio,
            saldoMonetarioAnterior = entity.saldoMonetarioAnterior,
            totalCobros = entity.totalCobros,
            totalPagar = entity.totalPagar,
            estado = entity.estado.name,
            items = items
        )
    }

    private fun toItemDto(entity: ItemCobro): ItemCobroDto {
        return ItemCobroDto(
            id = entity.id,
            rubroId = entity.rubro?.id,
            rubroNombre = entity.rubro?.nombre ?: "Ajuste manual",
            descripcion = entity.descripcion,
            cantidad = entity.cantidad,
            precioUnitario = entity.precioUnitario,
            subtotal = entity.subtotal
        )
    }
}
