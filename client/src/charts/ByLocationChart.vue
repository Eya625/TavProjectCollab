<template>
  <div class="chart-card">
    <h3>Consommation par location ({{ year }})</h3>
    <canvas ref="ctx"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import api from '../services/apiServices';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

export default {
  name: 'ByLocationChart',
  props: {
    year:               { type: Number,  required: true },
    selectedEmployee:   { type: String,  default: '' },
    selectedLocations:  { type: Array,   default: () => [] },
    colors:             { type: Array,   default: () => [] }
  },
  setup(props) {
    const ctx = ref(null);
    let chartInstance = null;

    const buildChartData = (raw) => {
      const labels = raw.map(d => d._id);
      const values = raw.map(d => d.total);
      const backgroundColor = labels.map((_, i) =>
        props.colors[i % props.colors.length]
      );
      return { labels, values, backgroundColor };
    };

    const options = {
      responsive: true,
      cutout: '60%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#fff',
            font: { size: 12 }
          }
        },
        tooltip: {
          titleColor: '#fff',
          bodyColor: '#fff',
          backgroundColor: 'rgba(0,0,0,0.8)'
        }
      }
    };

    const draw = async () => {
      const rawData = await api.getByLocation(
        props.year,
        props.selectedEmployee,
        props.selectedLocations
      );
      const { labels, values, backgroundColor } = buildChartData(rawData);

      if (chartInstance) {
        chartInstance.destroy();
      }

      chartInstance = new Chart(ctx.value.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor,
            borderColor: '#fff',
            borderWidth: 2
          }]
        },
        options
      });
    };

    onMounted(draw);
    watch(
      [() => props.year, () => props.selectedEmployee, () => props.selectedLocations],
      draw,
      { deep: true }
    );

    return { ctx };
  }
};
</script>

<style scoped>
.chart-card {
  background: rgba(0, 0, 0, 0.8);
  padding: 1rem;
  border-radius: 0.75rem;
  color: #fff;
}

.chart-card h3 {
  margin: 0 0 0.5rem;
  color: #FFA500;
  font-size: 1.1rem;
  text-align: center;
}
</style>
