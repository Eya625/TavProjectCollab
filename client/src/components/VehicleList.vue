<template>
  <div class="vehicle-container">
    <!-- notification -->
    <div
      v-if="showSuccessNotification"
      :class="['notification', notificationType]"
      class="top-notif"
    >
      {{ notificationMessage }}
    </div>

    <h2 class="title">Liste des Véhicules</h2>

    <div class="header-bar">
      <input
        type="text"
        v-model="search"
        placeholder="Recherche..."
        class="search-input"
      />
    </div>

    <table class="vehicle-table">
      <thead>
        <tr>
          <th>N°</th>
          <th>Affecté à</th>
          <th>Branche</th>
          <th>Modèle</th>
          <th>Année</th>
          <th>Date 1re Immat.</th>
          <th>Immatriculation</th>
          <th>Affectation</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="vehicle in paginatedVehicles" :key="vehicle._id">
          <td>{{ vehicle.N }}</td>
          <td>{{ vehicle.assignedTo }}</td>
          <td>{{ vehicle.Brunch }}</td>
          <td>{{ vehicle.model }}</td>
          <td>{{ vehicle.year }}</td>
          <td>{{ formatDate(vehicle.dateOf1stRegistration) }}</td>
          <td>{{ normalizeImmat(vehicle.registrationNumber) }}</td>
          <td>{{ vehicle.allocation }}</td>
          <td>
            <button class="btn-invoice" @click="showInvoices(vehicle)">
              <i class="fas fa-file-invoice-dollar"></i> Voir Factures
            </button>
            <button class="btn-delete" @click="$emit('deleteVehicle', vehicle._id)">
              <i class="fas fa-trash-alt"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <transition name="slide-drawer">
      <div class="invoice-drawer" v-if="selectedVehicle">
        <div class="drawer-header">
          <h3>
            <i class="fas fa-receipt"></i>
            Factures de {{ selectedVehicle.model }}
            ({{ normalizeImmat(selectedVehicle.registrationNumber) }})
            <span v-if="invoiceSaved" class="green-dot"></span>
          </h3>
          <button class="close-btn" @click="closeDrawer">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="upload-section">
          <label class="upload-btn" for="fileInput">
            <i class="fas fa-upload"></i>
            <span>Téléverser une facture</span>
          </label>
          <input
            id="fileInput"
            ref="fileInput"
            type="file"
            accept="application/pdf"
            @change="handleFileChange"
            style="display: none"
          />
          <transition name="bounce">
            <div v-if="uploading" class="uploading-indicator">Chargement...</div>
          </transition>
        </div>

        <div class="invoice-list">
          <div v-if="selectedVehicle.invoices.length" class="cards-grid">
            <div
              v-for="invoice in selectedVehicle.invoices"
              :key="invoice._id"
              class="invoice-card"
            >
              <div class="card-header">
                <span class="invoice-ref"><i class="fas fa-hashtag"></i> {{ invoice.Ref }}</span>
                <span class="invoice-date"><i class="fas fa-calendar-alt"></i> {{ formatDate(invoice.Date) }}</span>
              </div>
              <div class="card-body">
                <div class="card-field"><strong><i class="fas fa-car-side"></i> Type:</strong> {{ invoice.Type }}</div>
                <div class="card-field"><strong><i class="fas fa-coins"></i> Montant:</strong> {{ invoice.Montant }} TND</div>
              </div>
              <div class="card-footer">
                <a v-if="invoice.pdfUrl" :href="invoice.pdfUrl" target="_blank" class="btn btn-view">
                  <i class="fas fa-file-pdf"></i> Ouvrir PDF
                </a>
                <button v-else @click="previewInvoice(invoice)" class="btn btn-preview">
                  <i class="fas fa-eye"></i> Prévisualiser
                </button>
              </div>
            </div>
          </div>
          <div v-else class="no-invoices">
            <p><i class="fas fa-exclamation-circle"></i> Aucune facture disponible pour ce véhicule.</p>
          </div>
        </div>

        <div v-if="selectedInvoice" class="pdf-preview">
          <button class="close-preview" @click="closePreview">
            <i class="fas fa-arrow-left"></i> Fermer aperçu
          </button>
          <embed :src="selectedInvoice.pdfUrl" type="application/pdf" width="100%" height="400px" />
        </div>
      </div>
    </transition>

    <div class="pagination">
      <button :disabled="currentPage === 1" @click="currentPage--"><i class="fas fa-chevron-left"></i></button>
      <span>Page {{ currentPage }} / {{ totalPages }}</span>
      <button :disabled="currentPage === totalPages" @click="currentPage++"><i class="fas fa-chevron-right"></i></button>
    </div>
  </div>
