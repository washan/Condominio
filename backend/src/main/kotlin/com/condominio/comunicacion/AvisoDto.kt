package com.condominio.comunicacion

import java.time.LocalDate
import java.time.LocalDateTime

data class AvisoDto(
    val id: Long = 0,
    val titulo: String,
    val contenido: String,
    val fechaPublicacion: LocalDateTime? = null,
    val vigenteHasta: LocalDate? = null,
    val creadoPorNombre: String? = null
)
