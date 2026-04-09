const CategoryService = require('../services/category');

class CategoryController {
  async getAllCategories(req, res, next) {
    try {
      const categories = await CategoryService.getAllCategories();
      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }

  async getCategory(req, res, next) {
    try {
      const category = await CategoryService.getCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const { name, description, icon, icon_url } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Category name is required' });
      }
      const category = await CategoryService.createCategory({
        name,
        description,
        icon_url: icon_url || icon,
      });
      res.status(201).json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async updateCategory(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await CategoryService.getCategoryById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      const { icon, icon_url, ...rest } = req.body;
      const category = await CategoryService.updateCategory(id, {
        ...rest,
        icon_url: icon_url || icon || existing.icon_url,
      });
      res.json({ success: true, data: category });
    } catch (error) {
      next(error);
    }
  }

  async deleteCategory(req, res, next) {
    try {
      const { id } = req.params;
      const deleted = await CategoryService.deleteCategory(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CategoryController();
