package com.condominio.lecturas

import net.sourceforge.tess4j.Tesseract
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import java.io.ByteArrayInputStream
import java.math.BigDecimal
import java.util.regex.Pattern
import javax.imageio.ImageIO

@Service
class LocalOcrService : OcrService {
    private val logger = LoggerFactory.getLogger(LocalOcrService::class.java)

    override fun detectarLectura(fotoBytes: ByteArray): BigDecimal? {
        return try {
            val tesseract = Tesseract()
            
            // Si existe la variable de entorno para la carpeta de datos de idioma, la aplicamos
            val envDatapath = System.getenv("TESSDATA_PREFIX")
            if (!envDatapath.isNullOrBlank()) {
                tesseract.setDatapath(envDatapath)
            }
            
            // Intentar con español, si no, por defecto buscará inglés (numérico)
            try {
                tesseract.setLanguage("spa")
            } catch (e: Exception) {
                tesseract.setLanguage("eng")
            }

            // Configurar Tesseract para que priorice buscar dígitos si es posible
            tesseract.setVariable("tessedit_char_whitelist", "0123456789. ")

            val image = ImageIO.read(ByteArrayInputStream(fotoBytes))
            if (image == null) {
                logger.warn("No se pudo leer los bytes como una imagen válida para el OCR local.")
                return null
            }
            
            val result = tesseract.doOCR(image)
            logger.info("OCR local resultado crudo: $result")
            extraerNumero(result)
        } catch (t: Throwable) {
            logger.warn("El motor OCR local (Tesseract/Tess4J) no está disponible o falló: ${t.message}")
            null
        }
    }

    private fun extraerNumero(texto: String): BigDecimal? {
        // Buscar bloques numéricos de entre 3 y 7 dígitos continuos
        val cleanText = texto.replace("\\s+".toRegex(), " ")
        val pattern = Pattern.compile("\\b\\d{3,7}\\b")
        val matcher = pattern.matcher(cleanText)
        
        // Retornar el primer bloque que coincida
        if (matcher.find()) {
            val numStr = matcher.group()
            return try {
                BigDecimal(numStr)
            } catch (e: Exception) {
                null
            }
        }
        return null
    }
}
