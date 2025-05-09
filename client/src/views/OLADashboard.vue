<template>
      <button @click="refreshPowerBI">Rafraîchir les données</button>

  <div class="dashboard-container">
    <!-- Barre latérale avec Navbar -->
    <div class="sidebar">
      <NavBar />
    </div>
<!-- Contenu principal -->
    <div class="main-content">
      <!-- Slogan animé avec icônes FontAwesome -->
      <div class="animated-banner">
        <i class="fas fa-chart-line"></i>
        <span class="slogan">Empowering Insights, Driving Success!</span>
        <i class="fas fa-bolt"></i>
      </div>

      <!-- Dashboard Power BI -->
      <div class="dashboard">
        <!-- On ajoute le timestamp en query pour forcer le rafraîchissement -->
        <iframe
          :src="iframeUrl"
          frameborder="0"
          allowfullscreen
          class="dashboard-iframe"
        ></iframe>
      </div>
    </div>
  </div>
</template>

<script>
import NavBar from '../components/NavBar.vue';
import io from 'socket.io-client';
import axios from 'axios';

export default {
  name: 'OLADashboard',
  components: { NavBar },
  data() {
    return {
      // URL par défaut qui peut être remplacée par celle récupérée depuis l'API
      powerBIEmbedUrl:
        'https://app.powerbi.com/reportEmbed?reportId=caab72d6-8a48-48d8-9f01-a94833cbddd7&groupId=756d6b0a-e3b6-497f-9a1d-d6619efb5f74&autoAuth=true',
      timestamp: new Date().getTime(),
      socket: null,
      refreshInterval: null
    };
  },
  computed: {
    // Ajoute le timestamp dans l'URL pour forcer le rafraîchissement
    iframeUrl() {
      return `${this.powerBIEmbedUrl}&t=${this.timestamp}`;
    }
  },
  methods: {
    refreshPowerBI() {
      axios.post('http://localhost:3000/api/refresh-dataset')
        .then(response => {
          console.log('Rafraîchissement lancé :', response.data);
          this.timestamp = new Date().getTime(); // Forcer le reload ici
        })
        .catch(err => {
          console.error('Erreur lors du rafraîchissement :', err);
        });
    }

}
,
  mounted() {
    // 1. Récupérer dynamiquement l'embed token (et/ou embedUrl) depuis votre backend
    axios
      .get('http://localhost:3000/api/embedToken') // adaptez l'URL selon votre configuration
      .then((response) => {
        // Supposons que la réponse contient { embedUrl: "votre_url_avec_token", expiration: "..." }
        if (response.data && response.data.embedUrl) {
          this.powerBIEmbedUrl = response.data.embedUrl;
        }
      })
      .catch((error) => {
        console.error('Erreur lors de la récupération de l’embed token :', error);
      });

    // 2. Connexion au serveur Socket.io pour écouter des événements de mise à jour (refresh)
    this.socket = io('http://localhost:3000'); // Adaptez l'URL de votre serveur Socket.io

    // Écouter l'événement 'dataUpdated' pour forcer le rafraîchissement de l'iframe
    this.socket.on('dataUpdated', (data) => {
      console.log('Événement dataUpdated reçu :', data);
      this.timestamp = new Date().getTime();
    });

    // 3. Rafraîchissement automatique toutes les 60 secondes
    this.refreshInterval = setInterval(() => {
      this.timestamp = new Date().getTime();
    }, 60000);
  },
  beforeDestroy() {
    clearInterval(this.refreshInterval);
    if (this.socket) {
      this.socket.disconnect();
    }
  }
};
</script>
<style scoped>
.dashboard-container {
  display: flex;
  height: 100vh;
}

.main-content {
  flex-grow: 1;
  padding: 20px;
}

.animated-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  color: #007bff;
  background-color: #f4f4f4;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 20px;
  animation: fadeIn 2s ease-in-out;
}

.animated-banner i {
  margin: 0 10px;
}

.dashboard {
  width: 100%;
  height: 80vh;
}

.dashboard-iframe {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

/* Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
