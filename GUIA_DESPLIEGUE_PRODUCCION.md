# Guía Oficial de Despliegue en Producción Real (Opción 3)
## Torre Residencial Jardines del Cerro IV | Mao, Valverde

Esta guía explica la arquitectura técnica completa del sistema full-stack y los pasos exactos para desplegarlo en la nube con **funcionalidad 100% real** (base de datos relacional, subida física de contratos notariados, pasarela PayPal y motor de IA Google Gemini).

---

## 1. Arquitectura del Sistema Full-Stack

El proyecto cuenta con una separación limpia y profesional entre Frontend y Backend:

```
sitio_web/
├── backend/                     # API REST FastAPI + Base de Datos + IA + PayPal
│   ├── main.py                  # Servidor FastAPI principal con CORS y Swagger docs
│   ├── config.py                # Lectura de variables de entorno (.env)
│   ├── database.py              # Conexión SQLAlchemy (SQLite local / PostgreSQL en nube)
│   ├── models.py                # Modelos relacionales ORM (Usuarios, Contratos, Pagos, etc.)
│   ├── schemas.py               # Esquemas Pydantic para validación estricta de datos
│   ├── seed_data.py             # Inicialización automática con el padrón e inventario inicial
│   ├── services/
│   │   ├── gemini_service.py    # Servicio de IA conectando con Google Gemini API
│   │   ├── paypal_service.py    # Servicio de pasarela con PayPal REST API (Sandbox/Live)
│   │   └── dgii_service.py      # Generador de Comprobantes Fiscales NCF (DGII Ley 173-07)
│   ├── routes/
│   │   ├── auth_routes.py       # Login y registro con subida física de contrato PDF
│   │   ├── admin_routes.py      # Auditoría de solicitudes, unidades y contratos
│   │   ├── payments_routes.py   # Cuotas, pagos y emisión de NCF
│   │   ├── paypal_routes.py     # Suscripciones recurrentes verificadas con PayPal
│   │   ├── ai_routes.py         # Asistente Residente y Copiloto Ejecutivo Administrador
│   │   ├── maintenance_routes.py# Tickets de mantenimiento
│   │   └── assembly_routes.py   # Votaciones ponderadas por alícuota (Ley 5038)
│   ├── uploads/                 # Carpeta donde se guardan físicamente los contratos PDF
│   ├── requirements.txt         # Dependencias Python
│   ├── .env                     # Configuración local de credenciales
│   ├── render.yaml              # Despliegue automatizado en Render
│   ├── Procfile                 # Despliegue en Railway / Heroku
│   └── Dockerfile               # Contenedor para cualquier proveedor cloud
├── css/                         # Estilos y diseño visual
├── fonts/                       # Tipografías oficiales offline
├── img/                         # Galería fotográfica HD de la torre
├── js/                          # Lógica del cliente
│   ├── api.js                   # Conector directo al backend FastAPI
│   ├── data.js                  # Padrón inicial y planes de suscripción
│   └── app.js                   # Controlador reactivo de la aplicación
├── index.html                   # Interfaz única integrada
├── INICIAR_BACKEND.bat          # Lanzador en 1 clic del servidor backend
├── iniciar_sitio_web.bat        # Lanzador en 1 clic del frontend
└── GUIA_DESPLIEGUE_PRODUCCION.md# Manual oficial de despliegue
```

---

## 2. Ejecución Local Inmediata (Prueba en tu Computadora)

El sistema completo se encuentra dentro de `sitio_web/` y está probado con **Python 3.14**:

1. **Iniciar el Servidor Backend**:
   - Entra a la carpeta `sitio_web` y haz doble clic en `INICIAR_BACKEND.bat`.
   - Se abrirá la consola indicando que el servidor está corriendo en `http://127.0.0.1:8000`.
   - Puedes abrir tu navegador en:
     - **Documentación Interactiva Swagger**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) (donde puedes probar cada endpoint en vivo).
     - **Chequeo de Salud**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health).

2. **Abrir la Aplicación Web**:
   - Dentro de `sitio_web`, haz doble clic en `iniciar_sitio_web.bat`.
   - La aplicación detectará automáticamente el backend en vivo y consumirá la base de datos real.

