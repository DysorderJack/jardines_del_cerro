/**
 * Torre Residencial Jardines del Cerro IV - Mao, Valverde
 * Controlador Principal de la Aplicación Web (Vanilla ES6)
 */

class JardinesApp {
  constructor() {
    // Claves de persistencia LocalStorage
    this.storageKeyUsers = 'jc_registered_users_v2';
    this.storageKeyAdmin = 'jc_admin_data_v2';
    this.storageKeyUnits = 'jc_units_data_v2';

    // Carga con recuperación reactiva
    this.registeredUsers = this.loadStorage(this.storageKeyUsers, REGISTERED_USERS_DATA);
    this.adminData = this.loadStorage(this.storageKeyAdmin, ADMIN_MOCK_DATA);
    this.units = this.loadStorage(this.storageKeyUnits, UNITS_DATA);
    this.amenities = JSON.parse(JSON.stringify(AMENITIES_DATA));
    this.processSteps = JSON.parse(JSON.stringify(PROCESS_STEPS));
    this.faqs = JSON.parse(JSON.stringify(FAQS_DATA));
    this.ownerData = JSON.parse(JSON.stringify(OWNER_MOCK_DATA));

    // Estado del usuario activo (inicia en null, o se asocia en login)
    this.currentUser = null;

    // Estado de la interfaz
    this.currentView = 'landing'; // 'landing' | 'schedule' | 'owner' | 'admin'
    this.filters = {
      modality: 'all',
      type: 'all',
      status: 'all',
      sort: 'default'
    };
    this.amenityFilter = 'all';

    // Estado del agendador de visitas
    const today = new Date();
    this.calYear = today.getFullYear();
    this.calMonth = today.getMonth(); // 0-indexed
    this.selectedDate = new Date(this.calYear, this.calMonth, today.getDate() + 1);
    this.selectedTimeSlot = '09:00 AM';
    this.bookingModality = 'presencial';

    // Estados de autenticación en portales
    this.isOwnerLoggedIn = false;
    this.isAdminLoggedIn = false;
    this.activeOwnerTab = 'overview';
    this.activeAdminTab = 'inventario';

    // Estado del Simulador Hipotecario
    this.mortgageState = {
      price: 145000,
      bankId: 'popular',
      downPercent: 25,
      termYears: 20
    };

    // Estado de la Reserva (Ventana 15 min - Punto 16.8)
    this.reservationState = {
      unitId: null,
      unitNumber: null,
      unitPrice: null,
      timerSeconds: 15 * 60,
      timerInterval: null,
      paymentMethod: 'paypal'
    };

    // Plan activo de suscripción PayPal para IA
    this.activeAiPlan = (typeof AI_SUBSCRIPTION_PLANS !== 'undefined') ? AI_SUBSCRIPTION_PLANS[0] : null;

    // Contexto de pasarela PayPal ('resident' o 'admin')
    this.subscriptionContext = 'resident';

    // Asegurar estructura de suscripción para el Administrador
    if (this.adminData) {
      if (!this.adminData.aiSubscription || !this.adminData.aiSubscription.active) {
        this.adminData.aiSubscription = {
          active: true,
          plan: "Suite Mensual IA Administrador Pro",
          priceUsd: 24.99,
          paypalSubId: "I-ADMIN-CERRO-PRO",
          subscribedAt: "12 Oct 2026",
          renewalDate: "12 Nov 2026",
          statusLabel: "Activa (Copiloto Ejecutivo Habilitado)"
        };
      }
    }

    // Estado del Chatbot de IA público
    this.isChatOpen = false;

    // Inicializar
    this.init();
  }

  /* =========================================================================
     Persistencia en LocalStorage
     ========================================================================= */
  loadStorage(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    return JSON.parse(JSON.stringify(fallback));
  }

  saveStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }
  }

  saveAllState() {
    this.saveStorage(this.storageKeyUsers, this.registeredUsers);
    this.saveStorage(this.storageKeyAdmin, this.adminData);
    this.saveStorage(this.storageKeyUnits, this.units);
  }

  init() {
    this.renderUnits();
    this.renderAmenities();
    this.renderProcess();
    this.renderCalendar();
    this.updateBookingSummary();
    this.updateMortgageCalculator();
    this.updateAdminPendingBadge();
    this.renderRegistrationUnitsDropdown();

    // Garantizar acceso activado a la IA para el Administrador
    if (this.adminData) {
      if (!this.adminData.aiSubscription || !this.adminData.aiSubscription.active) {
        this.adminData.aiSubscription = {
          active: true,
          plan: "Suite Mensual IA Administrador Pro",
          priceUsd: 24.99,
          paypalSubId: "I-ADMIN-CERRO-PRO",
          subscribedAt: "12 Oct 2026",
          renewalDate: "12 Nov 2026",
          statusLabel: "Activa (Copiloto Ejecutivo Habilitado)"
        };
      }
    }

    // Garantizar acceso activado al Asistente Privado para los Residentes
    if (this.registeredUsers && Array.isArray(this.registeredUsers)) {
      this.registeredUsers.forEach(u => {
        if (!u.aiSubscription || !u.aiSubscription.active) {
          u.aiSubscription = {
            active: true,
            plan: "Plan Residente Convivencia & DGII",
            priceUsd: 9.99,
            paypalSubId: "I-PAYPAL-SUB-" + (u.unit || 'RES'),
            subscribedAt: "12 Oct 2026",
            renewalDate: "12 Nov 2026",
            statusLabel: "Activa vía PayPal"
          };
        }
      });
    }

    // Event listener para cerrar dropdowns al hacer clic fuera
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('profile-dropdown-menu');
      const btn = document.getElementById('profile-dropdown-btn');
      if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });

    // Detectar hash en URL si existe
    if (window.location.hash) {
      const hash = window.location.hash.replace('#', '');
      if (['schedule', 'owner', 'admin'].includes(hash)) {
        this.setView(hash);
      } else {
        setTimeout(() => this.scrollToSection(hash), 100);
      }
    }
  }

  /* =========================================================================
     Navegación y Vistas
     ========================================================================= */
  setView(viewName, targetSectionId = null) {
    this.currentView = viewName;
    const views = ['landing', 'schedule', 'owner', 'admin'];

    views.forEach(v => {
      const el = document.getElementById(`view-${v}`);
      if (el) {
        if (v === viewName) {
          el.style.display = (v === 'landing' || v === 'schedule') ? 'block' : 'flex';
          el.classList.add('fade-in');
        } else {
          el.style.display = 'none';
        }
      }
    });

    // Cerrar menú móvil si está abierto
    const drawer = document.getElementById('mobile-drawer');
    if (drawer) drawer.style.display = 'none';

    // Cerrar dropdown de perfil
    const dropdown = document.getElementById('profile-dropdown-menu');
    if (dropdown) dropdown.classList.remove('open');

    // Desplazamiento
    if (viewName === 'landing') {
      if (targetSectionId) {
        this.scrollToSection(targetSectionId);
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      this.updateNavbarActiveLink(targetSectionId || 'hero');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      this.clearNavbarActiveLinks();

      if (viewName === 'owner') {
        this.renderOwnerState();
      } else if (viewName === 'admin') {
        this.renderAdminState();
      }
    }
  }

  scrollToSection(sectionId) {
    const el = document.getElementById(sectionId);
    if (el) {
      const headerOffset = 64;
      const elementPosition = el.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      this.updateNavbarActiveLink(sectionId);
    }
  }

  updateNavbarActiveLink(activeId) {
    const links = document.querySelectorAll('#desktop-nav .nav-link');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href === `#${activeId}`) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  clearNavbarActiveLinks() {
    const links = document.querySelectorAll('#desktop-nav .nav-link');
    links.forEach(l => l.classList.remove('active'));
  }

  toggleProfileDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('profile-dropdown-menu');
    if (dropdown) {
      dropdown.classList.toggle('open');
    }
  }

  toggleMobileMenu() {
    const drawer = document.getElementById('mobile-drawer');
    if (drawer) {
      drawer.style.display = drawer.style.display === 'none' ? 'block' : 'none';
    }
  }

  openResidentLogin() {
    this.setView('owner');
    if (!this.isOwnerLoggedIn) {
      this.switchResidentAuthTab('login');
    }
  }

  openAdminLogin() {
    this.setView('admin');
  }

  /* =========================================================================
     Catálogo de Unidades y Filtros
     ========================================================================= */
  setUnitFilter(filterCategory, value, btnElement) {
    this.filters[filterCategory] = value;

    // Actualizar estado activo en botones del mismo grupo
    if (btnElement) {
      const parent = btnElement.parentElement;
      parent.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      btnElement.classList.add('active');
    }

    this.renderUnits();
  }

  setUnitSort(sortValue) {
    this.filters.sort = sortValue;
    this.renderUnits();
  }

  getFilteredUnits() {
    let result = [...this.units];

    // Filtro de modalidad
    if (this.filters.modality === 'purchase') {
      result = result.filter(u => u.modality === 'purchase');
    } else if (this.filters.modality === 'both') {
      result = result.filter(u => u.modality === 'both');
    }

    // Filtro de tipología
    if (this.filters.type !== 'all') {
      result = result.filter(u => u.type === this.filters.type);
    }

    // Filtro de estado
    if (this.filters.status !== 'all') {
      result = result.filter(u => u.status === this.filters.status);
    }

    // Ordenamiento
    if (this.filters.sort === 'sqm-desc') {
      result.sort((a, b) => b.sqm - a.sqm);
    } else if (this.filters.sort === 'sqm-asc') {
      result.sort((a, b) => a.sqm - b.sqm);
    } else if (this.filters.sort === 'level-asc') {
      result.sort((a, b) => a.level - b.level);
    } else if (this.filters.sort === 'level-desc') {
      result.sort((a, b) => b.level - a.level);
    }

    return result;
  }

  renderUnits() {
    const container = document.getElementById('units-cards-container');
    if (!container) return;

    const filtered = this.getFilteredUnits();

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 48px; background: var(--white); border-radius: var(--radius-lg); border: 1px dashed var(--linen-dark);">
          <div style="font-size: 36px; margin-bottom: 12px;">🔍</div>
          <h3 style="font-size: 18px; font-weight: 700; color: var(--ink);">No se encontraron unidades con los filtros seleccionados</h3>
          <p style="font-size: 13px; color: var(--dust); margin-top: 6px;">Intenta cambiar tus criterios de búsqueda o restablecer los filtros.</p>
          <button class="btn-outline" onclick="window.app.resetUnitFilters();" style="margin-top: 16px;">Restablecer filtros</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(unit => {
      let statusBadgeClass = 'badge-success';
      let dotClass = 'status-dot-available';
      if (unit.status === 'reserved') {
        statusBadgeClass = 'badge-warning';
        dotClass = 'status-dot-reserved';
      } else if (unit.status === 'unavailable' || unit.status === 'occupied') {
        statusBadgeClass = 'badge-neutral';
        dotClass = 'status-dot-occupied';
      }

      return `
        <article class="unit-card" onclick="window.app.openUnitDetail('${unit.id}');" style="cursor: pointer;">
          <div class="unit-card-img-wrap">
            <img src="${unit.image}" alt="Unidad ${unit.number} Jardines del Cerro IV" class="unit-card-img" loading="lazy">
            <span class="unit-badge-type">${unit.typeName}</span>
            <span class="unit-badge-status badge ${statusBadgeClass}">
              <span class="status-dot ${dotClass}"></span>
              <span>${unit.statusLabel}</span>
            </span>
          </div>

          <div class="unit-card-body">
            <div class="unit-card-header">
              <h3 class="unit-card-number">Unidad ${unit.number}</h3>
              <span class="unit-card-price">${unit.price}</span>
            </div>

            <div class="unit-specs-row">
              <span class="unit-spec-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                <span>${unit.sqm} m²</span>
              </span>
              <span>·</span>
              <span class="unit-spec-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 20v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8M2 14h20M2 20h20"/></svg>
                <span>${unit.bedrooms} hab</span>
              </span>
              <span>·</span>
              <span class="unit-spec-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h16a1 1 0 0 1 1 1v4a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-4a1 1 0 0 1 1-1z"/></svg>
                <span>${unit.bathrooms} baños</span>
              </span>
              <span>·</span>
              <span class="unit-spec-item">
                <span>Nivel ${unit.level}</span>
              </span>
            </div>

            <p style="font-size: 13px; color: var(--dust); margin-bottom: 16px; line-height: 1.5;">
              ${unit.features.slice(0, 2).join(' · ')}.
            </p>

            <div class="unit-card-footer">
              <span class="unit-card-modality">${unit.modalityLabel}</span>
              <span class="btn-primary" style="padding: 6px 14px; font-size: 12px; pointer-events: none;">
                Ver detalle
              </span>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  resetUnitFilters() {
    this.filters = { modality: 'all', type: 'all', status: 'all', sort: 'default' };
    document.querySelectorAll('.filter-btn').forEach(btn => {
      if (btn.dataset.value === 'all') btn.classList.add('active');
      else btn.classList.remove('active');
    });
    const sortSelect = document.getElementById('unit-sort-select');
    if (sortSelect) sortSelect.value = 'default';
    this.renderUnits();
  }

  /* =========================================================================
     Detalle de Unidad (Modal)
     ========================================================================= */
  openUnitDetail(unitId) {
    const unit = this.units.find(u => u.id === unitId);
    if (!unit) return;

    const modal = document.getElementById('unit-detail-modal');
    const modalBody = document.getElementById('unit-modal-body');
    if (!modal || !modalBody) return;

    let statusBadgeClass = 'badge-success';
    let dotClass = 'status-dot-available';
    if (unit.status === 'reserved') {
      statusBadgeClass = 'badge-warning';
      dotClass = 'status-dot-reserved';
    } else if (unit.status === 'unavailable' || unit.status === 'occupied') {
      statusBadgeClass = 'badge-neutral';
      dotClass = 'status-dot-occupied';
    }

    const galleryHtml = unit.gallery && unit.gallery.length > 0 ? unit.gallery.map((imgUrl, idx) => `
      <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="window.app.switchModalImage('${imgUrl}', this);">
        <img src="${imgUrl}" alt="Foto ${idx + 1} de Unidad ${unit.number}">
      </div>
    `).join('') : '';

    modalBody.innerHTML = `
      <div class="breadcrumb" style="margin-bottom: 16px;">
        <button onclick="window.app.closeUnitDetail();">Catálogo</button>
        <span>/</span>
        <span style="color: var(--ink); font-weight: 600;">Unidad ${unit.number} (${unit.typeName})</span>
      </div>

      <div class="unit-detail-grid">
        <!-- Visual Gallery -->
        <div>
          <div class="gallery-main-img-wrap">
            <img src="${unit.image}" alt="Unidad ${unit.number}" id="modal-main-gallery-img" class="gallery-main-img">
          </div>
          <div class="gallery-thumbs">
            ${galleryHtml}
          </div>
        </div>

        <!-- Information & Actions -->
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span class="badge ${statusBadgeClass}">
              <span class="status-dot ${dotClass}"></span>
              <span>${unit.statusLabel}</span>
            </span>
            <span style="font-size: 12px; font-weight: 600; color: var(--dust);">${unit.modalityLabel}</span>
          </div>

          <h2 style="font-family: var(--font-display); font-size: 32px; font-weight: 800; color: var(--ink); margin-bottom: 4px;">
            Unidad ${unit.number}
          </h2>
          <div style="font-size: 15px; color: var(--dust); margin-bottom: 20px;">
            ${unit.typeName} en Nivel ${unit.level} · Mao, Valverde
          </div>

          <!-- Specs 4-columns -->
          <div class="detail-specs-grid">
            <div class="spec-box">
              <div class="spec-box-label">Área Total</div>
              <div class="spec-box-val">${unit.sqm} m²</div>
            </div>
            <div class="spec-box">
              <div class="spec-box-label">Habitaciones</div>
              <div class="spec-box-val">${unit.bedrooms}</div>
            </div>
            <div class="spec-box">
              <div class="spec-box-label">Baños</div>
              <div class="spec-box-val">${unit.bathrooms}</div>
            </div>
            <div class="spec-box">
              <div class="spec-box-label">Nivel / Piso</div>
              <div class="spec-box-val">${unit.level}</div>
            </div>
          </div>

          <!-- Features list -->
          <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--dust); margin-bottom: 8px;">
            Características y Acabados:
          </div>
          <ul class="features-list">
            ${unit.features.map(f => `
              <li class="feature-item">
                <svg class="feature-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>${f}</span>
              </li>
            `).join('')}
            ${unit.hasWalkIn ? `
              <li class="feature-item">
                <svg class="feature-check" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                <span>Walk-in closet integrado</span>
              </li>
            ` : ''}
          </ul>

          <!-- Reservation Info Box (Figma Spec) -->
          <div class="reservation-box">
            <div class="reservation-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <div class="reservation-title">Monto de Separación: US$ 5,000</div>
              <div class="reservation-text">
                Garantiza tu unidad inmediatamente. Este depósito formal se acredita al 100% de la inicial estipulada en tu contrato de adquisición.
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${unit.status === 'available' ? `
              <button class="btn-primary" style="width: 100%; padding: 12px; background: var(--accent); color: var(--ink); border-color: var(--accent); font-weight: 700;" onclick="window.app.openReservationModal('${unit.id}');">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span>Separar Unidad por US$ 5,000 (Ventana 15 min)</span>
              </button>
            ` : (unit.status === 'reserved' ? `
              <div style="background: #FEF3C7; border: 1.5px solid #FCD34D; border-radius: var(--radius-sm); padding: 10px; text-align: center; font-size: 12px; color: #92400E; font-weight: 700;">
                🔒 Unidad en proceso de separación (Exclusividad 30 días activa)
              </div>
            ` : '')}
            <button class="btn-primary" style="width: 100%; padding: 12px;" onclick="window.app.bookFromUnitModal('${unit.number}');">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>Agendar visita para la Unidad ${unit.number}</span>
            </button>
            <button class="btn-outline" style="width: 100%; padding: 11px;" onclick="window.app.openWhatsApp('Hola, estoy interesado en conocer los detalles de compra/alquiler de la Unidad ${unit.number} en Jardines del Cerro IV.');">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              <span>Consultar disponibilidad por WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    `;

    modal.style.display = 'flex';
  }

  switchModalImage(newUrl, thumbEl) {
    const mainImg = document.getElementById('modal-main-gallery-img');
    if (mainImg) mainImg.src = newUrl;
    if (thumbEl) {
      const parent = thumbEl.parentElement;
      parent.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
      thumbEl.classList.add('active');
    }
  }

  closeUnitDetail() {
    const modal = document.getElementById('unit-detail-modal');
    if (modal) modal.style.display = 'none';
  }

  bookFromUnitModal(unitNumber) {
    this.closeUnitDetail();
    this.setView('schedule');
    const unitSelect = document.getElementById('book-unit');
    if (unitSelect) {
      for (let i = 0; i < unitSelect.options.length; i++) {
        if (unitSelect.options[i].value.includes(unitNumber)) {
          unitSelect.selectedIndex = i;
          break;
        }
      }
    }
  }

  /* =========================================================================
     Amenidades
     ========================================================================= */
  filterAmenities(category, btnElement) {
    this.amenityFilter = category;
    if (btnElement) {
      const parent = btnElement.parentElement;
      parent.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
      btnElement.classList.add('active');
    }
    this.renderAmenities();
  }

  renderAmenities() {
    const container = document.getElementById('amenities-cards-container');
    if (!container) return;

    let items = this.amenities;
    if (this.amenityFilter !== 'all') {
      items = items.filter(a => a.category === this.amenityFilter);
    }

    container.innerHTML = items.map(a => `
      <article class="amenity-card">
        <div class="amenity-img-wrap">
          <img src="${a.image}" alt="${a.name} - Jardines del Cerro IV" class="amenity-img" loading="lazy">
        </div>
        <div class="amenity-body">
          <div class="amenity-header">
            <div class="amenity-icon">
              ${a.icon}
            </div>
            <h3 class="amenity-title">${a.name}</h3>
          </div>
          <p class="amenity-desc">${a.desc}</p>
        </div>
      </article>
    `).join('');
  }

  /* =========================================================================
     Proceso de Adquisición
     ========================================================================= */
  renderProcess() {
    const container = document.getElementById('process-cards-container');
    if (!container) return;

    container.innerHTML = this.processSteps.map(step => `
      <div class="process-card">
        <div class="process-step-num">${step.step}</div>
        <h3 class="process-card-title">${step.title}</h3>
        <p class="process-card-desc">${step.desc}</p>
      </div>
    `).join('');
  }

  /* =========================================================================
     Agendador de Visitas Interactivo (Calendario)
     ========================================================================= */
  renderCalendar() {
    const monthNames = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const titleEl = document.getElementById('cal-month-title');
    if (titleEl) {
      titleEl.innerText = `${monthNames[this.calMonth]} ${this.calYear}`;
    }

    const daysContainer = document.getElementById('calendar-days-container');
    if (!daysContainer) return;

    const firstDayIndex = new Date(this.calYear, this.calMonth, 1).getDay();
    const totalDaysInMonth = new Date(this.calYear, this.calMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let html = '';

    // Espacios vacíos antes del día 1
    for (let i = 0; i < firstDayIndex; i++) {
      html += `<div class="calendar-day disabled" style="opacity: 0;"></div>`;
    }

    // Días del mes
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const currentCalDate = new Date(this.calYear, this.calMonth, d);
      currentCalDate.setHours(0, 0, 0, 0);

      const isPast = currentCalDate < today;
      const isSelected = this.selectedDate &&
        this.selectedDate.getFullYear() === this.calYear &&
        this.selectedDate.getMonth() === this.calMonth &&
        this.selectedDate.getDate() === d;

      if (isPast) {
        html += `<div class="calendar-day disabled">${d}</div>`;
      } else {
        html += `
          <button type="button" class="calendar-day ${isSelected ? 'selected' : ''}" onclick="window.app.selectDate(${d});">
            ${d}
          </button>
        `;
      }
    }

    daysContainer.innerHTML = html;
  }

  prevMonth() {
    const today = new Date();
    if (this.calYear === today.getFullYear() && this.calMonth === today.getMonth()) {
      return; // No retroceder antes del mes actual
    }
    if (this.calMonth === 0) {
      this.calMonth = 11;
      this.calYear--;
    } else {
      this.calMonth--;
    }
    this.renderCalendar();
  }

  nextMonth() {
    if (this.calMonth === 11) {
      this.calMonth = 0;
      this.calYear++;
    } else {
      this.calMonth++;
    }
    this.renderCalendar();
  }

  selectDate(day) {
    this.selectedDate = new Date(this.calYear, this.calMonth, day);
    this.renderCalendar();
    this.updateBookingSummary();
  }

  selectTimeSlot(slot, btnElement) {
    this.selectedTimeSlot = slot;
    if (btnElement) {
      const parent = btnElement.parentElement;
      parent.querySelectorAll('.time-slot-btn').forEach(btn => btn.classList.remove('selected'));
      btnElement.classList.add('selected');
    }
    this.updateBookingSummary();
  }

  setBookingModality(mode) {
    this.bookingModality = mode;
    const btnPresencial = document.getElementById('btn-mode-presencial');
    const btnVirtual = document.getElementById('btn-mode-virtual');

    if (mode === 'presencial') {
      btnPresencial.classList.add('active');
      btnVirtual.classList.remove('active');
    } else {
      btnVirtual.classList.add('active');
      btnPresencial.classList.remove('active');
    }
    this.updateBookingSummary();
  }

  updateBookingSummary() {
    const dateEl = document.getElementById('summary-date');
    const timeEl = document.getElementById('summary-time');
    const modeEl = document.getElementById('summary-mode');

    if (dateEl && this.selectedDate) {
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      dateEl.innerText = this.selectedDate.toLocaleDateString('es-ES', options);
    }

    if (timeEl) {
      timeEl.innerText = this.selectedTimeSlot;
    }

    if (modeEl) {
      modeEl.innerText = this.bookingModality === 'presencial'
        ? 'Presencial en la Torre (Mao)'
        : 'Videollamada Interactiva Virtual';
    }
  }

  handleBookingSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('book-name').value.trim();
    const phone = document.getElementById('book-phone').value.trim();
    const email = document.getElementById('book-email').value.trim();
    const unit = document.getElementById('book-unit').value;
    const notes = document.getElementById('book-notes').value.trim();

    if (!name || !phone) {
      alert("Por favor completa tu nombre y número de teléfono.");
      return;
    }

    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    const dateFormatted = this.selectedDate.toLocaleDateString('es-ES', options);
    const newVisitId = `VIS-${Math.floor(200 + Math.random() * 900)}`;

    // Incorporar a datos de administrador
    this.adminData.visits.unshift({
      id: newVisitId,
      visitor: name,
      phone: phone,
      unit: unit,
      date: dateFormatted,
      time: this.selectedTimeSlot,
      mode: this.bookingModality === 'presencial' ? 'Presencial en Mao' : 'Videollamada',
      status: 'Confirmada'
    });

    this.adminData.recentActivity.unshift({
      title: `Nueva visita agendada (${unit}) — ${name}`,
      time: 'Hace un momento',
      type: 'visit'
    });

    // Mostrar notificación
    this.showToast(`¡Cita agendada con éxito para el ${dateFormatted} a las ${this.selectedTimeSlot}!`);

    // Limpiar formulario y volver al inicio tras breve pausa
    e.target.reset();
    setTimeout(() => {
      this.setView('landing', 'hero');
    }, 2000);
  }

  handleContactSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('quick-contact-name').value.trim();
    const phone = document.getElementById('quick-contact-phone').value.trim();
    const email = document.getElementById('quick-contact-email').value.trim();
    const unit = document.getElementById('quick-contact-unit').value;
    const msg = document.getElementById('quick-contact-message').value.trim();

    this.adminData.prospects.unshift({
      id: `PROS-${Math.floor(10 + Math.random() * 90)}`,
      name: name,
      phone: phone,
      email: email || 'Sin correo',
      unit: unit || 'General',
      type: 'Consulta web',
      date: 'Hoy',
      status: 'Nuevo'
    });

    this.showToast("¡Mensaje recibido! Nos comunicaremos contigo a la mayor brevedad.");
    e.target.reset();
  }

  /* =========================================================================
     Simulador Hipotecario & Impuesto DGII Ley 173-07 (Punto 16.1 & 16.10)
     ========================================================================= */
  updateMortgageCalculator() {
    const unitSelect = document.getElementById('calc-unit-select');
    const customWrap = document.getElementById('calc-custom-price-wrap');
    const customInput = document.getElementById('calc-custom-price');
    const bankSelect = document.getElementById('calc-bank-select');
    const downRange = document.getElementById('calc-downpayment-range');
    const downPctLabel = document.getElementById('calc-downpayment-pct-label');

    if (!unitSelect || !bankSelect || !downRange) return;

    let price = 145000;
    if (unitSelect.value === 'custom') {
      if (customWrap) customWrap.style.display = 'block';
      price = parseFloat(customInput.value) || 150000;
    } else {
      if (customWrap) customWrap.style.display = 'none';
      price = parseFloat(unitSelect.value) || 145000;
    }
    this.mortgageState.price = price;

    const bankId = bankSelect.value;
    this.mortgageState.bankId = bankId;
    const bankObj = (typeof MORTGAGE_SIMULATOR_DATA !== 'undefined' && MORTGAGE_SIMULATOR_DATA.banks)
      ? (MORTGAGE_SIMULATOR_DATA.banks.find(b => b.id === bankId) || MORTGAGE_SIMULATOR_DATA.banks[0])
      : { rate: 10.50 };
    const annualRate = bankObj.rate / 100;

    const downPercent = parseInt(downRange.value, 10) || 25;
    this.mortgageState.downPercent = downPercent;
    if (downPctLabel) downPctLabel.innerText = `${downPercent}%`;

    const termYears = this.mortgageState.termYears || 20;

    // Desglose
    const downPayment = price * (downPercent / 100);
    const reservationCredit = 5000;
    const remainingDown = Math.max(0, downPayment - reservationCredit);
    const loanAmount = price - downPayment;

    // Cuota Francesa: M = L * [r * (1 + r)^n] / [(1 + r)^n - 1]
    const monthlyRate = annualRate / 12;
    const numPayments = termYears * 12;
    const monthlyPaymentUsd = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    const dopExchange = (typeof MORTGAGE_SIMULATOR_DATA !== 'undefined') ? MORTGAGE_SIMULATOR_DATA.dopExchangeRate : 60.50;
    const monthlyPaymentDop = monthlyPaymentUsd * dopExchange;

    // Impuesto DGII (3% Ley 173-07)
    const dgiiRate = (typeof MORTGAGE_SIMULATOR_DATA !== 'undefined') ? MORTGAGE_SIMULATOR_DATA.dgiiTransferTaxRate : 0.03;
    const dgiiTaxUsd = price * dgiiRate;
    const dgiiTaxDop = dgiiTaxUsd * dopExchange;

    // Elementos DOM
    const monthlyUsdEl = document.getElementById('calc-result-monthly-usd');
    const monthlyDopEl = document.getElementById('calc-result-monthly-dop');
    const summaryTotalEl = document.getElementById('calc-summary-total-usd');
    const summaryDownEl = document.getElementById('calc-summary-down-usd');
    const summaryRemainingEl = document.getElementById('calc-summary-remaining-down');
    const summaryFinancedEl = document.getElementById('calc-summary-financed-usd');
    const dgiiTaxEl = document.getElementById('calc-result-dgii-tax');

    if (monthlyUsdEl) monthlyUsdEl.innerText = `US$ ${Math.round(monthlyPaymentUsd).toLocaleString('en-US')} / mes`;
    if (monthlyDopEl) monthlyDopEl.innerText = `Aprox. RD$ ${Math.round(monthlyPaymentDop).toLocaleString('en-US')} DOP / mes (Tasa ref. ${dopExchange.toFixed(2)})`;
    if (summaryTotalEl) summaryTotalEl.innerText = `US$ ${Math.round(price).toLocaleString('en-US')}`;
    if (summaryDownEl) summaryDownEl.innerText = `US$ ${Math.round(downPayment).toLocaleString('en-US')} (${downPercent}%)`;
    if (summaryRemainingEl) summaryRemainingEl.innerText = `US$ ${Math.round(remainingDown).toLocaleString('en-US')}.00`;
    if (summaryFinancedEl) summaryFinancedEl.innerText = `US$ ${Math.round(loanAmount).toLocaleString('en-US')}`;
    if (dgiiTaxEl) dgiiTaxEl.innerText = `US$ ${Math.round(dgiiTaxUsd).toLocaleString('en-US')} (RD$ ${Math.round(dgiiTaxDop).toLocaleString('en-US')})`;
  }

  setMortgageTerm(years, btn) {
    this.mortgageState.termYears = years;
    document.querySelectorAll('.calc-term-btn').forEach(b => {
      b.classList.remove('active');
      b.style.background = 'transparent';
      b.style.color = 'var(--ink)';
      b.style.borderColor = 'var(--linen-dark)';
    });
    if (btn) {
      btn.classList.add('active');
      btn.style.background = 'var(--primary)';
      btn.style.color = '#fff';
      btn.style.borderColor = 'var(--primary)';
    }
    this.updateMortgageCalculator();
  }

  applyCalculatorToBooking() {
    this.setView('schedule');
    const bankSelect = document.getElementById('calc-bank-select');
    const bankName = bankSelect ? bankSelect.options[bankSelect.selectedIndex].text.split('—')[0].trim() : 'banco preferido';
    const notesInput = document.getElementById('book-notes');
    if (notesInput) {
      notesInput.value = `Deseo financiamiento bancario con ${bankName}. Inicial configurado: ${this.mortgageState.downPercent}%, plazo: ${this.mortgageState.termYears} años.`;
    }
    this.showToast("Parámetros del simulador cargados en tu formulario de cita.");
  }

  /* =========================================================================
     Módulo de Separación Transaccional (US$ 5,000 - 15 min - Punto 16.8)
     ========================================================================= */
  openReservationModal(unitId) {
    this.closeUnitDetail();
    const unit = this.units.find(u => u.id === unitId || u.number === unitId) || this.units[0];
    this.reservationState.unitId = unit.id;
    this.reservationState.unitNumber = unit.number;
    this.reservationState.unitPrice = unit.price;
    this.reservationState.timerSeconds = 15 * 60; // 15 minutos exactos

    const modal = document.getElementById('reservation-modal');
    const subtitle = document.getElementById('res-modal-unit-subtitle');

    if (subtitle) {
      subtitle.innerText = `Bloqueo transaccional de Unidad ${unit.number} (${unit.typeName}) · Nivel ${unit.level}`;
    }

    if (modal) {
      modal.style.display = 'flex';
      this.switchReservationPaymentTab('paypal');
      this.startReservationTimer();
    }
  }

  closeReservationModal() {
    if (this.reservationState.timerInterval) {
      clearInterval(this.reservationState.timerInterval);
      this.reservationState.timerInterval = null;
    }
    const modal = document.getElementById('reservation-modal');
    if (modal) modal.style.display = 'none';
  }

  startReservationTimer() {
    if (this.reservationState.timerInterval) {
      clearInterval(this.reservationState.timerInterval);
    }
    const timerDisplay = document.getElementById('res-countdown-timer');

    const updateTimer = () => {
      const mins = Math.floor(this.reservationState.timerSeconds / 60);
      const secs = this.reservationState.timerSeconds % 60;
      if (timerDisplay) {
        timerDisplay.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      }

      if (this.reservationState.timerSeconds <= 0) {
        clearInterval(this.reservationState.timerInterval);
        this.reservationState.timerInterval = null;
        alert("La ventana temporal de separación de 15 minutos ha expirado. La unidad ha sido liberada en el catálogo.");
        this.closeReservationModal();
      } else {
        this.reservationState.timerSeconds--;
      }
    };

    updateTimer();
    this.reservationState.timerInterval = setInterval(updateTimer, 1000);
  }

  switchReservationPaymentTab(method) {
    this.reservationState.paymentMethod = method;
    const paypalBtn = document.getElementById('res-tab-paypal-btn');
    const bankBtn = document.getElementById('res-tab-bank-btn');
    const paypalPanel = document.getElementById('res-paypal-panel');
    const bankPanel = document.getElementById('res-bank-panel');

    if (method === 'paypal') {
      if (paypalBtn) { paypalBtn.className = 'btn-primary'; paypalBtn.style.color = '#fff'; }
      if (bankBtn) { bankBtn.className = 'btn-outline'; bankBtn.style.color = 'var(--dust)'; bankBtn.style.border = 'none'; }
      if (paypalPanel) paypalPanel.style.display = 'block';
      if (bankPanel) bankPanel.style.display = 'none';
    } else {
      if (bankBtn) { bankBtn.className = 'btn-primary'; bankBtn.style.color = '#fff'; }
      if (paypalBtn) { paypalBtn.className = 'btn-outline'; paypalBtn.style.color = 'var(--dust)'; paypalBtn.style.border = 'none'; }
      if (bankPanel) bankPanel.style.display = 'block';
      if (paypalPanel) paypalPanel.style.display = 'none';
    }
  }

  handleConfirmReservationPaypal(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('res-paypal-name').value.trim() || 'Titular de Reserva';
    const email = document.getElementById('res-paypal-email').value.trim() || 'correo@ejemplo.com';

    this.processReservationSuccess(name, email, 'PayPal Online');
  }

  handleConfirmReservationBank(e) {
    if (e) e.preventDefault();
    const bank = document.getElementById('res-bank-name').value;
    const voucher = document.getElementById('res-bank-voucher').value.trim() || 'TRF-DEP-8921';

    this.processReservationSuccess('Comprador en Trámite', 'banco@jardinesdelcerro.do', `Transferencia ${bank} (Voucher ${voucher})`);
  }

  processReservationSuccess(clientName, clientEmail, paymentMethod) {
    const unit = this.units.find(u => u.id === this.reservationState.unitId || u.number === this.reservationState.unitNumber);
    if (unit) {
      unit.status = 'reserved';
      unit.statusLabel = 'Reservado';
    }

    this.adminData.recentActivity.unshift({
      title: `Separación US$5,000 recibida (${unit ? unit.number : 'Unidad'}) — ${clientName} vía ${paymentMethod}`,
      time: 'Hace un momento',
      type: 'visit'
    });

    this.adminData.prospects.unshift({
      id: `RES-${Math.floor(100 + Math.random() * 900)}`,
      name: clientName,
      phone: '(809) 555-0100',
      email: clientEmail,
      unit: unit ? `Unidad ${unit.number}` : 'Unidad',
      type: 'Separación Pagada (US$5,000)',
      date: 'Hoy',
      status: 'Separación Acreditada'
    });

    const resDir = this.adminData.residents.find(r => r.unit === (unit ? unit.number : ''));
    if (resDir) {
      resDir.name = `${clientName} (En Cierre)`;
      resDir.status = 'Reservado';
      resDir.condition = 'Comprador en cierre (30 días)';
    }

    this.saveAllState();
    this.closeReservationModal();
    this.renderUnits();
    if (this.isAdminLoggedIn) this.renderAdminTabContent();

    this.showToast(`¡Unidad ${unit ? unit.number : ''} separada exitosamente! US$5,000 acreditados. Exclusividad garantizada por 30 días.`);
  }

  /* =========================================================================
     Portal de Residentes (Propietarios & Inquilinos - Puntos 16.3 & 16.4)
     ========================================================================= */
  switchResidentAuthTab(tab) {
    const loginForm = document.getElementById('resident-login-form');
    const registerForm = document.getElementById('resident-register-form');
    const btnLogin = document.getElementById('tab-btn-resident-login');
    const btnRegister = document.getElementById('tab-btn-resident-register');
    const pendingAlert = document.getElementById('resident-pending-alert');

    const formError = document.getElementById('reg-form-error');
    if (formError) formError.style.display = 'none';

    if (tab === 'login') {
      if (loginForm) loginForm.style.display = 'block';
      if (registerForm) registerForm.style.display = 'none';
      if (btnLogin) { btnLogin.className = 'btn-primary'; btnLogin.style.color = '#fff'; }
      if (btnRegister) { btnRegister.className = 'btn-outline'; btnRegister.style.color = 'var(--dust)'; btnRegister.style.border = 'none'; }
    } else {
      if (loginForm) loginForm.style.display = 'none';
      if (registerForm) registerForm.style.display = 'block';
      if (pendingAlert) pendingAlert.style.display = 'none';
      if (btnRegister) { btnRegister.className = 'btn-primary'; btnRegister.style.color = '#fff'; }
      if (btnLogin) { btnLogin.className = 'btn-outline'; btnLogin.style.color = 'var(--dust)'; btnLogin.style.border = 'none'; }
      this.renderRegistrationUnitsDropdown();
    }
  }

  fillDemoResident(role) {
    this.switchResidentAuthTab('login');
    const userField = document.getElementById('resident-login-user');
    const passField = document.getElementById('resident-login-pass');
    const roleField = document.getElementById('resident-login-role');

    if (role === 'owner') {
      if (userField) userField.value = 'ramona.ramos@gmail.com';
      if (passField) passField.value = '1234';
      if (roleField) roleField.value = 'owner';
      this.showToast("Credenciales de Ramona Ramos (Propietaria U-301) cargadas.");
    } else {
      if (userField) userField.value = 'lbatista@claro.net.do';
      if (passField) passField.value = '1234';
      if (roleField) roleField.value = 'tenant';
      this.showToast("Credenciales de Dra. Laura Batista (Inquilina U-101) cargadas.");
    }
  }

  /* =========================================================================
     Validaciones de Autenticación & Registro (Cédula Única, Contrato & Clave)
     ========================================================================= */
  normalizeDoc(doc) {
    return (doc || '').toString().trim().replace(/[-\s]/g, '').toLowerCase();
  }

  isDocumentIdTaken(docId) {
    const norm = this.normalizeDoc(docId);
    if (!norm) return false;
    const inUsers = (this.registeredUsers || []).some(u => this.normalizeDoc(u.documentId) === norm);
    const inReqs = ((this.adminData && this.adminData.registrationRequests) || []).some(
      r => this.normalizeDoc(r.documentId) === norm && r.status !== 'rejected'
    );
    const customAdmins = JSON.parse(localStorage.getItem('custom_admins') || '[]');
    const inAdmins = customAdmins.some(a => this.normalizeDoc(a.documentId) === norm);
    return inUsers || inReqs || inAdmins;
  }

  isEmailTaken(email) {
    const clean = (email || '').toString().trim().toLowerCase();
    if (!clean) return false;
    const inUsers = (this.registeredUsers || []).some(u => (u.email || '').toLowerCase() === clean);
    const inReqs = ((this.adminData && this.adminData.registrationRequests) || []).some(
      r => (r.email || '').toLowerCase() === clean && r.status !== 'rejected'
    );
    const customAdmins = JSON.parse(localStorage.getItem('custom_admins') || '[]');
    const inAdmins = customAdmins.some(a => (a.email || '').toLowerCase() === clean);
    return inUsers || inReqs || inAdmins;
  }

  /* =========================================================================
     Gestión Dinámica de Unidades Disponibles para Registro
     ========================================================================= */
  isUnitOccupied(unitNumber) {
    const clean = (unitNumber || '').toString().replace('Unidad', '').replace('unidad', '').trim().toLowerCase();
    if (!clean) return false;

    // 1. Revisar si hay un usuario aprobado para esta unidad en el padrón
    const hasApprovedUser = (this.registeredUsers || []).some(u => {
      const uNum = (u.unit || '').toString().replace('Unidad', '').replace('unidad', '').trim().toLowerCase();
      return uNum === clean && u.status === 'approved';
    });
    if (hasApprovedUser) return true;

    // 2. Revisar inventario de unidades en catálogo
    const invUnit = (this.units || []).find(u => {
      const uNum = (u.number || '').toString().toLowerCase();
      const uId = (u.id || '').toString().toLowerCase();
      return uNum === clean || uId === clean || uId === `apt-${clean}` || uId === `ph-${clean}` || (u.id && u.id.endsWith(clean));
    });
    if (invUnit && invUnit.status === 'occupied') {
      return true;
    }

    // 3. Revisar en el directorio de residentes del administrador
    const resDir = ((this.adminData && this.adminData.residents) || []).find(r => {
      const rNum = (r.unit || '').toString().replace('Unidad', '').replace('unidad', '').trim().toLowerCase();
      return rNum === clean;
    });
    if (resDir && resDir.condition !== 'Disponible' && resDir.name !== '—' && !resDir.name.includes('Disponible')) {
      return true;
    }

    // 4. Revisar si hay una solicitud aprobada para esta unidad
    const hasApprovedReq = ((this.adminData && this.adminData.registrationRequests) || []).some(req => {
      const reqNum = (req.unit || '').toString().replace('Unidad', '').replace('unidad', '').trim().toLowerCase();
      return reqNum === clean && req.status === 'approved';
    });
    if (hasApprovedReq) return true;

    return false;
  }

  renderRegistrationUnitsDropdown() {
    const select = document.getElementById('reg-unit');
    if (!select) return;

    const previousVal = select.value;

    // Catálogo base de unidades
    const allUnits = (this.units && this.units.length > 0) ? this.units : [
      { number: "101", typeName: "Apartamento", sqm: 120 },
      { number: "201", typeName: "Apartamento", sqm: 120 },
      { number: "301", typeName: "Apartamento", sqm: 120 },
      { number: "501", typeName: "Apartamento", sqm: 120 },
      { number: "PH-901", typeName: "Penthouse", sqm: 170 },
      { number: "PH-1001", typeName: "Penthouse", sqm: 170 }
    ];

    // Filtrar solo las unidades que NO están ocupadas por un residente aprobado
    const availableUnits = allUnits.filter(u => !this.isUnitOccupied(u.number));

    select.innerHTML = '';

    if (availableUnits.length === 0) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.disabled = true;
      opt.selected = true;
      opt.textContent = '⚠️ No hay unidades residenciales disponibles (Todas asignadas)';
      select.appendChild(opt);
      select.disabled = true;
    } else {
      select.disabled = false;
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.disabled = true;
      placeholder.textContent = 'Selecciona tu unidad residencial asignada...';
      select.appendChild(placeholder);

      availableUnits.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.number;
        const prefix = (u.typeName && u.typeName.toLowerCase().includes('penthouse')) ? '' : 'Unidad ';
        opt.textContent = `${prefix}${u.number} (${u.sqm || 120} m²)`;
        select.appendChild(opt);
      });

      // Si el valor seleccionado previamente sigue estando disponible, mantenerlo; sino, placeholder
      if (previousVal && availableUnits.some(u => u.number === previousVal)) {
        select.value = previousVal;
      } else {
        placeholder.selected = true;
      }
    }
  }

  handleDocInput(input) {
    const warning = document.getElementById('reg-doc-warning');
    const val = input.value.trim();
    const norm = this.normalizeDoc(val);

    if (norm.length >= 7) {
      if (this.isDocumentIdTaken(norm)) {
        if (warning) {
          warning.style.display = 'block';
          warning.innerText = `⚠️ La cédula '${val}' ya está registrada o en proceso de revisión.`;
        }
        input.style.borderColor = '#dc2626';
        return;
      }
    }
    if (warning) warning.style.display = 'none';
    input.style.borderColor = '';
  }

  handleEmailInput(input) {
    const warning = document.getElementById('reg-email-warning');
    const val = input.value.trim().toLowerCase();

    if (val.includes('@') && val.includes('.')) {
      if (this.isEmailTaken(val)) {
        if (warning) {
          warning.style.display = 'block';
          warning.innerText = `⚠️ El correo '${val}' ya se encuentra registrado.`;
        }
        input.style.borderColor = '#dc2626';
        return;
      }
    }
    if (warning) warning.style.display = 'none';
    input.style.borderColor = '';
  }

  handleContractFileSelected(input) {
    const filenameDisplay = document.getElementById('reg-contract-filename');
    const dropzone = document.getElementById('reg-contract-dropzone');
    const removeBtn = document.getElementById('reg-contract-remove-btn');
    const errorEl = document.getElementById('reg-contract-error');

    if (input.files && input.files[0]) {
      const file = input.files[0];
      const allowed = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
      const ext = '.' + file.name.split('.').pop().toLowerCase();

      if (!allowed.includes(ext)) {
        if (filenameDisplay) {
          filenameDisplay.innerHTML = `❌ Formato no permitido (<code>${ext}</code>). Solo PDF, JPG, PNG o WEBP.`;
          filenameDisplay.style.color = '#dc2626';
        }
        if (dropzone) {
          dropzone.classList.remove('has-file');
          dropzone.classList.add('has-error');
        }
        input.value = '';
        if (removeBtn) removeBtn.style.display = 'none';
        return;
      }

      if (filenameDisplay) {
        filenameDisplay.innerHTML = `✓ <strong>Archivo cargado:</strong> ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
        filenameDisplay.style.color = '#047857';
      }
      if (dropzone) {
        dropzone.classList.remove('has-error');
        dropzone.classList.add('has-file');
      }
      if (removeBtn) removeBtn.style.display = 'inline-block';
      if (errorEl) errorEl.style.display = 'none';
    } else {
      this.clearContractFile();
    }
  }

  clearContractFile() {
    const input = document.getElementById('reg-contract-file');
    if (input) input.value = '';
    const filenameDisplay = document.getElementById('reg-contract-filename');
    const dropzone = document.getElementById('reg-contract-dropzone');
    const removeBtn = document.getElementById('reg-contract-remove-btn');
    if (filenameDisplay) {
      filenameDisplay.innerHTML = '⚠️ Ningún archivo adjunto (Requerido: PDF o Imagen)';
      filenameDisplay.style.color = '#dc2626';
    }
    if (dropzone) {
      dropzone.classList.remove('has-file', 'has-error');
    }
    if (removeBtn) removeBtn.style.display = 'none';
  }

  validatePasswordStrength() {
    const passInput = document.getElementById('reg-pass');
    const confirmInput = document.getElementById('reg-pass-confirm');
    if (!passInput) return false;

    const pass = passInput.value;
    const confirm = confirmInput ? confirmInput.value : '';

    const hasLen = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNum = /\d/.test(pass);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(pass);
    const hasMatch = pass.length > 0 && confirm.length > 0 && pass === confirm;

    const updateRule = (id, valid) => {
      const el = document.getElementById(id);
      if (!el) return;
      const icon = el.querySelector('.pw-rule-icon');
      if (valid) {
        el.classList.remove('invalid');
        el.classList.add('valid');
        if (icon) icon.innerText = '✓';
      } else {
        el.classList.remove('valid');
        el.classList.add('invalid');
        if (icon) icon.innerText = '✕';
      }
    };

    updateRule('rule-len', hasLen);
    updateRule('rule-upper', hasUpper);
    updateRule('rule-lower', hasLower);
    updateRule('rule-num', hasNum);
    updateRule('rule-special', hasSpecial);
    updateRule('rule-match', hasMatch);

    let score = 0;
    if (hasLen) score++;
    if (hasUpper) score++;
    if (hasLower) score++;
    if (hasNum) score++;
    if (hasSpecial) score++;

    const bar = document.getElementById('pw-strength-bar');
    const label = document.getElementById('pw-strength-label');

    if (pass.length === 0) {
      if (bar) { bar.style.width = '0%'; bar.style.backgroundColor = '#ef4444'; }
      if (label) { label.innerText = 'No ingresada'; label.style.color = '#9ca3af'; }
    } else if (score <= 1) {
      if (bar) { bar.style.width = '20%'; bar.style.backgroundColor = '#ef4444'; }
      if (label) { label.innerText = 'Muy Débil'; label.style.color = '#ef4444'; }
    } else if (score === 2) {
      if (bar) { bar.style.width = '40%'; bar.style.backgroundColor = '#f97316'; }
      if (label) { label.innerText = 'Débil'; label.style.color = '#f97316'; }
    } else if (score === 3) {
      if (bar) { bar.style.width = '60%'; bar.style.backgroundColor = '#eab308'; }
      if (label) { label.innerText = 'Media'; label.style.color = '#eab308'; }
    } else if (score === 4) {
      if (bar) { bar.style.width = '80%'; bar.style.backgroundColor = '#0d9488'; }
      if (label) { label.innerText = 'Buena'; label.style.color = '#0d9488'; }
    } else if (score === 5) {
      if (bar) { bar.style.width = '100%'; bar.style.backgroundColor = '#10b981'; }
      if (label) { label.innerText = 'Segura y Robusta'; label.style.color = '#10b981'; }
    }

    return hasLen && hasUpper && hasLower && hasNum && hasSpecial && hasMatch;
  }

  togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    if (btn) {
      btn.innerHTML = isPassword
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`;
    }
  }

  async handleResidentRegisterSubmit(e) {
    e.preventDefault();

    const formError = document.getElementById('reg-form-error');
    const showError = (msg) => {
      if (formError) {
        formError.style.display = 'block';
        formError.innerHTML = `<strong>Error de validación:</strong> ${msg}`;
        formError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        alert(msg);
      }
    };
    if (formError) formError.style.display = 'none';

    const name = document.getElementById('reg-name').value.trim();
    const docId = document.getElementById('reg-doc').value.trim();
    const phone = document.getElementById('reg-phone').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const unit = document.getElementById('reg-unit').value;
    const role = document.getElementById('reg-role').value;
    const pass = (document.getElementById('reg-pass') || {}).value || '';
    const passConfirm = (document.getElementById('reg-pass-confirm') || {}).value || '';

    // 0. VALIDACIÓN: Unidad obligatoria y disponible
    if (!unit || this.isUnitOccupied(unit)) {
      showError('La unidad residencial seleccionada ya se encuentra ocupada por un residente aprobado. Por favor selecciona otra unidad de la lista.');
      this.renderRegistrationUnitsDropdown();
      const unitInput = document.getElementById('reg-unit');
      if (unitInput) unitInput.focus();
      return;
    }

    // 1. VALIDACIÓN: Cédula única (Requisito 1)
    if (this.isDocumentIdTaken(docId)) {
      showError(`El número de cédula o documento '${docId}' ya se encuentra registrado o tiene una solicitud en trámite de validación.`);
      const docInput = document.getElementById('reg-doc');
      if (docInput) {
        docInput.focus();
        docInput.style.borderColor = '#dc2626';
      }
      return;
    }

    // 2. VALIDACIÓN: Correo único
    if (this.isEmailTaken(email)) {
      showError(`El correo electrónico '${email}' ya se encuentra registrado en el sistema.`);
      const emailInput = document.getElementById('reg-email');
      if (emailInput) {
        emailInput.focus();
        emailInput.style.borderColor = '#dc2626';
      }
      return;
    }

    // 3. VALIDACIÓN: Documento del contrato obligatorio (Requisito 2)
    const contractFileEl = document.getElementById('reg-contract-file');
    const file = (contractFileEl && contractFileEl.files && contractFileEl.files[0]) ? contractFileEl.files[0] : null;

    if (!file) {
      showError('Es obligatorio adjuntar el archivo físico del contrato notariado (PDF o Imagen) para formalizar la solicitud.');
      const dropzone = document.getElementById('reg-contract-dropzone');
      if (dropzone) {
        dropzone.classList.add('has-error');
        dropzone.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      return;
    }

    const allowedExts = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExts.includes(fileExt)) {
      showError(`El archivo '${file.name}' no tiene una extensión admitida. Solo se aceptan documentos PDF, JPG, PNG o WEBP.`);
      return;
    }

    // 4. VALIDACIÓN: Contraseña segura (Requisito 3)
    const isStrong = this.validatePasswordStrength();
    if (!isStrong) {
      if (pass !== passConfirm) {
        showError('Las contraseñas no coinciden. Por favor confirma tu contraseña exactamente.');
        document.getElementById('reg-pass-confirm').focus();
      } else {
        showError('La contraseña no cumple con los requisitos de seguridad obligatorios: mínimo 8 caracteres, al menos una mayúscula (A-Z), una minúscula (a-z), un número (0-9) y un símbolo especial (!@#$%...).');
        document.getElementById('reg-pass').focus();
      }
      return;
    }

    const submitBtn = document.getElementById('btn-submit-register');
    const originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Procesando solicitud y expediente...</span>`;
    }

    const newReqId = `SOL-2026-${Math.floor(100 + Math.random() * 899)}`;
    const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const contractFileName = file.name;

    // Conexión con Backend FastAPI
    if (window.apiClient) {
      const formData = new FormData();
      formData.append('full_name', name);
      formData.append('document_id', docId);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('unit', unit);
      formData.append('role', role);
      formData.append('password', pass);
      formData.append('contract_file', file);

      try {
        const backendRes = await window.apiClient.registerWithContract(formData);
        if (backendRes && backendRes.success === false) {
          showError(backendRes.error || 'Error reportado por el servidor al radicar la solicitud.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHtml;
          }
          return;
        }
      } catch (err) {
        console.warn('Advertencia al enviar al backend:', err);
      }
    }

    const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'US';

    const newRequest = {
      id: newReqId,
      date: today,
      applicantName: name,
      documentId: docId,
      email: email,
      phone: phone,
      unit: unit,
      roleRequested: role,
      roleLabel: role === 'owner' ? 'Propietario Titular' : 'Inquilino Arrendatario',
      contractFile: contractFileName,
      contractDate: today,
      status: 'pending',
      password: pass,
      notes: `Solicitud de ingreso formal radicada desde el portal web con contrato adjunto (${file.name}).`
    };

    const processComplete = (dataUrl = null, fileType = null, fileSize = null) => {
      try {
        if (dataUrl) {
          newRequest.contractDataUrl = dataUrl;
          newRequest.contractFileType = fileType;
          newRequest.contractFileSize = fileSize;
        }

        // 1. Agregar solicitud pendiente en el panel de administración (Puntos 16.3 & 16.4)
        this.adminData.registrationRequests.unshift(newRequest);

        // 2. Registrar usuario en padrón con estado "pending" y su contraseña segura
        const now = new Date();
        const currentMonthYear = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        const capitalizedMonth = currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1);
        const todayShort = now.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

        const newUser = {
          id: `usr-${unit.toLowerCase()}-${Date.now()}`,
          name: name,
          documentId: docId,
          email: email,
          phone: phone,
          unit: unit,
          role: role,
          roleLabel: role === 'owner' ? 'Propietario Residente' : 'Inquilino Arrendatario',
          aliquot: role === 'owner' ? '4.65%' : 'N/A (Inquilino)',
          password: pass,
          status: 'pending',
          avatar: initials,
          aiSubscription: {
            active: false,
            plan: null,
            priceUsd: null,
            paypalSubId: null,
            subscribedAt: null,
            renewalDate: null,
            statusLabel: 'Inactiva (Requiere Suscripción)'
          },
          accountData: {
            unit: unit,
            type: `Apartamento · Unidad ${unit}`,
            resident: role === 'owner' ? 'Propietario Titular' : 'Inquilino Arrendatario',
            sqm: 120,
            bedrooms: 3,
            bathrooms: 2,
            status: 'Al día',
            statusNote: role === 'owner' ? `Propietario Titular · Unidad ${unit}` : `Inquilino Arrendatario · Unidad ${unit}`,
            nextFee: `15 ${todayShort}`,
            nextFeeNote: 'Cuota de mantenimiento mensual',
            activeRequests: 0,
            activities: [],
            cuotas: [
              {
                period: capitalizedMonth,
                due: `15 ${todayShort}`,
                amount: 'RD$ 6,500.00',
                status: 'Pendiente',
                badge: 'badge-warning'
              }
            ],
            pagos: [],
            tickets: [],
            documentos: []
          }
        };

        this.registeredUsers.push(newUser);
        this.saveAllState();
        this.updateAdminPendingBadge();

        // 3. Notificar y mostrar alerta de cuenta en revisión
        this.switchResidentAuthTab('login');
        const pendingAlert = document.getElementById('resident-pending-alert');
        if (pendingAlert) {
          pendingAlert.style.display = 'block';
          pendingAlert.innerHTML = `
            ⏳ <strong>Solicitud Radicada (${newReqId}):</strong> Tu expediente y contrato notariado (<code>${contractFileName}</code>) han sido remitidos al Administrador de Jardines del Cerro IV para su auditoría y aprobación. Una vez verificado, podrás iniciar sesión con tu clave segura.
          `;
        }

        const userInput = document.getElementById('resident-login-user');
        if (userInput) userInput.value = email;

        this.showToast(`¡Solicitud ${newReqId} radicada! El archivo '${contractFileName}' fue cargado exitosamente.`);
        const formEl = document.getElementById('resident-register-form');
        if (formEl) formEl.reset();
        this.clearContractFile();
        this.validatePasswordStrength();
      } catch (procErr) {
        console.error('Error procesando registro:', procErr);
        showError('Ocurrió un error al procesar la solicitud en el explorador.');
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHtml;
        }
      }
    };

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const fileSize = (file.size / 1024).toFixed(1) + ' KB';
      processComplete(dataUrl, file.type, fileSize);
    };
    reader.onerror = () => {
      processComplete(null, file.type, (file.size / 1024).toFixed(1) + ' KB');
    };
    reader.readAsDataURL(file);
  }

  async loginResident(e) {
    if (e) e.preventDefault();
    const userInput = (document.getElementById('resident-login-user') || {}).value?.trim() || '';
    const passInput = (document.getElementById('resident-login-pass') || {}).value?.trim() || '';
    const pendingAlert = document.getElementById('resident-pending-alert');

    if (!userInput || !passInput) {
      alert("Por favor ingresa tu número de cédula o correo electrónico y tu contraseña de acceso.");
      return;
    }

    const normInput = this.normalizeDoc(userInput);
    const cleanEmail = userInput.toLowerCase();

    // 1. Intentar autenticación con Backend en vivo (FastAPI / Render)
    if (window.apiClient && window.apiClient.isBackendOnline) {
      try {
        const res = await window.apiClient.login(userInput, passInput);
        if (res && res.success && res.user) {
          // Usuario autenticado exitosamente en el backend
          let localUser = this.registeredUsers.find(u =>
            (u.documentId && this.normalizeDoc(u.documentId) === this.normalizeDoc(res.user.document_id)) ||
            (u.email && u.email.toLowerCase() === (res.user.email || '').toLowerCase())
          );

          if (localUser) {
            localUser.status = 'approved';
            localUser.password = passInput;
            if (res.user.role) localUser.role = res.user.role;
            if (res.user.unit) localUser.unit = res.user.unit;
            if (res.user.name) localUser.name = res.user.name;
          } else {
            const now = new Date();
            const currentMonthYear = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            const capitalizedMonth = currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1);
            const todayShort = now.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
            const initials = res.user.avatar || (res.user.name || '').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'US';
            localUser = {
              id: res.user.id || `usr-${(res.user.unit || '101').toLowerCase()}-${Date.now()}`,
              name: res.user.name,
              documentId: res.user.document_id,
              email: res.user.email,
              phone: res.user.phone || '',
              unit: res.user.unit || '101',
              role: res.user.role || 'owner',
              roleLabel: res.user.role_label || (res.user.role === 'owner' ? 'Propietario Residente' : 'Inquilino Arrendatario'),
              aliquot: res.user.aliquot || '4.65%',
              password: passInput,
              status: 'approved',
              avatar: initials,
              aiSubscription: {
                active: true,
                plan: "Plan Residente Convivencia & DGII",
                priceUsd: 9.99,
                paypalSubId: `I-RES-${res.user.unit || '101'}`,
                subscribedAt: '12 Oct 2026',
                renewalDate: '12 Nov 2026',
                statusLabel: 'Activa vía PayPal'
              },
              accountData: {
                unit: res.user.unit,
                type: `Apartamento · Unidad ${res.user.unit}`,
                resident: res.user.role === 'owner' ? 'Propietario Titular' : 'Inquilino Arrendatario',
                sqm: 120,
                bedrooms: 3,
                bathrooms: 2,
                status: 'Al día',
                statusNote: `${res.user.role_label || 'Residente'} · Unidad ${res.user.unit}`,
                nextFee: `15 ${todayShort}`,
                nextFeeNote: 'Cuota de mantenimiento mensual',
                activeRequests: 0,
                activities: [],
                cuotas: [
                  {
                    period: capitalizedMonth,
                    due: `15 ${todayShort}`,
                    amount: 'RD$ 6,500.00',
                    status: 'Pendiente',
                    badge: 'badge-warning'
                  }
                ],
                pagos: [],
                tickets: [],
                documentos: []
              }
            };
            this.registeredUsers.push(localUser);
          }

          this.currentUser = localUser;
          this.isOwnerLoggedIn = true;
          this.saveAllState();
          if (pendingAlert) pendingAlert.style.display = 'none';

          this.updateResidentSidebar();
          this.renderOwnerState();
          this.showToast(`Bienvenido a tu portal, ${localUser.name}`);
          return;
        } else if (res && res.detail) {
          if (res.detail.includes('esperando aprobación') || res.detail.includes('pending')) {
            if (pendingAlert) {
              pendingAlert.style.display = 'block';
              pendingAlert.innerHTML = `
                ⏳ <strong>Cuenta Pendiente de Aprobación:</strong> Tu solicitud y contrato notariado están siendo auditados por la administración. Una vez aprobado el acceso, podrás ingresar con tu clave segura.
              `;
            }
            this.showToast("Cuenta en proceso de auditoría notarial.");
            return;
          } else if (res.detail.includes('Contraseña incorrecta')) {
            alert("Contraseña incorrecta. Verifique su contraseña segura de acceso.");
            return;
          }
        }
      } catch (err) {
        console.warn('Fallo en intento de login backend:', err);
      }
    }

    // 2. Autenticación Local / Modo de Respaldo Offline
    const user = this.registeredUsers.find(u =>
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      (u.documentId && this.normalizeDoc(u.documentId) === normInput)
    );

    if (!user) {
      alert("Credenciales no encontradas en el padrón. Verifique su cédula o correo electrónico, o regístrese si aún no ha formalizado su expediente.");
      return;
    }

    if (user.password !== passInput) {
      alert("Contraseña incorrecta. Verifique la contraseña segura que ingresó al registrarse.");
      return;
    }

    // Verificar si la cuenta está pendiente de auditoría
    if (user.status === 'pending') {
      if (pendingAlert) {
        pendingAlert.style.display = 'block';
        pendingAlert.innerHTML = `
          ⏳ <strong>Cuenta Pendiente de Aprobación:</strong> La solicitud de ${user.name} (Unidad ${user.unit}) está siendo auditada por la administración conforme al Punto 16.3. El contrato notariado debe ser aprobado antes de autorizar el ingreso.
        `;
      }
      this.showToast("Cuenta en proceso de auditoría notarial.");
      return;
    }

    if (user.status === 'rejected') {
      alert("Su solicitud de acceso fue rechazada por la administración. Comuníquese con la gerencia del condominio.");
      return;
    }

    // Inicio de sesión exitoso
    this.currentUser = user;
    this.isOwnerLoggedIn = true;
    if (pendingAlert) pendingAlert.style.display = 'none';

    this.updateResidentSidebar();
    this.renderOwnerState();
    this.showToast(`Bienvenido a tu portal, ${user.name}`);
  }

  logoutResident() {
    this.isOwnerLoggedIn = false;
    this.currentUser = null;
    this.renderOwnerState();
    this.showToast("Sesión cerrada correctamente.");
  }

  // Compatibilidad con invocaciones previas
  loginOwner(e) { this.loginResident(e); }
  logoutOwner() { this.logoutResident(); }

  updateResidentSidebar() {
    if (!this.currentUser) return;
    const user = this.currentUser;
    const avatar = document.getElementById('sidebar-user-avatar');
    const nameEl = document.getElementById('sidebar-user-name');
    const unitEl = document.getElementById('sidebar-user-unit');
    const badgeEl = document.getElementById('sidebar-user-badge');

    if (avatar) avatar.innerText = user.avatar || user.name.slice(0, 2).toUpperCase();
    if (nameEl) nameEl.innerText = user.name;
    if (unitEl) unitEl.innerText = `Unidad ${user.unit} · Nivel ${user.unit.startsWith('PH') ? '10' : user.unit[0]}`;
    if (badgeEl) {
      badgeEl.innerText = user.roleLabel;
      badgeEl.className = user.role === 'owner' ? 'badge badge-accent' : 'badge badge-primary';
    }
  }

  renderOwnerState() {
    const loginCard = document.getElementById('owner-login-container');
    const dashboardLayout = document.getElementById('owner-dashboard-container');

    if (this.isOwnerLoggedIn) {
      if (loginCard) loginCard.style.display = 'none';
      if (dashboardLayout) dashboardLayout.style.display = 'flex';
      this.updateResidentSidebar();
      this.renderOwnerTabContent();
    } else {
      if (loginCard) loginCard.style.display = 'flex';
      if (dashboardLayout) dashboardLayout.style.display = 'none';
    }
  }

  setOwnerTab(tabName, btnElement) {
    this.activeOwnerTab = tabName;
    if (btnElement) {
      const parent = btnElement.parentElement;
      parent.querySelectorAll('.portal-nav-btn').forEach(btn => btn.classList.remove('active'));
      btnElement.classList.add('active');
    }
    this.renderOwnerTabContent();
  }

  /* =========================================================================
     Gestión de Datos Aislados por Residente (Cuotas, Pagos & Solicitudes)
     ========================================================================= */
  getResidentAccountData(user) {
    if (!user) {
      return this.ownerData;
    }

    // Cuenta de demostración histórica exclusiva de Ramona Ramos (Unidad 301)
    if (user.email === 'ramona.ramos@gmail.com' || user.id === 'usr-301') {
      return this.ownerData;
    }

    const now = new Date();
    const currentMonthYear = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const capitalizedMonth = currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1);
    const todayShort = now.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });

    // Si el usuario no tiene datos de cuenta o tenía datos de prueba de Ramona heredados
    if (!user.accountData || (user.accountData.pagos && user.accountData.pagos.some(p => p.id === 'PAG-2025-089'))) {
      user.accountData = {
        unit: user.unit,
        type: `Apartamento · Unidad ${user.unit}`,
        resident: user.roleLabel || (user.role === 'owner' ? 'Propietario Residente' : 'Inquilino Arrendatario'),
        sqm: 120,
        bedrooms: 3,
        bathrooms: 2,
        status: "Al día",
        statusNote: user.role === 'owner' ? `Propietario Titular · Unidad ${user.unit}` : `Inquilino Arrendatario · Unidad ${user.unit}`,
        nextFee: `15 ${todayShort}`,
        nextFeeNote: "Cuota de mantenimiento mensual",
        activeRequests: 0,
        activities: (this.ownerData && this.ownerData.activities) ? JSON.parse(JSON.stringify(this.ownerData.activities)) : [],
        cuotas: [
          {
            period: capitalizedMonth,
            due: `15 ${todayShort}`,
            amount: "RD$ 6,500.00",
            status: "Pendiente",
            badge: "badge-warning"
          }
        ],
        pagos: [], // Totalmente limpio: CERO pagos previos para nuevos residentes
        tickets: [], // Totalmente limpio: CERO tickets previos
        documentos: (this.ownerData && this.ownerData.documentos) ? JSON.parse(JSON.stringify(this.ownerData.documentos)) : []
      };

      this.saveAllState();
    }

    return user.accountData;
  }

  renderOwnerTabContent() {
    const panel = document.getElementById('owner-content-panel');
    if (!panel) return;

    const user = this.currentUser || this.registeredUsers[0];
    const data = this.getResidentAccountData(user);
    const isOwner = user.role === 'owner';

    if (this.activeOwnerTab === 'overview') {
      panel.innerHTML = `
        <div class="owner-unit-banner">
          <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 16px;">
            <div>
              <span class="badge ${isOwner ? 'badge-accent' : 'badge-primary'}" style="margin-bottom: 8px;">
                ${user.roleLabel}
              </span>
              <h2 style="font-family: var(--font-display); font-size: 28px; font-weight: 800; margin-bottom: 4px;">Apartamento Unidad ${user.unit}</h2>
              <p style="font-size: 14px; opacity: 0.85;">Torre Residencial Jardines del Cerro IV · Mao, Valverde</p>
            </div>
            <div style="display: flex; gap: 12px;">
              <button class="btn-accent" onclick="window.app.setOwnerTab('cuotas');">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                <span>Pagar cuota online</span>
              </button>
            </div>
          </div>

          <div style="display: flex; flex-wrap: wrap; gap: 24px; margin-top: 24px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.15); font-size: 13px;">
            <div>📏 <strong>120 m²</strong> construidos</div>
            <div>🛏️ <strong>3 Habitaciones</strong></div>
            <div>🚿 <strong>2 Baños</strong></div>
            <div>🚗 <strong>1 Estacionamiento techado</strong></div>
            <div>🏛️ <strong>Alícuota: ${user.aliquot || '4.65%'}</strong></div>
          </div>
        </div>

        <div class="kpi-cards-grid">
          <div class="kpi-card">
            <div class="kpi-label">Estado de Cuenta</div>
            <div class="kpi-val" style="color: #059669;">${data.status}</div>
            <div style="font-size: 11px; color: var(--dust); margin-top: 4px;">${data.statusNote}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Próximo Vencimiento</div>
            <div class="kpi-val">${data.nextFee}</div>
            <div style="font-size: 11px; color: var(--dust); margin-top: 4px;">Cuota de mantenimiento mensual</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Solicitudes Activas</div>
            <div class="kpi-val">${(data.tickets || []).length}</div>
            <div style="font-size: 11px; color: var(--dust); margin-top: 4px;">Mantenimiento y servicios</div>
          </div>
        </div>

        <div class="table-card" style="padding: 24px;">
          <h3 style="font-family: var(--font-display); font-size: 16px; font-weight: 700; margin-bottom: 16px;">Próximas Actividades del Condominio</h3>
          <div style="display: flex; flex-direction: column; gap: 12px;">
            ${(data.activities || []).map(a => `
              <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; background: var(--surface); border-radius: var(--radius-sm); border: 1px solid var(--linen);">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <span style="padding: 4px 10px; background: var(--white); border: 1px solid var(--linen); border-radius: var(--radius-sm); font-size: 11px; font-weight: 700; color: var(--primary);">${a.date}</span>
                  <span style="font-size: 13px; font-weight: 600; color: var(--ink);">${a.title}</span>
                </div>
                <span class="badge ${a.status === 'pending' ? 'badge-warning' : 'badge-neutral'}">Recordatorio</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    } else if (this.activeOwnerTab === 'cuotas') {
      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Cuotas de Mantenimiento</h2>
            <p style="font-size: 13px; color: var(--dust);">Historial y cuotas correspondientes a la Unidad ${user.unit}</p>
          </div>
        </div>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Período</th>
                <th>Fecha Vencimiento</th>
                <th>Monto Estimado</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              ${data.cuotas && data.cuotas.length > 0 ? data.cuotas.map(c => `
                <tr>
                  <td><strong>${c.period}</strong></td>
                  <td>${c.due}</td>
                  <td>${c.amount || 'RD$ 6,500.00'}</td>
                  <td><span class="badge ${c.badge}">${c.status}</span></td>
                  <td>
                    ${c.status === 'Pendiente' ? `
                      <button class="btn-primary" style="padding: 5px 12px; font-size: 11px;" onclick="window.app.payMaintenanceFee('${c.period}');">
                        Pagar ahora
                      </button>
                    ` : `
                      <span style="font-size: 12px; color: var(--dust);">Al día</span>
                    `}
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="5" style="text-align: center; padding: 36px 20px; color: var(--dust);">
                    No hay cuotas programadas para este período.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.activeOwnerTab === 'pagos') {
      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Historial de Pagos y Recibos</h2>
            <p style="font-size: 13px; color: var(--dust);">Comprobantes electrónicos con validez fiscal (NCF ante DGII) para Unidad ${user.unit}</p>
          </div>
        </div>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr>
                <th>No. Transacción</th>
                <th>Fecha</th>
                <th>Concepto</th>
                <th>NCF Fiscal</th>
                <th>Monto</th>
                <th>Método</th>
                <th>Recibo</th>
              </tr>
            </thead>
            <tbody>
              ${data.pagos && data.pagos.length > 0 ? data.pagos.map(p => `
                <tr>
                  <td><code>${p.id}</code></td>
                  <td>${p.date}</td>
                  <td>${p.concept}</td>
                  <td><span class="badge badge-neutral">${p.ncf}</span></td>
                  <td><strong>${p.amount}</strong></td>
                  <td>${p.method}</td>
                  <td>
                    <button class="btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="window.app.showToast('Descargando comprobante fiscal en PDF...');">
                      PDF
                    </button>
                  </td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 48px 24px; color: var(--dust);">
                    <div style="width: 52px; height: 52px; border-radius: 50%; background: var(--surface); display: flex; align-items: center; justify-content: center; margin: 0 auto 12px auto;">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--dust)" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                    </div>
                    <h4 style="font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 6px;">Sin historial de pagos registrados</h4>
                    <p style="font-size: 13px; max-width: 440px; margin: 0 auto; line-height: 1.5; color: var(--dust);">
                      Aún no se registran comprobantes de pago o recibos fiscales con NCF para la <strong>Unidad ${user.unit}</strong>. Al realizar tus pagos de cuotas mediante tarjeta, PayPal o transferencia, tus recibos oficiales aparecerán aquí automáticamente.
                    </p>
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.activeOwnerTab === 'documentos') {
      panel.innerHTML = `
        <div style="margin-bottom: 24px;">
          <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Documentación Legal del Condominio</h2>
          <p style="font-size: 13px; color: var(--dust);">Reglamentos, contratos y actas oficiales de la Torre Jardines del Cerro IV</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
          ${(data.documentos || []).map(doc => `
            <div style="background: var(--white); border: 1px solid var(--linen); border-radius: var(--radius-md); padding: 20px; display: flex; flex-direction: column; justify-content: space-between;">
              <div style="display: flex; gap: 14px; margin-bottom: 14px;">
                <div style="width: 40px; height: 40px; border-radius: var(--radius-sm); background: #FEE2E2; color: #DC2626; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 12px; flex-shrink: 0;">
                  PDF
                </div>
                <div>
                  <h4 style="font-size: 13px; font-weight: 700; color: var(--ink); line-height: 1.4;">${doc.name}</h4>
                  <div style="font-size: 11px; color: var(--dust); margin-top: 4px;">${doc.date} · ${doc.size}</div>
                </div>
              </div>
              <button class="btn-outline" style="width: 100%; padding: 8px; font-size: 12px;" onclick="window.app.showToast('Abriendo documento oficial...');">
                Descargar documento
              </button>
            </div>
          `).join('')}
        </div>
      `;
    } else if (this.activeOwnerTab === 'solicitudes') {
      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Solicitudes de Mantenimiento</h2>
            <p style="font-size: 13px; color: var(--dust);">Gestión técnica de incidencias en áreas comunes y unidad privada</p>
          </div>
          <button class="btn-primary" onclick="window.app.showNewTicketForm();">
            + Nueva Solicitud
          </button>
        </div>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Ticket</th>
                <th>Fecha</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th>Prioridad</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${data.tickets && data.tickets.length > 0 ? data.tickets.map(t => `
                <tr>
                  <td><code>${t.id}</code></td>
                  <td>${t.date}</td>
                  <td>${t.category}</td>
                  <td>${t.subject}</td>
                  <td><span class="badge ${t.priority === 'Alta' ? 'badge-warning' : 'badge-neutral'}">${t.priority}</span></td>
                  <td><span class="badge ${t.status === 'Resuelto' ? 'badge-success' : 'badge-warning'}">${t.status}</span></td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="6" style="text-align: center; padding: 40px 20px; color: var(--dust);">
                    <div style="font-size: 24px; margin-bottom: 8px;">🔧</div>
                    <div style="font-size: 14px; font-weight: 700; color: var(--ink); margin-bottom: 4px;">No tienes solicitudes de mantenimiento registradas</div>
                    <div style="font-size: 12.5px;">Haz clic en el botón "+ Nueva Solicitud" para reportar cualquier requerimiento técnico en tu unidad.</div>
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.activeOwnerTab === 'asambleas') {
      // Pestaña de Asambleas & Quórum Ponderado (Punto 16.14)
      panel.innerHTML = `
        <div style="margin-bottom: 24px;">
          <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Asambleas Generales & Votación Ponderada</h2>
          <p style="font-size: 13px; color: var(--dust);">Participación democrática según las alícuotas del Régimen de Condominio (Ley 5038)</p>
        </div>

        <!-- Banner de Quórum y Alícuota Personal -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; margin-bottom: 24px;">
          <div style="background: var(--white); border: 1px solid var(--linen); border-radius: var(--radius-lg); padding: 20px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--dust); text-transform: uppercase;">Próxima Asamblea</div>
            <div style="font-size: 18px; font-weight: 800; color: var(--ink); margin: 4px 0;">15 Noviembre 2026 · 7:00 PM</div>
            <div style="font-size: 12px; color: var(--dust);">Área Social Rooftop (Nivel 10) / Híbrida Virtual</div>
          </div>
          <div style="background: var(--white); border: 1px solid var(--linen); border-radius: var(--radius-lg); padding: 20px;">
            <div style="font-size: 11px; font-weight: 700; color: var(--dust); text-transform: uppercase;">Quórum Proyectado</div>
            <div style="font-size: 24px; font-weight: 800; color: #059669;">78.30% <span style="font-size: 12px; font-weight: 600; color: var(--dust);">(Mín. req. 50% + 1)</span></div>
            <div style="font-size: 11.5px; color: #047857; margin-top: 2px;">✓ Quórum legal habilitado para sesionar</div>
          </div>
          <div style="background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); border: 1.5px solid #FCD34D; border-radius: var(--radius-lg); padding: 20px;">
            <div style="font-size: 11px; font-weight: 800; color: #92400E; text-transform: uppercase;">Tu Poder de Voto Ponderado</div>
            <div style="font-size: 26px; font-weight: 800; color: #78350F;">${user.aliquot || '4.65%'}</div>
            <div style="font-size: 11.5px; color: #78350F; margin-top: 2px;">
              ${isOwner ? 'Copropietario con derecho pleno a voto' : 'Inquilino: Voz consultiva (el voto formal recae en el dueño)'}
            </div>
          </div>
        </div>

        <!-- Puntos del Orden del Día con Votación Anticipada -->
        <div class="table-card" style="padding: 24px;">
          <h3 style="font-family: var(--font-display); font-size: 16px; font-weight: 700; margin-bottom: 16px; color: var(--ink);">
            Orden del Día & Votación Previa Electrónica
          </h3>

          <div style="display: flex; flex-direction: column; gap: 16px;">
            <!-- Punto 1 -->
            <div id="vote-card-pt1" style="background: var(--surface); border: 1px solid var(--linen); border-radius: var(--radius-md); padding: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                <div>
                  <span class="badge badge-accent" style="margin-bottom: 6px;">Punto 1</span>
                  <h4 style="font-size: 14px; font-weight: 800; color: var(--ink);">Instalación de Paneles Solares Complementarios para Áreas Comunes</h4>
                  <p style="font-size: 12.5px; color: var(--dust); margin-top: 4px; line-height: 1.45;">
                    Presupuesto presentado de RD$ 320,000 con amortización estimada en 14 meses. Reduce un 45% el costo eléctrico de bombas y ascensores.
                  </p>
                </div>
                <div id="vote-badge-pt1" class="badge badge-neutral">Pendiente de Voto</div>
              </div>
              <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button class="btn-primary" style="padding: 6px 14px; font-size: 11.5px; background: #059669; border-color: #059669;" onclick="window.app.castAssemblyVote('pt1', 'A favor');">
                  ✓ A favor
                </button>
                <button class="btn-outline" style="padding: 6px 14px; font-size: 11.5px; color: #DC2626; border-color: #F87171;" onclick="window.app.castAssemblyVote('pt1', 'En contra');">
                  ✕ En contra
                </button>
                <button class="btn-outline" style="padding: 6px 14px; font-size: 11.5px;" onclick="window.app.castAssemblyVote('pt1', 'Abstención');">
                  Abstención
                </button>
              </div>
            </div>

            <!-- Punto 2 -->
            <div id="vote-card-pt2" style="background: var(--surface); border: 1px solid var(--linen); border-radius: var(--radius-md); padding: 18px;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 8px;">
                <div>
                  <span class="badge badge-accent" style="margin-bottom: 6px;">Punto 2</span>
                  <h4 style="font-size: 14px; font-weight: 800; color: var(--ink);">Renovación del Contrato de Mantenimiento Preventivo del Ascensor (Otis RD)</h4>
                  <p style="font-size: 12.5px; color: var(--dust); margin-top: 4px; line-height: 1.45;">
                    Ratificación del proveedor oficial por 24 meses adicionales manteniendo la tarifa actual pactada.
                  </p>
                </div>
                <div id="vote-badge-pt2" class="badge badge-neutral">Pendiente de Voto</div>
              </div>
              <div style="display: flex; gap: 8px; margin-top: 12px;">
                <button class="btn-primary" style="padding: 6px 14px; font-size: 11.5px; background: #059669; border-color: #059669;" onclick="window.app.castAssemblyVote('pt2', 'A favor');">
                  ✓ A favor
                </button>
                <button class="btn-outline" style="padding: 6px 14px; font-size: 11.5px; color: #DC2626; border-color: #F87171;" onclick="window.app.castAssemblyVote('pt2', 'En contra');">
                  ✕ En contra
                </button>
                <button class="btn-outline" style="padding: 6px 14px; font-size: 11.5px;" onclick="window.app.castAssemblyVote('pt2', 'Abstención');">
                  Abstención
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    } else if (this.activeOwnerTab === 'ia_assistant') {
      // Pestaña de Asistente IA Condominal (Punto 16.13)
      const sub = user.aiSubscription || {
        active: true,
        plan: "Plan Residente Convivencia & DGII",
        paypalSubId: `I-PAYPAL-SUB-${user.unit || '301'}`
      };

      panel.innerHTML = `
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Asistente Inteligente Privado</h2>
              <span class="badge badge-success">✓ En Línea · Google Gemini (gemini-3.8-flash)</span>
              <span class="badge badge-neutral" style="font-size: 11px;">Plan ${sub.plan || 'Residente Premium'}</span>
            </div>
            <p style="font-size: 12.5px; color: var(--dust); margin-top: 2px;">
              ID de Suscripción: <code>${sub.paypalSubId || `I-RES-${user.unit}`}</code> · Conexión confidencial con la base de datos de tu unidad, contabilidad, comprobantes NCF y asambleas.
            </p>
          </div>
          <button class="btn-outline" style="padding: 6px 12px; font-size: 11px;" onclick="window.app.setOwnerTab('suscripcion_ia');">
            Administrar Suscripción PayPal
          </button>
        </div>

        <!-- Ventana de Chat Inteligente Privado -->
        <div style="background: var(--white); border: 1px solid var(--linen); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); overflow: hidden; display: flex; flex-direction: column; height: 580px;">
          <!-- Encabezado del Chat -->
          <div style="padding: 16px 20px; background: var(--surface); border-bottom: 1px solid var(--linen); display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;">
                IA
              </div>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: var(--ink);">Asistente Privado · Unidad ${user.unit}</div>
                <div style="font-size: 11px; color: #047857; font-weight: 600;">● Conectado a Google Gemini (gemini-3.8-flash) · Contabilidad, actas y DGII</div>
              </div>
            </div>
            <span class="badge badge-accent" style="font-size: 10px;">Contexto Residente</span>
          </div>

          <!-- Contenedor de Mensajes -->
          <div id="resident-ai-messages-container" style="flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; background: #FCFAF7;">
            <div class="chat-bubble assistant" style="max-width: 85%;">
              ¡Hola, ${user.name}! 👋 Soy tu asistente privado de la Torre Residencial Jardines del Cerro IV impulsado por <strong>Google Gemini</strong>. Tengo acceso verificado a tu cuenta de la <strong>Unidad ${user.unit}</strong>. Puedo responderte sobre tu saldo de cuotas, comprobantes con NCF fiscal, actas de asambleas, poder de voto o normativas de convivencia. ¿Qué deseas consultar hoy?
            </div>
          </div>

          <!-- Chips de Sugerencias -->
          <div id="resident-ai-chips" style="padding: 10px 20px; background: var(--surface); border-top: 1px solid var(--linen); display: flex; gap: 8px; overflow-x: auto;">
            <button class="chat-suggestion-btn" style="white-space: nowrap; font-size: 11px;" onclick="window.app.sendResidentAIPrompt('¿Cuál es mi balance de cuota y próximo vencimiento?');">
              ¿Mi balance y próximo pago?
            </button>
            <button class="chat-suggestion-btn" style="white-space: nowrap; font-size: 11px;" onclick="window.app.sendResidentAIPrompt('¿Qué NCF tuvo mi último recibo de mantenimiento?');">
              ¿NCF de mi último recibo?
            </button>
            <button class="chat-suggestion-btn" style="white-space: nowrap; font-size: 11px;" onclick="window.app.sendResidentAIPrompt('¿Cuándo es la próxima asamblea y cuánto vale mi voto?');">
              ¿Próxima asamblea y alícuota?
            </button>
            <button class="chat-suggestion-btn" style="white-space: nowrap; font-size: 11px;" onclick="window.app.sendResidentAIPrompt('¿Cuáles son las normas para uso de piscina y gazebo?');">
              ¿Normas de piscina y áreas comunes?
            </button>
            <button class="chat-suggestion-btn" style="white-space: nowrap; font-size: 11px;" onclick="window.app.sendResidentAIPrompt('¿Cómo reportar un ticket de mantenimiento de mi unidad?');">
              ¿Tickets de mantenimiento?
            </button>
          </div>

          <!-- Formulario de Entrada -->
          <div style="padding: 14px 20px; background: var(--white); border-top: 1px solid var(--linen);">
            <form style="display: flex; gap: 10px;" onsubmit="window.app.handleResidentAISubmit(event);">
              <input type="text" class="form-input" id="resident-ai-input-field" placeholder="Pregúntale a Gemini sobre tu unidad, cuotas, NCF, asambleas..." autocomplete="off" required style="border-radius: 9999px;">
              <button type="submit" class="btn-primary" style="border-radius: 9999px; padding: 10px 20px;">
                <span>Preguntar</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
          </div>
        </div>
      `;
    } else if (this.activeOwnerTab === 'suscripcion_ia') {
      // Pestaña de Membresía / Suscripción PayPal
      const sub = user.aiSubscription || { active: false };

      panel.innerHTML = `
        <div style="margin-bottom: 24px;">
          <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Membresía & Suscripción PayPal</h2>
          <p style="font-size: 13px; color: var(--dust);">Gestión del servicio de Asistente de IA Condominal (Punto 16.13)</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
          <!-- Tarjeta de Estado Actual -->
          <div style="background: var(--white); border: 1px solid var(--linen); border-radius: var(--radius-xl); padding: 28px; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <span class="badge ${sub.active ? 'badge-success' : 'badge-warning'}">
                ${sub.active ? 'Suscripción Activa' : 'Sin Suscripción'}
              </span>
              <span style="font-size: 12px; font-weight: 800; color: #003087;">PayPal Subscriptions</span>
            </div>

            <h3 style="font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--ink); margin-bottom: 8px;">
              ${sub.active ? `Plan ${sub.plan} de IA` : 'Asistente IA Desactivado'}
            </h3>

            <div style="font-size: 13px; color: var(--dust); line-height: 1.5; margin-bottom: 20px;">
              ${sub.active
                ? `Tu cuenta está vinculada al servicio recurrente de PayPal. Tu próximo cargo programado será el <strong>${sub.renewalDate || 'Próximo mes'}</strong> por <strong>US$ ${sub.priceUsd}</strong>.`
                : 'Activa tu membresía vía PayPal para acceder a consultas 24/7 sobre tus balances, NCFs, orden del día de asambleas y normativa condominal.'}
            </div>

            ${sub.active ? `
              <div style="background: var(--surface); border: 1px solid var(--linen); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 20px; font-size: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: var(--dust);">ID de Transacción:</span>
                  <code>${sub.paypalSubId}</code>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: var(--dust);">Fecha de Alta:</span>
                  <strong>${sub.subscribedAt || 'Hoy'}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--dust);">Renovación:</span>
                  <strong>${sub.renewalDate || '30 días'}</strong>
                </div>
              </div>

              <div style="display: flex; gap: 10px;">
                <button class="btn-primary" onclick="window.app.setOwnerTab('ia_assistant');">
                  Ir al Asistente IA
                </button>
                <button class="btn-outline" style="color: #DC2626; border-color: #F87171;" onclick="window.app.cancelPaypalSubscription();">
                  Cancelar Suscripción
                </button>
              </div>
            ` : `
              <div style="display: flex; gap: 10px;">
                <button class="btn-primary" style="background: #003087; border-color: #003087;" onclick="window.app.openPaypalSubscriptionModal('plan-monthly');">
                  Activar Plan Mensual (US$ 9.99)
                </button>
                <button class="btn-accent" onclick="window.app.openPaypalSubscriptionModal('plan-annual');">
                  Activar Plan Anual (US$ 99)
                </button>
              </div>
            `}
          </div>

          <!-- Cobertura y Normativa Legal -->
          <div style="background: var(--surface); border: 1px solid var(--linen); border-radius: var(--radius-xl); padding: 28px;">
            <h4 style="font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 12px;">
              Garantías del Servicio & Privacidad
            </h4>
            <ul style="font-size: 12.5px; color: var(--dust); list-style: none; display: flex; flex-direction: column; gap: 12px; line-height: 1.5;">
              <li>🔒 <strong>Aislamiento de Datos:</strong> El asistente solo procesa la información contable y reglamentaria de tu unidad sin compartirla con terceros.</li>
              <li>🏛️ <strong>Cumplimiento DGII:</strong> Toda consulta sobre comprobantes fiscales NCF concuerda con las normativas tributarias dominicanas.</li>
              <li>⚡ <strong>Cancelación Inmediata:</strong> Puedes cancelar la recurrencia desde este panel o directamente desde tu cuenta de PayPal en cualquier momento.</li>
            </ul>
          </div>
        </div>
      `;
    }
  }

  castAssemblyVote(pointId, option) {
    const user = this.currentUser || this.registeredUsers[0];
    const badge = document.getElementById(`vote-badge-${pointId}`);
    if (badge) {
      badge.className = 'badge badge-success';
      badge.innerText = `Votaste: ${option} (${user.aliquot || '4.65%'})`;
    }
    this.showToast(`¡Voto registrado (${option}) con tu alícuota de ${user.aliquot || '4.65%'}!`);
  }

  payMaintenanceFee(period) {
    const user = this.currentUser || this.registeredUsers[0];
    const data = this.getResidentAccountData(user);
    const fee = (data.cuotas || []).find(c => c.period === period);
    if (fee) {
      fee.status = 'Pagado';
      fee.badge = 'badge-success';

      const now = new Date();
      const today = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      const ncfCode = `B02${Math.floor(100000000 + Math.random() * 900000000)}`;
      const newPayId = `PAG-${now.getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

      if (!data.pagos) data.pagos = [];
      data.pagos.unshift({
        id: newPayId,
        date: today,
        concept: `Cuota de Mantenimiento ${period}`,
        ncf: ncfCode,
        amount: fee.amount || 'RD$ 6,500.00',
        method: 'Tarjeta en Línea / PayPal',
        status: 'Aprobado'
      });

      data.status = 'Al día';
      data.statusNote = 'Sin saldo pendiente';

      if (window.apiClient && window.apiClient.isBackendOnline) {
        window.apiClient.processPayment({
          unit: user.unit,
          period: period,
          concept: `Cuota de Mantenimiento ${period}`,
          amount: fee.amount || 'RD$ 6,500.00',
          method: 'Tarjeta en Línea / PayPal'
        }).catch(() => {});
      }

      this.saveAllState();
      this.showToast(`¡Pago de ${period} procesado con éxito! Recibo fiscal ${ncfCode} emitido.`);
      this.renderOwnerTabContent();
    }
  }

  showNewTicketForm() {
    const user = this.currentUser || this.registeredUsers[0];
    const data = this.getResidentAccountData(user);
    const desc = prompt(`Describe el requerimiento de mantenimiento para la Unidad ${user.unit}:`);
    if (desc && desc.trim()) {
      const now = new Date();
      const today = now.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
      const newTck = {
        id: `TCK-${Math.floor(105 + Math.random() * 50)}`,
        date: today,
        category: 'General',
        subject: desc.trim(),
        status: 'En proceso',
        priority: 'Media'
      };
      if (!data.tickets) data.tickets = [];
      data.tickets.unshift(newTck);
      this.adminData.maintenance.unshift({
        id: `MNT-${Math.floor(504 + Math.random() * 50)}`,
        unit: `Unidad ${user.unit}`,
        category: 'General',
        desc: desc.trim(),
        date: today,
        tech: 'Por asignar',
        status: 'En proceso'
      });
      this.saveAllState();
      this.showToast("Solicitud de mantenimiento registrada con éxito.");
      this.renderOwnerTabContent();
    }
  }

  /* =========================================================================
     Pasarela PayPal para Suscripción de IA (Punto 16.13)
     ========================================================================= */
  openPaypalSubscriptionModal(planId = 'plan-monthly') {
    this.subscriptionContext = 'resident';
    const plan = (typeof AI_SUBSCRIPTION_PLANS !== 'undefined')
      ? (AI_SUBSCRIPTION_PLANS.find(p => p.id === planId) || AI_SUBSCRIPTION_PLANS[0])
      : { id: 'plan-monthly', name: 'Plan Mensual IA', priceUsd: 9.99, period: 'Mensual' };

    this.activeAiPlan = plan;

    const modal = document.getElementById('paypal-subscription-modal');
    const titleEl = document.getElementById('paypal-modal-plan-title');
    const priceEl = document.getElementById('paypal-modal-plan-price');
    const descEl = document.getElementById('paypal-modal-plan-desc');
    const emailEl = document.getElementById('paypal-sub-email');

    if (titleEl) titleEl.innerText = plan.name;
    if (priceEl) {
      priceEl.innerHTML = `US$ ${plan.priceUsd.toFixed(2)} <span style="font-size: 12px; font-weight: 500; color: var(--dust);">${plan.period === 'Mensual' ? '/ mes' : '/ año'}</span>`;
    }
    if (descEl) {
      descEl.innerText = 'Activación inmediata de consultas 24/7 sobre estado de cuenta personal de la Unidad, facturación NCF DGII, normativas internas y recordatorios de asambleas.';
    }
    if (emailEl) {
      const user = this.currentUser || this.registeredUsers[0];
      emailEl.value = (user && user.email) ? user.email : 'ramona.ramos@gmail.com';
    }

    if (modal) modal.style.display = 'flex';
  }

  openAdminPaypalSubscriptionModal(planId = 'admin-plan-monthly') {
    this.subscriptionContext = 'admin';
    const plan = (typeof ADMIN_AI_SUBSCRIPTION_PLANS !== 'undefined')
      ? (ADMIN_AI_SUBSCRIPTION_PLANS.find(p => p.id === planId) || ADMIN_AI_SUBSCRIPTION_PLANS[0])
      : { id: 'admin-plan-monthly', name: 'Suite IA Administrador Pro (Mensual)', priceUsd: 24.99, period: 'Mensual' };

    this.activeAiPlan = plan;

    const modal = document.getElementById('paypal-subscription-modal');
    const titleEl = document.getElementById('paypal-modal-plan-title');
    const priceEl = document.getElementById('paypal-modal-plan-price');
    const descEl = document.getElementById('paypal-modal-plan-desc');
    const emailEl = document.getElementById('paypal-sub-email');

    if (titleEl) titleEl.innerText = plan.name;
    if (priceEl) {
      priceEl.innerHTML = `US$ ${plan.priceUsd.toFixed(2)} <span style="font-size: 12px; font-weight: 500; color: var(--dust);">${plan.period === 'Mensual' ? '/ mes' : '/ año'}</span>`;
    }
    if (descEl) {
      descEl.innerText = 'Licencia corporativa para el Administrador de la Torre: Auditoría contable automatizada, cálculo de mora, redactor de intimaciones legales y diagnósticos de mantenimiento predictivo.';
    }
    if (emailEl) {
      emailEl.value = 'admin@jardinesdelcerro.do';
    }

    if (modal) modal.style.display = 'flex';
  }

  closePaypalSubscriptionModal() {
    const modal = document.getElementById('paypal-subscription-modal');
    if (modal) modal.style.display = 'none';
  }

  handleProcessPaypalSubscription(e) {
    if (e) e.preventDefault();

    // Caso Administrador
    if (this.subscriptionContext === 'admin') {
      const plan = this.activeAiPlan || { name: 'Suite IA Administrador Pro', period: 'Mensual', priceUsd: 24.99 };
      const subId = `I-PAYPAL-ADM-${Math.floor(100000 + Math.random() * 900000)}`;
      const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
      const renewalDays = plan.period === 'Anual' ? 365 : 30;
      const renewal = new Date(Date.now() + renewalDays * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

      this.adminData.aiSubscription = {
        active: true,
        plan: plan.name,
        period: plan.period,
        priceUsd: plan.priceUsd,
        paypalSubId: subId,
        subscribedAt: today,
        renewalDate: renewal,
        statusLabel: 'Activa vía PayPal'
      };

      this.saveAllState();
      this.closePaypalSubscriptionModal();
      this.showToast(`¡Suscripción Ejecutiva PayPal autorizada (${subId})! Copiloto IA de Administración desbloqueado.`);
      this.renderAdminTabContent();
      return;
    }

    // Caso Residente
    const user = this.currentUser || this.registeredUsers[0];
    const plan = this.activeAiPlan || { period: 'Mensual', priceUsd: 9.99 };
    const subId = `I-PAYPAL-SUB-${Math.floor(100000 + Math.random() * 900000)}`;
    const today = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    const renewalDays = plan.period === 'Anual' ? 365 : 30;
    const renewal = new Date(Date.now() + renewalDays * 24 * 60 * 60 * 1000).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

    user.aiSubscription = {
      active: true,
      plan: plan.period,
      priceUsd: plan.priceUsd,
      paypalSubId: subId,
      subscribedAt: today,
      renewalDate: renewal,
      statusLabel: 'Activa vía PayPal'
    };

    // Actualizar en padrón
    const userInList = this.registeredUsers.find(u => u.id === user.id);
    if (userInList) userInList.aiSubscription = user.aiSubscription;

    this.saveAllState();
    this.closePaypalSubscriptionModal();
    this.showToast(`¡Suscripción PayPal autorizada con éxito (${subId})! Asistente IA Condominal desbloqueado.`);
    this.renderOwnerTabContent();
  }

  cancelPaypalSubscription() {
    const user = this.currentUser || this.registeredUsers[0];
    if (confirm("¿Deseas cancelar la renovación de tu suscripción de IA vía PayPal?")) {
      user.aiSubscription.active = false;
      user.aiSubscription.statusLabel = 'Cancelada por el usuario';
      const userInList = this.registeredUsers.find(u => u.id === user.id);
      if (userInList) userInList.aiSubscription = user.aiSubscription;

      this.saveAllState();
      this.showToast("Suscripción de PayPal cancelada.");
      this.renderOwnerTabContent();
    }
  }

  cancelAdminPaypalSubscription() {
    if (confirm("¿Deseas cancelar la suscripción ejecutiva de IA del Administrador vía PayPal?")) {
      if (!this.adminData.aiSubscription) {
        this.adminData.aiSubscription = {};
      }
      this.adminData.aiSubscription.active = false;
      this.adminData.aiSubscription.statusLabel = 'Cancelada por el administrador';
      this.saveAllState();
      this.showToast("Suscripción de IA para el Administrador cancelada.");
      this.renderAdminTabContent();
    }
  }

  formatAIMarkdown(text) {
    if (!text) return '';
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bloques de código
    html = html.replace(/```([\s\S]*?)```/g, '<pre style="background: rgba(0,0,0,0.06); padding: 10px; border-radius: 6px; overflow-x: auto; font-size: 12px; margin: 8px 0;"><code>$1</code></pre>');
    // Código en línea
    html = html.replace(/`([^`]+)`/g, '<code style="background: rgba(0,0,0,0.06); padding: 2px 5px; border-radius: 4px; font-size: 12px;">$1</code>');
    // Títulos y encabezados
    html = html.replace(/^### (.*$)/gim, '<h4 style="margin: 10px 0 4px; font-size: 14px; font-weight: 700;">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 style="margin: 12px 0 6px; font-size: 15px; font-weight: 800;">$1</h3>');
    // Negritas y cursivas
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Listas con viñetas
    html = html.replace(/^\s*[\*\-]\s+(.*)$/gm, '• $1<br>');
    // Saltos de línea
    html = html.replace(/\n\n+/g, '<br><br>').replace(/\n/g, '<br>');
    return html;
  }

  /* =========================================================================
     Interacción con el Asistente IA Privado de Residentes (Punto 16.13)
     ========================================================================= */
  sendResidentAIPrompt(text) {
    const input = document.getElementById('resident-ai-input-field');
    if (input) input.value = text;
    this.handleResidentAISubmit(new Event('submit'));
  }

  async handleResidentAISubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('resident-ai-input-field');
    const container = document.getElementById('resident-ai-messages-container');
    if (!input || !container) return;

    const text = input.value.trim();
    if (!text) return;

    // Agregar mensaje del usuario
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.innerText = text;
    container.appendChild(userBubble);
    input.value = '';
    container.scrollTop = container.scrollHeight;

    // Indicador de escribiendo
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble assistant';
    typingBubble.style.opacity = '0.7';
    typingBubble.innerText = 'Consultando inteligencia artificial (Gemini)...';
    container.appendChild(typingBubble);
    container.scrollTop = container.scrollHeight;

    let responseHtml = null;
    const user = this.currentUser || this.registeredUsers[0];

    // 1. Intentar llamar a Google Gemini vía Backend FastAPI
    if (window.apiClient) {
      try {
        const res = await window.apiClient.chatAI(text, 'resident', user ? user.id : null, user ? user.unit : '101');
        if (res && res.success && res.response) {
          responseHtml = this.formatAIMarkdown(res.response);
        }
      } catch (err) {
        console.warn('Fallback a motor local de IA residente:', err);
      }
    }

    // 2. Motor contextual local garantizado si el backend está offline o sin clave
    if (!responseHtml) {
      responseHtml = this.generateResidentAIResponse(text);
    }

    typingBubble.remove();
    const assistantBubble = document.createElement('div');
    assistantBubble.className = 'chat-bubble assistant';
    assistantBubble.style.maxWidth = '85%';
    assistantBubble.innerHTML = responseHtml;
    container.appendChild(assistantBubble);
    container.scrollTop = container.scrollHeight;
  }

  generateResidentAIResponse(userInput) {
    const q = userInput.toLowerCase();
    const user = this.currentUser || this.registeredUsers[0];

    if (q.includes('balance') || q.includes('cuota') || q.includes('pago') || q.includes('debo') || q.includes('vencimiento')) {
      return `Tu apartamento (Unidad ${user.unit}) se encuentra actualmente <strong>Al día</strong> en el libro contable de la Torre. Tu próxima cuota de mantenimiento mensual corresponde al <strong>1 de Noviembre</strong> por un monto estimado de <strong>RD$ 6,500.00</strong>. Puedes realizar el pago en línea desde la pestaña 'Cuotas y Pagos'.`;
    }

    if (q.includes('ncf') || q.includes('recibo') || q.includes('fiscal') || q.includes('dgii') || q.includes('factura')) {
      return `Tu último pago registrado (Octubre 2025 por RD$ 6,500.00) cuenta con el Comprobante Fiscal No. <strong>B0200000142</strong> (Consumidor Final), emitido con plena validez tributaria ante la DGII. Puedes descargar el recibo oficial en PDF desde la pestaña 'Historial y Recibos'.`;
    }

    if (q.includes('asamblea') || q.includes('voto') || q.includes('alícuota') || q.includes('alicuota') || q.includes('quorum')) {
      return `La próxima Asamblea General Ordinaria está convocada para el <strong>15 de Noviembre de 2026</strong> a las 7:00 PM en el área social Rooftop. Conforme al Régimen de Condominio (Ley 5038), a tu unidad le corresponde una alícuota de <strong>${user.aliquot || '4.65%'}</strong>. Puedes emitir tu voto previo en los puntos del orden del día desde la pestaña 'Asambleas & Quórum'.`;
    }

    if (q.includes('mascota') || q.includes('perro') || q.includes('gato')) {
      return `Conforme al Capítulo 4 del Reglamento Interno de Convivencia de Jardines del Cerro IV, se autoriza la tenencia de hasta dos (2) mascotas de razas pequeñas/medianas en la unidad privada. Es obligatorio el uso de correa en pasillos, lobby y elevador, así como garantizar la higiene y tranquilidad acústica del piso.`;
    }

    if (q.includes('piscina') || q.includes('gym') || q.includes('gimnasio') || q.includes('horario') || q.includes('bbq') || q.includes('gazebo')) {
      return `Los horarios oficiales de amenidades son:<br>• <strong>Piscina:</strong> Martes a Domingo de 6:00 AM a 10:00 PM.<br>• <strong>Gimnasio climatizado:</strong> 24/7 con control biométrico.<br>• <strong>Gazebo & Parrillas BBQ:</strong> Reserva previa sin costo con conserjería (hasta las 11:00 PM).`;
    }

    if (q.includes('mantenimiento') || q.includes('ticket') || q.includes('plomería') || q.includes('electricidad')) {
      return `Tienes registrado el ticket <strong>TCK-104</strong> (Revisión preventiva de grifo en cocina) en estado <em>En proceso</em> con prioridad Media. Nuestro técnico asignado tiene programada la visita esta semana.`;
    }

    return `Entendido, ${user.name}. Como asistente de inteligencia artificial exclusivo de la Torre Residencial <strong>Jardines del Cerro IV</strong>, estoy conectado a los expedientes de tu Unidad ${user.unit}. Puedo brindarte datos sobre tus cuotas de mantenimiento, NCF fiscales DGII, normativas de convivencia, agenda de asambleas y tickets de mantenimiento.`;
  }

  /* =========================================================================
     Panel Administrativo del Condominio
     ========================================================================= */
  async loginAdmin(e) {
    if (e) e.preventDefault();
    const userInput = document.getElementById('admin-login-user');
    const passInput = document.getElementById('admin-login-pass');
    const errorBox = document.getElementById('admin-login-error');

    if (errorBox) {
      errorBox.style.display = 'none';
      errorBox.innerHTML = '';
    }

    const userVal = userInput ? userInput.value.trim() : '';
    const passVal = passInput ? passInput.value.trim() : '';

    if (!userVal || !passVal) {
      if (errorBox) {
        errorBox.innerHTML = '⚠️ Por favor ingresa el usuario y la contraseña de administrador.';
        errorBox.style.display = 'block';
      } else {
        this.showToast('Por favor completa las credenciales de administrador.', 'error');
      }
      return;
    }

    let authenticated = false;
    let adminName = 'Administración Condominal';

    // 1. Intento de autenticación en backend en vivo si está online
    if (window.apiClient && window.apiClient.isBackendOnline) {
      try {
        const res = await window.apiClient.login(userVal, passVal);
        if (res && res.success && res.user && res.user.role === 'admin') {
          authenticated = true;
          adminName = res.user.name || 'Administración Jardines del Cerro IV';
          this.currentUser = res.user;
        } else if (res && res.user && res.user.role !== 'admin') {
          if (errorBox) {
            errorBox.innerHTML = '⛔ Este usuario no cuenta con privilegios de Administrador.';
            errorBox.style.display = 'block';
          }
          return;
        }
      } catch (err) {
        console.warn('Fallo en autenticación con backend:', err);
      }
    }

    // 2. Validación de credenciales locales maestras o administradores creados
    if (!authenticated) {
      const isMasterAdmin = (
        (userVal.toLowerCase() === 'admin' ||
         userVal.toLowerCase() === 'admin@jardinesdelcerro.do' ||
         userVal === '034-0000001-0') &&
        (passVal === 'admin123' || passVal === '1234')
      );

      // Revisar administradores personalizados creados localmente
      const customAdmins = JSON.parse(localStorage.getItem('custom_admins') || '[]');
      const customMatch = customAdmins.find(a =>
        (a.email.toLowerCase() === userVal.toLowerCase() ||
         a.documentId === userVal ||
         (a.username && a.username.toLowerCase() === userVal.toLowerCase())) &&
        a.password === passVal
      );

      if (isMasterAdmin) {
        authenticated = true;
        adminName = 'Administración Jardines del Cerro IV';
      } else if (customMatch) {
        authenticated = true;
        adminName = customMatch.name;
        this.currentUser = {
          name: customMatch.name,
          email: customMatch.email,
          document_id: customMatch.documentId,
          role: 'admin',
          role_label: 'Administrador Condominal'
        };
      }
    }

    if (authenticated) {
      this.isAdminLoggedIn = true;
      this.renderAdminState();
      this.showToast(`Acceso concedido: ${adminName}`);
      if (passInput) passInput.value = '';
      if (errorBox) errorBox.style.display = 'none';
    } else {
      if (errorBox) {
        errorBox.innerHTML = '❌ Credenciales incorrectas. Verifica tu usuario y contraseña de administrador.';
        errorBox.style.display = 'block';
      } else {
        this.showToast('Credenciales de administrador incorrectas.', 'error');
      }
    }
  }

  logoutAdmin() {
    this.isAdminLoggedIn = false;
    const passInput = document.getElementById('admin-login-pass');
    if (passInput) passInput.value = '';
    const errorBox = document.getElementById('admin-login-error');
    if (errorBox) errorBox.style.display = 'none';
    this.renderAdminState();
    this.showToast('Sesión de administrador cerrada.');
  }

  renderAdminState() {
    const loginCard = document.getElementById('admin-login-container');
    const dashboardLayout = document.getElementById('admin-dashboard-container');

    if (this.isAdminLoggedIn) {
      if (loginCard) loginCard.style.display = 'none';
      if (dashboardLayout) dashboardLayout.style.display = 'flex';
      this.renderAdminTabContent();
    } else {
      if (loginCard) loginCard.style.display = 'flex';
      if (dashboardLayout) dashboardLayout.style.display = 'none';
    }
  }

  setAdminTab(tabName, btnElement) {
    this.activeAdminTab = tabName;
    const sidebar = document.querySelector('#admin-dashboard-container .portal-sidebar');
    if (sidebar) {
      sidebar.querySelectorAll('.portal-nav-btn').forEach(btn => {
        if (btn.getAttribute('data-admin-tab') === tabName) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });
    } else if (btnElement) {
      const parent = btnElement.parentElement;
      parent.querySelectorAll('.portal-nav-btn').forEach(btn => btn.classList.remove('active'));
      btnElement.classList.add('active');
    }
    this.renderAdminTabContent();

    // Sincronización automática con el backend de producción si está online
    if (tabName === 'solicitudes' && window.apiClient && window.apiClient.isBackendOnline) {
      window.apiClient.getAdminRequests().then(backendReqs => {
        if (backendReqs && Array.isArray(backendReqs) && backendReqs.length > 0) {
          let updated = false;
          backendReqs.forEach(bReq => {
            const existing = this.adminData.registrationRequests.find(r => r.id === bReq.id || r.documentId === bReq.documentId);
            if (existing) {
              if (existing.status !== bReq.status) {
                existing.status = bReq.status;
                updated = true;
              }
              if (!existing.backendContractUrl && bReq.contractFile) {
                existing.backendContractUrl = `${window.apiClient.baseUrl.replace('/api', '')}/uploads/${bReq.contractFile}`;
                updated = true;
              }
            } else {
              bReq.backendContractUrl = `${window.apiClient.baseUrl.replace('/api', '')}/uploads/${bReq.contractFile}`;
              this.adminData.registrationRequests.unshift(bReq);
              updated = true;
            }
          });
          if (updated) {
            this.saveAllState();
            this.updateAdminPendingBadge();
            if (this.activeAdminTab === 'solicitudes') {
              this.renderAdminTabContent();
            }
          }
        }
      }).catch(() => {});
    }
  }

  renderAdminTabContent() {
    const panel = document.getElementById('admin-content-panel');
    if (!panel) return;

    const data = this.adminData;

    if (this.activeAdminTab === 'inventario') {
      const totalUnits = this.units.length;
      const availUnits = this.units.filter(u => u.status === 'available').length;
      const resUnits = this.units.filter(u => u.status === 'reserved').length;
      const occUnits = totalUnits - availUnits - resUnits;

      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Inventario de Unidades</h2>
            <p style="font-size: 13px; color: var(--dust);">Gestión en tiempo real de apartamentos y penthouses</p>
          </div>
          <button class="btn-accent" onclick="window.app.openAddUnitModal();">
            + Agregar Unidad
          </button>
        </div>

        <div class="kpi-cards-grid">
          <div class="kpi-card">
            <div class="kpi-label">Disponibles</div>
            <div class="kpi-val" style="color: #059669;">${availUnits} de ${totalUnits}</div>
            <div style="font-size: 11px; color: var(--dust); margin-top: 4px;">Listas para cierre</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Reservadas</div>
            <div class="kpi-val" style="color: #D97706;">${resUnits}</div>
            <div style="font-size: 11px; color: var(--dust); margin-top: 4px;">Separación de US$5k</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Ocupadas / Vendidas</div>
            <div class="kpi-val">${occUnits}</div>
            <div style="font-size: 11px; color: var(--dust); margin-top: 4px;">Residentes permanentes</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Cuotas por Cobrar</div>
            <div class="kpi-val">${data.kpis.pendingFees}</div>
            <div style="font-size: 11px; color: var(--dust); margin-top: 4px;">Mantenimiento corriente</div>
          </div>
        </div>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Tipología</th>
                <th>Área (m²)</th>
                <th>Nivel</th>
                <th>Hab / Baños</th>
                <th>Modalidad</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              ${this.units.map(u => `
                <tr>
                  <td><strong>Unidad ${u.number}</strong></td>
                  <td>${u.typeName}</td>
                  <td>${u.sqm} m²</td>
                  <td>Piso ${u.level}</td>
                  <td>${u.bedrooms} hab · ${u.bathrooms} bñ</td>
                  <td>${u.modalityLabel}</td>
                  <td>
                    <span class="badge ${u.status === 'available' ? 'badge-success' : (u.status === 'reserved' ? 'badge-warning' : 'badge-neutral')}">
                      ${u.statusLabel}
                    </span>
                  </td>
                  <td>
                    <button class="btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="window.app.toggleUnitStatus('${u.id}');">
                      Cambiar Estado
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.activeAdminTab === 'solicitudes') {
      const pendingCount = this.adminData.registrationRequests.filter(r => r.status === 'pending').length;

      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Solicitudes de Acceso & Debida Diligencia</h2>
              <span class="badge ${pendingCount > 0 ? 'badge-warning' : 'badge-success'}">${pendingCount} Pendiente${pendingCount !== 1 ? 's' : ''} de Auditoría</span>
            </div>
            <p style="font-size: 13px; color: var(--dust);">Auditoría notarial y aprobación conforme al Punto 16.3 y 16.4</p>
          </div>
          <button type="button" class="btn-outline" style="font-size: 11.5px; padding: 6px 12px; display: inline-flex; align-items: center; gap: 6px;" onclick="window.app.promptTestEmail();" title="Probar si el servidor en Render envía correos reales a tu bandeja">
            <span>✉️</span> Probar Envío SMTP
          </button>
        </div>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr>
                <th>ID Solicitud</th>
                <th>Fecha</th>
                <th>Solicitante</th>
                <th>Cédula / Pasaporte</th>
                <th>Unidad</th>
                <th>Condición</th>
                <th>Expediente Notariado</th>
                <th>Estado</th>
                <th>Acción de Auditoría</th>
              </tr>
            </thead>
            <tbody>
              ${this.adminData.registrationRequests.map(req => {
                let statusBadge = 'badge-warning';
                let statusText = 'Pendiente';
                if (req.status === 'approved') {
                  statusBadge = 'badge-success';
                  statusText = 'Aprobado & Activo';
                } else if (req.status === 'rejected') {
                  statusBadge = 'badge-neutral';
                  statusText = 'Rechazado';
                }

                return `
                  <tr>
                    <td><code>${req.id}</code></td>
                    <td>${req.date}</td>
                    <td><strong>${req.applicantName}</strong><br><span style="font-size: 11px; color: var(--dust);">${req.email}</span></td>
                    <td><code>${req.documentId}</code></td>
                    <td><span class="badge badge-primary">Unidad ${req.unit}</span></td>
                    <td><strong>${req.roleLabel}</strong></td>
                    <td>
                      <button class="btn-outline" style="padding: 4px 8px; font-size: 11px; display: inline-flex; align-items: center; gap: 4px;" onclick="window.app.openContractViewerModal('${req.id}');">
                        <span>📄</span>
                        <span style="text-decoration: underline;">Ver Contrato</span>
                      </button>
                    </td>
                    <td><span class="badge ${statusBadge}">${statusText}</span></td>
                    <td>
                      ${req.status === 'pending' ? `
                        <div style="display: flex; gap: 6px; align-items: center;">
                          <button class="btn-primary" style="padding: 5px 10px; font-size: 11px; background: #059669; border-color: #059669;" onclick="window.app.approveRegistrationRequest('${req.id}');" title="Aprobar y conceder acceso">
                            ✓ Aprobar
                          </button>
                          <button class="btn-outline" style="padding: 5px 10px; font-size: 11px; color: #DC2626; border-color: #F87171;" onclick="window.app.rejectRegistrationRequest('${req.id}');" title="Rechazar solicitud">
                            ✕ Rechazar
                          </button>
                          <button class="btn-outline" style="padding: 5px 8px; font-size: 11px; color: #DC2626; border-color: #F87171;" onclick="window.app.deleteRegistrationRequest('${req.id}');" title="Eliminar solicitud permanentemente">
                            🗑️
                          </button>
                        </div>
                      ` : `
                        <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                          <span style="font-size: 11.5px; color: var(--dust);">Auditoría completada</span>
                          <button class="btn-outline" style="padding: 4px 7px; font-size: 11px; color: #DC2626; border-color: #F87171;" onclick="window.app.deleteRegistrationRequest('${req.id}');" title="Eliminar registro">
                            🗑️
                          </button>
                        </div>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.activeAdminTab === 'prospectos') {
      panel.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
          <div>
            <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Prospectos Comerciales (CRM)</h2>
            <p style="font-size: 13px; color: var(--dust);">Seguimiento a interesados registrados desde la web y agendador</p>
          </div>
        </div>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Unidad de Interés</th>
                <th>Tipo</th>
                <th>Fecha</th>
                <th>Estado Comercial</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              ${data.prospects.map(p => `
                <tr>
                  <td><code>${p.id}</code></td>
                  <td><strong>${p.name}</strong></td>
                  <td>${p.phone}</td>
                  <td>${p.email}</td>
                  <td><span class="badge badge-primary">${p.unit}</span></td>
                  <td>${p.type}</td>
                  <td>${p.date}</td>
                  <td><span class="badge badge-accent">${p.status}</span></td>
                  <td>
                    <button class="btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="window.app.openWhatsApp('Hola ${p.name}, le contactamos de la Torre Residencial Jardines del Cerro IV en relación a su interés en ${p.unit}.');">
                      WhatsApp
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.activeAdminTab === 'residentes') {
      panel.innerHTML = `
        <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px;">
          <div>
            <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Directorio de Residentes y Alícuotas</h2>
            <p style="font-size: 13px; color: var(--dust);">Copropietarios con cuota de participación según Régimen de Condominio</p>
          </div>
          <button class="btn-primary" onclick="window.app.openCreateAdminModal();" style="padding: 9px 16px; font-size: 13px; display: inline-flex; align-items: center; gap: 8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            <span>+ Nuevo Administrador</span>
          </button>
        </div>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Unidad</th>
                <th>Titular Propietario / Inquilino</th>
                <th>Teléfono</th>
                <th>Condición</th>
                <th>Alícuota %</th>
                <th>Estado Mantenimiento</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              ${data.residents.map(r => `
                <tr>
                  <td><strong>Unidad ${r.unit}</strong></td>
                  <td>${r.name}</td>
                  <td>${r.phone}</td>
                  <td>${r.condition}</td>
                  <td><code>${r.aliquot}</code></td>
                  <td><span class="badge ${r.status === 'Al día' ? 'badge-success' : (r.status === 'Reservado' ? 'badge-warning' : 'badge-neutral')}">${r.status}</span></td>
                  <td>
                    ${r.condition !== 'Disponible' && !r.name.includes('Disponible') && r.name !== '—' ? `
                      <button class="btn-outline" style="padding: 4px 8px; font-size: 11px; color: #DC2626; border-color: #F87171; display: inline-flex; align-items: center; gap: 4px;" onclick="window.app.deleteResident('${r.unit}');" title="Desvincular residente y liberar unidad">
                        <span>🗑️</span> Desvincular
                      </button>
                    ` : `
                      <span style="font-size: 11px; color: var(--dust);">Vacante</span>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.activeAdminTab === 'visitas') {
      panel.innerHTML = `
        <div style="margin-bottom: 24px;">
          <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Agenda de Visitas Programadas</h2>
          <p style="font-size: 13px; color: var(--dust);">Citas presenciales en la torre y sesiones virtuales coordinadas</p>
        </div>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Visitante</th>
                <th>Teléfono</th>
                <th>Unidad</th>
                <th>Fecha y Hora</th>
                <th>Modalidad</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              ${data.visits.map(v => `
                <tr>
                  <td><code>${v.id}</code></td>
                  <td><strong>${v.visitor}</strong></td>
                  <td>${v.phone}</td>
                  <td><span class="badge badge-primary">${v.unit}</span></td>
                  <td>${v.date} · ${v.time}</td>
                  <td>${v.mode}</td>
                  <td><span class="badge ${v.status === 'Confirmada' ? 'badge-success' : 'badge-warning'}">${v.status}</span></td>
                  <td>
                    <button class="btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="window.app.showToast('Recordatorio enviado a ${v.visitor}');">
                      Recordar
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.activeAdminTab === 'mantenimiento') {
      panel.innerHTML = `
        <div style="margin-bottom: 24px;">
          <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Mantenimiento de Edificio & Equipos</h2>
          <p style="font-size: 13px; color: var(--dust);">Seguimiento al generador 24/7, ascensor, piscina y áreas comunes</p>
        </div>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ubicación / Equipo</th>
                <th>Categoría</th>
                <th>Descripción de la Tarea</th>
                <th>Fecha</th>
                <th>Proveedor / Técnico</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              ${data.maintenance.map(m => `
                <tr>
                  <td><code>${m.id}</code></td>
                  <td><strong>${m.unit}</strong></td>
                  <td>${m.category}</td>
                  <td>${m.desc}</td>
                  <td>${m.date}</td>
                  <td>${m.tech}</td>
                  <td><span class="badge ${m.status === 'Programado' ? 'badge-primary' : 'badge-warning'}">${m.status}</span></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.activeAdminTab === 'reportes') {
      panel.innerHTML = `
        <div style="margin-bottom: 24px;">
          <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Reportes Financieros de Condominio</h2>
          <p style="font-size: 13px; color: var(--dust);">Tasa de recaudo mensual y balance del fondo de reserva</p>
        </div>

        <div class="table-card">
          <table class="custom-table">
            <thead>
              <tr>
                <th>Mes / Período</th>
                <th>Monto Recaudado</th>
                <th>Monto Pendiente</th>
                <th>Tasa de Cobranza</th>
                <th>Fondo de Reserva Total</th>
              </tr>
            </thead>
            <tbody>
              ${data.reports.map(rep => `
                <tr>
                  <td><strong>${rep.month}</strong></td>
                  <td><strong style="color: #059669;">${rep.collected}</strong></td>
                  <td style="color: #DC2626;">${rep.pending}</td>
                  <td><span class="badge badge-success">${rep.collectionRate}</span></td>
                  <td><strong>${rep.reserveFund}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
    } else if (this.activeAdminTab === 'ia_admin') {
      const sub = this.adminData.aiSubscription || {
        active: true,
        plan: "Suite Mensual IA Administrador Pro",
        paypalSubId: "I-ADMIN-CERRO-PRO"
      };

      panel.innerHTML = `
        <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Copiloto IA Ejecutivo de Administración</h2>
              <span class="badge badge-success">✓ En Línea · Google Gemini (gemini-3.8-flash)</span>
              <span class="badge badge-accent" style="font-size: 11px;">Suite Corporativa Pro</span>
            </div>
            <p style="font-size: 12.5px; color: var(--dust); margin-top: 2px;">
              ID de Suscripción: <code>${sub.paypalSubId || 'I-ADMIN-CERRO-PRO'}</code> · Auditoría contable, padrón, Ley 5038 de Condominios y telemetría de equipos críticos.
            </p>
          </div>
          <div style="display: flex; gap: 8px;">
            <button class="btn-outline" style="padding: 6px 12px; font-size: 11px;" onclick="window.app.promptTestGemini();" title="Probar conexión en vivo con Google Gemini API">
              🤖 Probar Gemini API
            </button>
            <button class="btn-outline" style="padding: 6px 12px; font-size: 11px;" onclick="window.app.setAdminTab('suscripcion_admin');">
              Administrar Suscripción PayPal
            </button>
          </div>
        </div>

        <!-- Ventana de Chat Inteligente Ejecutivo -->
        <div style="background: var(--white); border: 1px solid var(--linen); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); overflow: hidden; display: flex; flex-direction: column; height: 580px;">
          <!-- Encabezado del Chat -->
          <div style="padding: 16px 20px; background: #1E293B; color: #fff; display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--accent); color: var(--ink); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;">
                IA
              </div>
              <div>
                <div style="font-size: 13px; font-weight: 700; color: #fff;">Copiloto Gerencial & Jurídico · Torre Jardines del Cerro IV</div>
                <div style="font-size: 11px; color: #34D399; font-weight: 600;">● Conectado a Google Gemini (gemini-3.8-flash) · Contabilidad, padrón, Ley 5038 y telemetría de equipos</div>
              </div>
            </div>
            <span class="badge badge-accent" style="font-size: 10px;">Contexto Administrador</span>
          </div>

          <!-- Contenedor de Mensajes -->
          <div id="admin-ai-messages-container" style="flex: 1; padding: 20px; overflow-y: auto; display: flex; flex-direction: column; gap: 14px; background: #F8FAFC;">
            <div class="chat-bubble assistant" style="max-width: 85%;">
              ¡Saludos, Administrador! 🏛️ Soy su <strong>Copiloto Ejecutivo de Inteligencia Artificial</strong> para la Torre Residencial Jardines del Cerro IV impulsado por <strong>Google Gemini</strong>. Cuento con acceso directo al libro contable, nómina de residentes, historial de mantenimiento del generador Cummins de 150 kVA y ascensor Otis, así como a las normativas de la Ley 5038 de Condominios y Ley 155-17. ¿Qué gestión gerencial o legal desea coordinar hoy?
            </div>
          </div>

          <!-- Chips de Sugerencias -->
          <div id="admin-ai-chips" style="padding: 10px 20px; background: var(--surface); border-top: 1px solid var(--linen); display: flex; gap: 8px; overflow-x: auto;">
            <button class="chat-suggestion-btn" style="white-space: nowrap; font-size: 11px;" onclick="window.app.sendAdminAIPrompt('¿Quiénes presentan atrasos y genera un borrador de intimación formal con mora?');">
              ¿Morosidad e intimación de cobro?
            </button>
            <button class="chat-suggestion-btn" style="white-space: nowrap; font-size: 11px;" onclick="window.app.sendAdminAIPrompt('Redactar Convocatoria oficial para Asamblea General Ordinaria según Ley 5038');">
              Redactar Convocatoria de Asamblea
            </button>
            <button class="chat-suggestion-btn" style="white-space: nowrap; font-size: 11px;" onclick="window.app.sendAdminAIPrompt('Diagnóstico de la planta eléctrica 150 kVA y ascensor Otis con horas de servicio');">
              Estado Generador y Otis
            </button>
            <button class="chat-suggestion-btn" style="white-space: nowrap; font-size: 11px;" onclick="window.app.sendAdminAIPrompt('Auditoría del Fondo de Reserva y liquidez operativa del trimestre');">
              Auditoría Fondo de Reserva
            </button>
            <button class="chat-suggestion-btn" style="white-space: nowrap; font-size: 11px;" onclick="window.app.sendAdminAIPrompt('Redactar circular para residentes sobre normas de mascotas y ruidos molestos');">
              Circular Convivencia y Mascotas
            </button>
          </div>

          <!-- Formulario de Entrada -->
          <div style="padding: 14px 20px; background: var(--white); border-top: 1px solid var(--linen);">
            <form style="display: flex; gap: 10px;" onsubmit="window.app.handleAdminAISubmit(event);">
              <input type="text" class="form-input" id="admin-ai-input-field" placeholder="Consulte a Gemini sobre morosidad, redacción legal, mantenimiento predictivo, presupuestos..." autocomplete="off" required style="border-radius: 9999px;">
              <button type="submit" class="btn-primary" style="border-radius: 9999px; padding: 10px 20px;">
                <span>Consultar</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
          </div>
        </div>
      `;
    } else if (this.activeAdminTab === 'suscripcion_admin') {
      const sub = this.adminData.aiSubscription || { active: false };

      panel.innerHTML = `
        <div style="margin-bottom: 24px;">
          <h2 style="font-family: var(--font-display); font-size: 24px; font-weight: 800; color: var(--ink);">Membresía & Suscripción PayPal (Suite Administrador)</h2>
          <p style="font-size: 13px; color: var(--dust);">Gestión de la licencia ejecutiva de Inteligencia Artificial para la Administración</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px;">
          <!-- Tarjeta de Estado Actual -->
          <div style="background: var(--white); border: 1px solid var(--linen); border-radius: var(--radius-xl); padding: 28px; box-shadow: var(--shadow-sm);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <span class="badge ${sub.active ? 'badge-success' : 'badge-warning'}">
                ${sub.active ? 'Suscripción Activa' : 'Sin Suscripción'}
              </span>
              <span style="font-size: 12px; font-weight: 800; color: #003087;">PayPal Subscriptions</span>
            </div>

            <h3 style="font-family: var(--font-display); font-size: 20px; font-weight: 800; color: var(--ink); margin-bottom: 8px;">
              ${sub.active ? `${sub.plan}` : 'Copiloto IA Administrador Desactivado'}
            </h3>

            <div style="font-size: 13px; color: var(--dust); line-height: 1.5; margin-bottom: 20px;">
              ${sub.active
                ? `La administración de la Torre cuenta con una suscripción corporativa activa vía PayPal. La próxima fecha programada de renovación es el <strong>${sub.renewalDate || 'Próximo ciclo'}</strong> por <strong>US$ ${sub.priceUsd}</strong>.`
                : 'Active la suscripción ejecutiva vía PayPal para desbloquear la suite de auditoría financiera, cálculo de mora automática y redacción legal para la Junta de Administración.'}
            </div>

            ${sub.active ? `
              <div style="background: var(--surface); border: 1px solid var(--linen); border-radius: var(--radius-sm); padding: 14px; margin-bottom: 20px; font-size: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: var(--dust);">ID de Transacción:</span>
                  <code>${sub.paypalSubId}</code>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: var(--dust);">Fecha de Alta:</span>
                  <strong>${sub.subscribedAt || 'Hoy'}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: var(--dust);">Próxima Renovación:</span>
                  <strong>${sub.renewalDate || '30 días'}</strong>
                </div>
              </div>

              <div style="display: flex; gap: 10px;">
                <button class="btn-primary" onclick="window.app.setAdminTab('ia_admin');">
                  Ir al Copiloto IA
                </button>
                <button class="btn-outline" style="color: #DC2626; border-color: #F87171;" onclick="window.app.cancelAdminPaypalSubscription();">
                  Cancelar Suscripción
                </button>
              </div>
            ` : `
              <div style="display: flex; gap: 10px;">
                <button class="btn-primary" style="background: #003087; border-color: #003087;" onclick="window.app.openAdminPaypalSubscriptionModal('admin-plan-monthly');">
                  Activar Suite Mensual (US$ 24.99)
                </button>
                <button class="btn-accent" onclick="window.app.openAdminPaypalSubscriptionModal('admin-plan-annual');">
                  Activar Suite Anual (US$ 249)
                </button>
              </div>
            `}
          </div>

          <!-- Cobertura y Garantías Corporativas -->
          <div style="background: var(--surface); border: 1px solid var(--linen); border-radius: var(--radius-xl); padding: 28px;">
            <h4 style="font-family: var(--font-display); font-size: 16px; font-weight: 700; color: var(--ink); margin-bottom: 12px;">
              Garantías Corporativas & Respaldo Legal
            </h4>
            <ul style="font-size: 12.5px; color: var(--dust); list-style: none; display: flex; flex-direction: column; gap: 12px; line-height: 1.5;">
              <li>🏛️ <strong>Alineación con Ley 5038:</strong> Todas las plantillas de asamblea y convocatorias generadas cumplen con los requisitos de quórum y formalidades notariales de la República Dominicana.</li>
              <li>🛡️ <strong>Debida Diligencia (Ley 155-17):</strong> Apoyo analítico en verificación de solvencia y procedencia de fondos de prospectos y contratos de ocupación.</li>
              <li>⚡ <strong>Cancelación Corporativa Inmediata:</strong> El administrador puede suspender o pausar la suscripción desde esta consola o directamente en PayPal en cualquier momento.</li>
            </ul>
          </div>
        </div>
      `;
    }
  }

  toggleUnitStatus(unitId) {
    const unit = this.units.find(u => u.id === unitId);
    if (!unit) return;

    if (unit.status === 'available') {
      unit.status = 'reserved';
      unit.statusLabel = 'Reservado';
    } else if (unit.status === 'reserved') {
      unit.status = 'occupied';
      unit.statusLabel = 'Ocupado';
    } else {
      unit.status = 'available';
      unit.statusLabel = 'Disponible';
    }

    this.showToast(`Estado de la Unidad ${unit.number} actualizado a: ${unit.statusLabel}`);
    this.renderUnits();
    this.renderAdminTabContent();
  }

  openAddUnitModal() {
    const modal = document.getElementById('add-unit-modal');
    if (modal) modal.style.display = 'flex';
  }

  closeAddUnitModal() {
    const modal = document.getElementById('add-unit-modal');
    if (modal) modal.style.display = 'none';
  }

  handleAddUnitSubmit(e) {
    e.preventDefault();
    const number = document.getElementById('new-unit-number').value.trim();
    const type = document.getElementById('new-unit-type').value;
    const sqm = parseInt(document.getElementById('new-unit-sqm').value, 10);
    const beds = parseInt(document.getElementById('new-unit-beds').value, 10);
    const baths = parseInt(document.getElementById('new-unit-baths').value, 10);
    const level = parseInt(document.getElementById('new-unit-level').value, 10);
    const status = document.getElementById('new-unit-status').value;
    const imgUrl = document.getElementById('new-unit-image').value.trim();

    const newUnit = {
      id: `unit-${number.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      number: number,
      type: type,
      typeName: type === 'apartment' ? 'Apartamento' : 'Penthouse',
      sqm: sqm || 120,
      bedrooms: beds || 3,
      bathrooms: baths || 2,
      level: level || 1,
      hasWalkIn: true,
      status: status,
      statusLabel: status === 'available' ? 'Disponible' : (status === 'reserved' ? 'Reservado' : 'Ocupado'),
      modality: 'purchase',
      modalityLabel: 'Compra',
      price: 'Consultar',
      features: [
        'Balcón con vista panorámica',
        'Cocina modular importada',
        'Estacionamiento techado',
        'Acceso a todas las amenidades'
      ],
      image: imgUrl || 'img/photo-1564078516393-cf04bd966897_w800_h600.jpg',
      gallery: [imgUrl || 'img/photo-1564078516393-cf04bd966897_w1200_h800.jpg']
    };

    this.units.unshift(newUnit);
    this.closeAddUnitModal();
    this.showToast(`¡Unidad ${number} agregada exitosamente al inventario!`);
    this.renderUnits();
    this.renderAdminTabContent();
    e.target.reset();
  }

  /* =========================================================================
     Auditoría de Solicitudes & Visor de Contratos (Punto 16.3 & 16.4)
     ========================================================================= */
  updateAdminPendingBadge() {
    const badge = document.getElementById('admin-pending-req-count');
    if (!badge || !this.adminData || !this.adminData.registrationRequests) return;
    const pending = this.adminData.registrationRequests.filter(r => r.status === 'pending').length;
    badge.innerText = pending;
    badge.style.display = pending > 0 ? 'inline-flex' : 'none';
  }

  openContractViewerModal(reqId) {
    const req = this.adminData.registrationRequests.find(r => r.id === reqId);
    if (!req) return;

    const modal = document.getElementById('contract-viewer-modal');
    const titleEl = document.getElementById('contract-viewer-title');
    const subtitleEl = document.getElementById('contract-viewer-subtitle');
    const contentEl = document.getElementById('contract-viewer-content');

    if (titleEl) {
      titleEl.innerText = `Contrato Notariado — ${req.applicantName} (${req.roleLabel})`;
    }
    if (subtitleEl) {
      subtitleEl.innerText = `Unidad ${req.unit} · Cédula/Doc: ${req.documentId} · Radicado el ${req.date}`;
    }

    if (contentEl) {
      // Prioridad 1: Data URL guardado del archivo real subido por el inquilino
      // Prioridad 2: Archivo físico alojado en el backend (/uploads/...)
      let fileUrl = req.contractDataUrl || req.backendContractUrl;
      const fileName = req.contractFile || 'Contrato_Notariado.pdf';

      // Si no hay dataUrl pero el backend está en línea y el nombre no es uno de los mocks sin binario
      if (!fileUrl && window.apiClient && window.apiClient.isBackendOnline && fileName && !fileName.includes('Unidad_101_Notariado') && !fileName.includes('PH901_Inversionisto')) {
        fileUrl = `${window.apiClient.baseUrl.replace('/api', '')}/uploads/${fileName}`;
      }

      const isPdf = (req.contractFileType && req.contractFileType.includes('pdf')) ||
                    (req.contractDataUrl && req.contractDataUrl.startsWith('data:application/pdf')) ||
                    fileName.toLowerCase().endsWith('.pdf');
      const isImage = (req.contractFileType && req.contractFileType.startsWith('image/')) ||
                      (req.contractDataUrl && req.contractDataUrl.startsWith('data:image/')) ||
                      /\.(jpe?g|png|webp|gif|svg)$/i.test(fileName);

      if (fileUrl) {
        // Renderizado del documento real subido
        contentEl.innerHTML = `
          <!-- Ficha Resumen del Documento Real Subido -->
          <div style="background: var(--sand-light, #FAF5EE); border: 1px solid var(--linen, #E7E5E4); border-radius: var(--radius-md, 8px); padding: 14px 16px; margin-bottom: 16px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 44px; height: 44px; border-radius: 10px; background: ${isPdf ? '#FEE2E2' : '#E0E7FF'}; color: ${isPdf ? '#DC2626' : '#4338CA'}; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800;">
                ${isPdf ? 'PDF' : isImage ? 'IMG' : 'DOC'}
              </div>
              <div>
                <div style="font-size: 14px; font-weight: 700; color: var(--ink, #1C1917); word-break: break-all;">${fileName}</div>
                <div style="font-size: 11.5px; color: var(--dust, #78716C);">
                  Subido por <strong>${req.applicantName}</strong> (Unidad ${req.unit}) · ${req.contractFileSize || (isPdf ? 'Documento Legal PDF' : 'Imagen Escaneada')} · <span style="color: #059669; font-weight: 700;">✓ Documento Real del Inquilino</span>
                </div>
              </div>
            </div>
            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <a href="${fileUrl}" download="${fileName}" class="btn-primary" style="padding: 7px 14px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; border-radius: 6px;">
                ⬇ Descargar Original
              </a>
              <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" class="btn-outline" style="padding: 7px 14px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; border-radius: 6px;">
                ↗ Abrir en Nueva Ventana
              </a>
            </div>
          </div>

          <!-- Visor Interactivo Integrado -->
          ${isPdf ? `
            <div style="border: 1px solid var(--linen, #E7E5E4); border-radius: var(--radius-md, 8px); overflow: hidden; background: #525659; box-shadow: inset 0 2px 6px rgba(0,0,0,0.2);">
              <iframe src="${fileUrl}" style="width: 100%; height: 500px; border: none; display: block;" title="Contrato Notariado Subido por el Inquilino"></iframe>
            </div>
          ` : isImage ? `
            <div style="border: 1px solid var(--linen, #E7E5E4); border-radius: var(--radius-md, 8px); overflow: hidden; background: #F8FAFC; text-align: center; padding: 20px; max-height: 520px; overflow-y: auto;">
              <img src="${fileUrl}" alt="${fileName}" style="max-width: 100%; height: auto; max-height: 480px; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); object-fit: contain;">
            </div>
          ` : `
            <div style="padding: 32px; text-align: center; background: var(--sand-light, #FAF5EE); border-radius: var(--radius-md, 8px); border: 1px dashed var(--dust, #78716C);">
              <div style="font-size: 36px; margin-bottom: 8px;">📎</div>
              <p style="font-size: 14px; font-weight: 600; color: var(--ink, #1C1917); margin-bottom: 6px;">Documento adjunto recibido correctamente</p>
              <p style="font-size: 12px; color: var(--dust, #78716C); margin-bottom: 16px;">Haz clic a continuación para descargar y auditar el archivo original.</p>
              <a href="${fileUrl}" download="${fileName}" class="btn-primary" style="padding: 9px 18px; text-decoration: none; display: inline-block;">
                ⬇ Descargar Archivo para Auditoría
              </a>
            </div>
          `}
        `;
      } else {
        // En caso de expedientes de prueba precargados sin archivo binario físico
        contentEl.innerHTML = `
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: var(--radius-md, 8px); padding: 12px 16px; margin-bottom: 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div style="font-size: 12px; color: #1E40AF;">
              <strong>ℹ️ Expediente Notarial Registrado:</strong> Archivo asociado <code>${fileName}</code> (Protocolo notarial digital).
            </div>
            ${window.apiClient && window.apiClient.isBackendOnline ? `
              <a href="${window.apiClient.baseUrl.replace('/api', '')}/uploads/${fileName}" target="_blank" class="btn-outline" style="padding: 4px 10px; font-size: 11px; text-decoration: none;">
                Ver en Servidor Cloud
              </a>
            ` : ''}
          </div>

          <!-- Hoja Notarial Oficial Protocolar Dinámica -->
          <div style="background: #FAFAF9; border: 2px solid #D6D3D1; border-radius: var(--radius-md, 8px); padding: 24px; font-family: 'Times New Roman', serif; color: #1C1917; box-shadow: inset 0 0 12px rgba(0,0,0,0.03);">
            <div style="text-align: center; border-bottom: 2px solid #1C1917; padding-bottom: 14px; margin-bottom: 16px;">
              <div style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; font-weight: 700; color: #78716C;">República Dominicana · Matrícula Notarial 8921-JCE</div>
              <h2 style="font-size: 18px; margin: 4px 0; font-weight: 800; letter-spacing: 1px;">NOTARÍA PÚBLICA DE MAO, VALVERDE</h2>
              <div style="font-size: 13px; font-style: italic;">Acto Auténtico de Ocupación Condominal y Debida Diligencia</div>
              <div style="font-size: 11px; font-weight: 700; margin-top: 4px; color: #DC2626;">EXPEDIENTE NO. ${req.id}</div>
            </div>

            <div style="font-size: 13px; line-height: 1.7; text-align: justify; margin-bottom: 18px;">
              En la ciudad de Mao, Municipio Cabecera de la Provincia Valverde, República Dominicana, a los ${req.date || 'días del mes en curso'}, ante mí, Notario Público de los del Número para este Municipio, comparece formalmente:
              <br><br>
              <strong>${req.applicantName}</strong>, portador(a) del Documento de Identidad No. <code>${req.documentId}</code>, de nacionalidad dominicana, con número telefónico ${req.phone} y correo registrado ${req.email}, quien interviene en calidad de <strong>${req.roleLabel}</strong> de la <strong>Unidad Residencial ${req.unit}</strong> de la Torre Residencial Jardines del Cerro IV.
              <br><br>
              <strong>DECLARACIÓN JURADA Y CLÁUSULAS CONDICIONALES:</strong>
              <br>
              <strong>PRIMERO:</strong> El solicitante declara haber suscrito el ${req.roleRequested === 'owner' ? 'Contrato de Promesa de Compraventa Inmobiliaria' : 'Contrato de Alquiler Residencial'} formal referente a la Unidad ${req.unit}, asumiendo fiel observancia a la Ley 5038 sobre Régimen de Condominio.
              <br>
              <strong>SEGUNDO:</strong> Declara bajo la fe del juramento que los fondos destinados al pago de iniciales, alquileres y mantenimiento provienen de fuentes lícitas conforme a la Ley 155-17 contra el Lavado de Activos y Financiamiento del Terrorismo.
              <br>
              <strong>TERCERO:</strong> El solicitante autoriza al Administrador de Jardines del Cerro IV la verificación de este expediente (Archivo radicado: <code>${fileName}</code>) para la expedición de sus credenciales de acceso biométrico y digital.
            </div>

            <div style="margin-top: 24px; border-top: 1px dashed #A8A29E; padding-top: 14px; display: flex; justify-content: space-between; font-size: 11px;">
              <div>
                <strong>Administración Condominal</strong><br>
                Inversionisto S.R.L.
              </div>
              <div style="text-align: center;">
                <strong>Firma del Solicitante</strong><br>
                ${req.applicantName}
              </div>
              <div style="text-align: right;">
                <strong>Sello Notaría Pública</strong><br>
                Mao, Valverde, R.D.
              </div>
            </div>
          </div>
        `;
      }
    }

    if (modal) modal.style.display = 'flex';
  }

  closeContractViewerModal() {
    const modal = document.getElementById('contract-viewer-modal');
    if (modal) modal.style.display = 'none';
  }

  async approveRegistrationRequest(reqId) {
    const req = this.adminData.registrationRequests.find(r => r.id === reqId);
    if (!req) return;

    req.status = 'approved';

    // 1. Activar usuario en el padrón de usuarios registrados
    const reqNormDoc = this.normalizeDoc(req.documentId);
    const user = this.registeredUsers.find(u =>
      (u.documentId && this.normalizeDoc(u.documentId) === reqNormDoc) ||
      (u.email && u.email.toLowerCase() === (req.email || '').toLowerCase())
    );

    if (user) {
      user.status = 'approved';
      if (req.password) {
        user.password = req.password;
      }
    } else {
      const initials = (req.applicantName || 'US').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'US';
      const now = new Date();
      const currentMonthYear = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      const capitalizedMonth = currentMonthYear.charAt(0).toUpperCase() + currentMonthYear.slice(1);
      const todayShort = now.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
      this.registeredUsers.push({
        id: `usr-${(req.unit || '101').toString().toLowerCase()}-${Date.now()}`,
        name: req.applicantName,
        documentId: req.documentId,
        email: req.email,
        phone: req.phone || '',
        unit: req.unit,
        role: req.roleRequested || 'owner',
        roleLabel: req.roleRequested === 'owner' ? 'Propietario Residente' : 'Inquilino Arrendatario',
        aliquot: req.roleRequested === 'owner' ? '4.65%' : 'N/A (Inquilino)',
        password: req.password || '1234',
        status: 'approved',
        avatar: initials,
        aiSubscription: {
          active: true,
          plan: "Plan Residente Convivencia & DGII",
          priceUsd: 9.99,
          paypalSubId: `I-RES-${req.unit || 'NEW'}`,
          subscribedAt: '12 Oct 2026',
          renewalDate: '12 Nov 2026',
          statusLabel: 'Activa vía PayPal'
        },
        accountData: {
          unit: req.unit,
          type: `Apartamento · Unidad ${req.unit}`,
          resident: req.roleRequested === 'owner' ? 'Propietario Titular' : 'Inquilino Arrendatario',
          sqm: 120,
          bedrooms: 3,
          bathrooms: 2,
          status: 'Al día',
          statusNote: req.roleRequested === 'owner' ? `Propietario Titular · Unidad ${req.unit}` : `Inquilino Arrendatario · Unidad ${req.unit}`,
          nextFee: `15 ${todayShort}`,
          nextFeeNote: 'Cuota de mantenimiento mensual',
          activeRequests: 0,
          activities: [],
          cuotas: [
            {
              period: capitalizedMonth,
              due: `15 ${todayShort}`,
              amount: 'RD$ 6,500.00',
              status: 'Pendiente',
              badge: 'badge-warning'
            }
          ],
          pagos: [],
          tickets: [],
          documentos: []
        }
      });
    }

    // 2. Actualizar directorio de residentes
    const resDir = this.adminData.residents.find(r => r.unit === req.unit);
    if (resDir) {
      resDir.name = req.applicantName;
      resDir.phone = req.phone;
      resDir.condition = req.roleRequested === 'owner' ? 'Propietario Residente' : 'Inquilino Arrendatario';
      resDir.status = 'Al día';
    }

    // 3. Marcar la unidad como ocupada en el catálogo
    const cleanUnit = (req.unit || '').toString().replace('Unidad', '').replace('unidad', '').trim();
    const invUnit = (this.units || []).find(u =>
      u.number === cleanUnit ||
      u.number === req.unit ||
      u.id === cleanUnit ||
      u.id === `apt-${cleanUnit.toLowerCase()}` ||
      u.id === `ph-${cleanUnit.toLowerCase()}` ||
      (u.id && u.id.endsWith(cleanUnit.toLowerCase()))
    );
    if (invUnit) {
      invUnit.status = 'occupied';
      invUnit.statusLabel = 'Ocupado';
    }

    // 4. Actividad reciente
    this.adminData.recentActivity.unshift({
      title: `Solicitud aprobada: ${req.applicantName} habilitado en Unidad ${req.unit} (Correo enviado a ${req.email})`,
      time: 'Hace un momento',
      type: 'user'
    });

    this.saveAllState();
    this.updateAdminPendingBadge();
    this.renderAdminTabContent();
    if (typeof this.renderUnits === 'function') {
      this.renderUnits();
    }
    this.renderRegistrationUnitsDropdown();
    this.showToast(`Aprobando y despachando notificación oficial a ${req.email}...`);

    let backendResult = null;
    if (window.apiClient) {
      backendResult = await window.apiClient.decideRegistrationRequest(reqId, 'approve', {
        applicant_name: req.applicantName,
        email: req.email,
        unit: req.unit,
        role_label: req.roleLabel
      });
    }

    if (backendResult && backendResult.email_notification && backendResult.email_notification.sent_real_smtp) {
      alert(`¡Solicitud Aprobada con Éxito! 🎉\n\nEl residente ha sido habilitado y el correo de bienvenida oficial fue enviado automáticamente a:\n${req.email}\n\n(Revisa la bandeja de entrada de ese correo).`);
    } else if (backendResult && backendResult.email_notification && backendResult.email_notification.error) {
      alert(`Solicitud aprobada en el sistema, pero el servidor de correo reportó:\n\n${backendResult.email_notification.error}`);
    }

    this.openEmailNotificationModal('approve', req, backendResult);
  }

  async rejectRegistrationRequest(reqId) {
    const req = this.adminData.registrationRequests.find(r => r.id === reqId);
    if (!req) return;

    if (confirm(`¿Estás seguro de rechazar la solicitud de acceso para ${req.applicantName}? Se enviará una notificación por correo a ${req.email}.`)) {
      req.status = 'rejected';

      const user = this.registeredUsers.find(u =>
        u.documentId === req.documentId || u.email.toLowerCase() === req.email.toLowerCase()
      );
      if (user) {
        user.status = 'rejected';
      }

      this.adminData.recentActivity.unshift({
        title: `Solicitud rechazada: ${req.applicantName} (Correo enviado a ${req.email})`,
        time: 'Hace un momento',
        type: 'user'
      });

      this.saveAllState();
      this.updateAdminPendingBadge();
      this.renderAdminTabContent();
      this.showToast(`Notificando rechazo a ${req.email}...`);

      let backendResult = null;
      if (window.apiClient) {
        backendResult = await window.apiClient.decideRegistrationRequest(reqId, 'reject', {
          applicant_name: req.applicantName,
          email: req.email,
          unit: req.unit,
          role_label: req.roleLabel
        });
      }

      if (backendResult && backendResult.email_notification && backendResult.email_notification.sent_real_smtp) {
        alert(`Solicitud Rechazada.\n\nSe ha notificado formalmente por correo a:\n${req.email}`);
      } else if (backendResult && backendResult.email_notification && backendResult.email_notification.error) {
        alert(`Solicitud rechazada, pero el envío de correo reportó:\n\n${backendResult.email_notification.error}`);
      }

      this.openEmailNotificationModal('reject', req, backendResult);
    }
  }

  async deleteRegistrationRequest(reqId) {
    const req = this.adminData.registrationRequests.find(r => r.id === reqId);
    const applicantName = req ? req.applicantName : reqId;

    if (!confirm(`¿Estás seguro de eliminar permanentemente la solicitud de ${applicantName} (${reqId})?\n\n• Esta acción borrará el expediente y el usuario de prueba.\n• La unidad quedará limpia.`)) {
      return;
    }

    // 1. Eliminar de registrationRequests
    this.adminData.registrationRequests = this.adminData.registrationRequests.filter(r => r.id !== reqId);

    // 2. Si existe en registeredUsers como pendiente o rechazado, eliminar
    if (req) {
      this.registeredUsers = this.registeredUsers.filter(u =>
        u.documentId !== req.documentId && u.email.toLowerCase() !== req.email.toLowerCase()
      );
    }

    // 3. Registrar actividad en auditoría
    this.adminData.recentActivity.unshift({
      title: `Solicitud eliminada: expediente de ${applicantName} depurado`,
      time: 'Hace un momento',
      type: 'user'
    });

    this.saveAllState();
    this.updateAdminPendingBadge();
    this.renderAdminTabContent();
    this.showToast(`Solicitud de ${applicantName} eliminada.`);

    // 4. Sincronizar eliminación con backend
    if (window.apiClient) {
      window.apiClient.deleteRegistrationRequest(reqId);
    }
  }

  async deleteResident(unit, name = null) {
    const cleanUnit = (unit || '').toString().replace('Unidad', '').replace('unidad', '').trim();
    const resDir = (this.adminData && this.adminData.residents ? this.adminData.residents : []).find(r => r.unit === cleanUnit || r.unit === unit);
    const targetName = (name && name !== '—') ? name : ((resDir && resDir.name && resDir.name !== '—') ? resDir.name : `Unidad ${cleanUnit}`);

    if (!confirm(`¿Estás seguro de desvincular y eliminar a "${targetName}" de la Unidad ${cleanUnit}?\n\n• Se revocarán todas sus credenciales de acceso al portal.\n• La Unidad ${cleanUnit} quedará liberada como 'Disponible'.\n• Se depurarán sus registros y contratos de prueba.`)) {
      return;
    }

    // 1. Actualizar directorio de residentes: marcar unidad como vacante
    if (resDir) {
      resDir.name = "—";
      resDir.phone = "—";
      resDir.condition = "Disponible";
      resDir.status = "Libre";
    }

    // 2. Eliminar del padrón de usuarios registrados
    this.registeredUsers = (this.registeredUsers || []).filter(u => {
      const uUnit = (u.unit || '').toString().replace('Unidad', '').replace('unidad', '').trim();
      const isSameUnit = uUnit === cleanUnit || u.unit === unit;
      const isSameName = (u.name || '').trim().toLowerCase() === targetName.trim().toLowerCase();
      return !isSameUnit && !isSameName;
    });

    // 3. Eliminar solicitudes de registro asociadas a esta unidad o residente
    if (this.adminData && this.adminData.registrationRequests) {
      this.adminData.registrationRequests = this.adminData.registrationRequests.filter(r => {
        const rUnit = (r.unit || '').toString().replace('Unidad', '').replace('unidad', '').trim();
        const isSameUnit = rUnit === cleanUnit || r.unit === unit;
        const isSameName = (r.applicantName || '').trim().toLowerCase() === targetName.trim().toLowerCase();
        return !isSameUnit && !isSameName;
      });
      this.updateAdminPendingBadge();
    }

    // 4. Actualizar inventario de unidades en marketplace (marcar como disponible)
    const invUnit = (this.units || []).find(u =>
      u.number === cleanUnit ||
      u.id === cleanUnit ||
      u.id === `apt-${cleanUnit.toLowerCase()}` ||
      u.id === `ph-${cleanUnit.toLowerCase()}` ||
      (u.id && u.id.endsWith(cleanUnit.toLowerCase()))
    );
    if (invUnit) {
      invUnit.status = 'available';
      invUnit.statusLabel = 'Disponible';
    }

    // 5. Cerrar sesión activa si coincide con el residente desvinculado
    if (this.currentUser && (this.currentUser.unit === cleanUnit || this.currentUser.name === targetName)) {
      this.currentUser = null;
      this.isResidentLoggedIn = false;
      this.renderResidentState();
    }

    // 6. Bitácora de actividad reciente
    this.adminData.recentActivity.unshift({
      title: `Residente desvinculado: ${targetName} retirado de Unidad ${cleanUnit} (Unidad liberada)`,
      time: 'Hace un momento',
      type: 'user'
    });

    this.saveAllState();
    this.renderAdminTabContent();
    if (typeof this.renderUnits === 'function') {
      this.renderUnits();
    }
    this.renderRegistrationUnitsDropdown();
    this.showToast(`Residente "${targetName}" desvinculado y Unidad ${cleanUnit} liberada.`);

    // 7. Sincronizar con backend si está disponible
    if (window.apiClient && typeof window.apiClient.deleteResident === 'function') {
      try {
        await window.apiClient.deleteResident(cleanUnit);
      } catch (err) {
        console.warn('Fallo en sincronización con backend:', err);
      }
    }
  }

  /* =========================================================================
     Modal de Notificación por Correo Electrónico Oficial
     ========================================================================= */
  openEmailNotificationModal(type, req, backendResult = null) {
    const modal = document.getElementById('email-notification-modal');
    const container = document.getElementById('email-notification-content');
    if (!modal || !container) return;

    const isApproved = (type === 'approve');
    const subject = isApproved
      ? `🎉 Solicitud Aprobada — Acceso Habilitado a Jardines del Cerro IV (Unidad ${req.unit})`
      : `⚠️ Notificación sobre su Solicitud de Acceso — Jardines del Cerro IV (Expediente ${req.id})`;

    const emailStatus = backendResult && backendResult.email_notification;
    const sentReal = emailStatus && emailStatus.sent_real_smtp;
    const smtpError = emailStatus && emailStatus.error;

    const mailtoBody = encodeURIComponent(
      `Estimado(a) ${req.applicantName},\n\n` +
      (isApproved
        ? `Nos complace informarle que su solicitud de acceso para la Unidad Residencial ${req.unit} en calidad de ${req.roleLabel} ha sido formalmente APROBADA.\n\nYa puede ingresar al portal web con su correo electrónico (${req.email}) y la contraseña establecida.\n\nAtentamente,\nAdministración Jardines del Cerro IV`
        : `Le informamos que tras auditar su solicitud referente a la Unidad Residencial ${req.unit}, la misma requiere rectificación de su contrato notariado conforme a las regulaciones de condominio.\n\nPor favor comuníquese con nosotros para asistirle.\n\nAtentamente,\nAdministración Jardines del Cerro IV`
      )
    );
    const mailtoLink = `mailto:${encodeURIComponent(req.email)}?subject=${encodeURIComponent(subject)}&body=${mailtoBody}`;

    container.innerHTML = `
      <!-- Diagnóstico de Envío en Tiempo Real -->
      ${sentReal ? `
        <div style="background: #ECFDF5; border: 1.5px solid #059669; border-radius: var(--radius-md, 8px); padding: 14px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 26px;">✅</div>
            <div>
              <div style="font-size: 13.5px; font-weight: 800; color: #065F46;">
                ¡Correo Oficial Entregado con Éxito!
              </div>
              <div style="font-size: 12px; color: #047857;">
                El servidor en Render despachó exitosamente la notificación a: <strong>${req.email}</strong>
              </div>
            </div>
          </div>
          <span class="badge badge-success" style="font-size: 11px;">Entregado a Inbox</span>
        </div>
      ` : smtpError ? `
        <div style="background: #FFFBEB; border: 1.5px solid #F59E0B; border-radius: var(--radius-md, 8px); padding: 14px 16px; margin-bottom: 16px;">
          <div style="display: flex; align-items: flex-start; gap: 10px;">
            <div style="font-size: 24px; line-height: 1;">⚠️</div>
            <div style="flex: 1;">
              <div style="font-size: 13.5px; font-weight: 800; color: #92400E; margin-bottom: 4px;">
                Respuesta del Servidor SMTP de Render
              </div>
              <div style="font-size: 12px; color: #78350F; line-height: 1.5; font-family: monospace; background: rgba(0,0,0,0.05); padding: 6px 10px; border-radius: 6px;">
                ${smtpError}
              </div>
              <div style="font-size: 11.5px; color: #92400E; margin-top: 8px;">
                💡 <strong>Consejo:</strong> Si es Gmail, asegúrate de que <code>SMTP_USER</code> sea tu correo y que <code>SMTP_PASS</code> sea la clave de 16 letras generada en Google App Passwords. También puedes hacer clic abajo en <em>"Enviar Directo desde mi Correo"</em> para despacharlo de inmediato.
              </div>
            </div>
          </div>
        </div>
      ` : `
        <div style="background: #EFF6FF; border: 1.5px solid #3B82F6; border-radius: var(--radius-md, 8px); padding: 14px 16px; margin-bottom: 16px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <div style="font-size: 24px;">📧</div>
            <div>
              <div style="font-size: 13.5px; font-weight: 800; color: #1E40AF;">
                Notificación Oficial Generada
              </div>
              <div style="font-size: 12px; color: #1D4ED8;">
                Destinatario: <strong>${req.applicantName}</strong> &lt;<code>${req.email}</code>&gt;
              </div>
            </div>
          </div>
          <span class="badge ${isApproved ? 'badge-success' : 'badge-danger'}" style="font-size: 11px;">
            ${isApproved ? '✓ Cuenta Habilitada' : '✕ Acceso Denegado'}
          </span>
        </div>
      `}

      <!-- Tarjeta de Vista Previa del Correo Oficial -->
      <div style="background: var(--white, #ffffff); border: 1px solid var(--linen, #E7E5E4); border-radius: var(--radius-md, 8px); overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        <!-- Barra de Cabecera del Correo -->
        <div style="background: #FAF5EE; padding: 12px 18px; border-bottom: 1px solid var(--linen, #E7E5E4); font-size: 12px; color: var(--dust, #78716C);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <div><strong>De:</strong> Torre Residencial Jardines del Cerro IV &lt;notificaciones@jardinesdelcerro.com&gt;</div>
            <div><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
          </div>
          <div style="margin-bottom: 4px;"><strong>Para:</strong> ${req.applicantName} &lt;${req.email}&gt;</div>
          <div><strong>Asunto:</strong> <span style="font-weight: 700; color: var(--ink, #1C1917);">${subject}</span></div>
        </div>

        <!-- Cuerpo del Correo -->
        <div style="padding: 24px; font-size: 13.5px; line-height: 1.7; color: #1C1917;">
          <div style="text-align: center; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 1px solid var(--linen, #E7E5E4);">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: var(--accent, #C9A770);">Torre Residencial Jardines del Cerro IV</div>
            <div style="font-size: 17px; font-weight: 800; color: #0E1614; margin-top: 4px;">
              ${isApproved ? '¡Bienvenido(a) a tu Residencia!' : 'Notificación sobre Expediente de Acceso'}
            </div>
            <div style="font-size: 12px; color: var(--dust, #78716C);">Mao, Valverde, República Dominicana</div>
          </div>

          <p>Estimado(a) <strong>${req.applicantName}</strong>,</p>

          ${isApproved ? `
            <p>Nos complace informarte que la administración de la Torre Residencial Jardines del Cerro IV ha auditado y <strong>aprobado formalmente</strong> tu contrato notariado y solicitud de acceso para la <strong>Unidad Residencial ${req.unit}</strong> en calidad de <strong>${req.roleLabel}</strong>.</p>
            <div style="background: #FAF5EE; border-left: 3px solid #059669; padding: 12px 14px; margin: 16px 0; font-size: 12.5px;">
              <strong>Tus accesos han sido activados:</strong><br>
              • <strong>Portal Web:</strong> Puedes iniciar sesión con tu correo (<code>${req.email}</code>) y contraseña configurada.<br>
              • <strong>Servicios Habilitados:</strong> Estados de cuenta, reserva de piscina y áreas sociales, asambleas de copropietarios y Copiloto IA.<br>
              • <strong>Expediente Acreditado:</strong> <code>${req.id}</code> (Contrato verificado).
            </div>
          ` : `
            <p>Te informamos que tras la revisión de tu expediente <strong>${req.id}</strong> para la <strong>Unidad Residencial ${req.unit}</strong>, la solicitud requiere rectificación de los documentos anexos antes de poder ser autorizada.</p>
            <div style="background: #FEF2F2; border-left: 3px solid #DC2626; padding: 12px 14px; margin: 16px 0; font-size: 12.5px; color: #991B1B;">
              <strong>Motivo de auditoría:</strong> El contrato notariado o documento adjunto requiere validación complementaria conforme a la Ley 5038 y normas internas de convivencia.
            </div>
            <p>Por favor contacta a la oficina administrativa o radica una nueva solicitud con el contrato subsanado.</p>
          `}

          <div style="margin-top: 24px; padding-top: 14px; border-top: 1px dashed var(--linen, #E7E5E4); font-size: 11.5px; color: var(--dust, #78716C); display: flex; justify-content: space-between;">
            <div>
              <strong>Administración Condominal</strong><br>
              Inversionisto S.R.L. · Tel: (809) 555-0199
            </div>
            <div style="text-align: right;">
              <strong>Seguridad & Debida Diligencia</strong><br>
              Ley 5038 & Ley 155-17
            </div>
          </div>
        </div>
      </div>

      <!-- Botones de Acción -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; flex-wrap: wrap; gap: 10px;">
        ${!sentReal ? `
          <a href="${mailtoLink}" class="btn-outline" style="padding: 8px 14px; font-size: 12px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
            <span>↗</span> Enviar Manualmente desde mi Correo
          </a>
        ` : `
          <div style="font-size: 12.5px; color: #059669; font-weight: 700; display: flex; align-items: center; gap: 6px;">
            <span>✓</span> Correo entregado automáticamente al destinatario
          </div>
        `}
        <button type="button" class="btn-primary" onclick="window.app.closeEmailNotificationModal();">
          Cerrar Notificación
        </button>
      </div>
    `;

    modal.style.display = 'flex';
  }

  closeEmailNotificationModal() {
    const modal = document.getElementById('email-notification-modal');
    if (modal) modal.style.display = 'none';
  }

  /* =========================================================================
     Gestión y Creación de Administradores
     ========================================================================= */
  openCreateAdminModal() {
    const modal = document.getElementById('create-admin-modal');
    const err = document.getElementById('create-admin-error');
    if (err) {
      err.style.display = 'none';
      err.innerHTML = '';
    }
    if (modal) modal.style.display = 'flex';
  }

  closeCreateAdminModal() {
    const modal = document.getElementById('create-admin-modal');
    if (modal) modal.style.display = 'none';
  }

  async handleCreateAdminSubmit(e) {
    if (e) e.preventDefault();
    const nameInput = document.getElementById('new-admin-name');
    const docInput = document.getElementById('new-admin-doc');
    const emailInput = document.getElementById('new-admin-email');
    const phoneInput = document.getElementById('new-admin-phone');
    const passInput = document.getElementById('new-admin-pass');
    const errorBox = document.getElementById('create-admin-error');

    if (errorBox) {
      errorBox.style.display = 'none';
      errorBox.innerHTML = '';
    }

    const name = nameInput ? nameInput.value.trim() : '';
    const doc = docInput ? docInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const pass = passInput ? passInput.value : '';

    if (!name || !doc || !email || !pass) {
      if (errorBox) {
        errorBox.innerHTML = '⚠️ Por favor completa todos los campos requeridos (*).';
        errorBox.style.display = 'block';
      }
      return;
    }

    // Validar complejidad de contraseña (mínimo 8 caracteres)
    if (pass.length < 8) {
      if (errorBox) {
        errorBox.innerHTML = '⚠️ La contraseña de administrador debe tener como mínimo 8 caracteres.';
        errorBox.style.display = 'block';
      }
      return;
    }

    // Verificar si la cédula o correo ya existen
    if (this.isDocumentIdTaken(doc)) {
      if (errorBox) {
        errorBox.innerHTML = `⚠️ El documento / cédula <strong>${doc}</strong> ya se encuentra registrado.`;
        errorBox.style.display = 'block';
      }
      return;
    }

    if (this.isEmailTaken(email)) {
      if (errorBox) {
        errorBox.innerHTML = `⚠️ El correo electrónico <strong>${email}</strong> ya se encuentra registrado.`;
        errorBox.style.display = 'block';
      }
      return;
    }

    // Guardar en backend si está online
    if (window.apiClient && window.apiClient.isBackendOnline) {
      try {
        const apiRes = await window.apiClient.createAdmin({
          name,
          document_id: doc,
          email,
          phone: phone || '(809) 555-0100',
          password: pass
        });
        if (apiRes && apiRes.detail) {
          if (errorBox) {
            errorBox.innerHTML = `⚠️ ${apiRes.detail}`;
            errorBox.style.display = 'block';
          }
          return;
        }
      } catch (err) {
        console.warn('Error al guardar admin en backend:', err);
      }
    }

    // Guardar en administradores locales permanentes (localStorage)
    const customAdmins = JSON.parse(localStorage.getItem('custom_admins') || '[]');
    customAdmins.push({
      id: `usr-admin-${Date.now()}`,
      name,
      documentId: doc,
      email,
      phone: phone || '(809) 555-0100',
      password: pass,
      role: 'admin',
      roleLabel: 'Administrador Condominal'
    });
    localStorage.setItem('custom_admins', JSON.stringify(customAdmins));

    // Resetear formulario y cerrar modal
    if (nameInput) nameInput.value = '';
    if (docInput) docInput.value = '';
    if (emailInput) emailInput.value = '';
    if (phoneInput) phoneInput.value = '';
    if (passInput) passInput.value = '';
    this.closeCreateAdminModal();

    this.showToast(`🛡️ Administrador "${name}" creado exitosamente.`);
  }

  async promptTestEmail() {
    const targetEmail = prompt("Ingresa el correo electrónico donde deseas recibir el email de prueba para validar tu SMTP en Render:", (this.currentUser ? this.currentUser.email : ""));
    if (!targetEmail || !targetEmail.trim()) return;

    this.showToast(`Conectando con Render para enviar email de prueba a ${targetEmail}...`);
    if (window.apiClient) {
      const res = await window.apiClient.sendTestEmail(targetEmail.trim());
      if (res && res.sent_real_smtp) {
        alert(`¡Éxito! 🎉\n\nEl correo de prueba ha sido entregado exitosamente a:\n${targetEmail}\n\nRevisa tu bandeja de entrada.`);
      } else {
        const errorMsg = (res && res.error) ? res.error : 'No se pudo conectar al servidor de Render o las credenciales no son válidas.';
        alert(`Diagnóstico de Conexión SMTP:\n\n${errorMsg}`);
      }
    } else {
      alert("El cliente API del backend no está disponible.");
    }
  }

  async promptTestGemini() {
    this.showToast('Verificando conexión con Google Gemini API...');
    if (window.apiClient) {
      const res = await window.apiClient.testAIConnection();
      if (res && res.success) {
        alert(`¡Conexión Exitosa con Google Gemini! 🎉\n\nProveedor: ${res.provider}\nModelo: ${res.model}\n\nDetalles del servidor:\n${res.message}`);
        return;
      }
      const errorMsg = (res && res.error) ? res.error : 'No se pudo conectar al servicio de Gemini.';
      const keyPrompt = prompt(`Diagnóstico de Gemini API:\n\n${errorMsg}\n\n¿Deseas probar con una clave de Google Gemini API directamente? Ingrésala aquí (o agrégala como GEMINI_API_KEY en backend/.env o en las variables de Render):`);
      if (keyPrompt && keyPrompt.trim()) {
        const cleanKey = keyPrompt.trim();
        this.showToast('Probando clave con Google Gemini...');
        let res2 = await window.apiClient.testAIConnection(cleanKey);
        if (!res2 || !res2.success) {
          res2 = await this.testGeminiDirectlyFromBrowser(cleanKey);
        }
        if (res2 && res2.success) {
          alert(`¡Clave Válida! 🎉\n\nGoogle Gemini respondió correctamente:\n${res2.message}\n\nRecuerda guardarla en las Variables de Entorno de Render como GEMINI_API_KEY.`);
        } else {
          alert(`Error al validar la clave:\n\n${res2.error || 'Clave inválida o sin permisos en Google'}`);
        }
      }
    } else {
      alert("El cliente API del backend no está disponible.");
    }
  }

  async testGeminiDirectlyFromBrowser(key) {
    const models = ['gemini-3.8-flash', 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-2.0-flash'];
    let lastErr = 'Fallo de conexión';
    for (const m of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${encodeURIComponent(key)}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Por favor responde unicamente: CONECTADO' }] }]
          })
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'OK';
          return {
            success: true,
            provider: 'Google Gemini (Navegador Directo)',
            model: m,
            message: `¡Conexión verificada directamente con Google Gemini (${m})! Respuesta: ${reply}`
          };
        } else {
          const errData = await res.json().catch(() => null);
          lastErr = errData?.error?.message || `HTTP ${res.status}`;
        }
      } catch (e) {
        lastErr = e.message;
      }
    }
    return { success: false, error: lastErr };
  }

  /* =========================================================================
     Chatbot de Asistente Virtual IA
     ========================================================================= */
  toggleAIChat() {
    this.isChatOpen = !this.isChatOpen;
    const chatWindow = document.getElementById('ai-chat-window');
    if (chatWindow) {
      if (this.isChatOpen) {
        chatWindow.classList.add('open');
        const input = document.getElementById('ai-chat-input-field');
        if (input) setTimeout(() => input.focus(), 150);
      } else {
        chatWindow.classList.remove('open');
      }
    }
  }

  sendAIChatPrompt(promptText) {
    const input = document.getElementById('ai-chat-input-field');
    if (input) input.value = promptText;
    this.handleAIChatSubmit(new Event('submit'));
  }

  handleAIChatSubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('ai-chat-input-field');
    const msgContainer = document.getElementById('ai-chat-messages-container');
    const suggestions = document.getElementById('ai-chat-suggestions');

    if (!input || !msgContainer) return;
    const text = input.value.trim();
    if (!text) return;

    // Agregar mensaje del usuario
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.innerText = text;
    msgContainer.appendChild(userBubble);
    input.value = '';

    if (suggestions) suggestions.style.display = 'none';

    // Scroll al fondo
    msgContainer.scrollTop = msgContainer.scrollHeight;

    // Indicador de "Escribiendo..."
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble assistant';
    typingBubble.style.opacity = '0.7';
    typingBubble.innerText = 'Escribiendo respuesta...';
    msgContainer.appendChild(typingBubble);
    msgContainer.scrollTop = msgContainer.scrollHeight;

    // Generar respuesta con Gemini o local
    (async () => {
      let responseText = null;
      if (window.apiClient) {
        try {
          const res = await window.apiClient.chatAI(text, 'public');
          if (res && res.success && res.response) {
            responseText = this.formatAIMarkdown(res.response);
          }
        } catch (e) {}
      }
      if (!responseText) {
        responseText = this.generateAIResponse(text);
      }
      typingBubble.remove();
      const botBubble = document.createElement('div');
      botBubble.className = 'chat-bubble assistant';
      botBubble.innerHTML = responseText;
      msgContainer.appendChild(botBubble);
      msgContainer.scrollTop = msgContainer.scrollHeight;
    })();
  }

  generateAIResponse(userInput) {
    const q = userInput.toLowerCase();

    // Coincidencia con FAQs
    const faqMatch = this.faqs.find(f =>
      q.includes(f.q.toLowerCase().substring(0, 15)) ||
      (q.includes('disponible') && f.q.includes('disponible')) ||
      (q.includes('penthouse') && f.q.includes('penthouse')) ||
      (q.includes('requisito') && f.q.includes('requisito')) ||
      (q.includes('agendar') && f.q.includes('agendar'))
    );

    if (faqMatch) {
      return faqMatch.a;
    }

    if (q.includes('precio') || q.includes('cuesta') || q.includes('valor')) {
      return "Los precios de las unidades están sujetos a planes de pago flexibles y financiamiento bancario en Mao. La separación formal se realiza con <strong>US$5,000</strong>. Puedes dejarnos tu número o presionar 'Agendar visita' para recibir la lista de precios oficial.";
    }

    if (q.includes('separación') || q.includes('separar') || q.includes('5000') || q.includes('5,000')) {
      return "El monto formal de separación es de <strong>US$5,000</strong>. Este valor se aplica de forma íntegra a la inicial de tu contrato de compra. Puedes iniciar el proceso desde la ficha de cualquier unidad disponible.";
    }

    if (q.includes('ubicación') || q.includes('donde') || q.includes('mao') || q.includes('llegar')) {
      return "La Torre Residencial Jardines del Cerro IV se encuentra en <strong>Mao, provincia Valverde, República Dominicana</strong>. En una zona residencial exclusiva y de alta plusvalía.";
    }

    if (q.includes('amenidad') || q.includes('piscina') || q.includes('gym') || q.includes('gimnasio') || q.includes('rooftop')) {
      return "La torre cuenta con <strong>11 amenidades exclusivas</strong>: Piscina semi-olímpica, Gimnasio equipado, Terraza Rooftop con vista 360°, Gazebo, Área social, Parrillas BBQ, Elegante Lobby con concierge, Ascensor moderno, Planta eléctrica 24/7, Control de acceso y Cámaras de videovigilancia HD.";
    }

    if (q.includes('alquiler') || q.includes('renta')) {
      return "Disponemos de unidades seleccionadas para modalidad de alquiler (como la Unidad 101 y 301). Los requisitos incluyen comprobantes de ingresos y fiador solidario. ¿Deseas agendar una visita?";
    }

    return "Gracias por tu consulta. En la Torre Residencial <strong>Jardines del Cerro IV</strong> contamos con apartamentos de 120 m² y penthouses de 170 m² con 11 amenidades. ¿Deseas que coordinemos una visita presencial en Mao o una sesión virtual guiada?";
  }

  /* =========================================================================
     Interacción con el Copiloto IA Ejecutivo del Administrador
     ========================================================================= */
  sendAdminAIPrompt(text) {
    const input = document.getElementById('admin-ai-input-field');
    if (input) input.value = text;
    this.handleAdminAISubmit(new Event('submit'));
  }

  async handleAdminAISubmit(e) {
    if (e && e.preventDefault) e.preventDefault();
    const input = document.getElementById('admin-ai-input-field');
    const container = document.getElementById('admin-ai-messages-container');
    if (!input || !container) return;

    const text = input.value.trim();
    if (!text) return;

    // Agregar mensaje del administrador
    const userBubble = document.createElement('div');
    userBubble.className = 'chat-bubble user';
    userBubble.innerText = text;
    container.appendChild(userBubble);
    input.value = '';
    container.scrollTop = container.scrollHeight;

    // Indicador de escribiendo
    const typingBubble = document.createElement('div');
    typingBubble.className = 'chat-bubble assistant';
    typingBubble.style.opacity = '0.7';
    typingBubble.innerText = 'Analizando con Copiloto IA Ejecutivo (Gemini)...';
    container.appendChild(typingBubble);
    container.scrollTop = container.scrollHeight;

    let responseHtml = null;

    // 1. Intentar llamar a Google Gemini vía Backend FastAPI
    if (window.apiClient) {
      try {
        const res = await window.apiClient.chatAI(text, 'admin');
        if (res && res.success && res.response) {
          responseHtml = this.formatAIMarkdown(res.response);
        }
      } catch (err) {
        console.warn('Fallback a motor local de Copiloto IA admin:', err);
      }
    }

    // 2. Motor contextual local garantizado si el backend está offline o sin clave
    if (!responseHtml) {
      responseHtml = this.generateAdminAIResponse(text);
    }

    typingBubble.remove();
    const assistantBubble = document.createElement('div');
    assistantBubble.className = 'chat-bubble assistant';
    assistantBubble.style.maxWidth = '88%';
    assistantBubble.innerHTML = responseHtml;
    container.appendChild(assistantBubble);
    container.scrollTop = container.scrollHeight;
  }

  generateAdminAIResponse(userInput) {
    const q = userInput.toLowerCase();

    if (q.includes('atraso') || q.includes('moros') || q.includes('intimac') || q.includes('cobro') || q.includes('deuda') || q.includes('vencid')) {
      return `
        <div style="font-weight: 700; color: #1E293B; margin-bottom: 6px;">📊 Informe de Morosidad y Borrador de Intimación Legal</div>
        <div>Actualmente se registran <strong>RD$ 19,500.00</strong> en cuotas pendientes acumuladas correspondientes a las unidades <strong>201</strong> y <strong>402</strong> (promedio 1.5 meses de retardo). Se ha computado el recargo por mora del <strong>3% mensual reglamentario</strong> establecido en el Art. 18 del Reglamento de Régimen de Condominio.</div>
        <div style="background: #FFFBEB; border: 1px solid #FCD34D; border-radius: 8px; padding: 12px; margin-top: 10px; font-size: 12px; line-height: 1.5; color: #78350F;">
          <strong>Borrador de Intimación Formal de Pago:</strong><br>
          <em>"Por medio de la presente, la Administración de la Torre Residencial Jardines del Cerro IV notifica al titular de la Unidad [Unidad] que a la fecha adeuda la suma de RD$ [Monto] por concepto de cuotas de mantenimiento condominal vencidas, más recargos por mora. Se le otorga un plazo improrrogable de quince (15) días calendario, conforme al Artículo 16 de la Ley No. 5038 sobre Condominios, para regularizar su balance antes del inicio de acciones judiciales de cobro con hipoteca legal preferente."</em>
        </div>
      `;
    }

    if (q.includes('asamblea') || q.includes('convocatoria') || q.includes('ley 5038') || q.includes('orden del día') || q.includes('quorum') || q.includes('quórum')) {
      return `
        <div style="font-weight: 700; color: #1E293B; margin-bottom: 6px;">🏛️ Borrador Oficial de Convocatoria a Asamblea General Ordinaria (Ley 5038)</div>
        <div style="background: #F8FAFC; border: 1px solid #CBD5E1; border-radius: 8px; padding: 14px; font-size: 12px; line-height: 1.55; color: #1E293B;">
          <div style="text-align: center; font-weight: 800; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 8px;">
            CONSORCIO DE PROPIETARIOS · TORRE RESIDENCIAL JARDINES DEL CERRO IV<br>
            <span style="font-size: 11px; font-weight: 500; color: #64748B;">Mao, Municipio Cabecera, Provincia Valverde</span>
          </div>
          Se convoca a todos los copropietarios a la <strong>Asamblea General Ordinaria Anual 2026</strong>:<br>
          • <strong>Fecha:</strong> Viernes, 15 de Noviembre de 2026.<br>
          • <strong>Hora:</strong> Primera convocatoria 6:30 PM (Quórum legal: 50% + 1 de las alícuotas indivisas) / Segunda convocatoria 7:30 PM (Deliberación válida con los presentes).<br>
          • <strong>Lugar:</strong> Salón Multiusos / Área Social Rooftop Piso 9.<br><br>
          <strong>ORDEN DEL DÍA PROPUESTO:</strong><br>
          1. Verificación de quórum reglamentario y acreditación de poderes de representación.<br>
          2. Presentación y aprobación del informe financiero de ingresos y egresos 2025-2026.<br>
          3. Ratificación del Fondo de Reserva para mantenimiento mayor.<br>
          4. Votación para la instalación de sistema de energía solar fotovoltaica para áreas comunes.<br>
          5. Elección de la Junta de Directores del Consorcio para el período 2026-2027.
        </div>
      `;
    }

    if (q.includes('planta') || q.includes('generador') || q.includes('otis') || q.includes('ascensor') || q.includes('equipo') || q.includes('combustible')) {
      return `
        <div style="font-weight: 700; color: #1E293B; margin-bottom: 6px;">⚙️ Telemetría y Diagnóstico Predictivo de Equipos Críticos</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px;">
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 12px; font-size: 11.5px; line-height: 1.45;">
            <div style="font-weight: 700; color: #166534; margin-bottom: 4px;">⚡ Generador Cummins 150 kVA</div>
            • <strong>Tanque de Diésel:</strong> 85% de capacidad (~34 hrs continuas de autonomía).<br>
            • <strong>Horómetro:</strong> 412 horas acumuladas.<br>
            • <strong>Próximo servicio:</strong> En 38 horas operativas (Cambio de aceite 15W40 y filtros primarios de combustible). Proveedor: <em>Diésel del Norte</em>.
          </div>
          <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 12px; font-size: 11.5px; line-height: 1.45;">
            <div style="font-weight: 700; color: #1E40AF; margin-bottom: 4px;">🛗 Ascensor Camillero Otis Gen2</div>
            • <strong>Inspección reciente:</strong> 28 de Septiembre 2026 (Otis Dominicana).<br>
            • <strong>Estado de tracción:</strong> Cintas de acero poliuretánico y frenos sin desgaste anómalo.<br>
            • <strong>Próxima visita técnica:</strong> 28 de Octubre 2026 (Mantenimiento preventivo mensual según contrato).
          </div>
        </div>
      `;
    }

    if (q.includes('reserva') || q.includes('fondo') || q.includes('finanz') || q.includes('liquidez') || q.includes('presupuesto') || q.includes('recaud')) {
      return `
        <div style="font-weight: 700; color: #1E293B; margin-bottom: 6px;">💰 Auditoría del Fondo de Reserva & Salud Financiera</div>
        <div>• <strong>Balance del Fondo de Reserva:</strong> <strong>RD$ 2,340,000.00</strong> depositados en cuenta de alto rendimiento con devengo de intereses.<br>
        • <strong>Recaudo mensual promedio:</strong> RD$ 247,000.00 (Efectividad promedio: 94.2%).<br>
        • <strong>Cobertura operativa:</strong> El fondo actual cubre <strong>9.4 meses de operación fija</strong> de la Torre sin aportes extraordinarios.<br>
        • <strong>Recomendación gerencial:</strong> Se recomienda mantener la provisión del 5% del flujo mensual para fondear la impermeabilización de techos programada para el próximo verano.</div>
      `;
    }

    if (q.includes('mascota') || q.includes('ruido') || q.includes('circular') || q.includes('convivencia') || q.includes('comunicado')) {
      return `
        <div style="font-weight: 700; color: #1E293B; margin-bottom: 6px;">📢 Borrador de Circular Administrativa para Residentes</div>
        <div style="background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 8px; padding: 12px; font-size: 12px; line-height: 1.5; color: #334155;">
          <strong>CIRCULAR NO. 2026-014 · ADMINISTRACIÓN JARDINES DEL CERRO IV</strong><br><br>
          <em>"Estimados Condóminos y Residentes:<br>
          Con el objetivo de preservar la armonía y la plusvalía de nuestra comunidad, recordamos las siguientes directrices vigentes:<br>
          1. <strong>Mascotas:</strong> Deben transitar sujetas con correa en todas las áreas comunes (pasillos, vestíbulo, ascensores y áreas verdes) y acompañadas en todo momento por un adulto.<br>
          2. <strong>Control Acústico y Convivencia:</strong> El horario de descanso y silencio rige a partir de las 10:00 PM de domingo a jueves, y a partir de las 12:00 AM los fines de semana.<br>
          3. <strong>Disposición de Desechos:</strong> Utilizar las compuertas del bajante de basura únicamente con bolsas herméticamente cerradas.<br>
          Agradecemos su valiosa cooperación."</em>
        </div>
      `;
    }

    return `
      <div>Comprendido, Administrador. Como su <strong>Copiloto IA Ejecutivo</strong>, tengo conectividad completa con los módulos contables, operativos y legales de la <strong>Torre Residencial Jardines del Cerro IV</strong>. Puedo generar informes de morosidad con cálculo de mora y cartas de intimación, redactar convocatorias notariales conforme a la Ley 5038, diagnosticar el mantenimiento predictivo de la planta eléctrica y elevador Otis, o auditar el Fondo de Reserva. ¿En cuál de estos aspectos desea profundizar?</div>
    `;
  }

  /* =========================================================================
     Utilidades
     ========================================================================= */
  showToast(message) {
    const toast = document.getElementById('toast-notification');
    const msgEl = document.getElementById('toast-message');
    if (toast && msgEl) {
      msgEl.innerText = message;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 3500);
    }
  }

  openWhatsApp(customText = '') {
    const phone = '18095550140';
    const text = encodeURIComponent(customText || 'Hola, me comunico desde la página web de Jardines del Cerro IV.');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  }
}

// Inicialización automática al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  window.app = new JardinesApp();
});
