package com.condominio.domain

import jakarta.persistence.*
import java.time.LocalDate
import java.time.LocalDateTime

@Entity
@Table(name = "avisos")
data class Aviso(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    var titulo: String,

    @Column(columnDefinition = "TEXT", nullable = false)
    var contenido: String,

    val fechaPublicacion: LocalDateTime = LocalDateTime.now(),

    var vigenteHasta: LocalDate? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "creado_por_usuario_id", nullable = false)
    val creadoPor: Usuario
)
