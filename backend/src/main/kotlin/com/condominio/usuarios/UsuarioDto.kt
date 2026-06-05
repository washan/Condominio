package com.condominio.usuarios

import java.time.LocalDateTime

data class UsuarioDto(
    val id: Long = 0,
    val nombre: String,
    val email: String,
    val password: String? = null, // Solo para creación
    val rol: String,
    val activo: Boolean = true,
    val unidadId: Long? = null,
    val creadoEn: LocalDateTime? = null,
    val ultimoAcceso: LocalDateTime? = null
)

data class ResetPasswordRequest(
    val nuevaContrasena: String
)
