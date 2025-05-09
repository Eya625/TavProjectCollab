<template>
  <div class="dashboard-container">
    <NavBar class="sidebar" />
    
    <div class="content">
      <!-- Top Icons -->
      <div class="top-icons">
        <i class="fas fa-bell"></i>
        <i class="fas fa-cog"></i>
        <i class="fas fa-user"></i>
      </div>

      <!-- Notification Toast -->
      <transition name="fade">
        <div v-if="successMessage" class="toast-message">
          {{ successMessage }}
        </div>
      </transition>

      
      <!-- Consumption Modal -->
      <ConsumptionModal
        v-if="showAddModal || showEditModal"
        :showModal="showAddModal || showEditModal"
        :isEditMode="showEditModal"
        :consumption="editedConsumption"
        @close="closeModal"
        @save="saveConsumption"
      />

      <!-- Header Controls -->
      <div class="header-controls">
        <input v-model="searchQuery" type="text" placeholder="Search..." class="search-input" />
        <button @click="openAddModal" class="add-btn">Add Consumption</button>
      </div>
<!-- Consommation Card Section -->
      <div class="year-card" @click="showConsumptionList(2024)" :class="{'active-card': isCardActive(2024)}">
        <h3>Consommations de l'année 2024</h3>
        <p>Total des consommations : {{ getTotalConsumptionForYear(2024) }}</p>
      </div>

      <div>


    <!-- Affichage des cartes -->
    <div v-for="card in consumptionCards" :key="card._id" class="year-card">
      <h3>Consommations de l'année {{ card.year }}</h3>
      <p>Total: {{ card.total }}</p>
    </div>
  </div>

      <!-- Consumption List -->
      <div v-if="showList" class="consumption-table">
        <div class="table-header">
          <table class="data-table">
            <thead>
              <tr>
                <th @click="sortTable('id')">ID</th>
                <th @click="sortTable('employee')">Employee</th>
                <th @click="sortTable('card_number')">Card Number</th>
                <th @click="sortTable('department_code')">Department Code</th>
                <th @click="sortTable('location')">Location</th>
                <th @click="sortTable('budget')">Budget</th>
                <th @click="sortTable('monthly_limit')">Monthly Limit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="consumption in paginatedConsumptions" :key="consumption._id">
                <td>{{ consumption.id }}</td>
                <td>{{ consumption.employ }}</td>
                <td>{{ consumption.card_number }}</td>
                <td>{{ consumption.department_code }}</td>
                <td>{{ consumption.location }}</td>
                <td>{{ consumption.budget }}</td>
                <td>{{ consumption.monthly_limit }}</td>
                <td v-for="month in months" :key="month.key">
                  {{ consumption[month.key] || 'N/A' }}
                </td>
                <td class="action-buttons">
                  <button class="update-btn" @click.stop="editConsumption(consumption)">Update</button>
                  <button class="delete-btn" @click.stop="deleteConsumption(consumption._id)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Undo Banner -->
          <div v-if="showUndo" class="undo-banner">
            <p>Suppression en cours...
              <button @click="undoDelete">Annuler</button>
            </p>
          </div>

          <!-- Pagination Controls -->
          <div class="pagination">
            <button class="btn-prev" @click="prevPage" :disabled="currentPage === 1">
              <i class="fas fa-chevron-left"></i>Previous
            </button>
            <span>Page {{ currentPage }} of {{ totalPages }}</span>
            <button class="btn-next" @click="nextPage" :disabled="currentPage === totalPages">
              Next <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import apiServices from "../services/apiServices";
import NavBar from "../components/NavBar";
import ConsumptionModal from "../components/ConsumptionModal";

