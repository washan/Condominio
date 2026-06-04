package com.condominio.repository

import com.condominio.domain.Condomino
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface CondominoRepository : JpaRepository<Condomino, Long> {
    fun findByUsuarioId(usuarioId: Long): Optional<Condomino>
    fun findByUnidadId(unidadId: Long): List<Condomino>
}
