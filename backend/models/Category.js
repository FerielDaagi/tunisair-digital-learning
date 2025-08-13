// backend/models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom de la catégorie est requis'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'La description est requise'],
    trim: true
  },
  thumbnail: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index pour la recherche
categorySchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Category', categorySchema);