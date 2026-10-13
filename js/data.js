/**
 * Torre Residencial Jardines del Cerro IV - Mao, Valverde
 * Repositorio de datos del prototipo oficial Figma
 */

const UNITS_DATA = [
  {
    id: "apt-101",
    number: "101",
    type: "apartment",
    typeName: "Apartamento",
    sqm: 120,
    bedrooms: 3,
    bathrooms: 2,
    level: 1,
    hasWalkIn: false,
    status: "available",
    statusLabel: "Disponible",
    modality: "both",
    modalityLabel: "Compra · Alquiler",
    price: "Consultar",
    features: [
      "Balcón privado",
      "Cocina abierta con desayunador",
      "Estacionamiento incluido",
      "Acceso a todas las amenidades"
    ],
    image: "img/photo-1564078516393-cf04bd966897_w800_h600.jpg",
    gallery: [
      "img/photo-1564078516393-cf04bd966897_w1200_h800.jpg",
      "img/photo-1757924461488-ef9ad0670978_w1200_h800.jpg",
      "img/photo-1688646953306-5ec93eab8c06_w1200_h800.jpg"
    ]
  },
  {
    id: "apt-201",
    number: "201",
    type: "apartment",
    typeName: "Apartamento",
    sqm: 120,
    bedrooms: 3,
    bathrooms: 2,
    level: 2,
    hasWalkIn: true,
    status: "reserved",
    statusLabel: "Reservado",
    modality: "purchase",
    modalityLabel: "Compra",
    price: "Consultar",
    features: [
      "Walk-in closet",
      "Balcón privado",
      "Cocina abierta",
      "Estacionamiento incluido"
    ],
    image: "img/photo-1688646953306-5ec93eab8c06_w800_h600.jpg",
    gallery: [
      "img/photo-1688646953306-5ec93eab8c06_w1200_h800.jpg",
      "img/photo-1564078516393-cf04bd966897_w1200_h800.jpg"
    ]
  },
  {
    id: "apt-301",
    number: "301",
    type: "apartment",
    typeName: "Apartamento",
    sqm: 120,
    bedrooms: 3,
    bathrooms: 2,
    level: 3,
    hasWalkIn: true,
    status: "available",
    statusLabel: "Disponible",
    modality: "both",
    modalityLabel: "Compra · Alquiler",
    price: "Consultar",
    features: [
      "Walk-in closet",
      "Vista panorámica",
      "Balcón amplio",
      "Estacionamiento incluido",
      "Cocina abierta"
    ],
    image: "img/photo-1757924461488-ef9ad0670978_w800_h600.jpg",
    gallery: [
      "img/photo-1757924461488-ef9ad0670978_w1200_h800.jpg",
      "img/photo-1688646953306-5ec93eab8c06_w1200_h800.jpg",
      "img/photo-1564078516393-cf04bd966897_w1200_h800.jpg"
    ]
  },
  {
    id: "apt-501",
    number: "501",
    type: "apartment",
    typeName: "Apartamento",
    sqm: 120,
    bedrooms: 3,
    bathrooms: 2,
    level: 5,
    hasWalkIn: false,
    status: "unavailable",
    statusLabel: "No disponible",
    modality: "purchase",
    modalityLabel: "Compra",
    price: "Consultar",
    features: [
      "Balcón privado",
      "Cocina abierta",
      "Estacionamiento incluido"
    ],
    image: "img/photo-1646987916641-1f3c8992daa2_w800_h600.jpg",
    gallery: [
      "img/photo-1646987916641-1f3c8992daa2_w1200_h800.jpg"
    ]
  },
  {
    id: "ph-901",
    number: "PH-901",
    type: "penthouse",
    typeName: "Penthouse",
    sqm: 170,
    bedrooms: 4,
    bathrooms: 3,
    level: 9,
    hasWalkIn: true,
    status: "available",
    statusLabel: "Disponible",
    modality: "purchase",
    modalityLabel: "Compra",
    price: "Consultar",
    features: [
      "Walk-in closet master",
      "Terraza privada con área BBQ",
      "Vista panorámica 360° a Mao",
      "Doble estacionamiento techado",
      "Acabados premium en porcelanato y mármol",
      "Acceso directo de ascensor"
    ],
    image: "img/photo-1550504969-937eb02c18b3_w800_h600.jpg",
    gallery: [
      "img/photo-1550504969-937eb02c18b3_w1200_h800.jpg",
      "img/photo-1745594594897-3248892f5650_w1200_h800.jpg",
      "img/photo-1757924461488-ef9ad0670978_w1200_h800.jpg"
    ]
  },
  {
    id: "ph-1001",
    number: "PH-1001",
    type: "penthouse",
    typeName: "Penthouse",
    sqm: 170,
    bedrooms: 4,
    bathrooms: 3,
    level: 10,
    hasWalkIn: true,
    status: "available",
    statusLabel: "Disponible",
    modality: "purchase",
    modalityLabel: "Compra",
    price: "Consultar",
    features: [
      "Solárium y terraza rooftop privada",
      "Walk-in closet en habitaciones",
      "Vista panorámica 360°",
      "Doble estacionamiento techado",
      "Cocina gourmet con isla central",
      "Acceso prioritario a amenidades"
    ],
    image: "img/photo-1745594594897-3248892f5650_w800_h600.jpg",
    gallery: [
      "img/photo-1745594594897-3248892f5650_w1200_h800.jpg",
      "img/photo-1550504969-937eb02c18b3_w1200_h800.jpg"
    ]
  }
];

