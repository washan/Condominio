package com.condominio.domain

import jakarta.persistence.*
import java.time.LocalDate

enum class EstadoPeriodo {
    ABIERTO, CERRADO
}

@Entity
@Table(name = "periodos")
data class Periodo(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    val anio: Short,

    @Column(nullable = false)
    val mes: Short,

    val fechaApertura: LocalDate = LocalDate.now(),
    var fechaCierre: LocalDate? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var estado: EstadoPeriodo = EstadoPeriodo.ABIERTO
)
