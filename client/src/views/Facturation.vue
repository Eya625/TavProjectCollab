<template>
  <VehicleNavbar />

  <div class="facturation-container">
    <h1 class="page-title">Gestion des factures</h1>

    <!-- 1) Upload & extraction -->
    <section class="upload-section">
      <div class="section-header">
        <h2>Importer une facture PDF</h2>
      </div>

      <div class="file-input-group">
        <label for="pdf-upload" class="sr-only">Sélectionner un fichier PDF</label>
        <input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          @change="onFileChange"
          class="file-input"
        />
        <button
          :disabled="!pdfFile || loading.upload"
          @click="doUpload"
          class="btn btn-primary"
        >
          {{ loading.upload ? 'Extraction en cours…' : 'Extraire & Prévisualiser' }}
        </button>
      </div>
      <p v-if="error.upload" class="error-message">{{ error.upload }}</p>

      <!-- Aperçu des données extraites -->
      <div v-if="extracted" class="data-preview">
        <h3 class="preview-title">Données extraites</h3>
        <p class="info-message">Méthode d’extraction : {{ extracted.extractor }}</p>
        <ul>
          <li class="detail-item">
            <span class="label">Référence :</span>
            <span class="value">{{ displayField(extracted.Ref) }}</span>
          </li>
          <li class="detail-item">
            <span class="label">Date :</span>
            <span class="value">{{ displayField(extracted.Date) }}</span>
          </li>
          <li class="detail-item">
            <span class="label">Immatriculation :</span>
            <template v-if="!fallbackMode">
              <span class="value">{{ displayField(extracted.Immatriculation) }}</span>
            </template>
            <template v-else>
              <select v-model="extracted.Immatriculation" class="value">
                <option disabled value="">-- Sélectionnez une immatriculation --</option>
                <option
                  v-for="option in vehicleOptions"
                  :key="option.Immatriculation"
                  :value="option.Immatriculation"
                >
                  {{ option.Immatriculation }}
                </option>
              </select>
            </template>
          </li>
          <li class="detail-item">
            <span class="label">Véhicule :</span>
            <template v-if="!fallbackMode">
              <span class="value">{{ displayField(extracted.Type) }}</span>
            </template>
            <template v-else>
              <input type="text" class="value" v-model="extracted.Type" disabled />
            </template>
          </li>
          <li class="detail-item">
            <span class="label">Total TTC :</span>
            <span class="value">{{ displayField(extracted.Montant) }}</span>
          </li>
          <li class="detail-item">
            <span class="label">Statut :</span>
            <select v-model="extracted.statut" class="value">
              <option value="non payé">Non payé</option>
              <option value="payé">Payé</option>
              <option value="partiellement payé">Partiellement payé</option>
            </select>
          </li>
        </ul>
        <div class="actions">
          <button
            :disabled="loading.register"
            @click="doRegister"
            class="btn btn-primary"
          >
            {{ loading.register ? 'Enregistrement…' : 'Enregistrer en BDD' }}
          </button>
          <p v-if="error.register" class="error-message">{{ error.register }}</p>
        </div>
      </div>
    </section>

    <!-- 2) Liste des factures -->
    <section class="list-section">
      <div class="section-header">
        <h2>Factures enregistrées</h2>
        <button @click="fetchInvoices" class="btn btn-secondary">Rafraîchir la liste</button>
      </div>

      <p v-if="loading.list" class="info-message">Chargement…</p>
      <p v-if="error.list" class="error-message">{{ error.list }}</p>

      <table v-if="invoices.length" class="invoice-table">
        <thead>
          <tr class="table-head-row">
            <th>Référence</th>
            <th>Date</th>
            <th>Type de véhicule</th>
            <th>Immatriculation</th>
            <th>Statut</th>
            <th>Total TTC</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="inv in pagedInvoices"
            :key="inv._id"
            class="table-body-row"
            style="cursor: pointer"
            @click="openInvoicePdf(inv)"
          >
            <td>{{ inv.Ref }}</td>
            <td>{{ formatDate(inv.Date) }}</td>
            <td>{{ inv.Type }}</td>
            <td>{{ inv.Immatriculation || 'N/A' }}</td>
            <td>{{ inv.statut }}</td>
            <td>{{ inv.Montant }}</td>
          </tr>
        </tbody>
      </table>

      <div class="pagination-controls" v-if="totalPages > 1">
        <button :disabled="currentPage === 1" @click="currentPage--" class="btn btn-secondary">
          « Précédent
        </button>
        <span>Page {{ currentPage }} / {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" @click="currentPage++" class="btn btn-secondary">
          Suivant »
        </button>
      </div>

      <p v-else class="empty-message">Aucune facture enregistrée.</p>
      <p v-if="errorPdf" class="error-message">{{ errorPdf }}</p>
    </section>

    <!-- Modal PDF (overlay) -->
    <div v-if="showPdfModal" class="modal-overlay" @click.self="closePdfModal">
      <div class="modal-container">
        <button class="modal-close" @click="closePdfModal">×</button>
        <iframe v-if="currentPdfUrl" :src="currentPdfUrl" frameborder="0" class="pdf-frame"></iframe>
      </div>
    </div>
  </div>
</template>

<script>
import apiServices from '../services/apiServices';
import VehicleNavbar from '../components/VehicleNavbar.vue';

export default {
  name: 'Facturation',
  components: { VehicleNavbar },
  data() {
    return {
      pdfFile: null,
      extracted: null,
      currentPage: 1,
      pageSize: 5,
      fallbackMode: false,
      vehicleOptions: [],
      invoices: [],
      loading: { upload: false, register: false, list: false },
      error: { upload: '', register: '', list: '' },
      showPdfModal: false,
      currentPdfUrl: null,
      errorPdf: ''
    };
  },
  mounted() {
    this.fetchInvoices();
  },
  computed: {
    totalPages() {
      return Math.ceil(this.invoices.length / this.pageSize);
    },
    pagedInvoices() {
      const start = (this.currentPage - 1) * this.pageSize;
      return this.invoices.slice(start, start + this.pageSize);
    }
  },
  methods: {
    displayField(value) {
      return value ?? 'N/A';
    },
    onFileChange(e) {
      const file = e.target.files[0];
      if (file && !file.type.includes('pdf')) {
        this.error.upload = 'Le fichier doit être un PDF.';
        this.pdfFile = null;
        return;
      }
      this.pdfFile = file;
      this.extracted = null;
      this.error.upload = '';
    },
    async doUpload() {
      if (!this.pdfFile) return;
      this.loading.upload = true;
      this.fallbackMode = false;
      try {
        const form = new FormData();
        form.append('pdf', this.pdfFile);
        const result = await apiServices.uploadVehicleInvoice(form);
        if (!result.success) throw new Error(result.message);
        this.extracted = result.data;
        if (!this.extracted.Immatriculation || !this.extracted.Type) {
          this.fallbackMode = true;
          await this.fetchVehicleOptions();
        }
      } catch (err) {
        this.error.upload = err.message || 'Impossible d’extraire la facture.';
      } finally {
        this.loading.upload = false;
      }
    },
    async fetchVehicleOptions() {
      try {
        const list = await apiServices.getVehicleList();
        this.vehicleOptions = Array.isArray(list) ? list : [];
      } catch (err) {
        console.error('Erreur lors du chargement des véhicules.', err);
      }
    },
    async doRegister() {
      if (!this.extracted?.Montant || !this.extracted?.Ref) {
        this.error.register = 'Certains champs sont manquants';
        return;
      }
      this.loading.register = true;
      try {
        await apiServices.registerVehicleInvoice({ data: this.extracted });
        this.error.register = '';
        this.extracted = null;
        this.currentPage = 1;
        await this.fetchInvoices();
      } catch (err) {
        this.error.register =
          err.response?.status === 409
            ? 'Une facture avec cette référence existe déjà.'
            : 'Échec de l’enregistrement en base.';
      } finally {
        this.loading.register = false;
      }
    },
    async fetchInvoices() {
      this.loading.list = true;
      try {
        const list = await apiServices.getVehicleInvoices();
        this.invoices = Array.isArray(list) ? list : [];
      } catch (err) {
        this.error.list = 'Impossible de récupérer la liste.';
      } finally {
        this.loading.list = false;
      }
    },
    formatDate(dateStr) {
      const d = new Date(dateStr);
      return isNaN(d) ? dateStr : d.toLocaleDateString('fr-FR');
    },
    async openInvoicePdf(inv) {
      this.errorPdf = '';
      try {
        this.currentPdfUrl = await apiServices.getVehicleInvoicePdfUrl(inv._id);
        this.showPdfModal = true;
      } catch {
        this.errorPdf = 'Impossible de charger l’URL du PDF.';
      }
    },
    closePdfModal() {
      URL.revokeObjectURL(this.currentPdfUrl);
      this.showPdfModal = false;
    }
  },
  watch: {
    'extracted.Immatriculation'(newVal) {
      if (this.fallbackMode) {
        const sel = this.vehicleOptions.find(v => v.Immatriculation === newVal);
        if (sel) this.extracted.Type = sel.Type;
      }
    }
  }
};
</script>
<style scoped>
/* Container principal */
.facturation-container {
  max-width: 48rem;
  margin: 2rem auto;
  font-family: 'Inter', sans-serif;
  color: #2d3748;
  line-height: 1.5;
}

/* Titre de la page avec texte en dégradé */
.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
  background: linear-gradient(90deg, #667eea, #764ba2);
  background-clip: text;
  /* standard */
  -webkit-background-clip: text;
  /* Safari/Chrome */
  -webkit-text-fill-color: transparent;
}

/* Sections “cards” avec ombre et animation d’apparition */
.upload-section,
.list-section {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 2rem;
  opacity: 0;
  animation: fadeInUp 0.6s ease forwards;
}

.facturation-container section:nth-of-type(1) {
  animation-delay: 0.1s;
}

.facturation-container section:nth-of-type(2) {
  animation-delay: 0.2s;
}

/* En‑têtes de section */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
}

