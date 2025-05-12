// apiServices.js => appels API
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// client dédié au Dashboard
const dashboardApi = axios.create({
  baseURL: 'http://localhost:3000/api/dashboard'
});

// client dédié au Dashboard Finance
const dashboardFinanceApi = axios.create({
  baseURL: `${API_BASE_URL}/dashboard/finance/kpis`
});
const apiServices = {
  async getUserProfile(email) {
    try {
      // URL correcte qui correspond au serveur (inclut /api)
      const response = await axios.get(`${API_BASE_URL}/profile/${email}`);
      return response.data; // Retourne les données de l'utilisateur
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },
  // code de réinitialisation du psw
  async forgotPassword(email) {
    try {
      const response = await axios.post(`${API_BASE_URL}/forgot-password`, {
        email
      });
      return response.data;
    } catch (error) {
      console.error('Error requesting password reset:', error);
      throw error;
    }
  },

  async resetPassword(token, newPassword) {
    try {
      const response = await axios.post(`${API_BASE_URL}/reset-password`, {
        token,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },
  async updateUserProfile(email, formData) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/profile/${email}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil :', error);
      return null;
    }
  },
  //    OLA ENERGY CONSUMPTION
  async getAllConsumptions() {
    try {
      const response = await axios.get(`${API_BASE_URL}/consumptions`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des consommations:', error);
      throw error;
    }
  },

  async addConsumption(consumption) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/consumptions`,
        consumption
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'ajout d'une consommation :", error);
      throw error;
    }
  },

  // Mettre à jour une consommation
  async updateConsumption(id, formData) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/consumptions/${id}`,
        formData // formData est un objet JSON classique ici
      );
      return response.data;
    } catch (error) {
      console.error(
        'Erreur lors de la mise à jour de la consommation :',
        error.response?.data || error
      );
      throw error;
    }
  },

  // Supprimer une consommation
  async deleteConsumption(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/consumptions/${id}`);
      return response.data;
    } catch (error) {
      console.error(
        'Erreur lors de la suppression de la consommation :',
        error
      );
      throw error;
    }
  },

  /* Partie Billing vehicle */

  // récupérer les factures
  async getAllInvoices() {
    try {
      const response = await axios.get(`${API_BASE_URL}/consumption/invoices`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des consommations:', error);
      throw error;
    }
  },
  async addInvoice(invoice) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/consumption/invoices`,
        invoice
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'ajout d'une facture :", error);
      throw error;
    }
  },
  async updateInvoice(id, formData) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/consumption/invoices/${id}`,
        formData
      );
      return response.data;
    } catch (error) {
      console.error(
        'Erreur lors de la mise à jour de la facture :',
        error.response?.data || error
      );
      throw error;
    }
  },
  async deleteInvoice(id) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/consumption/invoices/${id}`
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la facture :', error);
      throw error;
    }
  },
  /* Partie OLA */
  async getCards() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/consumption-cards-standard`
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des cartes APS :', error);
      throw error;
    }
  },

  // Ajouter une nouvelle carte OLA
  async addCard(cardData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/consumption-cards-standard`,
        cardData
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'ajout de la carte OLA :", error);
      throw error;
    }
  },

  // Récupérer les détails d'une carte OLA par ID
  async getCardDetails(id) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/consumption-cards-standard/${id}`
      );
      return response.data;
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des détails de la carte OLA :',
        error
      );
      throw error;
    }
  },

  // Mettre à jour les détails d'une carte APS
  async updateCard(id, updatedData) {
    try {
      // Effectuer la requête PUT pour mettre à jour la carte OLA
      const response = await axios.put(
        `${API_BASE_URL}/consumption-cards-standard/${id}`,
        updatedData
      );

      // Retourner la réponse après la mise à jour
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la carte OLA :', error);
      throw error;
    }
  },

  // Supprimer une carte OLA par ID
  async deleteCard(id) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/consumption-cards-standard/${id}`
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression de la carte OLA :', error);
      throw error;
    }
  },

  // supprimer un détail sépcifique d'une carte APS
  async deleteDetailFromCard(cardId, detailId, cardNumber) {
    try {
      // Si detailId est vide et qu'on dispose d'un cardNumber, on l'envoie en query string
      let url = `${API_BASE_URL}/consumption-cards-standard/${cardId}/details/${detailId}`;
      if (!detailId && cardNumber) {
        url = `${API_BASE_URL}/consumption-cards-standard/${cardId}/details/?cardNumber=${cardNumber}`;
      }
      const response = await axios.put(url);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du détail :', error);
      throw error;
    }
  },
  /* _________Partie FACTURATION OLA _____________ */

  async fetchPdfInvoices() {
    try {
      const response = await axios.get(`${API_BASE_URL}/invoicespdf`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des factures PDF :', error);
      throw error;
    }
  },
  async uploadInvoicePdf(formData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/invoicespdf/upload`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'upload de la facture PDF :", error);
      throw error;
    }
  },
  async getPdfUrl(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/invoicespdf/${id}/url`);
      // l’API renvoie { url: "http://…/uploads/…" }
      return response.data.url;
    } catch (error) {
      console.error('Erreur lors de la récupération de l’URL PDF :', error);
      throw error;
    }
  },
  async uploadDetailsReleves(formData) {
    // correspond exactement à router.post('/upload/details-releves')
    const { data } = await axios.post(
      `${API_BASE_URL}/billing/releves/upload/details-releves`,
      formData
    );
    return data;
  },

  async saveReleveData(payload) {
    // correspond exactement à router.post('/save-releves')
    const { data } = await axios.post(
      `${API_BASE_URL}/billing/releves/save-releves`,
      payload
    );
    return data;
  },
  /* __________________ Partie Gestion des Véhicules __________________ */

  // Récupérer la liste de tous les véhicules dans l'interface de gestion des véhicules 
 async getAllVehicles() {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicles`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des véhicules :', error);
      throw error;
    }
  },

  // Récupérer un véhicule par son id
  async getVehicleById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du véhicule :', error);
      throw error;
    }
  },

  // Ajouter un véhicule
  async addVehicle(vehicleData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/vehicles`,
        vehicleData
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'ajout du véhicule :", error);
      throw error;
    }
  },

  // Mettre à jour un véhicule existant
  async updateVehicle(id, vehicleData) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/vehicles/${id}`,
        vehicleData
      );
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du véhicule :', error);
      throw error;
    }
  },
  // Supprimer un véhicule
  async deleteVehicle(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/vehicles/${id}`);
      console.log('Véhicule supprimé du backend');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la suppression du véhicule :', error);
      throw error;
    }
  },
  /*__________Partie facturation des véhicules (bassma) _________*/
  // Déclaration comme méthode async dans un objet
