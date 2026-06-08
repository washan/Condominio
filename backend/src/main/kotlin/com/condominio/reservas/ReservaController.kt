package com.condominio.reservas

import org.springframework.http.ResponseEntity
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/reservas")
class ReservaController(private val reservaService: ReservaService) {

    @GetMapping
    fun getReservas(
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<List<ReservaDto>> {
        val authorities = userDetails.authorities.map { it.authority }
        val isAdmin = authorities.contains("ROLE_ADMIN")
        
        val list = if (isAdmin) {
            reservaService.getAllReservas()
        } else {
            reservaService.getReservasPorCondomino(userDetails.username)
        }
        return ResponseEntity.ok(list)
    }

    @GetMapping("/espacios")
    fun getEspacios(): ResponseEntity<List<EspacioComunDto>> {
        val list = reservaService.getEspaciosActivos()
        return ResponseEntity.ok(list)
    }

    @GetMapping("/espacios/all")
    @PreAuthorize("hasRole('ADMIN')")
    fun getEspaciosAll(): ResponseEntity<List<EspacioComunDto>> {
        val list = reservaService.getAllEspacios()
        return ResponseEntity.ok(list)
    }

    @PostMapping("/espacios")
    @PreAuthorize("hasRole('ADMIN')")
    fun createEspacio(
        @RequestBody dto: EspacioComunDto
    ): ResponseEntity<EspacioComunDto> {
        val created = reservaService.createEspacio(dto)
        return ResponseEntity.ok(created)
    }

    @PutMapping("/espacios/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateEspacio(
        @PathVariable("id") id: Long,
        @RequestBody dto: EspacioComunDto
    ): ResponseEntity<EspacioComunDto> {
        val updated = reservaService.updateEspacio(id, dto)
        return ResponseEntity.ok(updated)
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'CONDOMINO')")
    fun createReserva(
        @AuthenticationPrincipal userDetails: UserDetails,
        @RequestBody dto: ReservaDto
    ): ResponseEntity<ReservaDto> {
        val created = reservaService.createReserva(dto, userDetails.username)
        return ResponseEntity.ok(created)
    }

    @PutMapping("/{id}/estado")
    fun updateEstado(
        @PathVariable("id") id: Long,
        @RequestParam("estado") estado: String,
        @AuthenticationPrincipal userDetails: UserDetails
    ): ResponseEntity<ReservaDto> {
        val updated = reservaService.updateEstado(id, estado, userDetails.username)
        return ResponseEntity.ok(updated)
    }
}
