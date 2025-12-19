const mongoose = require('mongoose');
const { Schema } = mongoose;

const SignalementSchema = new Schema({
  conteneur: { type: Schema.Types.ObjectId, ref: 'Conteneur' },
  titre: { type: String, required: true },
  description: { type: String },
  auteur: { type: Schema.Types.ObjectId, ref: 'User' },
  statut: { type: String, enum: ['OUVERT','EN_COURS','TRAITE'], default: 'OUVERT' },
  photos: [{ type: String }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] }
  },
  createdAt: { type: Date, default: Date.now }
});

SignalementSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Signalement', SignalementSchema);
