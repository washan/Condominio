package com.condominio.domain

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "auditoria")
data class Auditoria(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    val usuario: Usuario?,

    @Column(nullable = false)
    val accion: String,

    @Column(nullable = false)
    val entidad: String,

    val entidadId: String? = null,

    @Column(columnDefinition = "jsonb")
    val valorAnterior: String? = null,

    @Column(columnDefinition = "jsonb")
    val valorNuevo: String? = null,

    val ip: String? = null,
    val timestamp: LocalDateTime = LocalDateTime.now()
)
