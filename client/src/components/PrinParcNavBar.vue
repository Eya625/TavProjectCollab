<template>
  <div class="navbar">
    <div class="logo-container">
      <!-- Logo animé avec effet de pulsation -->
      <img
        class="logo"
        src="../assets/images/tav2.png"
        alt="TAV Tunisia Logo"
      />
    </div>
    <nav>
      <ul>
        <li
          v-for="item in menuItems"
          :key="item.name"
          class="nav-item group"
        >
          <router-link :to="item.path" v-if="item.path">
            <div class="icon-wrapper">
              <font-awesome-icon :icon="item.icon" class="icon" />
              <!-- Sous-texte affiché en dessous de l'icône avec animation -->
              <span class="icon-text">{{ item.label }}</span>
            </div>
            <!-- Tooltip avancé sur le côté, apparaît au survol -->
            <span class="tooltip group-hover:opacity-100 group-hover:translate-x-0">
              {{ item.label }}
            </span>
          </router-link>
          <!-- Si aucun chemin n'est défini, on affiche l'élément sans lien -->
          <div v-else>
            <div class="icon-wrapper">
              <font-awesome-icon :icon="item.icon" class="icon" />
              <span class="icon-text">{{ item.label }}</span>
            </div>
            <span class="tooltip group-hover:opacity-100 group-hover:translate-x-0">
              {{ item.label }}
            </span>
          </div>
        </li>
      </ul>
    </nav>
  </div>
</template>

<script>
export default {
  data() {
    return {
      menuItems: [
        { name: 'Printer Parc', icon: 'fa-print', label: 'Printer Parc', path:'/printer-parc' },
        { name: 'Curative Maintenance', icon: 'fa-tools', label: 'Maintenance', path:'/cur_main' },
      ]
    };
  }
};
</script>

  
  <style scoped>
  /* Navbar container */
  .navbar {
    width: 170px;
    height: 100vh;
    background: linear-gradient(135deg, #1f4489, #4f6893);
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;
    animation: fadeIn 1s ease-out;
  }
  
  /* Animation du logo */
  @keyframes pulse {
    0% {
      transform: scale(1);
      filter: brightness(0.8);
    }
    50% {
      transform: scale(1.1);
      filter: brightness(1.2);
    }
    100% {
      transform: scale(1);
      filter: brightness(0.8);
    }
  }
  .logo-container {
    animation: pulse 2s infinite;
  }
  
  .logo {
    width: 150px;
    height: 60px;
    margin-bottom: 20px;
    transition: transform 0.3s ease-in-out;
  }
  .logo:hover {
    transform: scale(1.05);
  }
  
  /* Style de chaque item de navigation */
  .nav-item {
    position: relative;
    list-style: none;
    margin-bottom: 20px;
    margin-right: 50px;
    cursor: pointer;
    transition: transform 0.3s ease-in-out;
    display: flex;
    align-items: center;
    flex-direction: column;
  }
  .nav-item:hover {
    transform: scale(1.2);
  }
  
  /* Conteneur de l'icône et du texte */
  .icon-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  
  /* Icône */
  .icon {
    color: white;
    font-size: 24px;
  }
  
  /* Sous-texte affiché en dessous de l'icône */
  .icon-text {
    margin-top: 5px;
    font-size: 12px;
    color: #f0f0f0;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  
  /* Affichage progressif du sous-texte lors du survol de l'item */
  .nav-item:hover .icon-text {
    opacity: 1;
    transform: translateY(0);
  }
  
  /* Tooltip avancé qui apparaît sur le côté */
  .tooltip {
    position: absolute;
    left: 110%;
    top: 50%;
    transform: translateX(-20px) translateY(-50%);
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    white-space: nowrap;
    opacity: 0;
    transition: opacity 0.3s ease, transform 0.3s ease;
  }
  
  /* Au survol, le tooltip se déplace et apparaît */
  .nav-item:hover .tooltip {
    opacity: 1;
    transform: translateX(0) translateY(-50%);
  }
  
  /* Animation d'apparition globale */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  </style>
  