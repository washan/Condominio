package com.condominio.lecturas

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.context.annotation.Primary
import org.springframework.stereotype.Service
import java.math.BigDecimal

@Service
@Primary
class OcrServiceDispatcher(
    private val localOcrService: LocalOcrService,
    private val googleVisionOcrService: GoogleVisionOcrService,
    @Value("\${ocr.provider:local}") private val provider: String
) : OcrService {
    private val logger = LoggerFactory.getLogger(OcrServiceDispatcher::class.java)

    override fun detectarLectura(fotoBytes: ByteArray): BigDecimal? {
        logger.info("Despachando servicio OCR utilizando proveedor configurado: $provider")
        return when (provider.lowercase()) {
            "google" -> googleVisionOcrService.detectarLectura(fotoBytes)
            "local" -> localOcrService.detectarLectura(fotoBytes)
            else -> {
                logger.warn("Proveedor OCR '$provider' no soportado. Usando proveedor 'local' por defecto.")
                localOcrService.detectarLectura(fotoBytes)
            }
        }
    }
}
