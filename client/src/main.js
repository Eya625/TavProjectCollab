import { createApp } from 'vue';
import App from './App.vue';
import router from './router/routes';
import '@fortawesome/fontawesome-free/css/all.css';
import '@fortawesome/fontawesome-free/js/all.js';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import './assets/styles/global.css'; 
import Chart from './charts/chart-setup.js';

// Importer les icônes souhaitées
import { faChartLine, faPrint, faFileInvoiceDollar, faTools, faHistory } from '@fortawesome/free-solid-svg-icons';
// Ajouter les icônes à la bibliothèque
library.add(faChartLine, faPrint, faFileInvoiceDollar, faTools, faHistory);

// Désactivation globale
Chart.defaults.animation = false;
Chart.defaults.transitions = {};


const app = createApp(App);
app.use(router);

// Enregistrer le composant globalement
app.component('font-awesome-icon', FontAwesomeIcon);

app.mount('#app');
