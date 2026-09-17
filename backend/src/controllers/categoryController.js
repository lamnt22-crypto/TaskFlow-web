const categoryService = require('../services/categoryService');

const getCategories = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const categories = await categoryService.getCategories(userId);
    
    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

const createCategory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    let { name, color } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    
    name = name.trim();
    
    if (name.length > 100) {
       return res.status(400).json({ success: false, message: 'Category name is too long (max 100 characters)' });
    }
    
    if (color !== undefined) {
      if (typeof color !== 'string' || color.trim() === '') {
        return res.status(400).json({ success: false, message: 'Color must be a valid string' });
      }
      color = color.trim();
      if (color.length > 20) {
        return res.status(400).json({ success: false, message: 'Color is too long (max 20 characters)' });
      }
    }
    
    const category = await categoryService.createCategory(userId, name, color);
    
    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const categoryId = parseInt(req.params.id, 10);
    
    if (isNaN(categoryId)) {
       return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }
    
    let { name, color } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    
    name = name.trim();
    
    if (name.length > 100) {
       return res.status(400).json({ success: false, message: 'Category name is too long (max 100 characters)' });
    }
    
    if (color !== undefined) {
      if (typeof color !== 'string' || color.trim() === '') {
        return res.status(400).json({ success: false, message: 'Color must be a valid string' });
      }
      color = color.trim();
      if (color.length > 20) {
        return res.status(400).json({ success: false, message: 'Color is too long (max 20 characters)' });
      }
    }
    
    const category = await categoryService.updateCategory(userId, categoryId, name, color);
    
    return res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

const deleteCategory = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const categoryId = parseInt(req.params.id, 10);
    
    if (isNaN(categoryId)) {
       return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }
    
    await categoryService.deleteCategory(userId, categoryId);
    
    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
