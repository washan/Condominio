package com.condominio.rubros

import com.condominio.domain.Rubro
import com.condominio.domain.TarifaRubro
import com.condominio.domain.TipoRubro
import com.condominio.domain.Usuario
import com.condominio.exception.BusinessException
import com.condominio.repository.RubroRepository
import com.condominio.repository.TarifaRubroRepository
import com.condominio.repository.ItemCobroRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class RubroService(
    private val rubroRepository: RubroRepository,
    private val tarifaRubroRepository: TarifaRubroRepository,
    private val itemCobroRepository: ItemCobroRepository
) {

    private val logger = LoggerFactory.getLogger(RubroService::class.java)

    fun getRubros(soloActivos: Boolean = false): List<RubroDto> {
        val list = if (soloActivos) {
            rubroRepository.findAllByActivoTrue()
        } else {
            rubroRepository.findAll()
        }
        return list.map { toRubroDto(it) }
    }

    fun getRubro(id: Long): RubroDto {
        val entity = rubroRepository.findById(id)
            .orElseThrow { BusinessException("Rubro no encontrado con id: $id") }
        return toRubroDto(entity)
    }

    @Transactional
    fun createRubro(dto: RubroDto): RubroDto {
        val tipoEnum = try {
            TipoRubro.valueOf(dto.tipo.uppercase())
        } catch (e: Exception) {
            throw BusinessException("Tipo de rubro inválido: ${dto.tipo}")
        }

        val entity = Rubro(
            nombre = dto.nombre,
            descripcion = dto.descripcion,
            tipo = tipoEnum,
            ordenDisplay = dto.ordenDisplay,
            activo = dto.activo,
            porcentajeMora = dto.porcentajeMora
        )

        logger.info("Creando nuevo rubro: ${dto.nombre} (tipo: ${dto.tipo})")
        val saved = rubroRepository.save(entity)
        return toRubroDto(saved)
    }

    @Transactional
    fun updateRubro(id: Long, dto: RubroDto): RubroDto {
        val entity = rubroRepository.findById(id)
            .orElseThrow { BusinessException("Rubro no encontrado con id: $id") }

        entity.nombre = dto.nombre
        entity.descripcion = dto.descripcion
        entity.ordenDisplay = dto.ordenDisplay
        entity.activo = dto.activo
        entity.porcentajeMora = dto.porcentajeMora

        logger.info("Actualizando rubro ID $id: ${dto.nombre}")
        val saved = rubroRepository.save(entity)
        return toRubroDto(saved)
    }

    @Transactional
    fun deactivateRubro(id: Long) {
        val entity = rubroRepository.findById(id)
            .orElseThrow { BusinessException("Rubro no encontrado con id: $id") }

        val hasTariffs = tarifaRubroRepository.existsByRubroId(id)
        val hasBillingItems = itemCobroRepository.existsByRubroId(id)

        if (!hasTariffs && !hasBillingItems) {
            logger.info("Eliminando físicamente el rubro ID $id por no tener historial ni tarifas asociadas")
            rubroRepository.delete(entity)
        } else {
            logger.info("Desactivando (soft-delete) rubro ID $id por tener historial de cobros o tarifas activas")
            entity.activo = false
            rubroRepository.save(entity)
        }
    }

    // --- TARIFF MANAGEMENT ---

    fun getTarifaVigente(rubroId: Long, fecha: LocalDate = LocalDate.now()): TarifaRubroDto? {
        val list = tarifaRubroRepository.findByRubroIdAndFechaFinIsNullOrFechaFinAfter(rubroId, fecha)
        // Buscamos la que tenga fechaInicio <= fecha y fechaFin >= fecha (o nula)
        val vigente = list.firstOrNull { 
            !it.fechaInicio.isAfter(fecha) && (it.fechaFin == null || !it.fechaFin.isBefore(fecha)) 
        }
        return vigente?.let { toTarifaDto(it) }
    }

    fun getHistorialTarifas(rubroId: Long): List<TarifaRubroDto> {
        val rubro = rubroRepository.findById(rubroId)
            .orElseThrow { BusinessException("Rubro no encontrado con id: $rubroId") }
        // Retornamos todas ordenadas por fecha de inicio desc
        return rubroId.let {
            tarifaRubroRepository.findAll()
                .filter { it.rubro.id == rubroId }
                .sortedByDescending { it.fechaInicio }
                .map { toTarifaDto(it) }
        }
    }

    @Transactional
    fun createTarifa(rubroId: Long, dto: TarifaRubroDto, creadoPor: Usuario): TarifaRubroDto {
        val rubro = rubroRepository.findById(rubroId)
            .orElseThrow { BusinessException("Rubro no encontrado con id: $rubroId") }

        // Cerrar tarifas anteriores activas si se cruzan las fechas
        val existentes = tarifaRubroRepository.findAll().filter { it.rubro.id == rubroId }
        existentes.forEach { exist ->
            if (exist.fechaFin == null || exist.fechaFin.isAfter(dto.fechaInicio)) {
                if (exist.fechaInicio.isBefore(dto.fechaInicio)) {
                    // Ponemos fin el día anterior a la nueva tarifa
                    val finAnt = dto.fechaInicio.minusDays(1)
                    val updated = exist.copy(fechaFin = finAnt)
                    // HACK: JPA copy no actualiza la misma referencia directamente en hibernate a veces, pero copy crea una nueva instancia.
                    // Para actualizar de verdad en Hibernate:
                    val repoEntity = tarifaRubroRepository.findById(exist.id).get()
                    // Usar un bypass directo:
                    val field = repoEntity.javaClass.getDeclaredField("fechaFin")
                    field.isAccessible = true
                    field.set(repoEntity, finAnt)
                    tarifaRubroRepository.save(repoEntity)
                    logger.info("Cerrando tarifa anterior ID ${exist.id} al ${finAnt}")
                } else if (exist.fechaInicio == dto.fechaInicio) {
                    throw BusinessException("Ya existe una tarifa para este rubro con la misma fecha de inicio: ${dto.fechaInicio}")
                }
            }
        }

        val entity = TarifaRubro(
            rubro = rubro,
            fechaInicio = dto.fechaInicio,
            fechaFin = dto.fechaFin,
            configJson = dto.configJson,
            creadoPor = creadoPor,
            creadoEn = LocalDateTime.now()
        )

        logger.info("Creando tarifa para rubro $rubroId desde ${dto.fechaInicio} (creado por ${creadoPor.email})")
        val saved = tarifaRubroRepository.save(entity)
        return toTarifaDto(saved)
    }

    private fun toRubroDto(entity: Rubro): RubroDto {
        return RubroDto(
            id = entity.id,
            nombre = entity.nombre,
            descripcion = entity.descripcion,
            tipo = entity.tipo.name,
            ordenDisplay = entity.ordenDisplay,
            activo = entity.activo,
            porcentajeMora = entity.porcentajeMora
        )
    }

    private fun toTarifaDto(entity: TarifaRubro): TarifaRubroDto {
        return TarifaRubroDto(
            id = entity.id,
            rubroId = entity.rubro.id,
            fechaInicio = entity.fechaInicio,
            fechaFin = entity.fechaFin,
            configJson = entity.configJson,
            creadoPorNombre = entity.creadoPor.nombre,
            creadoEn = entity.creadoEn
        )
    }
}
