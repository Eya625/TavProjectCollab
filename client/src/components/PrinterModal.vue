<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click.self="cancel">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ isEdit ? 'Edit Printer' : 'Add New Printer' }}</h3>
          <font-awesome-icon
            icon="fa-times"
            class="close-icon"
            @click="cancel"
          />
        </div>
        <form @submit.prevent="submit">
          <div
            v-for="field in fields"
            :key="field.key"
            class="form-group"
          >
            <label :for="field.key">{{ field.label }}</label>

            <!-- Input (text, date, number...) -->
            <input
              v-if="field.type !== 'select'"
              :id="field.key"
              v-model="printer[field.key]"
              :type="field.type"
              :placeholder="field.placeholder || ''"
              :disabled="isEdit && field.key !== 'Status'"
              :title="isEdit && field.key !== 'Status' ? 'Cannot modify this entry' : ''"
            />

            <!-- Select (Type, Status…) -->
            <select
              v-else
              :id="field.key"
              v-model="printer[field.key]"
              :disabled="isEdit && field.key !== 'Status'"
              :title="isEdit && field.key !== 'Status' ? 'Cannot modify this entry' : ''"
            >
              <option
                v-for="opt in field.options"
                :key="opt"
                :value="opt"
              >
                {{ opt }}
              </option>
            </select>

            <p v-if="errors[field.key]" class="error">
              {{ errors[field.key] }}
            </p>
          </div>

          <div class="modal-actions">
            <button type="submit" class="btn btn-save">
              {{ isEdit ? 'Update' : 'Save' }}
            </button>
            <button
              type="button"
              class="btn btn-cancel"
              @click="cancel"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </transition>
</template>



<script>
export default {
  name: 'PrinterModal',
  // 1) on passe par modelValue pour Vue3
  props: {
    modelValue: {
      type: Boolean,
      required: true
    },
    initial: {
      type: Object,
      default: () => ({})
    },
    checkReferenceExists: {
      type: Function,
      required: true
    }
  },
  emits: [
    'update:modelValue', // pour v-model
    'save',
    'cancel'
  ],
  data() {
    const blank = {
      Printer_ID: '',
      Manufacturer: '',
      Model: '',
      Type: 'Laser',
      Location: '',
      Purchase_Date: '',
      Warranty_Expiry: '',
      Total_Pages: '',
      Network_IP: '',
      Status: 'Active',
      Department: ''
    };
    return {
      printer: { ...blank },
      blank,
      errors: {}
    };
  },
  computed: {
    visible() {
      return this.modelValue;
    },
    isEdit() {
      return !!this.initial._id;
    },
    fields() {
      return [
        { key: 'Printer_ID', label: 'Reference', type: 'text' },
        { key: 'Manufacturer', label: 'Manufacturer', type: 'text' },
        { key: 'Model', label: 'Model', type: 'text' },
        {
          key: 'Type',
          label: 'Type',
          type: 'select',
          options: ['Laser', 'Inkjet']
        },
        { key: 'Location', label: 'Location', type: 'text' },
        { key: 'Purchase_Date', label: 'Purchase Date', type: 'date' },
        { key: 'Warranty_Expiry', label: 'Warranty Expiry', type: 'date' },
        { key: 'Total_Pages', label: 'Total Pages', type: 'number' },
        { key: 'Network_IP', label: 'Network IP', type: 'text' },
        {
          key: 'Status',
          label: 'Status',
          type: 'select',
          options: ['Active', 'Inactive']
        },
        { key: 'Department', label: 'Department', type: 'text' }
      ];
    }
  },
  watch: {
    // ré-initialise à l’ouverture et à chaque changement de données initiales
    visible(val) {
      if (val) this.initForm();
    },
    initial: {
      deep: true,
      handler() {
        if (this.visible) this.initForm();
      }
    }
  },
  methods: {
    initForm() {
      this.errors = {};
      if (this.isEdit) {
        this.printer = { ...this.initial };
        ['Purchase_Date', 'Warranty_Expiry'].forEach((k) => {
          if (this.printer[k]) {
            const d = new Date(this.printer[k]);
            this.printer[k] = d.toISOString().substr(0, 10);
          }
        });
      } else {
        this.printer = { ...this.blank };
      }
    },
    validate() {
      this.errors = {};
      this.fields.forEach((f) => {
        const v = this.printer[f.key];
        if ((f.type === 'text' || f.type === 'date') && !v) {
          this.errors[f.key] = 'This field is required.';
        }
        if (f.key === 'Total_Pages') {
          const n = Number(v);
          if (v === '' || isNaN(n) || n < 0) {
            this.errors[f.key] = 'Must be a number ≥ 0';
          }
        }
        if (f.key === 'Network_IP' && v) {
          if (!/^(\d{1,3}\.){3}\d{1,3}$/.test(v)) {
            this.errors[f.key] = 'Invalid IP format';
          }
        }
      });
      return !Object.keys(this.errors).length;
    },
    async submit() {
      if (!this.validate()) return;

      // Vérifie si c’est un ajout (pas un edit)
      if (!this.isEdit) {
        const exists = await this.checkReferenceExists(this.printer.Printer_ID);
        if (exists) {
          this.errors.Printer_ID = 'This reference already exists.';
          return;
        }
      }

      const payload = {
        ...this.printer,
        Total_Pages: Number(this.printer.Total_Pages)
      };
      this.$emit('save', payload);
      this.$emit('update:modelValue', false);
    },

    cancel() {
      this.$emit('cancel');
      this.$emit('update:modelValue', false);
    }
  }
};
</script>
<style scoped>
/* === Transitions d’entrée/sortie === */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.4s ease;
}
.modal-fade-enter,
.modal-fade-leave-to {
  opacity: 0;
}

