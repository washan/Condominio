package com.condominio.ajustes

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
@RequestMapping("/api/ajustes")
class AjusteSaldoController(
    private val ajusteSaldoService: AjusteSaldoService,
    private val usuarioRepository: UsuarioRepository
) {

    @GetMapping("/unidad/{unidadId}")
    fun getAjustesPorUnidad(@PathVariable("unidadId") unidadId: Long): ResponseEntity<List<AjusteSaldoDto>> {
        val list = ajusteSaldoService.getAjustesPorUnidad(unidadId)
        return ResponseEntity.ok(list)
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    fun createAjuste(
        @RequestBody dto: AjusteSaldoDto,
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<AjusteSaldoDto> {
        val usuario = getUsuarioFromDetails(userDetails)
        val created = ajusteSaldoService.createAjuste(dto, usuario)
        return ResponseEntity.ok(created)
    }

    @PostMapping("/importar")
    @PreAuthorize("hasRole('ADMIN')")
    fun importarCSV(
        @RequestParam("file") file: MultipartFile,
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<Map<String, Int>> {
        val usuario = getUsuarioFromDetails(userDetails)
        val result = ajusteSaldoService.importarAjustesCSV(file, usuario)
        return ResponseEntity.ok(result)
    }

    private fun getUsuarioFromDetails(userDetails: UserDetails): Usuario {
        return usuarioRepository.findByEmail(userDetails.username)
            .orElseThrow { BusinessException("Usuario no encontrado") }
    }
}
