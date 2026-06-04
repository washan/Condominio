package com.condominio.domain

import jakarta.persistence.*
import java.time.LocalDateTime

@Entity
@Table(name = "estados_cuenta_pdf")
data class EstadoCuentaPdf(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cobro_id", nullable = false)
    val cobro: Cobro,

    @Column(nullable = false)
    val urlPdf: String,

    val fechaGenerado: LocalDateTime = LocalDateTime.now(),
    var enviadoWhatsapp: Boolean = false,
    var fechaEnvio: LocalDateTime? = null
)
