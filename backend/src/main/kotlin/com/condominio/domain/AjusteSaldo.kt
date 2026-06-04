package com.condominio.domain

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "ajustes_saldo")
data class AjusteSaldo(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unidad_id", nullable = false)
    val unidad: Unidad,

    @Column(nullable = false, precision = 12, scale = 2)
    val monto: BigDecimal,

    @Column(columnDefinition = "TEXT", nullable = false)
    val descripcion: String,

    @Column(nullable = false)
    val fechaEfectiva: LocalDate,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por_usuario_id", nullable = false)
    val creadoPor: Usuario,

    val creadoEn: LocalDateTime = LocalDateTime.now()
)
