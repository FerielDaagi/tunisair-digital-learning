const Category = require('../models/Category');

// Créer une nouvelle catégorie
const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const createdBy = req.user._id;

    // Vérifier si la catégorie existe déjà
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Une catégorie avec ce nom existe déjà'
      });
    }

    // Créer la nouvelle catégorie
    const category = new Category({
      name: name.trim(),
      description: description ? description.trim() : '',
      createdBy
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Catégorie créée avec succès',
      data: category
    });

  } catch (error) {
    console.error('Erreur création catégorie:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la catégorie'
    });
  }
};

// Récupérer toutes les catégories actives
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .select('name slug description courseCount')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Erreur récupération catégories:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des catégories'
    });
  }
};

// Récupérer une catégorie par ID
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    res.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Erreur récupération catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de la catégorie'
    });
  }
};

// Mettre à jour une catégorie
const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const categoryId = req.params.id;

    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    // Vérifier si le nouveau nom existe déjà (sauf pour cette catégorie)
    if (name && name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: categoryId }
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: 'Une catégorie avec ce nom existe déjà'
        });
      }
    }

    // Mettre à jour la catégorie
    category.name = name ? name.trim() : category.name;
    category.description = description ? description.trim() : category.description;

    await category.save();

    res.json({
      success: true,
      message: 'Catégorie mise à jour avec succès',
      data: category
    });

  } catch (error) {
    console.error('Erreur mise à jour catégorie:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Erreurs de validation',
        errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la catégorie'
    });
  }
};

// Désactiver une catégorie
const deactivateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Catégorie non trouvée'
      });
    }

    // Vérifier s'il y a des cours utilisant cette catégorie
    if (category.courseCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossible de désactiver une catégorie utilisée par des cours'
      });
    }

    category.isActive = false;
    await category.save();

    res.json({
      success: true,
      message: 'Catégorie désactivée avec succès'
    });

  } catch (error) {
    console.error('Erreur désactivation catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la désactivation de la catégorie'
    });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deactivateCategory
};







