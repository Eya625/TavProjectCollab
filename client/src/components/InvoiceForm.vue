<template>
  <div v-if="showModal" class="modal-overlay">
    <div class="modal-content">
      <form @submit.prevent="handleSave">
        <h2>{{ isEditMode ? "Edit Invoice" : "Add Invoice" }}</h2>

        <!-- Champs généraux -->
        <label for="invoiceType">Invoice Details </label>
        <input v-model="localInvoice.invoiceType" type="text" id="invoiceType" required />

        <label for="month">Month</label>
        <select v-model="localInvoice.month" id="month" required>
          <option value="">Select Month</option>
          <option value="Jan">Jan</option>
          <option value="Feb">Feb</option>
          <option value="Mar">Mar</option>
          <option value="Apr">Apr</option>
          <option value="May">May</option>
          <option value="Jun">Jun</option>
          <option value="Jul">Jul</option>
          <option value="Aug">Aug</option>
          <option value="Sep">Sep</option>
          <option value="Oct">Oct</option>
          <option value="Nov">Nov</option>
          <option value="Dec">Dec</option>
        </select>

        <!-- Totaux principaux -->
        <label for="grandTotal">Grand Total</label>
        <input v-model="localInvoice.grandTotal" step="0.001" type="number" id="grandTotal" readonly @input="updateTotals" />

        <label for="stampTax">Stamp Tax</label>
        <input v-model.number="localInvoice.stampTax"  step="0.001" type="number" id="stampTax" required @input="updateTotals" />

        <label for="totalWithTax">Total With Tax</label>
        <input v-model="localInvoice.totalWithTax" type="number"  step="0.001" id="totalWithTax" readonly @input="updateTotals"/>

        <!-- Tableau des régions et départements -->
        <h3>Regions and Departments</h3>
        <table>
          <thead>
            <tr>
              <th>Region</th>
              <th>Region Total</th>
              <th>Department Code</th>
              <th>Expense Amount</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="(regionData, regionName) in localInvoice.regions" :key="regionName">
              <tr v-for="(expense, deptCode, index) in regionData.departments" :key="deptCode">
                <td v-if="index === 0" :rowspan="Object.keys(regionData.departments).length">
                  {{ regionName }}
                </td>
                <td v-if="index === 0" :rowspan="Object.keys(regionData.departments).length">
                  <input v-model="regionData.regionTotal" type="number" readonly @input="updateTotals" />
                </td>
                <td>{{ deptCode }}</td>
                <td>
                  <input v-model.number="regionData.departments[deptCode]" type="number"  step="0.001" placeholder="Expense Amount" @input="updateTotals" />
                </td>
              </tr>
            </template>
          </tbody>
        </table>

        <!-- Boutons -->
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
    // La facture doit être passée depuis le parent et doit correspondre au modèle
    invoice: {
      type: Object,
      required: true,
    },
  },
  data() {
    // Pour l'ajout, si invoice n'a pas la structure attendue (notamment 'regions'), on l'initialise par défaut
    const defaultInvoice = {
      invoiceType: '',
      month: '',
      grandTotal: 0,
      stampTax: 0,
      totalWithTax: 0,
      regions: {
        HO: {
          regionTotal: 0,
          departments: {
            "100000": 0,
            "100200": 0,
            "100300": 0,
            "110501": 0,
            "111500": 0,
            "112500": 0,
            "120500": 0,
            "130400": 0,
            "150500": 0,
            "150501": 0,
            "150506": 0,
            "200100": 0,
          },
        },
        MIR: {
          regionTotal: 0,
          departments: {
            "150501": 0,
            "150506": 0,
            "201100": 0,
            "202101": 0,
            "240190": 0,
          },
        },
        NBE: {
          regionTotal: 0,
          departments: {
            "150501": 0,
            "150506": 0,
            "201101": 0,
            "240190": 0,
            "240211": 0,
            "260000": 0,
          },
        },
      },
    };
    return {
      localInvoice: Object.keys(this.invoice).length > 0 && this.invoice.regions
        ? { ...this.invoice }
        : defaultInvoice,
    };
  },
  watch: {
    invoice: {
      handler(newVal) {
        // Si la facture passée possède une structure (regions) alors on l'utilise, sinon on garde la structure par défaut
        if (newVal && Object.keys(newVal).length > 0 && newVal.regions) {
          this.localInvoice = { ...newVal };
        }
      },
      immediate: true,
      deep: true,
    },
  },
  watch: {
  'localInvoice.regions': {
    handler() {
      this.updateTotals(); // Met à jour les totaux en interne
      this.$emit('update-totals', this.localInvoice); // Envoie les données au parent
    },
    deep: true // Surveille les changements dans les objets imbriqués
  }
},

  methods: {
    handleSave() {
      this.formatAllDecimals();
      // Émettre la facture modifiée (les Maps resteront des objets simples lors de la transmission JSON)
      this.$emit('save', this.localInvoice);
      this.closeModal();
    },
    closeModal() {
      this.$emit('close');
    },
    formatDecimal(value) {
      if (value !== null && value !== undefined && !isNaN(value)) {
        return parseFloat(value).toFixed(3);
      }
      return value;
    },
    formatAllDecimals() {
      // Appliquer le format aux champs principaux
      this.localInvoice.grandTotal = this.formatDecimal(this.localInvoice.grandTotal);
      this.localInvoice.totalWithTax = this.formatDecimal(this.localInvoice.totalWithTax);

      // Appliquer le format aux régions et départements
      Object.values(this.localInvoice.regions).forEach((regionData) => {
        regionData.regionTotal = this.formatDecimal(regionData.regionTotal);
        Object.keys(regionData.departments).forEach((deptCode) => {
          regionData.departments[deptCode] = this.formatDecimal(regionData.departments[deptCode]);
        });
      });
    },
    updateTotals() {
      let grandTotal = 0;
      // Pour chaque région, calculer le total des dépenses et mettre à jour le regionTotal
      Object.keys(this.localInvoice.regions).forEach(region => {
        let regionTotal = 0;
        const departments = this.localInvoice.regions[region].departments;
        Object.keys(departments).forEach(deptCode => {
          const expense = parseFloat(departments[deptCode]) || 0;
          regionTotal += expense;
        });
        // Formater à 3 décimales pour le regionTotal
        this.localInvoice.regions[region].regionTotal = parseFloat(regionTotal.toFixed(3));
        grandTotal += regionTotal;
      });
      // Formater le grandTotal à 3 décimales
      this.localInvoice.grandTotal = parseFloat(grandTotal.toFixed(3));
      // Calculer le total with tax = grandTotal + stampTax
      const stampTax = parseFloat(this.localInvoice.stampTax) || 0;
      this.localInvoice.totalWithTax = parseFloat((grandTotal + stampTax).toFixed(3));
    },
  },
};
</script>






<style scoped>
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

.modal-content {
  background: #fff;
  padding: 30px;
  border-radius: 12px;
  width: 600px;
  max-width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  border: 1px solid #e0e0e0;
  animation: fadeIn 0.4s ease-out;
}

/* Animation d'apparition */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.modal-content h2 {
  text-align: center;
  margin-bottom: 20px;
  font-size: 24px;
  color: #333;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
}

.modal-content label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #555;
}

.modal-content input[type="text"],
.modal-content input[type="number"] {
  width: 80%;
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
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 8px;
  text-align: left;
  border: 1px solid #ddd;
}

thead {
  background-color: #f2f2f2;
}

.save-btn {
  background-color: #28a745;
  color: white;
}

.save-btn:hover {
  background-color: #218838;
}

.cancel-btn {
  background-color: #dc3545;
  color: white;
}

.cancel-btn:hover {
  background-color: #c82333;
}
</style>
