
// CostByBranchChart.vue
<template>
  <div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>
<script>
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);
export default {
  name: 'CostByBranchChart',
  props: { chartData: { type: Object, required: true } },
  data() { return { chartInstance: null }; },
  mounted() { this.renderChart(); },
  methods: {
    renderChart() {
      if (this.chartInstance) this.chartInstance.destroy();
      this.chartInstance = new Chart(this.$refs.chartCanvas, {
        type: 'bar',
        data: this.chartData,
        options: {
          indexAxis: 'y',
          responsive: true,
          animation: false,
          plugins: { legend: { position: 'bottom' } },
          scales: { x: { beginAtZero: true, grid: { color: '#eee' } }, y: { grid: { display: false } } }
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