<template>
  <div class="chart-card">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script>
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title    // ← importer le plugin Title
} from 'chart.js';
import apiService from '../services/apiServices';
import { PALETTE } from '../charts/palette';

// Enregistrer tous les plugins nécessaires
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

export default {
  name: 'CostByBranchChart',
  props: { veh: String },
  data() {
    return {
      chartInstance: null,
      chartData: {
        labels: [],
        datasets: [{
          label: 'Coût par agence',
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.6,
          maxBarThickness: 40
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
      const raw = await apiService.getCostByBranch(v);
      this.chartData.labels = raw.map(r => r.branch);
      this.chartData.datasets[0].data = raw.map(r => r.total);
      this.chartData.datasets[0].backgroundColor = raw.map((_, i) =>
        PALETTE[i % PALETTE.length] + 'CC'
      );
      this.chartData.datasets[0].borderColor = raw.map((_, i) =>
        PALETTE[i % PALETTE.length]
      );
      this.renderChart();
    },
    renderChart() {
      if (this.chartInstance) this.chartInstance.destroy();
      const ctx = this.$refs.chartCanvas.getContext('2d');
      this.chartInstance = new Chart(ctx, {
        type: 'bar',
        data: this.chartData,
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          layout: { padding: 16 },
          plugins: {
            // 1. titre global
            title: {
              display: true,
              text: 'Coût par Agence',
              color: '#fff',
              font: { size: 16, weight: '600' },
              padding: { bottom: 10 }
            },
            // 2. afficher la légende
            legend: {
              display: true,
              position: 'bottom',
              labels: {
                color: '#fff',
                font: { size: 12 }
              }
            },
            // 3. tooltip
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.7)',
              titleColor: '#fff',
              bodyColor: '#fff',
              callbacks: {
                label: ctx => `${ctx.label}: ${ctx.parsed.x.toLocaleString()} TND`
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.2)' },
              ticks: {
                color: '#fff',
                font: { size: 12 },
                callback: v => v.toLocaleString('fr-FR') + ' TND'
              },
              // 4. titre axe X
              title: {
                display: true,
                text: 'Coût (TND)',
                color: '#fff',
                font: { size: 12 }
              }
            },
            y: {
              grid: { display: false },
              ticks: { color: '#fff', font: { size: 12 } },
              // 5. titre axe Y
              title: {
                display: true,
                text: 'Agence',
                color: '#fff',
                font: { size: 12 }
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
  background-color: rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.2);

  /* espace autour des cartes si besoin */
  margin: 1.5rem 2rem;
}

canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
