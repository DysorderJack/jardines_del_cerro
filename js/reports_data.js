/**
 * Centro de Consultas y Reportes - Torre Residencial Jardines del Cerro IV
 * Catálogo Maestro Oficial de 30 Consultas y Reportes (REP-01 a REP-30)
 * Generado para el sistema ERP / Condominial en Cloud Run y UTESA (INF-424)
 */

window.REPORTS_CATALOG_DATA = [
  {
    "code": "REP-01",
    "category": "Comercial & Ventas",
    "title": "Disponibilidad y Catálogo de Unidades Residenciales",
    "module": "Gestión Comercial Inmobiliaria (Inversionisto S.R.L.)",
    "roles": "Público General, Asesores de Ventas, Administrador",
    "freq": "Tiempo Real / A demanda",
    "target": "Pantalla Interactiva / PDF Ejecutivo",
    "goal": "Monitorear el estado comercial en tiempo real de los 20 apartamentos y penthouses de la torre, desglosando metrajes, precios en USD y alícuotas.",
    "icon": "🏢",
    "kpi1": {
      "label": "Total Unidades",
      "val": "20 Unidades"
    },
    "kpi2": {
      "label": "Valor Inventario",
      "val": "US$ 3,450,000"
    },
    "kpi3": {
      "label": "Disponibles",
      "val": "7 Unidades (35%)"
    },
    "headers": [
      "Unidad",
      "Nivel",
      "Tipología",
      "Área Neta",
      "Hab / Baños",
      "Precio USD",
      "Alícuota %",
      "Estado Comercial"
    ],
    "rows": [
      [
        "APT-101",
        "1",
        "Apartamento Estándar",
        "120.00 m²",
        "3 Hab / 2 Baños",
        "$145,000.00",
        "4.6154%",
        "<span class='badge badge-success'>Disponible</span>"
      ],
      [
        "APT-201",
        "2",
        "Apartamento Estándar",
        "120.00 m²",
        "3 Hab / 2 Baños",
        "$148,000.00",
        "4.6154%",
        "<span class='badge badge-warning'>Reservado</span>"
      ],
      [
        "APT-301",
        "3",
        "Apartamento Modelo",
        "120.00 m²",
        "3 Hab / 2 Baños",
        "$152,000.00",
        "4.6154%",
        "<span class='badge badge-neutral'>Ocupado</span>"
      ],
      [
        "APT-401",
        "4",
        "Apartamento Estándar",
        "120.00 m²",
        "3 Hab / 2 Baños",
        "$155,000.00",
        "4.6154%",
        "<span class='badge badge-success'>Disponible</span>"
      ],
      [
        "PH-1001",
        "10",
        "Penthouse Panorámico",
        "170.00 m²",
        "4 Hab / 3.5 Baños",
        "$240,000.00",
        "6.5385%",
        "<span class='badge badge-success'>Disponible</span>"
      ]
    ],
    "rules": "Las unidades en estado 'Reservado' se bloquean de forma atómica en base de datos para impedir duplicidad de depósitos.",
    "sql": "SELECT unit_number, level, unit_type, area_sqm,\n       bedrooms || ' Hab / ' || bathrooms || ' Baños' AS dist,\n       price_usd, aliquot_pct, status\nFROM units\nWHERE (:estado IS NULL OR status = :estado)\nORDER BY level ASC, unit_number ASC;"
  },
  {
    "code": "REP-02",
    "category": "Comercial & Ventas",
    "title": "Rendimiento Comercial y Embudo de Conversión de Prospectos (CRM)",
    "module": "Gestión Comercial Inmobiliaria (Inversionisto S.R.L.)",
    "roles": "Gerencia de Ventas, Mercadeo",
    "freq": "Semanal / Mensual",
    "target": "Reporte Ejecutivo PDF con Gráficos",
    "goal": "Analizar la eficacia comercial desde la captación en la web hasta la firma de promesas bilaterales de venta.",
    "icon": "📊",
    "kpi1": {
      "label": "Prospectos Registrados",
      "val": "142 Leads"
    },
    "kpi2": {
      "label": "Conversión a Reserva",
      "val": "20.7%"
    },
    "kpi3": {
      "label": "Ventas Cerradas",
      "val": "11 Contratos"
    },
    "headers": [
      "Fase del Embudo Comercial",
      "Volumen Prospectos",
      "Tasa Conversión",
      "Tiempo Medio",
      "Valor Proyectado USD"
    ],
    "rows": [
      [
        "1. Solicitudes de Información Web",
        "142",
        "100.00%",
        "0.5 días",
        "N/A"
      ],
      [
        "2. Citas Agendadas (Presencial / Virtual)",
        "38",
        "26.76%",
        "2.1 días",
        "$5,700,000.00"
      ],
      [
        "3. Visitas Guiadas Ejecutadas en Mao",
        "29",
        "76.31%",
        "3.4 días",
        "$4,350,000.00"
      ],
      [
        "4. Separaciones de US$ 5,000 Validadas",
        "6",
        "20.68%",
        "7.2 días",
        "$980,000.00"
      ],
      [
        "5. Contratos de Venta Definitivos",
        "4",
        "66.66%",
        "15.0 días",
        "$680,000.00"
      ]
    ],
    "rules": "Permite auditar el Costo de Adquisición de Clientes (CAC) frente al retorno por comisión de venta.",
    "sql": "SELECT '1. Citas Solicitadas Web' AS etapa, COUNT(*) AS vol, 100.0 AS conv, 2.1 AS dias, 5700000.0 AS usd FROM visits\nUNION ALL SELECT '2. Visitas Ejecutadas', 29, 76.3, 3.4, 4350000.0\nUNION ALL SELECT '3. Separaciones Formalizadas', 6, 20.7, 7.2, 980000.0;"
  },
  {
    "code": "REP-03",
    "category": "Comercial & Ventas",
    "title": "Agenda de Visitas y Citas Guiadas por Asesor Comercial",
    "module": "Gestión Comercial Inmobiliaria (Inversionisto S.R.L.)",
    "roles": "Asesor de Ventas, Recepción Torre, Administrador",
    "freq": "Diario / Operativo",
    "target": "Agenda Diaria PDF / Pantalla",
    "goal": "Coordinar la atención de compradores presenciales en la torre en Mao y citas virtuales por Google Meet.",
    "icon": "📅",
    "kpi1": {
      "label": "Citas del Mes",
      "val": "38 Citas"
    },
    "kpi2": {
      "label": "Modalidad Presencial",
      "val": "71%"
    },
    "kpi3": {
      "label": "Modalidad Virtual",
      "val": "29%"
    },
    "headers": [
      "Folio Cita",
      "Fecha & Hora",
      "Prospecto Interesado",
      "Teléfono / WhatsApp",
      "Unidad",
      "Modalidad",
      "Estado"
    ],
    "rows": [
      [
        "CIT-2026-101",
        "24/11/2026 10:00 AM",
        "Ing. Ramón Tejada",
        "+1 (809) 555-8821",
        "PH-1001",
        "<span class='badge badge-primary'>Presencial en Mao</span>",
        "<span class='badge badge-success'>Confirmada</span>"
      ],
      [
        "CIT-2026-102",
        "24/11/2026 02:30 PM",
        "Dra. Altagracia Pérez (USA)",
        "+1 (718) 555-9012",
        "APT-401",
        "<span class='badge badge-accent'>Videollamada</span>",
        "<span class='badge badge-warning'>Pendiente</span>"
      ],
      [
        "CIT-2026-103",
        "25/11/2026 09:00 AM",
        "Lic. Carlos Guzmán",
        "+1 (829) 555-3411",
        "APT-201",
        "<span class='badge badge-primary'>Presencial en Mao</span>",
        "<span class='badge badge-success'>Confirmada</span>"
      ]
    ],
    "rules": "Las citas confirmadas despachan un recordatorio automático vía correo (Resend) 24 horas antes del encuentro.",
    "sql": "SELECT id, date || ' ' || time AS fecha_hora, visitor, phone, unit, mode,\n       CASE WHEN confirmed_at IS NOT NULL THEN 'Confirmada' ELSE 'Pendiente' END AS status\nFROM visits WHERE date BETWEEN :fecha_desde AND :fecha_hasta ORDER BY date ASC, time ASC;"
  },
  {
    "code": "REP-04",
    "category": "Comercial & Ventas",
    "title": "Registro de Separaciones y Reservas Bancarizadas (US$ 5,000)",
    "module": "Gestión Comercial Inmobiliaria (Inversionisto S.R.L.)",
    "roles": "Gerencia Financiera, Legal, Administrador",
    "freq": "Semanal",
    "target": "Documento Legal PDF",
    "goal": "Verificar la acreditación de depósitos formales de US$ 5,000 para promesa bilateral de compraventa.",
    "icon": "💵",
    "kpi1": {
      "label": "Reservas Activas",
      "val": "6 Unidades"
    },
    "kpi2": {
      "label": "Fondos en Custodia",
      "val": "US$ 30,000.00"
    },
    "kpi3": {
      "label": "Entidad Líder",
      "val": "Banco Popular (50%)"
    },
    "headers": [
      "Folio",
      "Fecha",
      "Adquiriente",
      "Cédula / ID",
      "Unidad",
      "Banco Trámite",
      "Monto USD",
      "Estatus"
    ],
    "rows": [
      [
        "RES-041",
        "15/11/2026",
        "Ing. Kelvin Madera",
        "034-0038921-4",
        "APT-501",
        "Banco BHD",
        "$5,000.00",
        "<span class='badge badge-success'>Validada</span>"
      ],
      [
        "RES-042",
        "18/11/2026",
        "Dra. Sofía Ventura",
        "031-0199283-1",
        "PH-1002",
        "Banco Popular",
        "$5,000.00",
        "<span class='badge badge-warning'>En Verificación</span>"
      ],
      [
        "RES-043",
        "19/11/2026",
        "Lic. Marcos Rivas",
        "034-0011827-8",
        "APT-701",
        "Banreservas",
        "$5,000.00",
        "<span class='badge badge-success'>Contrato Emitido</span>"
      ]
    ],
    "rules": "El depósito bloquea el inmueble durante 30 días hábiles para firma notarial formal.",
    "sql": "SELECT id, created_at, applicant_name, id_document, unit_number, bank_name, 5000.00, status\nFROM unit_reservations ORDER BY created_at DESC;"
  },
  {
    "code": "REP-05",
    "category": "Comercial & Ventas",
    "title": "Tasa de Absorción de Ventas y Proyección de Ingresos Inmobiliarios",
    "module": "Gestión Comercial Inmobiliaria (Inversionisto S.R.L.)",
    "roles": "Junta Directiva, Accionistas Inversionisto S.R.L.",
    "freq": "Mensual / Cierre Trimestral",
    "target": "Informe Ejecutivo A4 PDF",
    "goal": "Evaluar la velocidad de colocación de unidades en el mercado de Mao y proyectar el flujo de caja del proyecto.",
    "icon": "📈",
    "kpi1": {
      "label": "Tasa Global",
      "val": "65.0% Colocado"
    },
    "kpi2": {
      "label": "Capital Formalizado",
      "val": "US$ 2,255,000"
    },
    "kpi3": {
      "label": "Remanente Venta",
      "val": "US$ 1,195,000"
    },
    "headers": [
      "Tramo de la Torre",
      "Total Uds.",
      "Vendidas",
      "Disponibles",
      "Capital Colocado USD",
      "Remanente USD",
      "% Absorción"
    ],
    "rows": [
      [
        "Niveles 1 al 3 (Bajos)",
        "6",
        "4",
        "2",
        "$590,000.00",
        "$295,000.00",
        "66.67%"
      ],
      [
        "Niveles 4 al 6 (Medios)",
        "6",
        "4",
        "2",
        "$610,000.00",
        "$305,000.00",
        "66.67%"
      ],
      [
        "Niveles 7 al 9 (Altos)",
        "6",
        "3",
        "3",
        "$495,000.00",
        "$495,000.00",
        "50.00%"
      ],
      [
        "Nivel 10 (Penthouses)",
        "2",
        "1",
        "1",
        "$240,000.00",
        "$240,000.00",
        "50.00%"
      ],
      [
        "<strong>TOTAL CONDOMINIO:</strong>",
        "<strong>20</strong>",
        "<strong>12</strong>",
        "<strong>8</strong>",
        "<strong>$1,935,000.00</strong>",
        "<strong>$1,335,000.00</strong>",
        "<strong>60.00%</strong>"
      ]
    ],
    "rules": "Incluye desglose del 3% de impuesto de transferencia inmobiliaria ante la DGII por unidad.",
    "sql": "SELECT 'Nivel 1 al 5' AS tramo, 10 AS total, 7 AS vendidas, 3 AS libres, 1050000.0 AS colocado, 445000.0 AS remanente, 70.0 AS absorcion\nUNION ALL SELECT 'Nivel 6 al 10', 10, 6, 4, 1205000.0, 750000.0, 60.0;"
  },
  {
    "code": "REP-06",
    "category": "Fiscales DGII",
    "title": "Resumen Oficial de Comprobantes Fiscales Electrónicos e-CF Emitidos (Ley 32-23)",
    "module": "Facturación y Fiscalidad DGII",
    "roles": "Contador General, Auditor Tributario",
    "freq": "Diario / Mensual",
    "target": "Libro de Ventas Fiscales PDF",
    "goal": "Auditar la totalidad de comprobantes fiscales electrónicos timbrados ante la DGII con código QR y security code.",
    "icon": "🏛️",
    "kpi1": {
      "label": "Total Facturado",
      "val": "RD$ 152,474.58"
    },
    "kpi2": {
      "label": "e-CF Emitidos",
      "val": "28 Comprobantes"
    },
    "kpi3": {
      "label": "ITBIS Recaudado",
      "val": "RD$ 4,525.42"
    },
    "headers": [
      "e-NCF",
      "Tipo",
      "Emisión",
      "Receptor",
      "RNC / Cédula",
      "Subtotal DOP",
      "ITBIS 18%",
      "Total DOP",
      "Estatus DGII"
    ],
    "rows": [
      [
        "E320000000101",
        "Factura Consumo",
        "05/11/2026 10:14 AM",
        "Fernando Morales",
        "034-0028192-5",
        "RD$ 6,500.00",
        "RD$ 0.00 (Exento)",
        "RD$ 6,500.00",
        "<span class='badge badge-success'>Aceptado DGII</span>"
      ],
      [
        "E310000000054",
        "Crédito Fiscal",
        "02/11/2026 03:22 PM",
        "Consorcio Inversionisto",
        "132-45678-9",
        "RD$ 8,474.58",
        "RD$ 1,525.42",
        "RD$ 10,000.00",
        "<span class='badge badge-success'>Aceptado DGII</span>"
      ],
      [
        "E320000000102",
        "Factura Consumo",
        "05/11/2026 11:30 AM",
        "Alberto Gómez",
        "034-0019283-9",
        "RD$ 6,500.00",
        "RD$ 0.00 (Exento)",
        "RD$ 6,500.00",
        "<span class='badge badge-success'>Aceptado DGII</span>"
      ]
    ],
    "rules": "Conforme a la Ley 32-23, todo e-CF timbrado genera un archivo XML firmado digitalmente almacenado en el repositorio oficial.",
    "sql": "SELECT encf, type_name, issued_at, razon_social_receptor, rnc_receptor,\n       subtotal_dop, itbis_dop, total_dop, status\nFROM electronic_invoices\nWHERE strftime('%Y-%m', issued_at) = :mes_periodo\nORDER BY issued_at DESC;"
  },
  {
    "code": "REP-07",
    "category": "Fiscales DGII",
    "title": "Formato de Envío 607 DGII: Ventas de Bienes y Servicios",
    "module": "Facturación y Fiscalidad DGII",
    "roles": "Contador General",
    "freq": "Mensual (Antes del día 20)",
    "target": "Archivo TXT Delimitado + Resumen PDF",
    "goal": "Estructurar y exportar las ventas mensuales y cobros de mantenimiento conforme a la especificación técnica del Formato 607 DGII.",
    "icon": "🧾",
    "kpi1": {
      "label": "Registros Reportados",
      "val": "28 Filas TXT"
    },
    "kpi2": {
      "label": "Venta Neta Reportada",
      "val": "RD$ 152,474.58"
    },
    "kpi3": {
      "label": "Formato Validador",
      "val": "Validación 100% OK"
    },
    "headers": [
      "RNC / Cédula",
      "Tipo ID",
      "e-NCF",
      "Fecha",
      "Monto Facturado",
      "ITBIS 18%",
      "Forma Cobro"
    ],
    "rows": [
      [
        "03400281925",
        "2 (Cédula)",
        "E320000000101",
        "20261105",
        "RD$ 6,500.00",
        "RD$ 0.00",
        "02 (Transferencia)"
      ],
      [
        "132456789",
        "1 (RNC)",
        "E310000000054",
        "20261102",
        "RD$ 8,474.58",
        "RD$ 1,525.42",
        "04 (Tarjeta/PayPal)"
      ],
      [
        "03100882193",
        "2 (Cédula)",
        "E320000000102",
        "20261104",
        "RD$ 6,500.00",
        "RD$ 0.00",
        "02 (Transferencia)"
      ]
    ],
    "rules": "Genera el archivo TXT con estructura oficial RNC_EMISOR|PERIODO|CANTIDAD listo para la Oficina Virtual de la DGII.",
    "sql": "SELECT rnc_receptor, CASE WHEN length(rnc_receptor)=9 THEN 1 ELSE 2 END, encf,\n       strftime('%Y%m%d', issued_at), subtotal_dop, itbis_dop\nFROM electronic_invoices WHERE strftime('%Y-%m', issued_at) = :mes_declaracion;"
  },
  {
    "code": "REP-08",
    "category": "Fiscales DGII",
    "title": "Formato de Envío 608 DGII: Comprobantes Fiscales Anulados",
    "module": "Facturación y Fiscalidad DGII",
    "roles": "Contador General, Auditor",
    "freq": "Mensual",
    "target": "Archivo TXT y PDF",
    "goal": "Declarar ante la DGII las series de comprobantes fiscales cancelados por error de captura o anulación de contratos.",
    "icon": "🚫",
    "kpi1": {
      "label": "NCF Anulados",
      "val": "2 Comprobantes"
    },
    "kpi2": {
      "label": "Motivo Predominante",
      "val": "03 - Corrección Texto"
    },
    "kpi3": {
      "label": "Incidencia",
      "val": "1.3% del total"
    },
    "headers": [
      "e-NCF Anulado",
      "Fecha Baja",
      "Cód. Motivo",
      "Descripción Causal DGII",
      "Usuario Autorizó"
    ],
    "rows": [
      [
        "E320000000095",
        "20261015",
        "03",
        "03 - Error de digitación en RNC/Cédula",
        "admin@jardinesdelcerro.do"
      ],
      [
        "E310000000049",
        "20261022",
        "01",
        "01 - Deterioro de comprobante / Anulación",
        "admin@jardinesdelcerro.do"
      ]
    ],
    "rules": "Todo comprobante anulado requiere la previa aprobación del Administrador con firma de auditoría registrada.",
    "sql": "SELECT encf, strftime('%Y%m%d', cancelled_at), cancellation_reason_code, cancellation_desc\nFROM cancelled_invoices WHERE strftime('%Y-%m', cancelled_at) = :periodo;"
  },
  {
    "code": "REP-09",
    "category": "Fiscales DGII",
    "title": "Facturas con Crédito Fiscal Emitidas a Empresas y Contratistas (Tipo E31 / B01)",
    "module": "Facturación y Fiscalidad DGII",
    "roles": "Contador General, Empresas Adquirientes",
    "freq": "Mensual",
    "target": "Libro de Crédito Fiscal PDF",
    "goal": "Desglosar las facturas timbradas con derecho a deducción de gasto e ITBIS para personas jurídicas y comerciales.",
    "icon": "💼",
    "kpi1": {
      "label": "Total Crédito Fiscal",
      "val": "RD$ 35,474.58"
    },
    "kpi2": {
      "label": "ITBIS Deducible",
      "val": "RD$ 6,385.42"
    },
    "kpi3": {
      "label": "Empresas Receptoras",
      "val": "4 Sociedades S.R.L."
    },
    "headers": [
      "e-NCF E31",
      "RNC Empresa",
      "Razón Social Adquiriente",
      "Concepto Servicio",
      "Subtotal DOP",
      "ITBIS 18%",
      "Total Cobrado"
    ],
    "rows": [
      [
        "E310000000054",
        "132-45678-9",
        "Consorcio Inversionisto S.R.L.",
        "Licencia SaaS Administrador",
        "RD$ 8,474.58",
        "RD$ 1,525.42",
        "RD$ 10,000.00"
      ],
      [
        "E310000000055",
        "130-99182-1",
        "Servicios Médicos del Cibao S.R.L.",
        "Cuota Mantenimiento Oficina 102",
        "RD$ 12,000.00",
        "RD$ 2,160.00",
        "RD$ 14,160.00"
      ]
    ],
    "rules": "Solo se emiten facturas E31 cuando el RNC del receptor figura en estado 'Activo' en el padrón de contribuyentes de la DGII.",
    "sql": "SELECT encf, rnc_receptor, razon_social_receptor, concept, subtotal_dop, itbis_dop, total_dop\nFROM electronic_invoices WHERE type_id = '31' AND strftime('%Y-%m', issued_at) = :periodo;"
  },
  {
    "code": "REP-10",
    "category": "Fiscales DGII",
    "title": "Notas de Crédito Electrónicas Emitidas por Descuentos y Anulaciones (Tipo E34 / R34)",
    "module": "Facturación y Fiscalidad DGII",
    "roles": "Contador General, Auditor",
    "freq": "A demanda / Cierre Contable",
    "target": "Reporte de Ajustes Tributarios PDF",
    "goal": "Respaldar contablemente las deducciones, cancelaciones y devoluciones aplicadas sobre facturas previamente timbradas.",
    "icon": "📝",
    "kpi1": {
      "label": "Notas Emitidas",
      "val": "2 Documentos"
    },
    "kpi2": {
      "label": "Monto Acreditado",
      "val": "RD$ 8,011.89"
    },
    "kpi3": {
      "label": "ITBIS Reversado",
      "val": "RD$ 230.63"
    },
    "headers": [
      "Nota de Crédito (E34)",
      "NCF Afectado",
      "Fecha Emisión",
      "RNC Receptor",
      "Motivo de Emisión",
      "Monto Anulado"
    ],
    "rows": [
      [
        "E340000000012",
        "E310000000054",
        "08/11/2026",
        "132-45678-9",
        "Cancelación Suscripción Mensual",
        "-RD$ 1,511.89"
      ],
      [
        "E340000000011",
        "E320000000098",
        "28/10/2026",
        "034-0019283-9",
        "Ajuste de Saldo por Pago Duplicado",
        "-RD$ 6,500.00"
      ]
    ],
    "rules": "Las notas de crédito electrónicas reducen el debito fiscal del período corriente.",
    "sql": "SELECT encf, affected_encf, issued_at, razon_social_receptor, concept, total_dop\nFROM electronic_invoices WHERE type_id = '34' ORDER BY issued_at DESC;"
  },
  {
    "code": "REP-11",
    "category": "Fiscales DGII",
    "title": "Auditoría de ITBIS Recaudado y Retenciones Fiscales (Tasa 18%)",
    "module": "Facturación y Fiscalidad DGII",
    "roles": "Contador General, Auditor Externo",
    "freq": "Mensual",
    "target": "Cédula de Auditoría Fiscal PDF",
    "goal": "Conciliar la base imponible total, exenciones por vivienda habitacional y el ITBIS generado por servicios comerciales.",
    "icon": "🔍",
    "kpi1": {
      "label": "Base Exenta",
      "val": "RD$ 130,000.00"
    },
    "kpi2": {
      "label": "Base Gravada (18%)",
      "val": "RD$ 22,474.58"
    },
    "kpi3": {
      "label": "ITBIS por Pagar",
      "val": "RD$ 4,045.42"
    },
    "headers": [
      "Renglón Fiscal",
      "Total Facturado",
      "Monto Exento",
      "Base Imponible",
      "ITBIS Liquidado (18%)"
    ],
    "rows": [
      [
        "Cuotas Mantenimiento Habitacional",
        "RD$ 130,000.00",
        "RD$ 130,000.00",
        "RD$ 0.00",
        "RD$ 0.00 (Ley 173-07)"
      ],
      [
        "Servicios Administrativos Comerciales",
        "RD$ 22,474.58",
        "RD$ 0.00",
        "RD$ 22,474.58",
        "RD$ 4,045.42"
      ],
      [
        "<strong>TOTAL CONCILIADO:</strong>",
        "<strong>RD$ 152,474.58</strong>",
        "<strong>RD$ 130,000.00</strong>",
        "<strong>RD$ 22,474.58</strong>",
        "<strong>RD$ 4,045.42</strong>"
      ]
    ],
    "rules": "Sirve de base directa para el llenado de la Declaración Jurada de ITBIS (Formulario IT-1) ante la DGII.",
    "sql": "SELECT 'Cuotas Mantenimiento Residencial' AS renglon, 130000.0 AS fact, 130000.0 AS exento, 0.0 AS base, 0.0 AS itbis\nUNION ALL SELECT 'Servicios Administrativos & SaaS', 22474.58, 0.0, 22474.58, 4045.42;"
  },
  {
    "code": "REP-12",
    "category": "Cobranzas & Cuotas",
    "title": "Estado General de Cobranzas y Recaudación de Cuotas Ordinarias",
    "module": "Cobranzas y Cuotas",
    "roles": "Administrador, Junta de Condóminos",
    "freq": "Mensual",
    "target": "Informe de Gestión PDF",
    "goal": "Evaluar la tasa efectiva de cobro de las cuotas ordinarias de mantenimiento de los 20 apartamentos.",
    "icon": "💳",
    "kpi1": {
      "label": "Presupuesto Mes",
      "val": "RD$ 140,833.33"
    },
    "kpi2": {
      "label": "Recaudado Efectivo",
      "val": "RD$ 134,333.33"
    },
    "kpi3": {
      "label": "Tasa de Cobranza",
      "val": "95.4% de Eficiencia"
    },
    "headers": [
      "Unidad",
      "Propietario / Residente",
      "Alícuota %",
      "Cuota Asignada",
      "Monto Cobrado",
      "Saldo Pendiente",
      "Estatus"
    ],
    "rows": [
      [
        "APT-101",
        "Lic. Alberto Gómez",
        "4.6154%",
        "RD$ 6,500.00",
        "RD$ 6,500.00",
        "RD$ 0.00",
        "<span class='badge badge-success'>Pagada</span>"
      ],
      [
        "APT-102",
        "Ing. Luisa Ferreras",
        "4.6154%",
        "RD$ 6,500.00",
        "RD$ 6,500.00",
        "RD$ 0.00",
        "<span class='badge badge-success'>Pagada</span>"
      ],
      [
        "APT-201",
        "Ing. Roberto Minaya",
        "4.6154%",
        "RD$ 6,500.00",
        "RD$ 6,500.00",
        "RD$ 0.00",
        "<span class='badge badge-success'>Pagada</span>"
      ],
      [
        "APT-301",
        "Dr. Fernando Morales",
        "4.6154%",
        "RD$ 6,500.00",
        "RD$ 6,500.00",
        "RD$ 0.00",
        "<span class='badge badge-success'>Pagada</span>"
      ],
      [
        "PH-1001",
        "Lic. Danilo Peralta",
        "6.5385%",
        "RD$ 9,200.00",
        "RD$ 9,200.00",
        "RD$ 0.00",
        "<span class='badge badge-success'>Pagada</span>"
      ]
    ],
    "rules": "Las cuotas no liquidadas al día 5 devengan un recargo no acumulativo del 5%.",
    "sql": "SELECT p.unit_number, usr.full_name, u.aliquot_pct, p.amount_dop, p.paid_amount_dop,\n       (p.amount_dop - p.paid_amount_dop) AS pendiente, p.status\nFROM payments p\nJOIN units u ON p.unit_number = u.unit_number\nJOIN users usr ON usr.assigned_unit = u.unit_number\nWHERE p.period = :mes_cuota ORDER BY p.unit_number ASC;"
  },
  {
    "code": "REP-13",
    "category": "Cobranzas & Cuotas",
    "title": "Antigüedad de Saldos y Balance de Morosidad (30, 60, 90+ Días)",
    "module": "Cobranzas y Cuotas",
    "roles": "Administrador, Junta de Condóminos, Abogado de Cobro",
    "freq": "Quincenal",
    "target": "Documento de Cartera Vencida PDF",
    "goal": "Identificar las cuentas morosas agrupadas por antigüedad de vencimiento para iniciar acciones legales de embargo.",
    "icon": "⏳",
    "kpi1": {
      "label": "Cartera Vencida Total",
      "val": "RD$ 39,975.00"
    },
    "kpi2": {
      "label": "Unidades Morosas",
      "val": "3 de 20 Uds."
    },
    "kpi3": {
      "label": "Caso Crítico",
      "val": "Unidad 502 (>60 días)"
    },
    "headers": [
      "Unidad",
      "Titular",
      "Teléfono",
      "0-30 Días",
      "31-60 Días",
      "61-90 Días",
      ">90 Días",
      "Total Deuda",
      "Estado Cobro"
    ],
    "rows": [
      [
        "APT-502",
        "Lic. Juan Carlos Peña",
        "+1 (809) 555-1502",
        "RD$ 6,500.00",
        "RD$ 6,825.00",
        "RD$ 6,825.00",
        "RD$ 0.00",
        "RD$ 20,150.00",
        "<span class='badge badge-danger'>Intimación Notarial</span>"
      ],
      [
        "APT-701",
        "Marcos Rivas",
        "+1 (829) 555-1701",
        "RD$ 6,500.00",
        "RD$ 6,825.00",
        "RD$ 0.00",
        "RD$ 0.00",
        "RD$ 13,325.00",
        "<span class='badge badge-warning'>Recordatorio II</span>"
      ],
      [
        "APT-202",
        "Dra. Sofía Ventura",
        "+1 (809) 555-1202",
        "RD$ 6,500.00",
        "RD$ 0.00",
        "RD$ 0.00",
        "RD$ 0.00",
        "RD$ 6,500.00",
        "<span class='badge badge-neutral'>Aviso Preventivo</span>"
      ]
    ],
    "rules": "Las unidades con más de 60 días de mora quedan suspendidas automáticamente de su derecho a voto en asambleas.",
    "sql": "SELECT u.unit_number, usr.full_name, usr.phone,\n       SUM(CASE WHEN p.days_overdue <= 30 THEN p.balance ELSE 0 END),\n       SUM(CASE WHEN p.days_overdue BETWEEN 31 AND 60 THEN p.balance ELSE 0 END),\n       SUM(CASE WHEN p.days_overdue BETWEEN 61 AND 90 THEN p.balance ELSE 0 END),\n       SUM(CASE WHEN p.days_overdue > 90 THEN p.balance ELSE 0 END),\n       SUM(p.balance)\nFROM payments p JOIN units u ON p.unit_number = u.unit_number\nJOIN users usr ON usr.assigned_unit = u.unit_number WHERE p.status != 'Pagada' GROUP BY u.unit_number;"
  },
  {
    "code": "REP-14",
    "category": "Cobranzas & Cuotas",
    "title": "Estado de Cuenta Individual Consolidado por Residente",
    "module": "Cobranzas y Cuotas",
    "roles": "Residente (Portal Privado), Administrador",
    "freq": "Permanente / En Línea",
    "target": "Boleta Digital PDF y Pantalla",
    "goal": "Brindar al residente el histórico transparente de todas sus cuotas, abonos bancarios, pagos PayPal y comprobantes fiscales NCF.",
    "icon": "👤",
    "kpi1": {
      "label": "Saldo Actual",
      "val": "RD$ 0.00 (Al Día)"
    },
    "kpi2": {
      "label": "Último Pago",
      "val": "RD$ 6,500.00"
    },
    "kpi3": {
      "label": "Comprobante Fiscal",
      "val": "e-CF E320000000101"
    },
    "headers": [
      "Período",
      "Concepto",
      "Vencimiento",
      "Cuota DOP",
      "Recargo Mora",
      "Total Pagado",
      "Balance",
      "e-NCF DGII"
    ],
    "rows": [
      [
        "Noviembre 2026",
        "Cuota Ordinaria Mantenimiento",
        "05/11/2026",
        "RD$ 6,500.00",
        "RD$ 0.00",
        "RD$ 6,500.00",
        "RD$ 0.00",
        "E320000000101"
      ],
      [
        "Octubre 2026",
        "Cuota Ordinaria Mantenimiento",
        "05/10/2026",
        "RD$ 6,500.00",
        "RD$ 0.00",
        "RD$ 6,500.00",
        "RD$ 0.00",
        "E320000000088"
      ],
      [
        "Septiembre 2026",
        "Cuota Ordinaria Mantenimiento",
        "05/09/2026",
        "RD$ 6,500.00",
        "RD$ 0.00",
        "RD$ 6,500.00",
        "RD$ 0.00",
        "E320000000072"
      ]
    ],
    "rules": "Incluye botón para descargar la Representación Impresa (RI) oficial del e-CF lista para declarar.",
    "sql": "SELECT period, concept, due_date, amount_dop, late_fee_dop, paid_amount_dop,\n       (amount_dop + late_fee_dop - paid_amount_dop) AS saldo, ncf_reference\nFROM payments WHERE unit_number = :unidad_id ORDER BY due_date DESC;"
  },
  {
    "code": "REP-15",
    "category": "Cobranzas & Cuotas",
    "title": "Conciliación de Pagos por Canal (PayPal vs Banco Popular / BHD / Banreservas)",
    "module": "Cobranzas y Cuotas",
    "roles": "Tesorero, Contador, Administrador",
    "freq": "Semanal / Cierre de Mes",
    "target": "Cédula de Conciliación PDF",
    "goal": "Cuadrar las entradas de fondos en las diferentes cuentas bancarias y pasarelas de pago internacionales.",
    "icon": "🏦",
    "kpi1": {
      "label": "Total Cobrado",
      "val": "RD$ 134,333.33"
    },
    "kpi2": {
      "label": "Vía Bancos Locales",
      "val": "78.4%"
    },
    "kpi3": {
      "label": "Vía PayPal USD",
      "val": "21.6%"
    },
    "headers": [
      "Canal de Recaudación",
      "N° Transacciones",
      "Moneda Origen",
      "Monto Liquidado DOP",
      "% Participación"
    ],
    "rows": [
      [
        "Banco Popular Dominicano (Transferencias)",
        "9",
        "RD$ 61,500.00",
        "RD$ 61,500.00",
        "45.78%"
      ],
      [
        "Banreservas (Depósitos & Nóminas)",
        "6",
        "RD$ 43,833.33",
        "RD$ 43,833.33",
        "32.63%"
      ],
      [
        "PayPal REST API (Tarjetas USD)",
        "4",
        "US$ 479.33",
        "RD$ 29,000.00",
        "21.59%"
      ],
      [
        "<strong>TOTAL RECAUDADO:</strong>",
        "<strong>19</strong>",
        "-",
        "<strong>RD$ 134,333.33</strong>",
        "<strong>100.00%</strong>"
      ]
    ],
    "rules": "Los pagos procesados por PayPal se registran a la tasa oficial del día certificada por el Banco Central de la R.D.",
    "sql": "SELECT payment_method, COUNT(id), SUM(amount_dop),\n       ROUND(SUM(amount_dop)*100.0 / (SELECT SUM(amount_dop) FROM payments WHERE created_at BETWEEN :fecha_desde AND :fecha_hasta), 2)\nFROM payments WHERE created_at BETWEEN :fecha_desde AND :fecha_hasta GROUP BY payment_method;"
  },
  {
    "code": "REP-16",
    "category": "Cobranzas & Cuotas",
    "title": "Liquidación de Recargos por Mora e Intereses Estatutarios (5%)",
    "module": "Cobranzas y Cuotas",
    "roles": "Administrador, Contador",
    "freq": "Mensual (Día 6 de cada mes)",
    "target": "Sábana de Recargos PDF",
    "goal": "Calcular y asentar automáticamente los recargos estatutarios del 5% aplicados a las unidades que no saldaron su cuota antes del día 5.",
    "icon": "⚠️",
    "kpi1": {
      "label": "Recargos Aplicados",
      "val": "RD$ 1,950.00"
    },
    "kpi2": {
      "label": "Unidades Afectadas",
      "val": "3 Unidades"
    },
    "kpi3": {
      "label": "Base Liquidada",
      "val": "RD$ 39,000.00"
    },
    "headers": [
      "Unidad",
      "Residente Deudor",
      "Cuota Base DOP",
      "% Mora Estatutario",
      "Recargo DOP",
      "Total Exigible DOP"
    ],
    "rows": [
      [
        "APT-502",
        "Lic. Juan Carlos Peña",
        "RD$ 6,500.00",
        "5.00%",
        "RD$ 325.00",
        "RD$ 6,825.00"
      ],
      [
        "APT-701",
        "Marcos Rivas",
        "RD$ 6,500.00",
        "5.00%",
        "RD$ 325.00",
        "RD$ 6,825.00"
      ],
      [
        "APT-202",
        "Dra. Sofía Ventura",
        "RD$ 6,500.00",
        "5.00%",
        "RD$ 325.00",
        "RD$ 6,825.00"
      ]
    ],
    "rules": "Los fondos recaudados por penalidades de mora ingresan directamente al Fondo de Reserva y Contingencias de la torre.",
    "sql": "SELECT p.unit_number, usr.full_name, p.amount_dop, 5.0 AS tasa_mora,\n       ROUND(p.amount_dop * 0.05, 2) AS recargo, ROUND(p.amount_dop * 1.05, 2) AS total\nFROM payments p JOIN users usr ON usr.assigned_unit = p.unit_number\nWHERE p.period = :periodo AND p.status != 'Pagada';"
  },
  {
    "code": "REP-17",
    "category": "Padrón & Residentes",
    "title": "Padrón Oficial Consolidado de Copropietarios y Coeficientes de Alícuotas (Ley 5038)",
    "module": "Padrón y Residentes",
    "roles": "Administración, Notario, Registro de Títulos",
    "freq": "Anual / En traspasos",
    "target": "Documento Legal A4 PDF",
    "goal": "Emitir la lista legal certificada de todos los propietarios legítimos con sus coeficientes de copropiedad para fines notariales.",
    "icon": "📜",
    "kpi1": {
      "label": "Total Propietarios",
      "val": "20 Titulares"
    },
    "kpi2": {
      "label": "Suma Alícuotas",
      "val": "100.0000% Exacto"
    },
    "kpi3": {
      "label": "Área Total Torre",
      "val": "2,600.00 m²"
    },
    "headers": [
      "Unidad",
      "Propietario Registrado",
      "Cédula / RNC",
      "Desig. Catastral",
      "Superficie",
      "Alícuota %",
      "Firma Titular"
    ],
    "rows": [
      [
        "APT-101",
        "Lic. Alberto Gómez",
        "034-0019283-9",
        "DC-04-0101",
        "145.00 m²",
        "4.6154%",
        "_________________"
      ],
      [
        "APT-102",
        "Ing. Luisa Ferreras",
        "031-0081223-1",
        "DC-04-0102",
        "145.00 m²",
        "4.6154%",
        "_________________"
      ],
      [
        "APT-201",
        "Ing. Roberto Minaya",
        "031-0088219-3",
        "DC-04-0201",
        "145.00 m²",
        "4.6154%",
        "_________________"
      ],
      [
        "PH-1001",
        "Lic. Danilo Peralta",
        "031-0011223-4",
        "DC-04-1001",
        "207.50 m²",
        "6.5385%",
        "_________________"
      ],
      [
        "PH-1002",
        "Dra. Yolanda Cruz",
        "034-0019921-2",
        "DC-04-1002",
        "207.50 m²",
        "6.5385%",
        "_________________"
      ]
    ],
    "rules": "Base jurídica exigida para constituir legalmente las asambleas del consorcio conforme a la Ley 5038.",
    "sql": "SELECT u.unit_number, usr.full_name, usr.document_id, 'DC-MAO-2026-' || u.unit_number,\n       (u.area_sqm + (u.parking_spaces * 12.5)), u.aliquot_pct\nFROM units u JOIN users usr ON usr.assigned_unit = u.unit_number AND usr.role = 'Propietario' ORDER BY u.unit_number ASC;"
  },
  {
    "code": "REP-18",
    "category": "Padrón & Residentes",
    "title": "Directorio General de Inquilinos y Residentes Aprobados",
    "module": "Padrón y Residentes",
    "roles": "Administración, Conserjería, Seguridad",
    "freq": "Operativa / Diaria",
    "target": "Directorio Digital / PDF",
    "goal": "Mantener actualizada la base de datos de habitantes reales de la torre para control de accesos peatonales y correspondencia.",
    "icon": "👥",
    "kpi1": {
      "label": "Habitantes Activos",
      "val": "64 Personas"
    },
    "kpi2": {
      "label": "Tasa Propietarios",
      "val": "60% Residen"
    },
    "kpi3": {
      "label": "Tasa Arrendatarios",
      "val": "40% Inquilinos"
    },
    "headers": [
      "Unidad",
      "Residente Habitante",
      "Condición",
      "Teléfono Móvil",
      "Correo Electrónico",
      "Estatus Acceso"
    ],
    "rows": [
      [
        "APT-101",
        "Lic. Alberto Gómez",
        "<span class='badge badge-primary'>Propietario</span>",
        "+1 (809) 555-1101",
        "agomez@gmail.com",
        "<span class='badge badge-success'>Activo</span>"
      ],
      [
        "APT-201",
        "Ing. Roberto Minaya",
        "<span class='badge badge-primary'>Propietario</span>",
        "+1 (809) 555-1201",
        "rminaya@outlook.com",
        "<span class='badge badge-success'>Activo</span>"
      ],
      [
        "APT-301",
        "Dr. Fernando Morales",
        "<span class='badge badge-accent'>Inquilino</span>",
        "+1 (809) 555-1301",
        "fmorales@medicina.do",
        "<span class='badge badge-success'>Activo</span>"
      ]
    ],
    "rules": "Solo los residentes debidamente aprobados en el padrón reciben autorización para uso de la piscina y salón social.",
    "sql": "SELECT u.unit_number, usr.full_name, usr.role, usr.phone, usr.email, usr.is_active\nFROM users usr JOIN units u ON usr.assigned_unit = u.unit_number ORDER BY u.unit_number ASC;"
  },
  {
    "code": "REP-19",
    "category": "Padrón & Residentes",
    "title": "Expedientes de Solicitudes de Registro y Contratos Notariados",
    "module": "Padrón y Residentes",
    "roles": "Administrador, Asesor Legal",
    "freq": "Semanal",
    "target": "Panel de Auditoría Legal PDF",
    "goal": "Fiscalizar el cumplimiento notarial de los contratos de arrendamiento y compraventa subidos por los usuarios antes de otorgar acceso.",
    "icon": "📁",
    "kpi1": {
      "label": "Expedientes Procesados",
      "val": "22 Expedientes"
    },
    "kpi2": {
      "label": "Aprobados Notariales",
      "val": "20 Contratos (91%)"
    },
    "kpi3": {
      "label": "Rechazados",
      "val": "2 Observados"
    },
    "headers": [
      "Folio Solicitud",
      "Fecha Radicación",
      "Postulante",
      "Cédula / ID",
      "Unidad",
      "Expediente Digital",
      "Dictamen Legal"
    ],
    "rows": [
      [
        "REQ-012",
        "16/11/2026 04:15 PM",
        "Dra. Carmen Paulino",
        "034-0011822-1",
        "APT-402",
        "Contrato_Notariado.pdf",
        "<span class='badge badge-warning'>En Verificación</span>"
      ],
      [
        "REQ-011",
        "14/11/2026 11:20 AM",
        "Ing. Daniel Vargas",
        "031-0044910-8",
        "APT-601",
        "Titulo_Propiedad.pdf",
        "<span class='badge badge-success'>Aprobado</span>"
      ],
      [
        "REQ-010",
        "12/11/2026 09:05 AM",
        "Marcos Henríquez",
        "034-0099182-3",
        "APT-202",
        "Hoja_Simple.pdf",
        "<span class='badge badge-danger'>Rechazado (Sin Notario)</span>"
      ]
    ],
    "rules": "Es obligatorio que todo contrato de alquiler cuente con la firma legalizada por Notario Público de la Jurisdicción de Mao.",
    "sql": "SELECT id, created_at, full_name, id_document, unit_number, contract_pdf_path, status\nFROM registration_requests ORDER BY created_at DESC;"
  },
  {
    "code": "REP-20",
    "category": "Padrón & Residentes",
    "title": "Registro y Asignación de Parqueos y Control de Vehículos",
    "module": "Padrón y Residentes",
    "roles": "Seguridad 24/7, Conserjería, Administrador",
    "freq": "Operativa / Diaria",
    "target": "Listado de Garita PDF",
    "goal": "Controlar el uso de los 43 estacionamientos de la torre, asociando cada cajón a una placa y modelo de vehículo.",
    "icon": "🚗",
    "kpi1": {
      "label": "Total Cajones",
      "val": "43 Parqueos"
    },
    "kpi2": {
      "label": "Vehículos Registrados",
      "val": "38 Autos"
    },
    "kpi3": {
      "label": "Parqueos Visitas",
      "val": "5 Libres"
    },
    "headers": [
      "Unidad",
      "Habitante",
      "Parqueos Asignados",
      "Placa Oficial",
      "Vehículo Registrado",
      "Tag RFID Portón"
    ],
    "rows": [
      [
        "APT-101",
        "Lic. Alberto Gómez",
        "PK-01 y PK-02",
        "A912831",
        "Toyota RAV4 2024 Blanca",
        "TAG-101-A"
      ],
      [
        "APT-201",
        "Ing. Roberto Minaya",
        "PK-03 y PK-04",
        "G381920",
        "Hyundai Tucson 2023 Negra",
        "TAG-201-A"
      ],
      [
        "APT-301",
        "Dr. Fernando Morales",
        "PK-05 y PK-06",
        "A771829",
        "Honda Accord 2022 Blanco",
        "TAG-301-A"
      ],
      [
        "PH-1001",
        "Lic. Danilo Peralta",
        "PK-19, PK-20, PK-21",
        "G102938",
        "Lexus RX350 2025 Azul",
        "TAG-1001-A"
      ]
    ],
    "rules": "Vehículos sin Tag RFID o estacionados en cajones ajenos son pasibles de inmovilización y multa administrativa.",
    "sql": "SELECT u.unit_number, usr.full_name, 'PK-' || u.unit_number, usr.vehicle_plate, usr.vehicle_model, 'RFID-' || u.unit_number\nFROM users usr JOIN units u ON usr.assigned_unit = u.unit_number;"
  },
  {
    "code": "REP-21",
    "category": "Padrón & Residentes",
    "title": "Directorio de Contactos de Emergencia por Unidad Habitacional",
    "module": "Padrón y Residentes",
    "roles": "Conserje Principal, Administrador, Bomberos Mao",
    "freq": "Permanente",
    "target": "Carpeta de Seguridad Física y PDF",
    "goal": "Proveer a la administración y cuerpos de socorro de Mao los contactos inmediatos ante emergencias médicas o siniestros en cada piso.",
    "icon": "📞",
    "kpi1": {
      "label": "Unidades Cobertura",
      "val": "20 de 20 Uds. (100%)"
    },
    "kpi2": {
      "label": "Contactos Registrados",
      "val": "40 Números"
    },
    "kpi3": {
      "label": "Verificación",
      "val": "Actualizado Nov 2026"
    },
    "headers": [
      "Unidad",
      "Residente",
      "Celular Principal",
      "Contacto de Emergencia",
      "Vínculo",
      "Teléfono Emergencia"
    ],
    "rows": [
      [
        "APT-101",
        "Lic. Alberto Gómez",
        "+1 (809) 555-1101",
        "Margarita Gómez",
        "Hermana",
        "+1 (809) 555-9011"
      ],
      [
        "APT-201",
        "Ing. Roberto Minaya",
        "+1 (809) 555-1201",
        "Dra. Elena Ramos",
        "Esposa",
        "+1 (809) 555-9022"
      ],
      [
        "APT-301",
        "Dr. Fernando Morales",
        "+1 (809) 555-1301",
        "Lic. Pedro Morales",
        "Padre",
        "+1 (809) 555-9033"
      ],
      [
        "PH-1001",
        "Lic. Danilo Peralta",
        "+1 (829) 555-1901",
        "Oficina Corporativa",
        "Representante Legal",
        "+1 (809) 555-9044"
      ]
    ],
    "rules": "Información estrictamente confidencial bajo custodia de la Administración de la Torre.",
    "sql": "SELECT u.unit_number, usr.full_name, usr.phone, usr.emergency_contact, 'Familiar Directo', usr.emergency_phone\nFROM users usr JOIN units u ON usr.assigned_unit = u.unit_number;"
  },
  {
    "code": "REP-22",
    "category": "Finanzas & Egresos",
    "title": "Estado de Flujo de Caja Mensual del Condominio (Ingresos vs Egresos)",
    "module": "Finanzas y Egresos",
    "roles": "Junta de Condóminos, Propietarios, Contador",
    "freq": "Mensual",
    "target": "Documento Financiero PDF",
    "goal": "Rendir cuentas a los condóminos de la totalidad de entradas de dinero contra los desembolsos de nómina, energía y mantenimiento.",
    "icon": "💰",
    "kpi1": {
      "label": "Ingresos Recaudados",
      "val": "RD$ 144,500.00"
    },
    "kpi2": {
      "label": "Egresos Operativos",
      "val": "RD$ 110,300.00"
    },
    "kpi3": {
      "label": "Superávit del Mes",
      "val": "+RD$ 34,200.00"
    },
    "headers": [
      "Categoría Financiera",
      "Partida Presupuestaria",
      "Entradas DOP",
      "Salidas DOP",
      "Balance Neto"
    ],
    "rows": [
      [
        "Ingresos Condominio",
        "Recaudación Cuotas Ordinarias Mantenimiento",
        "RD$ 136,500.00",
        "-",
        "+RD$ 136,500.00"
      ],
      [
        "Ingresos Extraordinarios",
        "Alquiler Salón Social & Rooftop para Eventos",
        "RD$ 8,000.00",
        "-",
        "+RD$ 8,000.00"
      ],
      [
        "Gastos de Personal",
        "Nómina Conserjería & Limpieza Mao",
        "-",
        "RD$ 45,000.00",
        "-RD$ 45,000.00"
      ],
      [
        "Servicios Públicos",
        "Edenorte (Iluminación Áreas Comunes y Ascensor)",
        "-",
        "RD$ 29,800.00",
        "-RD$ 29,800.00"
      ],
      [
        "Equipos y Combustibles",
        "Gasoil Planta Eléctrica 150 kVA",
        "-",
        "RD$ 24,000.00",
        "-RD$ 24,000.00"
      ],
      [
        "Mantenimiento & Insumos",
        "Químicos Piscina Rooftop y Repuestos Menores",
        "-",
        "RD$ 11,500.00",
        "-RD$ 11,500.00"
      ],
      [
        "<strong>TOTALES DEL PERÍODO:</strong>",
        "<strong>Superávit Operativo Neto</strong>",
        "<strong>RD$ 144,500.00</strong>",
        "<strong>RD$ 110,300.00</strong>",
        "<strong>+RD$ 34,200.00</strong>"
      ]
    ],
    "rules": "Auditado mensualmente por el Comité de Vigilancia y enviado por correo a los propietarios.",
    "sql": "SELECT 'Ingresos' AS cat, 'Cuotas Ordinarias' AS desc, 136500.0 AS ent, 0.0 AS sal, 136500.0 AS neto\nUNION ALL SELECT 'Gastos', 'Nómina Conserjería', 0.0, 45000.0, -45000.0\nUNION ALL SELECT 'Gastos', 'Edenorte Electricidad', 0.0, 29800.0, -29800.0;"
  },
  {
    "code": "REP-23",
    "category": "Finanzas & Egresos",
    "title": "Cuentas por Pagar a Proveedores y Suplidores de la Torre (CXP)",
    "module": "Finanzas y Egresos",
    "roles": "Administrador, Tesorería",
    "freq": "Semanal",
    "target": "Sábana de CXP en PDF",
    "goal": "Gestionar los compromisos de pago con contratistas locales para evitar cortes de suministros críticos.",
    "icon": "🛒",
    "kpi1": {
      "label": "CXP Pendientes",
      "val": "RD$ 78,300.00"
    },
    "kpi2": {
      "label": "Facturas por Pagar",
      "val": "3 Facturas"
    },
    "kpi3": {
      "label": "Próximo Vencimiento",
      "val": "20 Nov (Ascensor)"
    },
    "headers": [
      "N° Factura",
      "Proveedor / Suplidor",
      "RNC Suplidor",
      "Concepto de Servicio",
      "Vencimiento",
      "Importe DOP",
      "Estatus"
    ],
    "rows": [
      [
        "FAC-4410",
        "Elevadores del Cibao S.R.L.",
        "130-88129-4",
        "Póliza Mantenimiento Ascensor",
        "20/11/2026",
        "RD$ 28,000.00",
        "<span class='badge badge-success'>Aprobada</span>"
      ],
      [
        "FAC-8921",
        "Estación Texaco Mao Centro",
        "101-92831-2",
        "Gasoil Óptimo Planta 150 kVA",
        "25/11/2026",
        "RD$ 42,500.00",
        "<span class='badge badge-warning'>Pendiente</span>"
      ],
      [
        "FAC-1092",
        "ServiQuímicos Valverde",
        "131-00291-8",
        "Cloro y Alguicida Piscina Rooftop",
        "30/11/2026",
        "RD$ 7,800.00",
        "<span class='badge badge-warning'>Pendiente</span>"
      ]
    ],
    "rules": "Las facturas que no incluyan NCF B01 de Crédito Fiscal no pueden ser liquidadas por Tesorería.",
    "sql": "SELECT invoice_num, supplier_name, rnc, concept, due_date, amount_dop, status\nFROM supplier_invoices WHERE status != 'Pagada' ORDER BY due_date ASC;"
  },
  {
    "code": "REP-24",
    "category": "Finanzas & Egresos",
    "title": "Movimientos Históricos y Balance del Fondo de Reserva y Contingencias",
    "module": "Finanzas y Egresos",
    "roles": "Junta de Condóminos, Administrador, Auditor",
    "freq": "Mensual / Anual",
    "target": "Libro de Fondo de Reserva PDF",
    "goal": "Monitorear el fondo patrimonial intangible acumulado del 5% estatutario reservado para siniestros y contingencias mayores.",
    "icon": "🛡️",
    "kpi1": {
      "label": "Balance Fondo",
      "val": "RD$ 336,624.66"
    },
    "kpi2": {
      "label": "Aportes del Año",
      "val": "RD$ 77,458.26"
    },
    "kpi3": {
      "label": "Retiros Autorizados",
      "val": "RD$ 22,500.00 (Planta)"
    },
    "headers": [
      "Fecha",
      "Tipo",
      "Concepto / Justificación",
      "Acta Asamblea",
      "Aporte DOP",
      "Retiro DOP",
      "Balance Acumulado"
    ],
    "rows": [
      [
        "01/10/2026",
        "<span class='badge badge-success'>Aporte Ordinario</span>",
        "Aporte Estatutario 5% Cuotas Octubre",
        "Estatuto Art. 18",
        "RD$ 7,041.66",
        "RD$ 0.00",
        "RD$ 352,083.00"
      ],
      [
        "01/11/2026",
        "<span class='badge badge-success'>Aporte Ordinario</span>",
        "Aporte Estatutario 5% Cuotas Noviembre",
        "Estatuto Art. 18",
        "RD$ 7,041.66",
        "RD$ 0.00",
        "RD$ 359,124.66"
      ],
      [
        "15/11/2026",
        "<span class='badge badge-danger'>Retiro Autorizado</span>",
        "Reparación Módulo Tarjeta Planta 150 kVA",
        "Acta Extra-03/2026",
        "RD$ 0.00",
        "RD$ 22,500.00",
        "RD$ 336,624.66"
      ]
    ],
    "rules": "Cualquier retiro del Fondo de Reserva requiere votación afirmativa del 75% de las alícuotas en asamblea.",
    "sql": "SELECT date, type, description, assembly_act_num, credit_dop, debit_dop, running_balance_dop\nFROM reserve_fund_ledger WHERE strftime('%Y', date) = CAST(:año_fiscal AS TEXT) ORDER BY date ASC;"
  },
  {
    "code": "REP-25",
    "category": "Finanzas & Egresos",
    "title": "Comparativo de Presupuesto Ejecutado vs Presupuesto Proyectado Anual",
    "module": "Finanzas y Egresos",
    "roles": "Junta de Condóminos, Administrador, Asamblea",
    "freq": "Trimestral / Anual",
    "target": "Informe Financiero Analítico PDF",
    "goal": "Evaluar la disciplina financiera del condominio y detectar variaciones presupuestarias para fijar las cuotas del año entrante.",
    "icon": "📉",
    "kpi1": {
      "label": "Presupuesto Proyectado",
      "val": "RD$ 1,830,000.00"
    },
    "kpi2": {
      "label": "Gasto Real Ejecutado",
      "val": "RD$ 1,824,700.00"
    },
    "kpi3": {
      "label": "Desviación Global",
      "val": "-0.3% (Favorable)"
    },
    "headers": [
      "Capítulo del Gasto",
      "Presupuestado DOP",
      "Ejecutado DOP",
      "Desviación",
      "% Ejecución"
    ],
    "rows": [
      [
        "Servicios Básicos (Edenorte / INAPA)",
        "RD$ 420,000.00",
        "RD$ 398,500.00",
        "-RD$ 21,500.00",
        "94.8% (Favorable)"
      ],
      [
        "Seguridad Privada & Vigilancia",
        "RD$ 780,000.00",
        "RD$ 780,000.00",
        "RD$ 0.00",
        "100.0% (Exacto)"
      ],
      [
        "Mantenimiento Ascensor y Generador",
        "RD$ 450,000.00",
        "RD$ 482,000.00",
        "+RD$ 32,000.00",
        "107.1% (Excedido)"
      ],
      [
        "Insumos Piscina, Limpieza y Áreas",
        "RD$ 180,000.00",
        "RD$ 164,200.00",
        "-RD$ 15,800.00",
        "91.2% (Favorable)"
      ],
      [
        "<strong>TOTAL GENERAL:</strong>",
        "<strong>RD$ 1,830,000.00</strong>",
        "<strong>RD$ 1,824,700.00</strong>",
        "<strong>-RD$ 5,300.00</strong>",
        "<strong>99.7%</strong>"
      ]
    ],
    "rules": "Cualquier excedente neto al final del ejercicio fiscal se traslada al Fondo de Reserva de la torre.",
    "sql": "SELECT chapter_name, projected_amount, executed_amount, (executed_amount - projected_amount),\n       ROUND(executed_amount*100.0 / projected_amount, 1)\nFROM budget_tracking WHERE fiscal_year = :año_fiscal;"
  },
  {
    "code": "REP-26",
    "category": "Mantenimiento & Activos",
    "title": "Registro y Seguimiento de Tickets de Averías e Incidencias por Estado",
    "module": "Mantenimiento y Activos",
    "roles": "Conserje, Técnico, Administrador, Residentes",
    "freq": "Operativa / Diaria",
    "target": "Tablero de Incidencias PDF",
    "goal": "Monitorear la resolución de averías reportadas en áreas comunes y apartamentos, midiendo tiempos de respuesta.",
    "icon": "🔧",
    "kpi1": {
      "label": "Tickets del Mes",
      "val": "14 Reportes"
    },
    "kpi2": {
      "label": "Tasa Resolución",
      "val": "85.7% Resueltos"
    },
    "kpi3": {
      "label": "Tiempo Medio",
      "val": "4.2 Horas"
    },
    "headers": [
      "N° Ticket",
      "Fecha / Hora",
      "Ubicación",
      "Categoría",
      "Descripción",
      "Prioridad",
      "Técnico Asignado",
      "Estado"
    ],
    "rows": [
      [
        "#104",
        "18/11/2026 08:30 AM",
        "Planta Nivel 1",
        "Eléctrico",
        "Ruido inusual en alternador planta 150 kVA",
        "<span class='badge badge-danger'>Urgente</span>",
        "Ing. Marcos Peña (Texaco)",
        "<span class='badge badge-warning'>En Proceso</span>"
      ],
      [
        "#103",
        "17/11/2026 02:10 PM",
        "Pasillo Nivel 4",
        "Iluminación",
        "Lámpara LED parpadeando frente al ascensor",
        "<span class='badge badge-neutral'>Baja</span>",
        "Conserje Manuel",
        "<span class='badge badge-success'>Resuelto</span>"
      ],
      [
        "#102",
        "15/11/2026 10:15 AM",
        "Rooftop Nivel 10",
        "Piscina",
        "Bomba dosificadora de cloro descalibrada",
        "<span class='badge badge-warning'>Media</span>",
        "ServiQuímicos Valverde",
        "<span class='badge badge-success'>Resuelto</span>"
      ]
    ],
    "rules": "Las incidencias catalogadas 'Urgente' deben ser intervenidas en un plazo máximo de 2 horas hábiles.",
    "sql": "SELECT id, created_at, unit_number, category, title, priority, assigned_technician, status\nFROM maintenance_tickets ORDER BY created_at DESC;"
  },
  {
    "code": "REP-27",
    "category": "Mantenimiento & Activos",
    "title": "Bitácora Operativa de Equipos Críticos (Planta 150 kVA, Ascensor, Piscina)",
    "module": "Mantenimiento y Activos",
    "roles": "Conserje de Planta, Técnico Mecánico, Administrador",
    "freq": "Semanal / Mensual",
    "target": "Registro de Telemetría PDF",
    "goal": "Rastrear horas de uso de motor, nivel de combustible diésel, presión de lubricación y ciclos del ascensor.",
    "icon": "⚡",
    "kpi1": {
      "label": "Horas Planta",
      "val": "428.5 Horas"
    },
    "kpi2": {
      "label": "Combustible Tanque",
      "val": "92% Óptimo"
    },
    "kpi3": {
      "label": "Viajes Ascensor",
      "val": "18,410 Ciclos"
    },
    "headers": [
      "Fecha / Hora",
      "Equipo Mayor",
      "Horómetro / Uso",
      "Nivel Combustible",
      "Presión Aceite",
      "Voltaje / Frecuencia",
      "Inspector Técnico"
    ],
    "rows": [
      [
        "18/11/2026 07:00 AM",
        "Generador Diésel Cummins 150 kVA",
        "428.5 hrs",
        "92% (Lleno)",
        "55 PSI",
        "220 V / 60.1 Hz",
        "Manuel Taveras"
      ],
      [
        "17/11/2026 06:00 PM",
        "Ascensor Pasajeros Schindler (8 Pax)",
        "18,410 viajes",
        "N/A",
        "Normal",
        "220 V / 60.0 Hz",
        "Manuel Taveras"
      ],
      [
        "17/11/2026 08:00 AM",
        "Bomba Sumergible Cisterna 5 HP",
        "1,210.0 hrs",
        "N/A",
        "42 PSI",
        "220 V / 60.0 Hz",
        "Manuel Taveras"
      ]
    ],
    "rules": "Cualquier reporte con nivel de combustible inferior a 40% dispara reposición inmediata de 100 galones.",
    "sql": "SELECT timestamp, asset_name, hour_meter, fuel_pct, oil_pressure, voltage_hz, inspector_name\nFROM asset_operational_logs ORDER BY timestamp DESC;"
  },
  {
    "code": "REP-28",
    "category": "Mantenimiento & Activos",
    "title": "Hoja de Vida y Plan de Mantenimiento Preventivo de Infraestructura Mayor",
    "module": "Mantenimiento y Activos",
    "roles": "Administrador, Comité de Propietarios, Compañía Aseguradora",
    "freq": "Semestral / Anual",
    "target": "Dossier Técnico A4 PDF",
    "goal": "Acreditar el plan de conservación preventiva, vigencia de garantías y pólizas de mantenimiento de los activos mayores.",
    "icon": "🛠️",
    "kpi1": {
      "label": "Valor Activos Mayores",
      "val": "US$ 82,000.00"
    },
    "kpi2": {
      "label": "Pólizas Vigentes",
      "val": "3 Pólizas 100%"
    },
    "kpi3": {
      "label": "Próximo Servicio",
      "val": "10 Dic (Ascensor)"
    },
    "headers": [
      "Activo",
      "Descripción Técnica",
      "Instalación",
      "Costo USD",
      "Póliza / Contratista",
      "Próximo Servicio",
      "Condición"
    ],
    "rows": [
      [
        "ACT-GEN-01",
        "Generador Diésel Cummins 150 kVA con Transferencia Automática",
        "15/08/2026",
        "$28,500.00",
        "ElectroDiésel Valverde (RNC 101-92831-2)",
        "15/02/2027",
        "<span class='badge badge-success'>Excelente</span>"
      ],
      [
        "ACT-ASC-01",
        "Ascensor Schindler 8 Pasajeros (Cabina Acero Inoxidable)",
        "10/09/2026",
        "$34,000.00",
        "Elevadores del Cibao S.R.L. (RNC 130-88129-4)",
        "10/12/2026",
        "<span class='badge badge-success'>Excelente</span>"
      ],
      [
        "ACT-PIS-01",
        "Piscina Panorámica Rooftop & Sistema Filtrado Salino",
        "01/09/2026",
        "$19,500.00",
        "ServiQuímicos Valverde",
        "01/12/2026",
        "<span class='badge badge-success'>Excelente</span>"
      ]
    ],
    "rules": "Exigido por las compañías aseguradoras para renovar la póliza multirriesgo de la torre.",
    "sql": "SELECT asset_code, name, installation_date, original_cost_usd, maintenance_contractor, next_scheduled_service, condition_status\nFROM common_assets;"
  },
  {
    "code": "REP-29",
    "category": "Mantenimiento & Activos",
    "title": "Consolidado de Costos de Reparación por Especialidad Técnica",
    "module": "Mantenimiento y Activos",
    "roles": "Administrador, Junta de Condóminos, Contador",
    "freq": "Trimestral",
    "target": "Informe de Costos PDF",
    "goal": "Evaluar la distribución del gasto de mantenimiento correctivo por rubro para optimizar contrataciones futuras.",
    "icon": "🔩",
    "kpi1": {
      "label": "Gasto Trimestre",
      "val": "RD$ 92,250.00"
    },
    "kpi2": {
      "label": "Rubro Principal",
      "val": "Equipos Mayores (48%)"
    },
    "kpi3": {
      "label": "Órdenes Totales",
      "val": "18 Servicios"
    },
    "headers": [
      "Especialidad Técnica",
      "N° Órdenes",
      "Mano de Obra DOP",
      "Piezas / Insumos DOP",
      "Total Acumulado DOP",
      "% Incidencia"
    ],
    "rows": [
      [
        "Equipos Mayores (Planta & Ascensor)",
        "3",
        "RD$ 18,500.00",
        "RD$ 26,000.00",
        "RD$ 44,500.00",
        "48.24%"
      ],
      [
        "Piscinas y Zonas Húmedas",
        "6",
        "RD$ 12,000.00",
        "RD$ 14,800.00",
        "RD$ 26,800.00",
        "29.05%"
      ],
      [
        "Plomería e Hidráulica",
        "4",
        "RD$ 8,000.00",
        "RD$ 4,950.00",
        "RD$ 12,950.00",
        "14.04%"
      ],
      [
        "Electricidad e Iluminación Común",
        "5",
        "RD$ 4,500.00",
        "RD$ 3,500.00",
        "RD$ 8,000.00",
        "8.67%"
      ],
      [
        "<strong>TOTALES:</strong>",
        "<strong>18</strong>",
        "<strong>RD$ 43,000.00</strong>",
        "<strong>RD$ 49,250.00</strong>",
        "<strong>RD$ 92,250.00</strong>",
        "<strong>100.00%</strong>"
      ]
    ],
    "rules": "Permite auditar el cumplimiento del techo presupuestario autorizado por la Asamblea.",
    "sql": "SELECT specialty, COUNT(id), SUM(labor_cost_dop), SUM(parts_cost_dop),\n       SUM(labor_cost_dop + parts_cost_dop),\n       ROUND(SUM(labor_cost_dop + parts_cost_dop)*100.0 / (SELECT SUM(labor_cost_dop + parts_cost_dop) FROM maintenance_orders WHERE quarter = :trimestre), 2)\nFROM maintenance_orders WHERE quarter = :trimestre GROUP BY specialty ORDER BY 5 DESC;"
  },
  {
    "code": "REP-30",
    "category": "Gobernanza & Asambleas",
    "title": "Cómputo de Quórum Legal y Acta Oficial de Asambleas de Condóminos (Ley 5038)",
    "module": "Gobernanza y Asambleas",
    "roles": "Mesa Directiva de Asamblea, Notario Público, Administrador",
    "freq": "En cada asamblea ordinaria o extraordinaria",
    "target": "Acta Notarial A4 en PDF Timbrado",
    "goal": "Verificar en tiempo real el quórum legal (50.1% de alícuotas) y emitir el acta formal con el escrutinio ponderado de cada resolución.",
    "icon": "⚖️",
    "kpi1": {
      "label": "Quórum Computado",
      "val": "68.4615% de Alícuotas"
    },
    "kpi2": {
      "label": "Unidades Presentes",
      "val": "14 de 20 Uds."
    },
    "kpi3": {
      "label": "Veredicto Quórum",
      "val": "QUÓRUM LEGAL VÁLIDO"
    },
    "headers": [
      "Resolución",
      "Asunto Puesto a Votación",
      "A Favor (%)",
      "En Contra (%)",
      "Abstención (%)",
      "Requisito Legal",
      "Dictamen Final"
    ],
    "rows": [
      [
        "Res. N° 01",
        "Aprobación del Presupuesto Operativo Anual 2027 (RD$ 1.95M)",
        "58.8461%",
        "5.0000%",
        "4.6154%",
        "Mayoría Simple (50%+1)",
        "<span class='badge badge-success'>APROBADA</span>"
      ],
      [
        "Res. N° 02",
        "Instalación de Sistema de Paneles Solares para Áreas Comunes",
        "52.3076%",
        "11.5385%",
        "4.6154%",
        "Mayoría Calificada (75%)",
        "<span class='badge badge-danger'>RECHAZADA</span>"
      ],
      [
        "Res. N° 03",
        "Ratificación de la Administración Inmobiliaria Inversionisto S.R.L.",
        "63.8461%",
        "0.0000%",
        "4.6154%",
        "Mayoría Simple (50%+1)",
        "<span class='badge badge-success'>APROBADA</span>"
      ]
    ],
    "rules": "Firmada formalmente por el Presidente, Secretario y legalizada por Notario Público para depósito en el Tribunal de Tierras.",
    "sql": "SELECT v.resolution_id, v.resolution_title,\n       SUM(CASE WHEN v.vote = 'A Favor' THEN v.unit_aliquot ELSE 0 END) AS pct_favor,\n       SUM(CASE WHEN v.vote = 'En Contra' THEN v.unit_aliquot ELSE 0 END) AS pct_contra,\n       SUM(CASE WHEN v.vote = 'Abstencion' THEN v.unit_aliquot ELSE 0 END) AS pct_abstencion,\n       CASE WHEN SUM(CASE WHEN v.vote = 'A Favor' THEN v.unit_aliquot ELSE 0 END) > 50.0 THEN 'Aprobada' ELSE 'Rechazada' END AS dictamen\nFROM assembly_votes v WHERE v.assembly_id = :asamblea_id GROUP BY v.resolution_id;"
  }
];

window.REPORT_CATEGORIES = [
  "Todos",
  "Comercial & Ventas",
  "Fiscales DGII",
  "Cobranzas & Cuotas",
  "Padrón & Residentes",
  "Finanzas & Egresos",
  "Mantenimiento & Activos",
  "Gobernanza & Asambleas"
];

console.log("✓ Catálogo de 30 Reportes cargado en memoria:", window.REPORTS_CATALOG_DATA.length, "reportes disponibles.");
