"""
Generador de Documentos Legales Oficiales en PDF para:
Torre Residencial Jardines del Cerro IV (Mao, Valverde, República Dominicana)
"""

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

# Colores corporativos de la Torre
PRIMARY = colors.HexColor('#0F172A')   # Slate oscuro / Ink
ACCENT = colors.HexColor('#C9A770')    # Oro / Champán
SECONDARY = colors.HexColor('#1E293B') # Slate intermedio
BG_LIGHT = colors.HexColor('#F8FAFC')  # Surface claro
BORDER_COLOR = colors.HexColor('#E2E8F0')
TEXT_MUTED = colors.HexColor('#64748B')
TEXT_DARK = colors.HexColor('#1E293B')
SUCCESS_GREEN = colors.HexColor('#059669')

class NumberedCanvas(canvas.Canvas):
    """Canvas para numeración dinámica de páginas: 'Página X de Y'"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, total_pages):
        self.saveState()
        # Encabezado sutil en páginas posteriores a la 1
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(SECONDARY)
            self.drawString(54, 750, "TORRE RESIDENCIAL JARDINES DEL CERRO IV")
            self.setFont("Helvetica", 7)
            self.setFillColor(TEXT_MUTED)
            self.drawString(54, 740, "CONSORCIO DE PROPIETARIOS · MAO, VALVERDE · LEY NO. 5038")
            self.setStrokeColor(BORDER_COLOR)
            self.setLineWidth(0.5)
            self.line(54, 734, 558, 734)

        # Pie de página en todas las páginas
        self.setStrokeColor(BORDER_COLOR)
        self.setLineWidth(0.5)
        self.line(54, 45, 558, 45)
        
        self.setFont("Helvetica", 7.5)
        self.setFillColor(TEXT_MUTED)
        self.drawString(54, 32, "Documento Oficial del Condominio · Registrado bajo la Ley No. 5038 y Código Civil de la República Dominicana")
        
        page_str = f"Página {self._pageNumber} de {total_pages}"
        self.drawRightString(558, 32, page_str)
        self.restoreState()


def get_styles():
    styles = getSampleStyleSheet()
    
    styles.add(ParagraphStyle(
        'DocTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=PRIMARY,
        alignment=1, # Centered
        spaceAfter=4
    ))
    styles.add(ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=12,
        textColor=ACCENT,
        alignment=1,
        spaceAfter=12
    ))
    styles.add(ParagraphStyle(
        'DocInstitution',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=TEXT_MUTED,
        alignment=1,
        spaceAfter=14
    ))
    styles.add(ParagraphStyle(
        'SectionHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=14,
        textColor=PRIMARY,
        spaceBefore=10,
        spaceAfter=6,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        'ArticleTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=12,
        textColor=SECONDARY,
        spaceBefore=6,
        spaceAfter=2,
        keepWithNext=True
    ))
    styles.add(ParagraphStyle(
        'LegalBody',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=TEXT_DARK,
        alignment=4, # Justified
        spaceAfter=6
    ))
    styles.add(ParagraphStyle(
        'LegalBullet',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=TEXT_DARK,
        leftIndent=14,
        spaceAfter=3
    ))
    styles.add(ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8,
        leading=11,
        textColor=TEXT_DARK
    ))
    styles.add(ParagraphStyle(
        'SignatureName',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        alignment=1
    ))
    styles.add(ParagraphStyle(
        'SignatureRole',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=TEXT_MUTED,
        alignment=1
    ))
    return styles


def build_header(elements, styles, title, subtitle):
    # Banner superior
    elements.append(Paragraph("CONSORCIO DE COPROPIETARIOS · TORRE RESIDENCIAL JARDINES DEL CERRO IV", styles['DocInstitution']))
    elements.append(Paragraph(title, styles['DocTitle']))
    elements.append(Paragraph(subtitle, styles['DocSubtitle']))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=ACCENT, spaceBefore=2, spaceAfter=14))


def build_callout(text, styles):
    t = Table([[Paragraph(text, styles['CalloutText'])]], colWidths=[504])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('BOX', (0,0), (-1,-1), 1, BORDER_COLOR),
        ('LEFTPADDING', (0,0), (-1,-1), 12),
        ('RIGHTPADDING', (0,0), (-1,-1), 12),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ('LINELEFT', (0,0), (-1,-1), 3, ACCENT),
    ]))
    return t


def build_signature_block(styles, sigs):
    # sigs: list of tuples (Name, Role, Doc)
    cells = []
    row = []
    for name, role, doc in sigs:
        p = Paragraph(f"<br/><br/>____________________________________<br/><b>{name}</b><br/>{role}<br/>{doc}", styles['SignatureName'])
        row.append(p)
        if len(row) == 2:
            cells.append(row)
            row = []
    if row:
        if len(row) == 1:
            row.append(Paragraph("", styles['SignatureName']))
        cells.append(row)
        
    t = Table(cells, colWidths=[250, 250])
    t.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    return t


# =========================================================================
# DOCUMENTO 1: REGLAMENTO DEL RÉGIMEN DE CONDOMINIO
# =========================================================================
def generate_doc_reglamento(output_path):
    doc = SimpleDocTemplate(output_path, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    styles = get_styles()
    story = []

    build_header(
        story, styles,
        "REGLAMENTO DEL RÉGIMEN DE CONDOMINIO Y COPROPIEDAD",
        "Reglamento Oficial Registrado conforme a la Ley No. 5038 sobre Condominios"
    )

    story.append(build_callout(
        "<b>CONSIDERANDO:</b> Que la Torre Residencial Jardines del Cerro IV, ubicada en el sector El Cerro, Municipio de Mao, Provincia Valverde, República Dominicana, está concebida bajo el régimen de propiedad horizontal y copropiedad, sujeta a la Ley No. 5038 y normas conexas del Código Civil.",
        styles
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("CAPÍTULO I: DE LA AFECTACIÓN AL RÉGIMEN Y DESTINO", styles['SectionHeader']))
    story.append(Paragraph("<b>Artículo 1.- Objeto y Afectación:</b> Las unidades residenciales y áreas de copropiedad común de la Torre Jardines del Cerro IV quedan formalmente sometidas al Régimen de Condominio legal establecido en la Ley No. 5038. Las disposiciones de este reglamento son vinculantes para todos los propietarios, arrendatarios, cesionarios y ocupantes a cualquier título.", styles['LegalBody']))
    story.append(Paragraph("<b>Artículo 2.- Destino Exclusivo:</b> Todas las unidades de apartamentos y penthouses están destinadas única y exclusivamente para <b>vivienda familiar residencial</b>. Queda terminantemente prohibido instalar en ellas consultorios abiertos al público con alto flujo masivo, talleres, centros religiosos, casas de hospedaje colectivo o cualquier actividad lesiva a la tranquilidad y seguridad de los copropietarios.", styles['LegalBody']))

    story.append(Paragraph("CAPÍTULO II: DE LOS BIENES COMUNES Y ALÍCUOTAS INDIVISAS", styles['SectionHeader']))
    story.append(Paragraph("<b>Artículo 3.- Bienes Comunes Esenciales:</b> Son bienes del dominio común inalienable e indivisible de todos los condóminos:<br/>"
                           "a) El solar o terreno donde se levanta la Torre y sus obras subterráneas de cimentación y sismo-resistencia.<br/>"
                           "b) El vestíbulo principal o Lobby climatizado con recepción y control de acceso peatonal.<br/>"
                           "c) Los ascensores modernos camilleros marca Otis Gen2 con sistema de rescate automático.<br/>"
                           "d) El generador eléctrico de emergencia Cummins de 150 kVA con transferencia automática 24/7 y cisterna de 45,000 galones.<br/>"
                           "e) Las áreas sociales y amenidades: Piscina semi-olímpica, Gimnasio equipado, Terraza Rooftop vista 360°, Gazebo y parrillas BBQ.", styles['LegalBody']))
    story.append(Paragraph("<b>Artículo 4.- Alícuotas de Participación:</b> A cada unidad residencial le corresponde un porcentaje o cuota indivisa sobre los bienes comunes determinado en el título de mensura y división en condominios, el cual regirá proporcionalmente el poder del voto en las Asambleas de Condóminos y la participación en las cargas comunes.", styles['LegalBody']))

    story.append(Paragraph("CAPÍTULO III: CUOTAS DE MANTENIMIENTO, MORA Y FONDO DE RESERVA", styles['SectionHeader']))
    story.append(Paragraph("<b>Artículo 5.- Obligación del Pago:</b> Cada propietario o residente responderá puntualmente de las cuotas de mantenimiento ordinarias y extraordinarias votadas en asamblea, a ser saldadas dentro de los primeros cinco (5) días de cada mes calendario.", styles['LegalBody']))
    story.append(Paragraph("<b>Artículo 6.- Recargo por Mora e Intimación Legal:</b> Todo retardo en el pago devengará un recargo del <b>3% mensual acumulativo</b> por concepto de mora. En caso de atraso superior a cuarenta y cinco (45) días, la Administración queda investida de pleno derecho para expedir intimación formal de pago mediante acto de alguacil y trabar la <b>Hipoteca Legal Preferente</b> consagrada en el Artículo 16 de la Ley 5038.", styles['LegalBody']))
    story.append(Paragraph("<b>Artículo 7.- Fondo de Reserva Obligatorio:</b> Se constituye un Fondo de Reserva permanente equivalente al 5% del presupuesto anual de ingresos, inmovilizado en cuenta de alto rendimiento bancaria, para afrontar contingencias graves o reparaciones mayores de equipos críticos.", styles['LegalBody']))

    story.append(Paragraph("CAPÍTULO IV: DE LOS ÓRGANOS DE GOBIERNO Y ASAMBLEAS", styles['SectionHeader']))
    story.append(Paragraph("<b>Artículo 8.- Asamblea General de Condóminos:</b> Es el órgano supremo de deliberación del Consorcio. Se reunirá ordinariamente una (1) vez al año y extraordinariamente cuantas veces convoque la Administración o propietarios que representen más del tercio de las alícuotas.", styles['LegalBody']))
    story.append(Paragraph("<b>Artículo 9.- Quórum Reglamentario:</b> Para deliberar en primera convocatoria se requiere la presencia o representación del 50% + 1 de las alícuotas indivisas. En segunda convocatoria celebrada sesenta minutos después, la asamblea deliberará válidamente con los condóminos presentes y representados.", styles['LegalBody']))

    story.append(Spacer(1, 14))
    story.append(Paragraph("DADO, APROBADO Y REGISTRADO en la ciudad de Mao, Municipio Cabecera de la Provincia Valverde, República Dominicana.", styles['LegalBody']))
    story.append(Spacer(1, 14))

    sigs = [
        ("Lic. Manuel Tavárez", "Presidente del Consorcio de Propietarios", "Céd. 034-0087654-1"),
        ("Ing. Elena Gómez", "Secretaria de Actas y Administración", "Céd. 034-0029182-3"),
        ("Lic. Ramona Ramos", "Tesorera del Consejo Directivo", "Céd. 034-0012345-6"),
        ("Lic. Félix R. Almanzar", "Notario Público Certificador (Colegiatura 4812)", "Matrícula Notarial 2024-M")
    ]
    story.append(build_signature_block(styles, sigs))

    doc.build(story, canvasmaker=NumberedCanvas)


# =========================================================================
# DOCUMENTO 2: CONTRATO DE ADQUISICIÓN Y SEPARACIÓN INMOBILIARIA
# =========================================================================
def generate_doc_contrato_separacion(output_path):
    doc = SimpleDocTemplate(output_path, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    styles = get_styles()
    story = []

    build_header(
        story, styles,
        "CONTRATO DE PROMESA DE COMPRAVENTA Y SEPARACIÓN INMOBILIARIA",
        "Instrumento Privado de Separación y Opción de Adquisición de Apartamento"
    )

    story.append(build_callout(
        "<b>ENTRE:</b> De una parte, la sociedad comercial <b>DESARROLLOS INMOBILIARIOS DEL VALLE, S.R.L.</b>, promotora del proyecto Torre Residencial Jardines del Cerro IV, RNC 1-31-89421-2; y de la otra parte, <b>EL PROMITENTE COMPRADOR</b> debidamente identificado al pie del presente contrato.",
        styles
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("SE HA CONVENIDO Y PACTADO LO SIGUIENTE:", styles['SectionHeader']))
    story.append(Paragraph("<b>PRIMERO.- OBJETO DEL CONTRATO:</b> LA PROMOTORA promete vender libre de cargas, gravámenes e hipotecas, y EL PROMITENTE COMPRADOR se compromete a adquirir la unidad residencial designada en el anteproyecto como:", styles['LegalBody']))
    
    # Tabla resumen de la unidad
    unit_data = [
        [Paragraph("<b>Unidad Residencial:</b>", styles['LegalBody']), Paragraph("Apartamento Seleccionado (Nivel Medio / Penthouse)", styles['LegalBody'])],
        [Paragraph("<b>Metraje Neto Construcción:</b>", styles['LegalBody']), Paragraph("120 m² de construcción neta + 2 parqueos techados", styles['LegalBody'])],
        [Paragraph("<b>Distribución Arquitectónica:</b>", styles['LegalBody']), Paragraph("3 Habitaciones, 2.5 Baños, Sala, Comedor, Cocina modular de roble, Balcón mirador, Área de lavado", styles['LegalBody'])],
        [Paragraph("<b>Amenidades Incluidas:</b>", styles['LegalBody']), Paragraph("Piscina, Gimnasio, Rooftop 360°, Ascensor Otis, Planta Eléctrica 24/7", styles['LegalBody'])],
    ]
    t = Table(unit_data, colWidths=[160, 344])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t)
    story.append(Spacer(1, 10))

    story.append(Paragraph("<b>SEGUNDO.- PRECIO DE VENTA Y MODALIDAD DE PAGO:</b> El precio de venta definitivo asciende a la suma acordada en el catálogo oficial de la Torre, pagadero bajo el siguiente calendario estructurado:", styles['LegalBody']))
    story.append(Paragraph("a) <b>Separación y Bloqueo de Unidad:</b> Con la firma de este acto, el monto formal de separación (US$ 5,000.00 o su equivalente en RD$ al tipo de cambio oficial del Banco Central).<br/>"
                           "b) <b>Completivo del Inicial (10% al 25%):</b> Distribuido en cuotas mensuales consecutivas durante el proceso de ejecución constructiva.<br/>"
                           "c) <b>Saldo Final contra Entrega:</b> El remanente contra entrega material del apartamento y firma de traspaso de Título de Propiedad Registrado en el Registro de Títulos de Mao.", styles['LegalBody']))

    story.append(Paragraph("<b>TERCERO.- CLÁUSULA RESOLUTORIA Y DESISTIMIENTO:</b> Las partes convienen expresamente que si EL PROMITENTE COMPRADOR desistiese de la adquisición por causas no imputables a LA PROMOTORA, se aplicará una penalidad administrativa del 10% del total abonado a la fecha para resarcir los costos de corretaje y desincorporación registral.", styles['LegalBody']))

    story.append(Paragraph("<b>CUARTO.- ADHESIÓN AL RÉGIMEN DE CONDOMINIO:</b> El adquiriente declara conocer y aceptar formalmente que la unidad se encuentra sometida a la Ley No. 5038, obligándose a acatar el Reglamento Interno de Convivencia y el pago de las cuotas mensuales de mantenimiento.", styles['LegalBody']))

    story.append(Spacer(1, 14))
    story.append(Paragraph("Hecho y firmado en dos (2) originales de buena fe en la ciudad de Mao, Valverde, República Dominicana.", styles['LegalBody']))
    story.append(Spacer(1, 14))

    sigs = [
        ("Ing. David Fernández", "Por: Desarrollos Inmobiliarios del Valle, S.R.L.", "RNC 1-31-89421-2"),
        ("El Adquirente / Promitente Comprador", "Titular de la Separación Inmobiliaria", "Cédula / Pasaporte Registrado"),
        ("Lic. Félix R. Almanzar", "Notario Público Legalizador", "Colegiatura Notarial 4812")
    ]
    story.append(build_signature_block(styles, sigs))

    doc.build(story, canvasmaker=NumberedCanvas)


# =========================================================================
# DOCUMENTO 3: ACTA DE ASAMBLEA GENERAL ORDINARIA DE CONDÓMINOS
# =========================================================================
def generate_doc_acta_asamblea(output_path):
    doc = SimpleDocTemplate(output_path, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    styles = get_styles()
    story = []

    build_header(
        story, styles,
        "ACTA DE LA ASAMBLEA GENERAL ORDINARIA DE COPROPIETARIOS",
        "Sesión Ordinaria Anual · Consorcio de Propietarios Torre Jardines del Cerro IV"
    )

    story.append(build_callout(
        "<b>FECHA Y LUGAR:</b> Siendo las 7:00 P.M., en el Salón Multiusos / Área Social Rooftop del Piso 9 de la Torre Residencial Jardines del Cerro IV, se reunieron los copropietarios formalmente convocados mediante circulares y avisos oficiales.",
        styles
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("I. COMPROBACIÓN DEL QUÓRUM LEGAL Y CONSTITUCIÓN", styles['SectionHeader']))
    story.append(Paragraph("El Presidente de la Junta Directiva constató la presencia física y representación debidamente apoderada del <b>86.4% de las alícuotas indivisas</b> que integran el condominio, superando holgadamente el quórum legal requerido por el Artículo 14 de la Ley 5038, quedando válidamente constituida la Asamblea.", styles['LegalBody']))

    story.append(Paragraph("II. ORDEN DEL DÍA", styles['SectionHeader']))
    story.append(Paragraph("1. Presentación y examen del Informe Financiero Anual del Ejercicio 2025-2026.<br/>"
                           "2. Auditoría del Fondo de Reserva para contingencias y mantenimiento mayor.<br/>"
                           "3. Renovación de pólizas de seguro integral contra incendio, terremoto y responsabilidad civil.<br/>"
                           "4. Mantenimiento técnico preventivo contratado para Planta Cummins 150 kVA y Ascensor Otis.<br/>"
                           "5. Fijación de la cuota ordinaria de mantenimiento mensual para el ejercicio 2026-2027.", styles['LegalBody']))

    story.append(Paragraph("III. RESOLUCIONES ADOPTADAS", styles['SectionHeader']))
    story.append(Paragraph("<b>PRIMERA RESOLUCIÓN:</b> APROBAR en todas sus partes el Informe de Ingresos y Egresos del período concluido, el cual arrojó una efectividad de cobranza del 94.2% y un superávit operativo del ejercicio. <i>(Votada a favor por unanimidad de los presentes)</i>.", styles['LegalBody']))
    story.append(Paragraph("<b>SEGUNDA RESOLUCIÓN:</b> RATIFICAR el balance del Fondo de Reserva en <b>RD$ 2,340,000.00</b> custodiados en cuenta bancaria de alto rendimiento, acordando continuar la aportación del 5% del flujo ordinario para obras preventivas de impermeabilización.", styles['LegalBody']))
    story.append(Paragraph("<b>TERCERA RESOLUCIÓN:</b> RATIFICAR la cuota ordinaria de mantenimiento en <b>RD$ 6,500.00 mensuales</b> por apartamento estándar y <b>RD$ 9,500.00</b> para Penthouses, manteniendo el recargo moratorio reglamentario del 3%.", styles['LegalBody']))
    story.append(Paragraph("<b>CUARTA RESOLUCIÓN:</b> RATIFICAR a la Junta de Directores en sus funciones para el período anual estatutario 2026-2027.", styles['LegalBody']))

    story.append(Spacer(1, 14))
    story.append(Paragraph("No habiendo más asuntos que tratar, se levantó la sesión a las 9:15 P.M., redactándose la presente acta que firman los directivos en fe de constancia.", styles['LegalBody']))
    story.append(Spacer(1, 14))

    sigs = [
        ("Lic. Manuel Tavárez", "Presidente de la Asamblea", "Céd. 034-0087654-1"),
        ("Ing. Elena Gómez", "Secretaria Ad-Hoc", "Céd. 034-0029182-3"),
        ("Lic. Ramona Ramos", "Vocal Fiscalizador", "Céd. 034-0012345-6"),
        ("Lic. Félix R. Almanzar", "Notario Público Certificante", "Mao, Provincia Valverde")
    ]
    story.append(build_signature_block(styles, sigs))

    doc.build(story, canvasmaker=NumberedCanvas)


# =========================================================================
# DOCUMENTO 4: MANUAL DE USO DE AMENIDADES Y CONVIVENCIA
# =========================================================================
def generate_doc_manual_convivencia(output_path):
    doc = SimpleDocTemplate(output_path, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    styles = get_styles()
    story = []

    build_header(
        story, styles,
        "MANUAL DE USO DE AMENIDADES Y NORMAS DE CONVIVENCIA",
        "Reglamento Operativo Comunitario · Torre Residencial Jardines del Cerro IV"
    )

    story.append(build_callout(
        "<b>PROPÓSITO:</b> Garantizar la armonía, seguridad integral, higiene y la máxima plusvalía inmobiliaria de nuestra comunidad condominal en Mao, Valverde.",
        styles
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("1. PISCINA SEMI-OLÍMPICA Y ÁREA DE ASOLEADERO", styles['SectionHeader']))
    story.append(Paragraph("• <b>Horario de uso:</b> Martes a Domingo de 6:00 A.M. a 10:00 P.M. (Los lunes permanece cerrada por mantenimiento químico y filtrado).<br/>"
                           "• <b>Indumentaria:</b> Es obligatorio el uso de traje de baño adecuado y ducha previa antes de ingresar al agua.<br/>"
                           "• <b>Menores de edad:</b> Niños menores de 12 años deben estar permanentemente supervisados por un adulto responsable.<br/>"
                           "• <b>Restricciones estrictas:</b> Se prohíbe el uso de envases de vidrio, consumo de alimentos dentro del agua y equipos de sonido ruidosos sin auriculares.", styles['LegalBody']))

    story.append(Paragraph("2. GIMNASIO CLIMATIZADO CON CONTROL BIOMÉTRICO", styles['SectionHeader']))
    story.append(Paragraph("• <b>Disponibilidad:</b> 24 horas al día, los 7 días de la semana, mediante acceso biométrico huella / tarjeta electrónica.<br/>"
                           "• <b>Higiene:</b> Es obligatorio el uso de toalla personal para limpiar los equipos tras su uso y calzado deportivo cerrado.<br/>"
                           "• <b>Conservación:</b> Descargar las mancuernas con cuidado y apagar los aires acondicionados al retirarse si la sala queda desocupada.", styles['LegalBody']))

    story.append(Paragraph("3. ROOFTOP GAZEBO, ÁREA SOCIAL Y PARRILLAS BBQ", styles['SectionHeader']))
    story.append(Paragraph("• <b>Reservas previas:</b> Deben tramitarse con conserjería con al menos 48 horas de anticipación a través del portal.<br/>"
                           "• <b>Horario límite nocturno:</b> Actividades sociales autorizadas hasta las 11:00 P.M. los días de semana y hasta las 12:30 A.M. los fines de semana.<br/>"
                           "• <b>Aseo:</b> El usuario es responsable de retirar los desechos y entregar el área en óptimas condiciones de limpieza.", styles['LegalBody']))

    story.append(Paragraph("4. RÉGIMEN ACÚSTICO, MASCOTAS Y DISPOSICIÓN DE DESECHOS", styles['SectionHeader']))
    story.append(Paragraph("• <b>Horario de Silencio:</b> De 10:00 P.M. a 8:00 A.M. queda prohibido producir ruidos molestos, música de alto volumen o trabajos de martilleo/taladrado.<br/>"
                           "• <b>Mascotas:</b> Máximo dos (2) mascotas pequeñas/medianas por unidad. En pasillos, lobby y ascensores deben transitar sujetas con correa.<br/>"
                           "• <b>Bajante de basura:</b> Los desechos deben depositarse exclusivamente en bolsas plásticas herméticamente selladas.", styles['LegalBody']))

    story.append(Spacer(1, 14))
    story.append(Paragraph("COMUNÍQUESE Y CÚMPLASE por todos los copropietarios y residentes de la Torre.", styles['LegalBody']))
    story.append(Spacer(1, 14))

    sigs = [
        ("Lic. Manuel Tavárez", "Comité de Convivencia y Seguridad", "Torre Jardines del Cerro IV"),
        ("Conserjería y Seguridad 24/7", "Supervisión Operativa en Turno", "Mao, Valverde")
    ]
    story.append(build_signature_block(styles, sigs))

    doc.build(story, canvasmaker=NumberedCanvas)


# =========================================================================
# DOCUMENTO 5: CONTRATO TIPO DE ARRENDAMIENTO RESIDENCIAL
# =========================================================================
def generate_doc_contrato_arrendamiento(output_path):
    doc = SimpleDocTemplate(output_path, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    styles = get_styles()
    story = []

    build_header(
        story, styles,
        "CONTRATO MODELO DE ARRENDAMIENTO RESIDENCIAL",
        "Regulado por el Código Civil Dominicano y el Decreto No. 4807 sobre Control de Alquileres"
    )

    story.append(build_callout(
        "<b>COMPARECIENTES:</b> De una parte, <b>EL PROPIETARIO ARRENDADOR</b> titular de la unidad; de la segunda parte, <b>EL INQUILINO ARRENDATARIO</b>; y de la tercera parte, <b>EL FIADOR SOLIDARIO</b>, quienes convienen el alquiler del inmueble bajo los términos siguientes:",
        styles
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("CLÁUSULAS CONTRACTUALES:", styles['SectionHeader']))
    story.append(Paragraph("<b>PRIMERA.- DESCRIPCIÓN DEL INMUEBLE:</b> EL ARRENDADOR cede en calidad de alquiler a EL INQUILINO el apartamento ubicado en la Torre Residencial Jardines del Cerro IV, Calle Los Cerros No. 14, Mao, Valverde, con sus aditamentos, cocina modular, baños instalados y dos (2) parqueos techados.", styles['LegalBody']))
    story.append(Paragraph("<b>SEGUNDA.- DURACIÓN Y VENCIMIENTO:</b> El término de este contrato es de un (1) año forzoso para ambas partes, renovable automáticamente salvo notificación por escrito de no renovación con sesenta (60) días de anticipación.", styles['LegalBody']))
    story.append(Paragraph("<b>TERCERA.- CANON DE ARRENDAMIENTO:</b> El precio del alquiler mensual es la suma convenida, pagadera los primeros cinco (5) días de cada mes. Dicho canon incluye el servicio regular de conserjería y cuota de mantenimiento de áreas comunes.", styles['LegalBody']))
    story.append(Paragraph("<b>CUARTA.- DEPÓSITO DE FIANZA LEGAL:</b> EL INQUILINO entrega el depósito legal correspondiente, el cual será formalizado ante el Banco Agrícola de la República Dominicana conforme lo dispone la ley, garantizando la conservación del inmueble.", styles['LegalBody']))
    story.append(Paragraph("<b>QUINTA.- PROHIBICIÓN DE SUBARRIENDO:</b> Queda prohibido ceder, transferir o subarrendar total o parcialmente el apartamento o destinarlo a plataformas de corta estancia (tipo Airbnb masivo) sin autorización escrita del propietario.", styles['LegalBody']))
    story.append(Paragraph("<b>SEXTA.- OBLIGACIÓN CONDOMINAL:</b> EL INQUILINO se compromete formalmente a acatar en su integridad el Reglamento de Régimen de Condominio y el Manual de Convivencia vigente en la Torre.", styles['LegalBody']))

    story.append(Spacer(1, 14))
    story.append(Paragraph("Redactado y firmado en tres (3) ejemplares originales en Mao, Valverde, República Dominicana.", styles['LegalBody']))
    story.append(Spacer(1, 14))

    sigs = [
        ("El Propietario Arrendador", "Parte Arrendadora Titular", "Cédula Registrada"),
        ("El Inquilino Arrendatario", "Parte Arrendataria Ocupante", "Cédula Registrada"),
        ("El Fiador Solidario", "Garante Mancomunado y Solidario", "Cédula Registrada"),
        ("Lic. Félix R. Almanzar", "Notario Público Legalizador", "Colegiatura Notarial 4812")
    ]
    story.append(build_signature_block(styles, sigs))

    doc.build(story, canvasmaker=NumberedCanvas)


# =========================================================================
# DOCUMENTO 6: FORMULARIO DE PODER ESPECIAL Y REPRESENTACIÓN
# =========================================================================
def generate_doc_poder_asamblea(output_path):
    doc = SimpleDocTemplate(output_path, pagesize=letter, leftMargin=54, rightMargin=54, topMargin=54, bottomMargin=54)
    styles = get_styles()
    story = []

    build_header(
        story, styles,
        "PODER ESPECIAL DE REPRESENTACIÓN PARA ASAMBLEA",
        "Consorcio de Propietarios Torre Jardines del Cerro IV · Conforme a la Ley No. 5038"
    )

    story.append(build_callout(
        "<b>FINALIDAD:</b> Formulario oficial para autorizar a un tercero o copropietario a ejercer el derecho de voz y voto en la Asamblea General de Condóminos en representación del titular de la unidad residencial.",
        styles
    ))
    story.append(Spacer(1, 10))

    story.append(Paragraph("DATOS DEL PODERDANTE (COPROPIETARIO TITULAR):", styles['SectionHeader']))
    pod_data = [
        [Paragraph("<b>Nombre Completo:</b>", styles['LegalBody']), Paragraph("____________________________________________________________", styles['LegalBody'])],
        [Paragraph("<b>Cédula / Pasaporte:</b>", styles['LegalBody']), Paragraph("_________________________ <b>Unidad / Apartamento:</b> _________", styles['LegalBody'])],
        [Paragraph("<b>Alícuota Indivisa (%):</b>", styles['LegalBody']), Paragraph("_________% sobre los bienes comunes de la Torre", styles['LegalBody'])],
    ]
    t1 = Table(pod_data, colWidths=[150, 354])
    t1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t1)
    story.append(Spacer(1, 10))

    story.append(Paragraph("DATOS DEL APODERADO DESIGNADO:", styles['SectionHeader']))
    apo_data = [
        [Paragraph("<b>Nombre del Apoderado:</b>", styles['LegalBody']), Paragraph("____________________________________________________________", styles['LegalBody'])],
        [Paragraph("<b>Cédula de Identidad:</b>", styles['LegalBody']), Paragraph("____________________________________________________________", styles['LegalBody'])],
        [Paragraph("<b>Vínculo / Calidad:</b>", styles['LegalBody']), Paragraph("[  ] Copropietario   [  ] Familiar   [  ] Abogado Apoderado", styles['LegalBody'])],
    ]
    t2 = Table(apo_data, colWidths=[150, 354])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), BG_LIGHT),
        ('GRID', (0,0), (-1,-1), 0.5, BORDER_COLOR),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(t2)
    story.append(Spacer(1, 10))

    story.append(Paragraph("ALCANCE DEL MANDATO Y FACULTADES:", styles['SectionHeader']))
    story.append(Paragraph("Por medio del presente acto, OTORGO PODER ESPECIAL, tan amplio y suficiente como en derecho fuere necesario, a favor de mi apoderado antes identificado, para que en mi nombre y representación:<br/>"
                           "1. Asista a la <b>Asamblea General Ordinaria / Extraordinaria</b> de Copropietarios convocada para el presente período.<br/>"
                           "2. Participe con voz y emita válidamente mi <b>voto deliberativo</b> en todos los puntos del Orden del Día.<br/>"
                           "3. Firme el registro de quórum, el acta de la asamblea y cualquier documento conexo con plena validez jurídica.", styles['LegalBody']))

    story.append(Spacer(1, 14))
    story.append(Paragraph("Dado en Mao, Provincia Valverde, República Dominicana, a los ______ días del mes de ________________ del año 2026.", styles['LegalBody']))
    story.append(Spacer(1, 16))

    sigs = [
        ("Firma del Poderdante", "Copropietario Titular de la Unidad", "Huella dactilar / Cédula"),
        ("Firma del Apoderado", "Representante Designado", "Cédula de Identidad")
    ]
    story.append(build_signature_block(styles, sigs))

    doc.build(story, canvasmaker=NumberedCanvas)


def main():
    output_dir = os.path.join(os.path.dirname(__file__), "docs")
    os.makedirs(output_dir, exist_ok=True)

    docs = [
        ("reglamento_condominio_jardines_del_cerro_iv.pdf", generate_doc_reglamento),
        ("contrato_adquisicion_separacion_inmobiliaria.pdf", generate_doc_contrato_separacion),
        ("acta_asamblea_general_ordinaria.pdf", generate_doc_acta_asamblea),
        ("manual_uso_amenidades_convivencia.pdf", generate_doc_manual_convivencia),
        ("contrato_arrendamiento_residencial_tipo.pdf", generate_doc_contrato_arrendamiento),
        ("formulario_poder_representacion_asamblea.pdf", generate_doc_poder_asamblea),
    ]

    print("Generando documentos legales oficiales...")
    for filename, generator in docs:
        filepath = os.path.join(output_dir, filename)
        generator(filepath)
        size_kb = os.path.getsize(filepath) / 1024
        print(f"[OK] {filename} ({size_kb:.1f} KB)")

    print("\nTodos los documentos legales han sido generados exitosamente!")

if __name__ == "__main__":
    main()
