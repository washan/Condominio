package com.condominio.repository

import com.condominio.domain.Aviso
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.time.LocalDate

@Repository
interface AvisoRepository : JpaRepository<Aviso, Long> {
    
    @Query("SELECT a FROM Aviso a WHERE a.vigenteHasta IS NULL OR a.vigenteHasta >= :fecha ORDER BY a.fechaPublicacion DESC")
    fun findVigentes(fecha: LocalDate): List<Aviso>
    
    fun findAllByOrderByFechaPublicacionDesc(): List<Aviso>
}
