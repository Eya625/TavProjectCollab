<template>
  <div class="dashboard-root">
    <!-- Sidebar filter -->
    <aside class="sidebar">
      <VehicleFilter v-model:selectedVehicle="selectedVehicle" />
    </aside>

    <!-- Main -->
    <main class="main">
      <!-- Header -->
      <div class="main-header">
        <h1>Tableau de bord financier</h1>
        <time>{{ today }}</time>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-cards">
        <!-- Total véhicules -->
        <div class="card kpi-card">
          <div class="card-header blue-bg">
            🚗
          </div>
          <div class="card-body">
            <h3>Total véhicules</h3>
            <p class="kpi-value">{{ totalVehicleCount.toLocaleString('fr-FR') }}</p>
          </div>
        </div>

        <!-- Total facturé -->
        <div class="card kpi-card">
          <div class="card-header green-bg">
            💰
          </div>
          <div class="card-body">
            <h3>Total facturé (TND)</h3>
            <p class="kpi-value">{{ totalBilledSum.toLocaleString('fr-FR') }}</p>
          </div>
        </div>
      </div>

      <!-- Graphes détaillés -->
      <div class="charts-grid">
        <VehicleAllocationChart :chartData="allocationData" />
        <Top5VehiclesChart      :chartData="top5VehiclesData" />
        <CostByBranchChart      :chartData="costByBranchData" />
        <InvoicesByMonthChart   :chartData="invoicesByMonthData" />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';
import apiService            from '../services/apiServices';
import VehicleFilter         from '../charts/VehicleFilter.vue';
import VehicleAllocationChart from '../charts/VehicleAllocationPie.vue';
import Top5VehiclesChart     from '../charts/Top5Vehicle.vue';
import CostByBranchChart     from '../charts/CostByBranch.vue';
import InvoicesByMonthChart  from '../charts/InvoiceByMonth.vue';

// palette pro
const palette = {
  blue:    '#005A9C',
  green:   '#107C41',
  orange:  '#FF8C00',
  gray:    '#666666'
};

const selectedVehicle   = ref('');
const totalVehicleCount = ref(0);
const totalBilledSum    = ref(0);

const allocationData      = ref({ labels: [], datasets: [] });
const top5VehiclesData    = ref({ labels: [], datasets: [] });
const costByBranchData    = ref({ labels: [], datasets: [] });
const invoicesByMonthData = ref({ labels: [], datasets: [] });

async function loadData() {
  // 1. Total véhicules
  totalVehicleCount.value = await apiService.getTotalVehicles(selectedVehicle.value);

  // 2. Total facturé (somme)
  {
    const { total } = await apiService.getTotalBilled(selectedVehicle.value);
    totalBilledSum.value = total;
  }

  // 3. Allocation
  {
    const arr = await apiService.getAllocation(selectedVehicle.value);
    const labels = arr.map(i => i.allocation);
    const data   = arr.map(i => i.count);
    allocationData.value = {
      labels,
      datasets: [{
        label: 'Allocation',
        data,
        backgroundColor: [ palette.blue, palette.green, palette.orange, palette.gray ].slice(0, labels.length)
      }]
    };
  }

  // 4. Top 5 véhicules
  {
    const arr = await apiService.getTop5Vehicles(selectedVehicle.value);
    const labels = arr.map(i => i.vehicle);
    const data   = arr.map(i => i.total);
    top5VehiclesData.value = {
      labels,
      datasets: [{
        label: 'Top 5',
        data,
        backgroundColor: [ palette.green, palette.orange, palette.blue, palette.gray, palette.green ].slice(0, labels.length)
      }]
    };
  }

  // 5. Coût par agence
  {
    const arr = await apiService.getCostByBranch(selectedVehicle.value);
    const labels = arr.map(i => i.branch);
    const data   = arr.map(i => i.total);
    costByBranchData.value = {
      labels,
      datasets: [{
        label: 'Coût par agence',
        data,
        backgroundColor: [ palette.orange, palette.blue, palette.green, palette.gray ].slice(0, labels.length)
      }]
    };
  }

  // 6. Factures par mois
  {
    const arr = await apiService.getInvoicesByMonth(selectedVehicle.value);
    const labels = arr.map(i => i.month);
    const data   = arr.map(i => i.count);
    invoicesByMonthData.value = {
      labels,
      datasets: [{
        label: 'Factures/Mois',
        data,
        backgroundColor: [ palette.blue ],
        borderColor: [ palette.blue ],
        borderWidth: 2
      }]
    };
  }
}

watch(selectedVehicle, loadData);
onMounted(loadData);

const today = new Date().toLocaleDateString('fr-FR', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});
</script>

<style scoped>
.dashboard-root {
  display: flex;
  min-height: 100vh;
  background: #f5f5f5;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: #4a4a4a;
  color: #fff;
}

/* Main */
.main {
  flex: 1;
  padding: 1.5rem;
}

/* Header */
.main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

/* KPI Cards */
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}
.kpi-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  color: #333;
}
.kpi-card .card-header {
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}
.kpi-card .card-body {
  padding: 1rem;
  text-align: center;
}
.kpi-card .card-body h3 {
  margin: 0;
  font-size: 1rem;
  color: #666;
}
.kpi-card .kpi-value {
  margin-top: .5rem;
  font-size: 2rem;
  font-weight: bold;
}

/* Couleurs */
.blue-bg   { background-color: #005A9C; color: #fff; }
.green-bg  { background-color: #107C41; color: #fff; }

/* Charts grid */
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}
</style>
