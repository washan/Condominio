package com.condominio.cobros

import java.math.BigDecimal

data class ItemCobroDto(
    val id: Long = 0,
    val rubroId: Long?,
    val rubroNombre: String?,
    val descripcion: String,
    val cantidad: BigDecimal,
    val precioUnitario: BigDecimal,
    val subtotal: BigDecimal
)

data class CobroDto(
    val id: Long = 0,
    val unidadId: Long,
    val unidadNumero: String,
    val propietario: String,
    val periodoId: Long,
    val periodoMes: Short,
    val periodoAnio: Short,
    val saldoMonetarioAnterior: BigDecimal,
    val totalCobros: BigDecimal,
    val totalPagar: BigDecimal,
    val estado: String, // BORRADOR, EMITIDO, PAGADO, MORA
    val items: List<ItemCobroDto> = emptyList()
)
