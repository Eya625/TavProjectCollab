const OlaConsumption = require('../models/OlaConsumption');

const MONTHS = [
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

// filtrage des données de TB
function parseFilters(query) {
  // query.year retourne une valeur sous formes de chaines
  /*  on lit query.year et on le convertit en nbr le +query.year = Number(query.year) */
  const year = +query.year || new Date().getFullYear();
  // on récupère l'employé passé en params|| null (pas fournis)
  const employee = query.employee || null;
  /* initialisation d'un tab vide pour les emplacements(locations) */
  let locations = [];
  /* si on a un param dans la requête */
  if (query.locations) {
    // – Si c’est déjà un tableau, on le filtre pour supprimer les valeurs vides.
    if (Array.isArray(query.locations)) {
      if (query.locations) {
        locations = query.locations.filter(Boolean);
        // – Sinon, si c’est une chaîne (string), on la découpe par virgules,
        //   on supprime les espaces inutiles autour de chaque élément,
        //   puis on enlève les éléments vides.
      } else if (typeof query.locations === 'string') {
        locations = query.locations
          .split(',') // découpage
          .map((s) => s.trim()) // élimination des espaces
          .filter(Boolean); // suppression des chaines vides
      }
    }
  }
  // renvoie d'un objet standardisé

  return { year, employee, locations };
}

// doughnout chart
async function getByLocation(req, res) {
  try {
    // 1 ) On extrait et normalise les filtres depuis la query string
    //    year     : l’année (Number)
    //    employee : un identifiant d’employé (String ou null)
    //    locations: tableau de zones/locaux (Array de String)
    const { year, employee, locations } = parseFilters(req.query);
    // 2 ) On prépare l’objet `match` pour MongoDB à partir de ces filtres
    // On commence toujours par filtrer sur l’année.
    const match = { year };
    //- Si un employé est spécifié, on ajoute un critère sur `details.employe`.
    if (employee) match['details.employe'] = employee;
    //- Si on a au moins une localisation, on ajoute un critère $in sur `details.location`.
    if (locations.length) match['details.location'] = { $in: locations };
    // 3) On définit le pipeline d’agrégation MongoDB, en trois étapes principales :
    const pipeline = [
      // st1 : Déplie (`$unwind`) le tableau `details`
      //    chaque document OlaConsumption génère autant de documents
      //    qu’il y a d’éléments dans son tableau `details`.
      { $unwind: '$details' },

      // stp2 : On ne garde que les docs dont les champs correspondent à `match`
      { $match: match },

      // stp 3:  On regroupe (`$group`) par localisation (`_id: '$details.location'`) :
      //    pour chaque localisation, on calcule un total global.
      {
        $group: {
          _id: '$details.location',
          //   – `$add` va sommer toutes les consommations mensuelles dynamiquement :
          //     on transforme le tableau MONTHS en chemins de champs
          //     `$details.consumptions.January`, `$details.consumptions.February`, …
          //   – `$sum` additionne ces valeurs pour obtenir le total par localisation.
          total: {
            $sum: { $add: MONTHS.map((m) => `$details.consumptions.${m}`) }
          }
        }
      }
    ];
    // 4 ) Exécution de l’agrégation sur la collection OlaConsumption
    //    – `agg` sera un tableau d’objets de forme :
    //      [ { _id: 'Site A', total: 12345 }, { _id: 'Site B', total: 6789 }, … ]
    const agg = await OlaConsumption.aggregate(pipeline);
    // 5 ) On renvoie le résultat en JSON pour le front
    //    Le front peut alors utiliser cet array pour construire un doughnut chart
    res.json(agg);
  } catch (err) {
    console.error('getByLocation error', err);
    res.status(500).json({ error: 'Erreur getByLocation' });
  }
}

async function getByMonth(req, res) {
  try {
    // 1) On récupère et normalise les filtres de la requête
    //    year     : année ciblée (Number)
    //    employee : éventuel identifiant d’employé (String ou null)
    //    locations: tableau de zones à inclure (Array de String)
    const { year, employee, locations } = parseFilters(req.query);
    // 2 ) On construit le critère de filtrage MongoDB
    //    On commence par l’année, toujours requise.
    const match = { year };
    if (employee) match['details.employe'] = employee;
    if (locations.length) match['details.location'] = { $in: locations };

    // 3 ) On prépare dynamiquement l’étape $group pour additionner mois par mois
    //     on utilise Array.reduce pour construire un objet g qui contient :
    //       une clé _id: null (on ne regroupe pas par un champ, on somme globalement)
    //       pour chaque mois m, une propriété m: { $sum: `<chemin de conso>` }
    //    Exemple de groupStage après reduce :
    //    {
    //      _id: null,
    //      January:   { $sum: "$details.consumptions.January"   },
    //      February:  { $sum: "$details.consumptions.February"  },
    //      …,
    //      December:  { $sum: "$details.consumptions.December"  }
    //    }
    const groupStage = MONTHS.reduce(
      (g, m) => {
        g[m] = { $sum: `$details.consumptions.${m}` };
        return g;
      },
      { _id: null }
    );

    const pipeline = [
      // 4  On définit le pipeline d’agrégation MongoDB en 3 opérations
      { $unwind: '$details' },
      // $match  : filtre selon year, employé et localisation
      { $match: match },
      // $group  : regroupe *tous* les documents ( _id: null ) et calcule
      // la somme de chaque mois grâce au groupStage construit
      { $group: groupStage }
    ];
    // 5 ) On exécute l’agrégation
    //     result est un tableau d’un seul document, p.ex. :
    //      [ { _id: null, January: 123, February: 456, …, December: 789 } ]
    const result = await OlaConsumption.aggregate(pipeline);

    // 6 ) Cas où aucune donnée ne correspond : on renvoie un objet de zéros
    if (!result.length) {
      return res.json(Object.fromEntries(MONTHS.map((m) => [m, 0])));
    }
    // on trouve un résultat
    const { _id, ...monthlySums } = result[0];
    res.json(monthlySums);
  } catch (err) {
    console.error('getByMonth error', err);
    res.status(500).json({ error: 'Erreur getByMonth' });
  }
}

async function getTopEmployees(req, res) {
  try {
    const { year, employee, locations } = parseFilters(req.query);
    const match = { year };
    if (employee) match['details.employe'] = employee;
    if (locations.length) match['details.location'] = { $in: locations };

    const pipeline = [
      { $unwind: '$details' },
      { $match: match },
      {
        $group: {
          _id: '$details.employe',
          total: {
            $sum: { $add: MONTHS.map((m) => `$details.consumptions.${m}`) }
          }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ];

    const agg = await OlaConsumption.aggregate(pipeline);
    res.json(agg);
  } catch (err) {
    console.error('getTopEmployees error', err);
    res.status(500).json({ error: 'Erreur getTopEmployees' });
  }
}

async function getYoYFuelVariation(req, res) {
  try {
    const { year: curr, employee, locations } = parseFilters(req.query);
    // On calcule l’année précédente pour la comparaison YoY
    const prev = curr - 1;
    //On construit l’objet de filtrage MongoDB pour ne prendre que
    //les documents des deux années (prev et curr)
    const match = { year: { $in: [prev, curr] } };
    if (employee) match['details.employe'] = employee;
    if (locations.length) match['details.location'] = { $in: locations };

    const pipeline = [
      { $unwind: '$details' },
      { $match: match },
      // On projette deux champs :
      //year : pour garder l’année
      //arr : on transforme l’objet `consumptions` en tableau clé/valeur
      {
        $project: { year: 1, arr: { $objectToArray: '$details.consumptions' } }
      },

      //$unwind sur `arr` pour avoir un document par mois
      { $unwind: '$arr' },

      //On groupe par couple { year, month } et on somme les valeurs
      {
        $group: {
          _id: { year: '$year', month: '$arr.k' },
          total: { $sum: '$arr.v' }
        }
      }
    ];

    const agg = await OlaConsumption.aggregate(pipeline);
    // On restructure les résultats dans un objet pour un accès rapide :
    //    dataMap[month][year] = total
    const dataMap = {};
    agg.forEach(({ _id, total }) => {
      dataMap[_id.month] = dataMap[_id.month] || {};
      dataMap[_id.month][_id.year] = total;
    });

    //On construit le tableau final, mois par mois (dans l’ordre MONTHS) :
    const result = MONTHS.map((m) => {
      const a = dataMap[m]?.[prev] || 0; // conso année précédente
      const b = dataMap[m]?.[curr] || 0; // conso année courante
      return {
        month: m,
        [prev]: a,
        [curr]: b,
        // Si a et b > 0, on calcule la variation en % arrondie à 2 décimales,
        // sinon on met null pour indiquer l’absence de données comparables
        variation:
          a > 0 && b > 0 ? parseFloat((((b - a) / a) * 100).toFixed(2)) : null
      };
    });

    res.json(result);
  } catch (err) {
    console.error('getYoYFuelVariation error', err);
    res.status(500).json({ error: 'Erreur getYoYFuelVariation' });
  }
}


/* récupère la liste des employés par ordre alphabétique croissant  */
async function getAllEmployees(req, res) {
  try {
    const result = await OlaConsumption.aggregate([
      { $unwind: '$details' },
      //     
      { $group: { _id: '$details.employe' } },
      { $sort: { _id: 1 } }
    ]);
    // transforme la liste d'objet en tableau en éliminant les valeurs undefined/ '' / 0 
    // transformation en tab permet de mieux passer à un composant les data (select)
    res.json(result.map((r) => r._id).filter(Boolean));
  } catch (err) {
    console.error('getAllEmployees error', err);
    res.status(500).json({ error: 'Erreur getAllEmployees' });
  }
}

async function getAllLocations(req, res) {
  try {
    const result = await OlaConsumption.aggregate([
      { $unwind: '$details' },
      { $group: { _id: '$details.location' } },
      { $sort: { _id: 1 } }
    ]);
    res.json(result.map((r) => r._id).filter(Boolean));
  } catch (err) {
    console.error('getAllLocations error', err);
    res.status(500).json({ error: 'Erreur getAllLocations' });
  }
}

async function getAllYears(req, res) {
  try {
    const result = await OlaConsumption.aggregate([
      { $group: { _id: '$year' } },
      { $sort: { _id: 1 } }
    ]);
    // renvoie un json qui est un tableau de chaines
    res.json(result.map((r) => r._id));
  } catch (err) {
    console.error('getAllYears error', err);
    res.status(500).json({ error: 'Erreur getAllYears' });
  }
}

async function getYearlyConsumption(req, res) {
  try {
    const { year, employee, locations } = parseFilters(req.query);

    // Si pas de filtre employé / localisation, on renvoie direct le champ totalConsumption
    if (!employee && locations.length === 0) {
      const doc = await OlaConsumption.findOne({ year });
      const total = doc?.totalConsumption ?? 0;
      return res.json({ totalConsumption: total });
    }

    // Sinon on recalcule via aggregation sur details
    const match = { year };
    if (employee) match['details.employe'] = employee;
    if (locations.length) match['details.location'] = { $in: locations };

    const pipeline = [
      { $unwind: '$details' },

       // $group pour sommer toutes les consommations mensuelles de ces détails
      { $match: match },
      {
        $group: {
          _id: null,
          total: {
            // $add additionne dynamiquement chaque mois
            $sum: {
              $add: MONTHS.map((m) => `$details.consumptions.${m}`)
            }
          }
        }
      }
    ];
  // Exécution du pipeline : on récupère un tableau avec un seul document [{ _id: null, total: X }]
  // un seule document puisqu'on déclare null dans le $group : _id:null
    const [agg] = await OlaConsumption.aggregate(pipeline);
    const total = agg?.total || 0;
    res.json({ totalConsumption: total });
  } catch (err) {
    console.error('getYearlyConsumption error', err);
    res.status(500).json({ error: 'Erreur getYearlyConsumption' });
  }
}
module.exports = {
  getByLocation,
  getByMonth,
  getTopEmployees,
  getYoYFuelVariation,
  getAllEmployees,
  getAllLocations,
  getAllYears,
  getYearlyConsumption
};
