package com.condominio.repository

import com.condominio.domain.Unidad
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface UnidadRepository : JpaRepository<Unidad, Long> {
    fun findAllByActivaTrue(): List<Unidad>
    fun findByNumero(numero: String): Optional<Unidad>
}
