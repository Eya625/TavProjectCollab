<template>
  <div class="layout">
    <!-- Navbar à gauche -->
    <NavBar :showGreenDot="false" />

    <!-- Contenu principal -->
    <div class="dashboard">
      <header class="dashboard-header">
        <div class="logo left">
          <img src="../assets/images/tav2.png" alt="TAV Tunisie" class="logo-tav animate-slide-left" />
        </div>

        <div class="header-center">
          <h2 class="animate-fade-in">Administrative Fuel Control – TAV</h2>
          <p class="slogan animate-slide-up">« Reliable Insights. Responsible Management.»</p>
        </div>

        <div class="logo right">
          <img src="../assets/images/olaenerg.png" alt="OLA Energy" class="logo-ola animate-slide-right" />
        </div>
      </header>

      <div class="dashboard-body">
        <div class="dashboard-content">
          <!-- Carte Totale en full-width -->
          <TotalConsumptionCard
            class="card-wide"
            :year="year"
            :selected-months="selectedMonths"
            :selected-employee="selectedEmployee"
            :selected-locations="selectedLocations"
          />

          <!-- Par location (pie) -->
          <ByLocationChart
            class="chart-pie"
            :year="year"
            :selected-employee="selectedEmployee"
            :selected-locations="selectedLocations"
            :colors="locationColors"
          />

          <!-- Par mois (line) -->
          <ByMonthChart
            class="chart-grid"
            :year="year"
            :selected-employee="selectedEmployee"
            :selected-locations="selectedLocations"
            :selected-months="selectedMonths"
            :colors="monthColors"
          />

          <!-- Top employés (bar) -->
          <TopEmployeesChart
            class="chart-grid"
            :year="year"
            :selected-employee="selectedEmployee"
            :selected-locations="selectedLocations"
            :colors="topEmpColors"
          />

          <!-- YoY (table) -->
          <YoYTable
            class="chart-grid"
            :selected-year="year"
            :selected-employee="selectedEmployee"
            :selected-locations="selectedLocations"
          />
        </div>

        <!-- Panneau de filtres sticky -->
        <FilterPanels
          class="filter-sticky"
          :years="years"
          :employees="employeeList"
          :locations="locationList"
          :months="monthList"
          v-model:modelValue="year"
          v-model:selected-employee="selectedEmployee"
          v-model:selected-locations="selectedLocations"
          v-model:selected-months="selectedMonths"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import NavBar from '../components/NavBar.vue';
import api from '../services/apiServices';
import FilterPanels from '../charts/FilterPanels.vue';
import ByLocationChart from '../charts/ByLocationChart.vue';
import ByMonthChart from '../charts/ByMonthChart.vue';
import TopEmployeesChart from '../charts/TopEmployeesChart.vue';
import YoYTable from '../charts/YoYTable.vue';
import TotalConsumptionCard from '../charts/TotalConsumptionCard.vue';

export default {
  name: 'DashChart',
  components: {
    NavBar,
    FilterPanels,
    ByLocationChart,
    ByMonthChart,
    TopEmployeesChart,
    YoYTable,
    TotalConsumptionCard
  },
  setup() {
    const years            = ref([]);
    const employeeList     = ref([]);
    const locationList     = ref([]);
    const monthList        = ref([
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ]);

    const year              = ref(new Date().getFullYear());
    const selectedEmployee  = ref('');
    const selectedLocations = ref([]);
    const selectedMonths    = ref([]);

    const locationColors = ['rgba(255,140,0,0.8)','rgba(65,105,225,0.8)','rgba(0,191,255,0.8)'];
    const monthColors    = ['rgba(27,38,59,0.8)'];
    const topEmpColors   = ['rgba(255,140,0,0.8)','rgba(65,105,225,0.8)','rgba(0,191,255,0.8)'];

    onMounted(async () => {
      years.value        = await api.getAllYears();
      employeeList.value = await api.getAllEmployees();
      locationList.value = await api.getAllLocations();
      if (!years.value.includes(year.value)) {
        year.value = years.value.at(-1) || year.value;
      }
    });

    return {
      years,
      employeeList,
      locationList,
      monthList,
      year,
      selectedEmployee,
      selectedLocations,
      selectedMonths,
      locationColors,
      monthColors,
      topEmpColors
    };
  }
};
</script>
<style scoped>
.layout {
  display: flex;
}

.dashboard {
  min-height: 100vh;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: url('../assets/images/arriplan.jpeg') center/cover no-repeat;
  color: #fff;
  padding: 1rem;
  box-sizing: border-box;
}



/* En-tête */
.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  padding: 1rem 2rem;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 1rem;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.5);
  text-align: center;
}

.logo {
  flex: 1;
  min-width: 100px;
}
.logo.left {
  text-align: left;
}
.logo.right {
  text-align: right;
}
.logo-tav,
.logo-ola {
  width: 80px;
  height: auto;
  transition: transform 0.4s ease, opacity 0.4s ease;
}

.header-center {
  flex: 2;
  min-width: 300px;
}
.dashboard-header h2 {
  font-size: 1.8rem;
  color: #FFA500;
  margin: 0;
}

/* Slogan */
.slogan {
  margin: 0.5rem 0 0;
  width: 100%;
  text-align: center;
  font-style: italic;
  color: #00BFFF;
  font-size: 1rem;
}

/* Corps */
.dashboard-body {
  display: flex;
  flex: 1;
  gap: 1rem;
  margin-top: 1rem;
  overflow-x: hidden;
}

/* Grille des composants */
.dashboard-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  flex: 1;
}
.card-wide {
  grid-column: span 2;
}

/* Styles généraux pour les graphiques */
.chart-grid,
.chart-pie {
  background: rgba(0, 0, 0, 0.6);
  border-radius: 1rem;
  padding: 0.5rem;
}
.chart-pie {
  width: 550px;
  height: 400px;
  background: rgba(0, 0, 0, 0.678);
  justify-content: center;
  justify-items: center;
  align-self: start;
}

/* Filtres */
.filter-sticky {
  position: sticky;
  top: 1rem;
  width: 260px;
  background: rgba(0, 0, 0, 0.6);
  margin-left: 1rem;
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(6px);
  box-sizing: border-box;
}

/* --- Animations --- */
.animate-fade-in {
  animation: fadeIn 1.5s ease forwards;
}
.animate-slide-up {
  animation: slideUp 1.5s ease forwards;
}
.animate-slide-left {
  animation: slideLeft 1.5s ease forwards;
}
.animate-slide-right {
  animation: slideRight 1.5s ease forwards;
}

@keyframes fadeIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes slideUp {
  0%   { transform: translateY(30px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}
@keyframes slideLeft {
  0%   { transform: translateX(-50px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
@keyframes slideRight {
  0%   { transform: translateX(50px); opacity: 0; }
  100% { transform: translateX(0); opacity: 1; }
}
</style>
