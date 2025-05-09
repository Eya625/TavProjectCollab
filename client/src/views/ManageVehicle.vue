<template>
  <div>
    <!-- Navbar FIXE en dehors du conteneur de contenu -->
    <VehicleNavbar :notification-count="3" @show-notification="handleNotification" />

    <!-- Contenu décalé sous la navbar -->
    <div class="manage-container">
      <button class="add-btn" @click="openAddForm">+ Ajouter un véhicule</button>

      <transition name="fade-slide">
        <VehicleForm
          v-if="showForm"
          :vehicle="selectedVehicle"
          :isEditMode="isEditMode"
          @formSubmitted="handleFormSubmitted"
          @cancel="closeForm"
        />
      </transition>

      <VehicleList
        :vehicles="vehicles"
        @editVehicle="editVehicle"
        @deleteVehicle="promptDeleteVehicle"
      />

      <ConfirmModal
        v-if="showDeleteModal"
        :message="`Voulez-vous vraiment supprimer le véhicule N° ${vehicleToDelete?.N} ?`"
        @confirm="confirmDeletion"
        @cancel="cancelDeletion"
      />
    </div>
  </div>
</template>

<script>
import VehicleNavbar from '../components/VehicleNavbar.vue';
import VehicleForm from '../components/VehicleForm.vue';
import VehicleList from '../components/VehicleList.vue';
import ConfirmModal from '../components/ConfirmModal.vue';
import apiServices from '../services/apiServices';

export default {
  name: 'ManageVehicle',
  components: {
    VehicleNavbar,
    VehicleForm,
    VehicleList,
    ConfirmModal
  },
  data() {
    return {
      vehicles: [],
      showForm: false,
      selectedVehicle: null,
      isEditMode: false,
      showDeleteModal: false,
      vehicleToDelete: null,
    };
  },
  created() {
    this.fetchVehicles();
  },
  methods: {
    async fetchVehicles() {
      this.vehicles = await apiServices.getVehicles().catch(err => console.error(err));
    },
    openAddForm() {
      const nums = this.vehicles.map(v => v.N || 0);
      this.selectedVehicle = { N: (nums.length ? Math.max(...nums) : 0) + 1 };
      this.isEditMode = false;
      this.showForm = true;
    },
    editVehicle(v) {
      this.selectedVehicle = { ...v };
      this.isEditMode = true;
      this.showForm = true;
    },
    closeForm() {
      this.selectedVehicle = null;
      this.showForm = false;
    },
    promptDeleteVehicle(id) {
      this.vehicleToDelete = this.vehicles.find(v => v._id === id) || null;
      this.showDeleteModal = !!this.vehicleToDelete;
    },
    async confirmDeletion() {
      await apiServices.deleteVehicle(this.vehicleToDelete._id)
        .then(() => this.fetchVehicles())
        .catch(err => console.error(err));
      this.showDeleteModal = false;
    },
    cancelDeletion() {
      this.showDeleteModal = false;
    },
    async handleFormSubmitted() {
      this.closeForm();
      await this.fetchVehicles();
    },
    handleNotification() {
      // Remplacez par votre système de notifications
      alert("Opération réussie !");
    }
  }
};
</script>

<style scoped>
.manage-container {
    /* même valeur que la height de .navbar */
  padding: 20px;
  background: #ecf0f1;
  min-height: calc(100vh - 120px);
}

.add-btn {
  display: block;
  margin: 20px auto;
  background: #2c3e50;
  color: #fff;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}
.add-btn:hover {
  background: #34495e;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s ease;
}
.fade-slide-enter,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
