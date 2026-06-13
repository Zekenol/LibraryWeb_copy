/**
 * 分类管理模块
 * 处理图书分类的增删改查
 */

class CategoryManager {
  constructor() {
    this.storage = Storage;
    this.permission = new PermissionManager();
  }
  
  /**
   * 获取所有分类
   */
  getAllCategories() {
    return this.storage.getCategories();
  }
  
  /**
   * 获取分类树形结构
   */
  getCategoriesTree() {
    const categories = this.storage.getCategories();
    return this.buildTree(categories);
  }
  
  /**
   * 构建树形结构
   */
  buildTree(categories, parentId = null) {
    return categories
      .filter(cat => cat.parentId === parentId)
      .map(cat => ({
        ...cat,
        children: this.buildTree(categories, cat.id)
      }))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  
  /**
   * 根据ID获取分类
   */
  getCategoryById(id) {
    return this.storage.getCategoryById(id);
  }
  
  /**
   * 添加分类（需要 librarian 或 admin 权限）
   */
  addCategory(categoryData) {
    if (!this.permission.can('create', 'categories')) {
      throw new Error('没有权限添加分类');
    }
    
    // 验证必填字段
    if (!categoryData.name || !categoryData.name.trim()) {
      throw new Error('分类名称不能为空');
    }
    
    if (!categoryData.code || !categoryData.code.trim()) {
      throw new Error('分类代码不能为空');
    }
    
    const newCategory = this.storage.addCategory({
      ...categoryData,
      sortOrder: categoryData.sortOrder || 1
    });
    
    return newCategory;
  }
  
  /**
   * 更新分类（需要 librarian 或 admin 权限）
   */
  updateCategory(categoryId, updateData) {
    if (!this.permission.can('edit', 'categories')) {
      throw new Error('没有权限编辑分类');
    }
    
    const category = this.storage.getCategoryById(categoryId);
    
    if (!category) {
      throw new Error('分类不存在');
    }
    
    const updatedCategory = this.storage.updateCategory({
      ...category,
      ...updateData
    });
    
    return updatedCategory;
  }
  
  /**
   * 删除分类（需要 librarian 或 admin 权限）
   */
  deleteCategory(categoryId) {
    if (!this.permission.can('delete', 'categories')) {
      throw new Error('没有权限删除分类');
    }
    
    const category = this.storage.getCategoryById(categoryId);
    
    if (!category) {
      throw new Error('分类不存在');
    }
    
    // 检查是否有子分类
    const allCategories = this.storage.getCategories();
    const hasChildren = allCategories.some(c => c.parentId === categoryId);
    
    if (hasChildren) {
      throw new Error('该分类下有子分类，无法删除');
    }
    
    // 检查是否有关联图书
    const books = this.storage.getBooks();
    const relatedBooks = books.filter(b => b.categoryId === categoryId);
    
    if (relatedBooks.length > 0) {
      throw new Error(`该分类下有${relatedBooks.length}本图书，无法删除`);
    }
    
    this.storage.deleteCategory(categoryId);
    
    return true;
  }
  
  /**
   * 更新分类图书数量
   */
  updateBookCount(categoryId) {
    const categories = this.storage.getCategories();
    const books = this.storage.getBooks();
    
    const category = categories.find(c => c.id == categoryId);
    if (category) {
      category.bookCount = books.filter(b => b.categoryId === categoryId).length;
      this.storage.saveCategories(categories);
    }
  }
  
  /**
   * 更新所有分类的图书数量
   */
  updateAllBookCounts() {
    const categories = this.storage.getCategories();
    categories.forEach(cat => {
      this.updateBookCount(cat.id);
    });
  }
}
