const mongoose = require('mongoose');
const { Schema } = mongoose;

const TourneeSchema = new Schema({
  code: { type: String, required: true, unique: true },
  date: { type: Date, required: true },
  agent: { type: Schema.Types.ObjectId, ref: 'User' },
  statut: { type: String, enum: ['PLANIFIEE','EN_COURS','TERMINEE'], default: 'PLANIFIEE' },
  conteneurs: [{
    conteneur: { type: Schema.Types.ObjectId, ref: 'Conteneur' },
    ordre: { type: Number }
  }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tournee', TourneeSchema);
