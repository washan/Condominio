package com.condominio.lecturas

import java.math.BigDecimal
import java.time.LocalDate

data class LecturaDto(
    val id: Long = 0,
    val unidadId: Long,
    val unidadNumero: String,
    val propietario: String,
    val lecturaAnterior: BigDecimal,
    val lecturaActual: BigDecimal? = null,
    val consumo: BigDecimal? = null,
    val fecha: LocalDate? = null,
    val fotoUrl: String? = null,
    val estado: String, // PENDIENTE, COMPLETADA, ERROR
    val observaciones: String? = null
)

data class LecturaInicialDto(
    val unidadId: Long,
    val lecturaInicial: BigDecimal,
    val fecha: LocalDate
)

data class PeriodoDto(
    val id: Long = 0,
    val anio: Short,
    val mes: Short,
    val fechaApertura: LocalDate,
    val fechaCierre: LocalDate? = null,
    val estado: String // ABIERTO, CERRADO
)
