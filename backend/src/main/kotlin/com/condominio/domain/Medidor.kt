package com.condominio.domain

import jakarta.persistence.*
import java.time.LocalDate

@Entity
@Table(name = "medidores")
data class Medidor(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unidad_id", nullable = false)
    val unidad: Unidad,

    @Column(nullable = false)
    val codigoInterno: String,

    var activo: Boolean = true,
    val fechaInstalacion: LocalDate = LocalDate.now()
)