export default {
  components: {
    NavBar,
    ConsumptionModal,
  },
  data() {
    return {
      consumptions: [],
      showAddModal: false,
      showEditModal: false,
      editedConsumption: {},
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
      showList:false,
      selectedYear:null,
    };
  },
  computed: {
    paginatedConsumptions() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      return this.filteredConsumptions.slice(start, end);
    },
    totalPages() {
      return Math.ceil(this.filteredConsumptions.length / this.itemsPerPage);
    },
    filteredConsumptions() {
      const query = this.searchQuery.toLowerCase();
      return this.consumptions
        .filter((consumption) => 
          (consumption.employ && consumption.employ.toLowerCase().includes(query)) ||
          (consumption.card_number && consumption.card_number.toLowerCase().includes(query))
        )
        .sort((a, b) => {
          if (this.sortKey) {
            return this.sortOrder === "asc"
              ? a[this.sortKey] > b[this.sortKey] ? 1 : -1
              : a[this.sortKey] < b[this.sortKey] ? 1 : -1;
          }
          return 0;
        });
    }
  },
  created() {
    this.fetchConsumptions();
  },
  methods: {
    isCardActive(year) {
      return this.selectedYear === year;
    },
    // Bascule l'affichage du formulaire
toggleAddYearForm() {
  this.showAddYearForm = !this.showAddYearForm;
  this.newYear = '';
},
// Sauvegarde la nouvelle année saisie (vérifie qu'elle n'est pas 2024 et qu'elle n'existe pas déjà)
saveNewYear() {
  const year = parseInt(this.newYear);
  if (!isNaN(year) && year !== 2024 && !this.additionalYears.includes(year)) {
    this.additionalYears.push(year);
    this.additionalYears.sort();
    this.toggleAddYearForm();
  } else {
    alert("Veuillez entrer une année valide et non existante (différente de 2024).");
  }
},
showConsumptionList(year) {
  if (this.selectedYear === year) {
    this.showList = !this.showList; // Bascule si même année cliquée
  } else {
    this.selectedYear = year;
    this.showList = true;
    
  }
},

getTotalConsumptionForYear(year) {
  return this.consumptions
      .filter((consumption) => consumption.year === year)
      .reduce((total, consumption) => total + consumption.total, 0);
    },
    async fetchConsumptions() {
      try {
        this.consumptions = await apiServices.getAllConsumptions();
      } catch (error) {
        console.error("Error fetching consumptions:", error);
      }
    },
    openAddModal() {
      this.showAddModal = true;
      this.editedConsumption = {};
    },
    closeModal() {
      this.showAddModal = false;
      this.showEditModal = false;
    },
    editConsumption(consumption) {
      this.editedConsumption = { ...consumption };
      this.showEditModal = true;
    },
    async saveConsumption(consumption) {
      try {
        if (!consumption.id || !consumption.card_number) {
          throw new Error("L'ID et le Card Number sont obligatoires.");
        }

        if (this.showAddModal) {
          await apiServices.addConsumption(consumption);
        } else if (this.showEditModal) {
          if (!consumption._id) {
            throw new Error("Identifiant interne manquant pour la mise à jour.");
          }
          await apiServices.updateConsumption(consumption._id, consumption);
        }

        await this.fetchConsumptions();

        this.successMessage = "Consommation enregistrée avec succès!";
        this.closeModal();

        setTimeout(() => {
          this.successMessage = '';
        }, 4000);
      } catch (error) {
        console.error("Erreur lors de l'enregistrement de la consommation", error);
        this.successMessage = error.response?.data?.message || "Une erreur est survenue. Veuillez réessayer.";
        setTimeout(() => {
          this.successMessage = '';
        }, 4000);
      }
    },
    async deleteConsumption(id) {
      const index = this.consumptions.findIndex((item) => item._id === id);
      if (index !== -1) {
        this.lastDeletedItem = this.consumptions.splice(index, 1)[0];
        this.lastDeletedIndex = index;
        this.showUndo = true;

        this.deleteTimeout = setTimeout(async () => {
          try {
            await apiServices.deleteConsumption(id);
            await this.fetchConsumptions();
          } catch (error) {
            console.error("Erreur lors de la suppression via l'API:", error);
          } finally {
            this.showUndo = false;
          }
        }, 3000);
      }
    },
    undoDelete() {
      if (this.lastDeletedItem !== null && this.lastDeletedIndex !== null) {
        this.consumptions.splice(this.lastDeletedIndex, 0, this.lastDeletedItem);
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
    }
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

.sidebar {
  width: 240px;
  background-color: #607387;
  color: white;
  padding: 20px;
}

.content {
  flex-grow: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 20px;
}

/* style pour le bouton add consumption et search query */
.header-controls {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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
/* Mise en page des cartes des consommations */
.consumption-card {
  cursor: pointer;
  background-color: #ffffff; /* Fond plus lumineux pour plus de clarté */
  padding: 20px;
  margin-top: 20px;
  border-radius: 15px; /* Coins arrondis plus marqués */
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.1); /* Ombre plus marquée */
  transition: all 0.3s ease; /* Douce transition pour l'interaction */
}

/* Effet de survol avec une ombre plus marquée */
.consumption-card:hover {
  background-color: #f7f7f7; /* Légère variation de la couleur */
  box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2); /* Ombre plus marquée */
  transform: translateY(-8px); /* Légère translation vers le haut */
}

/* Style lorsque la carte est active ou cliquée */
.consumption-card.active-card {
  background-color: #e3f2fd; /* Légère teinte bleutée pour l'activation */
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1); /* Ombre plus marquée */
  transform: translateY(0); /* Réduire l'effet de déplacement */
}

