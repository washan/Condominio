package com.condominio.usuarios

import com.condominio.exception.BusinessException
import com.condominio.repository.UsuarioRepository
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

data class ChangeOwnPasswordRequest(
    val contrasenaActual: String,
    val nuevaContrasena: String
)

@RestController
@RequestMapping("/api/usuarios/change-password")
class ProfileController(
    private val usuarioRepository: UsuarioRepository,
    private val passwordEncoder: PasswordEncoder
) {
    private val logger = LoggerFactory.getLogger(ProfileController::class.java)

    @PutMapping
    fun changeOwnPassword(
        @AuthenticationPrincipal userDetails: UserDetails,
        @RequestBody request: ChangeOwnPasswordRequest
    ): ResponseEntity<Map<String, String>> {
        val usuario = usuarioRepository.findByEmail(userDetails.username)
            .orElseThrow { BusinessException("Usuario no encontrado") }

        if (!passwordEncoder.matches(request.contrasenaActual, usuario.passwordHash)) {
            throw BusinessException("La contraseña actual es incorrecta")
        }

        if (request.nuevaContrasena.isBlank()) {
            throw BusinessException("La nueva contraseña no puede estar vacía")
        }

        usuario.passwordHash = passwordEncoder.encode(request.nuevaContrasena)
        usuarioRepository.save(usuario)

        logger.info("El usuario ${usuario.email} cambió su contraseña exitosamente")

        return ResponseEntity.ok(mapOf("message" to "Contraseña cambiada exitosamente"))
    }
}
