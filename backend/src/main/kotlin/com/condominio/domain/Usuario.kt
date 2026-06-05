package com.condominio.domain

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "usuarios")
data class Usuario(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    var nombre: String,

    @Column(unique = true, nullable = false)
    var email: String,

    @Column(name = "password_bcrypt", nullable = false)
    var passwordHash: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var rol: Rol,

    var activo: Boolean = true,
    var intentosFallidos: Int = 0,
    var bloqueadoHasta: LocalDateTime? = null,
    val creadoEn: LocalDateTime = LocalDateTime.now(),
    var ultimoAcceso: LocalDateTime? = null
)

enum class Rol {
    ADMIN, TECNICO, CONDOMINO, GUARDIA
}
