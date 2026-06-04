package com.condominio.domain

import jakarta.persistence.*
import java.math.BigDecimal

@Entity
@Table(name = "items_cobro")
data class ItemCobro(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cobro_id", nullable = false)
    val cobro: Cobro,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rubro_id")
    val rubro: Rubro? = null,

    @Column(nullable = false)
    val descripcion: String,

    @Column(nullable = false, precision = 12, scale = 3)
    val cantidad: BigDecimal = BigDecimal.ONE,

    @Column(nullable = false, precision = 12, scale = 2)
    val precioUnitario: BigDecimal,

    @Column(nullable = false, precision = 12, scale = 2)
    val subtotal: BigDecimal
)
