package com.condominio.repository

import com.condominio.domain.Medidor
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface MedidorRepository : JpaRepository<Medidor, Long> {
    fun findByUnidadIdAndActivoTrue(unidadId: Long): List<Medidor>
}
