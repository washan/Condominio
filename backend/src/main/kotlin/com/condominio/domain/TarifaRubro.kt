package com.condominio.domain

import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "tarifas_rubro")
data class TarifaRubro(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rubro_id", nullable = false)
    val rubro: Rubro,

    @Column(nullable = false)
    val fechaInicio: LocalDate,

    val fechaFin: LocalDate? = null,

    @Column(name = "config_json", columnDefinition = "jsonb", nullable = false)
    val configJson: String,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por_usuario_id", nullable = false)
    val creadoPor: Usuario,

    val creadoEn: LocalDateTime = LocalDateTime.now()
)
