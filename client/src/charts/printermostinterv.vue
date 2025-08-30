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
import { PALETTE } from './palette'; // Palette de couleurs personnalisée

Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

export default {
  name: 'PrinterInterventionByDeptChart',
  data() {
    return {
      chartInstance: null,
      chartData: {
        labels: [],
        datasets: []
      }
    };
  },
  mounted() {
    this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        const raw = await apiService.getintervetions();
        // Exemple attendu : [{ month: '2025-01', departement: 'IT', count: 5 }, …]

        const allMonths = [...new Set(raw.map(r => r.month))].sort((a, b) => a.localeCompare(b));
        const departements = [...new Set(raw.map(r => r.departement))];

        const datasets = departements.map((dep, idx) => {
          const color = PALETTE[idx % PALETTE.length];
          return {
            label: dep,
            data: allMonths.map(month => {
              const entry = raw.find(r => r.month === month && r.departement === dep);
              return entry ? entry.count : 0;
            }),
            borderColor: color,
            backgroundColor: color + '33',
            pointBackgroundColor: color,
            borderWidth: 2,
            pointRadius: 4,
            tension: 0.2,
            fill: true
          };
        });

        this.chartData.labels = allMonths;
        this.chartData.datasets = datasets;
        this.renderChart();
      } catch (err) {
        console.error('fetchData error', err);
      }
    },
    renderChart() {
      if (this.chartInstance) {
        this.chartInstance.destroy();
      }
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
                label: ctx => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} interventions`
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
          },
          elements: {
            line: { tension: 0.2 },
            point: { radius: 4 }
          }
        }
      });
    }
  },
  beforeUnmount() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }
};
</script>

<style scoped>
.chart-card {
  width: 100%;
  height: 350px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  margin: 2rem 0.8rem 0 -0.1rem;
}
canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
