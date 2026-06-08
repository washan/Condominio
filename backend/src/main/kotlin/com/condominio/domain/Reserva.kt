package com.condominio.domain

import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

enum class EstadoReserva {
    PENDIENTE, APROBADA, RECHAZADA, CANCELADA
}

@Entity
@Table(name = "reservas")
data class Reserva(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "espacio_id", nullable = false)
    val espacio: EspacioComun,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unidad_id", nullable = false)
    val unidad: Unidad,

    @Column(nullable = false)
    var fechaReserva: LocalDate,

    @Column(nullable = false)
    var horaInicio: LocalTime,

    @Column(nullable = false)
    var horaFin: LocalTime,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var estado: EstadoReserva = EstadoReserva.PENDIENTE,

    val creadoEn: LocalDateTime = LocalDateTime.now()
)
