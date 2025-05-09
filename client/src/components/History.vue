<template>
  <div class="history-container">
    <!-- Bouton Clear History -->
    <div class="history-header">
      <button class="clear-btn" @click="openConfirmation">Clear History</button>
    </div>
    <div v-if="actions.length">
      <div
        v-for="action in actions"
        :key="action._id"
        class="card history-card"
        @click="toggleDetails(action._id)"
      >
        <div class="card-body">
          <h5 class="card-title">
            <i
              v-if="action.type === 'add'"
              class="fas fa-plus-circle text-success"
            ></i>
            <i
              v-else-if="action.type === 'update'"
              class="fas fa-edit text-warning"
            ></i>
            <i
              v-else-if="action.type === 'delete'"
              class="fas fa-trash-alt text-danger"
            ></i>
            {{ formatDescription(action) }}
          </h5>
          <p class="card-date">
            {{ formatDate(action.timestamp) }}
          </p>
          <transition name="detail">
            <div v-if="activeDetails === action._id" class="card-details">
              <p class="detail-text">
                Action details: The user has performed the action
                <strong>{{ action.type }}</strong> on
                <strong>{{ action.entity }}</strong> successfully.
              </p>
              <p v-if="action.entity === 'invoice'">
                <strong>Details:</strong> {{ action.details }}
              </p>
              <p v-else-if="action.entity === 'consumption'">
                <strong>Details:</strong> {{ action.details }}
              </p>
            </div>
          </transition>
        </div>
      </div>
    </div>
    <div v-else>
      <p>No Actions Saved</p>
    </div>

    <!-- Confirmation Modal -->
    <transition name="fade">
      <div class="modal-overlay" v-if="showModal">
        <div class="modal">
          <p>Are you sure you want to clear the history?</p>
          <div class="modal-actions">
            <button class="confirm-btn" @click="confirmClearHistory">
              Confirm
            </button>
            <button class="cancel-btn" @click="closeConfirmation">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { getActionHistory, clearActionHistory } from '../services/apiServices';

export default {
  name: 'History',
  data() {
    return {
      actions: [],
      activeDetails: null,
      showModal: false
    };
  },
  mounted() {
    this.fetchHistory();
  },
  methods: {
    fetchHistory() {
      getActionHistory()
        .then((data) => {
          this.actions = data.map((action) => {
            if (action.entity === 'invoice') {
              action.details =
                `Month: ${action.data.month || 'N/A'}, ` +
                `Grand Total: ${action.data.grandTotal || 'N/A'}, ` +
                `Stamp Tax: ${action.data.stampTax || 'N/A'}, ` +
                `Total with Tax: ${action.data.totalWithTax || 'N/A'}`;
            } else if (action.entity === 'consumption') {
              action.details =
                `Consumption ID: ${action.data.id || 'N/A'}, ` +
                `Employee: ${action.data.employ || 'N/A'}, ` +
                `Card Number: ${action.data.card_number || 'N/A'}, ` +
                `Department Code: ${action.data.department_code || 'N/A'}, ` +
                `Location: ${action.data.location || 'N/A'}, ` +
                `Monthly Limit: ${action.data.monthly_limit || 'N/A'}, ` +
                `Budget: ${action.data.budget || 'N/A'}`;
            }
            return action;
          });
        })
        .catch((error) => {
          console.error('Error fetching actions:', error);
        });
    },
    formatDate(date) {
      return new Date(date).toLocaleString();
    },
    article(word) {
      const vowels = ['a', 'e', 'i', 'o', 'u'];
      return vowels.includes(word[0].toLowerCase()) ? 'an' : 'a';
    },
    formatDescription(action) {
      let pastType = action.type;
      if (action.type === 'add') pastType = 'added';
      else if (action.type === 'update') pastType = 'updated';
      else if (action.type === 'delete') pastType = 'deleted';
      return `User ${pastType} ${this.article(action.entity)} ${action.entity}`;
    },
    toggleDetails(id) {
      this.activeDetails = this.activeDetails === id ? null : id;
    },
    openConfirmation() {
      this.showModal = true;
    },
    closeConfirmation() {
      this.showModal = false;
    },
    confirmClearHistory() {
      clearActionHistory()
        .then((response) => {
          console.log(response.message);
          // Re-fetch the updated history from the API
          this.fetchHistory();
          this.closeConfirmation();
        })
        .catch((error) => {
          console.error('Error clearing history:', error);
          this.closeConfirmation();
        });
    }
  }
};
</script>

<style scoped>
.history-container {
  padding: 20px;
  font-family: 'Roboto', sans-serif;
}

/* Header avec bouton Clear History */
.history-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}
.clear-btn {
  padding: 8px 16px;
  background-color: #ff5722;
  border: none;
  border-radius: 5px;
  color: #fff;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.clear-btn:hover {
  background-color: #e64a19;
}

/* Style pour les cartes historiques (inchangé) */
.history-card {
  margin-bottom: 15px;
  cursor: pointer;
  background-color: #424242;
  border-radius: 8px;
  padding: 10px;
  transition: background-color 0.3s;
}
.history-card:hover {
  background-color: #616161;
}
.card-body {
  color: #fff;
}
.card-title {
  margin-bottom: 5px;
}
.card-date {
  font-size: 0.9em;
  color: #bdbdbd;
}

/* Modal overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}

/* Modal */
.modal {
  background: #323232;
  padding: 20px 30px;
  border-radius: 10px;
  text-align: center;
  color: #fff;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
}
.modal-actions {
  margin-top: 20px;
  display: flex;
  justify-content: center;
  gap: 15px;
}
.confirm-btn,
.cancel-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s ease;
}
.confirm-btn {
  background-color: #4caf50;
  color: #fff;
}
.confirm-btn:hover {
  background-color: #43a047;
}
.cancel-btn {
  background-color: #f44336;
  color: #fff;
}
.cancel-btn:hover {
  background-color: #e53935;
}

/* Animation pour la modale */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}

/* Animation des détails de carte */
.detail-enter-active,
.detail-leave-active {
  transition: max-height 0.3s ease;
}
.detail-enter,
.detail-leave-to {
  max-height: 0;
  overflow: hidden;
}
</style>
