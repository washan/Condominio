package com.condominio.configuracion

data class ConfiguracionDto(
    val nombreCondominio: String = "",
    val telefonoContacto: String = "",
    val emailContacto: String = "",
    val direccion: String = "",
    val logoUrl: String? = null
)
