/**
 * 数据存储模块 - LocalStorage 操作封装
 * 提供统一的数据访问接口
 */

const Storage = {
  // ==================== 用户相关 ====================
  
  /**
   * 获取所有用户
   */
  getUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  },
  
  /**
   * 保存所有用户
   */
  saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
  },
  
  /**
   * 根据用户名查找用户
   */
  getUserByUsername(username) {
    const users = this.getUsers();
    return users.find(u => u.username === username);
  },
  
  /**
   * 根据ID查找用户
   */
  getUserById(id) {
    const users = this.getUsers();
    return users.find(u => u.id === id);
  },
  
  /**
   * 添加新用户
   */
  addUser(userData) {
    const users = this.getUsers();
    const newUser = {
      id: Date.now(),
      ...userData,
      registerTime: new Date().toISOString(),
      status: 'active',
      currentBorrowCount: 0
    };
    
    // 检查用户名是否已存在
    if (this.getUserByUsername(newUser.username)) {
      throw new Error('用户名已存在');
    }
    
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  },
  
  /**
   * 更新用户信息
   */
  updateUser(updatedUser) {
    const users = this.getUsers();
    const index = users.findIndex(u => u.id === updatedUser.id);
    
    if (index !== -1) {
      users[index] = { ...users[index], ...updatedUser };
      this.saveUsers(users);
      return users[index];
    }
    
    throw new Error('用户不存在');
  },
  
  /**
   * 删除用户
   */
  deleteUser(userId) {
    const users = this.getUsers();
    const filtered = users.filter(u => u.id !== userId);
    this.saveUsers(filtered);
  },
  
  // ==================== 当前用户会话 ====================
  
  /**
   * 获取当前登录用户
   */
  getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  },
  
  /**
   * 设置当前登录用户
   */
  setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('lastLoginTime', new Date().toISOString());
  },
  
  /**
   * 清除当前登录用户（登出）
   */
  clearCurrentUser() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sessionToken');
  },
  
  /**
   * 检查是否已登录
   */
  isLoggedIn() {
    return this.getCurrentUser() !== null;
  },
  
  // ==================== 图书相关 ====================
  
  /**
   * 获取所有图书
   */
  getBooks() {
    const books = localStorage.getItem('books');
    return books ? JSON.parse(books) : [];
  },
  
  /**
   * 保存所有图书
   */
  saveBooks(books) {
    localStorage.setItem('books', JSON.stringify(books));
  },
  
  /**
   * 根据ID查找图书
   */
  getBookById(id) {
    const books = this.getBooks();
    return books.find(b => b.id === id);
  },
  
  /**
   * 添加图书
   */
  addBook(bookData) {
    const books = this.getBooks();
    const newBook = {
      id: Date.now(),
      ...bookData,
      borrowCount: 0,
      rating: 0,
      addTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    };
    
    books.push(newBook);
    this.saveBooks(books);
    return newBook;
  },
  
  /**
   * 更新图书
   */
  updateBook(updatedBook) {
    const books = this.getBooks();
    const index = books.findIndex(b => b.id === updatedBook.id);
    
    if (index !== -1) {
      books[index] = { 
        ...books[index], 
        ...updatedBook,
        updateTime: new Date().toISOString()
      };
      this.saveBooks(books);
      return books[index];
    }
    
    throw new Error('图书不存在');
  },
  
  /**
   * 删除图书
   */
  deleteBook(bookId) {
    const books = this.getBooks();
    const filtered = books.filter(b => b.id !== bookId);
    this.saveBooks(filtered);
  },
  
  /**
   * 搜索图书
   */
  searchBooks(keyword, category = 'all') {
    let books = this.getBooks();
    
    // 按关键词搜索
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      books = books.filter(b => 
        b.title.toLowerCase().includes(lowerKeyword) ||
        b.author.toLowerCase().includes(lowerKeyword) ||
        b.isbn.includes(keyword)
      );
    }
    
    // 按分类筛选
    if (category && category !== 'all') {
      books = books.filter(b => b.categoryId == category);
    }
    
    return books;
  },
  
  // ==================== 分类相关 ====================
  
  /**
   * 获取所有分类
   */
  getCategories() {
    const categories = localStorage.getItem('categories');
    return categories ? JSON.parse(categories) : [];
  },
  
  /**
   * 保存所有分类
   */
  saveCategories(categories) {
    localStorage.setItem('categories', JSON.stringify(categories));
  },
  
  /**
   * 根据ID查找分类
   */
  getCategoryById(id) {
    const categories = this.getCategories();
    return categories.find(c => c.id == id);
  },
  
  /**
   * 添加分类
   */
  addCategory(categoryData) {
    const categories = this.getCategories();
    const newCategory = {
      id: Date.now(),
      ...categoryData,
      bookCount: 0,
      createTime: new Date().toISOString()
    };
    
    categories.push(newCategory);
    this.saveCategories(categories);
    return newCategory;
  },
  
  /**
   * 更新分类
   */
  updateCategory(updatedCategory) {
    const categories = this.getCategories();
    const index = categories.findIndex(c => c.id == updatedCategory.id);
    
    if (index !== -1) {
      categories[index] = { ...categories[index], ...updatedCategory };
      this.saveCategories(categories);
      return categories[index];
    }
    
    throw new Error('分类不存在');
  },
  
  /**
   * 删除分类
   */
  deleteCategory(categoryId) {
    const categories = this.getCategories();
    const filtered = categories.filter(c => c.id != categoryId);
    this.saveCategories(filtered);
  },
  
  // ==================== 借阅记录相关 ====================
  
  /**
   * 获取所有借阅记录
   */
  getBorrows() {
    const borrows = localStorage.getItem('borrows');
    return borrows ? JSON.parse(borrows) : [];
  },
  
  /**
   * 保存所有借阅记录
   */
  saveBorrows(borrows) {
    localStorage.setItem('borrows', JSON.stringify(borrows));
  },
  
  /**
   * 根据ID查找借阅记录
   */
  getBorrowById(id) {
    const borrows = this.getBorrows();
    return borrows.find(b => b.id === id);
  },
  
  /**
   * 获取用户的借阅记录
   */
  getUserBorrows(userId, status = 'all') {
    const borrows = this.getBorrows();
    let userBorrows = borrows.filter(b => b.userId === userId);
    
    if (status !== 'all') {
      userBorrows = userBorrows.filter(b => b.status === status);
    }
    
    return userBorrows.sort((a, b) => 
      new Date(b.borrowDate) - new Date(a.borrowDate)
    );
  },
  
  /**
   * 添加借阅记录
   */
  addBorrow(borrowData) {
    const borrows = this.getBorrows();
    const newBorrow = {
      id: Date.now(),
      ...borrowData,
      createTime: new Date().toISOString()
    };
    
    borrows.push(newBorrow);
    this.saveBorrows(borrows);
    return newBorrow;
  },
  
  /**
   * 更新借阅记录
   */
  updateBorrow(updatedBorrow) {
    const borrows = this.getBorrows();
    const index = borrows.findIndex(b => b.id === updatedBorrow.id);
    
    if (index !== -1) {
      borrows[index] = { ...borrows[index], ...updatedBorrow };
      this.saveBorrows(borrows);
      return borrows[index];
    }
    
    throw new Error('借阅记录不存在');
  },
  
  // ==================== 系统设置 ====================
  
  /**
   * 获取系统设置
   */
  getSettings() {
    const settings = localStorage.getItem('settings');
    return settings ? JSON.parse(settings) : {
      maxBorrowDays: 30,
      maxRenewCount: 1,
      finePerDay: 0.5,
      maxBorrowCount: 5,
      siteName: "图书借阅管理系统",
      version: "1.0.0"
    };
  },
  
  /**
   * 保存系统设置
   */
  saveSettings(settings) {
    localStorage.setItem('settings', JSON.stringify(settings));
  },
  
  // ==================== 初始化数据 ====================
  
  /**
   * 初始化示例数据（首次使用时）
   */
  initSampleData() {
    // 仅在没有任何数据时初始化
    if (this.getUsers().length === 0) {
      this.initUsers();
    }
    
    if (this.getCategories().length === 0) {
      this.initCategories();
    }
    
    if (this.getBooks().length === 0) {
      this.initBooks();
    }
    
    if (this.getBorrows().length === 0) {
      this.initBorrows();
    }
  },
  
  /**
   * 初始化示例用户
   */
  initUsers() {
    const users = [
      {
        id: 1,
        username: "admin",
        password: "admin123",
        email: "admin@library.com",
        phone: "13800138000",
        role: "admin",
        realName: "系统管理员",
        studentId: "ADMIN001",
        department: "信息中心",
        avatar: "",
        maxBorrowCount: 10,
        currentBorrowCount: 0,
        status: "active",
        registerTime: "2026-01-01T08:00:00"
      },
      {
        id: 2,
        username: "librarian1",
        password: "lib123456",
        email: "lib@library.com",
        phone: "13800138001",
        role: "librarian",
        realName: "李图书管理员",
        studentId: "LIB001",
        department: "图书馆",
        avatar: "",
        maxBorrowCount: 8,
        currentBorrowCount: 0,
        status: "active",
        registerTime: "2026-01-15T08:00:00"
      },
      {
        id: 3,
        username: "student001",
        password: "stu123456",
        email: "student@example.com",
        phone: "13800138002",
        role: "user",
        realName: "张学生",
        studentId: "2024001",
        department: "计算机学院",
        avatar: "",
        maxBorrowCount: 5,
        currentBorrowCount: 2,
        status: "active",
        registerTime: "2026-03-01T08:00:00"
      }
    ];
    
    this.saveUsers(users);
  },
  
  /**
   * 初始化示例分类
   */
  initCategories() {
    const categories = [
      { id: 1, name: "计算机", code: "CS", parentId: null, sortOrder: 1, icon: "bi-laptop", description: "计算机科学相关图书", bookCount: 3 },
      { id: 2, name: "前端开发", code: "FE", parentId: 1, sortOrder: 1, icon: "bi-code-slash", description: "Web前端技术", bookCount: 2 },
      { id: 3, name: "后端开发", code: "BE", parentId: 1, sortOrder: 2, icon: "bi-server", description: "服务器端技术", bookCount: 1 },
      { id: 4, name: "文学", code: "LIT", parentId: null, sortOrder: 2, icon: "bi-book", description: "文学作品", bookCount: 0 },
      { id: 5, name: "科学", code: "SCI", parentId: null, sortOrder: 3, icon: "bi-flask", description: "自然科学", bookCount: 0 }
    ];
    
    this.saveCategories(categories);
  },
  
  /**
   * 初始化示例图书
   */
  initBooks() {
    const books = [
      {
        id: 1,
        title: "JavaScript高级程序设计（第4版）",
        author: "Nicholas C. Zakas",
        isbn: "978-7-115-54581-4",
        categoryId: 2,
        category: "前端开发",
        publisher: "人民邮电出版社",
        publishDate: "2020-10-01",
        edition: "第4版",
        pages: 768,
        language: "中文",
        totalCopies: 5,
        availableCopies: 3,
        location: {
          building: "主图书馆",
          floor: "3楼",
          room: "A301",
          shelf: "第3排",
          position: "第5架"
        },
        status: "available",
        tags: ["JavaScript", "前端", "编程"],
        description: "JavaScript经典教程，全面深入讲解语言特性",
        coverImage: "",
        borrowCount: 25,
        rating: 4.8,
        addTime: "2026-01-01T08:00:00",
        updateTime: "2026-06-13T10:00:00"
      },
      {
        id: 2,
        title: "Vue.js设计与实现",
        author: "霍春阳",
        isbn: "978-7-115-57978-5",
        categoryId: 2,
        category: "前端开发",
        publisher: "人民邮电出版社",
        publishDate: "2022-04-01",
        edition: "第1版",
        pages: 520,
        language: "中文",
        totalCopies: 3,
        availableCopies: 0,
        location: {
          building: "主图书馆",
          floor: "3楼",
          room: "A301",
          shelf: "第3排",
          position: "第6架"
        },
        status: "borrowed",
        tags: ["Vue", "前端", "框架"],
        description: "深入剖析Vue.js 3的设计思想与实现原理",
        coverImage: "",
        borrowCount: 18,
        rating: 4.9,
        addTime: "2026-02-01T08:00:00",
        updateTime: "2026-06-13T10:00:00"
      },
      {
        id: 3,
        title: "深入浅出Node.js",
        author: "朴灵",
        isbn: "978-7-115-39260-0",
        categoryId: 3,
        category: "后端开发",
        publisher: "人民邮电出版社",
        publishDate: "2013-12-01",
        edition: "第1版",
        pages: 316,
        language: "中文",
        totalCopies: 4,
        availableCopies: 4,
        location: {
          building: "主图书馆",
          floor: "3楼",
          room: "A302",
          shelf: "第4排",
          position: "第2架"
        },
        status: "available",
        tags: ["Node.js", "后端", "JavaScript"],
        description: "从源码层面解析Node.js核心模块",
        coverImage: "",
        borrowCount: 32,
        rating: 4.7,
        addTime: "2026-01-15T08:00:00",
        updateTime: "2026-06-13T10:00:00"
      }
    ];
    
    this.saveBooks(books);
  },
  
  /**
   * 初始化示例借阅记录
   */
  initBorrows() {
    const borrows = [
      {
        id: 1,
        bookId: 1,
        bookTitle: "JavaScript高级程序设计",
        userId: 3,
        borrowerName: "张学生",
        borrowerStudentId: "2024001",
        borrowDate: "2026-06-01T09:00:00",
        dueDate: "2026-06-30T23:59:59",
        returnDate: null,
        status: "borrowing",
        renewCount: 0,
        isOverdue: false,
        overdueDays: 0,
        fineAmount: 0,
        approvedBy: 2,
        approvedAt: "2026-06-01T09:00:00",
        actualBorrowDays: 0,
        notes: "",
        createTime: "2026-06-01T09:00:00"
      },
      {
        id: 2,
        bookId: 2,
        bookTitle: "Vue.js设计与实现",
        userId: 3,
        borrowerName: "张学生",
        borrowerStudentId: "2024001",
        borrowDate: "2026-05-15T10:00:00",
        dueDate: "2026-06-14T23:59:59",
        returnDate: null,
        status: "borrowing",
        renewCount: 0,
        isOverdue: false,
        overdueDays: 0,
        fineAmount: 0,
        approvedBy: 2,
        approvedAt: "2026-05-15T10:00:00",
        actualBorrowDays: 0,
        notes: "",
        createTime: "2026-05-15T10:00:00"
      }
    ];
    
    this.saveBorrows(borrows);
  }
};
