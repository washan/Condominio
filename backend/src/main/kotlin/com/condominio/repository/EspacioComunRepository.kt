package com.condominio.repository

import com.condominio.domain.EspacioComun
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface EspacioComunRepository : JpaRepository<EspacioComun, Long> {
    fun findAllByActivaTrue(): List<EspacioComun>
}
