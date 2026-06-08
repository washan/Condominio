package com.condominio.lecturas

import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.test.context.ActiveProfiles
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart
import org.springframework.test.web.servlet.result.MockMvcResultMatchers.status
import org.springframework.mock.web.MockMultipartFile
import java.io.File

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false) // Deshabilitar filtros de seguridad para probar directo
@ActiveProfiles("dev")
class LocalOcrServiceTest {

    @Autowired
    private lateinit var mockMvc: MockMvc

    @Autowired
    private lateinit var ocrService: OcrService

    @Test
    fun testMockUploadWithOcr() {
        println("=== TIPO DE BEAN INYECTADO PARA OcrService ===")
        println(ocrService.javaClass.name)
        println("==============================================")

        val filePath = "d:/Personal/Antigravity/Condominio/backend/uploads/lectura_16e65cd4-5a13-4664-9646-f3f2042842b6.png"
        val file = File(filePath)
        if (!file.exists()) {
            println("Archivo no encontrado: $filePath")
            return
        }

        val mockFile = MockMultipartFile(
            "file",
            file.name,
            "image/png",
            file.readBytes()
        )

        val result = mockMvc.perform(
            multipart("/api/lecturas/upload")
                .file(mockFile)
        )
            .andExpect(status().isOk)
            .andReturn()

        println("=== RESPUESTA DEL ENDPOINT DE UPLOAD ===")
        println(result.response.contentAsString)
        println("========================================")
    }
}
