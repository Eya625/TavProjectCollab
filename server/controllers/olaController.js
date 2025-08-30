const OlaConsumption = require('../models/OlaConsumption');
const ActionHistory = require('../models/ActionHistory');

// Action history logging ( pour add, update, delete)
// params : type (type d'actions) entity(ola || invoice) data (objet qui contient les data)
const logAction = (type, entity, data) => {
  const action = new ActionHistory({
    //création d'une instance de la classe actionshistory
    type,
    entity,
    data,
  });
  // Save the action in the database : save est une méthode mongoose
  action.save()
  // convertir cet objet action en un document mongoDB
    .then(() => {
      // sauvegarde réussi
      console.log("Action saved to history");
    })
    .catch(err => {
      //sauvegarde échoue
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
    console.log(newCard);
    
    await newCard.save();
    // journalisation de l'action
    logAction("add", "OLA_card", newCard);
    // en cas de succès => envoie au client
    res.status(201).json(newCard);
  } catch (error) {
    // envoie vers serveur
    console.error('Error creating OLA card:', error);
    // en cas d'erreur => un réponse va être envoyée
    res.status(500).json({ error: 'Error creating OLA card' });
  }
};

// Retrieve details of an OLA card by ID
exports.getConsumptionCardDetails = async (req, res) => {
  try {
    // on a utilisé le req ici pour la recherche par ID
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

// mise à jour de carte ola(ajout consomm)par ID (avec historisation)
exports.updateConsumptionCardStandard = async (req, res) => {
  try {
    const cardId = req.params.id; // récupération de l'id + recherche dans la base
    const updateData = req.body;

    let card = await OlaConsumption.findById(cardId);
    if (!card) {
      // statut 404 définit qu'il y a des ressources introuvable
      return res.status(404).json({ message: 'Card not found' }); 
    }
    // Si updateData contient isInvoiceGenerated, on met à jour cette propriété.
    /*Si isInvoiceGenerated n’est pas défini, 
    on n’entre pas dans le bloc et la valeur actuelle de card.isInvoiceGenerated reste inchangée.
Si isInvoiceGenerated est défini (qu’il vaille true ou false),
 alors on passe la valeur envoyée par le client à card.isInvoiceGenerated.*/
    if (typeof updateData.isInvoiceGenerated !== 'undefined') {
      card.isInvoiceGenerated = updateData.isInvoiceGenerated;
    }
    let detail;
    // récupère le détail à modifier
    if (updateData.detailId) {
      detail = card.details.find(d => d.id === updateData.detailId);

    } else if (updateData.card_number) {
      detail = card.details.find(d => d.card_number === updateData.card_number);
    }
      // on cherche un detailId, si présent on trouve l'objet dont 'd.id === detailId'
      // sinon, on regarde si on a un card_number et on trouve le détail correspondant
      // au final, détail vaut soit l'objet trouvé,soit undefined si rien ne correspond 


    // Mettre à jour les consommations du détail trouvé
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


// Delete an OLA card by ID (avec historisation)
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
// Delete a specific detail from an OLA card (avec historisation)
exports.deleteDetailFromCard = async (req, res) => {
  try {
    const { cardId, detailId } = req.params;
    const { cardNumber } = req.query;
    let pullCondition = {};

    if (detailId && detailId.trim() !== "") {
      //pullcondition est un objet qui servir à retirer lde la liste details tous 
      // les éléments qui respectent la la condition.
      pullCondition = { id: detailId };
      // trimmen trim permet de supprimer les espaces.
    } else if (cardNumber && cardNumber.trim() !== "") {
      pullCondition = { card_number: cardNumber };
    } else {
      return res.status(400).json({ error: 'No detail identifier or card number provided' });
    }
    const updatedCard = await OlaConsumption.findByIdAndUpdate(
      cardId,
      // pull pour récupérer d'un tab les éléments qui correspond à une condition.
      { $pull: { details: pullCondition } },
      // forcer mongoose de donner la version maj (car par défaut il renvoie l'ancien document)
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
exports.delete = async(req,res)=>{
  // récupère la requête (condition)
  try{
    const {cardId, deleteId} = req.params;
    const {cardNumber} = req.query;
    let pullCondition={};
    if(detailId && detailId.trim() !==""){
      pullCondition = {id:detailId};
    }else if(cardNumber && cardNumber.trim() !== ""){
      pullCondition = {card_number:cardNumber};
    }else{
      return res.status(400).json({message:'card or detail not found',error});
    }
    const updatedCard = await OlaConsumption.findByIdAndUpdate(
      cardId,
      {$pull :{ detail:pullCondition}},
      {new:true}
    );
    if(!updatedCard){
      return res.status(404).json({message: 'card or deail not found',error});
    }
    let total = 0;
    // recalcul de tout les consommation et maj total consumption
    // parcourt tableau detail et on execute le bloc pour chaque detail 

    updatedCard.details.forEach(detail=>{
      // récupération de toute les valeurs de consommation
      // la valeur detail.consumption peut être soit une map soit un objet clé->valeur
      const consumptionsArray = detail.consumptions instanceof Map
            // si est une map on transforme les valeurs en tab
        ? Array.from(detail.consumptions.values())
        // sinon : il est un simple objet-> obtention de tab de valeurs
        : Object.values(detail.consumptions);
        //acc -> accumulateur initialisé à 0
        //reduce pour additionner toutes les entrées
      total +=consumptionsArray.reduce((acc,val)=> acc + Number(val),0);
    });
    updatedCard.totalConsumption = total;
    await updatedCard.save();
    //logAction historisation 
    logAction("delete","olacard_details",{cardId,detail:pullCondition});
    res.json(updatedcard);
  }
  catch(error){
    console.error("error deleting detail card",error);
    res.status(500).json({error:"Internal server error"});

  }
};
