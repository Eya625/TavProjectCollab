
// AvgInvoiceChart.vue
<template>
  <div>
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>
<script>
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);
export default {
  name: 'AvgInvoiceChart',
  props: { chartData: { type: Object, required: true } },
  data() { return { chartInstance: null }; },
  mounted() { this.renderChart(); },
  methods: {
    renderChart() {
      if (this.chartInstance) this.chartInstance.destroy();
      this.chartInstance = new Chart(this.$refs.chartCanvas, {
        type: 'doughnut',
        data: this.chartData,
        options: { responsive: true, animation: false, plugins: { legend: { position: 'bottom' } } }
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