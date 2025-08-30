<template>
  <div class="chart-card">
    <h3>Consumption By Location({{ year }})</h3>
    <!-- Le <canvas> est l’élément HTML sur lequel Chart.js va dessiner le graphique.
         ref="ctx" permet de le récupérer depuis le script via la référence ctx. -->
    <canvas ref="ctx"></canvas>
  </div>
</template>


<script>
import { ref, onMounted, watch } from 'vue';
/* Import des modules Chart.js nécessaires pour un doughnut */
import {
  Chart,// Classe principale pour créer tout graphique
  DoughnutController, // Contrôleur pour le type "doughnut"
  ArcElement,  // Élément graphique représentant une part de doughnut arc / segment
  Tooltip,  // Plugin pour les info-bulles
  Legend // Plugin pour la légende
} from 'chart.js';

import api from '../services/apiServices';
/* Enregistrement des composants Chart.js qu’on va utiliser */
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

export default {
  name: 'ByLocationChart',  // Nom du composant (facultatif, utile pour le debug)
  props: {
    year:               { type: Number,  required: true },
    selectedEmployee:   { type: String,  default: '' },   // Filtre employé (chaîne vide par défaut)
    selectedLocations:  { type: Array,   default: () => [] },// Filtre lieux (tableau vide par défaut)
    colors:             { type: Array,   default: () => [] } // Palette de couleurs pour les parts du doughnut
  },
  setup(props) {
     /* ctx C’est une référence réactive vers le <canvas> du template.
       Une fois le composant monté, ctx.value contiendra l’élément DOM. */
    const ctx = ref(null);
    /* chartInstance
       Variable pour stocker l’instance Chart.js créée.
       Utile pour la détruire avant de redessiner afin d’éviter les doublons. */
    let chartInstance = null;
 /*  buildChartData(raw)
       Fonction qui prend les données brutes (tableau d’objets)
       et renvoie un objet { labels, values, backgroundColor } utilisable par Chart.js. */
    const buildChartData = (raw) => {
      // labels : noms des lieux (_id retourné par l’agrégation MongoDB)
      const labels = raw.map(d => d._id);
      // values : totaux des consommations
      const values = raw.map(d => d.total);
      // backgroundColor : on assigne à chaque part une couleur issue de props.colors
      const backgroundColor = labels.map((_, i) =>
        props.colors[i % props.colors.length]
      );
      return { labels, values, backgroundColor };
    };
 /* options
        Configuration du graphique : responsive, pourcentage de découpe,
       position et style de la légende, style des tooltips, etc. */
    const options = {
      responsive: true,
      cutout: '40%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            color: '#fff',
            font: { size: 12 }
          }
        },
        tooltip: {
          titleColor: '#fff',
          bodyColor: '#fff',
          backgroundColor: 'rgba(0,0,0,0.8)'
        }
      }
    };
/* === draw() ===
       Fonction asynchrone qui :
         1. Appelle l’API pour récupérer les données filtrées
         2. Construit les données Chart.js via buildChartData
         3. Détruit tout ancien graphique existant
         4. Crée une nouvelle instance Chart.js sur le canvas */
    const draw = async () => {
      // 1. Récupération des données depuis /by-location
      const rawData = await api.getByLocation(
        props.year,
        props.selectedEmployee,
        props.selectedLocations
      );
      // 2. Construction des labels, valeurs et couleurs
      const { labels, values, backgroundColor } = buildChartData(rawData);
      // 3. Si un chart existe déjà, on le détruit
      if (chartInstance) {
        chartInstance.destroy();
      }
      // 4. Création du doughnut
      chartInstance = new Chart(ctx.value.getContext('2d'), // contexte 2D du canvas
      {
        type: 'doughnut',
        data: {
          labels,
          datasets: [{
            data: values,
            backgroundColor,
            borderColor: '#fff',
            borderWidth: 2
          }]
        },
        options
      });
    };
 /* onMounted(draw)
       Exécute draw() une première fois quand le composant est monté dans le DOM. */
    onMounted(draw);
     /* === watch([...], draw, { deep: true }) ===
       Surveille les changements sur year, selectedEmployee et selectedLocations.
       Si l’un de ces props change, relance draw() pour mettre à jour le graphique.
       deep: true permet de détecter les modifications internes du tableau selectedLocations. */
    watch(
      [() => props.year, () => props.selectedEmployee, () => props.selectedLocations],
      draw,
      { deep: true }
    );
    // On expose ctx (référence) pour le template ; chartInstance reste privé.
    return { ctx };
  }
};
</script>

<style scoped>
.chart-card {
  background: rgba(0, 0, 0, 0.8);
  padding: 1rem;
  border-radius: 0.75rem;
  color: #fff;
}

.chart-card h3 {
  margin: 0 0 0.5rem;
  color: #FFA500;
  font-size: 1.1rem;
  text-align: center;
}
</style>
