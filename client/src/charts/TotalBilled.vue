<template>
  <div class="chart-card">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
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
import apiService from '../services/apiServices';
import { PALETTE } from '../charts/palette';

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export default {
  name: 'TotalBilledChart',
  props: {
    veh: { type: String, default: '' }
  },
  data() {
    return {
      chartInstance: null,
      chartData: {
        labels: [],
        datasets: [{
          label: 'Montant facturé (TND)',
          data: [],
          borderColor: '',
          backgroundColor: '',
          borderWidth: 2,
          pointRadius: 4,
          tension: 0.3,
          fill: true
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
        // On suppose que getBilledByMonth renvoie [{ month: '2025-01', total: 1234 }, ...]
        const raw = await apiService.getBilledByMonth(v);
        this.chartData.labels = raw.map(r => r.month);
        this.chartData.datasets[0].data = raw.map(r => r.total);

        // palette TAV
        const col = PALETTE[0];
        this.chartData.datasets[0].borderColor = col;
        this.chartData.datasets[0].backgroundColor = col + '33';
        this.chartData.datasets[0].pointBackgroundColor = col;

        this.renderChart();
      } catch (e) {
        console.error('TotalBilledChart.fetchData error', e);
      }
    },
    renderChart() {
      if (this.chartInstance) this.chartInstance.destroy();
      const ctx = this.$refs.chartCanvas.getContext('2d');
      this.chartInstance = new Chart(ctx, {
        type: 'line',
        data: this.chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          layout: { padding: 16 },
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#fff', font: { size: 12 } }
            },
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.7)',
              titleColor: '#fff',
              bodyColor: '#fff',
              callbacks: {
                label: ctx => {
                  const val = ctx.parsed.y ?? 0;
                  return `${ctx.dataset.label}: ${val.toLocaleString()} TND`;
                }
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
  width: 100%;
  height: 350px;

  /* Fond translucide et style existant */
  background-color: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);

  /* ← Marges pour espacer chaque carte */
  margin: 1rem 0.5rem;
}

canvas {
  width: 100% !important;
  height: 100% !important;
  display: block;
}
</style>
