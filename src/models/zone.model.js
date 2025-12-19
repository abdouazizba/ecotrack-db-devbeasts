const mongoose = require('mongoose');
const { Schema } = mongoose;

const ZoneSchema = new Schema({
  nom: { type: String, required: true },
  description: { type: String },
  geojson: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});

ZoneSchema.index({ geojson: '2dsphere' });

module.exports = mongoose.model('Zone', ZoneSchema);
