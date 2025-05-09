// src/utils/invoiceUtils.js

/**
 * Regroupe les détails par région et calcule pour chaque région :
 * - Pour chaque département, la somme des expense amount
 * - Le total de la région (la somme des totaux des départements)
 *
 * @param {Array} details - Les détails (lignes de consommation)
 * @returns {Object} Un objet avec les régions HO, MIR, NBE et leurs totaux
 */
export function groupDetailsByRegion(details) {
    const regions = {
      HO: { regionTotal: 0, departments: {} },
      MIR: { regionTotal: 0, departments: {} },
      NBE: { regionTotal: 0, departments: {} },
    };
  
    details.forEach(detail => {
      // Supposons que detail contient "region", "dep_code" et "expenseAmount"
      const regionKey = detail.region; // "HO", "MIR", ou "NBE"
      if (regions[regionKey]) {
        const depCode = detail.dep_code;
        if (!regions[regionKey].departments[depCode]) {
          regions[regionKey].departments[depCode] = 0;
        }
        const value = parseFloat(detail.expenseAmount) || 0;
        regions[regionKey].departments[depCode] += value;
        regions[regionKey].regionTotal += value;
      }
    });
  
    // Formater à 3 décimales
    Object.keys(regions).forEach(regionKey => {
      regions[regionKey].regionTotal = parseFloat(regions[regionKey].regionTotal.toFixed(3));
      Object.keys(regions[regionKey].departments).forEach(depCode => {
        regions[regionKey].departments[depCode] = parseFloat(regions[regionKey].departments[depCode].toFixed(3));
      });
    });
  
    return regions;
  }
  
  /**
   * Calcule le grand total en additionnant les totaux des régions.
   *
   * @param {Object} regions - L'objet retourné par groupDetailsByRegion
   * @returns {number} Le grand total
   */
  export function calculateGrandTotal(regions) {
    let grandTotal = 0;
    Object.keys(regions).forEach(regionKey => {
      grandTotal += regions[regionKey].regionTotal;
    });
    return parseFloat(grandTotal.toFixed(3));
  }
  