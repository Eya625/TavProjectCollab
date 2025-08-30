<template>
  <div class="chart-card">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>
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

Chart.register(PieController, ArcElement, Tooltip, Legend, Title);

Chart.defaults.color = '#fff';
Chart.defaults.plugins.legend.labels.color = '#fff';

export default {
  name: 'VehicleAllocationChart',
  props: { veh: { type: String, default: '' } },
  data() {
    return {
      chartInstance: null,
      chartData: {
        labels: ['Airside', 'Landside'],
        datasets: [{
          label: 'Répartition',
          data: [0, 0],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 1
        }]
      }
    };
  },
  mounted() {
    this.$watch(() => this.veh, v => this.fetchData(v), { immediate: true });
  },
  methods: {
    async fetchData(v) {
      try {
        const raw = await apiService.getAllocation(v);
        // On prépare un objet compteur initialisé à zéro
        const counts = { Airside: 0, Landside: 0 };

        raw.forEach(r => {
          const alloc = String(r.allocation || '').trim();
          const lc = alloc.toLowerCase();
          if (lc.includes('airside')) counts.Airside += r.count || 0;
          else if (lc.includes('landside')) counts.Landside += r.count || 0;
          else {
            // si jamais d'autres catégories apparaissent :
            counts[alloc] = (counts[alloc] || 0) + (r.count || 0);
            if (!this.chartData.labels.includes(alloc)) {
              this.chartData.labels.push(alloc);
            }
          }
        });

        // On alimente data et couleurs en se basant sur chartData.labels
        this.chartData.datasets[0].data = this.chartData.labels.map(
          lbl => counts[lbl] || 0
        );
        this.chartData.datasets[0].backgroundColor = this.chartData.labels.map(
          (_, i) => PALETTE[i % PALETTE.length] + 'CC'
        );
        this.chartData.datasets[0].borderColor = this.chartData.labels.map(
          (_, i) => PALETTE[i % PALETTE.length]
        );

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
          layout: { padding: 16 },
          plugins: {
            title: {
              display: true,
              text: 'Distribution of Vehicles',
              color: '#fff',
              font: { size: 16, weight: '600' },
              padding: { bottom: 10 }
            },
            legend: {
              display: true,
              position: 'right',
              labels: {
                color: '#fff',
                generateLabels: chart => {
                  const ds = chart.data.datasets[0];
                  return chart.data.labels.map((lbl, i) => ({
                    text: lbl,
                    fillStyle: ds.backgroundColor[i],
                    strokeStyle: ds.borderColor[i],
                    lineWidth: ds.borderWidth,
                    hidden: false,
                    index: i,
                    pointStyle: 'circle',
                    boxWidth: 12,
                    fontColor: '#fff' 

                  }));
                },
                color: '#fff',
                font: { size: 12 },
                usePointStyle: true,
                padding: 8
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.7)',
              titleColor: '#fff',
              bodyColor: '#fff',
              callbacks: {
                label: ctx => {
                  const lbl = ctx.chart.data.labels[ctx.dataIndex];
                  const val = ctx.parsed;
                  // Affiche "Airside: 12" ou "Landside: 8"
                  return `${lbl}: ${val.toLocaleString()}`;
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
  background-color: rgba(2, 2, 20, 0.356);
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
