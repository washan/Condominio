package com.condominio.configuracion

data class ConfiguracionDto(
    val nombreCondominio: String = "",
    val telefonoContacto: String = "",
    val emailContacto: String = "",
    val direccion: String = "",
    val logoUrl: String? = null,
    val tarifaBloque1Hasta: Double = 100.0,
    val tarifaBloque1Precio: Double = 1250.0,
    val tarifaBloque2Hasta: Double = 300.0,
    val tarifaBloque2Precio: Double = 2100.0,
    val tarifaBloque3Precio: Double = 3500.0,
    val cuotaAdministracion: Double = 15000.0,
    val diasMora: Int = 15,
    val porcentajeMora: Double = 10.0
)
