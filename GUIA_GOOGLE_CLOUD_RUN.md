# Guía de Despliegue en Google Cloud Platform (GCP)
## GitHub + Docker + Cloud Build + Cloud Run (HTTPS)
### Torre Residencial Jardines del Cerro IV | Mao, Valverde

---

## 1. Arquitectura Híbrida y Coexistencia (¡Sin Romper Nada!)

Tu proyecto ahora cuenta con una arquitectura de alta disponibilidad donde **nada interfiere con lo que ya tienes montado**:

| Servicio | Rol Actual en tu Proyecto | Estado |
| :--- | :--- | :--- |
| **GitHub** | Repositorio central de control de versiones (`DysorderJack/jardines_del_cerro`). | 🟢 Activo |
| **Vercel** | Alojamiento del Frontend Web público con entrega CDN global ultra-rápida. | 🟢 Activo y funcionando |
| **Render** | Servidor de base de datos y backend FastAPI en la nube. | 🟢 Activo y funcionando |
| **Google Cloud Run** | **Nuevo requerimiento del profesor**: Contenedor Docker serverless con **HTTPS nativo**. | 🚀 Listo para desplegar |
| **Google Cloud Build** | Pipeline de CI/CD que compila el contenedor Docker automáticamente. | 🚀 Listo para desplegar |

> [!NOTE]
> Gracias al ajuste en `js/api.js`, el frontend en Vercel sigue consumiendo tu backend en Render sin interrupciones, pero si tú o el profesor abren el enlace de **Google Cloud Run**, el contenedor servirá tanto la web completa como la API bajo el mismo dominio seguro de Google.

---

## 2. Los 3 Archivos de Configuración Creados

Hemos incorporado los estándares de la industria en tu repositorio:

1. **`Dockerfile` (en la raíz)**:
   - Basado en `python:3.11-slim` (imagen ligera y segura).
   - Instala las dependencias de `backend/requirements.txt`.
   - Copia todo el proyecto y expone el puerto `$PORT` inyectado por Google Cloud Run (8080).
   - Inicia Uvicorn apuntando a `main:app`.
2. **`.dockerignore`**:
   - Evita empaquetar carpetas pesadas como `.git`, entornos virtuales y temporales `__pycache__`.
3. **`cloudbuild.yaml`**:
   - Define los 3 pasos de integración continua:
     1. `docker build` (Construcción del contenedor).
     2. `docker push` (Subida al registro de Google Container Registry / Artifact Registry).
     3. `gcloud run deploy` (Despliegue automático a Cloud Run con HTTPS público).

---

## 3. Pasos para Realizar el Despliegue en Google Cloud

