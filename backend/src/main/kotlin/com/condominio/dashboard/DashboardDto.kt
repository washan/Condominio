package com.condominio.dashboard

import java.math.BigDecimal

data class ResumenMesDto(
    val totalUnidades: Int,
    val lecturasCompletadas: Int,
    val lecturasPendientes: Int,
    val cobrosEmitidos: Int,
    val totalFacturado: BigDecimal,
    val progresoRecorrido: Int
)

data class ConsumoHistoricoDto(
    val mes: String,
    val consumoTotal: BigDecimal,
    val promedioPorUnidad: BigDecimal
)

data class TopConsumidorDto(
    val unidadNumero: String,
    val propietario: String,
    val consumo: BigDecimal
)

data class AlertaDashboardDto(
    val id: Long,
    val tipo: String, // CONSUMO_ALTO, LECTURA_PENDIENTE, MORA
    val unidadNumero: String,
    val propietario: String,
    val descripcion: String,
    val severidad: String // HIGH, MEDIUM, LOW
)
