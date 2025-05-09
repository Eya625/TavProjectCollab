<template>
  <div class="layout">
    <!-- Navbar -->
    <nav class="sidebar">
      <PrinParcNavBar />
    </nav>

    <div class="printer-parc">
      <!-- Header -->
      <header class="header">
        <h1>Printer Maintenance Management</h1>
        <div class="header-icons">
          <font-awesome-icon icon="fa-user-circle" class="profile-icon" />
          <div class="notification-icon">
            <font-awesome-icon icon="fa-bell" />
          </div>
          <router-link to="/">
            <font-awesome-icon icon="fa-sign-out-alt" class="exit-icon" />
          </router-link>
        </div>
      </header>

      <!-- Notification -->
      <div
        v-if="notification.show"
        :class="['notification', notification.type]"
      >
        {{ notification.message }}
      </div>

      <!-- Card Indicators Section -->
      <section class="card-indicators">
        <div class="card">
          <div class="card-icon">
            <font-awesome-icon icon="fa-exclamation-triangle" />
          </div>
          <div class="card-content">
            <h2>Inactive Printers</h2>
            <p>{{ inactivePrintersCount }} imprimante(s) inactive(s)</p>
            <ul class="inactive-refs-list">
              <li v-for="ref in inactivePrinterRefs" :key="ref">
                {{ ref }}
              </li>
            </ul>
          </div>
        </div>
        <div class="card">
          <div class="card-icon">
            <font-awesome-icon icon="fa-tools" />
          </div>
          <div class="card-content">
            <h2>Printer with Most Interventions</h2>
            <!-- Utilisation de printerRef au lieu de ref -->
            <p>{{ mostCurativeInterventionsPrinter.printerRef }}</p>
            <small
              >{{ mostCurativeInterventionsPrinter.count }} interventions</small
            >
            <small>
              <br />Total Costs :
              {{ mostCurativeInterventionsPrinter.totalCost }} 
            </small>
          </div>
        </div>
        <div class="card">
          <div class="card-icon">
            <font-awesome-icon icon="fa-coins" />
          </div>
          <div class="card-content">
            <h2>Total Cost This Month</h2>
            <p>{{ totalCostThisMonth }} DT</p>
            <small
              >Somme des coûts du Mois
              {{ new Date().toLocaleString('fr', { month: 'long' }) }}</small
            >
          </div>
        </div>
      </section>

      <!-- Corrective Maintenance Intervention Form -->
      <section class="maintenance-form-card">
        <div class="card-header">
          <font-awesome-icon icon="fa-wrench" class="card-icon" />
          <h2>Corrective Maintenance Interventions</h2>
        </div>
        <form class="maintenance-form" @submit.prevent="submitMaintenance">
          <div class="form-group">
            <label for="equipment">Faulty Equipment (Serial)</label>
            <select id="equipment" v-model="newMaintenance.Printer_ID" required>
              <option value="" disabled>Select equipment serial</option>
              <option
                v-for="printer in printers"
                :key="printer.Printer_ID"
                :value="printer.Printer_ID"
              >
                {{ printer.Printer_ID }} - {{ printer.Manufacturer }}
                {{ printer.Model }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label for="date"
              >Intervention Date <font-awesome-icon icon="fa-calendar-alt"
            /></label>
            <input
              id="date"
              type="date"
              v-model="newMaintenance.date"
              required
            />
          </div>
          <div class="form-group">
            <label for="type">Intervention Type</label>
            <input
              id="type"
              type="text"
              placeholder="Enter intervention type"
              v-model="newMaintenance.type"
              required
            />
          </div>
          <div class="form-group">
            <label for="technician">Assigned Technician</label>
            <input
              id="technician"
              type="text"
              placeholder="Enter technician name"
              v-model="newMaintenance.technician"
              required
            />
          </div>
          <div class="form-group">
            <label for="description">Detailed Description</label>
            <textarea
              id="description"
              placeholder="Enter detailed description"
              v-model="newMaintenance.description"
            ></textarea>
          </div>
          <div class="form-group">
            <label for="cost">Cost </label>
            <input
              id="cost"
              type="number"
              placeholder="Enter cost"
              v-model.number="newMaintenance.cost"
              required
            />
          </div>
          <div class="form-buttons">
            <button type="submit" class="btn-confirm" :disabled="isSubmitting">
              Confirm
            </button>
            <button type="button" class="btn-cancel" @click="cancelMaintenance">
              Cancel
            </button>
          </div>
        </form>
      </section>

      <!-- Historical Interventions Section -->
      <section class="historical-interventions">
        <div class="card">
          <div class="card-header">
            <font-awesome-icon icon="fa-history" class="card-icon" />
            <h2>History of Corrective Interventions</h2>
          </div>
          <div class="search-bar">
            <input
              type="text"
              placeholder="Search interventions..."
              v-model="searchQuery"
            />
          </div>

          <transition name="fade">
            <div class="modal-overlay" v-if="selectedIntervention">
              <div class="modal-content">
                <h3>Détails de l’intervention</h3>
                <p>
                  <strong>Printer ID:</strong>
                  {{ selectedIntervention.Printer_ID }}
                </p>
                <p>
                  <strong>Date:</strong>
                  {{ formatDate(selectedIntervention.date) }}
                </p>
                <p><strong>Type:</strong> {{ selectedIntervention.type }}</p>
                <p>
                  <strong>Technician:</strong>
                  {{ selectedIntervention.technician }}
                </p>
                <p>
                  <strong>Description:</strong>
                  {{ selectedIntervention.description }}
                </p>
                <p><strong>Cost:</strong> {{ selectedIntervention.cost }}</p>
                <button class="ok-btn" @click="closeDetails">Fermer</button>
              </div>
            </div>
          </transition>

          <table class="interventions-table">
            <thead>
              <tr>
                <th>Printer ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Technician</th>
                <th>Cost</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="intervention in filteredInterventions"
                :key="intervention._id"
              >
                <td>{{ intervention.Printer_ID }}</td>
                <td>{{ formatDate(intervention.date) }}</td>
                <td>{{ intervention.type }}</td>
                <td>{{ intervention.technician }}</td>
                <td>{{ intervention.cost }}</td>
                <td>
                  <button @click="toggleDetails(intervention._id)">
                    Details
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  </div>
</template>
<script>
import { ref, computed, onMounted } from 'vue';
import PrinParcNavBar from '../components/PrinParcNavBar.vue';
import apiServices from '../services/apiServices';

export default {
  name: 'CurativeMaintenance',
  components: { PrinParcNavBar },
  setup() {
    // --- États réactifs ---
    const printers = ref([]);
    const interventions = ref([]);
    const newMaintenance = ref({
      Printer_ID: '',
      date: '',
      type: '',
      technician: '',
      description: '',
      cost: 0
    });
    const searchQuery = ref(''); // <-- remise de searchQuery
    const selectedIntervention = ref(null); // <-- déclaré avant toggleDetails
    const notification = ref({ show: false, message: '', type: '' });
    const isSubmitting = ref(false);
    const repairsCompletedCount = ref(20);
    // juste après inactivePrintersCount
    const inactivePrinterRefs = computed(() =>
      printers.value
        .filter((p) => p.Status?.toLowerCase() === 'inactive')
        .map((p) => p.Printer_ID)
    );
    const totalCostThisMonth = computed(() => {
      const now = new Date();
      return interventions.value
        .filter((i) => {
          const d = new Date(i.date);
          return (
            d.getFullYear() === now.getFullYear() &&
            d.getMonth() === now.getMonth()
          );
        })
        .reduce((sum, i) => sum + (typeof i.cost === 'number' ? i.cost : 0), 0);
    });

    // --- Helpers ---
    const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString();
    const showNotification = (msg, type = 'success') => {
      notification.value = { show: true, message: msg, type };
      setTimeout(() => (notification.value.show = false), 3000);
    };

    // --- Chargement des données ---
    const loadPrinters = async () => {
      try {
        printers.value = await apiServices.getPrinters();
      } catch {
        showNotification('Error fetching printers', 'error');
      }
    };
    const loadMaintenances = async () => {
      try {
        const response = await apiServices.getAllMaintenances();
        // console pour debugger la forme de la réponse
        console.log('Fetched Maintenances raw:', response);
        // On alimente interventions.value avec un tableau (ou vide)
        const data = Array.isArray(response.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];
        console.log('Interventions to use:', data);
        interventions.value = data;
      } catch (error) {
        console.error('Error loading maintenances', error);
      }
    };

    const inactivePrintersCount = computed(
      () =>
        printers.value.filter((p) => p.Status?.toLowerCase() === 'inactive')
          .length
    );

    const mostCurativeInterventionsPrinter = computed(() => {
      const data = interventions.value || [];
      const activePrinterIds = new Set(
        printers.value.map((p) => p.Printer_ID?.trim())
      );

      // Filtrer seulement les interventions liées à des imprimantes existantes
      const filteredInterventions = data.filter((i) =>
        activePrinterIds.has(i.Printer_ID?.trim())
      );

      const counts = filteredInterventions.reduce((acc, { Printer_ID }) => {
        const id = Printer_ID?.trim();
        if (!id) return acc;
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {});

      const entries = Object.entries(counts);
      if (entries.length === 0) {
        return { printerRef: 'N/A', count: 0, totalCost: 0, avgCost: 0 };
      }

      const [bestRef, bestCount] = entries.reduce(
        (best, curr) => (curr[1] > best[1] ? curr : best),
        ['', 0]
      );

      const bestIntervs = filteredInterventions.filter(
        (i) => i.Printer_ID?.trim() === bestRef
      );
      const totalCost = bestIntervs.reduce(
        (sum, i) => sum + (typeof i.cost === 'number' ? i.cost : 0),
        0
      );
      const avgCost = bestCount > 0 ? totalCost / bestCount : 0;

      return {
        printerRef: bestRef,
        count: bestCount,
        totalCost,
        avgCost
      };
    });

    // --- Liste historique sans filtre du top printer ---
    const filteredInterventions = computed(() => {
      const search = searchQuery.value.trim().toLowerCase();
      return interventions.value.filter(
        (i) =>
          // si searchQuery vide, tout passe
          !search || i.Printer_ID?.trim().toLowerCase().includes(search)
      );
    });

    // --- Actions utilisateur ---
    const submitMaintenance = async () => {
      // === test de saisie : date d'intervention ≤ date actuelle ===
      const intervDate = new Date(newMaintenance.value.date);
      const now = new Date();
      if (intervDate > now) {
        showNotification(
          'Intervention date must not be in the future',
          'error'
        );
        return;
      }

      //  test de saisie : cost doit être > 0
      if (newMaintenance.value.cost <= 0) {
        showNotification('Cost must be greater than zero', 'error');
        return;
      }
      if (isSubmitting.value) return;
      isSubmitting.value = true;
      try {
        console.log('Maintenance Data:', newMaintenance.value);
        await apiServices.addMaintenance(newMaintenance.value);
        showNotification('Maintenance added!', 'success');
        // reset
        newMaintenance.value = {
          Printer_ID: '',
          date: '',
          type: '',
          technician: '',
          description: '',
          cost: 0
        };
        await loadMaintenances();
      } catch {
        showNotification('Error adding maintenance', 'error');
      } finally {
        isSubmitting.value = false;
      }
    };

    const cancelMaintenance = () => {
      newMaintenance.value = {
        Printer_ID: '',
        date: '',
        type: '',
        technician: '',
        description: '',
        cost: 0
      };
    };

    const toggleDetails = (id) => {
      const interv = interventions.value.find((i) => i._id === id);
      selectedIntervention.value =
        selectedIntervention.value === interv ? null : interv;
    };
    const closeDetails = () => {
      selectedIntervention.value = null;
    };

    // --- Montée en charge initiale ---
    onMounted(async () => {
      await loadPrinters();
      await loadMaintenances();
    });

    // --- Exports vers template ---
    return {
      printers,
      interventions,
      newMaintenance,
      searchQuery,
      selectedIntervention,
      notification,
      isSubmitting,
      repairsCompletedCount,
      inactivePrintersCount,
      inactivePrinterRefs,
      mostCurativeInterventionsPrinter,
      filteredInterventions,
      formatDate,
      submitMaintenance,
      cancelMaintenance,
      toggleDetails,
      closeDetails,
      totalCostThisMonth
    };
  }
};
</script>

<style scoped>
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.header-icons {
  display: flex;
  align-items: center;
  gap: 1rem; /* espace entre les icônes */
}

.header-icons > * {
  font-size: 1.5rem;
  cursor: pointer;
}

/* Card Indicators */
.card-indicators {
  display: flex;
  gap: 20px;
  margin: 20px 0;
}

.card-indicators .card {
  flex: 1;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-indicators .card-icon {
  font-size: 2.5rem;
  color: #1f4489;
}

.card-indicators .card-content h2 {
  font-size: 1.25rem;
  margin: 0;
}

.card-indicators .card-content p {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}

/* Maintenance Intervention Form Card */
.maintenance-form-card {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.maintenance-form-card .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.maintenance-form-card .card-icon {
  font-size: 2rem;
  color: #1f4489;
}

.maintenance-form-card h2 {
  font-size: 1.5rem;
  margin: 0;
}

.maintenance-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: bold;
  margin-bottom: 4px;
}

.form-group input,
.form-group textarea {
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.form-buttons {
  grid-column: 1 / -1;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.btn-confirm {
  background: #0851d8d4;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-confirm:hover {
  background: #042870;
}

.btn-cancel {
  background: #ec0a21;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-cancel:hover {
  background: #c82333;
}

/* Historical Interventions Section */
.historical-interventions .card {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.historical-interventions .card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.historical-interventions .card-icon {
  font-size: 2rem;
  color: #1f4489;
}

.historical-interventions h2 {
  font-size: 1.5rem;
  margin: 0;
}

.search-bar {
  margin-bottom: 16px;
}

.search-bar input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.interventions-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
}

.interventions-table th,
.interventions-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.interventions-table th {
  background: #f0f0f0;
}

.interventions-table button {
  background: #1f4489;
  color: #fff;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.interventions-table button:hover {
  background: #163571;
}

/* 🔹 Notifications */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 5px;
  font-weight: bold;
  color: #fff;
  opacity: 0;
  animation: fadeInOut 3s forwards;
  z-index: 1100;
}

.notification.success {
  background-color: #4caf50;
}

.notification.error {
  background-color: #f44336;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }
  10% {
    opacity: 1;
    transform: translateY(0);
  }
  90% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}

/* partie des liste des imprimantes inactive (card indicator ) */
.inactive-refs-list {
  list-style: none; /* suppression des puces */
  padding: 0;
  margin: 0;
  display: flex; /* aligne les items sur une ligne */
  flex-wrap: wrap; /* passe à la ligne si trop long */
  gap: 0.5rem; /* espace entre chaque ref */
}

.inactive-refs-list li {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  background-color: rgba(0, 0, 0, 0.05);
  font-size: 0.85rem;
}

/* Animation du transition fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Overlay sombre comme SweetAlert */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

/* Contenu centré avec animation */
.modal-content {
  background: #fff;
  padding: 2rem 2.5rem;
  border-radius: 1rem;
  max-width: 550px;
  width: 90%;
  text-align: left;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  animation: fadeInUp 0.4s ease-out;
  position: relative;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Bouton stylé */
.ok-btn {
  margin-top: 1.5rem;
  padding: 0.75rem 1.75rem;
  background: linear-gradient(to right, #0066ff, #3399ff);
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}
.ok-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 10px rgba(0, 102, 255, 0.3);
}
</style>
