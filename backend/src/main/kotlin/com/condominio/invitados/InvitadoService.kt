package com.condominio.invitados

import com.condominio.domain.EstadoInvitado
import com.condominio.domain.Invitado
import com.condominio.domain.Rol
import com.condominio.exception.BusinessException
import com.condominio.repository.CondominoRepository
import com.condominio.repository.InvitadoRepository
import com.condominio.repository.UnidadRepository
import com.condominio.repository.UsuarioRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class InvitadoService(
    private val invitadoRepository: InvitadoRepository,
    private val unidadRepository: UnidadRepository,
    private val usuarioRepository: UsuarioRepository,
    private val condominoRepository: CondominoRepository
) {
    private val logger = LoggerFactory.getLogger(InvitadoService::class.java)

    fun getInvitadosVigentes(): List<InvitadoDto> {
        return invitadoRepository.findVigentes(LocalDateTime.now()).map { toDto(it) }
    }

    fun searchInvitados(query: String): List<InvitadoDto> {
        if (query.isBlank()) {
            return getInvitadosVigentes()
        }
        return invitadoRepository.search(query.trim()).map { toDto(it) }
    }

    fun getInvitadosPorUnidad(unidadId: Long): List<InvitadoDto> {
        return invitadoRepository.findByUnidadIdOrderByFechaHoraDesdeDesc(unidadId).map { toDto(it) }
    }

    fun getInvitadosPorCondomino(email: String): List<InvitadoDto> {
        val usuario = usuarioRepository.findByEmail(email)
            .orElseThrow { BusinessException("Usuario no encontrado") }
        val condomino = condominoRepository.findByUsuarioId(usuario.id)
            .orElseThrow { BusinessException("El usuario no está asignado a ninguna vivienda") }
        return getInvitadosPorUnidad(condomino.unidad.id)
    }

    @Transactional
    fun createInvitado(dto: InvitadoDto, emailPrincipal: String): InvitadoDto {
        val usuarioPrincipal = usuarioRepository.findByEmail(emailPrincipal)
            .orElseThrow { BusinessException("Usuario no encontrado") }

        val targetUnidadId = if (usuarioPrincipal.rol == Rol.CONDOMINO) {
            val condomino = condominoRepository.findByUsuarioId(usuarioPrincipal.id)
                .orElseThrow { BusinessException("El usuario no está asignado a ninguna vivienda") }
            condomino.unidad.id
        } else {
            dto.unidadId
        }

        val unidad = unidadRepository.findById(targetUnidadId)
            .orElseThrow { BusinessException("Vivienda no encontrada con id: $targetUnidadId") }

        if (dto.nombre.isBlank()) {
            throw BusinessException("El nombre del invitado es obligatorio")
        }

        if (dto.fechaHoraDesde.isAfter(dto.fechaHoraHasta)) {
            throw BusinessException("La fecha/hora de inicio no puede ser posterior a la de fin")
        }

        val invitado = Invitado(
            unidad = unidad,
            nombre = dto.nombre.trim(),
            identificacion = dto.identificacion?.trim(),
            placaVehiculo = dto.placaVehiculo?.trim()?.uppercase(),
            fechaHoraDesde = dto.fechaHoraDesde,
            fechaHoraHasta = dto.fechaHoraHasta,
            estado = EstadoInvitado.PENDIENTE
        )

        logger.info("Registrando invitado '${dto.nombre}' para la casa ${unidad.numero} por el usuario ${usuarioPrincipal.email}")
        val saved = invitadoRepository.save(invitado)
        return toDto(saved)
    }

    @Transactional
    fun updateEstado(id: Long, nuevoEstadoStr: String, emailPrincipal: String): InvitadoDto {
        val usuarioPrincipal = usuarioRepository.findByEmail(emailPrincipal)
            .orElseThrow { BusinessException("Usuario no encontrado") }

        val invitado = invitadoRepository.findById(id)
            .orElseThrow { BusinessException("Invitado no encontrado con id: $id") }

        val nuevoEstado = try {
            EstadoInvitado.valueOf(nuevoEstadoStr.uppercase())
        } catch (e: Exception) {
            throw BusinessException("Estado de invitado inválido: $nuevoEstadoStr")
        }

        // Reglas de negocio sobre estados:
        // Condóminos solo pueden cancelar sus propios invitados
        if (usuarioPrincipal.rol == Rol.CONDOMINO) {
            val condomino = condominoRepository.findByUsuarioId(usuarioPrincipal.id)
                .orElseThrow { BusinessException("El usuario no está asignado a ninguna vivienda") }
            if (invitado.unidad.id != condomino.unidad.id) {
                throw BusinessException("No tiene permisos para modificar este invitado")
            }
            if (nuevoEstado != EstadoInvitado.CANCELADO) {
                throw BusinessException("Como residente solo puede cancelar el acceso de sus invitados")
            }
        }

        // El guardia y admin pueden marcar ingresos y salidas
        if (usuarioPrincipal.rol == Rol.GUARDIA && nuevoEstado == EstadoInvitado.CANCELADO) {
            throw BusinessException("Los oficiales de seguridad no pueden cancelar invitaciones")
        }

        logger.info("Cambiando estado de invitado ID $id a $nuevoEstado por el usuario ${usuarioPrincipal.email}")
        invitado.estado = nuevoEstado
        val saved = invitadoRepository.save(invitado)
        return toDto(saved)
    }

    private fun toDto(entity: Invitado): InvitadoDto {
        return InvitadoDto(
            id = entity.id,
            unidadId = entity.unidad.id,
            unidadNumero = entity.unidad.numero,
            nombre = entity.nombre,
            identificacion = entity.identificacion,
            placaVehiculo = entity.placaVehiculo,
            fechaHoraDesde = entity.fechaHoraDesde,
            fechaHoraHasta = entity.fechaHoraHasta,
            estado = entity.estado.name,
            creadoEn = entity.creadoEn
        )
    }
}
