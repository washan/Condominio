package com.condominio.pdf

import com.fasterxml.jackson.databind.ObjectMapper
import com.itextpdf.kernel.colors.ColorConstants
import com.itextpdf.kernel.colors.DeviceRgb
import com.itextpdf.kernel.colors.Color
import com.itextpdf.kernel.pdf.PdfDocument
import com.itextpdf.kernel.pdf.PdfWriter
import com.itextpdf.layout.Document
import com.itextpdf.layout.element.Paragraph
import com.itextpdf.layout.element.Table
import com.itextpdf.layout.element.Cell
import com.itextpdf.layout.element.Image
import com.itextpdf.io.image.ImageDataFactory
import com.itextpdf.layout.properties.TextAlignment
import com.itextpdf.layout.properties.UnitValue
import com.condominio.configuracion.ConfiguracionService
import com.condominio.domain.Cobro
import com.condominio.domain.EstadoCuentaPdf
import com.condominio.exception.BusinessException
import com.condominio.repository.CobroRepository
import com.condominio.repository.EstadoCuentaPdfRepository
import com.condominio.repository.ItemCobroRepository
import com.condominio.repository.LecturaMedidorRepository
import com.condominio.storage.SupabaseStorageService
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.client.RestClient
import java.io.ByteArrayOutputStream
import java.time.LocalDateTime
import java.math.BigDecimal

