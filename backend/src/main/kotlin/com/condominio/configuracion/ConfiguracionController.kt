package com.condominio.configuracion

import com.condominio.domain.Usuario
import com.condominio.exception.BusinessException
import com.condominio.repository.UsuarioRepository
import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/api/configuracion")
class ConfiguracionController(
    private val configuracionService: ConfiguracionService,
    private val usuarioRepository: UsuarioRepository
) {

    @GetMapping
    fun getConfiguracion(): ResponseEntity<ConfiguracionDto> {
        val valores = configuracionService.getValores()
        val dto = ConfiguracionDto(
            nombreCondominio = valores["condominio.nombre"] ?: "Condominio",
            telefonoContacto = valores["condominio.telefono"] ?: "",
            emailContacto = valores["condominio.email_contacto"] ?: "",
            direccion = valores["condominio.direccion"] ?: "",
            logoUrl = valores["condominio.logo_url"],
            tarifaBloque1Hasta = valores["tarifa.bloque1_hasta"]?.toDoubleOrNull() ?: 100.0,
            tarifaBloque1Precio = valores["tarifa.bloque1_precio"]?.toDoubleOrNull() ?: 1250.0,
            tarifaBloque2Hasta = valores["tarifa.bloque2_hasta"]?.toDoubleOrNull() ?: 300.0,
            tarifaBloque2Precio = valores["tarifa.bloque2_precio"]?.toDoubleOrNull() ?: 2100.0,
            tarifaBloque3Precio = valores["tarifa.bloque3_precio"]?.toDoubleOrNull() ?: 3500.0,
            cuotaAdministracion = valores["tarifa.cuota_administracion"]?.toDoubleOrNull() ?: 15000.0,
            diasMora = valores["mora.dias"]?.toIntOrNull() ?: 15,
            porcentajeMora = valores["mora.porcentaje"]?.toDoubleOrNull() ?: 10.0
        )
        return ResponseEntity.ok(dto)
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun updateConfiguracion(
        @RequestBody dto: ConfiguracionDto,
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<ConfiguracionDto> {
        val usuario = getUsuarioFromDetails(userDetails)
        
        val mapa = mapOf(
            "condominio.nombre" to dto.nombreCondominio,
            "condominio.telefono" to dto.telefonoContacto,
            "condominio.email_contacto" to dto.emailContacto,
            "condominio.direccion" to dto.direccion,
            "tarifa.bloque1_hasta" to dto.tarifaBloque1Hasta.toString(),
            "tarifa.bloque1_precio" to dto.tarifaBloque1Precio.toString(),
            "tarifa.bloque2_hasta" to dto.tarifaBloque2Hasta.toString(),
            "tarifa.bloque2_precio" to dto.tarifaBloque2Precio.toString(),
            "tarifa.bloque3_precio" to dto.tarifaBloque3Precio.toString(),
            "tarifa.cuota_administracion" to dto.cuotaAdministracion.toString(),
            "mora.dias" to dto.diasMora.toString(),
            "mora.porcentaje" to dto.porcentajeMora.toString()
        )
        
        configuracionService.updateValores(mapa, usuario)
        return getConfiguracion()
    }

    @PostMapping("/logo")
    @PreAuthorize("hasRole('ADMIN')")
    fun uploadLogo(
        @RequestParam("logo") file: MultipartFile,
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<Map<String, String>> {
        val usuario = getUsuarioFromDetails(userDetails)
        val logoUrl = configuracionService.uploadLogo(file, usuario)
        return ResponseEntity.ok(mapOf("logoUrl" to logoUrl))
    }

    private fun getUsuarioFromDetails(userDetails: UserDetails): Usuario {
        return usuarioRepository.findByEmail(userDetails.username)
            .orElseThrow { BusinessException("Usuario no encontrado") }
    }
}
