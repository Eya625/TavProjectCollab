<template>
  <div class="chart-card">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>
<!-- AvgInvoiceChart.vue -->
<script>
import {
  Chart,
  DoughnutController,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';
import apiService from '../services/apiServices';
import { PALETTE } from '../charts/palette';

// Enregistrer tous les composants/plugins
Chart.register(DoughnutController, ArcElement, Tooltip, Legend, Title);

export default {
  name: 'AvgInvoiceChart',
  props: {
    veh: { type: String, default: '' }
  },
  data() {
    return {
      chartInstance: null,
      chartData: {
        labels: ['Moy. actuelle', 'Moy. il y a 1 an'],
        datasets: [{
          label: 'Moyenne facture',
          data: [0, 0],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 2,
          hoverOffset: 10
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
        const { avg, change } = await apiService.getAvgInvoice(v);
        const prevAvg = change != null ? +(avg / (1 + change/100)).toFixed(2) : 0;
        this.chartData.datasets[0].data = [avg, prevAvg];
        const [colCurr, colPrev] = [PALETTE[2], PALETTE[1]];
        this.chartData.datasets[0].backgroundColor = [
          colCurr + 'CC',
          colPrev + 'CC'
        ];
        this.chartData.datasets[0].borderColor = [colCurr, colPrev];
        this.renderChart();
      } catch (e) {
        console.error('AvgInvoiceChart.fetchData error', e);
      }
    },
    renderChart() {
      if (this.chartInstance) this.chartInstance.destroy();
      const ctx = this.$refs.chartCanvas.getContext('2d');
      this.chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: this.chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          layout: { padding: 16 },
          plugins: {
            title: {
              display: true,
              text: 'Moyenne des Factures',
              color: '#fff',
              font: { size: 16, weight: '600' },
              padding: { bottom: 10 }
            },
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
                  const val = ctx.parsed;
                  const total = ctx.chart._metasets[0].total;
                  const pct = ((val / total) * 100).toFixed(1);
                  return `${ctx.label}: ${val.toLocaleString()} TND (${pct}%)`;
                }
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
  margin: 2rem 2rem 0 1rem;
}

canvas {
  width: 100% !important;
  height: 100% !important;
}
</style>
