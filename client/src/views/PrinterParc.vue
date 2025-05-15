<template>
  <div class="layout">
    <div class="sidebar">
      <PrinParcNavBar />
    </div>

    <div class="printer-parc">
      <!-- Header -->
      <header class="header">
        <h1>Printer Parc Management</h1>
        <div class="header-icons">
          <router-link to="/notifications">
            <font-awesome-icon icon="fa-bell" class="icon notification-icon" />
          </router-link>
          <router-link to="/">
            <font-awesome-icon icon="fa-sign-out-alt" class="exit-icon" />
          </router-link>
        </div>
      </header>

      <!-- Bouton Add Printer -->
      <div class="add-printer-container">
        <button class="btn-add" @click="openAdd">
          <font-awesome-icon icon="fa-plus" /> Add Printer
        </button>
      </div>

      <div class="content">
        <!-- Filtres -->
        <aside class="filter-panel">
          <h2>Filters</h2>

          <div class="filter-group">
            <label for="ref">Reference</label>
            <input
              id="ref"
              type="text"
              placeholder="Enter reference"
              v-model="filters.ref"
            />
          </div>

          <div class="filter-group department-filter">
            <label class="filter-group-label">Department</label>
            <div class="checkbox-container">
              <label
                v-for="dep in departmentsList"
                :key="dep"
                class="checkbox-label"
              >
                <input
                  type="checkbox"
                  :value="dep"
                  v-model="filters.department"
                />
                {{ dep }}
              </label>
            </div>
          </div>

          <div class="filter-group">
            <label for="type">Type</label>
            <select id="type" v-model="filters.type">
              <option value="">All</option>
              <option value="Laser">Laser</option>
              <option value="Inkjet">Inkjet</option>
            </select>
          </div>

          <div class="filter-group">
            <label for="state">Status</label>
            <select id="state" v-model="filters.state">
              <option value="">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </aside>

        <!-- Tableau -->
        <main class="main-content">
          <table>
            <thead>
              <tr>
                <th>Ref</th>
                <th>Manufacturer</th>
                <th>Model</th>
                <th>Type</th>
                <th>Total Pages</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="printer in filteredPrinters" :key="printer._id">
                <td>{{ printer.Printer_ID }}</td>
                <td>{{ printer.Manufacturer }}</td>
                <td>{{ printer.Model }}</td>
                <td>{{ printer.Type }}</td>
                <td>{{ printer.Total_Pages }}</td>
                <td>
                  <span
                    class="status-indicator"
                    :class="{
                      active: printer.Status === 'Active',
                      inactive: printer.Status === 'Inactive'
                    }"
                  ></span>
                  {{ printer.Status }}
                </td>
                <td class="action-buttons">
                  <button @click="openEdit(printer)">Update</button>
                  <button @click="remove(printer)">Delete</button>
                </td>
              </tr>
              <tr v-if="!filteredPrinters.length">
                <td colspan="7">No printers found.</td>
              </tr>
            </tbody>
          </table>
        </main>
      </div>
      <!-- Notification -->
      <div
        v-if="notification.show"
        :class="['notification', notification.type]"
      >
        {{ notification.message }}
      </div>
      <!-- Modal d’ajout / édition -->
      <PrinterModal
        v-model="showAddModal"
        :initial="editingPrinter"
        :checkReferenceExists="checkReferenceExists"
        @save="onSave"
        @cancel="onCancel"
      />
    </div>
  </div>
</template>

<script>
import PrinParcNavBar from '../components/PrinParcNavBar.vue';
import PrinterModal from '../components/PrinterModal.vue';
import apiServices from '../services/apiServices';
import Swal from 'sweetalert2';
export default {
  name: 'PrinterParc',
  components: { PrinParcNavBar, PrinterModal },
  data() {
    return {
      allPrinters: [],
      departmentsList: [],
      filters: { ref: '', department: [], type: '', state: '' },
      showAddModal: false,
      editingPrinter: {},
      notification: { show: false, message: '', type: 'success' }
    };
  },
  async mounted() {
    await this.fetchPrinters();
  },
  computed: {
    filteredPrinters() {
      return this.allPrinters.filter((p) => {
        if (
          this.filters.ref &&
          !p.Printer_ID.toLowerCase().includes(this.filters.ref.toLowerCase())
        )
          return false;
        if (
          this.filters.department.length &&
          !this.filters.department.includes(p.Department)
        )
          return false;
        if (this.filters.type && p.Type !== this.filters.type) return false;
        if (this.filters.state && p.Status !== this.filters.state) return false;
        return true;
      });
    }
  },
  methods: {
    showNotification(message, type = 'success') {
      this.notification = { show: true, message, type };
      setTimeout(() => {
        this.notification.show = false;
      }, 3000);
    },

    async fetchPrinters() {
      this.allPrinters = await apiServices.getPrinters();
      this.departmentsList = [
        ...new Set(this.allPrinters.map((p) => p.Department))
      ];
    },
    openAdd() {
      this.editingPrinter = {};
      this.showAddModal = true;
    },
    openEdit(printer) {
      this.editingPrinter = printer;
      this.showAddModal = true;
    },
    async onSave(printerData) {
      try {
        if (printerData._id) {
          await apiServices.updatePrinter(printerData._id, printerData);
          this.showNotification('Printer updated successfully');
        } else {
          await apiServices.addPrinter(printerData);
          this.showNotification('Printer added successfully');
        }
        this.showAddModal = false;
        this.fetchPrinters();
        this.editingPrinter = {};
      } catch (error) {
        this.showNotification('Error saving printer', 'error');
        console.error(error);
      }
    },

    onCancel() {
      this.showAddModal = false;
      this.editingPrinter = {};
    },

    async remove(printer) {
      const status = printer.Status?.toLowerCase();

      // 1. Si active → bloquer avec SweetAlert
      if (status === 'active') {
        Swal.fire({
          icon: 'error',
          title: 'Forbidden',
          text: "You're not allowed to delete this printer because it's still active."
        });
        return;
      }

      // 2. Confirmer avec SweetAlert
      const result = await Swal.fire({
        title: `Delete printer [${printer.Printer_ID}]?`,
        text: 'This action cannot be undone.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Delete anyway',
        cancelButtonText: 'Cancel'
      });

      // 3. Si refusé → sortir
      if (!result.isConfirmed) return;

      try {
        await apiServices.deletePrinter(printer._id);

        await this.fetchPrinters();

        // 5. Succès
        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Printer successfully deleted.'
        });
      } catch (error) {
        console.error('Error deleting printer:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'An error occurred while deleting the printer.'
        });
      }
    },

    checkReferenceExists(ref) {
      return this.allPrinters.some(
        (p) => p.Printer_ID.toLowerCase() === ref.toLowerCase()
      );
    }
  }
};
</script>

