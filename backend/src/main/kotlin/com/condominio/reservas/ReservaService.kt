package com.condominio.reservas

import com.condominio.domain.EstadoReserva
import com.condominio.domain.Reserva
import com.condominio.domain.EspacioComun
import com.condominio.domain.Rol
import com.condominio.exception.BusinessException
import com.condominio.repository.CondominoRepository
import com.condominio.repository.EspacioComunRepository
import com.condominio.repository.ReservaRepository
import com.condominio.repository.UnidadRepository
import com.condominio.repository.UsuarioRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

@Service
class ReservaService(
    private val reservaRepository: ReservaRepository,
    private val espacioComunRepository: EspacioComunRepository,
    private val unidadRepository: UnidadRepository,
    private val usuarioRepository: UsuarioRepository,
    private val condominoRepository: CondominoRepository
) {
    private val logger = LoggerFactory.getLogger(ReservaService::class.java)

    fun getEspaciosActivos(): List<EspacioComunDto> {
        return espacioComunRepository.findAllByActivaTrue().map { toDto(it) }
    }

    fun getAllEspacios(): List<EspacioComunDto> {
        return espacioComunRepository.findAll().map { toDto(it) }
    }

    fun getAllReservas(): List<ReservaDto> {
        return reservaRepository.findAllOrderByFechaReservaDescHoraInicioDesc().map { toDto(it) }
    }

    fun getReservasPorUnidad(unidadId: Long): List<ReservaDto> {
        return reservaRepository.findByUnidadIdOrderByFechaReservaDescHoraInicioDesc(unidadId).map { toDto(it) }
    }

    fun getReservasPorCondomino(email: String): List<ReservaDto> {
        val usuario = usuarioRepository.findByEmail(email)
            .orElseThrow { BusinessException("Usuario no encontrado") }
        val condomino = condominoRepository.findByUsuarioId(usuario.id)
            .orElseThrow { BusinessException("El usuario no está asignado a ninguna vivienda") }
        return getReservasPorUnidad(condomino.unidad.id)
    }

    @Transactional
    fun createReserva(dto: ReservaDto, emailPrincipal: String): ReservaDto {
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

        val espacio = espacioComunRepository.findById(dto.espacioId)
            .orElseThrow { BusinessException("Espacio común no encontrado con id: ${dto.espacioId}") }

        if (!espacio.activa) {
            throw BusinessException("Este espacio común no está disponible actualmente")
        }

        if (dto.fechaReserva.isBefore(LocalDate.now())) {
            throw BusinessException("No se pueden hacer reservaciones para fechas pasadas")
        }

        if (dto.horaInicio.isAfter(dto.horaFin) || dto.horaInicio == dto.horaFin) {
            throw BusinessException("La hora de inicio debe ser anterior a la hora de finalización")
        }

        // Validar cruce de horario (reservaciones superpuestas de ese mismo día y espacio)
        val activas = reservaRepository.findByEspacioIdAndFechaReservaAndEstadoIn(
            espacio.id,
            dto.fechaReserva,
            listOf(EstadoReserva.PENDIENTE, EstadoReserva.APROBADA)
        )

        val tieneSuperposicion = activas.any { existing ->
            dto.horaInicio.isBefore(existing.horaFin) && dto.horaFin.isAfter(existing.horaInicio)
        }

        if (tieneSuperposicion) {
            throw BusinessException("El espacio ya está reservado en ese rango de horario por otro condómino")
        }

        val reserva = Reserva(
            espacio = espacio,
            unidad = unidad,
            fechaReserva = dto.fechaReserva,
            horaInicio = dto.horaInicio,
            horaFin = dto.horaFin,
            estado = if (usuarioPrincipal.rol == Rol.ADMIN) EstadoReserva.APROBADA else EstadoReserva.PENDIENTE
        )

        logger.info("Creando reservación para casa ${unidad.numero} en ${espacio.nombre} el ${dto.fechaReserva}")
        val saved = reservaRepository.save(reserva)
        return toDto(saved)
    }

    @Transactional
    fun updateEstado(id: Long, nuevoEstadoStr: String, emailPrincipal: String): ReservaDto {
        val usuarioPrincipal = usuarioRepository.findByEmail(emailPrincipal)
            .orElseThrow { BusinessException("Usuario no encontrado") }

        val reserva = reservaRepository.findById(id)
            .orElseThrow { BusinessException("Reservación no encontrada con id: $id") }

        val nuevoEstado = try {
            EstadoReserva.valueOf(nuevoEstadoStr.uppercase())
        } catch (e: Exception) {
            throw BusinessException("Estado de reservación inválido: $nuevoEstadoStr")
        }

        // Reglas de negocio para cambios de estado:
        if (usuarioPrincipal.rol == Rol.CONDOMINO) {
            val condomino = condominoRepository.findByUsuarioId(usuarioPrincipal.id)
                .orElseThrow { BusinessException("El usuario no está asignado a ninguna vivienda") }
            if (reserva.unidad.id != condomino.unidad.id) {
                throw BusinessException("No tiene permisos para modificar esta reservación")
            }
            if (nuevoEstado != EstadoReserva.CANCELADA) {
                throw BusinessException("Como residente solo puede cancelar sus reservaciones")
            }
        }

        logger.info("Cambiando estado de reservación ID $id a $nuevoEstado por el usuario ${usuarioPrincipal.email}")
        reserva.estado = nuevoEstado
        val saved = reservaRepository.save(reserva)
        return toDto(saved)
    }

    @Transactional
    fun createEspacio(dto: EspacioComunDto): EspacioComunDto {
        if (dto.nombre.isBlank()) {
            throw BusinessException("El nombre del espacio común no puede estar vacío")
        }
        val espacio = EspacioComun(
            nombre = dto.nombre.trim(),
            descripcion = dto.descripcion?.trim(),
            capacidadMaxima = dto.capacidadMaxima,
            costoReserva = dto.costoReserva,
            activa = dto.activa
        )
        logger.info("Creando nuevo espacio común: ${espacio.nombre}")
        val saved = espacioComunRepository.save(espacio)
        return toDto(saved)
    }

    @Transactional
    fun updateEspacio(id: Long, dto: EspacioComunDto): EspacioComunDto {
        val espacio = espacioComunRepository.findById(id)
            .orElseThrow { BusinessException("Espacio común no encontrado con id: $id") }

        if (dto.nombre.isBlank()) {
            throw BusinessException("El nombre del espacio común no puede estar vacío")
        }

        logger.info("Actualizando espacio común ID $id: ${dto.nombre}")
        val updated = espacio.copy(
            nombre = dto.nombre.trim(),
            descripcion = dto.descripcion?.trim(),
            capacidadMaxima = dto.capacidadMaxima,
            costoReserva = dto.costoReserva,
            activa = dto.activa
        )
        
        val saved = espacioComunRepository.save(updated)
        return toDto(saved)
    }

    private fun toDto(entity: Reserva): ReservaDto {
        return ReservaDto(
            id = entity.id,
            espacioId = entity.espacio.id,
            espacioNombre = entity.espacio.nombre,
            unidadId = entity.unidad.id,
            unidadNumero = entity.unidad.numero,
            fechaReserva = entity.fechaReserva,
            horaInicio = entity.horaInicio,
            horaFin = entity.horaFin,
            estado = entity.estado.name,
            creadoEn = entity.creadoEn
        )
    }

    private fun toDto(entity: EspacioComun): EspacioComunDto {
        return EspacioComunDto(
            id = entity.id,
            nombre = entity.nombre,
            descripcion = entity.descripcion,
            capacidadMaxima = entity.capacidadMaxima,
            costoReserva = entity.costoReserva,
            activa = entity.activa
        )
    }
}
