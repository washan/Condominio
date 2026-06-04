package com.condominio.domain

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "unidades")
data class Unidad(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    val numero: String,

    var nombrePropietario: String,
    var empresa: String? = null,
    var email: String? = null,
    var telefono: String? = null,
    var activa: Boolean = true,
    val creadoEn: LocalDateTime = LocalDateTime.now()
)
