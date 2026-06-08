package com.condominio.invitados

import java.time.LocalDateTime

data class InvitadoDto(
    val id: Long = 0,
    val unidadId: Long,
    val unidadNumero: String? = null,
    val nombre: String,
    val identificacion: String? = null,
    val placaVehiculo: String? = null,
    val fechaHoraDesde: LocalDateTime,
    val fechaHoraHasta: LocalDateTime,
    val estado: String = "PENDIENTE",
    val creadoEn: LocalDateTime? = null
)
