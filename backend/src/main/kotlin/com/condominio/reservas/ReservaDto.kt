package com.condominio.reservas

import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime

data class ReservaDto(
    val id: Long = 0,
    val espacioId: Long,
    val espacioNombre: String? = null,
    val unidadId: Long,
    val unidadNumero: String? = null,
    val fechaReserva: LocalDate,
    val horaInicio: LocalTime,
    val horaFin: LocalTime,
    val estado: String = "PENDIENTE",
    val creadoEn: LocalDateTime? = null
)
