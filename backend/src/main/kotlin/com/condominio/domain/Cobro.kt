package com.condominio.domain

import jakarta.persistence.*
import java.math.BigDecimal

enum class EstadoCobro {
    BORRADOR, EMITIDO, PAGADO, MORA
}

@Entity
@Table(name = "cobros")
data class Cobro(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "unidad_id", nullable = false)
    val unidad: Unidad,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "periodo_id", nullable = false)
    val periodo: Periodo,

    @Column(nullable = false, precision = 12, scale = 2)
    val saldoMonetarioAnterior: BigDecimal = BigDecimal.ZERO,

    @Column(nullable = false, precision = 12, scale = 2)
    var totalCobros: BigDecimal = BigDecimal.ZERO,

    @Column(nullable = false, precision = 12, scale = 2)
    var totalPagar: BigDecimal = BigDecimal.ZERO,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var estado: EstadoCobro = EstadoCobro.BORRADOR
)