</template>
<script>
import { normalizeImmat } from '../utils/format';
import apiServices from '../services/apiServices';

export default {
  name: 'VehicleList',
  props: {
    vehicles: { type: Array, required: true }
  },
  data() {
    return {
      search: '',
      currentPage: 1,
      perPage: 5,
      selectedVehicle: null,
      selectedInvoice: null,
      uploading: false,
      invoiceSaved: false,
      showSuccessNotification: false,
      notificationMessage: '',
      notificationType: ''    // 'success' ou 'error'
    };
  },
  computed: {
    filteredVehicles() {
      const term = this.search.toLowerCase();
      return this.vehicles.filter(v =>
        Object.values(v).some(val =>
          val != null && val.toString().toLowerCase().includes(term)
        )
      );
    },
    paginatedVehicles() {
      const start = (this.currentPage - 1) * this.perPage;
      return this.filteredVehicles.slice(start, start + this.perPage);
    },
    totalPages() {
      return Math.ceil(this.filteredVehicles.length / this.perPage);
    }
  },
  methods: {
    normalizeImmat,
    formatDate(date) {
      return new Date(date).toLocaleDateString('fr-FR', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    },
    showNotification(message, type = 'success') {
      this.notificationMessage = message;
      this.notificationType = type;
      this.showSuccessNotification = true;
      setTimeout(() => {
        this.showSuccessNotification = false;
      }, 3000);
    },
    async showInvoices(vehicle) {
      const immat = normalizeImmat(vehicle.registrationNumber);
      try {
        const res = await apiServices.getInvoicesByImmat(immat);
        let invoices = Array.isArray(res.data) ? res.data : [];
        invoices = invoices.filter(inv =>
          normalizeImmat(inv.Immatriculation) === immat
        );
        invoices = await Promise.all(
          invoices.map(async inv => ({
            ...inv,
            pdfUrl: await apiServices.getVehicleInvoicePdfUrl(inv._id)
          }))
        );
        this.selectedVehicle = { ...vehicle, invoices };
      } catch (err) {
        console.error(err);
        this.selectedVehicle = { ...vehicle, invoices: [] };
        this.showNotification('Erreur lors du chargement des factures.', 'error');
      }
      this.selectedInvoice = null;
      this.invoiceSaved = false;
    },
    closeDrawer() {
      this.selectedVehicle = null;
      this.selectedInvoice = null;
      this.invoiceSaved = false;
    },
    previewInvoice(inv) {
      this.selectedInvoice = inv;
    },
    closePreview() {
      this.selectedInvoice = null;
    },
    async handleFileChange(event) {
      const file = event.target.files[0];
      if (!file || !this.selectedVehicle) return;

      const expectedImmat = normalizeImmat(this.selectedVehicle.registrationNumber);

      this.uploading = true;
      try {
        const formData = new FormData();
        formData.append('pdf', file);
        // on envoie quand même l’immat au back pour extraction si besoin
        formData.append('immatriculation', expectedImmat);

        // 1) Upload + extraction
        const uploadRes = await apiServices.uploadVehicleInvoice(formData);
        if (!uploadRes.success) {
          this.showNotification('Échec du téléversement de la facture', 'error');
          return;
        }

        // Extrait par le back-end
        const extracted = uploadRes.data;
        const extractedImmat = normalizeImmat(extracted.Immatriculation || '');

        // 2) TEST D’IMMATRICULATION
        if (extractedImmat !== expectedImmat) {
          this.showNotification(
            `Immatriculation extraite (${extractedImmat}) ne correspond pas à ${expectedImmat}.`,
            'error'
          );
          return;
        }

        // 3) TEST D’UNICITÉ DE LA RÉFÉRENCE
        const newRef = extracted.Ref;
        if (this.selectedVehicle.invoices.some(inv => inv.Ref === newRef)) {
          this.showNotification(`La référence ${newRef} existe déjà.`, 'error');
          return;
        }

        // 4) Enregistrement en base
        const invoiceData = {
          Ref:             extracted.Ref,
          Date:            extracted.Date,
          Type:            extracted.Type,
          Montant:         extracted.Montant,
          Immatriculation: extractedImmat
        };
        const registerRes = await apiServices.registerVehicleInvoice(invoiceData);
        if (!registerRes.invoice) {
          this.showNotification('Échec de l’enregistrement de la facture', 'error');
          return;
        }

        // 5) Rechargement des factures
        await this.showInvoices(this.selectedVehicle);
        this.invoiceSaved = true;
        this.showNotification('Facture enregistrée avec succès', 'success');

      } catch (err) {
        console.error(err);
        this.showNotification('Une erreur est survenue lors de l’enregistrement.', 'error');
      } finally {
        this.uploading = false;
      }
    }
  }
};
</script>



<style scoped>
/* Container */
.vehicle-container {
  padding: 20px;
  background: #f7f9fc;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  font-family: 'Segoe UI', Tahoma, Verdana, sans-serif;
  position: relative;    /* créer un nouveau contexte de positionnement */
  overflow: visible; 
}
.title {
  font-size: 1.75rem;
  margin-bottom: 16px;
  color: #333;
}
.header-bar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
.search-input {
  padding: 8px 12px;
  font-size: 0.9rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 200px;
  transition: border-color 0.2s;
}
.search-input:focus {
  outline: none;
  border-color: #007bff;
}

/* Table */
.vehicle-table {
  width: 100%;
  border-collapse: collapse;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}
.vehicle-table th,
.vehicle-table td {
  padding: 12px 8px;
  text-align: left;
}
.vehicle-table thead {
  background: #007bff;
  color: #fff;
}
.vehicle-table tbody tr {
  border-bottom: 1px solid #e0e0e0;
}
.vehicle-table tbody tr:nth-child(even) {
  background: #f5f8fa;
}
.vehicle-table tbody tr:hover {
  background: #e9f5ff;
}

/* Action Buttons in table */
.vehicle-table .btn-invoice,
.vehicle-table .btn-delete {
  padding: 4px 8px;
  font-size: 0.8rem;
  border-radius: 4px;
  margin-right: 4px;
}
.vehicle-table .btn-invoice {
  background: #1953e6;
  color: #fff;
}
.vehicle-table .btn-invoice:hover {
  background: #020a84;
}
.vehicle-table .btn-delete {
  background: #dc3545;
  color: #fff;
}
.vehicle-table .btn-delete:hover {
  background: #c82333;
}

/* Drawer */
.invoice-drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh; /* hauteur limitée à la fenêtre */
  background-color: #fff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  overflow-y: auto; /* active le scroll vertical si le contenu dépasse */
  z-index: 1000;
  padding: 20px;
  scroll-behavior: smooth;
  scrollbar-width: thin;
}
.invoice-drawer::-webkit-scrollbar {
  width: 6px;
}

