<template>
  <div class="container">
    <!-- Sidebar avec NavBar à gauche -->
    <div class="sidebar">
      <NavBar :showGreenDot="showGreenDot" />
    </div>

    <!-- Zone principale -->
    <div class="main">
      <!-- En-tête -->
      <header class="headersec">
        <div class="header-left">
          <h1>OLA Section</h1>
        </div>
        <div class="header-right">
          <router-link to="/notifications">
            <font-awesome-icon icon="fa-bell" class="icon" />
          </router-link>
          <router-link to="/">
            <font-awesome-icon icon="fa-sign-out-alt" class="icon" />
          </router-link>
        </div>
      </header>

      <!-- Slogan -->
      <div class="slogansec">
        <h2>Empowering Consumption Management with Ease</h2>
      </div>

      <!-- Global Filter Bar -->
      <div class="filter-bar row-align">
        <label for="yearFilter">Year</label>
        <input
          id="yearFilter"
          type="number"
          v-model="filterYear"
          placeholder="Enter a year"
        />
        <button @click="resetFilters" class="reset-filter-btn">
          Initialize Filters
        </button>
      </div>

      <!-- Contenu principal -->
      <div class="content-wrapper">
        <div class="main-content">
          <!-- Bouton d'ajout de carte -->
          <button class="add-btn" @click="showAddModal = true">
            <i class="fas fa-plus"></i> Add Card
          </button>

          <!-- Modal pour ajouter une nouvelle carte -->
          <transition name="fade">
            <div v-if="showAddModal" class="modal">
              <div class="modal-content">
                <h3>Add Consumption Card</h3>
                <input
                  v-model="newCardYear"
                  type="number"
                  placeholder="Enter consumption year"
                />
                <div class="modal-actions">
                  <button @click="saveCard">Save</button>
                  <button @click="closeModal">Cancel</button>
                </div>
              </div>
            </div>
          </transition>

          <!-- Affichage des cartes OLA existantes (filtrées par année) -->
          <div class="card-container">
            <div
              v-for="card in filteredCards"
              :key="card._id"
              class="card"
              @click="selectCard(card)"
            >
              <button
                class="deleteicon"
                :disabled="!canDeletedCard(card)"
                :title="
                  !canDeletedCard(card)
                    ? 'Deletion not allowed'
                    : 'Click to delete card'
                "
                @click.stop="deleteCard(card._id, card)"
              >
                <i class="fas fa-trash"></i>
              </button>
              <h3>{{ card.year }}</h3>
              <p>Total Consumption: {{ card.totalConsumption }}</p>
            </div>
          </div>

          <!-- Détails de la carte sélectionnée avec filtres complémentaires -->
          <div v-if="selectedCard" class="card-details">
            <!-- Upload PDF-->
            <div class="upload-wrapper">
              <div class="upload-bar">
                <input
                  type="file"
                  @change="onFileChange"
                  accept="application/pdf"
                />
                <button @click="onUpload" :disabled="!file">
                  Upload relevé
                </button>
              </div>
            </div>

            <h2>Details for {{ selectedCard.year }} Card</h2>

            <!-- Détails Filter Bar -->
            <div class="detail-filter-bar">
              <div class="row-align detail-row">
                <label for="depCodeFilter">Dep Code</label>
                <input
                  id="depCodeFilter"
                  type="text"
                  v-model="filterDepCode"
                  placeholder="Department Code"
                  class="small-input"
                />
                <button @click="resetDetailFilters" class="reset-filter-btn">
                  Initialize Filter Details
                </button>
              </div>
              <div class="filter-item">
                <label>Location</label>
                <div class="filter-checkboxes">
                  <label>
                    <input
                      type="checkbox"
                      value="HO"
                      v-model="filterLocations"
                    />
                    HO
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      value="NBE"
                      v-model="filterLocations"
                    />
                    NBE
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      value="MIR"
                      v-model="filterLocations"
                    />
                    MIR
                  </label>
                </div>
              </div>
            </div>

            <!-- Transition pour le tableau et les contrôles de pagination -->
            <transition name="slide-fade">
              <div>
                <table v-if="filteredDetails.length" class="details-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Employé</th>
                      <th>Card Number</th>
                      <th>Dep Code</th>
                      <th>Location</th>
                      <th>Monthly Limit</th>
                      <th v-for="month in dynamicMonths" :key="month">
                        {{ month }}
                      </th>
                      <!--<th>Consumption Year</th>-->
                      <th>% (FEB)</th>
                      <th>Discount</th>
                      <th>Total</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    <tr
                      v-for="(detail, index) in paginatedDetails"
                      :key="index"
                    >
                      <td>{{ detail.id }}</td>
                      <td>{{ detail.employe || detail.cardName }}</td>
                      <td>{{ detail.card_number }}</td>
                      <td>{{ detail.dep_code }}</td>
                      <td>{{ detail.location }}</td>
                      <td>{{ detail.monthly_limit }}</td>
                      <td
                        v-for="month in dynamicMonths"
                        :key="detail.card_number + '-' + month"
                      >
                        {{ detail.consumptions[month] || 0 }}
                      </td>

                      <!--<td>{{ calculateYearlyConsumption(detail) }}</td>-->
                      <td>{{ calculatePercentage(detail) }}%</td>
                      <td>{{ calculateDiscount(detail) }}</td>
                      <td>{{ calculateTotalAfterDiscount(detail) }}</td>
                      <td>
                        <!-- Actions selon la carte sélectionnée -->
                        <template v-if="selectedCard">
                          <!-- Pour une carte antérieure -->
                          <template
                            v-if="parseInt(selectedCard.year) < currentYear"
                          >
                            <!-- Si la facture est générée, seule la consultation est permise -->
                            <template v-if="selectedCard.isInvoiceGenerated">
                              <button
                                class="action-btn view_btn"
                                @click="openOlaModal(detail, true)"
                                title="Invoice generated. Card is read-only. "
                              >
                                See Details
                              </button>
                            </template>
                            <!-- Sinon, autoriser Update et Delete -->
                            <template v-else>
                              <button
                                class="action-btn update_btn"
                                @click="openOlaModal(detail)"
                                title="Update this entry"
                              >
                                Update
                              </button>
                              <button
                                class="action-btn delete_btn"
                                @click="deleteDetail(detail)"
                                title="Delete this entry"
                              >
                                Delete
                              </button>
                            </template>
                          </template>

                          <!-- Pour une carte de l'année en cours -->
                          <template v-else>
                            <button
                              class="action-btn update_btn"
                              @click="openOlaModal(detail)"
                              :title="
                                selectedCard.isInvoiceGenerated
                                  ? 'invoice generated. Crd remai,s editable for the current year. '
                                  : 'Update this entry'
                              "
                            >
                              Update
                            </button>
                            <button
                              class="action-btn delete_btn"
                              @click="deleteDetail(detail)"
                              title="Delete this entry"
                            >
                              Delete
                            </button>
                          </template>
                        </template>
                      </td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="summary-row">
                      <td colspan="6" class="summary-label">Totals</td>
                      <td
                        v-for="month in dynamicMonths"
                        :key="month"
                        class="summary-value"
                      >
                        {{ monthTotals[month] }}
                      </td>
                      <td class="summary-value"></td>
                      <td class="summary-value"></td>

                      <td class="summary-value">{{ totalAfterDiscountSum }}</td>
                      <td>
                        <!-- Bouton générer facture -->
                        <button
                          class="action-btn generate_invoice"
                          @click="openInvoiceForm()"
                        >
                          Generate Invoice
                        </button>
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <!-- Contrôles de pagination -->
                <div class="pagination-controls">
                  <button @click="prevPage" :disabled="currentPage === 0">
                    Précédent
                  </button>
                  <span>Page {{ currentPage + 1 }} sur {{ totalPages }}</span>
                  <button
                    @click="nextPage"
                    :disabled="currentPage >= totalPages - 1"
                  >
                    Suivant
                  </button>
                </div>
              </div>
            </transition>
          </div>

          <!-- Notification -->
          <div
            v-if="notification.show"
            :class="['notification', notification.type]"
          >
            {{ notification.message }}
          </div>

          <!-- Modal de mise à jour des consommations pour un détail -->
          <OlaModal
            v-if="showOlaModal"
            :visible="showOlaModal"
            :data="selectedOla"
            :readonly="isModalReadonly"
            :year="selectedOlaYear"
            :isInvoiced="selectedCard.isInvoiceGenerated"
            @save="handleSaveOla"
            @close="() => (showOlaModal = false)"
          />
          <!-- Modal Invoice Form -->
          <InvoiceForm
            v-if="showInvoiceModal"
            :showModal="showInvoiceModal"
            :isEditMode="true"
            :invoice="selectedInvoice"
            @save="handleInvoiceSave"
            @close="() => (showInvoiceModal = false)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted, computed, watch } from 'vue';
