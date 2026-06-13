/**
 * 图书管理模块
 * 提供图书的增删改查功能
 */

class BookManager {
  constructor() {
    this.storage = Storage;
    this.permission = new PermissionManager();
  }
  
  /**
   * 获取所有图书
   */
  getAllBooks() {
    return this.storage.getBooks();
  }
  
  /**
   * 根据ID获取图书
   */
  getBookById(id) {
    return this.storage.getBookById(id);
  }
  
  /**
   * 搜索图书
   */
  searchBooks(keyword, categoryId = 'all') {
    return this.storage.searchBooks(keyword, categoryId);
  }
  
  /**
   * 添加图书（需要 librarian 或 admin 权限）
   */
  addBook(bookData) {
    if (!this.permission.can('create', 'books')) {
      throw new Error('没有权限添加图书');
    }
    
    // 验证必填字段
    this.validateBookData(bookData);
    
    const newBook = this.storage.addBook({
      ...bookData,
      status: bookData.availableCopies > 0 ? 'available' : 'borrowed',
      borrowCount: 0,
      rating: 0
    });
    
    // 更新分类图书数量
    if (bookData.categoryId) {
      this.updateCategoryBookCount(bookData.categoryId);
    }
    
    return newBook;
  }
  
  /**
   * 更新图书（需要 librarian 或 admin 权限）
   */
  updateBook(bookId, updateData) {
    if (!this.permission.can('edit', 'books')) {
      throw new Error('没有权限编辑图书');
    }
    
    const book = this.storage.getBookById(bookId);
    
    if (!book) {
      throw new Error('图书不存在');
    }
    
    // 验证数据
    if (updateData.title || updateData.author || updateData.isbn) {
      this.validateBookData(updateData);
    }
    
    const updatedBook = this.storage.updateBook({
      ...book,
      ...updateData
    });
    
    return updatedBook;
  }
  
  /**
   * 删除图书（需要 librarian 或 admin 权限）
   */
  deleteBook(bookId) {
    if (!this.permission.can('delete', 'books')) {
      throw new Error('没有权限删除图书');
    }
    
    const book = this.storage.getBookById(bookId);
    
    if (!book) {
      throw new Error('图书不存在');
    }
    
    // 检查是否有借阅记录
    const borrows = this.storage.getBorrows();
    const activeBorrows = borrows.filter(b => 
      b.bookId === bookId && b.status === 'borrowing'
    );
    
    if (activeBorrows.length > 0) {
      throw new Error('该图书有活跃的借阅记录，无法删除');
    }
    
    this.storage.deleteBook(bookId);
    
    // 更新分类图书数量
    if (book.categoryId) {
      this.updateCategoryBookCount(book.categoryId);
    }
    
    return true;
  }
  
  /**
   * 借阅图书
   */
  borrowBook(bookId) {
    const book = this.storage.getBookById(bookId);
    
    if (!book) {
      throw new Error('图书不存在');
    }
    
    if (book.availableCopies <= 0) {
      throw new Error('该书已全部借出');
    }
    
    const currentUser = this.permission.currentUser;
    
    if (!currentUser) {
      throw new Error('请先登录');
    }
    
    // 检查用户借阅限额
    if (currentUser.currentBorrowCount >= currentUser.maxBorrowCount) {
      throw new Error(`已达到最大借阅数量(${currentUser.maxBorrowCount}本)`);
    }
    
    // 检查是否有逾期未还
    const userBorrows = this.storage.getUserBorrows(currentUser.id);
    const hasOverdue = userBorrows.some(b => b.status === 'borrowing' && b.isOverdue);
    
    if (hasOverdue) {
      throw new Error('有逾期未还图书，请先归还');
    }
    
    // 创建借阅记录
    const borrowManager = new BorrowManager();
    borrowManager.createBorrow(bookId);
    
    return true;
  }
  
  /**
   * 归还图书
   */
  returnBook(borrowId) {
    const borrowManager = new BorrowManager();
    return borrowManager.returnBook(borrowId);
  }
  
  /**
   * 续借图书
   */
  renewBook(borrowId) {
    const borrowManager = new BorrowManager();
    return borrowManager.renewBook(borrowId);
  }
  
  /**
   * 验证图书数据
   */
  validateBookData(bookData) {
    if (!bookData.title || !bookData.title.trim()) {
      throw new Error('书名不能为空');
    }
    
    if (!bookData.author || !bookData.author.trim()) {
      throw new Error('作者不能为空');
    }
    
    if (!bookData.isbn || !bookData.isbn.trim()) {
      throw new Error('ISBN不能为空');
    }
    
    if (!bookData.categoryId) {
      throw new Error('请选择分类');
    }
    
    if (bookData.totalCopies < 1) {
      throw new Error('副本数量至少为1');
    }
  }
  
  /**
   * 更新分类图书数量
   */
  updateCategoryBookCount(categoryId) {
    const categoryManager = new CategoryManager();
    categoryManager.updateBookCount(categoryId);
  }
  
  /**
   * 获取图书状态文本
   */
  getStatusText(status) {
    const statusMap = {
      'available': '可借阅',
      'borrowed': '已借出',
      'reserved': '已预约',
      'damaged': '损坏',
      'lost': '遗失'
    };
    
    return statusMap[status] || status;
  }
  
  /**
   * 获取图书位置信息
   */
  getLocationString(location) {
    if (!location) return '未知';
    
    return `${location.building || ''} ${location.floor || ''} ${location.room || ''} ${location.shelf || ''}`.trim();
  }
}
