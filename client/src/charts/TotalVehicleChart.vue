<template>
  <div class="chart-card">
    <div class="chart-header">
      <h3 class="chart-title">Total Véhicules</h3>
    </div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import apiService from '../services/apiServices';
import { PALETTE } from '../charts/palette';

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default {
  name: 'TotalVehicleChart',
  props: {
    veh: { type: String, default: '' }
  },
  data() {
    return {
      chartInstance: null,
      chartData: {
        labels: ['Total véhicules'],
        datasets: [{
          label: 'Total véhicules',
          data: [0],
          backgroundColor: '',
          borderColor: '',
          borderWidth: 2,
          borderRadius: 6,
          barPercentage: 0.6,
          maxBarThickness: 50
        }]
      }
    };
  },
  mounted() {
    this.$watch(
      () => this.veh,
      v => this.fetchData(v),
      { immediate: true }
    );
  },
  methods: {
    async fetchData(v) {
      try {
        const count = await apiService.getTotalVehicles(v);
        this.chartData.datasets[0].data = [count];

        // palette TAV
        const col = PALETTE[1];
        this.chartData.datasets[0].backgroundColor = col + 'CC';
        this.chartData.datasets[0].borderColor = col;

        this.renderChart();
      } catch (err) {
        console.error('TotalVehicleChart.fetchData error', err);
      }
    },
    renderChart() {
      if (this.chartInstance) this.chartInstance.destroy();
      const ctx = this.$refs.chartCanvas.getContext('2d');
      this.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: this.chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          layout: { padding: 16 },
          plugins: {
            title: {
      display: true,
      text: 'Total des Véhicules',
      color: '#fff',
      font: { size: 16, weight: '600' },
      padding: { bottom: 10 }
    },
            legend: { display: true },
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.7)',
              titleColor: '#fff',
              bodyColor: '#fff',
              callbacks: {
                label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#fff', font: { size: 12 } }
            },
            y: {
              beginAtZero: true,
              grid: { color: 'rgba(255,255,255,0.2)' },
              ticks: { color: '#fff', font: { size: 12 } }
            }
          }
        }
      });
    }
  },
  beforeUnmount() {
    if (this.chartInstance) this.chartInstance.destroy();
  }
};
</script>
<style scoped>
.chart-card {
  /* Retire la hauteur fixe */
  /* height: 350px; */
  min-height: 300px;               /* hauteur minimale */
  background-color: rgba(255,255,255,0.1);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 1rem;                   /* 16px */
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);

  /* espace autour de chaque carte */
  margin: 1rem;

  /* flex pour organiser header + canvas */
  display: flex;
  flex-direction: column;
}

.chart-header {
  margin-bottom: 1rem;
}

.chart-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.05em;
}

/* canvas remplit le reste de la carte */
canvas {
  flex: 1;
  width: 100% !important;
  /* on retire le calc puisque flex gère la hauteur */
  /* height: calc(100% - 2rem) !important; */
  display: block;
}
</style>
