package com.condominio.domain

import jakarta.persistence.*

enum class TipoRubro {
    CONSUMO, FIJO, VARIABLE, PORCENTAJE
}

@Entity
@Table(name = "rubros")
data class Rubro(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    var nombre: String,

    var descripcion: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val tipo: TipoRubro,

    var ordenDisplay: Short = 0,
    var activo: Boolean = true
)
