package com.condominio.repository

import com.condominio.domain.AjusteSaldo
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface AjusteSaldoRepository : JpaRepository<AjusteSaldo, Long> {
    fun findByUnidadId(unidadId: Long): List<AjusteSaldo>
}
