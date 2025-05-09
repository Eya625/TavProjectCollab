<template>
  <div class="chart-card">
    <label>Carte</label>
    <input v-model="card" placeholder="Numéro de carte" />

    <label>Mois</label>
    <select v-model="month">
      <option v-for="m in months" :key="m">{{ m }}</option>
    </select>

    <button @click="fetchInvoice">Voir</button>

    <div v-if="result">
      {{ result.cardNumber }} — {{ result.month }} : {{ result.consumption }}
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import api from '../services/apiServices';

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default {
  props: {
    year:              Number,
    selectedEmployee:  String,
    selectedLocations: Array
  },
  setup(props) {
    const card   = ref('');
    const month  = ref(MONTHS[0]);
    const result = ref(null);

    const fetchInvoice = async () => {
      result.value = await api.getInvoice(
        props.year,
        month.value,
        card.value,
        props.selectedEmployee,
        props.selectedLocations
      );
    };

    return { card, month, months: MONTHS, result, fetchInvoice };
  }
};
</script>


  
  <style scoped>
  .invoice-card {
    max-width: 300px; margin: auto; padding: 16px; border:1px solid #ccc; border-radius:4px;
  }
  .invoice-card label { display:block; margin-top:8px; }
  .invoice-card input, .invoice-card select {
    width:100%; padding:4px; margin-top:4px;
  }
  .invoice-card button { margin-top:12px; padding:6px 12px; }
  </style>
  