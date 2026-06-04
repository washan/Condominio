package com.condominio.repository

import com.condominio.domain.Rubro
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface RubroRepository : JpaRepository<Rubro, Long> {
    fun findAllByActivoTrue(): List<Rubro>
}