/* Groupe input + bouton */
.file-input-group {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.5rem;
}

/* Input PDF stylé “drag & drop” */
.file-input {
  flex: 1;
  padding: 1rem;
  border: 2px dashed #a0aec0;
  border-radius: 8px;
  background: rgba(160, 174, 192, 0.1);
  cursor: pointer;
  transition:
    background 0.3s,
    border-color 0.3s;
}

.file-input:hover {
  background: rgba(160, 174, 192, 0.2);
  border-color: #718096;
}

/* Boutons principaux et secondaires */
.btn-primary {
  position: relative;
  overflow: hidden;
  padding: 0.6rem 1.2rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #4f46e5, #3b82f6);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  color: #fff;
  cursor: pointer;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.btn-primary::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: rgba(255, 255, 255, 0.15);
  transform: rotate(45deg) translate(-100%, -100%);
  transition: transform 0.5s;
}

.btn-primary:hover::before {
  transform: rotate(45deg) translate(0, 0);
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.6);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.btn-secondary {
  padding: 0.5rem 1rem;
  font-weight: 600;
  border: 2px solid #3b82f6;
  border-radius: 8px;
  background: #fff;
  color: #3b82f6;
  cursor: pointer;
  transition:
    background 0.3s,
    color 0.3s;
}

.btn-secondary:hover {
  background: #3b82f6;
  color: #fff;
}

