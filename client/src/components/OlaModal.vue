<template>
  <transition name="fade">
    <!-- parent unique -->
    <div>
      <!-- 1er enfant conditionnel -->
      <div v-if="isInvoiced" class="modal-alert">
        <p v-if="readonly">Invoice generated. Card is read-only.</p>
        <p v-else>
          Invoice generated. Card remains editable for the current year.
        </p>
      </div>

      <!-- 2ᵉ enfant -->
      <div class="aps-modal">
        <div class="modal-background" @click="$emit('close')"></div>
        <div class="modal-content">
          <h3>OLA Consumption Details for {{ data.employe }}</h3>

          <div class="consumption-table">
            <table>
              <thead>
                <tr>
                  <th v-for="month in months" :key="month">{{ month }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td v-for="(month, index) in months" :key="month">
                    <input type="number" v-model.number="data.consumptions[month]" :disabled="isDisabled(index)" :title="isDisabled(index)
                        ? 'You are not allowed to edit this month at this time.'
                        : ''
                      " />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="total">
            <label>Total Consumption: </label>
            <input type="number" :value="computedTotal" disabled />
          </div>
          <div class="modal-actions">
            <button v-if="!isReadOnlyMode" class="btn-save" @click="save">
              Save
            </button>
            <button class="btn-cancel" @click="$emit('close')">
              {{ isReadOnlyMode ? 'Close' : 'Cancel' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>
<script>
export default {
  props: {
    data: Object,
    year: Number,
    readonly: Boolean,
    isInvoiced: Boolean
  },
  data() {
    return {
      months: [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ],
      currentDate: new Date()
    };
  },
  computed: {
    currentMonthIndex() {
      return this.currentDate.getMonth();
    },
    currentYear() {
      return this.currentDate.getFullYear();
    },
    cardYear() {
      return Number(this.year);
    },
    isReadOnlyMode() {
      // Cas 1 & 3 : si carte antérieure sans facture ou carte de l'année courante → editable
      if (this.cardYear < this.currentYear && !this.isInvoiced) return false;
      if (this.cardYear === this.currentYear) return false;
      // Cas 2 : carte antérieure avec facture générée → readonly
      if (this.cardYear < this.currentYear && this.isInvoiced) return true;
      // Cas futur (sécurité) → readonly
      return true;
    },
    computedTotal() {
      return this.months.reduce(
        (sum, m) => sum + (Number(this.data.consumptions[m]) || 0),
        0
      );
    }
  },
  watch: {
    computedTotal(newTotal) {
      this.data.totalConsumption = newTotal;
    }
  },
  methods: {
    isDisabled(index) {
      // 1) Si on est en lecture seule (case 2) → tout désactivé
      if (this.readonly) {
        return true;
      }
      // 2) Sinon, si on est dans l'année courante → seuls les mois futurs sont désactivés
      if (this.cardYear === this.currentYear) {
        return index > this.currentMonthIndex;
      }
      // 3) Sinon (case 1 : année antérieure non facturée) → tout éditable
      return false;
    },
    save() {
      this.data.totalConsumption = this.computedTotal;
      this.$emit('save', this.data);
    }
  }
};
</script>

<style scoped>
/* Transition avec effet de scaling */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Conteneur du modal centré en full-screen avec Flexbox */
.aps-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

/* Arrière-plan sombre lors de l'ouverture du modal */
.modal-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  /* Voile sombre */
  z-index: 900;
}

/* Contenu du modal avec design sombre, dégradé, et animation "pop-in" */
.modal-content {
  position: relative;
  z-index: 1001;
  background: linear-gradient(135deg, #2c3e50, #34495e);
  padding: 30px;
  border-radius: 12px;
  width: 100vw;
  height: 50vh;
  /* largeur étendue pour tous les champs */
  max-width: 1400px;
  /* limite pour grands écrans */
  max-height: 250vh;
  overflow-y: auto;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.6);
  text-align: center;
  animation: popIn 0.7s cubic-bezier(0.25, 1, 0.5, 1);
  color: #0c0e0f;
  /* texte clair */
}

/* Animation d'apparition "pop-in" */
@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.85) translateY(-20px);
  }

  60% {
    opacity: 1;
    transform: scale(1.05);
  }

  100% {
    transform: scale(1);
  }
}

/* Style de la table dans le modal */
.consumption-table table {
  width: 100%;
  border-collapse: collapse;
}

.consumption-table th,
.consumption-table td {
  padding: 12px;
  border: 1px solid #7f8c8d;
  text-align: center;
}

/* Style des inputs de consommation */
.consumption-table input[type='number'] {
  width: 90px;
  padding: 8px;
  border: 1px solid #95a5a6;
  border-radius: 6px;
  transition:
    box-shadow 0.3s,
    border-color 0.3s;
  background: #ffffff;
  color: #06182a;
}

.consumption-table input[type='number']:focus {
  outline: none;
  border-color: #1abc9c;
  box-shadow: 0 0 8px rgba(26, 188, 156, 0.8);
}

.total {
  margin-top: 20px;
}

.total input {
  height: 28px;
  border-radius: 8px;
  color: black;
}

/* Section Total */
.total-consumption {
  margin-top: 30px;
  font-size: 20px;
}

/* Boutons d'action avec effets de hover */
.modal-actions {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
}

.btn-save,
.btn-cancel {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: bold;
  transition:
    background 0.3s,
    transform 0.3s;
}

.btn-save {
  background: #1abc9c;
  color: #2c3e50;
}

.btn-save:hover {
  background: #16a085;
  transform: scale(1.05);
}

.btn-cancel {
  background: #e74c3c;
  color: #ecf0f1;
}

.btn-cancel:hover {
  background: #c0392b;
  transform: scale(1.05);
}
</style>
