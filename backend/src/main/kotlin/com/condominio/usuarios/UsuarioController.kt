package com.condominio.usuarios

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/api/admin/usuarios")
class UsuarioController(private val usuarioService: UsuarioService) {

    @GetMapping
    fun getUsuarios(): ResponseEntity<List<UsuarioDto>> {
        val list = usuarioService.getUsuarios()
        return ResponseEntity.ok(list)
    }

    @GetMapping("/{id}")
    fun getUsuario(@PathVariable("id") id: Long): ResponseEntity<UsuarioDto> {
        val dto = usuarioService.getUsuario(id)
        return ResponseEntity.ok(dto)
    }

    @PostMapping
    fun createUsuario(@RequestBody dto: UsuarioDto): ResponseEntity<UsuarioDto> {
        val created = usuarioService.createUsuario(dto)
        return ResponseEntity.ok(created)
    }

    @PutMapping("/{id}")
    fun updateUsuario(@PathVariable("id") id: Long, @RequestBody dto: UsuarioDto): ResponseEntity<UsuarioDto> {
        val updated = usuarioService.updateUsuario(id, dto)
        return ResponseEntity.ok(updated)
    }

    @PutMapping("/{id}/reset-password")
    fun resetPassword(@PathVariable("id") id: Long, @RequestBody request: ResetPasswordRequest): ResponseEntity<Map<String, String>> {
        usuarioService.resetPassword(id, request.nuevaContrasena)
        return ResponseEntity.ok(mapOf("message" to "Contraseña restablecida exitosamente"))
    }
}