@Service
class PdfGeneratorService(
    private val cobroRepository: CobroRepository,
    private val itemCobroRepository: ItemCobroRepository,
    private val lecturaMedidorRepository: LecturaMedidorRepository,
    private val estadoCuentaPdfRepository: EstadoCuentaPdfRepository,
    private val configuracionService: ConfiguracionService,
    private val supabaseStorageService: SupabaseStorageService
) {

    private val logger = LoggerFactory.getLogger(PdfGeneratorService::class.java)
    private val restClient = RestClient.builder().build()

    @Transactional
    fun generarYSubirPdf(cobroId: Long): String {
        val cobro = cobroRepository.findById(cobroId)
            .orElseThrow { BusinessException("Cobro no encontrado con id: $cobroId") }

        // Generar PDF en memoria
        val pdfBytes = generarPdfBytes(cobro)

        // Subir a Supabase
        val path = "pdfs/${cobro.periodo.id}/${cobro.id}_estado_cuenta.pdf"
        supabaseStorageService.uploadFileBytes(path, pdfBytes, "application/pdf")

        // Guardar registro en base de datos
        val publicUrl = supabaseStorageService.getSignedUrl(path)
        
        val pdfOpt = estadoCuentaPdfRepository.findByCobroId(cobroId)
        val pdfEntity = if (pdfOpt.isPresent) {
            val exist = pdfOpt.get()
            val field = exist.javaClass.getDeclaredField("urlPdf")
            field.isAccessible = true
            field.set(exist, publicUrl)
            exist
        } else {
            EstadoCuentaPdf(
                cobro = cobro,
                urlPdf = publicUrl,
                fechaGenerado = LocalDateTime.now()
            )
        }
        estadoCuentaPdfRepository.save(pdfEntity)

        return publicUrl
    }

    fun generarPdfBytes(cobro: Cobro): ByteArray {
        val out = ByteArrayOutputStream()
        val writer = PdfWriter(out)
        val pdfDoc = PdfDocument(writer)
        val document = Document(pdfDoc)

        val configs = configuracionService.getValores()
        val primaryColor = parseHexColor(configs["pdf.color_header_hex"] ?: "#6A11CB")
        val accentColor = parseHexColor(configs["pdf.color_acento_hex"] ?: "#FF6B35")

        // 1. HEADER (Logo + Nombre)
        val headerTable = Table(UnitValue.createPercentArray(floatArrayOf(30f, 70f))).useAllAvailableWidth()
        
        val logoUrl = configs["condominio.logo_url"]
        if (!logoUrl.isNullOrBlank()) {
            val logoBytes = downloadImageBytes(logoUrl)
            if (logoBytes != null) {
                val image = Image(ImageDataFactory.create(logoBytes)).setMaxWidth(100f).setMaxHeight(50f)
                headerTable.addCell(Cell().add(image).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER))
            } else {
                headerTable.addCell(Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER))
            }
        } else {
            headerTable.addCell(Cell().setBorder(com.itextpdf.layout.borders.Border.NO_BORDER))
        }

        val condoNombre = configs["condominio.nombre"] ?: "Condominio Residencial"
        val condoNombreLegal = configs["condominio.nombre_legal"] ?: "Administración de Condominios S.A."
        val titleCell = Cell().add(Paragraph(condoNombre).setFontSize(18f).setBold().setFontColor(primaryColor))
            .add(Paragraph(condoNombreLegal).setFontSize(10f).setFontColor(ColorConstants.GRAY))
            .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
            .setTextAlignment(TextAlignment.RIGHT)
        headerTable.addCell(titleCell)
        document.add(headerTable)

        document.add(Paragraph("\n"))

        // 2. METADATA (Periodo + Unidad)
        val metaTable = Table(UnitValue.createPercentArray(floatArrayOf(50f, 50f))).useAllAvailableWidth()
        metaTable.addCell(Cell().add(Paragraph("ESTADO DE CUENTA").setBold().setFontSize(12f))
            .add(Paragraph("Período: ${cobro.periodo.mes}/${cobro.periodo.anio}").setFontSize(10f))
            .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER))
        metaTable.addCell(Cell().add(Paragraph("Unidad: Casa #${cobro.unidad.numero}").setBold().setFontSize(12f))
            .add(Paragraph("Propietario: ${cobro.unidad.nombrePropietario}").setFontSize(10f))
            .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
            .setTextAlignment(TextAlignment.RIGHT))
        document.add(metaTable)

        document.add(Paragraph("\n"))

        // 3. KPI CARDS (Saldo Anterior | Cobros Mes | Total a Pagar)
        val kpiTable = Table(UnitValue.createPercentArray(floatArrayOf(33f, 33f, 34f))).useAllAvailableWidth()
        kpiTable.addCell(Cell().add(Paragraph("SALDO ANTERIOR").setFontSize(9f).setFontColor(ColorConstants.GRAY))
            .add(Paragraph("₡${formatMoney(cobro.saldoMonetarioAnterior)}").setFontSize(14f).setBold())
            .setBackgroundColor(ColorConstants.LIGHT_GRAY))
        kpiTable.addCell(Cell().add(Paragraph("COBROS DEL MES").setFontSize(9f).setFontColor(ColorConstants.GRAY))
            .add(Paragraph("₡${formatMoney(cobro.totalCobros)}").setFontSize(14f).setBold())
            .setBackgroundColor(ColorConstants.LIGHT_GRAY))
        kpiTable.addCell(Cell().add(Paragraph("TOTAL A PAGAR").setFontSize(9f).setFontColor(ColorConstants.WHITE))
            .add(Paragraph("₡${formatMoney(cobro.totalPagar)}").setFontSize(14f).setBold().setFontColor(ColorConstants.WHITE))
            .setBackgroundColor(primaryColor))
        document.add(kpiTable)

        document.add(Paragraph("\n"))

        // 4. DETALLE DE COBROS TABLE
        document.add(Paragraph("DETALLE DE COBROS").setBold().setFontSize(11f).setFontColor(primaryColor))
        val detailTable = Table(UnitValue.createPercentArray(floatArrayOf(50f, 15f, 15f, 20f))).useAllAvailableWidth()
        detailTable.addHeaderCell(Cell().add(Paragraph("Descripción").setBold()))
        detailTable.addHeaderCell(Cell().add(Paragraph("Cant").setBold()))
        detailTable.addHeaderCell(Cell().add(Paragraph("Precio Unit.").setBold()))
        detailTable.addHeaderCell(Cell().add(Paragraph("Subtotal").setBold()))

        val items = itemCobroRepository.findByCobroId(cobro.id)
        items.forEach { item ->
            detailTable.addCell(Cell().add(Paragraph(item.descripcion).setFontSize(9f)))
            detailTable.addCell(Cell().add(Paragraph(item.cantidad.toString()).setFontSize(9f)))
            detailTable.addCell(Cell().add(Paragraph("₡${formatMoney(item.precioUnitario)}").setFontSize(9f)))
            detailTable.addCell(Cell().add(Paragraph("₡${formatMoney(item.subtotal)}").setFontSize(9f)))
        }
        
        // Fila Total
        detailTable.addCell(Cell(1, 3).add(Paragraph("Total Cobros del Mes").setBold().setFontSize(10f)).setTextAlignment(TextAlignment.RIGHT))
        detailTable.addCell(Cell().add(Paragraph("₡${formatMoney(cobro.totalCobros)}").setBold().setFontSize(10f)))
        document.add(detailTable)

        document.add(Paragraph("\n"))

        // 5. LECTURA DE MEDIDOR (Opcional por config)
        val mostrarLecturas = configs["pdf.mostrar_lecturas_m3"]?.toBoolean() ?: true
        if (mostrarLecturas) {
            document.add(Paragraph("CONSUMO DE AGUA (m³)").setBold().setFontSize(11f).setFontColor(primaryColor))
            
            // Buscar lectura del mes
            val todasLecturas = lecturaMedidorRepository.findAll().filter { it.periodo?.id == cobro.periodo.id && it.medidor.unidad.id == cobro.unidad.id }
            val lectura = todasLecturas.firstOrNull()

            if (lectura != null && lectura.consumoM3 != null) {
                val consumo = lectura.consumoM3!!
                val lecturaAct = lectura.valorM3
                val lecturaAnt = lecturaAct.subtract(consumo)

                val meterTable = Table(UnitValue.createPercentArray(floatArrayOf(33f, 33f, 34f))).useAllAvailableWidth()
                meterTable.addCell(Cell().add(Paragraph("Lectura Anterior").setFontSize(9f))
                    .add(Paragraph("$lecturaAnt m³").setFontSize(11f).setBold()))
                meterTable.addCell(Cell().add(Paragraph("Lectura Actual").setFontSize(9f))
                    .add(Paragraph("$lecturaAct m³").setFontSize(11f).setBold()))
                meterTable.addCell(Cell().add(Paragraph("Consumo del Mes").setFontSize(9f))
                    .add(Paragraph("$consumo m³").setFontSize(11f).setBold().setFontColor(accentColor)))
                document.add(meterTable)

                // 6. FOTOS DEL MEDIDOR (Opcional por config)
                val mostrarFotos = configs["pdf.mostrar_fotos_medidor"]?.toBoolean() ?: true
                if (mostrarFotos && !lectura.fotoUrl.isNullOrBlank()) {
                    document.add(Paragraph("\n"))
                    document.add(Paragraph("EVIDENCIA DE LECTURA").setBold().setFontSize(10f).setFontColor(ColorConstants.GRAY))
                    
                    val photoTable = Table(UnitValue.createPercentArray(floatArrayOf(100f))).useAllAvailableWidth()
                    val fotoBytes = downloadImageBytes(lectura.fotoUrl!!)
                    if (fotoBytes != null) {
                        val image = Image(ImageDataFactory.create(fotoBytes)).setMaxWidth(200f).setMaxHeight(150f)
                        photoTable.addCell(Cell().add(image).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setTextAlignment(TextAlignment.CENTER))
                        document.add(photoTable)
                    }
                }
            } else {
                document.add(Paragraph("Lectura pendiente de registrar para este período.").setFontSize(10f).setItalic())
            }
        }

        document.add(Paragraph("\n\n"))

        // 7. FOOTER (Firmas o pies configurables)
        val pieIzq = configs["pdf.pie_texto_izq"] ?: "Elaborado Por"
        val pieCentro = configs["pdf.pie_texto_centro"] ?: "Revisado Por"
        val pieDer = configs["pdf.pie_texto_der"] ?: "Autorizado Por"

        val footerTable = Table(UnitValue.createPercentArray(floatArrayOf(33f, 33f, 34f))).useAllAvailableWidth()
        footerTable.addCell(Cell().add(Paragraph("\n\n_______________________\n$pieIzq").setFontSize(8f)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setTextAlignment(TextAlignment.CENTER))
        footerTable.addCell(Cell().add(Paragraph("\n\n_______________________\n$pieCentro").setFontSize(8f)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setTextAlignment(TextAlignment.CENTER))
        footerTable.addCell(Cell().add(Paragraph("\n\n_______________________\n$pieDer").setFontSize(8f)).setBorder(com.itextpdf.layout.borders.Border.NO_BORDER).setTextAlignment(TextAlignment.CENTER))
        document.add(footerTable)

        document.close()
        return out.toByteArray()
    }

    private fun parseHexColor(hex: String): Color {
        return try {
            val clean = hex.replace("#", "")
            val r = clean.substring(0, 2).toInt(16)
            val g = clean.substring(2, 4).toInt(16)
            val b = clean.substring(4, 6).toInt(16)
            DeviceRgb(r, g, b)
        } catch (e: Exception) {
            DeviceRgb(106, 17, 203) // violeta por defecto
        }
    }

    private fun formatMoney(monto: BigDecimal): String {
        return String.format("%,.2f", monto.toDouble())
    }

    private fun downloadImageBytes(url: String): ByteArray? {
        return try {
            restClient.get().uri(url).retrieve().body(ByteArray::class.java)
        } catch (e: Exception) {
            logger.warn("No se pudo descargar la imagen para el PDF desde la URL: $url", e)
            null
        }
    }
}
