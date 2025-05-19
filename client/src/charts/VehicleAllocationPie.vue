<template>
  <div class="chart-card">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<!-- VehicleAllocationChart.vue -->
<script>
import {
  Chart,
  PieController,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import apiService from '../services/apiServices';
import { PALETTE } from '../charts/palette';

// Enregistrer tous les composants/plugins
Chart.register(PieController, ArcElement, Tooltip, Legend, Title);

export default {
  name: 'VehicleAllocationChart',
  props: {
    veh: { type: String, default: '' }
  },
  data() {
    return {
      chartInstance: null,
      chartData: {
        labels: [],
        datasets: [{
          label: 'Répartition véhicules',
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1
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
        const raw = await apiService.getAllocation(v);
        this.chartData.labels = raw.map(r => r.category);
        this.chartData.datasets[0].data = raw.map(r => r.count);
        this.chartData.datasets[0].backgroundColor = raw.map(
          (_, i) => PALETTE[i % PALETTE.length] + 'CC'
        );
        this.chartData.datasets[0].borderColor = PALETTE.map(c => c);
        this.renderChart();
      } catch (e) {
        console.error('VehicleAllocationChart.fetchData error', e);
      }
    },
    renderChart() {
      if (this.chartInstance) this.chartInstance.destroy();
      const ctx = this.$refs.chartCanvas.getContext('2d');
      this.chartInstance = new Chart(ctx, {
        type: 'pie',
        data: this.chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          layout: { padding: 16 },
          plugins: {
            title: {
              display: true,
              text: 'Répartition des Véhicules',
              color: '#fff',
              font: { size: 16, weight: '600' },
              padding: { bottom: 10 }
            },
            legend: {
              position: 'right',
              labels: { color: '#fff', font: { size: 12 } }
            },
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.7)',
              titleColor: '#fff',
              bodyColor: '#fff',
              callbacks: {
                label: ctx => `${ctx.label}: ${ctx.parsed.toLocaleString()}`
              }
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
  width: 100%;
  height: 350px;

  /* Fond translucide et style existant */
  background-color: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);

  /* ← Marges pour espacer chaque carte */
  margin: 1.5rem 0.1rem 0 -0.3rem;
}

canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
