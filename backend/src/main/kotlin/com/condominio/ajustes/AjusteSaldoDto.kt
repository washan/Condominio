package com.condominio.ajustes

import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

data class AjusteSaldoDto(
    val id: Long = 0,
    val unidadId: Long,
    val unidadNumero: String? = null,
    val monto: BigDecimal, // Positivo = crédito, Negativo = deuda
    val descripcion: String,
    val fechaEfectiva: LocalDate,
    val creadoPorNombre: String? = null,
    val creadoEn: LocalDateTime? = null
)
