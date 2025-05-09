const ConsumptionStandardSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  employ: { type: String, required: true },
  card_number: { type: String, required: true, unique: true },
  department_code: { type: String, required: true },
  location: { type: String, required: true },
  monthly_limit: { type: Number, required: true },
  budget: { type: String, required: true },
  year: { type: Number, required: true },
  consumption: {
    jan: { type: Number, default: null },
    feb: { type: Number, default: null },
    mar: { type: Number, default: null },
    apr: { type: Number, default: null },
    may: { type: Number, default: null },
    jun: { type: Number, default: null },
    jul: { type: Number, default: null },
    aug: { type: Number, default: null },
    sep: { type: Number, default: null },
    oct: { type: Number, default: null },
    nov: { type: Number, default: null },
    dec: { type: Number, default: null },
  }
});
