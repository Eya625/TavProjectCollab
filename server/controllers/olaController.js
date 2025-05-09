const OlaConsumption = require('../models/OlaConsumption');
const ActionHistory = require('../models/ActionHistory');

// Action history logging (seulement pour add, update, delete)
const logAction = (type, entity, data) => {
  const action = new ActionHistory({
    type,
    entity,
    data,
  });

  // Save the action in the database
  action.save()
    .then(() => {
      console.log("Action saved to history");
    })
    .catch(err => {
      console.error("Error saving action history:", err);
    });
};

// Retrieve all OLA cards (sans historisation)
exports.getConsumptionCardsStandard = async (req, res) => {
  try {
    const cards = await OlaConsumption.find();
    res.json(cards);
  } catch (error) {
    console.error('Error retrieving OLA cards:', error);
    res.status(500).json({ error: 'Error retrieving OLA cards' });
  }
};
//add consumption card
exports.addConsumptionCardStandard = async (req, res) => {
  try {
    const { year, totalConsumption, details } = req.body;
    
    // Simple validation to ensure the year is provided
    if (!year) {
      return res.status(400).json({ error: 'Year is required' });
    }
    
    // If details are provided, recalculate the total based on them
    let computedTotal = 0;
    if (details && Array.isArray(details) && details.length > 0) {
      details.forEach(detail => {
        if (detail.consumptions) {
          computedTotal += Object.values(detail.consumptions)
            .reduce((acc, curr) => acc + Number(curr), 0);
        }
      });
    }
    
    const newCard = new OlaConsumption({
      year,
      totalConsumption: (totalConsumption !== undefined && totalConsumption !== null)
        ? totalConsumption
        : computedTotal,
      details,
      created_at: new Date()
    });
    
    await newCard.save();
    // Log the add action with the data that was added
    logAction("add", "OLA_card", newCard);
    res.status(201).json(newCard);
  } catch (error) {
    console.error('Error creating OLA card:', error);
    res.status(500).json({ error: 'Error creating OLA card' });
  }
};

// Retrieve details of an OLA card by ID (sans historisation)
exports.getConsumptionCardDetails = async (req, res) => {
  try {
    const card = await OlaConsumption.findById(req.params.id);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }
    return res.json(card);
  } catch (error) {
    console.error("Error retrieving OLA card details:", error);
    return res.status(400).json({ message: "Error retrieving card details", error });
  }
};

// Update an OLA card by ID (historisation incluse)
exports.updateConsumptionCardStandard = async (req, res) => {
  try {
    const cardId = req.params.id;
    const updateData = req.body; // expected: { detailId, consumptions, employe, card_number, dep_code, location, monthly_limit, isInvoiceGenerated }

    let card = await OlaConsumption.findById(cardId);
    if (!card) {
      return res.status(404).json({ message: 'Card not found' });
    }

    // Si updateData contient isInvoiceGenerated, on met à jour cette propriété.
    if (typeof updateData.isInvoiceGenerated !== 'undefined') {
      card.isInvoiceGenerated = updateData.isInvoiceGenerated;
    }

    let detail;
    if (updateData.detailId) {
      detail = card.details.find(d => d.id === updateData.detailId);
    } else if (updateData.card_number) {
      detail = card.details.find(d => d.card_number === updateData.card_number);
    }

    if (detail) {
      if (updateData.consumptions) {
        Object.keys(updateData.consumptions).forEach(month => {
          detail.consumptions.set(month, Number(updateData.consumptions[month]) || 0);
        });
      }
      detail.employe = updateData.employe || detail.employe;
      detail.card_number = updateData.card_number || detail.card_number;
      detail.dep_code = updateData.dep_code || detail.dep_code;
      detail.location = updateData.location || detail.location;
      detail.monthly_limit = updateData.monthly_limit || detail.monthly_limit;
    } else {
      card.details.push({
        id: 'default-' + new Date().getTime(),
        employe: updateData.employe || '',
        card_number: updateData.card_number || '',
        dep_code: updateData.dep_code || '',
        location: updateData.location || '',
        monthly_limit: updateData.monthly_limit || 0,
        consumptions: updateData.consumptions 
          ? new Map(Object.entries(updateData.consumptions)) 
          : new Map([
              ['January', 0], ['February', 0], ['March', 0], ['April', 0],
              ['May', 0], ['June', 0], ['July', 0], ['August', 0],
              ['September', 0], ['October', 0], ['November', 0], ['December', 0]
            ])
      });
    }

    let total = 0;
    card.details.forEach(detail => {
      const consumptionsArray = detail.consumptions instanceof Map 
        ? Array.from(detail.consumptions.values()) 
        : Object.values(detail.consumptions);
      total += consumptionsArray.reduce((acc, val) => acc + Number(val), 0);
    });
    card.totalConsumption = total;

    await card.save();
    // Log de l'action de mise à jour avec les nouvelles données de la carte
    logAction("update", "OLA_card", card);
    return res.json(card);
  } catch (error) {
    console.error("Error updating OLA card:", error);
    return res.status(400).json({ message: "Error updating card", error });
  }
};


// Delete an OLA card by ID (historisation incluse)
exports.deleteConsumptionCardStandard = async (req, res) => {
  try {
    const deletedCard = await OlaConsumption.findByIdAndDelete(req.params.id);
    if (!deletedCard) {
      return res.status(404).json({ error: 'Card not found' });
    }
    // Log the delete action with the deleted data
    logAction("delete", "OLA_card", deletedCard);
    res.json({ message: 'OLA card deleted successfully' });
  } catch (error) {
    console.error('Error deleting OLA card:', error);
    res.status(500).json({ error: 'Error deleting OLA card' });
  }
};

// Delete a specific detail from an OLA card (historisation incluse)
exports.deleteDetailFromCard = async (req, res) => {
  try {
    const { cardId, detailId } = req.params;
    const { cardNumber } = req.query;
    let pullCondition = {};

    if (detailId && detailId.trim() !== "") {
      pullCondition = { id: detailId };
    } else if (cardNumber && cardNumber.trim() !== "") {
      pullCondition = { card_number: cardNumber };
    } else {
      return res.status(400).json({ error: 'No detail identifier or card number provided' });
    }

    const updatedCard = await OlaConsumption.findByIdAndUpdate(
      cardId,
      { $pull: { details: pullCondition } },
      { new: true }
    );

    if (!updatedCard) {
      return res.status(404).json({ error: 'Card or detail not found' });
    }

    let total = 0;
    updatedCard.details.forEach(detail => {
      const consumptionsArray = detail.consumptions instanceof Map 
        ? Array.from(detail.consumptions.values()) 
        : Object.values(detail.consumptions);
      total += consumptionsArray.reduce((acc, val) => acc + Number(val), 0);
    });
    updatedCard.totalConsumption = total;

    await updatedCard.save();

    // Log the delete action for the detail with cardId and pullCondition
    logAction("delete", "OLA_card_detail", { cardId, detail: pullCondition });
    res.json(updatedCard);
  } catch (error) {
    console.error("Error deleting detail:", error);
    res.status(500).json({ error: 'Server error' });
  }
};
