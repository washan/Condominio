package com.condominio.domain

import jakarta.persistence.*
import java.time.LocalDateTime

enum class EstadoInvitado {
    PENDIENTE, INGRESADO, SALIDO, CANCELADO
}

@Entity
@Table(name = "invitados")
data class Invitado(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unidad_id", nullable = false)
    val unidad: Unidad,

    @Column(nullable = false)
    var nombre: String,

    var identificacion: String? = null,

    var placaVehiculo: String? = null,

    @Column(nullable = false)
    var fechaHoraDesde: LocalDateTime,

    @Column(nullable = false)
    var fechaHoraHasta: LocalDateTime,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var estado: EstadoInvitado = EstadoInvitado.PENDIENTE,

    val creadoEn: LocalDateTime = LocalDateTime.now()
)
