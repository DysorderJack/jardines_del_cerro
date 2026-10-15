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
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.detail || 'Error al procesar el registro en el servidor' };
      }
      return data;
    } catch (e) {
      console.warn('Fallo en registro de API:', e);
      return { success: false, error: 'No se pudo contactar con el servidor de autenticación' };
    }
  }

  // Crear Administrador
  async createAdmin(payload) {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/admin/create-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      console.warn('Fallo en createAdmin API:', e);
      return null;
    }
  }

  // Obtener lista completa de administradores (Super Administrador)
  async getAdministrators() {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/admin/administrators`);
      return await res.json();
    } catch (e) {
      console.warn('Fallo en getAdministrators API:', e);
      return null;
    }
  }

  // Actualizar Administrador
  async updateAdministrator(adminId, payload) {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/admin/administrators/${encodeURIComponent(adminId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (e) {
      console.warn('Fallo en updateAdministrator API:', e);
      return null;
    }
  }

  // Eliminar Administrador
  async deleteAdministrator(adminId) {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/admin/administrators/${encodeURIComponent(adminId)}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (e) {
      console.warn('Fallo en deleteAdministrator API:', e);
      return null;
    }
  }

  // Alternar Exención de Suscripción de Administrador
  async toggleAdminExemption(adminId) {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/admin/administrators/${encodeURIComponent(adminId)}/toggle-exemption`, {
        method: 'POST'
      });
      return await res.json();
    } catch (e) {
      console.warn('Fallo en toggleAdminExemption API:', e);
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

  // Eliminar solicitud de registro (para pruebas o cancelaciones)
  async deleteRegistrationRequest(reqId) {
    try {
      const res = await fetch(`${this.baseUrl}/admin/requests/${encodeURIComponent(reqId)}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (e) {
      console.warn('Fallo al eliminar solicitud en backend:', e);
      return null;
    }
  }

  // Desvincular y eliminar inquilino / residente
  async deleteResident(identifier) {
    try {
      const res = await fetch(`${this.baseUrl}/admin/residents/${encodeURIComponent(identifier)}`, {
        method: 'DELETE'
      });
      return await res.json();
    } catch (e) {
      console.warn('Fallo al desvincular residente en backend:', e);
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

  async verifyPayPalOrder(payload) {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/paypal/verify-order`, {
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
    const candidateUrls = [];
    if (this.isBackendOnline && this.baseUrl) {
      candidateUrls.push(this.baseUrl);
    }
    if (!candidateUrls.includes(this.remoteApi)) {
      candidateUrls.push(this.remoteApi);
    }
    if (this.baseUrl && !candidateUrls.includes(this.baseUrl)) {
      candidateUrls.push(this.baseUrl);
    }

    for (const base of candidateUrls) {
      try {
        const res = await fetch(`${base}/ai/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            context_type: contextType,
            user_id: userId,
            unit: unit
          }),
          signal: AbortSignal.timeout(25000)
        });
        if (res.ok) {
          const data = await res.json();
          this.isBackendOnline = true;
          this.baseUrl = base;
          return data;
        }
      } catch (e) {
        // Continuar con el siguiente endpoint candidato
      }
    }
    return null;
  }

  async getAIStatus() {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/ai/status`);
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async testAIConnection(apiKey = null) {
    if (!this.isBackendOnline) return null;
    try {
      const url = apiKey ? `${this.baseUrl}/ai/test-connection?api_key=${encodeURIComponent(apiKey)}` : `${this.baseUrl}/ai/test-connection`;
      const res = await fetch(url, { method: 'POST' });
      return await res.json();
    } catch (e) {
      return { success: false, error: 'No se pudo contactar con el servidor' };
    }
  }

  // Agenda de Visitas & Citas
  async createVisit(payload) {
    try {
      const res = await fetch(`${this.baseUrl}/visits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        this.isBackendOnline = true;
        return await res.json();
      }
      return null;
    } catch (e) {
      console.warn('Fallo al sincronizar cita con backend:', e);
      return null;
    }
  }

  async getVisits() {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/visits`);
      if (res.ok) return await res.json();
      return null;
    } catch (e) {
      return null;
    }
  }

  async confirmVisit(visitId) {
    try {
      const res = await fetch(`${this.baseUrl}/visits/${encodeURIComponent(visitId)}/confirm`, {
        method: 'POST'
      });
      if (res.ok) {
        this.isBackendOnline = true;
        return await res.json();
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, detail: err.detail || 'Error al confirmar cita' };
    } catch (e) {
      return { success: false, detail: e.message };
    }
  }

  async sendVisitReminder(visitId) {
    try {
      const res = await fetch(`${this.baseUrl}/visits/${encodeURIComponent(visitId)}/reminder`, {
        method: 'POST'
      });
      if (res.ok) {
        this.isBackendOnline = true;
        return await res.json();
      }
      const err = await res.json().catch(() => ({}));
      return { success: false, detail: err.detail || 'Error al despachar recordatorio' };
    } catch (e) {
      return { success: false, detail: e.message };
    }
  }

  async deleteVisit(visitId) {
    try {
      const res = await fetch(`${this.baseUrl}/visits/${encodeURIComponent(visitId)}`, {
        method: 'DELETE'
      });
      if (res.ok) return await res.json();
      return null;
    } catch (e) {
      return null;
    }
  }

  // =========================================================================
  // Perfil de Usuario & Configuración de Cuenta
  // =========================================================================

  async getProfile(identifier) {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/auth/profile/${encodeURIComponent(identifier)}`);
      if (res.ok) return await res.json();
      return null;
    } catch (e) {
      console.warn('Fallo en getProfile API:', e);
      return null;
    }
  }

  async updateProfile(identifier, payload) {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/auth/profile/${encodeURIComponent(identifier)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, detail: data.detail || 'Error al actualizar perfil' };
      }
      return data;
    } catch (e) {
      console.warn('Fallo en updateProfile API:', e);
      return { success: false, detail: e.message };
    }
  }

  async changePassword(identifier, currentPassword, newPassword) {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/auth/change-password/${encodeURIComponent(identifier)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, detail: data.detail || 'Error al cambiar contraseña' };
      }
      return data;
    } catch (e) {
      console.warn('Fallo en changePassword API:', e);
      return { success: false, detail: e.message };
    }
  }

  async uploadAvatar(identifier, file) {
    if (!this.isBackendOnline) return null;
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${this.baseUrl}/auth/upload-avatar/${encodeURIComponent(identifier)}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, detail: data.detail || 'Error al subir foto de perfil' };
      }
      return data;
    } catch (e) {
      console.warn('Fallo en uploadAvatar API:', e);
      return { success: false, detail: e.message };
    }
  }

  async deleteAvatar(identifier) {
    if (!this.isBackendOnline) return null;
    try {
      const res = await fetch(`${this.baseUrl}/auth/avatar/${encodeURIComponent(identifier)}`, {
        method: 'DELETE'
      });
      if (res.ok) return await res.json();
      return null;
    } catch (e) {
      console.warn('Fallo en deleteAvatar API:', e);
      return null;
    }
  }
}

// Instancia global del cliente de API
window.apiClient = new ApiClient();

