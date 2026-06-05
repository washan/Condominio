package com.condominio.unidades

import com.condominio.domain.Medidor
import com.condominio.domain.Unidad
import com.condominio.exception.BusinessException
import com.condominio.repository.MedidorRepository
import com.condominio.repository.UnidadRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate

@Service
class UnidadService(
    private val unidadRepository: UnidadRepository,
    private val medidorRepository: MedidorRepository
) {

    private val logger = LoggerFactory.getLogger(UnidadService::class.java)

    fun getUnidades(soloActivas: Boolean = false): List<UnidadDto> {
        val list = if (soloActivas) {
            unidadRepository.findAllByActivaTrue()
        } else {
            unidadRepository.findAll()
        }
        return list.map { toDto(it) }
    }

    fun getUnidad(id: Long): UnidadDto {
        val entity = unidadRepository.findById(id)
            .orElseThrow { BusinessException("Unidad no encontrada con id: $id") }
        return toDto(entity)
    }

    @Transactional
    fun createUnidad(dto: UnidadDto): UnidadDto {
        if (unidadRepository.findByNumero(dto.numero).isPresent) {
            throw BusinessException("Ya existe una unidad con el número: ${dto.numero}")
        }

        val entity = Unidad(
            numero = dto.numero,
            nombrePropietario = dto.propietario,
            email = dto.email,
            telefono = dto.telefono,
            activa = dto.activo
        )

        logger.info("Creando nueva unidad: ${dto.numero}")
        val saved = unidadRepository.save(entity)

        // Crear medidor por defecto para esta unidad
        val medidor = Medidor(
            unidad = saved,
            codigoInterno = "MED-${saved.numero}",
            activo = true,
            fechaInstalacion = LocalDate.now()
        )
        medidorRepository.save(medidor)

        return toDto(saved)
    }

    @Transactional
    fun updateUnidad(id: Long, dto: UnidadDto): UnidadDto {
        val entity = unidadRepository.findById(id)
            .orElseThrow { BusinessException("Unidad no encontrada con id: $id") }

        // Check if number changed and if it conflicts
        if (entity.numero != dto.numero) {
            val existing = unidadRepository.findByNumero(dto.numero)
            if (existing.isPresent && existing.get().id != id) {
                throw BusinessException("Ya existe otra unidad con el número: ${dto.numero}")
            }
            entity.numero = dto.numero
        }

        entity.nombrePropietario = dto.propietario
        entity.email = dto.email
        entity.telefono = dto.telefono
        entity.activa = dto.activo

        logger.info("Actualizando unidad ID $id: ${dto.numero}")
        val saved = unidadRepository.save(entity)
        return toDto(saved)
    }

    private fun toDto(entity: Unidad): UnidadDto {
        return UnidadDto(
            id = entity.id,
            numero = entity.numero,
            propietario = entity.nombrePropietario,
            email = entity.email,
            telefono = entity.telefono,
            activo = entity.activa
        )
    }
}
