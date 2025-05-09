<template>
  <div class="dashboard-container">
    <div class="sidebar">
      <NavBar />
    </div>

    <div class="content">
      <!-- Header with Icons, Title, and Controls -->
      <div class="header">
        <div class="header-title">
          <h1>Billing Section</h1>
          <p>Your financial insights, one click away!</p>
        </div>

        <div class="header-right">
          <router-link to="/notifications">
            <font-awesome-icon icon="fa-bell" class="icon" />
          </router-link>
          <router-link to="/">
            <font-awesome-icon icon="fa-sign-out-alt" class="icon" />
          </router-link>
        </div>
      </div>

      <!-- Notification Toast -->
      <transition name="fade">
        <div v-if="successMessage" class="toast-message">
          {{ successMessage }}
        </div>
      </transition>
      <!-- Modal for Adding and Editing Invoices -->
      <InvoiceForm ref="InvoiceForm" v-if="showAddModal || showEditModal" :showModal="showAddModal || showEditModal"
        :isEditMode="showEditModal" :invoice="editedInvoice" @close="closeModal" @save="saveInvoice"
        @update-totals="updateParentTotals" />

      <br>
      <br>

      <div class="header-controls">
        <input v-model="searchQuery" type="text" placeholder="Search by Details..." class="search-input" />
        <button @click="openAddModal" class="add-btn">Add Invoice</button>
      </div>
      <br><br><br>

      <div class="table-header">
        <table class="data-table">
          <thead>
            <tr>
              <th @click="sortTable('invoiceType')">Invoice Details</th>
              <th @click="sortTable('month')">Month</th>
              <th @click="sortTable('grandTotal')">Grand Total</th>
              <th @click="sortTable('stampTax')">Stamp Tax</th>
              <th @click="sortTable('totalWithTax')">Total with Tax</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="invoice in paginatedInvoices" :key="invoice._id">
              <td>{{ invoice.invoiceType }}</td>
              <td>{{ invoice.month }}</td>
              <td>{{ invoice.grandTotal }}</td>
              <td>{{ invoice.stampTax }}</td>
              <td>{{ invoice.totalWithTax }}</td>
              <td class="action-buttons">
                <button class="update-btn" @click.stop="editInvoice(invoice)">Update</button>
                <button class="delete-btn" @click.stop="deleteInvoice(invoice._id)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- Confirmation Banner with Undo -->
      <div v-if="showUndo" class="undo-banner">
        <p>Deletion in progress...
          <button @click="undoDelete">Undo</button>
        </p>
      </div>

      <div class="pagination">
        <button class="btn-prev" @click="prevPage" :disabled="currentPage === 1"><i
            class="fas fa-chevron-left"></i>Previous</button>
        <span>Page {{ currentPage }} of {{ totalPages }}</span>
        <button class="btn-next" @click="nextPage" :disabled="currentPage === totalPages">Next <i
            class="fas fa-chevron-right"></i></button>
      </div>


      <!-- New PDF Upload Section -->
      <div class="upload-section">
        <h2>Upload PDF Invoices</h2>
        <input type="file" accept="application/pdf" @change="onFileSelected" ref="pdfInput" />
        <button @click="uploadPdf" :disabled="!selectedFile">
          Upload
        </button>
        <p v-if="successMessage" class="success">{{ successMessage }}</p>
      </div>

      <!-- PDF Table -->
      <table class="data-table" v-if="uploadedPDFs.length">
        <thead>
          <tr>
            <th>File Name</th>
            <th>Upload Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="pdf in uploadedPDFs" :key="pdf._id">
            <td>{{ pdf.filename }}</td>
            <td>{{ new Date(pdf.uploadedAt).toLocaleDateString() }}</td>
            <td>
              <button class="view-btn" @click="viewPDF(pdf)">See Details</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!uploadedPDFs.length">Aucune facture pour l’instant.</p>

      <!-- Modal Viewer -->
      <div v-if="pdfDetailUrl" class="pdf-modal">
        <div class="modal-content">
          <button class="close-btn" @click="pdfDetailUrl = null">Close</button>
          <iframe :src="pdfDetailUrl" width="100%" height="600px"></iframe>
        </div>
      </div>
    </div>
  </div>
  <div v-if="pdfDetailUrl" class="modal-overlay" @click.self="pdfDetailUrl = null">
  <div class="modal-box">
    <button class="modal-close" @click="pdfDetailUrl = null">×</button>
    <iframe 
      :src="pdfDetailUrl" 
      class="modal-iframe" 
      frameborder="0"
    ></iframe>
  </div>
</div>
</template>
<script>
import apiServices from "../services/apiServices";
import NavBar from "../components/NavBar";
import InvoiceForm from "../components/InvoiceForm";

