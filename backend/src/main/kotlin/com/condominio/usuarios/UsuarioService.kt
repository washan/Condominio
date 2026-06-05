package com.condominio.usuarios

import com.condominio.domain.*
import com.condominio.exception.BusinessException
import com.condominio.repository.*
import org.slf4j.LoggerFactory
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDateTime

@Service
class UsuarioService(
    private val usuarioRepository: UsuarioRepository,
    private val passwordEncoder: PasswordEncoder,
    private val condominoRepository: CondominoRepository,
    private val unidadRepository: UnidadRepository
) {

    private val logger = LoggerFactory.getLogger(UsuarioService::class.java)

    fun getUsuarios(): List<UsuarioDto> {
        return usuarioRepository.findAll().map { toDto(it) }
    }

    fun getUsuario(id: Long): UsuarioDto {
        val entity = usuarioRepository.findById(id)
            .orElseThrow { BusinessException("Usuario no encontrado con id: $id") }
        return toDto(entity)
    }

    @Transactional
    fun createUsuario(dto: UsuarioDto): UsuarioDto {
        if (usuarioRepository.existsByEmail(dto.email)) {
            throw BusinessException("Ya existe un usuario registrado con el correo: ${dto.email}")
        }
        if (dto.password.isNullOrBlank()) {
            throw BusinessException("La contraseña es requerida para crear un usuario")
        }

        val rolEnum = try {
            Rol.valueOf(dto.rol.uppercase())
        } catch (e: Exception) {
            throw BusinessException("Rol inválido: ${dto.rol}. Valores permitidos: ADMIN, TECNICO, CONDOMINO, GUARDIA")
        }

        val entity = Usuario(
            nombre = dto.nombre,
            email = dto.email,
            passwordHash = passwordEncoder.encode(dto.password),
            rol = rolEnum,
            activo = dto.activo,
            creadoEn = LocalDateTime.now()
        )

        logger.info("Creando nuevo usuario: ${dto.email} (rol: ${rolEnum})")
        val saved = usuarioRepository.save(entity)

        // Si el rol es CONDOMINO, asociarle la unidad (casa) si se especificó
        if (rolEnum == Rol.CONDOMINO && dto.unidadId != null) {
            val unidad = unidadRepository.findById(dto.unidadId)
                .orElseThrow { BusinessException("Unidad habitacional no encontrada con id: ${dto.unidadId}") }
            val condomino = Condomino(
                usuario = saved,
                unidad = unidad
            )
            condominoRepository.save(condomino)
        }

        return toDto(saved)
    }

    @Transactional
    fun updateUsuario(id: Long, dto: UsuarioDto): UsuarioDto {
        val entity = usuarioRepository.findById(id)
            .orElseThrow { BusinessException("Usuario no encontrado con id: $id") }

        if (entity.email != dto.email) {
            val existing = usuarioRepository.findByEmail(dto.email)
            if (existing.isPresent && existing.get().id != id) {
                throw BusinessException("Ya existe otro usuario con el correo: ${dto.email}")
            }
            entity.email = dto.email
        }

        val rolEnum = try {
            Rol.valueOf(dto.rol.uppercase())
        } catch (e: Exception) {
            throw BusinessException("Rol inválido: ${dto.rol}")
        }

        entity.nombre = dto.nombre
        entity.rol = rolEnum
        entity.activo = dto.activo

        // Si se provee una contraseña en la actualización, la cambiamos
        if (!dto.password.isNullOrBlank()) {
            entity.passwordHash = passwordEncoder.encode(dto.password)
        }

        logger.info("Actualizando usuario ID $id: ${dto.email}")
        val saved = usuarioRepository.save(entity)

        // Gestionar asociación con Unidad (Condomino)
        if (rolEnum == Rol.CONDOMINO) {
            if (dto.unidadId != null) {
                val unidad = unidadRepository.findById(dto.unidadId)
                    .orElseThrow { BusinessException("Unidad habitacional no encontrada con id: ${dto.unidadId}") }
                
                val existingCondomino = condominoRepository.findByUsuarioId(saved.id)
                if (existingCondomino.isPresent) {
                    val cond = existingCondomino.get()
                    cond.unidad = unidad
                    condominoRepository.save(cond)
                } else {
                    val condomino = Condomino(
                        usuario = saved,
                        unidad = unidad
                    )
                    condominoRepository.save(condomino)
                }
            }
        } else {
            // Si el rol ya no es CONDOMINO, eliminar cualquier asociación anterior
            val existingCondomino = condominoRepository.findByUsuarioId(saved.id)
            if (existingCondomino.isPresent) {
                condominoRepository.delete(existingCondomino.get())
            }
        }

        return toDto(saved)
    }

    @Transactional
    fun resetPassword(id: Long, nuevaContrasena: String) {
        val entity = usuarioRepository.findById(id)
            .orElseThrow { BusinessException("Usuario no encontrado con id: $id") }

        if (nuevaContrasena.isBlank()) {
            throw BusinessException("La contraseña no puede estar vacía")
        }

        logger.info("Reseteando contraseña para usuario: ${entity.email}")
        entity.passwordHash = passwordEncoder.encode(nuevaContrasena)
        entity.intentosFallidos = 0
        entity.bloqueadoHasta = null
        usuarioRepository.save(entity)
    }

    private fun toDto(entity: Usuario): UsuarioDto {
        val unidadId = if (entity.rol == Rol.CONDOMINO) {
            condominoRepository.findByUsuarioId(entity.id).map { it.unidad.id }.orElse(null)
        } else {
            null
        }
        return UsuarioDto(
            id = entity.id,
            nombre = entity.nombre,
            email = entity.email,
            rol = entity.rol.name,
            activo = entity.activo,
            unidadId = unidadId,
            creadoEn = entity.creadoEn,
            ultimoAcceso = entity.ultimoAcceso
        )
    }
}
