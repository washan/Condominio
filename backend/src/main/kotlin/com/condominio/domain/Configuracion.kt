package com.condominio.domain

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "configuracion")
data class Configuracion(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(unique = true, nullable = false)
    val clave: String,

    @Column(columnDefinition = "TEXT")
    var valor: String?,

    val descripcion: String? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "modificado_por_usuario_id")
    var modificadoPor: Usuario? = null,

    @Column(name = "modificado_en")
    var modificadoEn: LocalDateTime = LocalDateTime.now()
)
