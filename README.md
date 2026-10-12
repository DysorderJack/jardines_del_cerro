# Torre Residencial Jardines del Cerro IV — Sitio Web Oficial

Réplica fidedigna y funcional de la aplicación web desarrollada a partir del prototipo oficial en **Figma Make** para la **Torre Residencial Jardines del Cerro IV** en Mao, Valverde, República Dominicana.

---

## 🏗️ Tecnologías Utilizadas

- **HTML5 Semántico**: Estructura modular y accesible (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`).
- **CSS3 Moderno**:
  - Variables de diseño personalizadas (Design Tokens) basadas en la paleta oficial: Verde Bosque (`#1B3B36`), Dorado Acento (`#C9A770`), Marfil (`#FBF9F5`), Lino (`#E8E3D9`) y Grafito (`#1C2421`).
  - Tipografías oficiales: **Plus Jakarta Sans** (títulos, encabezados y cifras) e **Inter** (cuerpo de texto e interfaces).
  - Diseños fluidos y adaptativos (CSS Grid y Flexbox) con soporte completo para desktop, tablet y dispositivos móviles.
- **JavaScript (Vanilla ES6)**:
  - Arquitectura reactiva y desacoplada sin dependencias externas pesadas (cero Node.js o npm requeridos para su ejecución).
  - Enrutamiento y control de vistas en tiempo real (`landing`, `schedule`, `owner`, `admin`).
  - Filtrado y ordenamiento dinámico del catálogo de apartamentos y penthouses.
  - Agendador interactivo de visitas con selector de fechas, bloques de horarios y modalidades (Presencial en Mao / Virtual).
  - Asistente virtual de Inteligencia Artificial flotante con motor de respuestas en lenguaje natural sobre el proyecto.
  - Portal de Residentes con simulación interactiva de la **Unidad 301** (estado de cuenta, pago de cuotas, comprobantes fiscales NCF, solicitudes de mantenimiento).
  - Panel Administrativo del Condominio con métricas clave (KPIs), gestión de inventario (+ Agregar unidad), prospectos CRM, directorio de copropietarios y reportes financieros.

---

## 🚀 Formas de Ejecución

### Opción 1: Servidor Web Local (Recomendado)
Haz doble clic en:
- `ABRIR_SITIO_WEB.bat` (en la carpeta raíz del proyecto) o
- `iniciar_sitio_web.bat` (dentro de la carpeta `sitio_web`)

Esto iniciará un servidor web HTTP ligero en el puerto `3000` y abrirá automáticamente tu navegador predeterminado en `http://localhost:3000/`.

### Opción 2: Apertura Directa en Navegador
Haz doble clic directamente sobre el archivo `index.html`. No requiere servidor web para funcionar.

---

## 📂 Estructura del Proyecto

```text
sitio_web/
├── index.html                   # Documento HTML principal con todas las vistas integradas
├── css/
│   ├── style.css                # Sistema completo de diseño, componentes y diseño responsivo
│   └── fonts.css                # Fuentes tipográficas oficiales cargadas en local (100% offline)
├── fonts/                       # Archivos WOFF2 de Plus Jakarta Sans e Inter para uso sin internet
├── img/                         # Galería completa de imágenes y amenidades almacenadas localmente
├── js/
│   ├── data.js                  # Capa de datos fidedigna (unidades, amenidades, proceso, FAQs, portal)
│   └── app.js                   # Controlador reactivo de la aplicación y lógica de interacción
├── servidor_local.ps1           # Servidor HTTP en PowerShell nativo de Windows (sin librerías externas)
├── iniciar_sitio_web.bat        # Lanzador en 1 clic para Windows
└── figma_bundle/                # Paquete original compilado desde Figma Make (React/Vite)
    ├── index.html
    └── assets/
        ├── index-CisKpb1a.js
        └── index-CMVSDRhg.css
```

> **Nota de compatibilidad offline**: Todas las imágenes (30 fotografías de alta definición) y familias tipográficas se encuentran alojadas de manera 100% local en `img/` y `fonts/`. La aplicación puede ejecutarse con total fidelidad visual y operativa sin conexión a internet.

---

## 🌟 Módulos y Pantallas Replicadas

1. **Barra de Navegación Superior**:
   - Logotipo y subtítulo institucional (*Mao, Valverde · Torre Residencial*).
   - Enlaces de salto suave: *Inicio*, *Unidades*, *Amenidades*, *El Proyecto*, *Proceso*, *Contacto*.
   - Botón de llamado a la acción: *Agendar visita*.
   - Selector de acceso a portales (*Portal Residentes* y *Panel de Administración*).

2. **Página de Aterrizaje Pública (Landing)**:
   - **Hero Section**: Titular de impacto, métricas clave (*10 Niveles, Desde 120 m², 11 Amenidades, Separación US$5,000*).
   - **Catálogo Residencial**: Filtros dinámicos por modalidad (*Solo Compra / Compra y Alquiler*), tipología (*Apartamentos / Penthouses*), estado (*Disponibles / Reservados*) y ordenamiento por metraje o nivel.
   - **Ficha Modal de Unidad**: Galería de fotos con miniaturas interactivas, desglose de especificaciones, características y aviso de reserva formal de US$5,000.
   - **Amenidades Exclusivas**: 11 amenidades con imágenes de alta definición e iconos vectoriales SVG.
   - **El Proyecto**: Información técnica, estructura sismorresistente y ubicación estratégica en Mao, Valverde.
   - **Proceso de Adquisición**: Los 6 pasos oficiales desde el descubrimiento hasta la entrega de llaves.
   - **Contacto Directo**: Canales oficiales (teléfono, correo, horario) y formulario de consulta rápida.

3. **Agendador de Visitas Interactivo**:
   - Calendario mensual con navegación y validación de fechas pasadas.
   - Chips selectores de horarios (*09:00 AM, 10:30 AM, 02:00 PM, 03:30 PM, 05:00 PM*).
   - Selector de modalidad (*Presencial en Mao / Videollamada Virtual*).
   - Confirmación inmediata e inserción automática en la agenda del panel de administración.

4. **Asistente Virtual con IA**:
   - Botón flotante accesible desde cualquier pantalla.
   - Sugerencias rápidas de preguntas frecuentes (FAQs).
   - Respuestas contextuales instantáneas sobre amenidades, precios, penthouses, requisitos de alquiler y separación.

5. **Portal de Residentes (Propietario Unidad 301)**:
   - Banner de la unidad con especificaciones (*120 m², 3 hab, 2 baños, Nivel 3*).
   - Estado de cuenta y fechas de vencimiento.
   - Módulo de cuotas con simulación de pago en línea y generación automática de recibos fiscales NCF.
   - Repositorio de reglamentos y documentos legales del régimen de condominio.
   - Sistema de tickets para solicitudes de mantenimiento.

6. **Panel Administrativo del Condominio**:
   - Resumen ejecutivo con tarjetas KPI (*Unidades disponibles, reservadas, cuotas por cobrar*).
   - Tabla de inventario en tiempo real con capacidad para **Agregar Nuevas Unidades** y modificar estados.
   - CRM de prospectos y solicitantes de información con enlace directo a WhatsApp.
   - Directorio de copropietarios con porcentajes de alícuotas según ley.
   - Control de agenda de visitas y órdenes de trabajo para equipos críticos (generador 24/7, ascensores).
   - Reportes financieros con tasas de cobro y balance del fondo de reserva.
