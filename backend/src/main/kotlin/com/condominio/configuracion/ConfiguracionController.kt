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
            logoUrl = valores["condominio.logo_url"]
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
            "condominio.direccion" to dto.direccion
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
