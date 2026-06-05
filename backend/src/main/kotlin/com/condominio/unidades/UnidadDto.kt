package com.condominio.unidades

data class UnidadDto(
    val id: Long = 0,
    val numero: String,
    val propietario: String,
    val email: String? = null,
    val telefono: String? = null,
    val activo: Boolean = true
)