async getVehicleList() {
    const resp = await axios.get(`${API_BASE_URL}/vehicles/select`);
    return resp.data;
  },

  // recherche { Immatriculation, Type }
  async getVehicleByImmat(immat) {
    const cleaned = immat.trim().toUpperCase().replace(/\s+/g, '');
    const encoded = encodeURIComponent(cleaned);
    const resp = await axios.get(
      `${API_BASE_URL}/vehicles/by-immat/${encoded}`
    );
    return resp.data;
  },
  // Récupérer toutes les factures
  async getVehicleInvoices() {
    const resp = await axios.get(`${API_BASE_URL}/billing`);
    return resp.data;
  },

  async getVehicleInvoicePdfUrl(id) {
    const resp = await axios.get(`${API_BASE_URL}/billing/${id}/pdf`);
    return resp.data.pdf; // ← récupère bien le champ “pdf”
  },
async uploadVehicleInvoice(formData) {
  const resp = await axios.post(
    `${API_BASE_URL}/billing/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return resp.data;  // ← ici on renvoie { success, data, filename }
},

    async registerVehicleInvoice(data) {
    return axios.post(
      `${API_BASE_URL}/billing`,
      data
    );
  },

  async getInvoicesByImmat(immat) {
    // on interroge /billing?immat=… car ton back-end utilise /billing
    const resp = await axios.get(
      `${API_BASE_URL}/billing?immat=${encodeURIComponent(immat)}`
    );
    return resp; // resp.data doit contenir le tableau des factures
  },

  /* ___________Partie Printer Parc + maintenance Curative */
  async addMaintenance(maintenanceData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/maintenance/add`,
        maintenanceData
      );
      return response.data;
    } catch (error) {
      console.error('Error adding maintenance:', error);
      throw error;
    }
  },
  async getAllMaintenances() {
    try {
      const response = await axios.get(`${API_BASE_URL}/maintenance/all`);
      return response.data;
    } catch (error) {
      console.error('Error fetching maintenances:', error);
      throw error;
    }
  },
  // Récupérer tous les printers
  async getPrinters() {
    try {
      const response = await axios.get(`${API_BASE_URL}/printers`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des imprimantes :', error);
      throw error;
    }
  },

  // Récupérer tous les printers
  async getPrinters() {
    try {
      const response = await axios.get(`${API_BASE_URL}/printers`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des imprimantes :', error);
      throw error;
    }
  },

  // Récupérer une imprimante par son id
  async getPrinterById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/printers/${id}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'imprimante :", error);
      throw error;
    }
  },

  // Ajouter une imprimante
  async addPrinter(printerData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/printers`,
        printerData
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'imprimante :", error);
      throw error;
    }
  },

  // Mettre à jour une imprimante existante
  async updatePrinter(id, printerData) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/printers/${id}`,
        printerData
      );
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'imprimante :", error);
      throw error;
    }
  },

  // Supprimer une imprimante
  async deletePrinter(id) {
    try {
      const response = await axios.delete(`${API_BASE_URL}/printers/${id}`);
      console.log('Imprimante supprimée du backend');
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'imprimante :", error);
      throw error;
    }
  },

  /* _____________ Dasboarding _________________ */
  async getByLocation(year, employee = '', locations = []) {
    const { data } = await dashboardApi.get('/by-location', {
      params: { year, employee, locations }
    });
    return data;
  },

  async getByMonth(year, employee = '', locations = []) {
    const { data } = await dashboardApi.get('/by-month', {
      params: { year, employee, locations }
    });
    return data;
  },

  async getTopEmployees(year, employee = '', locations = []) {
    const { data } = await dashboardApi.get('/top-employees', {
      params: { year, employee, locations }
    });
    return data;
  },

  async getYoYFuelVariation(year, employee = '', locations = []) {
    const { data } = await dashboardApi.get('/yoy-fuel-variation', {
      params: { year, employee, locations }
    });
    return data;
  },

  async getAllEmployees() {
    const { data } = await dashboardApi.get('/employees');
    return data;
  },

  async getInvoice(year, month, cardNumber, employee = '', locations = []) {
    const { data } = await dashboardApi.get('/invoice-details', {
      params: { year, month, card_number: cardNumber, employee, locations }
    });
    return data;
  },

  async getAllLocations() {
    const { data } = await dashboardApi.get('/locations');
    return data;
  },

  async getAllYears() {
    const { data } = await dashboardApi.get('/years');
    return data;
  },
  async getYearlyConsumption(filters) {
    const { data } = await dashboardApi.get(
      '/consumption/yearly',
      { params: filters }
    );
    return data;
  },


                     /*______ Partie Analyse Finance _______   */
                     
  getFinanceVehicles()    { return dashboardFinanceApi.get('/vehicles').then(r => r.data) },
  getTotalVehicles(v='')  { return dashboardFinanceApi.get('/totalVehicles',{ params:{ veh:v||undefined } }).then(r => r.data.count) },
  getAllocation(v='')     { return dashboardFinanceApi.get('/allocation',{ params:{ veh:v||undefined } }).then(r => r.data) },
  getTotalBilled(v='')    { return dashboardFinanceApi.get('/totalBilled',{ params:{ veh:v||undefined } }).then(r => r.data) },
  getAvgInvoice(v='')     { return dashboardFinanceApi.get('/avgInvoice',{ params:{ veh:v||undefined } }).then(r => r.data) },
  getTop5Vehicles(v='')   { return dashboardFinanceApi.get('/top5',{ params:{ veh:v||undefined } }).then(r => r.data) },
  getCostByBranch(v='')   { return dashboardFinanceApi.get('/byBranch',{ params:{ veh:v||undefined } }).then(r => r.data) },
  getInvoicesByMonth(v=''){ return dashboardFinanceApi.get('/invoicesByMonth',{ params:{ veh:v||undefined } }).then(r => r.data) },






























};
export default apiServices;




































































// Récupérer l'historique des actions
export const getActionHistory = () => {
  return axios
    .get(`${API_BASE_URL}/history`)
    .then((response) => response.data)
    .catch((error) => {
      console.error("Erreur lors de la récupération de l'historique :", error);
      throw error;
    });
};

// Supprimer l'intégralité de l'historique
export const clearActionHistory = () => {
  return axios
    .delete(`${API_BASE_URL}/history`)
    .then((response) => response.data)
    .catch((error) => {
      console.error('Error clearing action history:', error);
      throw error;
    });
};
