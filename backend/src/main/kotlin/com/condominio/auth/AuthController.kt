package com.condominio.auth

import com.condominio.exception.BusinessException
import com.condominio.repository.UsuarioRepository
import com.condominio.security.JwtService
import jakarta.validation.Valid
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.security.authentication.AuthenticationManager
import org.springframework.security.authentication.BadCredentialsException
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.userdetails.UserDetailsService
import org.springframework.web.bind.annotation.*
import java.time.LocalDateTime

@RestController
@RequestMapping("/api/auth")
class AuthController(
    private val authenticationManager: AuthenticationManager,
    private val jwtService: JwtService,
    private val userDetailsService: UserDetailsService,
    private val usuarioRepository: UsuarioRepository
) {

    private val logger = LoggerFactory.getLogger(AuthController::class.java)

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): ResponseEntity<LoginResponse> {
        val usuario = usuarioRepository.findByEmail(request.email)
            .orElseThrow { BusinessException("Credenciales inválidas") }

        // Check if user is active
        if (!usuario.activo) {
            throw BusinessException("Cuenta desactivada. Contacte al administrador.")
        }

        // Check if account is locked
        usuario.bloqueadoHasta?.let { blockedUntil ->
            if (blockedUntil.isAfter(LocalDateTime.now())) {
                throw BusinessException("Cuenta bloqueada hasta ${blockedUntil}. Intente más tarde.")
            }
        }

        try {
            authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken(request.email, request.password)
            )
        } catch (ex: BadCredentialsException) {
            // Increment failed attempts
            val intentosFallidos = usuario.intentosFallidos + 1
            if (intentosFallidos >= 5) {
                usuario.intentosFallidos = intentosFallidos
                usuario.bloqueadoHasta = LocalDateTime.now().plusMinutes(30)
                usuarioRepository.save(usuario)
                logger.warn("Usuario bloqueado por intentos fallidos: ${usuario.email}")
                throw BusinessException("Cuenta bloqueada por 30 minutos por múltiples intentos fallidos.")
            } else {
                usuario.intentosFallidos = intentosFallidos
                usuarioRepository.save(usuario)
            }
            throw BusinessException("Credenciales inválidas")
        }

        // Success - reset failed attempts and update last access
        usuario.intentosFallidos = 0
        usuario.bloqueadoHasta = null
        usuario.ultimoAcceso = LocalDateTime.now()
        usuarioRepository.save(usuario)

        val userDetails = userDetailsService.loadUserByUsername(request.email)
        val accessToken = jwtService.generateToken(userDetails)
        val refreshToken = jwtService.generateRefreshToken(userDetails)

        logger.info("Login exitoso: ${usuario.email}")

        return ResponseEntity.ok(
            LoginResponse(
                accessToken = accessToken,
                refreshToken = refreshToken,
                rol = usuario.rol.name,
                nombre = usuario.nombre,
                email = usuario.email
            )
        )
    }

    @PostMapping("/refresh")
    fun refresh(@Valid @RequestBody request: RefreshRequest): ResponseEntity<RefreshResponse> {
        val userEmail = try {
            jwtService.extractUsername(request.refreshToken)
        } catch (e: Exception) {
            throw BusinessException("Refresh token inválido o expirado")
        }

        val userDetails = userDetailsService.loadUserByUsername(userEmail)

        if (!jwtService.isTokenValid(request.refreshToken, userDetails)) {
            throw BusinessException("Refresh token inválido o expirado")
        }

        val newAccessToken = jwtService.generateToken(userDetails)
        return ResponseEntity.ok(RefreshResponse(accessToken = newAccessToken))
    }

    @PostMapping("/logout")
    fun logout(): ResponseEntity<Map<String, String>> {
        // Stateless JWT - client is responsible for discarding the token
        return ResponseEntity.ok(mapOf("message" to "Sesión cerrada exitosamente"))
    }
}
