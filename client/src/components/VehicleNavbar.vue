<template>
  <nav class="navbar">
    <!-- En-tête avec logo, titre et icônes -->
    <div class="navbar-header">
      <div class="navbar-title">
        <div class="navbar-logo">
          <img src="../assets/images/tav.png" alt="Logo" />
        </div>
        <div class="title-wrapper">
          <h1>Gestion des véhicules</h1>
          <p class="slogan">"Votre succès, notre passion!"</p>
        </div>
      </div>

      <div class="navbar-icons">
        <div v-if="message" class="notif-message">
          {{ message }}
        </div>

        <button
          @click="showNotification"
          class="icon-button notif-btn"
          title="Notifications"
        >
          <i class="fas fa-bell"></i>
          <span v-if="notificationCount > 0" class="badge">
            {{ notificationCount }}
          </span>
        </button>

        <button
          @click="goDashboard"
          class="icon-button exit-btn"
          title="Dashboard"
        >
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </div>

    <!-- Menu navigation -->
    <ul class="navbar-menu">
      <li><router-link to="/Dashboard" exact>Dashboard</router-link></li>
      <li><router-link to="/ManageVehicle">Gérer Véhicules</router-link></li>
      <li><router-link to="/facturation">Facturation</router-link></li>
      <li><router-link to="/historique">Historique</router-link></li>
    </ul>
  </nav>
</template>

<script>
export default {
  name: 'Navbar',
  props: {
    message: { type: String, default: '' }
  },
  data() {
    return {
      notificationCount: 0
    };
  },
  methods: {
    goDashboard() {
      this.$router.push('/');
    },
    showNotification() {
      this.$emit('show-notification');
    }
  },
  mounted() {
    // Simulation de notifications
    setInterval(() => {
      this.notificationCount = Math.floor(Math.random() * 6);
    }, 5000);
  }
};
</script>

<style scoped>
.navbar {
  width: 100%;
  background: linear-gradient(135deg, #0f2027, #203a43, #2c5364);
  color: white;
  padding: 15px;
  height: 150px;
  transition: height 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
}

.navbar-logo img {
  width: 110px;
  height: 40px;
  margin-right: 15px;
  animation: pulse 2.5s ease-in-out infinite;
  transition: transform 0.3s ease;
}

.navbar-logo img:hover {
  transform: scale(1.1);
}

/* Animation "pulse" douce */
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.95;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.95;
  }
}

.navbar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  animation: slideDown 0.5s ease;
}

.navbar-title {
  display: flex;
  align-items: center;
  position: relative;
}

.title-wrapper {
  display: flex;
  flex-direction: column;
  position: relative;
}

.navbar-title h1 {
  margin: 0;
  font-size: 1.8em;
  color: #00ffff;
  animation: fadeIn 1.5s ease;
}

.slogan {
  position: absolute;
  top: 100%;
  left: 0;
  font-size: 0.85em;
  font-style: italic;
  color: #ccc;
  white-space: nowrap;
  animation: floatSlogan 4s ease-in-out infinite;
  pointer-events: none;
  opacity: 0.85;
}

.navbar-icons .icon-button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1.4em;
  margin-left: 15px;
  transition: transform 0.3s ease, color 0.3s ease;
  position: relative;
}

.navbar-icons .icon-button:hover {
  transform: scale(1.2);
  color: #00eaff;
}

.badge {
  background: #e74c3c;
  border-radius: 50%;
  padding: 3px 7px;
  font-size: 0.7em;
  position: absolute;
  top: -5px;
  right: -10px;
  color: white;
  font-weight: bold;
  box-shadow: 0 0 6px rgba(0, 0, 0, 0.4);
}

.navbar-menu {
  list-style: none;
  padding: 0;
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 80px;
}

.navbar-menu li a {
  color: #ffffff;
  text-decoration: none;
  font-size: 1.1em;
  padding: 5px 15px;
  border-radius: 6px;
  transition: background 0.3s ease, transform 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
}

.navbar-menu li a:hover {
  background: rgba(0, 255, 255, 0.2);
  transform: translateY(-3px);
  color: #00ffff;
}

/* Animations */
@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes floatSlogan {
  0% {
    transform: translateY(0);
    opacity: 0.7;
  }
  50% {
    transform: translateY(-4px);
    opacity: 1;
  }
  100% {
    transform: translateY(0);
    opacity: 0.7;
  }
}

</style>
