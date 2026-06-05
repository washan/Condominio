package com.condominio.ajustes

import com.condominio.domain.AjusteSaldo
import com.condominio.domain.Usuario
import com.condominio.exception.BusinessException
import com.condominio.repository.AjusteSaldoRepository
import com.condominio.repository.UnidadRepository
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.io.BufferedReader
import java.io.InputStreamReader
import java.math.BigDecimal
import java.time.LocalDate
import java.time.LocalDateTime

@Service
class AjusteSaldoService(
    private val ajusteSaldoRepository: AjusteSaldoRepository,
    private val unidadRepository: UnidadRepository
) {

    private val logger = LoggerFactory.getLogger(AjusteSaldoService::class.java)

    fun getAjustesPorUnidad(unidadId: Long): List<AjusteSaldoDto> {
        val unidad = unidadRepository.findById(unidadId)
            .orElseThrow { BusinessException("Unidad no encontrada con id: $unidadId") }
        return ajusteSaldoRepository.findByUnidadId(unidadId).map { toDto(it) }
    }

    @Transactional
    fun createAjuste(dto: AjusteSaldoDto, creadoPor: Usuario): AjusteSaldoDto {
        val unidad = unidadRepository.findById(dto.unidadId)
            .orElseThrow { BusinessException("Unidad no encontrada con id: ${dto.unidadId}") }

        val entity = AjusteSaldo(
            unidad = unidad,
            monto = dto.monto,
            descripcion = dto.descripcion,
            fechaEfectiva = dto.fechaEfectiva,
            creadoPor = creadoPor,
            creadoEn = LocalDateTime.now()
        )

        logger.info("Creando ajuste de saldo para unidad ${unidad.numero}: ${dto.monto} ₡ (${dto.descripcion})")
        val saved = ajusteSaldoRepository.save(entity)
        return toDto(saved)
    }

    @Transactional
    fun importarAjustesCSV(file: MultipartFile, creadoPor: Usuario): Map<String, Int> {
        var importados = 0
        var errores = 0

        BufferedReader(InputStreamReader(file.inputStream)).use { reader ->
            var line: String? = reader.readLine() // Saltar cabecera
            while (reader.readLine().also { line = it } != null) {
                try {
                    val tokens = line!!.split(",")
                    if (tokens.size < 3) continue
                    val numeroUnidad = tokens[0].trim().replace("\"", "")
                    val montoStr = tokens[1].trim().replace("\"", "")
                    val descripcion = tokens[2].trim().replace("\"", "")

                    val monto = BigDecimal(montoStr)
                    val unidad = unidadRepository.findByNumero(numeroUnidad)

                    if (unidad.isPresent) {
                        val dto = AjusteSaldoDto(
                            unidadId = unidad.get().id,
                            monto = monto,
                            descripcion = descripcion,
                            fechaEfectiva = LocalDate.now()
                        )
                        createAjuste(dto, creadoPor)
                        importados++
                    } else {
                        errores++
                        logger.warn("CSV Ajustes Import: No se encontró la unidad con número $numeroUnidad")
                    }
                } catch (e: Exception) {
                    errores++
                    logger.error("Error importando línea de CSV de Ajustes: $line", e)
                }
            }
        }

        return mapOf("importados" to importados, "errores" to errores)
    }

    private fun toDto(entity: AjusteSaldo): AjusteSaldoDto {
        return AjusteSaldoDto(
            id = entity.id,
            unidadId = entity.unidad.id,
            unidadNumero = entity.unidad.numero,
            monto = entity.monto,
            descripcion = entity.descripcion,
            fechaEfectiva = entity.fechaEfectiva,
            creadoPorNombre = entity.creadoPor.nombre,
            creadoEn = entity.creadoEn
        )
    }
}