.invoice-drawer::-webkit-scrollbar-thumb {
  background-color: #aaa;
  border-radius: 3px;
}



.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.drawer-header h3 {
  font-size: 1.25rem;
  color: #007bff;
}
.close-btn {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  color: #999;
  cursor: pointer;
}
.close-btn:hover {
  color: #333;
}

/* Invoice Cards */
.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  flex-grow: 1;
  overflow-y: auto;
}
.invoice-card {
  background: #f7f9fc;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  transition: background 0.2s;
}
.invoice-card:hover {
  background: #eef7ff;
}
.card-header,
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-header {
  margin-bottom: 8px;
}
.invoice-ref,
.invoice-date {
  font-size: 0.9rem;
  color: #333;
}
.invoice-date {
  color: #666;
}
.card-body {
  margin-bottom: 8px;
}
.card-field {
  font-size: 0.85rem;
  color: #444;
  margin-bottom: 4px;
}

/* Card buttons */
.card-footer .btn-view,
.card-footer .btn-preview {
  padding: 6px 10px;
  font-size: 0.85rem;
  border-radius: 4px;
}
.card-footer .btn-view {
  background: #007bff;
  color: #fff;
}
.card-footer .btn-view:hover {
  background: #0056b3;
}
.card-footer .btn-preview {
  background: #17a2b8;
  color: #fff;
}
.card-footer .btn-preview:hover {
  background: #117a8b;
}

