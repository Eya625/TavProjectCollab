<template>
  <div class="chart-card">
    <h3>Évolution YoY ({{ selectedYear }})</h3>
    <table class="yoy-table">
      <thead>
        <tr>
          <th>Mois</th>
          <th>{{ selectedYear - 1 }}</th>
          <th>{{ selectedYear }}</th>
          <th>Variation %</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in data" :key="row.month">
          <td>{{ row.month }}</td>
          <td>{{ row[selectedYear - 1] }}</td>
          <td>{{ row[selectedYear] }}</td>
          <td :class="{'positive': row.variation > 0, 'negative': row.variation < 0}">
            {{ row.variation != null ? row.variation + '%' : '' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import api from '../services/apiServices';

export default {
  name: 'YoYTable',
  props: {
    selectedYear:      { type: Number, default: new Date().getFullYear() },
    selectedEmployee:  { type: String, default: '' },
    selectedLocations: { type: Array,  default: () => [] }
  },
  setup(props) {
    const data = ref([]);

    const fetch = async () => {
      data.value = await api.getYoYFuelVariation(
        props.selectedYear,
        props.selectedEmployee,
        props.selectedLocations
      );
    };

    onMounted(fetch);
    watch(
      [() => props.selectedYear, () => props.selectedEmployee, () => props.selectedLocations],
      fetch,
      { deep: true }
    );

    return { data };
  }
};
</script>

<style scoped>
.chart-card {
  background: rgba(0, 0, 0, 0.6);
  padding: 1rem;
  border-radius: 0.75rem;
  color: #fff;
}
.chart-card h3 {
  margin: 0 0 0.5rem;
  color: #FFA500;
  text-align: center;
}
.yoy-table {
  width: 100%;
  border-collapse: collapse;
  color: #fff;             /* valeurs en blanc */
}
.yoy-table th, .yoy-table td {
  padding: 8px;
  border-bottom: 1px solid rgba(255,255,255,0.2);
  text-align: center;
}
.yoy-table th {
  background: rgba(255,165,0,0.8);
  color: #000;
}
.yoy-table td {
  background: rgba(255,255,255,0.05);
  color: #505050;             /* forcer les cellules en blanc */
}
.yoy-table .positive {
  color: #FF4500;
}
.yoy-table .negative {
  color:  #00FF00;
}
</style>
