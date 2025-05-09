<template>
  <div class="vehicle-form">
    <h2>{{ isEditMode ? 'Modifier le véhicule' : 'Ajouter un véhicule' }}</h2>
    <form @submit.prevent="submitForm">
      <div>
        <label>N°:</label>
        <input type="number" v-model="formData.N" disabled />
      </div>
      <div>
        <label>Assigned To:</label>
        <input type="text" v-model="formData.assignedTo" required />
      </div>
      <div>
        <label>Brunch:</label>
        <select v-model="formData.Brunch" required>
          <option disabled value="">Veuillez sélectionner</option>
          <option value="HO">HO</option>
          <option value="NBE">NBE</option>
          <option value="MIR">MIR</option>
        </select>
      </div>
      <div>
        <label>Model:</label>
        <input type="text" v-model="formData.model" required />
      </div>
      <div>
        <label>Year:</label>
        <input type="number" v-model="formData.year" required />
      </div>
      <div>
        <label>Date of 1st Registration:</label>
        <input type="date" v-model="formData.dateOf1stRegistration" required />
      </div>
      <div>
        <label>Registration Number:</label>
        <input type="text" v-model="formData.registrationNumber" required />
      </div>
      <div>
        <label>Allocation:</label>
        <div>
          <label>
            <input type="radio" value="Airside" v-model="formData.allocation" />
            Airside
          </label>
          <label style="margin-left: 10px;">
            <input type="radio" value="Landside" v-model="formData.allocation" />
            Landside
          </label>
        </div>
      </div>

      <!-- Affichage des messages d'erreur -->
      <div v-if="Object.keys(errors).length" class="errors">
        <ul>
          <li v-for="(msg, field) in errors" :key="field">{{ msg }}</li>
        </ul>
      </div>
  
      <button type="submit">{{ isEditMode ? 'Mettre à jour' : 'Ajouter' }}</button>
      <button type="button" @click="$emit('cancel')">Annuler</button>
    </form>
  </div>
</template>
  
<script>
import apiServices from '../services/apiServices';

export default {
  name: 'VehicleForm',
  props: {
    vehicle: {
      type: Object,
      default: null,
    },
    isEditMode: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      formData: {
        N: null,
        assignedTo: '',
        Brunch: '',
        model: '',
        year: null,
        dateOf1stRegistration: '',
        registrationNumber: '',
        allocation: '',
      },
      errors: {} // Objet pour stocker les messages d'erreur
    };
  },
  created() {
    this.initializeFormData();
  },
  watch: {
    vehicle: {
      handler() {
        this.initializeFormData();
      },
      immediate: true,
      deep: true,
    }
  },
  methods: {
    initializeFormData() {
      if (this.isEditMode && this.vehicle) {
        // Mode modification : pré-remplissage du formulaire
        this.formData = { ...this.vehicle };
        if (this.formData.dateOf1stRegistration) {
          this.formData.dateOf1stRegistration = new Date(this.formData.dateOf1stRegistration)
            .toISOString()
            .substr(0, 10);
        }
      } else {
        // Mode ajout : initialiser le formulaire avec des valeurs par défaut
        this.formData = {
          N: this.vehicle && this.vehicle.N ? this.vehicle.N : null,
          assignedTo: '',
          Brunch: '',
          model: '',
          year: null,
          dateOf1stRegistration: '',
          registrationNumber: '',
          allocation: '',
        };
      }
      this.errors = {};
    },
    async submitForm() {
      // Réinitialiser les erreurs à chaque soumission
      this.errors = {};
      let valid = true;
      const today = new Date();
      
      // Vérification du champ dateOf1stRegistration
      if (this.formData.dateOf1stRegistration) {
        const registrationDate = new Date(this.formData.dateOf1stRegistration);
        if (registrationDate > today) {
          this.errors.dateOf1stRegistration = "La date de première immatriculation ne peut pas dépasser la date d'aujourd'hui.";
          valid = false;
        }
        // Vérifier que l'année du champ correspond à celle de la date de première immatriculation
        const registrationYear = registrationDate.getFullYear();
        if (this.formData.year && parseInt(this.formData.year) !== registrationYear) {
          this.errors.year = "L'année doit correspondre à l'année de la date de première immatriculation.";
          valid = false;
        }
      } else {
        this.errors.dateOf1stRegistration = "Le champ date de première immatriculation est requis.";
        valid = false;
      }
      
      // Vérifier que le champ allocation (radio button) est bien rempli
      if (!this.formData.allocation) {
        this.errors.allocation = "Veuillez sélectionner une allocation (Airside ou Landside).";
        valid = false;
      }
      
      // Si une erreur est détectée, interrompre la soumission
      if (!valid) {
        return;
      }
      
      try {
        if (this.isEditMode) {
          // Mise à jour du véhicule existant
          await apiServices.updateVehicle(this.vehicle._id, this.formData);
        } else {
          // Ajout d’un nouveau véhicule
          await apiServices.addVehicle(this.formData);
        }
        this.$emit('formSubmitted');
      } catch (error) {
        console.error("Erreur lors de la soumission du formulaire:", error);
      }
    }
  }
};
</script>  
  <style scoped>
  .vehicle-form {
    border: 1px solid #ccc;
    padding: 20px;
    margin-top: 20px;
  }
  .vehicle-form div {
    margin-bottom: 10px;
  }
  label {
    display: inline-block;
    width: 150px;
  }
  .errors {
  color: red;
  margin: 10px 0;
}
  .error-messages{
    color: red;
    margin-top: 10px;
  }
  </style>
  