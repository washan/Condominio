package com.condominio.domain

import jakarta.persistence.*
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

enum class TipoLectura {
    INICIAL, REGULAR
}

@Entity
@Table(name = "lecturas_medidor")
data class LecturaMedidor(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "medidor_id", nullable = false)
    val medidor: Medidor,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "periodo_id")
    val periodo: Periodo? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val tipo: TipoLectura = TipoLectura.REGULAR,

    @Column(nullable = false)
    val fechaLectura: LocalDate,

    @Column(nullable = false, precision = 12, scale = 3)
    val valorM3: BigDecimal,

    @Column(precision = 12, scale = 3)
    val valorOcr: BigDecimal? = null,

    val fotoUrl: String? = null,

    @Column(precision = 12, scale = 3)
    var consumoM3: BigDecimal? = null,

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tomada_por_usuario_id")
    val tomadaPor: Usuario? = null,

    val subidaEn: LocalDateTime = LocalDateTime.now()
)
