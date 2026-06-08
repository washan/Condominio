package com.condominio.domain

import jakarta.persistence.*
import java.math.BigDecimal

@Entity
@Table(name = "espacios_comunes")
data class EspacioComun(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    var nombre: String,

    @Column(columnDefinition = "TEXT")
    var descripcion: String? = null,

    var capacidadMaxima: Int? = null,

    @Column(nullable = false)
    var costoReserva: BigDecimal = BigDecimal.ZERO,

    var activa: Boolean = true
)
