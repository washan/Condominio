package com.condominio.reservas

import java.math.BigDecimal

data class EspacioComunDto(
    val id: Long = 0,
    val nombre: String,
    val descripcion: String? = null,
    val capacidadMaxima: Int? = null,
    val costoReserva: BigDecimal = BigDecimal.ZERO,
    val activa: Boolean = true
)