export default {
  components: {
    NavBar,
    InvoiceForm,
  },
  data() {
    return {
      invoices: [],
      showAddModal: false,
      showEditModal: false,
      editedInvoice: {},
      currentPage: 1,
      itemsPerPage: 5,
      searchQuery: "",
      successMessage: "",
      showUndo: false,
      lastDeletedItem: null,
      lastDeletedIndex: null,
      deleteTimeout: null,
      sortKey: null,
      sortOrder: "asc",
      // partie upload facturation
      selectedFile: null,    // fichier PDF choisi
      uploadedPDFs: [],      // liste des factures en base
      showPdfModal: false,   // contrôle l’affichage du modal
      pdfDetailUrl: '',      // URL du PDF à afficher dans l’iframe
      successMessage: ''     // message après upload
    };
  },
  computed: {
    paginatedInvoices() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredInvoices.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredInvoices.length / this.itemsPerPage);
    },
    filteredInvoices() {
      const query = this.searchQuery.toLowerCase();
      return this.invoices
        .filter((invoice) =>
          (invoice.invoiceType && invoice.invoiceType.toLowerCase().includes(query)) ||
          (invoice.month && invoice.month.toLowerCase().includes(query))
        )
        .sort((a, b) => {
          if (this.sortKey) {
            return this.sortOrder === "asc"
              ? a[this.sortKey] > b[this.sortKey] ? 1 : -1
              : a[this.sortKey] < b[this.sortKey] ? 1 : -1;
          }
          return 0;
        });
    },
  },
  created() {
    this.fetchInvoices();
  },
  methods: {
    /* __________________ Partie Facturation________________  */
    // lors de la sélection du fichier
    onFileSelected(event) {
      this.selectedFile = event.target.files[0];
    },
    // envoi au backend et rafraîchissement du tableau
    async uploadPdf() {
      if (!this.selectedFile) return;
      const form = new FormData();
      form.append('file', this.selectedFile);
      try {
        await apiServices.uploadInvoicePdf(form);
        this.successMessage = 'PDF uploaded successfully!';
        await this.fetchPdfs();
        this.selectedFile = null;
        this.$refs.pdfInput.value = null;
      } catch (err) {
        console.error(err);
      }
    },
    // récupère toutes les factures depuis la base
    async fetchPdfs() {
      this.uploadedPDFs = await apiServices.fetchPdfInvoices();
    },
    async viewPDF(pdf) {
    try {
      this.pdfDetailUrl = await apiServices.getPdfUrl(pdf._id);
    } catch (err) {
      console.error(err);
    }
  },
    // ferme le modal
    closePdfModal() {
      this.showPdfModal = false;
      this.pdfDetailUrl = '';
    },
    updateParentTotals(updatedInvoice) {
      // Met à jour les totaux affichés dans le parent
      const index = this.invoices.findIndex(inv => inv._id === updatedInvoice._id);
      if (index !== -1) {
        this.invoices[index] = { ...updatedInvoice };
      }
    },
    async fetchInvoices() {
      try {
        this.invoices = await apiServices.getAllInvoices();
      } catch (error) {
        console.error("Error fetching invoices:", error);
      }
    },

    openAddModal() {
      this.showAddModal = true;
      this.editedInvoice = {};
    },
    closeModal() {
      this.showAddModal = false;
      this.showEditModal = false;
    },

    editInvoice(invoice) {
      this.editedInvoice = { ...invoice };
      this.showEditModal = true;
    },
    async saveInvoice() {
      try {
        // Récupère l'objet facture depuis le composant enfant via le ref "InvoiceForm"
        const invoiceToSave = this.$refs.InvoiceForm.localInvoice;

        // Vérification des champs obligatoires
        if (!invoiceToSave.invoiceType || !invoiceToSave.month) {
          throw new Error("Invoice Type and Month are required.");
        }

        // Met à jour les totaux dans le composant enfant
        this.$refs.InvoiceForm.updateTotals();

        // Envoie la facture mise à jour à l'API
        if (this.showAddModal) {
          await apiServices.addInvoice(invoiceToSave);
        } else if (this.showEditModal) {
          if (!invoiceToSave._id) {
            throw new Error("Internal identifier is missing for update.");
          }
          await apiServices.updateInvoice(invoiceToSave._id, invoiceToSave);
        }

        // Actualise la liste des factures
        await this.fetchInvoices();

        // Affiche un message de succès et ferme le modal
        this.successMessage = "Invoice saved successfully!";
        this.closeModal();

        // Réinitialise le message après 3 secondes
        setTimeout(() => {
          this.successMessage = '';
        }, 4000);

      } catch (error) {
        console.error("Error saving invoice:", error);
        if (error.response && error.response.data && error.response.data.message) {
          this.successMessage = error.response.data.message;
        } else {
          this.successMessage = "An error occurred. Please try again.";
        }
        setTimeout(() => {
          this.successMessage = '';
        }, 4000);
      }
    },


    async deleteInvoice(id) {
      const index = this.invoices.findIndex((item) => item._id === id);
      if (index !== -1) {
        this.lastDeletedItem = this.invoices.splice(index, 1)[0];
        this.lastDeletedIndex = index;
        this.showUndo = true;

        this.deleteTimeout = setTimeout(async () => {
          try {
            await apiServices.deleteInvoice(id);
            await this.fetchInvoices();
          } catch (error) {
            console.error("Error deleting invoice:", error);
          } finally {
            this.showUndo = false;
          }
        }, 3000);
      }
    },

    undoDelete() {
      if (this.lastDeletedItem !== null && this.lastDeletedIndex !== null) {
        this.invoices.splice(this.lastDeletedIndex, 0, this.lastDeletedItem);
        clearTimeout(this.deleteTimeout);
      }
      this.showUndo = false;
    },

    prevPage() {
      if (this.currentPage > 1) this.currentPage--;
    },

    nextPage() {
      if (this.currentPage < this.totalPages) this.currentPage++;
    },

    sortTable(key) {
      this.sortKey = key;
      this.sortOrder = this.sortOrder === "asc" ? "desc" : "asc";
    },

  },
  mounted() {
    this.fetchPdfs();
  }
};
</script>


