<template>
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <form @submit.prevent="handleSave">
            <h2>{{ isEditMode ? "Edit Consumption" : "Add Consumption" }}</h2>
          <!-- Champ caché pour l'ID -->
            <input v-model="localConsumption._id" type="hidden" />
        
            <!-- Champs du formulaire -->
            <label for="id">ID</label>
            <input v-model="localConsumption.id" type="text" id="id"  />
        
            <label for="employee">Employee</label>
            <input v-model="localConsumption.employ" type="text" id="employee" required />
        
            <label for="card_number">Card Number</label>
            <input v-model="localConsumption.card_number" type="text" id="card_number" required />
        
            <label for="department_code">Department Code</label>
            <input v-model="localConsumption.department_code" type="text" id="department_code"  required/>
        
            <label for="location">Location</label> 
            <input v-model="localConsumption.location" type="text" id="location"  required/>
        
            <label for="budget">Budget</label>
            <input v-model="localConsumption.budget" type="text" id="budget" required />

            <label for="monthly_limit">Monthly Limit</label>
            <input v-model="localConsumption.monthly_limit" type="Number" id="monthly_limit" required />
        
          <!-- Champs dynamiques pour chaque mois -->
          <div class="month-fields">
            <table class="monthly-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Consumption</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="month in filteredMonths" :key="month.key">
                  <td>{{ month.label }}</td>
                  <td>
                    <input
                      type="number" step="any"
                      :placeholder="'Consumption for ' + month.label"
                      v-model.number="localConsumption[month.key]"
                      class="form-control"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
    
          <!-- Boutons de sauvegarde et d'annulation -->
          <div class="modal-footer">
            <button type="submit" class="save-btn">Save</button>
            <button type="button" class="cancel-btn" @click="closeModal">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      showModal: {
        type: Boolean,
        default: false,
      },
      isEditMode: {
        type: Boolean,
        default: false,
      },
      consumption: {
        type: Object,
        default: () => ({}),
      },
    },
    data() {
      return {
        // Utilisation d'une variable locale pour modifier le formulaire sans toucher directement à la prop
        localConsumption: { ...this.consumption },
      };
    },
    watch: {
      // Lorsque la prop "consumption" change, mettre à jour la variable locale
      consumption: {
        handler(newVal) {
          this.localConsumption = { ...newVal };
        },
        immediate: true,
        deep: true,
      },
    },
    computed: {
      filteredMonths() {
        //const currentMonth = new Date().getMonth() + 1;
        const months = [
          { key: "jan2024", label: "January" },
          { key: "feb2024", label: "February" },
          { key: "mar2024", label: "March" },
          { key: "apr2024", label: "April" },
          { key: "may2024", label: "May" },
          { key: "jun2024", label: "June" },
          { key: "jul2024", label: "July" },
          { key: "aug2024", label: "August" },
          { key: "sep2024", label: "September" },
          { key: "oct2024", label: "October" },
          { key: "nov2024", label: "November" },
          { key: "dec2024", label: "December" },
        ];
        return months;
      },
    },
    methods: {
    saveConsumption() {
      this.$emit('save', this.editedConsumption);  
    },
      handleSave() {
        this.$emit("save", this.localConsumption);
        this.closeModal();
      },
      closeModal() {
        this.$emit("close");
      },
    },
  };
  </script>
  
  <style scoped>
  /* Overlay sombre couvrant tout l'écran */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  /* Contenu de la modal stylé comme une carte */
  .modal-content {
    background: #fff;
    padding: 30px;
    border-radius: 12px;
    width: 600px;
    max-width: 90%;
    max-height: 80vh;         
    overflow-y: auto;         /* Permet le défilement si le contenu est trop long */
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    border: 1px solid #e0e0e0;
    animation: fadeIn 0.4s ease-out;
  }
  
  /* Animation d'apparition */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  /* Titre du formulaire avec un style distinctif */
  .modal-content h2 {
    text-align: center;
    margin-bottom: 20px;
    font-size: 24px;
    color: #333;
    border-bottom: 2px solid #007bff;
    padding-bottom: 10px;
  }
  
  /* Labels du formulaire */
  .modal-content label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    color: #555;
  }
  
  /* Inputs du formulaire */
  .modal-content input[type="text"],
  .modal-content input[type="number"] {
    width: 100%;
    padding: 10px;
    margin-bottom: 15px;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 16px;
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
  }
  .modal-content input:focus {
    border-color: #007bff;
    box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
    outline: none;
  }
  
  /* Section des champs mensuels */
  .month-fields {
    margin-top: 20px;
  }
  .monthly-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  .monthly-table th,
  .monthly-table td {
    padding: 10px;
    border: 1px solid #eee;
    text-align: center;
  }
  .monthly-table th {
    background-color: #f7f7f7;
    font-weight: 600;
    color: #333;
  }
  
  /* Footer du modal avec boutons Save et Cancel */
  .modal-footer {
    display: flex;
    justify-content: space-around;
    margin-top: 20px;
  }
  .save-btn, .cancel-btn {
    padding: 10px 20px;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s ease;
  }
  .save-btn {
    background-color: #28a745;
    color: white;
  }
  .save-btn:hover {
    background-color: #218838;
    transform: scale(1.02);
  }
  .cancel-btn {
    background-color: #dc3545;
    color: white;
  }
  .cancel-btn:hover {
    background-color: #c82333;
    transform: scale(1.02);
  }
  </style>
  