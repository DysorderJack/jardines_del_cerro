/**
 * Cliente API Oficial para la Torre Residencial Jardines del Cerro IV
 * Conecta el Frontend con el Servidor Backend FastAPI (Base de Datos + PayPal + Gemini)
 * Incluye fallback automático a almacenamiento local si el backend está desconectado.
 */

class ApiClient {
  constructor() {
    // URL oficial del Backend en producción desplegado en Render
    this.remoteApi = 'https://jardines-del-cerro.onrender.com/api';

    // Si se ejecuta en localhost o en la nube (Vercel)
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.baseUrl = isLocal ? 'http://127.0.0.1:8000/api' : this.remoteApi;
    this.isBackendOnline = false;
    this.checkConnection();
  }

  async checkConnection() {
    const healthUrl = this.baseUrl.replace('/api', '') + '/health';
    try {
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(10000) });
      if (res.ok) {
        this.isBackendOnline = true;
        console.log(`✓ Backend FastAPI conectado exitosamente en: ${this.baseUrl}`);
        return;
      }
    } catch (e) {
      // Si estamos en local y el puerto 8000 no responde, intentar automáticamente con Render
      if (this.baseUrl !== this.remoteApi) {
        try {
          const remoteHealth = this.remoteApi.replace('/api', '') + '/health';
          const resRemote = await fetch(remoteHealth, { signal: AbortSignal.timeout(10000) });
          if (resRemote.ok) {
            this.baseUrl = this.remoteApi;
            this.isBackendOnline = true;
            console.log(`✓ Conectado al backend en vivo en Render: ${this.baseUrl}`);
            return;
          }
        } catch (e2) {}
      }
      this.isBackendOnline = false;
      console.log('ℹ Backend FastAPI no detectado. Operando con motor local de respaldo.');
    }
  }

  // Autenticación
  async login(documentId, password = '1234') {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_id: documentId, password })
      });
      return await res.json();
    } catch (e) {
      console.warn('Fallo en login de API:', e);
      return null;
    }
  }

  // Registro con archivo de contrato notariado
  async registerWithContract(formData) {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        body: formData // multipart/form-data
      });
      return await res.json();
    } catch (e) {
      console.warn('Fallo en registro de API:', e);
      return null;
    }
  }

  // Solicitudes de Registro (Auditoría Admin)
  async getAdminRequests() {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/admin/requests`);
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async decideRegistrationRequest(reqId, action, extraData = {}) {
    try {
      const payload = { action, ...extraData };
      const res = await fetch(`${this.baseUrl}/admin/requests/${reqId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        this.isBackendOnline = true;
        return await res.json();
      } else {
        const errData = await res.json().catch(() => null);
        console.warn('Backend decision status:', res.status, errData);
        return errData;
      }
    } catch (e) {
      console.warn('Fallo en petición de decisión al backend:', e);
      return null;
    }
  }

  // Envío de correo de prueba para diagnóstico SMTP
  async sendTestEmail(email) {
    try {
      const res = await fetch(`${this.baseUrl}/admin/send-test-email?email=${encodeURIComponent(email)}`, {
        method: 'POST'
      });
      if (!res.ok) {
        const errorText = await res.text().catch(() => '');
        return { success: false, error: `Error HTTP ${res.status} desde el servidor: ${errorText || 'Error interno temporal'}` };
      }
      return await res.json();
    } catch (e) {
      return { success: false, error: `No se pudo conectar con el servidor: ${e.message}` };
    }
  }

  // Pagos y Comprobantes Fiscales NCF
  async processPayment(payload) {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/payments/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // PayPal Subscriptions
  async getPayPalConfig() {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/paypal/config`);
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async verifyPayPalSubscription(payload) {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/paypal/verify-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  // Inteligencia Artificial (Google Gemini)
  async chatAI(prompt, contextType = 'public', userId = null, unit = null) {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          context_type: contextType,
          user_id: userId,
          unit: unit
        })
      });
      return await res.json();
    } catch (e) {
      return null;
    }
  }
}

// Instancia global del cliente de API
window.apiClient = new ApiClient();
