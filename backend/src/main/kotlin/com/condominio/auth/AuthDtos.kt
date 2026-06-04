package com.condominio.auth

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank

data class LoginRequest(
    @field:NotBlank(message = "El email es requerido")
    @field:Email(message = "Formato de email inválido")
    val email: String,

    @field:NotBlank(message = "La contraseña es requerida")
    val password: String
)

data class LoginResponse(
    val accessToken: String,
    val refreshToken: String,
    val rol: String,
    val nombre: String,
    val email: String
)

data class RefreshRequest(
    @field:NotBlank(message = "El refresh token es requerido")
    val refreshToken: String
)

data class RefreshResponse(
    val accessToken: String
)