<style scoped>
/* Container & Layout */
.dashboard-container {
  display: flex;
  height: 100vh;
  transition: background-color 0.3s ease;
}


.content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.header-title h1 {
  margin: 0;
  font-size: 2.2rem;
  color: #c1c3c3;
  /* Couleur principale (tu peux changer) */
  font-weight: bold;
}

.header-title p {
  margin: 0;
  font-size: 1.1rem;
  color: #1b0404;
  /* gris doux */
  font-style: italic;
}

.header-right {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  margin-left: auto;
}

.header-right .icon {
  font-size: 1.8rem;
  color: #e1e1e1;
  transition: color 0.3s ease;
  cursor: pointer;
}

.header-right .icon:hover {
  color: #007bff;
  /* Couleur au survol */
}

.header-controls {
  display: flex;
  gap: 0.5rem;
}

.header-controls button,
.header-controls input {
  padding: 0.5rem 1rem;
  font-size: 1rem;
}


.search-input {
  flex-grow: 1;
  margin-right: 20px;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.add-btn {
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-btn:hover {
  background-color: #218838;
}

/* fin  */

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background-color: #007bff;
  color: #fff;
  text-transform: uppercase;
  font-size: 14px;
  letter-spacing: 0.5px;
}

.data-table tr:hover {
  background-color: #f1f1f1;
}

/* Action buttons in table */
.action-buttons {
  display: flex;
  gap: 10px;
}

.update-btn,
.delete-btn {
  padding: 5px 10px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: transform 0.3s ease, background-color 0.3s ease;
}

.update-btn {
  background-color: #007bff;
  color: white;
}

.update-btn:hover {
  transform: scale(1.1);
  background-color: #0056b3;
}

.delete-btn {
  background-color: #dc3545;
  color: white;
}

.delete-btn:hover {
  transform: scale(1.1);
  background-color: #c82333;
}

/* Pagination next et previous */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

/* bouton  styles */
.btn-prev,
.btn-next {
  padding: 10px 20px;
  background-color: #0b164e;
  color: #fff;
  border: none;
  border-radius: 50px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* effet au survol */
.btn-prev:hover,
.btn-next:hover {
  background-color: #152bbd;
  transform: scale(1.1);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.2);
}

/* Animation dynamique avec une légère rotation et translation */
.btn-prev:hover i,
.btn-next:hover i {
  animation: rotateIcon 0.5s ease-in-out;
}

/* Animation de rotation de l'icône */
@keyframes rotateIcon {
  0% {
    transform: rotate(0deg);
  }

  50% {
    transform: rotate(180deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* Style pour les boutons désactivés (si la page est au début ou à la fin) */
.btn-prev:disabled,
.btn-next:disabled {
  background-color: #ddd;
  cursor: not-allowed;
}

/* Ajoutez un effet de clic pour rendre l'interaction plus vive */
.btn-prev:active,
.btn-next:active {
  transform: scale(0.95);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}


/* Transition for Toast */
.toast-message {
  background-color: #4CAF50;
  color: white;
  padding: 16px;
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 5px;
  z-index: 9999;
  display: flex;
  align-items: center;
  transition: opacity 0.5s ease;
}

.toast-message.fade-enter-active,
.toast-message.fade-leave-active {
  opacity: 0;
}

.toast-message.fade-enter,
.toast-message.fade-leave-to {
  opacity: 0;
}

/* Banniere de suppression d'une instance de consommation  */
.undo-banner {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #222;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  animation: fadeIn 0.3s ease-in-out;
}

.undo-banner p {
  margin: 0;
  font-size: 14px;
}

.undo-banner button {
  background: #ff4d4d;
  color: white;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  margin-left: 15px;
  border-radius: 5px;
  transition: 0.3s;
}

.undo-banner button:hover {
  background-color: #cc0000;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background: rgba(0,0,0,0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-box {
  position: relative;
  width: 80%;
  max-width: 1000px;
  height: 80%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.modal-close {
  position: absolute;
  top: 8px; right: 12px;
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  z-index: 1001;
}

.modal-iframe {
  width: 100%;
  height: 100%;
}

</style>
