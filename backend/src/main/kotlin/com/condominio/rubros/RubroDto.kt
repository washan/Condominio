package com.condominio.rubros

import java.time.LocalDate
import java.time.LocalDateTime

data class RubroDto(
    val id: Long = 0,
    val nombre: String,
    val descripcion: String? = null,
    val tipo: String, // CONSUMO, FIJO, VARIABLE, PORCENTAJE
    val ordenDisplay: Short = 0,
    val activo: Boolean = true,
    val porcentajeMora: java.math.BigDecimal = java.math.BigDecimal.ZERO
)

data class TarifaRubroDto(
    val id: Long = 0,
    val rubroId: Long,
    val fechaInicio: LocalDate,
    val fechaFin: LocalDate? = null,
    val configJson: String, // JSON string specifying rates
    val creadoPorNombre: String? = null,
    val creadoEn: LocalDateTime? = null
)
