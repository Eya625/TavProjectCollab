<template>
  <div class="dashboard-container">
    <!-- Affichage dynamique du message de bienvenue avec animation -->
    <transition name="fade-slide" appear>
      <h1 key="title" class="dashboard-title">
        <span class="typewriter">{{ currentGreeting }}</span>
      </h1>
    </transition>

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
        <router-link to="/dashchart" class="card-link">
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
        <router-link to="/profile/:email" class="card-link">
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
      greetings: [
        'Welcome to your Administrative Hub – your command center for seamless management.',
        'Welcome to the Admin Dashboard: Streamlining your daily operations.',
        'Welcome to your Administrative Suite – where efficiency meets clarity.',
        'Welcome to your Management Console – empowering smarter decisions.',
        'Welcome to your Admin Portal – your gateway to organized workflows.',
        'Welcome to the Administrative Desk – optimizing every task, every time.',
        'Welcome to your Control Center – centralizing insights and actions.',
        'Welcome to your Operations Hub – where productivity comes to life.',
        'Welcome to your Admin Workspace – simplifying complexity at a glance.',
        'Welcome to your Administrative Interface – designed for performance and precision.'
      ],
      currentGreeting: ''
    };
  },
  created() {
    const idx = Math.floor(Math.random() * this.greetings.length);
    this.currentGreeting = this.greetings[idx];
  }
};
</script>

<style scoped>
.dashboard-container {
  padding: 40px 20px;
  min-height: 100vh;
  background: radial-gradient(circle at top left, #fdfbfb, #ebedee, #d4e0f0);
  background-attachment: fixed;
  position: relative;
  overflow: hidden;
}

/* Fade + Slide Transition */
.fade-slide-enter-active, .fade-slide-leave-active {
  transition: all 0.8s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}
.fade-slide-enter-to {
  opacity: 1;
  transform: translateY(0);
}

/* Typewriter effect */
.typewriter {
  display: inline-block;
  overflow: hidden;
  border-right: .15em solid #2c3e50;
  white-space: nowrap;
  animation:
    typing 3s steps(40, end),
    blink-caret .75s step-end infinite;
}
@keyframes typing {
  from { width: 0; }
  to { width: 100%; }
}
@keyframes blink-caret {
  from, to { border-color: transparent; }
  50% { border-color: #2c3e50; }
}

.dashboard-title {
  font-size: 2.5rem;
  font-weight: bold;
  text-align: center;
  color: #2c3e50;
  margin-bottom: 40px;
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
.card-icon { font-size: 2.5rem; margin-bottom: 15px; }
.card-ola .card-icon { color: #e67e22; }
.card-vehicle .card-icon { color: #2ecc71; }
.card-printer .card-icon { color: #9b59b6; }
.card-settings .card-icon { color: #3498db; }
.card-info h2 { font-size: 1.6rem; color: #2c3e50; margin-bottom: 10px; }
.card-info p { color: #7f8c8d; }
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
.card-link:hover { background-color: #1f618d; }

/* Background floating bubbles unchanged */
.dashboard-container::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%; width: 200%; height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.06) 10%, transparent 11%), radial-gradient(circle, rgba(255,255,255,0.04) 10%, transparent 11%);
  background-size: 80px 80px;
  z-index: 0;
  animation: moveBackground 80s linear infinite;
  pointer-events: none;
  opacity: 0.4;
  filter: blur(1px);
}
@keyframes moveBackground { 0% { transform: translate(0,0);} 100% { transform: translate(-100px,-100px);} }
</style>
