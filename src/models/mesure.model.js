const mongoose = require('mongoose');
const { Schema } = mongoose;

const MesureSchema = new Schema({
  time: { type: Date, required: true, default: Date.now },
  conteneur: { type: Schema.Types.ObjectId, ref: 'Conteneur', required: true },
  taux_remplissage: { type: Number, min: 0, max: 100 },
  temperature: { type: Number },
  raw: { type: Schema.Types.Mixed }
});

MesureSchema.index({ time: 1 });

module.exports = mongoose.model('Mesure', MesureSchema);