/* Aperçu des données extraites */
.data-preview {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
  margin-top: 1rem;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.preview-title {
  font-weight: 600;
  margin-bottom: 0.75rem;
}

/* Liste de détails en grille */
.details-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.detail-item {
  display: flex;
}

.detail-item .label {
  font-weight: 600;
  margin-right: 0.5rem;
}

.detail-item .value {
  flex: 1;
}

/* Actions (bouton Enregistrer) */
.actions {
  margin-top: 1rem;
  text-align: right;
}

/* Messages d’état */
.info-message {
  color: #4a5568;
  font-style: italic;
  margin: 0.5rem 0;
}

.error-message {
  color: #e53e3e;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.empty-message {
  color: #718096;
  text-align: center;
  margin-top: 1rem;
}

/* Tableau des factures */
.invoice-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border-radius: 12px;
  overflow: hidden;
  margin-top: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.invoice-table th,
.invoice-table td {
  padding: 0.75rem;
  text-align: left;
}

.table-head-row th {
  background: #434190;
  color: #fff;
  text-transform: uppercase;
  font-size: 0.875rem;
  letter-spacing: 0.05em;
}

.invoice-table tbody tr:nth-child(odd) {
  background: #edf2f7;
}

.invoice-table tbody tr {
  transition:
    transform 0.2s,
    background 0.2s;
  cursor: pointer;
}

.invoice-table tbody tr:hover {
  transform: translateX(8px);
  background: #e2e8f0;
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  position: relative;
  width: 80%;
  max-width: 900px;
  height: 90%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  animation: zoomIn 0.3s ease-out;
}

.modal-close {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 1.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 1001;
}

.pdf-frame {
  width: 100%;
  height: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes zoomIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
