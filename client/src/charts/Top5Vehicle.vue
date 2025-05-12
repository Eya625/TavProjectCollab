
// Top5VehiclesChart.vue
<template>
  <div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>
<script>
import { Chart, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);
export default {
  name: 'Top5VehiclesChart',
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
          responsive: true,
          animation: false,
          plugins: { legend: { display: false } },
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