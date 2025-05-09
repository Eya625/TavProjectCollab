<template>
  <div class="total-card">
    <h3>{{ title }}</h3>
    <p class="value">{{ formattedValue }}</p>
    <span class="unit">Dinars</span>
  </div>
</template>

<script>
import { ref, watch, onMounted, computed } from 'vue';
import api from '../services/apiServices';

export default {
  name: 'TotalConsumptionCard',
  props: {
    year:              { type: Number, default: new Date().getFullYear() },
    selectedMonths:    { type: Array,  default: () => [] },
    selectedEmployee:  { type: String, default: '' },
    selectedLocations: { type: Array,  default: () => [] }
  },
  setup(props) {
    const total = ref(0);

    const fetchTotal = async () => {
      if (props.selectedMonths.length) {
        const result = await api.getByMonth({
          year: props.year,
          employee: props.selectedEmployee,
          locations: props.selectedLocations
        });
        total.value = props.selectedMonths.reduce(
          (sum, m) => sum + (result[m] || 0),
          0
        );
      } else {
        const doc = await api.getYearlyConsumption({
          year: props.year,
          employee: props.selectedEmployee,
          locations: props.selectedLocations
        });
        total.value = doc.totalConsumption || 0;
      }
    };

    watch(
      () => [props.year, props.selectedMonths, props.selectedEmployee, props.selectedLocations],
      fetchTotal,
      { deep: true }
    );
    onMounted(fetchTotal);

    const formattedValue = computed(() =>
      total.value.toLocaleString(undefined, { minimumFractionDigits: 2 })
    );
    const title = computed(() =>
      props.selectedMonths.length
        ? `Total ${props.selectedMonths.join(', ')} ${props.year}`
        : `Total ${props.year}`
    );

    return { formattedValue, title };
  }
};
</script>

<style scoped>
.total-card {
  background: rgba(0, 0, 0, 0.7);   /* fond plus sombre */
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 1rem;
  padding: 1.5rem;
  text-align: center;
  color: #fff;                       /* texte blanc */
  backdrop-filter: blur(6px);
}

.total-card h3 {
  margin: 0;
  color: #FFA500;                    /* accent orange */
  font-size: 1.3rem;
  font-weight: 600;
}

.total-card .value {
  margin: 0.5rem 0;
  font-size: 2.5rem;
  font-weight: bold;
  color: #fff;                       /* valeur en blanc */
}

.total-card .unit {
  font-size: 1rem;
  color: #fff;                       /* unité en blanc */
}
</style>
