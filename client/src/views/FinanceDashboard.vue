<template>
  <div class="dashboard-root">
    <!-- Sidebar filter -->
    <aside class="sidebar">
      <div class="filter-header">
        <i class="fas fa-car-side"></i>
        <h2>Filtrer Véhicule</h2>
      </div>
      <VehicleFilter v-model="selectedVehicle" />
    </aside>

    <!-- Main content -->
    <main class="main">
      <!-- Header -->
      <div class="main-header">
        <h1><i class="fas fa-chart-line"></i>  Financial Dashboard</h1>
        <time>{{ today }}</time>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-cards">
        <div class="card kpi-card">
          <div class="card-header kv-blue"><i class="fas fa-car"></i></div>
          <div class="card-body">
            <h3>Vehicle Totals</h3>
            <p class="kpi-value">{{ totalVehicleCount.toLocaleString('fr-FR') }}</p>
          </div>
        </div>
        <div class="card kpi-card">
          <div class="card-header kv-lightblue"><i class="fas fa-euro-sign"></i></div>
          <div class="card-body">
            <h3>Total Billed (TND)</h3>
<p class="kpi-value">
  {{ totalBilledSum.toLocaleString('en-US') }}
</p>
          </div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="charts-grid">
        <VehicleAllocationChart :veh="selectedVehicle" />
        <Top5VehiclesChart      :veh="selectedVehicle" />
        <CostByBranchChart      :veh="selectedVehicle" />
        <InvoiceByMonthChart    :veh="selectedVehicle" />
        <AvgInvoiceChart        :veh="selectedVehicle" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import apiService from '../services/apiServices';
import VehicleFilter from '../charts/VehicleFilter.vue';
import VehicleAllocationChart from '../charts/VehicleAllocationPie.vue';
import Top5VehiclesChart from '../charts/Top5Vehicle.vue';
import CostByBranchChart from '../charts/CostByBranch.vue';
import InvoiceByMonthChart from '../charts/InvoiceByMonth.vue';
import AvgInvoiceChart from '../charts/AvgInvoice.vue';

const selectedVehicle = ref('');
const totalVehicleCount = ref(0);
const totalBilledSum = ref(0);

async function loadKPIs() {
  totalVehicleCount.value = await apiService.getTotalVehicles(selectedVehicle.value);
  const result = await apiService.getTotalBilled(selectedVehicle.value);
  totalBilledSum.value = result.total ?? result;
}

watch(selectedVehicle, loadKPIs);
onMounted(loadKPIs);

const today = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
</script>
<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  font-family: 'Segoe UI', sans-serif;
  background: linear-gradient(135deg,
    rgba(12, 20, 44, 0.8),
    rgba(4, 12, 32, 0.8));
  animation: backgroundShift 15s ease infinite;
}

@keyframes backgroundShift {
  0%   { background: linear-gradient(135deg, rgba(12,20,44,0.8), rgba(4,12,32,0.8)); }
  50%  { background: linear-gradient(135deg, rgba(4,12,32,0.8), rgba(12,20,44,0.8)); }
  100% { background: linear-gradient(135deg, rgba(12,20,44,0.8), rgba(4,12,32,0.8)); }
}

/* Sidebar */
.sidebar {
  width: 230px;
  background: rgba(8, 16, 36, 0.95);
  color: #e0f7fa;
  padding: 1.5rem;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.7);
  transition: background 0.3s ease;
}
.sidebar:hover {
  background: rgba(10, 24, 48, 0.95);
}
.filter-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}
.filter-header i {
  font-size: 1.6rem;
  margin-right: 0.75rem;
  color: #81d4fa;
  transition: color 0.3s;
}
.filter-header:hover i {
  color: #b2ebf2;
}
.filter-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
  color: #b2ebf2;
}

/* Main */
.main {
  flex: 1;
  padding: 2.5rem;
  background: rgba(2, 8, 20, 0.5);
  backdrop-filter: blur(6px);
  animation: fadeIn 1s ease-out;
}

/* Header */
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2.5rem;
}
.main-header h1 {
  display: flex;
  align-items: center;
  font-size: 2rem;
  color: #4dd0e1;
  font-weight: 600;
}
.main-header time {
  font-style: italic;
  color: #90a4ae;
}

/* KPI Cards */
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}
.kpi-card {
  background: rgba(6, 16, 36, 0.6);
  border: 1px solid rgba(77, 182, 172, 0.3);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.7);
  transition: transform 0.3s, background 0.3s;
}
.kpi-card:hover {
  transform: translateY(-6px);
  background: rgba(6, 16, 36, 0.8);
}
.card-header {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.9rem;
  color: #b2ebf2;
}
.kv-blue    { background-color: rgba(4, 116, 144, 0.8); }
.kv-lightblue { background-color: rgba(3, 155, 229, 0.8); }
.card-body {
  padding: 1.25rem;
  text-align: center;
}
.kpi-value {
  margin-top: 0.5rem;
  font-size: 2.4rem;
  font-weight: 700;
  color: #80deea;
}

/* Charts Grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.5rem;
  padding: 1rem;
}

/* Chart Card */
.chart-card {
  background: rgba(8, 16, 36, 0.6);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  animation: cardFadeIn 0.8s ease-out;
  transition: background 0.3s;
}
.chart-card:hover {
  background: rgba(8, 16, 36, 0.8);
}

@keyframes cardFadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to   { opacity: 1; transform: scale(1); }
}

/* Canvas à l’intérieur de la carte */
.chart-card canvas {
  flex: 1;
  width: 100% !important;
  height: 100% !important;
  display: block;
}
</style>
