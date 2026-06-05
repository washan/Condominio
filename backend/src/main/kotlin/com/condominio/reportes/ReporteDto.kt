package com.condominio.reportes

import java.math.BigDecimal

data class ConsumoAnualDto(
    val unidadNumero: String,
    val propietario: String,
    val consumos: List<BigDecimal>, // 12 elementos (Ene-Dic)
    val totalAnual: BigDecimal
)

data class PeriodoMoraDto(
    val periodoId: Long,
    val periodoMes: Short,
    val periodoAnio: Short,
    val monto: BigDecimal
)

data class MorosidadDto(
    val unidadId: Long,
    val unidadNumero: String,
    val propietario: String,
    val periodosMora: List<PeriodoMoraDto>,
    val totalMora: BigDecimal
)

data class IngresoMensualDto(
    val mes: String,
    val facturado: BigDecimal,
    val recaudado: BigDecimal
)