---

## 3. Despliegue en la Nube (Producción Paso a Paso)

Para tener el sistema en vivo en internet las 24 horas del día con dominio propio y certificado SSL gratuito:

### Paso 1: Subir la Carpeta `sitio_web` a tu Repositorio de GitHub
Abre la consola dentro de la carpeta `sitio_web` y ejecuta:
```bash
git init
git add .
git commit -m "Despliegue Full-Stack Jardines del Cerro IV"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/jardines-del-cerro-iv.git
git push -u origin main
```

---

### Paso 2: Desplegar el Backend en Render (Gratuito y Recomendado)
1. Entra a [render.com](https://render.com) y crea tu cuenta gratuita.
2. Haz clic en **New + ➔ Web Service**.
3. Conecta tu repositorio de GitHub recién creado.
4. Completa la configuración básica:
   - **Name**: `jardines-del-cerro-api`
   - **Root Directory**: `backend` *(si tu repo es la carpeta sitio_web)* o `sitio_web/backend` *(si subiste la carpeta superior)*
   - **Environment**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
5. *(Opcional)* En **New + ➔ PostgreSQL**, crea una base de datos gratuita de PostgreSQL y copia la `Internal Database URL` en la variable de entorno `DATABASE_URL` del servicio web.
6. Haz clic en **Create Web Service**. En 2 minutos tendrás una URL pública activa como:
   `https://jardines-del-cerro-api.onrender.com`

---

### Paso 3: Desplegar el Frontend en Vercel o Netlify
1. Entra a [vercel.com](https://vercel.com) o [netlify.com](https://netlify.com).
2. Importa el mismo repositorio de GitHub.
3. Configura:
   - **Root Directory**: `./` *(la raíz del repositorio si subiste sitio_web)* o `sitio_web`
4. En el archivo `js/api.js`, actualiza la URL base con el dominio de tu backend en Render:
   ```javascript
   this.baseUrl = 'https://jardines-del-cerro-api.onrender.com/api';
   ```
5. Haz clic en **Deploy**. Tendrás tu sitio web público en:
   `https://jardines-del-cerro-iv.vercel.app`

---

## 4. Configuración de Credenciales Reales (PayPal & Gemini)

Para que los cobros y la inteligencia artificial utilicen las APIs oficiales en vivo, solo debes colocar las claves en el archivo `backend/.env` (o en las variables de entorno de Render):

### A. Clave de Google Gemini API (100% Gratuita):
1. Entra con tu cuenta de Google a: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Haz clic en **"Create API key"**.
3. Copia la clave generada y pégala en `backend/.env`:
   ```ini
   GEMINI_API_KEY=AIzaSyD...TuClaveAqui...
   GEMINI_MODEL=gemini-2.0-flash
   ```

### B. Credenciales de PayPal Developer (Modo Sandbox de Pruebas):
1. Inicia sesión en el portal de desarrolladores de PayPal: [https://developer.paypal.com/dashboard/applications/sandbox](https://developer.paypal.com/dashboard/applications/sandbox)
2. En la sección **REST API apps**, haz clic en tu aplicación por defecto o en **"Create App"**.
3. Copia el **Client ID** y el **Secret**:
   ```ini
   PAYPAL_MODE=sandbox
   PAYPAL_CLIENT_ID=AT3uX...TuClientIdAqui...
   PAYPAL_CLIENT_SECRET=EL...TuSecretAqui...
   ```
4. En la pestaña **Sandbox ➔ Accounts**, PayPal te proporciona cuentas de prueba con saldo ficticio (ej. `sb-comprador@personal.example.com`) para realizar pagos y suscripciones reales de prueba.

---

## 5. Verificación de Funcionamiento

Cuando el sistema esté desplegado:
1. Cualquier persona podrá entrar a la web y registrarse subiendo un contrato notariado PDF real.
2. El archivo se guardará en el servidor y aparecerá en el panel del Administrador para su aprobación o rechazo.
3. El Residente y el Administrador podrán pagar o suscribirse mediante PayPal Sandbox.
4. El Asistente IA de Residentes y el Copiloto IA de Administración responderán utilizando el modelo **Gemini 2.0 Flash** en tiempo real.
