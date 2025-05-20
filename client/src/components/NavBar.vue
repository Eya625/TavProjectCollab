<template>
  <div class="layout">
    <div :class="['navbar-container', { 'navbar-collapsed': isCollapsed }]">
      <nav class="navbar">
        <!-- Partie gauche : Icône de menu -->
        <div class="menu-icon" @click="toggleNav">
          <i class="fas fa-bars"></i>
        </div>

        <!-- Logo - visible même en mode replié -->
        <div class="logo-container" v-if="!isCollapsed">
          <img
            class="logo"
            src="../assets/images/tav2.png" 
            alt="Logo"
          />
        </div>

        <!-- Liste des liens de navigation -->
        <ul v-if="!isCollapsed">
          <li>
            <router-link to="/dashchart" class="nav-item">
              <i class="fas fa-home"></i> <span>Dashboard</span>
            </router-link>
          </li>

          <!-- Manage Vehicles avec sous-titres -->
          <li class="nav-section">
            <span class="nav-item main-item">
              <i class="fas fa-car"></i> <span>Manage Vehicles</span>
            </span>
            <ul class="submenu">
              <li>
                <router-link to="/ola" class="nav-item sub-item">
                  <i class="fas fa-gas-pump"></i> <span>OLA ENERGY</span>
                </router-link>
              </li>
              <li>
                <router-link to="/aps" class="nav-item sub-item">
                  <i class="fas fa-gas-pump"></i> <span>APS</span>
                </router-link>
              </li>
            </ul>
          </li>

          <li>
            <router-link to="/billing" class="nav-item">
              <i class="fas fa-file-invoice-dollar"></i> <span>Billing</span>
              <!-- Affichage du green dot si showGreenDot est vrai -->
              <span v-if="showGreenDot" class="green-dot"></span>
            </router-link>
          </li>

          <li>
            <router-link to="/history" class="nav-item">
              <i class="fas fa-history"></i> <span>History</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NavBar',
  data() {
    return {
      isCollapsed: false // Etat du navbar : replié ou affiché
    };
  },
  props: {
    showGreenDot: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    toggleNav() {
      this.isCollapsed = !this.isCollapsed; // Bascule de l'état
    }
  }
};
</script>
<style>
/* Conteneur global en flex pour que le contenu s'ajuste automatiquement */
.layout {
  display: flex;
  transition: all 0.3s ease;
}

/* Navbar Container qui occupe l'espace à gauche */
.navbar-container {
  width: 280px;
  transition: width 0.3s ease;
  background: linear-gradient(45deg, #303e4e, #053ea8e5);
}

/* Quand le navbar est replié, réduire sa largeur */
.navbar-container.navbar-collapsed {
  width: 60px;
}

/* Navbar interne */
.navbar {
  height: 100vh;
  color: white;
  display: flex;
  flex-direction: column;
  padding-top: 20px;
  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.2);
  padding-left: 15px;
  transition: background 0.3s ease;
}

/* Icône de menu */
.menu-icon {
  cursor: pointer;
  font-size: 30px;
  color: white;
  padding-left: 20px;
  transition: transform 0.3s ease;
}
.menu-icon:hover {
  transform: scale(1.2);
}

/* Logo */
.logo-container {
  display: flex;
  justify-content: center;
  padding-bottom: 20px;
  margin-top: 20px;
}
.logo {
  width: 180px;
  height: 70px;
  cursor: pointer;
  transition: transform 0.3s ease;
}
.logo:hover {
  transform: rotate(10deg);
}

/* Liste des éléments du menu */
.navbar ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
.nav-section {
  margin-bottom: 20px;
}
.navbar .nav-item {
  display: flex;
  align-items: center;
  padding: 12px 15px;
  color: white;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  transition:
    background-color 0.3s,
    transform 0.2s;
  border-radius: 6px;
}
.navbar .nav-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: scale(1.05);
}
.navbar .nav-item i {
  margin-right: 12px;
  font-size: 18px;
}
.main-item {
  font-weight: bold;
  font-size: 17px;
  padding-bottom: 5px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.2);
}
.submenu {
  padding-left: 25px;
  margin-top: 10px;
}
.sub-item {
  font-size: 15px;
  padding: 10px 15px;
  margin-left: 50px;
  transition: background-color 0.3s;
}
.sub-item:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
}

/* Contenu principal qui s'ajuste automatiquement */
.main-content {
  flex: 1;
  transition: margin 0.3s ease;
  padding: 20px;
  background-color: #f4f7fa;
}

.green-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: rgb(21, 209, 21);
  display: inline-block;
  margin-left: 150px;
}
</style>
