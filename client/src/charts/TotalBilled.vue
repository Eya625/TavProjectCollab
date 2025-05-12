
// TotalBilledChart.vue
<template>
  <div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>
<script>
import { Chart, LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(LineController, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);
export default {
  name: 'TotalBilledChart',
  props: { chartData: { type: Object, required: true } },
  data() { return { chartInstance: null }; },
  mounted() { this.renderChart(); },
  methods: {
    renderChart() {
      if (this.chartInstance) this.chartInstance.destroy();
      this.chartInstance = new Chart(this.$refs.chartCanvas, {
        type: 'line',
        data: this.chartData,
        options: {
          responsive: true,
          animation: false,
          plugins: { legend: { position: 'bottom' } },
          scales: { x: { grid: { display: false } }, y: { beginAtZero: true } }
        }
      });
    }
  },
  watch: { chartData: { handler() { this.renderChart(); }, deep: true } },
  beforeDestroy() { if (this.chartInstance) this.chartInstance.destroy(); }
};
</script>
<style scoped>
canvas { max-width: 100%; }
</style>
