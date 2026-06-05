package com.condominio.repository

import com.condominio.domain.ItemCobro
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface ItemCobroRepository : JpaRepository<ItemCobro, Long> {
    fun findByCobroId(cobroId: Long): List<ItemCobro>
    fun existsByRubroId(rubroId: Long): Boolean
}