import apiServices from '../services/apiServices';
import NavBar from '../components/NavBar.vue';
import OlaModal from '../components/OlaModal';
import InvoiceForm from '../components/InvoiceForm.vue';
import Swal from 'sweetalert2';

import {
  groupDetailsByRegion,
  calculateGrandTotal
} from '../utils/invoiceUtils';

export default {
  name: 'ManageOLA',
  components: { NavBar, OlaModal, InvoiceForm },
  //création de setup pour intégrer les données réactives / fcts
  setup() {
    // Variables de base : création des données réactive
    // utile pour suivre automatiquement les changements
    const consumptionCards = ref([]);
    const showAddModal = ref(false);
    const newCardYear = ref('');
    const selectedCard = ref(null);
    const showOlaModal = ref(false);
    const selectedOla = ref(null);
    const notification = ref({ show: false, message: '', type: '' });
    const isModalReadonly = ref(false);
    const filterYear = ref(''); // Filtres globaux pour les cartes
    const filterLocations = ref([]); // Filtres pour les détails d'une carte
    const filterDepCode = ref('');
    const selectedOlaYear = ref(new Date().getFullYear());
    const currentYear = new Date().getFullYear();
    // pagination des détails
    const currentPage = ref(0); // page actuelle (0-indexée)
    const itemsPerPage = ref(5); // nombre de lignes par page
    const file = ref(null);
    const preservePage = ref(false);

    // Gestion des notifications
    const showNotification = (message, type = 'success') => {
      notification.value = { show: true, message, type };
      setTimeout(() => {
        notification.value.show = false;
      }, 3000);
    };
    // 1) computed des mois dynamiques
    // génération dynamique des la liste des mois à afficher
    // si consommation mois = 0 on ne l'affiche pas
    const dynamicMonths = computed(() => {
      const details = selectedCard.value?.details || [];
      const seen = new Set();

      // on ne garde que les mois où au moins une conso > 0
      details.forEach((d) =>
        Object.entries(d.consumptions).forEach(([month, val]) => {
          if (val > 0) seen.add(month);
        })
      );
      // on renvoie dans l’ordre défini par monthNames
      return monthNames.filter((m) => seen.has(m));
    });

    // 2) computed des totaux par mois (arrondi à 3 décimales)
    const monthTotals = computed(() => {
      const details = selectedCard.value?.details || [];
      const totals = {};

      dynamicMonths.value.forEach((month) => {
        const rawSum = details.reduce(
          (sum, d) => sum + (d.consumptions[month] || 0),
          0
        );
        // arrondir à 3 décimales : multiplie, arrondit, puis redivise
        totals[month] = Math.round(rawSum * 1000) / 1000;
      });

      return totals;
    });
    /*________
    // Gestion des notifications
    const showNotification = (message, type = 'success') => {
      notification.value = { show: true, message, type };
      setTimeout(() => {
        notification.value.show = false;
      }, 3000);
    };_ Partie Filtrage des cartes + data card_________   */
    // Computed pour filtrer les détails de la carte sélectionnée
    const filteredDetails = computed(() => {
      if (!selectedCard.value?.details) return [];
      let details = selectedCard.value.details;

      // Filtre par emplacement
      if (filterLocations.value.length) {
        details = details.filter((d) =>
          filterLocations.value.includes(d.location)
        );
      }

      // Filtre par dep_code, en protégeant d.dep_code
      if (filterDepCode.value) {
        const search = filterDepCode.value.toLowerCase();
        details = details.filter((d) =>
          (d.dep_code || '').toLowerCase().includes(search)
        );
      }

      return details;
    });

    // Computed pour découper les détails selon la page actuelle
    const paginatedDetails = computed(() => {
      const start = currentPage.value * itemsPerPage.value;
      const end = start + itemsPerPage.value;
      return filteredDetails.value.slice(start, end);
    });

    // Nombre total de pages
    const totalPages = computed(() => {
      return Math.ceil(filteredDetails.value.length / itemsPerPage.value);
    });
    // Méthodes de pagination
    const nextPage = () => {
      if (currentPage.value < totalPages.value - 1) {
        currentPage.value++;
      }
    };
    const prevPage = () => {
      if (currentPage.value > 0) {
        currentPage.value--;
      }
    };
    watch(filteredDetails, () => {
      if (!preservePage.value) {
        currentPage.value = 0;
      }
      preservePage.value = false;
    });

    const resetFilters = () => {
      filterYear.value = '';
      selectedCard.value = null;
    };
    const resetDetailFilters = () => {
      filterLocations.value = [];
      filterDepCode.value = '';
    };
    // Computed pour filtrer les cartes par année
    // filtres initial par année
    const filteredCards = computed(() => {
      if (!filterYear.value) return consumptionCards.value;
      return consumptionCards.value.filter(
        (card) => card.year === Number(filterYear.value)
      );
    });

    /*_________ FinPartie Filtrage des cartes + data card_________   */

    /*  _________Partie pour les cartes OLA______________  */
    //conversion entre numéro et clé nominale -> upload relevé
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December'
    ];

    // gestion de la sélection de fichier dans l'input + récupération et stockage dans la ref file
    function onFileChange(evt) {
      file.value = evt.target.files[0];
    }
    async function onUpload() {
      // 0) S’assurer qu’un fichier et une carte sont sélectionnés
      if (!file.value || !selectedCard.value) return;

      // 1) Préparation du FormData pour l’upload
      const form = new FormData();
      form.append('file', file.value);

      try {
        // 2) Extraction period + tableData depuis le PDF
        const { period, tableData } =
          await apiServices.uploadDetailsReleves(form);
        //    period = "YYYY-MM"

        // 3) Vérifier que l’année extraite correspond à celle de la carte
        const [yearStr, monthStr] = period.split('-');
        const extractedYear = parseInt(yearStr, 10);
        const cardYear = Number(selectedCard.value.year);
        if (extractedYear !== cardYear) {
          // Notification et arrêt si années différentes
          showNotification(
            `Year of details (${extractedYear}) doesn't match year of card (${cardYear}).`,
            'error'
          );
          return;
        }

        // 4) Détermination de la clé de mois (ex. "March")
        const monthKey = monthNames[parseInt(monthStr, 10) - 1];

        // 5) Mise à jour locale de selectedCard.value.details
        tableData.forEach(({ cardNumber, total }) => {
          const cleanPdfNum = cardNumber.replace(/^0+/, '');
          const detail = selectedCard.value.details.find(
            (d) => d.card_number.replace(/^0+/, '') === cleanPdfNum
          );
          if (detail) {
            detail.consumptions[monthKey] = total;
          }
        });

        // 6) Envoi vers le backend pour persistance
        const response = await apiServices.saveReleveData({
          period,
          cardId: selectedCard.value.id,
          data: tableData
        });

        // 7) Notification de succès ou cas inattendu
        if (response.success && response.message) {
          showNotification(response.message, 'success');
        } else {
          showNotification(
            'Upload completed, but unexpected response.',
            'warning'
          );
        }
      } catch (err) {
        // 8.a) Doublon détecté (409 Conflict)
        if (err.response?.status === 409 && err.response.data?.message) {
          showNotification(err.response.data.message, 'warning');
        }
        // 8.b) Toutes autres erreurs
        else {
          console.error('Error while saving relevés:', err);
          showNotification('Error uploading details.', 'error');
        }
      }
    }

    // ==== fin upload ====
    // récupération des cartes OLA depuis la base
    const fetchCards = async () => {
      try {
        // appel à l'API et mise à jour de la ref 'consumptioncards'
        consumptionCards.value = await apiServices.getCards();
      } catch (error) {
        //console.error('Error fetching cards:', error);
        showNotification('Error while fetching cards', 'error');
      }
    };

    // Fonctions d'ajout d'une nouvelle carte
    const saveCard = async () => {
      const enteredYear = Number(newCardYear.value);
      const currentYear = new Date().getFullYear();

      if (!enteredYear) {
        showNotification('The Year field is Required', 'error');
        return;
      }
      if (enteredYear > currentYear) {
        showNotification(
          'You cannot add a year greater than the current year',
          'error'
        );
        return;
      }

      const cardData = { year: enteredYear };
      try {
        const newCard = await apiServices.addCard(cardData);
        if (newCard) {
          consumptionCards.value.push(newCard);
          closeModal();
          showNotification('Successfully added card');
        } else {
          showNotification('Invalid API response', 'error');
        }
      } catch (error) {
        showNotification('Error adding card', 'error');
      }
    };

    const closeModal = () => {
      showAddModal.value = false;
      newCardYear.value = '';
    };

    const selectCard = async (card) => {
      try {
        // Appel API pour récupérer les détails complets de la carte
        const cardDetails = await apiServices.getCardDetails(card._id);
        // Si on clique à nouveau sur la même carte, la désélectionner
        selectedCard.value =
          selectedCard.value && selectedCard.value._id === cardDetails._id
            ? null
            : cardDetails;
        resetDetailFilters();
      } catch (error) {
        console.error('Error fetching card details:', error);
        showNotification('Erreur lors de la récupération des détails', 'error');
      }
    };

    // setectedcard.value && selectedcard.value.invoicegenerated
    // on vérifie ici que selectedCard existe et que sa facture est générée

    // fonction d'ouverture du modal OLA (pour update ou consultation)
    const openOlaModal = (ola = null, readonly = false) => {
      /* on va déterminer le mode de lecture seule(ReadOnlyFinal)  */
      const readOnlyFinal =
        selectedCard.value && selectedCard.value.invoiceGenerated
          ? // si facture générée ET année antérieure → lecture seule
            parseInt(selectedCard.value.year) < currentYear
          : // sinon (pas de facture ou même année courante) → on respecte le readonly passé cad readonly = false
            readonly;

      // S'il n'y a pas d'objet ola, on prépare une nouvelle entrée
      selectedOla.value = ola
        ? { ...ola }
        : {
            id: '',
            employe: '',
            card_number: '',
            dep_code: '',
            location: '',
            monthly_limit: 0,
            consumptions: {
              January: 0,
              February: 0,
              March: 0,
              April: 0,
              May: 0,
              June: 0,
              July: 0,
              August: 0,
              September: 0,
              October: 0,
              November: 0,
              December: 0
            },
            totalConsumption: 0,
            finalized: false
          };
      // Passage de l'année de la carte au modal.
      // Si la carte sélectionnée existe, on prend son année, sinon on prend l'année courante.
      selectedOlaYear.value = selectedCard.value?.year || currentYear;
      isModalReadonly.value = readOnlyFinal;
      showOlaModal.value = true;
    };

    // fonction de  Sauvegarde des données de consommation depuis le modal
    const handleSaveOla = async (updatedDetail) => {
      // on marque la page pour qu'elle ne soit pas rechargé
      preservePage.value = true;
      // Vérification que toutes les valeurs de consommation soient non négatives
      const hasNegativeConsumption = Object.values(
        updatedDetail.consumptions
      ).some((value) => Number(value) < 0);
      if (hasNegativeConsumption) {
        showNotification('Consumption amounts must be non-negative.', 'error');
        return;
      }
      // Interdire la modification si la carte est facturée
      if (selectedCard.value.invoiceGenerated) {
        showNotification(
          'Card already Invoiced. You cannot modify.',
          'warning'
        );
        return;
      }
      // Mise à jour locale du détail dans la carte sélectionnée
      // on cherche l'index du détail(par ID) dans selectedCrd.value.details
      const index = selectedCard.value.details.findIndex(
        (d) => d.id === updatedDetail.id
      );
      if (index !== -1) {
        // si le détail existait déjà, on le remplace à la même position
        selectedCard.value.details.splice(index, 1, updatedDetail);
      } else {
        // sinon on l'ajoute à la fin de tableau(comme nv détail)
        selectedCard.value.details.push(updatedDetail);
      }

      // Recalcul des consommations
      // a) par détail : appel à notre fonction utilitaire
      updatedDetail.totalConsumptionYear =
        calculateYearlyConsumption(updatedDetail);
      // b) global : somme de tous les mois de tous les détails
      let total = selectedCard.value.details.reduce((sum, detail) => {
        const consumptions = Object.values(detail.consumptions);
        return sum + consumptions.reduce((acc, curr) => acc + Number(curr), 0);
      }, 0);
      selectedCard.value.totalConsumption = total;

      // Préparation du payload pour l'API
      const payload = {
        detailId: updatedDetail.id,
        totalConsumption: selectedCard.value.totalConsumption,
        consumptions: updatedDetail.consumptions,
        employe: updatedDetail.employe,
        card_number: updatedDetail.card_number,
        dep_code: updatedDetail.dep_code,
        location: updatedDetail.location,
        monthly_limit: updatedDetail.monthly_limit
      };
      /* Envoie de la requête de mise à jour au serveur */
      try {
        // appel asynchrone à votre serveur API
        const updatedCard = await apiServices.updateCard(
          selectedCard.value._id,
          payload
        );
        // si succès, on met à jour selectedCard avec la réponse réçu de serveur
        selectedCard.value = { ...updatedCard };
        const cardIndex = consumptionCards.value.findIndex(
          (card) => card._id === updatedCard._id
        );
        if (cardIndex !== -1) {
          consumptionCards.value.splice(cardIndex, 1, updatedCard);
        }
        showNotification('Successfully Updating Card');
      } catch (error) {
        // en cas d'erreur, on notifie
        console.error('Error updating card:', error);
        showNotification('Error Updating Card', 'error');
      } finally {
        // fermeture de modal
        showOlaModal.value = false;
      }
    };

    // fonction pour  Supprimer un détail de la carte de consommation
    const deleteDetail = async (detail) => {
      if (!selectedCard.value) return;
      // Empêcher la suppression si la carte est facturée
      if (selectedCard.value.invoiceGenerated) {
        showNotification(
          'This card has already been invoiced. You can no longer modify it.',
          'error'
        );
        return;
      }
      try {
        // appel API afin de supprimer le détail de consomm
        // on passe l'ID de la carte
        // on passe l'ID du détail || num carte
        const updatedCard = await apiServices.deleteDetailFromCard(
          selectedCard.value._id,
          detail.id || '',
          detail.id ? null : detail.card_number
        );
        // synchronisation du détail supprimé
        // on met à jour le selectedCard avec la réponse du serveur
        selectedCard.value = { ...updatedCard };
        // MAJ la liste globale des cartes
        const cardIndex = consumptionCards.value.findIndex(
          (card) => card._id === updatedCard._id
        );
        if (cardIndex !== -1) {
          consumptionCards.value.splice(cardIndex, 1, updatedCard);
        }
        showNotification('Successfully Deleted Detail consumption ');
      } catch (error) {
        console.error('Error deleting detail :', error);
        showNotification('Error deleting detail consumption', 'error');
      }
    };

    const canDeletedCard = (card) => {
      return !card.totalConsumption || card.totalConsumption <= 0;
    };

    // fonction de suppression d'une carte de consommation
    const deleteCard = async (cardId, card) => {
      // 1. Vérifier que l’icône est activée
      if (!canDeletedCard(card)) {
        showNotification('Deletion not allowed', 'error');
        return; // stop si l'icône est désactivée
      }
      // 2. Ouvrir le modal de confirmation au user(sweetalert)
      const result = await Swal.fire({
        title: 'Are You sure ?',
        text: `Do you really want to delete the card for year ${card.year}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Non, Keep it'
      });

      // 3. Si l’utilisateur confirme, on supprime
      if (result.isConfirmed) {
        try {
          // appel API pour la suppression de la carte côté serveur
          await apiServices.deleteCard(cardId);
          // mise à jour locale : on retire la carte du tableau
          consumptionCards.value = consumptionCards.value.filter(
            (c) => c._id !== cardId
          );
          showNotification('Card deleted successfully', 'success');
        } catch (error) {
          console.error(error);
          showNotification('Error deleting card', 'error');
        }
      }
      // 4. Si l’utilisateur annule, on ne fait rien (le modal se ferme tout seul)
    };
    /*  _________Fin Partie pour les cartes OLA______________  */

    // --- Partie Facturation ---
    const showInvoiceModal = ref(false);
    const selectedInvoice = ref({});
    // Référence pour le green dot dans la navbar (passée à NavBar via props)
    const showGreenDot = ref(false);

    // Fonction pour ouvrir le formulaire de facture
    const openInvoiceForm = () => {
      const transformedDetails = filteredDetails.value.map((detail) => ({
        ...detail,
        // Utiliser detail.location comme région (à adapter si besoin)
        region: detail.location,
        // Définir expenseAmount à partir de votre calcul existant
        expenseAmount: parseFloat(calculateTotalAfterDiscount(detail)) || 0
      }));
      // Utiliser le module utilitaire pour regrouper par région et calculer les totaux
      const regions = groupDetailsByRegion(transformedDetails);
      const grandTotal = calculateGrandTotal(regions);
      const stampTax = 1;
      const year =
        selectedCard.value && selectedCard.value.year
          ? selectedCard.value.year
          : '';
      selectedInvoice.value = {
        invoiceType: `Feb Invoice ${year}`,
        month: 'Feb',
        grandTotal: grandTotal,
        stampTax: stampTax,
        totalWithTax: parseFloat((grandTotal + stampTax).toFixed(3)),
        regions: regions
      };

      // Ouvrir le modal InvoiceForm en mode édition
      showInvoiceModal.value = true;
    };

    // fonction appelée quand on valide la création/enregistrement de la facture
    const handleInvoiceSave = async (invoiceData) => {
      // validation : montant de facture ne doit pas être égale à 0
      const total = Number(invoiceData.grandTotal);
      if (total === 0) {
        showNotification(
          'The invoice amount cannot be zero. You must fill in the consumption amounts.',
          'error'
        );
        return; // annulation de l'enregistrement si le montant est nul
      }
      try {
        // marqué facture à été générée
        invoiceData.isInvoiceGenerated = true;
        // envoie dans le serveur
        await apiServices.addInvoice(invoiceData);

        //console.log('cards retreived  :', selectedCard.value);

        if (selectedCard.value) {
          const cardId = selectedCard.value._id || selectedCard.value.id;
          if (!cardId) {
            console.error(
              'No identifier found for the selected card:',
              selectedCard.value
            );
          } else {
            //appel API pour marqué la carte comme facturée
            await apiServices.updateCard(cardId, { isInvoiceGenerated: true });
            // mise à jour local de nv statut
            selectedCard.value.isInvoiceGenerated = true;

            // Forcer le mode readonly du modal si la carte est toujours affichée
            isModalReadonly.value = true;
          }
        }
        showNotification('Invoice created successfully!', 'success');
        //  Rafraîchit la liste (utile si elle est affichée ailleurs)
        await fetchCards();

        showGreenDot.value = true;
        showInvoiceModal.value = false;

        setTimeout(() => {
          showGreenDot.value = false;
        }, 7000);
      } catch (error) {
        console.error('Error saving invoice:', error);
        showNotification('An error occurred while saving the invoice', 'error');
      }
    };

    /* _______________Fin Partie Facturation_____________ */

    /*     ____________Fonctions de calcul pour le tableau de carte OLA__________________ */
    const calculateYearlyConsumption = (detail) => {
      if (!detail || !detail.consumptions) return 0;
      return Object.values(detail.consumptions).reduce(
        (sum, monthValue) => sum + Number(monthValue || 0),
        0
      );
    };

    const calculateTotalFebConsumption = () => {
      if (!selectedCard.value || !selectedCard.value.details) return 0;
      return selectedCard.value.details.reduce(
        (sum, detail) => sum + Number(detail.consumptions?.February || 0),
        0
      );
    };

    const calculatePercentage = (detail) => {
      const totalFeb = calculateTotalFebConsumption();
      const febConsumption = Number(detail.consumptions?.February || 0);
      return totalFeb > 0 ? Math.round((febConsumption / totalFeb) * 100) : 0;
    };

    const calculateDiscount = (detail) => {
      const totalFeb = calculateTotalFebConsumption();
      const febConsumption = Number(detail.consumptions?.February || 0);
      if (totalFeb === 0) return '0.000';
      const discountValue = 20.534 * (febConsumption / totalFeb);
      return discountValue.toFixed(3);
    };

    const calculateTotalAfterDiscount = (detail) => {
      const febConsumption = Number(detail.consumptions?.February || 0);
      const discount = Number(calculateDiscount(detail));
      return (febConsumption - discount).toFixed(3);
    };

    // Total après discount pour Février (utilisé dans le watch pour la facture)
    const totalAfterDiscountSum = computed(() => {
      if (!selectedCard.value || !selectedCard.value.details) return 0;
      return filteredDetails.value
        .reduce(
          (sum, detail) =>
            sum + parseFloat(calculateTotalAfterDiscount(detail)),
          0
        )
        .toFixed(3);
    });

    onMounted(() => {
      fetchCards();
    });

    return {
      // Variables principales
      consumptionCards,
      showAddModal,
      newCardYear,
      selectedCard,
      saveCard,
      closeModal,
      selectCard,
      openOlaModal,
      showOlaModal,
      selectedOla,
      handleSaveOla,
      deleteDetail,
      deleteCard,
      canDeletedCard,
      isModalReadonly,
      // Fonctions de calcul
      calculateYearlyConsumption,
      calculatePercentage,
      calculateDiscount,
      calculateTotalAfterDiscount,
      totalAfterDiscountSum,
      // Filtres
      filterYear,
      filteredCards,
      filterLocations,
      filterDepCode,
      filteredDetails,
      notification,
      resetFilters,
      resetDetailFilters,
      // Partie Facturation
      openInvoiceForm,
      showInvoiceModal,
      selectedInvoice,
      showGreenDot,
      handleInvoiceSave,
      // années
      selectedOlaYear,
      currentYear,
      // pagination
      currentPage,
      itemsPerPage,
      paginatedDetails,
      totalPages,
      nextPage,
      prevPage,
      // nv elements
      file,
      monthNames,
      onFileChange,
      onUpload,
      // ajout des mois dynamiquement
      dynamicMonths,
      monthTotals
    };
  }
};
</script>

<style scoped>
/* Conteneur global en mode ligne */
.container {
  display: flex;
  min-height: 100vh;
  background-size: 200% 200%;
  animation: bgAnimation 12s ease infinite;
}

/* Zone principale qui occupe le reste de l'espace */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Animation de fond */
@keyframes bgAnimation {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

/* En-tête avec effet slide-down */
.headersec {
  height: 80px;
  background: rgba(15, 32, 65, 0.85);
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  animation: slideDown 0.8s ease-out;
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
  }

  to {
    transform: translateY(0);
  }
}

.header-left h1 {
  margin: 0;
  font-size: 2rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.header-right {
  display: flex;
  align-items: center;
}

.header-right .icon,
.header-right {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  margin-left: 10px;
  cursor: pointer;
  transition: color 0.3s;
  color: #9fd2dc;
}

.header-right .icon:hover,
.header-right:hover {
  color: #e0e0e0;
}

/* Slogan centré avec animation fade-in */
.slogansec {
  text-align: center;
  background: linear-gradient(135deg, #bdbfcb, #9fd2dc);
  padding: 1rem;
  animation: fadeIn 1s ease;
}

.slogansec h2 {
  margin: 0;
  font-size: 1.8rem;
  color: #0c4176;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);
}

/* Contenu principal (zone scrollable, par exemple) */
.content-wrapper {
  flex: 1;
  display: flex;
  animation: fadeIn 1s ease;
}

/* Zone de contenu */
.main-content {
  flex: 1;
  padding: 2rem;
  background: #f4f7fa;
  position: relative;
  overflow: hidden;
  width: 100%;
  animation: contentFadeIn 1.2s ease;
}

/* Animations additionnelles */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* Exemple d'effet dynamique sur des éléments de contenu (cartes) */
.main-content .card {
  background: #fff;
  padding: 1.5rem;
  margin: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.main-content .card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

/*  Bouton d'ajout */
.add-btn {
  background-color: #2a5298;
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.7s;
}

.add-btn:hover {
  background-color: #0e46ae;
}

/* 🔹 Cartes OLA */
.card-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 2rem;
}

.card {
  background: #fff;
  border-radius: 6px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  position: relative;
  flex: 1 1 calc(33.333% - 1rem);
  transition: transform 0.3s;
  z-index: 10;
  display: flex;
  /* Ajout pour centrer le contenu */
  flex-direction: column;
  /* Si besoin d'une organisation en colonnes */
  justify-content: space-between;
  /* Pour un espacement vertical équilibré */
}

.card:hover {
  transform: translateY(-5px);
}

.deleteicon {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  border: none;
  cursor: pointer;
  font-size: 1.2rem;
  color: red;
  background-color: transparent;
}

/* 🔹 MODAL - affichage */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  backdrop-filter: blur(5px);
  animation: fadeIn 0.3s ease-in-out;
  z-index: 1000;
  /* Assure que le modal est toujours au-dessus */
}

.modal-content {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transform: scale(0.9);
  animation: bounceIn 0.4s ease forwards;
  z-index: 1100;
  /* S'assure que le contenu du modal est visible */
}

/*  Animation du modal */
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: scale(0.8) translateY(-20px);
}

.fade-enter-to {
  opacity: 1;
  transform: scale(1) translateY(0);
}

.fade-leave-from {
  opacity: 1;
  transform: scale(1);
}

.fade-leave-to {
  opacity: 0;
  transform: scale(0.8) translateY(-20px);
}

/*  Boutons dans le modal */
.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.modal-actions button {
  background: #3498db;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 5px;
  cursor: pointer;
  transition:
    background 0.3s,
    transform 0.2s;
}

.modal-actions button:hover {
  background: #2980b9;
  transform: scale(1.05);
}

/* Bouton de fermeture */
.modal-actions button:last-child {
  background: #e74c3c;
}

.modal-actions button:last-child:hover {
  background: #c0392b;
}

/*  Animation Bounce-In */
@keyframes bounceIn {
  0% {
    transform: scale(0.7) translateY(-30px);
    opacity: 0;
  }

  50% {
    transform: scale(1.05) translateY(10px);
    opacity: 1;
  }

  100% {
    transform: scale(1) translateY(0);
  }
}

/* 🔹 Animation Fade */
@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/*  Notifications */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 15px 25px;
  border-radius: 5px;
  font-weight: bold;
  color: #fff;
  opacity: 0;
  animation: fadeInOut 3s forwards;
  z-index: 1100;
}

.notification.success {
  background-color: #4caf50;
}

.notification.error {
  background-color: #f44336;
}

@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(-20px);
  }

  10% {
    opacity: 1;
    transform: translateY(0);
  }

  90% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform: translateY(-20px);
  }
}

/*  Tableau stylisé */
.details-table {
  width: 90%;
  margin: 20px auto;
  border-collapse: collapse;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.1);
}

/* En-tête du tableau */
.details-table th {
  background: linear-gradient(135deg, #1e3c72, #2a5298);
  color: white;
  font-weight: bold;
  padding: 12px;
  text-align: center;
  border-bottom: 2px solid #ddd;
}

/* Corps du tableau */
.details-table td {
  padding: 12px;
  border-bottom: 1px solid #ddd;
  text-align: center;
}

/* Zébrage des lignes */
.details-table tbody tr:nth-child(odd) {
  background-color: #f9f9f9;
}

/* Effet hover sur les lignes */
.details-table tbody tr:hover {
  background-color: #f1f1f1;
  transform: scale(1.01);
  transition: 0.2s ease-in-out;
}

/* Actions boutons stylisés */
.action-btn {
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
}

/* Bouton Mettre à Jour */
.update_btn {
  background: #0c55d2;
  color: white;
}

.update_btn:hover {
  background: #042973;
  transform: scale(1.05);
}

/* Bouton Supprimer */
.delete_btn {
  background: #f1341f;
  color: white;
}

.delete_btn:hover {
  background: darkred;
  transform: scale(1.05);
}

/* Animation d’apparition */
@keyframes fadeInTable {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.details-table {
  animation: fadeInTable 0.5s ease-in-out;
}

.summary-row {
  background: linear-gradient(90deg, #f7f7f7, #e8f0fe);
  font-weight: bold;
  animation-name: slideInBounce;
  animation-duration: 4s;
  animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  animation-fill-mode: forwards;
  animation-iteration-count: infinite;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.1);
}

/* Style pour la cellule d'étiquette */
.summary-label {
  text-align: right;
  padding-right: 10px;
}

/* Style pour la valeur du total */
.summary-value {
  text-align: right;
  padding-right: 10px;
  color: #2a9d8f;
  font-size: 1.1em;
}

/* Animation slideInBounce */
@keyframes slideInBounce {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }

  60% {
    opacity: 1;
    transform: translateY(-5px) scale(1.05);
  }

  80% {
    transform: translateY(3px) scale(0.98);
  }

  100% {
    transform: translateY(0) scale(1);
  }
}

/* --- GLOBAL FILTER BAR --- */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1.2rem;
  margin: 1rem 2rem;
  background: linear-gradient(135deg, #b3e5fc, #81d4fa);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.5s ease-out;
}

/* --- DETAILS FILTER BAR --- */
.detail-filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  padding: 1.2rem;
  margin: 1rem 2rem;
  background: linear-gradient(135deg, #b3e5fc, #81d4fa);
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.5s ease-out;
}

/* Animation */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-15px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Classe commune pour aligner horizontalement */
.row-align {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Utilisé dans le bloc de détails pour le champ et bouton */
.detail-row {
  flex: 1;
}

/* Style des labels */
.filter-bar label,
.detail-row label,
.filter-item label {
  font-weight: 600;
  color: #01579b;
  margin: 0;
}

/* Style des champs de saisie */
.filter-bar input[type='number'],
.detail-row input[type='text'],
.filter-item input[type='text'] {
  padding: 0.6rem;
  border: 1px solid #b0bec5;
  border-radius: 6px;
  transition:
    border-color 0.3s,
    box-shadow 0.3s;
}

.filter-bar input[type='number']:focus,
.detail-row input[type='text']:focus,
.filter-item input[type='text']:focus {
  border-color: #0288d1;
  box-shadow: 0 0 6px rgba(2, 136, 209, 0.5);
}

/* Réduction de la largeur du champ Dep Code */
.small-input {
  max-width: 120px;
}

/* Style des cases à cocher */
.filter-checkboxes {
  display: flex;
  gap: 0.5rem;
}

.filter-checkboxes label {
  background: #ffffff;
  padding: 0.4rem 0.7rem;
  border-radius: 6px;
  cursor: pointer;
  transition:
    background-color 0.3s,
    transform 0.2s;
  border: 1px solid #b0bec5;
}

.filter-checkboxes label:hover {
  background: #e1f5fe;
  transform: translateY(-2px);
}

/* Bouton de réinitialisation (utilisé dans les deux sections) */
.reset-filter-btn {
  padding: 0.6rem 1.2rem;
  background-color: #0288d1;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition:
    background-color 0.3s,
    transform 0.2s;
}

.reset-filter-btn:hover {
  background-color: #0277bd;
  transform: scale(1.05);
}

/*  ______________ Styles Pagination du Tableau ______________  */

/* conteneur centré */
.pagination-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  animation: fadeInUp 1s ease-in-out;
}

.pagination-controls button {
  background-color: #4caf50;
  border: none;
  color: white;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
  transition:
    transform 0.3s ease,
    background-color 0.3s ease;
  border-radius: 5px;
}

.pagination-controls button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.pagination-controls button:hover:not(:disabled) {
  transform: scale(1.1);
  background-color: #45a049;
  box-shadow:
    0 0 10px #4caf50,
    0 0 20px #4caf50;
}

/*  animation de fadeInUp*/
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.upload-bar {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  max-width: 500px;
  margin: 2rem auto;
  transition: box-shadow 0.3s ease-in-out;
}
.upload-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.upload-bar:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

.upload-bar input[type='file'] {
  flex: 1;
  padding: 0.5rem;
  border: 2px dashed #bbb;
  border-radius: 0.75rem;
  background-color: #fff;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.upload-bar input[type='file']:hover {
  border-color: #777;
}

.upload-bar button {
  padding: 0.5rem 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 0.75rem;
  cursor: pointer;
  font-weight: 600;
  transition: background-color 0.3s ease;
}

.upload-bar button:hover {
  background-color: #45a049;
}

.upload-bar button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
  color: #666;
}
.chart-wrapper {
  width: 100%;
  max-width: 600px;
  margin-bottom: 24px;
}
canvas {
  width: 100% !important;
  height: 300px !important;
}
</style>