/* === Overlay === */
.modal-overlay {
  position: fixed;
  inset: 0;
  backdrop-filter: blur(6px);
  background: rgba(20, 20, 20, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-container {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  width: 500px;
  max-width: 90%;
  max-height: 90vh; /* max hauteur visible sans dépasser l'écran */
  padding: 30px;
  overflow-y: auto; /* scroll uniquement si besoin */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: fadeScale 0.4s ease;
}

@keyframes fadeScale {
  from {
    transform: scale(0.85);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

/* === Header du Modal === */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.modal-header h3 {
  font-size: 1.4rem;
  color: #fff;
}
.close-icon {
  cursor: pointer;
  font-size: 1.3rem;
  color: #fff;
  transition:
    transform 0.25s ease,
    color 0.2s;
}
.close-icon:hover {
  transform: rotate(90deg) scale(1.2);
  color: #f87171;
}

/* === Formulaire === */
.form-group {
  margin-bottom: 18px;
}
.form-group label {
  color: #f1f5f9;
  font-weight: 600;
  margin-bottom: 6px;
  display: block;
}
.form-group input,
.form-group select {
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: #f1f5f9;
  box-shadow: inset 0 0 4px rgba(255, 255, 255, 0.2);
  transition:
    background 0.3s ease,
    box-shadow 0.2s;
}
.form-group input:focus,
.form-group select:focus {
  background: rgba(255, 255, 255, 0.25);
  box-shadow: 0 0 0 2px #7dd3fc;
  outline: none;
}

.error {
  color: #ff6b6b;
  font-size: 0.85rem;
  margin-top: 4px;
}

/* === Actions boutons === */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 14px;
  margin-top: 24px;
}
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 30px;
  font-weight: bold;
  cursor: pointer;
  font-size: 0.95rem;
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}
.btn-save {
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  color: #fff;
  box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
}
.btn-cancel {
  background: linear-gradient(135deg, #f87171, #ef4444);
  color: #fff;
  box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
}
.btn:hover {
  transform: translateY(-2px) scale(1.03);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
}
</style>