/* Si la carte montre la liste, augmenter légèrement la taille */
.consumption-card.show-list {
  background-color: #f5f5f5;
  transform: scale(1.05); /* Légère augmentation de la taille de la carte */
}

/* Ajouter un petit indicateur pour les actions de la carte */
.consumption-card .fas {
  font-size: 22px;
  color: #007bff; /* Couleur bleue claire */
  transition: transform 0.3s ease; /* Douce transition */
}

/* Rotation de l'icône lors du survol */
.consumption-card:hover .fas {
  transform: rotate(180deg);
}

/* Style des éléments de la table */
.consumption-table {
  margin-top: 20px;
}

.fas {
  font-size: 22px;
}

.fas.fa-chevron-up {
  transform: rotate(180deg);
}

/* Carte de l'année */
.year-card {
  padding: 20px;
  background-color: #ffffff; /* Fond clair */
  border: 1px solid #ddd;
  border-radius: 12px; /* Coins arrondis */
  cursor: pointer;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

/* Effet de survol pour la carte de l'année */
.year-card:hover {
  background-color: #e3f2fd;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Carte active de l'année */
.year-card.active-card {
  background-color: #c5e1fa; /* Légère variation bleue claire */
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
}

/* Fin carte de consommations */
.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th, .data-table td {
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
  color: white;
}

.update-btn:hover {
  transform: scale(1.1);
}

.delete-btn {

  color: white;
}

.delete-btn:hover {
  transform: scale(1.1);
 
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
.btn-prev, .btn-next {
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
.btn-prev:hover, .btn-next:hover {
  background-color: #152bbd;
  transform: scale(1.1);
  box-shadow: 0 6px 10px rgba(0, 0, 0, 0.2);
}

/* Animation dynamique avec une légère rotation et translation */
.btn-prev:hover i, .btn-next:hover i {
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
.btn-prev:disabled, .btn-next:disabled {
  background-color: #ddd;
  cursor: not-allowed;
}

/* Ajoutez un effet de clic pour rendre l'interaction plus vive */
.btn-prev:active, .btn-next:active {
  transform: scale(0.95);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}



/* Top Icons */
.top-icons {
  position: fixed;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 15px;
  font-size: 24px;
  color: #007bff;
}

.top-icons i {
  cursor: pointer;
  transition: transform 0.2s;
}

.top-icons i:hover {
  transform: scale(1.2);
  color: #0056b3;
}


/* Exit Icon */
.exit-icon {
  background: transparent;
  border: none;
  position: absolute;
  top: 10px;
  right: 10px;
  cursor: pointer;
  font-size: 1.5rem;
  color: #333;
  pointer-events: auto;
  z-index: 999; /* Assure que l'icône soit au-dessus */
  transition: transform 0.3s ease, color 0.3s ease;
}


.exit-icon:hover {
  transform: rotate(90deg);
  color: #007bff;
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

.toast-message.fade-enter-active, .toast-message.fade-leave-active {
  opacity: 0;
}

.toast-message.fade-enter, .toast-message.fade-leave-to {
  opacity: 0;
}

/* Banniere de suppression d'une instance de consommation  */
.undo-banner{
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #222;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  box-shadow: 0px 4px 10px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  animation: fadeIn 0.3s ease-in-out;
}
.undo-banner p{
  margin: 0;
  font-size: 14px;
}
.undo-banner button{
  background: #ff4d4d;
  color: white;
  border: none;
  padding: 6px 12px;
  cursor: pointer;
  margin-left: 15px;
  border-radius: 5px;
  transition: 0.3s;
}
.undo-banner button:hover{
  background-color: #cc0000;
}
@keyframes fadeIn{
  from{
    opacity: 0;
    transform: translateX(-50%) translateY(10px);
  }
  to{
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}


</style>
