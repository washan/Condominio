package com.condominio.lecturas

import com.fasterxml.jackson.databind.ObjectMapper
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.MediaType
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import java.math.BigDecimal
import java.util.Base64
import java.util.regex.Pattern

@Service
class GoogleVisionOcrService(
    @Value("\${ocr.google-api-key:}") private val apiKey: String
) : OcrService {
    private val logger = LoggerFactory.getLogger(GoogleVisionOcrService::class.java)
    private val restClient = RestClient.builder().build()
    private val objectMapper = ObjectMapper()

    override fun detectarLectura(fotoBytes: ByteArray): BigDecimal? {
        if (apiKey.isBlank()) {
            logger.warn("Google Cloud Vision API Key no configurada. Omitiendo OCR de Google.")
            return null
        }

        return try {
            val base64Image = Base64.getEncoder().encodeToString(fotoBytes)
            val requestBody = mapOf(
                "requests" to listOf(
                    mapOf(
                        "image" to mapOf("content" to base64Image),
                        "features" to listOf(mapOf("type" to "TEXT_DETECTION"))
                    )
                )
            )

            val url = "https://vision.googleapis.com/v1/images:annotate?key=$apiKey"
            val response = restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .retrieve()
                .body(String::class.java)

            if (response.isNullOrBlank()) return null

            val rootNode = objectMapper.readTree(response)
            val textAnnotations = rootNode.path("responses")
                .path(0)
                .path("textAnnotations")

            if (textAnnotations.isEmpty) {
                logger.info("Google Vision OCR: No se detectó texto en la imagen.")
                return null
            }

            val fullText = textAnnotations.get(0).path("description").asText()
            logger.info("Google Vision OCR texto crudo: $fullText")
            
            extraerNumero(fullText)
        } catch (e: Exception) {
            logger.error("Error al procesar OCR con Google Vision", e)
            null
        }
    }

    private fun extraerNumero(texto: String): BigDecimal? {
        // Encontrar bloques de 3 a 7 números continuos
        val cleanText = texto.replace("\\s+".toRegex(), " ")
        val pattern = Pattern.compile("\\b\\d{3,7}\\b")
        val matcher = pattern.matcher(cleanText)
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
