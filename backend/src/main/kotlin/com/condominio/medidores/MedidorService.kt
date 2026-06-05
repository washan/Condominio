package com.condominio.medidores

import com.condominio.domain.Medidor
import com.condominio.exception.BusinessException
import com.condominio.repository.MedidorRepository
import com.condominio.repository.UnidadRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class MedidorService(
    private val medidorRepository: MedidorRepository,
    private val unidadRepository: UnidadRepository
) {

    private val logger = LoggerFactory.getLogger(MedidorService::class.java)

    fun getMedidoresPorUnidad(unidadId: Long): List<MedidorDto> {
        return medidorRepository.findByUnidadIdAndActivoTrue(unidadId).map { toDto(it) }
    }

    @Transactional
    fun createMedidor(dto: MedidorDto): MedidorDto {
        val unidad = unidadRepository.findById(dto.unidadId)
            .orElseThrow { BusinessException("Unidad no encontrada con id: ${dto.unidadId}") }

        val entity = Medidor(
            unidad = unidad,
            codigoInterno = dto.codigoInterno,
            activo = dto.activo,
            fechaInstalacion = dto.fechaInstalacion
        )

        logger.info("Creando medidor ${dto.codigoInterno} para la unidad ${unidad.numero}")
        val saved = medidorRepository.save(entity)
        return toDto(saved)
    }

    @Transactional
    fun updateMedidor(id: Long, dto: MedidorDto): MedidorDto {
        val entity = medidorRepository.findById(id)
            .orElseThrow { BusinessException("Medidor no encontrado con id: $id") }

        entity.activo = dto.activo
        // No permitimos cambiar la unidad una vez creado, solo el código y estado
        logger.info("Actualizando medidor ID $id (código: ${dto.codigoInterno}, activo: ${dto.activo})")
        val saved = medidorRepository.save(entity)
        return toDto(saved)
    }

    private fun toDto(entity: Medidor): MedidorDto {
        return MedidorDto(
            id = entity.id,
            unidadId = entity.unidad.id,
            codigoInterno = entity.codigoInterno,
            activo = entity.activo,
            fechaInstalacion = entity.fechaInstalacion
        )
    }
}