const AMENITIES_DATA = [
  {
    id: "piscina",
    name: "Piscina",
    category: "lifestyle",
    desc: "Piscina semi-olímpica con área de descanso y tumbonas.",
    image: "img/photo-1550504969-937eb02c18b3_w600_h400.jpg",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12c2 2 4 2 6 0s4-2 6 0 4 2 6 0"/><path d="M2 7c2 2 4 2 6 0s4-2 6 0 4 2 6 0"/><path d="M2 17c2 2 4 2 6 0s4-2 6 0 4 2 6 0"/></svg>`
  },
  {
    id: "gimnasio",
    name: "Gimnasio",
    category: "lifestyle",
    desc: "Equipado con máquinas cardiovasculares y de fuerza.",
    image: "img/photo-1540497077202-7c8a3999166f_w600_h400.jpg",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 7h4M14 7h4M4 12h16M6 17h4M14 17h4"/><rect x="1" y="10" width="3" height="4" rx="1"/><rect x="20" y="10" width="3" height="4" rx="1"/></svg>`
  },
  {
    id: "rooftop",
    name: "Rooftop",
    category: "lifestyle",
    desc: "Terraza en el último nivel con vista panorámica a Mao.",
    image: "img/photo-1745594594897-3248892f5650_w600_h400.jpg",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="3 11 12 2 21 11 21 22 3 22"/><line x1="12" y1="22" x2="12" y2="15"/></svg>`
  },
  {
    id: "gazebo",
    name: "Gazebo",
    category: "lifestyle",
    desc: "Área exterior cubierta para reuniones al aire libre.",
    image: "img/photo-1600607686527-6fb886090705_w600_h400.jpg",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v13H3z"/><path d="M9 22V12h6v10"/></svg>`
  },
  {
    id: "area-social",
    name: "Área social",
    category: "services",
    desc: "Salón de eventos y reuniones para residentes.",
    image: "img/photo-1616486338812-3dadae4b4ace_w600_h400.jpg",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>`
  },
  {
    id: "area-bbq",
    name: "Área de BBQ",
    category: "services",
    desc: "Parrillas equipadas con mesas y área de preparación.",
    image: "img/photo-1555396273-367ea4eb4db5_w600_h400.jpg",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>`
  },
  {
    id: "lobby",
    name: "Lobby",
    category: "services",
    desc: "Recepción elegante con concierge y área de espera.",
    image: "img/photo-1618221195710-dd6b41faaea6_w600_h400.jpg",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`
  },
  {
    id: "ascensor",
    name: "Ascensor",
    category: "services",
    desc: "Elevadores modernos con acceso a todos los niveles.",
    image: "img/photo-1541123437800-1bb1317badc2_w600_h400.jpg",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><polyline points="7 10 10 7 13 10"/><polyline points="17 14 14 17 11 14"/></svg>`
  },
  {
    id: "planta-electrica",
    name: "Planta eléctrica",
    category: "services",
    desc: "Generador con cobertura total del edificio las 24 horas.",
    image: "img/photo-1473341304170-971dccb5ac1e_w600_h400.jpg",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`
  },
  {
    id: "control-acceso",
    name: "Control de acceso",
    category: "services",
    desc: "Acceso controlado con sistema de tarjetas y portero.",
    image: "img/photo-1558002038-1055907df827_w600_h400.jpg",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>`
  },
  {
    id: "camaras-hd",
    name: "Cámaras HD",
    category: "services",
    desc: "Sistema de videovigilancia en áreas comunes las 24 horas.",
    image: "img/photo-1581092160607-ee22621dd758_w600_h400.jpg",
    icon: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`
  }
];

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Descubre una unidad",
    desc: "Explora nuestro catálogo de apartamentos y penthouses. Filtra por tipo, disponibilidad y preferencia."
  },
  {
    step: "02",
    title: "Agenda una visita",
    desc: "Reserva una visita presencial o por videollamada para conocer la unidad de tu interés con un asesor."
  },
  {
    step: "03",
    title: "Verifica tus requisitos",
    desc: "Nuestro equipo te orienta con los documentos y condiciones necesarias para compra o alquiler."
  },
  {
    step: "04",
    title: "Realiza la separación",
    desc: "Separa tu unidad con un pago de US$5,000, que se aplica directamente al monto total de la transacción."
  },
  {
    step: "05",
    title: "Firma el contrato",
    desc: "Formaliza el proceso con la firma del contrato de compra o alquiler ante notario público autorizado."
  },
  {
    step: "06",
    title: "Recibe tu unidad",
    desc: "Con todos los pasos completados, recibe las llaves y disfruta tu nuevo hogar en Jardines del Cerro IV."
  }
];

const FAQS_DATA = [
  {
    q: "¿Qué apartamentos están disponibles?",
    a: "Tenemos disponibles apartamentos tipo de 120 m² con 3 habitaciones y 2 baños (Unidades 101 y 301), y exclusivos penthouses de 170 m² con 4 habitaciones y terrazas privadas en los niveles 9 y 10 (PH-901 y PH-1001). Puedes ver el catálogo completo en la sección Unidades."
  },
  {
    q: "¿Cuánto cuesta un penthouse?",
    a: "Los penthouses tienen 170 m² de construcción en los niveles 9 y 10. Cuentan con terraza privada BBQ, acabados de mármol y vistas panorámicas 360°. La separación formal se realiza con US$5,000. Te invitamos a agendar una visita o consultar con nuestro equipo comercial para precios actualizados y planes de financiamiento."
  },
  {
    q: "¿Qué requisitos necesito para alquilar?",
    a: "Para alquilar necesitas cédula o pasaporte vigente, comprobantes de ingresos de los últimos 3 meses, carta de trabajo y fiador solidario. Nuestro equipo te guía en cada paso del proceso de calificación."
  },
  {
    q: "¿Cómo puedo agendar una visita?",
    a: "Puedes agendar una visita directamente desde el botón 'Agendar visita' en la barra superior o en la sección de contacto. Puedes elegir entre una visita presencial guiada en la torre en Mao o una sesión virtual por videollamada."
  }
];

const OWNER_MOCK_DATA = {
  unit: "301",
  type: "Apartamento · Nivel 3",
  resident: "Propietario",
  sqm: 120,
  bedrooms: 3,
  bathrooms: 2,
  status: "Al día",
  statusNote: "Sin pagos pendientes",
  nextFee: "1 Nov",
  nextFeeNote: "Cuota de mantenimiento",
  activeRequests: 1,
  activities: [
    { date: "01 Nov", title: "Cuota de mantenimiento mensual", status: "pending" },
    { date: "15 Nov", title: "Asamblea general de propietarios", status: "info" },
    { date: "01 Dic", title: "Cuota de mantenimiento mensual", status: "upcoming" }
  ],
  cuotas: [
    { period: "Octubre 2025", due: "01 Oct 2025", amount: "Consultar", status: "Pagado", badge: "badge-success" },
    { period: "Noviembre 2025", due: "01 Nov 2025", amount: "Consultar", status: "Pendiente", badge: "badge-warning" },
    { period: "Diciembre 2025", due: "01 Dic 2025", amount: "Consultar", status: "Próximo", badge: "badge-neutral" }
  ],
  pagos: [
    { id: "PAG-2025-089", date: "01 Oct 2025", concept: "Cuota de Mantenimiento Octubre", ncf: "B0200000142", amount: "RD$ 6,500.00", method: "Transferencia Banco BHD", status: "Aprobado" },
    { id: "PAG-2025-074", date: "01 Sep 2025", concept: "Cuota de Mantenimiento Septiembre", ncf: "B0200000128", amount: "RD$ 6,500.00", method: "PayPal Online", status: "Aprobado" },
    { id: "PAG-2025-058", date: "01 Ago 2025", concept: "Cuota de Mantenimiento Agosto", ncf: "B0200000115", amount: "RD$ 6,500.00", method: "Transferencia Banreservas", status: "Aprobado" }
  ],
  documentos: [
    { name: "Reglamento del Régimen de Condominio Jardines del Cerro IV", date: "2025", size: "2.4 MB", type: "PDF" },
    { name: "Contrato de Adquisición y Separación Inmobiliaria", date: "2025", size: "1.8 MB", type: "PDF" },
    { name: "Acta de la Asamblea General Ordinaria de Condóminos", date: "Mayo 2025", size: "850 KB", type: "PDF" },
    { name: "Manual de Uso de Amenidades y Convivencia", date: "2025", size: "1.1 MB", type: "PDF" }
  ],
  tickets: [
    { id: "TCK-104", date: "28 Sep 2026", category: "Plomería", subject: "Revisión preventiva de grifo en cocina", status: "En proceso", priority: "Media" },
    { id: "TCK-089", date: "12 Ago 2026", category: "Electricidad", subject: "Ajuste de timbre de intercomunicador", status: "Resuelto", priority: "Baja" }
  ]
};

const ADMIN_MOCK_DATA = {
  kpis: {
    availableUnits: "3 de 6",
    reservedUnits: "1 en proceso",
    occupiedUnits: "2 propietarios activos",
    pendingFees: "RD$ 13,000",
    monthlyIncome: "Consultar sistema",
    monthlyExpenses: "Consultar sistema",
    activeTickets: "3 de mantenimiento",
    scheduledVisits: "Consultar sistema"
  },
  recentActivity: [
    { title: "Nueva visita agendada — Unidad PH-1001", time: "Hace 2h", type: "visit" },
    { title: "Solicitud de mantenimiento — Unidad 301", time: "Hace 5h", type: "maintenance" },
    { title: "Prospecto registrado — Interés en apartamento", time: "Ayer", type: "prospect" }
  ],
  prospects: [
    { id: "PROS-01", name: "Carlos Mendoza", phone: "(809) 555-1284", email: "cmendoza@gmail.com", unit: "PH-901", type: "Compra", date: "Hoy 10:30 AM", status: "Contactado" },
    { id: "PROS-02", name: "Dra. Laura Batista", phone: "(809) 555-8931", email: "lbatista@claro.net.do", unit: "Unidad 101", type: "Alquiler", date: "Ayer 4:15 PM", status: "Visita Agendada" },
    { id: "PROS-03", name: "Ing. Roberto Peña", phone: "(809) 555-4420", email: "rpena@inversionesrd.com", unit: "PH-1001", type: "Compra", date: "27 Sep", status: "Separación iniciada" },
    { id: "PROS-04", name: "Elena Gómez", phone: "(809) 555-7790", email: "elenagomez@hotmail.com", unit: "Unidad 301", type: "Compra", date: "26 Sep", status: "Nuevo" }
  ],
  residents: [
    { unit: "101", name: "—", phone: "—", condition: "Disponible", aliquot: "4.65%", status: "Libre" },
    { unit: "201", name: "Marcos Peña (En proceso)", phone: "(809) 555-9012", condition: "Comprador en cierre", aliquot: "4.65%", status: "Reservado" },
    { unit: "301", name: "Ramona Ramos", phone: "(809) 555-3341", condition: "Propietaria Residente", aliquot: "4.65%", status: "Al día" },
    { unit: "501", name: "Lic. Manuel Tavárez", phone: "(809) 555-7722", condition: "Propietario", aliquot: "4.65%", status: "Ocupado" },
    { unit: "PH-901", name: "—", phone: "—", condition: "Disponible", aliquot: "8.15%", status: "Libre" },
    { unit: "PH-1001", name: "—", phone: "—", condition: "Disponible", aliquot: "8.15%", status: "Libre" }
  ],
  visits: [
    { id: "VIS-201", visitor: "Carlos Mendoza", phone: "(809) 555-1284", unit: "PH-901", date: "30 Sep 2026", time: "10:00 AM", mode: "Presencial en Mao", status: "Confirmada" },
    { id: "VIS-202", visitor: "Dra. Laura Batista", phone: "(809) 555-8931", unit: "Unidad 101", date: "01 Oct 2026", time: "03:30 PM", mode: "Videollamada", status: "Confirmada" },
    { id: "VIS-203", visitor: "Juan Carlos Ortiz", phone: "(809) 555-9914", unit: "Unidad 301", date: "03 Oct 2026", time: "11:00 AM", mode: "Presencial en Mao", status: "Pendiente" }
  ],
  maintenance: [
    { id: "MNT-501", unit: "Áreas Comunes", category: "Electromecánico", desc: "Mantenimiento preventivo mensual del generador 150 kVA", date: "02 Oct", tech: "ElectroPower Dominicana", status: "Programado" },
    { id: "MNT-502", unit: "Ascensor Principal", category: "Transporte Vertical", desc: "Revisión trimestral de guayas y cabina de alta velocidad", date: "05 Oct", tech: "Otis RD", status: "En espera" },
    { id: "MNT-503", unit: "Unidad 301", category: "Plomería", desc: "Revisión preventiva de grifo en cocina", date: "28 Sep", tech: "Personal de conserjería", status: "En proceso" }
  ],
  reports: [
    { month: "Septiembre 2026", collected: "RD$ 39,000", pending: "RD$ 13,000", collectionRate: "75%", reserveFund: "RD$ 490,000" },
    { month: "Agosto 2026", collected: "RD$ 45,500", pending: "RD$ 6,500", collectionRate: "87.5%", reserveFund: "RD$ 485,000" },
    { month: "Julio 2026", collected: "RD$ 52,000", pending: "RD$ 0", collectionRate: "100%", reserveFund: "RD$ 480,000" }
  ],
  registrationRequests: [
    {
      id: "SOL-2026-081",
      date: "11 Oct 2026",
      applicantName: "Dra. Laura Batista",
      documentId: "034-0029182-3",
      email: "lbatista@claro.net.do",
      phone: "(809) 555-8931",
      unit: "101",
      roleRequested: "tenant", // "tenant" | "owner"
      roleLabel: "Inquilino Arrendatario",
      contractFile: "Contrato_Arrendamiento_Unidad_101_Notariado.pdf",
      contractDate: "05 Oct 2026",
      status: "pending", // "pending" | "approved" | "rejected"
      notes: "Arrendamiento por 12 meses. Adjunta carta laboral certificada y fiador solidario radicado en Mao."
    },
    {
      id: "SOL-2026-079",
      date: "09 Oct 2026",
      applicantName: "Ing. Carlos Mendoza",
      documentId: "001-1827364-5",
      email: "cmendoza@gmail.com",
      phone: "(809) 555-1284",
      unit: "PH-901",
      roleRequested: "owner",
      roleLabel: "Propietario Adquirente",
      contractFile: "Promesa_Compraventa_PH901_Inversionisto.pdf",
      contractDate: "02 Oct 2026",
      status: "pending",
      notes: "Separación de US$5,000 acreditada vía PayPal. En trámite de aprobación final de inicial."
    }
  ],
  aiSubscription: {
    active: true,
    plan: "Suite Mensual IA Administrador Pro",
    priceUsd: 24.99,
    paypalSubId: "I-ADMIN-CERRO-PRO",
    subscribedAt: "12 Oct 2026",
    renewalDate: "12 Nov 2026",
    statusLabel: "Activa (Copiloto Ejecutivo Habilitado)"
  }
};

/**
 * Padrón de Usuarios del Condominio con Credenciales y Estados
 */
const REGISTERED_USERS_DATA = [
  {
    id: "usr-301",
    name: "Ramona Ramos",
    documentId: "034-0012345-6",
    email: "ramona.ramos@gmail.com",
    unit: "301",
    role: "owner", // "owner" | "tenant" | "admin"
    roleLabel: "Propietaria Residente",
    aliquot: "4.65%",
    password: "1234",
    status: "approved",
    avatar: "RR",
    aiSubscription: {
      active: true,
      plan: "Plan Residente Convivencia & DGII",
      priceUsd: 9.99,
      paypalSubId: "I-PAYPAL-SUB-301",
      subscribedAt: "01 Oct 2026",
      renewalDate: "01 Nov 2026",
      statusLabel: "Activa vía PayPal"
    }
  },
  {
    id: "usr-501",
    name: "Lic. Manuel Tavárez",
    documentId: "034-0087654-1",
    email: "mtavarez@gmail.com",
    unit: "501",
    role: "owner",
    roleLabel: "Propietario Residente",
    aliquot: "4.65%",
    password: "1234",
    status: "approved",
    avatar: "MT",
    aiSubscription: {
      active: true,
      plan: "Anual",
      priceUsd: 99.00,
      paypalSubId: "I-PAYPAL-SUB-829104",
      subscribedAt: "15 Sep 2026",
      renewalDate: "15 Sep 2027",
      statusLabel: "Activa vía PayPal"
    }
  },
  {
    id: "usr-101-demo",
    name: "Dra. Laura Batista",
    documentId: "034-0029182-3",
    email: "lbatista@claro.net.do",
    unit: "101",
    role: "tenant",
    roleLabel: "Inquilina Arrendataria",
    aliquot: "N/A (Inquilino)",
    password: "1234",
    status: "pending", // Cambia a "approved" al aprobarse
    avatar: "LB",
    aiSubscription: {
      active: true,
      plan: "Plan Residente Convivencia & DGII",
      priceUsd: 9.99,
      paypalSubId: "I-PAYPAL-SUB-101",
      subscribedAt: "12 Oct 2026",
      renewalDate: "12 Nov 2026",
      statusLabel: "Activa vía PayPal"
    }
  }
];

/**
 * Entidades Bancarias y Datos del Simulador Hipotecario (DGII Ley 173-07)
 */
const MORTGAGE_SIMULATOR_DATA = {
  banks: [
    { id: "popular", name: "Banco Popular Dominicano", rate: 10.50, minDownPayment: 20 },
    { id: "banreservas", name: "Banreservas", rate: 10.25, minDownPayment: 20 },
    { id: "bhd", name: "Banco BHD", rate: 10.75, minDownPayment: 20 }
  ],
  reservationAmountUsd: 5000,
  dgiiTransferTaxRate: 0.03, // 3% Ley 173-07
  dopExchangeRate: 60.50 // Tasa referencial USD a DOP
};

/**
 * Planes de Suscripción PayPal para el Asistente de IA Condominal
 */
const AI_SUBSCRIPTION_PLANS = [
  {
    id: "plan-monthly",
    name: "Suscripción Mensual IA Condominal",
    priceUsd: 9.99,
    priceDop: "RD$ 605.00 / mes",
    period: "Mensual",
    periodNote: "Facturación recurrente mensual vía PayPal",
    badge: "Más Popular",
    features: [
      "Consultas ilimitadas 24/7 sobre estado de cuenta personal",
      "Historial de pagos y verificación de NCF fiscal DGII",
      "Recordatorios de Asambleas Generales y orden del día",
      "Asistencia para redacción de reportes de mantenimiento",
      "Consulta instantánea del Reglamento de Condominio y Convivencia"
    ]
  },
  {
    id: "plan-annual",
    name: "Suscripción Anual IA Condominal",
    priceUsd: 99.00,
    priceDop: "RD$ 5,990.00 / año",
    period: "Anual",
    periodNote: "Ahorra un 17% con facturación anual vía PayPal",
    badge: "Mejor Valor (17% Descuento)",
    features: [
      "Todos los beneficios del plan mensual incluidos",
      "Acceso prioritario a nuevas funcionalidades comunitarias",
      "Soporte preferente de conserjería digital",
      "Reportes consolidados semestrales en formato descargable"
    ]
  }
];

/**
 * Planes de Suscripción PayPal para el Copiloto de IA del Administrador (Suite Ejecutiva)
 */
const ADMIN_AI_SUBSCRIPTION_PLANS = [
  {
    id: "admin-plan-monthly",
    name: "Suite IA Administrador Pro (Mensual)",
    priceUsd: 24.99,
    priceDop: "RD$ 1,511.00 / mes",
    period: "Mensual",
    periodNote: "Facturación mensual recurrente vía PayPal",
    badge: "Plan Profesional",
    features: [
      "Auditoría automatizada de cartera vencida y cálculo de morosidad",
      "Redacción instantánea de convocatorias de asambleas (Ley 5038)",
      "Generación de cartas de cobro formal con intimación legal",
      "Diagnóstico predictivo de mantenimiento de equipos (Generador, Otis)",
      "Análisis comparativo de presupuestos de proveedores y cotizaciones"
    ]
  },
  {
    id: "admin-plan-annual",
    name: "Suite IA Administrador Corporativo (Anual)",
    priceUsd: 249.00,
    priceDop: "RD$ 15,064.00 / año",
    period: "Anual",
    periodNote: "Ahorra 2 meses con facturación anual vía PayPal",
    badge: "Mejor Valor Corporativo (17% Descuento)",
    features: [
      "Todas las funcionalidades de la suite mensual incluidas",
      "Generador de informes consolidados de asambleas ordinarias y extraordinarias",
      "Asesoría regulatoria en debida diligencia de lavado de activos (Ley 155-17)",
      "Exportación directa de reportes financieros para contabilidad externa",
      "Soporte preferente de ingeniería y despliegue prioritario de modelos IA"
    ]
  }
];