<style>
.layout {
  display: flex;
  gap: 20px;
  background: #f0f4f8;
  min-height: 100vh;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.printer-parc {
  flex: 1;
  margin: 20px;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: linear-gradient(135deg, #334155, #64748b);
  color: #e2e8f0;
  border-radius: 12px;
  margin-bottom: 20px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  animation: fadeSlide 0.6s ease-in;
}
@keyframes fadeSlide {
  from {
    transform: translateY(-20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.header h1 {
  font-size: 1.8rem;
  letter-spacing: 1px;
}

.header-icons svg {
  font-size: 26px;
  margin-left: 16px;
  cursor: pointer;
  transition: transform 0.25s ease;
}
.header-icons svg:hover {
  transform: scale(1.2) rotate(5deg);
}

/* ADD BUTTON */
.add-printer-container {
  text-align: right;
  margin-bottom: 20px;
}
.btn-add {
  background: linear-gradient(90deg, #3b82f6, #06b6d4);
  color: #fff;
  border: none;
  padding: 12px 22px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
  cursor: pointer;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s;
}
.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
}

/* FILTERS */
.content {
  display: flex;
  gap: 20px;
}
.filter-panel {
  width: 22%;
  padding: 20px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
  animation: fadeSlide 0.5s ease-in;
}

.filter-panel h2 {
  margin-bottom: 12px;
  font-size: 1.2rem;
  color: #334155;
}

.filter-group {
  margin-bottom: 18px;
}
.filter-group label {
  font-weight: 600;
  color: #475569;
  margin-bottom: 6px;
  display: block;
}
.filter-group input,
.filter-group select {
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background: #f8fafc;
  transition: border-color 0.2s ease;
}
.filter-group input:focus,
.filter-group select:focus {
  border-color: #3b82f6;
  outline: none;
}
.checkbox-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* TABLE ZONE */
.main-content {
  flex: 1;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}
th {
  text-align: left;
  background: #f1f5f9;
  color: #334155;
  padding: 12px;
}
td {
  padding: 12px;
  border-top: 1px solid #e2e8f0;
  color: #334155;
}
tbody tr:hover {
  background: #f9fafb;
  transition: background 0.2s ease;
}

.status-indicator {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 6px;
}
.active {
  background-color: #22c55e;
}
.inactive {
  background-color: #ef4444;
  animation: blink 1s infinite;
}
@keyframes blink {
  50% {
    opacity: 0.4;
  }
}

.exit-icon {
  color: #f8fafc;
}
/* Notification styles */
.notification {
  position: absolute;
  top: 100px; /* Ajuster selon la position de l'icône */
  right: 50px; /* Positionner à droite de l'icône */
  padding: 10px 16px;
  border-radius: 8px;
  color: white; /* Couleur du texte */
  font-weight: bold;
  z-index: 1000;
  transition: opacity 0.3s ease;
  background-color: #4caf50; /* par défaut, succès */
}

.notification.error {
  background-color: #f44336; /* erreur */
}
/* Icone de notification */
.notification-icon {
  color: white; /* Change la couleur de l'icône en blanc */
  font-size: 24px; /* Ajuste la taille de l'icône si nécessaire */
}
/* Icone de notification */
.header-icons .fa-bell {
  position: relative;
}

.notification.success {
  background-color: #4caf50;
}
.notification.error {
  background-color: #f44336;
}


/* Boutons update et delete de tableau  */
.action-buttons button {
  padding: 6px 12px;
  margin: 0 5px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.2s ease;
}

.action-buttons button:first-child {
  background-color: #007bff;
  color: white;
}

.action-buttons button:first-child:hover {
  background-color: #0056b3;
}

.action-buttons button:last-child {
  background-color: #dc3545;
  color: white;
}

.action-buttons button:last-child:hover {
  background-color: #a71d2a;
}

</style>
