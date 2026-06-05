package com.condominio.medidores

import java.time.LocalDate

data class MedidorDto(
    val id: Long = 0,
    val unidadId: Long,
    val codigoInterno: String,
    val activo: Boolean = true,
    val fechaInstalacion: LocalDate = LocalDate.now()
)
