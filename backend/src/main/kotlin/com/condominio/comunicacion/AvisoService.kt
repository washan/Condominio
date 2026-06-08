package com.condominio.comunicacion

import com.condominio.domain.Aviso
import com.condominio.exception.BusinessException
import com.condominio.repository.AvisoRepository
import com.condominio.repository.UsuarioRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class AvisoService(
    private val avisoRepository: AvisoRepository,
    private val usuarioRepository: UsuarioRepository
) {
    private val logger = LoggerFactory.getLogger(AvisoService::class.java)

    fun getAvisosVigentes(): List<AvisoDto> {
        val today = LocalDate.now()
        return avisoRepository.findVigentes(today).map { toDto(it) }
    }

    fun getAllAvisos(): List<AvisoDto> {
        return avisoRepository.findAllByOrderByFechaPublicacionDesc().map { toDto(it) }
    }

    @Transactional
    fun createAviso(dto: AvisoDto, userEmail: String): AvisoDto {
        val usuario = usuarioRepository.findByEmail(userEmail)
            .orElseThrow { BusinessException("Usuario no encontrado") }

        if (dto.titulo.isBlank()) {
            throw BusinessException("El título del aviso no puede estar vacío")
        }
        if (dto.contenido.isBlank()) {
            throw BusinessException("El contenido del aviso no puede estar vacío")
        }

        val aviso = Aviso(
            titulo = dto.titulo.trim(),
            contenido = dto.contenido.trim(),
            fechaPublicacion = LocalDateTime.now(),
            vigenteHasta = dto.vigenteHasta,
            creadoPor = usuario
        )

        logger.info("Creando aviso: '${dto.titulo}' por el usuario ${usuario.email}")
        val saved = avisoRepository.save(aviso)
        return toDto(saved)
    }

    @Transactional
    fun updateAviso(id: Long, dto: AvisoDto): AvisoDto {
        val aviso = avisoRepository.findById(id)
            .orElseThrow { BusinessException("Aviso no encontrado con id: $id") }

        if (dto.titulo.isBlank()) {
            throw BusinessException("El título del aviso no puede estar vacío")
        }
        if (dto.contenido.isBlank()) {
            throw BusinessException("El contenido del aviso no puede estar vacío")
        }

        aviso.titulo = dto.titulo.trim()
        aviso.contenido = dto.contenido.trim()
        aviso.vigenteHasta = dto.vigenteHasta

        logger.info("Actualizando aviso ID $id: '${dto.titulo}'")
        val saved = avisoRepository.save(aviso)
        return toDto(saved)
    }

    @Transactional
    fun deleteAviso(id: Long) {
        val aviso = avisoRepository.findById(id)
            .orElseThrow { BusinessException("Aviso no encontrado con id: $id") }

        logger.info("Eliminando aviso ID $id: '${aviso.titulo}'")
        avisoRepository.delete(aviso)
    }

    private fun toDto(entity: Aviso): AvisoDto {
        return AvisoDto(
            id = entity.id,
            titulo = entity.titulo,
            contenido = entity.contenido,
            fechaPublicacion = entity.fechaPublicacion,
            vigenteHasta = entity.vigenteHasta,
            creadoPorNombre = entity.creadoPor.nombre
        )
    }
}
