<template>
  <div class="dashboard-container">
    <h1 class="dashboard-title"> Welcome to Your APP</h1>

    <div class="dashboard-cards">
      <!-- OLA ENERGY -->
      <div class="card card-ola">
        <div class="card-icon">
          <i class="fas fa-gas-pump"></i>
        </div>
        <div class="card-info">
          <h2>OLA ENERGY</h2>
          <p>Track and analyze fuel consumption</p>
        </div>
        <router-link to="/OLADashboard" class="card-link">
          Go to OLA Dashboard
        </router-link>
      </div>

      <!-- VEHICLE -->
      <div class="card card-vehicle">
        <div class="card-icon">
          <i class="fas fa-car-side"></i>
        </div>
        <div class="card-info">
          <h2>Manage Vehicle</h2>
          <p>Monitor and manage your fleet</p>
        </div>
        <router-link to="/ManageVehicle" class="card-link">
          Go to Vehicle Section
        </router-link>
      </div>

      <!-- PRINTER PARC -->
      <div class="card card-printer">
        <div class="card-icon">
          <i class="fas fa-print"></i>
        </div>
        <div class="card-info">
          <h2>Printer Parc</h2>
          <p>Supervise and manage your printing equipment</p>
        </div>
        <router-link to="/printer-parc" class="card-link">
          Go to Printer Parc Section
        </router-link>
      </div>

      <!-- SETTINGS -->
      <div class="card card-settings">
        <div class="card-icon">
          <i class="fas fa-cogs"></i>
        </div>
        <div class="card-info">
          <h2>Settings</h2>
          <p>Customize your preferences</p>
        </div>
        <router-link to="/settings" class="card-link">
          Go to Settings
        </router-link>
      </div>
    </div>
  </div>
</template>


<script>
export default {
  name: 'Dashboard',
  data() {
    return {
      vehicleCount: 12,
      notificationCount: 5
    };
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 40px 20px;
  min-height: 100vh;
  background: radial-gradient(circle at top left, #fdfbfb, #ebedee, #d4e0f0);
  background-attachment: fixed;
  animation: fadeIn 1.2s ease-in;
  position: relative;
  overflow: hidden;
}

/* Effet de bulles flottantes */
.dashboard-container::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.06) 10%, transparent 11%),
              radial-gradient(circle, rgba(255, 255, 255, 0.04) 10%, transparent 11%);
  background-size: 80px 80px;
  z-index: 0;
  animation: moveBackground 80s linear infinite;
  pointer-events: none;
  opacity: 0.4;
  filter: blur(1px);
}

@keyframes moveBackground {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(-100px, -100px);
  }
}
.dashboard-title {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  color: #2c3e50;
  margin-bottom: 40px;
  animation: slideDown 1s ease;
}

.dashboard-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(270px, 1fr));
  gap: 30px;
}

.card {
  background-color: white;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
  transition: transform 0.4s ease, box-shadow 0.4s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.card:hover {
  transform: translateY(-10px) scale(1.03);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

/* Specific colors per card */
.card-ola .card-icon {
  color: #e67e22;
}
.card-vehicle .card-icon {
  color: #2ecc71;
}
.card-printer .card-icon {
  color: #9b59b6;
}
.card-settings .card-icon {
  color: #3498db;
}

.card-info h2 {
  font-size: 1.6rem;
  color: #2c3e50;
  margin-bottom: 10px;
}

.card-info p {
  color: #7f8c8d;
}

.card-link {
  display: inline-block;
  margin-top: 15px;
  padding: 8px 16px;
  background-color: #2980b9;
  color: white;
  border-radius: 8px;
  font-weight: bold;
  text-decoration: none;
  transition: background-color 0.3s ease;
}

.card-link:hover {
  background-color: #1f618d;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
