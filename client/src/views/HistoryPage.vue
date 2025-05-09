<template>
  <div class="page-container">
    <div class="sidebar">
      <NavBar />
    </div>
    <!-- Zone de contenu principal -->
    <div class="dashboard-container">
      <div class="slogan">
        <h2>Track Your Actions, Shape Your History!</h2>
      </div>
      <h1 class="page-title">Historical Actions</h1>
      <!-- Intégration du composant History -->
      <History />
    </div>
  </div>
</template>

<script>
import History from '../components/History.vue';
import NavBar from '../components/NavBar.vue';

export default {
  name: 'HistoryPage',
  components: {
    History,
    NavBar,
  },
};
</script>

<style scoped>
/* Container global */
.page-container {
  display: flex;
  min-height: 100vh;
  color: #f0f0f0;
  font-family: 'Roboto', sans-serif;
}

/* Zone principale du dashboard avec fond animé */
.dashboard-container {
  flex-grow: 1;
  padding: 40px;
  background: linear-gradient(-45deg, #20203af8, #03033df8, #04229adc, #35355bf8);
  background-size: 400% 400%;
  animation: gradientAnimation 15s ease infinite;
  border-radius: 10px;
}

/* Animation du fond */
@keyframes gradientAnimation {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Slogan animé */
.slogan {
  text-align: center;
  margin-bottom: 20px;
  opacity: 0;
  animation: fadeIn 2s forwards;
}
.slogan h2 {
  font-size: 1.5em;
  color: #ffeb3b;
  text-shadow: 0 0 10px rgba(255, 235, 59, 0.8);
}

@keyframes fadeIn {
  to { opacity: 1; }
}

/* Titre de la page */
.page-title {
  margin-bottom: 30px;
  font-size: 2em;
  text-align: center;
  color: #ffffff;
}
</style>
