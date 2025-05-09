<template>
  <div class="chart-card">
    <h3>Consommation par mois ({{ year }})</h3>
    <canvas ref="ctx"></canvas>
  </div>
</template>

<script>
import { ref, onMounted, watch } from 'vue';
import {
  Chart,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
} from 'chart.js';
import api from '../services/apiServices';

// On n’a plus besoin du plugin Filler si on ne remplit pas l’aire
Chart.register(
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default {
  name: 'ByMonthChart',
  props: {
    year:               { type: Number,  required: true },
    selectedEmployee:   { type: String,  default: '' },
    selectedLocations:  { type: Array,   default: () => [] },
    selectedMonths:     { type: Array,   default: () => [] },
    colors:             { type: Array,   default: () => ['#FFA500'] } // orange par défaut
  },
  setup(props) {
    const ctx = ref(null);
    let chartInstance = null;

    const options = {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#fff' } },
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
          grid:  { color: 'rgba(255,255,255,0.2)' }
        }
      }
      // plus d'élément line.fill ici
    };

    const draw = async () => {
      const raw = await api.getByMonth(
        props.year,
        props.selectedEmployee,
        props.selectedLocations
      );
      const months = props.selectedMonths.length
        ? props.selectedMonths
        : Object.keys(raw);
      const values = months.map(m => raw[m] || 0);
      const color  = props.colors[0] || '#FFA500';

      if (chartInstance) {
        chartInstance.destroy();
      }
      chartInstance = new Chart(ctx.value.getContext('2d'), {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Consommation',
            data: values,
            borderColor: color,         // couleur de la ligne
            backgroundColor: 'transparent', // plus d’aire colorée
            fill: false,                // désactive le remplissage
            tension: 0.1,
            pointBackgroundColor: '#fff',
            pointBorderColor: color
          }]
        },
        options
      });
    };

    onMounted(draw);
    watch(
      [
        () => props.year,
        () => props.selectedEmployee,
        () => props.selectedLocations,
        () => props.selectedMonths
      ],
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
  height: 300px !important;
}
</style>
