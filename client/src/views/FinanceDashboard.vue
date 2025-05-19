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
        <h1><i class="fas fa-chart-line"></i> Tableau de bord financier</h1>
        <time>{{ today }}</time>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-cards">
        <div class="card kpi-card">
          <div class="card-header kv-blue"><i class="fas fa-car"></i></div>
          <div class="card-body">
            <h3>Total véhicules</h3>
            <p class="kpi-value">{{ totalVehicleCount.toLocaleString('fr-FR') }}</p>
          </div>
        </div>
        <div class="card kpi-card">
          <div class="card-header kv-lightblue"><i class="fas fa-euro-sign"></i></div>
          <div class="card-body">
            <h3>Total facturé (TND)</h3>
            <p class="kpi-value">{{ totalBilledSum.toLocaleString('fr-FR') }}</p>
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

const today = new Date().toLocaleDateString('fr-FR', {
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
}

/* Sidebar */
.sidebar {
  width: 230px;
  background: rgba(0, 0, 0, 0.9);
  color: #fff;
  padding: 1.5rem;
  box-shadow: 4px 0 12px rgba(0,0,0,0.2);
}
.filter-header {
  display: flex;
  align-items: center;
  margin-bottom: 1.5rem;
}
.filter-header i {
  font-size: 1.6rem;
  margin-right: 0.75rem;
}
.filter-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-weight: 600;
}

/* Main */
.main {
  flex: 1;
  padding: 2.5rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
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
  color: #2E86AB;
  font-weight: 600;
}
.main-header time {
  font-style: italic;
  color: #ccc;
}

/* KPI Cards */
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}
.kpi-card {
  background: rgba(255,255,255,0.9);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}
.kpi-card:hover {
  transform: translateY(-4px);
}
.card-header {
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.9rem;
  color: #fff;
}
.kv-blue { background-color: #2E86AB; }
.kv-lightblue { background-color: #3498DB; }
.card-body {
  padding: 1.25rem;
  text-align: center;
}
.kpi-value {
  margin-top: 0.5rem;
  font-size: 2.4rem;
  font-weight: 700;
  color: #1B4F72;
}

/* Charts Grid */
.charts-grid {
  display: grid;  
  /* colonnes adaptatives comme avant */
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  /* espacement horizontal et vertical entre les cellules */
  gap: 1.5rem;    
  /* si vous voulez un peu de marge intérieure autour de la grille */
  padding: 1rem;  
}


/* Chart Card */
.chart-card {
     
  /* conservez vos styles visuels */
  background-color: rgba(0, 0, 0, 0.548);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.5);

  display: flex;
  flex-direction: column;
}
/* Canvas à l’intérieur de la carte */
.chart-card canvas {
  flex: 1;
  width: 100% !important;
  height: 100% !important;
  display: block;
}
</style>