/* No invoices */
.no-invoices p {
  text-align: center;
  color: #888;
  font-size: 0.9rem;
}

/* PDF preview */
.pdf-preview {
  margin-top: 16px;
  border-top: 1px solid #ddd;
  padding-top: 16px;
}
.close-preview {
  background: transparent;
  border: none;
  color: #007bff;
  cursor: pointer;
  margin-bottom: 8px;
  font-size: 1rem;
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 16px;
}
.pagination button {
  background: #007bff;
  color: #fff;
  border: none;
  padding: 6px 10px;
  margin: 0 4px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}
.pagination button:disabled {
  background: #ccc;
  cursor: default;
}
.pagination span {
  margin: 0 8px;
  font-size: 0.9rem;
  color: #333;
}
/* Remplacez vos règles slide-drawer précédentes par celles-ci */

/* Animation d'entrée et de sortie */
.slide-drawer-enter-active,
.slide-drawer-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1); /* effet plus naturel */
}

.slide-drawer-enter {
  opacity: 0;
  transform: translateY(30px) scale(0.97); /* léger zoom arrière et translation */
}

.slide-drawer-enter-to {
  opacity: 1;
  transform: translateY(0) scale(1); /* zoom et position normale */
}

.slide-drawer-leave {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.slide-drawer-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.97); /* effet inverse pour fermeture */
}
.upload-section {
  margin: 1rem 0;
  display: flex;
  align-items: center;
}
.upload-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  background: linear-gradient(45deg, #6b8cff, #88e7fe);
  border-radius: 1.5rem;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s;
}
.upload-btn:hover {
  transform: scale(1.05) rotate(-1deg);
}
.upload-btn i {
  margin-right: 0.5rem;
}
.uploading-indicator {
  margin-left: 1rem;
  font-style: italic;
}
/* Animation bounce */
.bounce-enter-active,
.bounce-leave-active {
  animation: bounce 0.5s;
}
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Green Dot Notification */

.green-dot {
  display: inline-block;
  width: 0.6em;
  height: 0.6em;
  background-color: #28a745;
  border-radius: 50%;
  margin-left: 0.4em;
  /* petite pulsation pour attirer l’œil */
  animation: pulse-dot 1.2s ease-out infinite;
}

/* keyframes de pulsation */
@keyframes pulse-dot {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.6;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
.notification {
  position: fixed;
  top: 80px; right: 20px;
  padding: 10px 20px;
  border-radius: 4px;
  color: #fff;
  z-index: 9999;
}
.notification.success { background: #28a745; }
.notification.error   { background: #e74c3c; }
.toast-notification {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #4caf50;
  color: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  font-weight: bold;
  z-index: 9999;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

</style>
