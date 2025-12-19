const mongoose = require('mongoose');
const { Schema } = mongoose;

const ConteneurSchema = new Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ['OMR','RECYCLABLE','ORGANIQUE','ENCOMBRANTS'], required: true },
  capacite: { type: Number, required: true, min: 1 },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0,0] }
  },
  zone: { type: Schema.Types.ObjectId, ref: 'Zone' },
  statut: { type: String, enum: ['ACTIF','EN_MAINTENANCE','HORS_SERVICE','RETIRE'], default: 'ACTIF' },
  metadata: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

ConteneurSchema.index({ location: '2dsphere' });

ConteneurSchema.methods.changeStatut = function(newStatut) {
  if (!['ACTIF','EN_MAINTENANCE','HORS_SERVICE','RETIRE'].includes(newStatut)) {
    throw new Error('Statut invalide');
  }
  this.statut = newStatut;
  return this.save();
};

module.exports = mongoose.model('Conteneur', ConteneurSchema);
