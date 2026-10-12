/**
 * Cliente API Oficial para la Torre Residencial Jardines del Cerro IV
 * Conecta el Frontend con el Servidor Backend FastAPI (Base de Datos + PayPal + Gemini)
 * Incluye fallback automático a almacenamiento local si el backend está desconectado.
 */

class ApiClient {
  constructor() {
    // Si se ejecuta en localhost o un dominio desplegado
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    this.baseUrl = isLocal ? 'http://127.0.0.1:8000/api' : '/api';
    this.isBackendOnline = false;
    this.checkConnection();
  }

  async checkConnection() {
    try {
      const res = await fetch(`${this.baseUrl.replace('/api', '')}/health`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        this.isBackendOnline = true;
        console.log('✓ Backend FastAPI conectado exitosamente (Base de datos en vivo).');
      }
    } catch (e) {
      this.isBackendOnline = false;
      console.log('ℹ Backend FastAPI no detectado. Operando en modo local/desconectado.');
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

  async decideRegistrationRequest(reqId, action) {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/admin/requests/${reqId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      return await res.json();
    } catch (e) {
      return null;
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
