// routes/powerBiRoutes.js
const express = require('express');
const axios = require('axios');

module.exports = function(io) {
  const router = express.Router();

  // Fonction pour obtenir un accessToken Power BI dynamiquement via OAuth2 client_credentials
  const getAccessToken = async () => {
    const tenantId = '7bed07b8-021c-46fd-b379-0e5f7bcf0d96';
    const clientId = '0753e700-40ff-46bc-8c73-fc1786928e93';
    const clientSecret = '8F.8Q~~b1KBW9kLQxfYc.XFMkMu~kvz0p~jCqbwC';
    const scope = 'https://analysis.windows.net/powerbi/api/.default';

    const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', scope);

    try {
      const res = await axios.post(url, params);
      return res.data.access_token;
    } catch (error) {
      console.error('Erreur de génération du token Power BI :', error.response?.data || error.message);
      throw error;
    }
  };

  // Rafraîchir un dataset Power BI
  router.post('/refresh-dataset', async (req, res) => {
    try {
      const accessToken = await getAccessToken(); // Token dynamique ✅
      const groupId = '756d6b0a-e3b6-497f-9a1d-d6619efb5f74';
      const datasetId = '9077435d-cef9-426c-8b82-05c51bad663c';

      const response = await axios.post(
        `https://api.powerbi.com/v1.0/myorg/groups/${groupId}/datasets/${datasetId}/refreshes`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      io.emit('dataUpdated', { message: 'Dataset rafraîchi !' });

      res.status(200).json({
        message: 'Rafraîchissement Power BI déclenché avec succès.',
        response: response.data
      });
    } catch (error) {
      console.error('Erreur lors du rafraîchissement Power BI :', error.response?.data || error.message);
      res.status(500).json({ error: 'Échec du rafraîchissement.' });
    }
  });

  return router;
};
