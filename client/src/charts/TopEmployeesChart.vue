<template>
  <div class="chart-card">
    <h3>Top 10 employés ({{ year }})</h3>
    <canvas ref="ctx"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import api from '../services/apiServices';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default {
  name: 'TopEmployeesChart',
  props: {
    year:               { type: Number,  required: true },
    selectedEmployee:   { type: String,  default: '' },
    selectedLocations:  { type: Array,   default: () => [] },
    colors:             { type: Array,   default: () => ['#FFA500'] }
  },
  setup(props) {
    const ctx = ref(null);
    let chartInstance = null;

    const options = {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          titleColor: '#fff',
          bodyColor: '#fff',
          backgroundColor: 'rgba(0,0,0,0.8)'
        }
      },
      scales: {
        x: {
          ticks: { color: '#fff' },
          grid:  { color: 'rgba(255,255,255,0.2)' }
        },
        y: {
          ticks: { color: '#fff' },
          grid:  { display: false }
        }
      }
    };

    const draw = async () => {
      const dataResp = await api.getTopEmployees(
        props.year,
        props.selectedEmployee,
        props.selectedLocations
      );
      const labels = dataResp.map(d => d._id);
      const values = dataResp.map(d => d.total);
      const backgroundColor = labels.map((_, i) =>
        props.colors[i % props.colors.length]
      );

      if (chartInstance) {
        chartInstance.destroy();
      }
      chartInstance = new Chart(ctx.value.getContext('2d'), {
        type: 'bar',
        data: { labels, datasets: [{ data: values, backgroundColor, borderColor: '#fff', borderWidth: 1 }] },
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
canvas {
  width: 100% !important;
  height: 400px !important;
}
</style>