### Requisito Previo: Cuenta en Google Cloud Platform
1. Entra a [console.cloud.google.com](https://console.cloud.google.com/) con tu cuenta de Google.
2. Si es tu primera vez, Google te otorga **$300 USD de crédito gratuito** de bienvenida.
3. Crea un proyecto nuevo llamado: `jardines-del-cerro` (o usa el que tengas).
4. En el buscador superior de GCP, busca y haz clic en **"Habilitar"** para estas 3 herramientas:
   - **Cloud Build API**
   - **Cloud Run Admin API**
   - **Artifact Registry API**

---

### Método A: Despliegue en 1 Clic con `gcloud` (Recomendado y más rápido)

Si tienes instalado el [Google Cloud SDK (gcloud CLI)](https://cloud.google.com/sdk/docs/install):

1. Abre tu terminal (PowerShell o CMD) dentro de la carpeta `sitio_web`.
2. Inicia sesión en Google:
   ```bash
   gcloud auth login
   ```
3. Selecciona tu proyecto:
   ```bash
   gcloud config set project TU_PROJECT_ID
   ```
4. Ejecuta el comando mágico de despliegue:
   ```bash
   gcloud run deploy jardines-del-cerro-app --source . --region us-central1 --allow-unauthenticated
   ```
   *¿Qué hace este comando?*
   - Llama a **Cloud Build** automáticamente.
   - Empaqueta el **Dockerfile**.
   - Sube la imagen a Google Container Registry.
   - Crea el servicio en **Cloud Run**.
   - Te devuelve en pantalla la URL pública oficial con HTTPS:
     `https://jardines-del-cerro-app-xxxxxx-uc.a.run.app`

---

### Método B: Despliegue Continuo Conectado a GitHub (100% Automático)

Si el profesor prefiere que cada `git push` a GitHub dispare Cloud Build y Cloud Run automáticamente:

1. Ve a la consola de **Google Cloud Run**: [console.cloud.google.com/run](https://console.cloud.google.com/run).
2. Haz clic en el botón superior **"Crear servicio"** (Create Service).
3. Selecciona la opción:
   **"Implementar continuamente nuevas revisiones a partir de un repositorio de código fuente"** (Cloud Build).
4. Haz clic en **"Configurar Cloud Build"**:
   - Proveedor: **GitHub**.
   - Conecta tu cuenta y selecciona el repositorio: `DysorderJack/jardines_del_cerro`.
   - Rama: `^main$`.
   - Tipo de compilación: Selecciona **Archivo de configuración de Cloud Build (yaml o json)** y escribe: `cloudbuild.yaml` (o selecciona **Dockerfile** apuntando a `/Dockerfile`).
5. En configuración del servicio:
   - **Nombre del servicio**: `jardines-del-cerro-app`.
   - **Región**: `us-central1` (Iowa) o la más cercana.
   - **Autenticación**: Selecciona **"Permitir invocaciones no autenticadas"** (para que la web sea pública y el profesor pueda entrar).
   - **Puerto del contenedor**: `8080`.
6. Haz clic en **Crear**. En 2 a 3 minutos tendrás tu servicio activo.

---

## 4. Configuración de Variables de Entorno en Cloud Run

Para que la Inteligencia Artificial (Gemini), facturación DGII (e-CF) y PayPal funcionen al 100% en Cloud Run:

1. En la consola de Cloud Run, haz clic en tu servicio `jardines-del-cerro-app`.
2. Haz clic en **"Editar e implementar nueva revisión"** (Edit & Deploy New Revision).
3. En la pestaña **Variables y secretos** (Variables & Secrets), agrega las variables:
   - `ENV`: `production`
   - `GEMINI_API_KEY`: Tu clave de Gemini.
   - `GEMINI_MODEL`: `gemini-3.8-flash`
   - `PAYPAL_MODE`: `sandbox`
   - `PAYPAL_CLIENT_ID`: Tu Client ID de PayPal.
   - `PAYPAL_CLIENT_SECRET`: Tu Secret de PayPal.
   - `RESEND_API_KEY`: Tu API Key de Resend.
   - `ECF_API_BASE_URL`: `https://ecf-platform-backend-50801509587.us-central1.run.app`
4. Haz clic en **Implementar**.

---

## 5. Lista de Verificación para Entregar al Profesor

| Requisito | Cómo presentarlo al profesor |
| :--- | :--- |
| **1. GitHub** | Enlace: `https://github.com/DysorderJack/jardines_del_cerro` con los archivos `Dockerfile` y `cloudbuild.yaml` en la rama `main`. |
| **2. Docker** | Mostrar el archivo `Dockerfile` en el repositorio y la imagen compilada en el registro de Google Cloud Artifact Registry / Container Registry. |
| **3. Cloud Build** | Captura de pantalla de la sección **Cloud Build > Historial de compilaciones** en GCP mostrando el estado en verde (**Éxito / Success**). |
| **4. Cloud Run (HTTPS)** | Enlace público entregado por Google (ej: `https://jardines-del-cerro-app-xxxxxx.a.run.app`) con certificado SSL activo y navegación completa. |
| **5. Frontend en Vercel** | Sigue funcionando en paralelo como evidencia de arquitectura multicloud. |

