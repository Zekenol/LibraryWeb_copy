/**
 * 借阅管理模块
 * 处理图书借阅、归还、续借等业务逻辑
 */

class BorrowManager {
  constructor() {
    this.storage = Storage;
    this.permission = new PermissionManager();
  }
  
  /**
   * 创建借阅申请
   */
  createBorrow(bookId) {
    const sessionUser = this.storage.getCurrentUser();
    if (!sessionUser) {
      throw new Error('请先登录');
    }

    const currentUser = this.storage.getUserById(sessionUser.id) || sessionUser;
    this.permission.currentUser = currentUser;
    this.permission.role = currentUser.role || 'guest';

    const book = this.storage.getBookById(bookId);
    
    if (!book) {
      throw new Error('图书不存在');
    }
    
    // 验证借阅资格
    const validation = this.validateBorrowEligibility(currentUser, book);
    if (!validation.valid) {
      throw new Error(validation.message);
    }
    
    // 计算应还日期
    const settings = this.storage.getSettings();
    const dueDate = this.calculateDueDate(settings.maxBorrowDays);
    
    // 创建借阅记录
    const borrowRecord = {
      id: Date.now(),
      bookId: book.id,
      bookTitle: book.title,
      userId: currentUser.id,
      borrowerName: currentUser.realName || currentUser.username,
      borrowerStudentId: currentUser.studentId || '',
      
      borrowDate: new Date().toISOString(),
      dueDate: dueDate,
      returnDate: null,
      
      status: 'borrowing',
      renewCount: 0,
      isOverdue: false,
      overdueDays: 0,
      fineAmount: 0,
      actualBorrowDays: 0,
      
      approvedBy: currentUser.id,
      approvedAt: new Date().toISOString(),
      
      notes: '',
      createTime: new Date().toISOString()
    };
    
    // 更新图书库存
    book.availableCopies--;
    if (book.availableCopies === 0) {
      book.status = 'borrowed';
    }
    this.storage.updateBook(book);
    
    // 保存借阅记录
    this.storage.addBorrow(borrowRecord);
    
    // 更新用户借阅计数
    this.updateUserBorrowCount(currentUser.id);
    
    return borrowRecord;
  }
  
  /**
   * 归还图书
   */
  returnBook(borrowId) {
    const borrows = this.storage.getBorrows();
    const borrow = borrows.find(b => b.id === borrowId);
    
    if (!borrow) {
      throw new Error('借阅记录不存在');
    }
    
    const sessionUser = this.storage.getCurrentUser();
    const currentUser = this.storage.getUserById(sessionUser?.id) || sessionUser;
    this.permission.currentUser = currentUser;
    this.permission.role = currentUser?.role || 'guest';

    // 检查权限：只能归还自己的书，或者管理员可以归还所有
    if (!currentUser || (borrow.userId !== currentUser.id && !this.permission.hasRole('librarian'))) {
      throw new Error('无权操作此借阅记录');
    }
    
    if (borrow.status !== 'borrowing' && borrow.status !== 'renewed') {
      throw new Error('该图书不在借阅中');
    }
    
    const book = this.storage.getBookById(borrow.bookId);
    
    // 计算逾期信息
    const now = new Date();
    const dueDate = new Date(borrow.dueDate);
    const settings = this.storage.getSettings();
    
    borrow.returnDate = now.toISOString();
    borrow.status = 'returned';
    
    if (now > dueDate) {
      borrow.isOverdue = true;
      borrow.overdueDays = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
      borrow.fineAmount = borrow.overdueDays * settings.finePerDay;
    }
    
    // 计算实际借阅天数
    borrow.actualBorrowDays = Math.ceil(
      (now - new Date(borrow.borrowDate)) / (1000 * 60 * 60 * 24)
    );
    
    // 更新图书库存
    if (book) {
      book.availableCopies++;
      book.status = 'available';
      book.borrowCount++;
      this.storage.updateBook(book);
    }
    
    // 保存更新
    this.storage.updateBorrow(borrow);
    this.updateUserBorrowCount(borrow.userId);
    
    return borrow;
  }
  
  /**
   * 续借图书
   */
  renewBook(borrowId) {
    const borrows = this.storage.getBorrows();
    const borrow = borrows.find(b => b.id === borrowId);
    
    if (!borrow) {
      throw new Error('借阅记录不存在');
    }
    
    const sessionUser = this.storage.getCurrentUser();
    const currentUser = this.storage.getUserById(sessionUser?.id) || sessionUser;
    this.permission.currentUser = currentUser;
    this.permission.role = currentUser?.role || 'guest';

    if (!currentUser || borrow.userId !== currentUser.id) {
      throw new Error('只能续借自己的图书');
    }
    
    if (borrow.status !== 'borrowing') {
      throw new Error('只能续借在借图书');
    }
    
    const settings = this.storage.getSettings();
    
    if (borrow.renewCount >= settings.maxRenewCount) {
      throw new Error(`已达到最大续借次数(${settings.maxRenewCount}次)`);
    }
    
    // 延长应还日期（默认15天）
    const currentDueDate = new Date(borrow.dueDate);
    currentDueDate.setDate(currentDueDate.getDate() + 15);
    
    borrow.dueDate = currentDueDate.toISOString();
    borrow.renewCount++;
    borrow.renewedAt = new Date().toISOString();
    borrow.status = 'renewed';
    
    this.storage.updateBorrow(borrow);
    
    return borrow;
  }
  
  /**
   * 验证借阅资格
   */
  validateBorrowEligibility(user, book) {
    if (book.availableCopies <= 0) {
      return { valid: false, message: '该书已全部借出' };
    }

    const activeBorrowCount = this.storage.getBorrows().filter(b =>
      b.userId === user.id && (b.status === 'borrowing' || b.status === 'renewed')
    ).length;
    const maxBorrowCount = user.maxBorrowCount || this.storage.getSettings().maxBorrowCount || 5;

    if (activeBorrowCount >= maxBorrowCount) {
      return { valid: false, message: `已达到最大借阅数量(${maxBorrowCount}本)` };
    }
    
    // 检查是否有逾期未还
    const borrows = this.storage.getBorrows();
    const hasOverdue = borrows.some(b => 
      b.userId === user.id && 
      (b.status === 'borrowing' || b.status === 'renewed') && 
      b.isOverdue
    );
    
    if (hasOverdue) {
      return { valid: false, message: '有逾期未还图书，请先归还' };
    }

    const hasActiveBorrow = borrows.some(b =>
      b.userId === user.id &&
      b.bookId === book.id &&
      (b.status === 'borrowing' || b.status === 'renewed')
    );

    if (hasActiveBorrow) {
      return { valid: false, message: '您已经借阅过这本书，不能重复借阅' };
    }
    
    return { valid: true };
  }
  
  /**
   * 计算应还日期
   */
  calculateDueDate(days = 30) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    return dueDate.toISOString();
  }
  
  /**
   * 更新用户借阅计数
   */
  updateUserBorrowCount(userId) {
    const users = this.storage.getUsers();
    const user = users.find(u => u.id === userId);
    const borrows = this.storage.getBorrows();
    
    if (user) {
      const currentBorrowCount = borrows.filter(b => 
        b.userId === userId && (b.status === 'borrowing' || b.status === 'renewed')
      ).length;

      user.currentBorrowCount = currentBorrowCount;
      this.storage.saveUsers(users);

      const currentUser = this.storage.getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        const sessionUser = { ...user };
        delete sessionUser.password;
        this.storage.setCurrentUser(sessionUser);
      }
    }
  }
  
  /**
   * 获取用户的借阅记录
   */
  getUserBorrows(userId, status = 'all') {
    return this.storage.getUserBorrows(userId, status);
  }
  
  /**
   * 获取所有借阅记录（管理员）
   */
  getAllBorrows(filters = {}) {
    let borrows = this.storage.getBorrows();
    
    // 按状态筛选
    if (filters.status && filters.status !== 'all') {
      borrows = borrows.filter(b => b.status === filters.status);
    }
    
    // 按用户筛选
    if (filters.userId) {
      borrows = borrows.filter(b => b.userId === filters.userId);
    }
    
    // 按图书筛选
    if (filters.bookId) {
      borrows = borrows.filter(b => b.bookId === filters.bookId);
    }
    
    // 按关键词搜索
    if (filters.keyword) {
      const keyword = filters.keyword.toLowerCase();
      borrows = borrows.filter(b => 
        b.bookTitle.toLowerCase().includes(keyword) ||
        b.borrowerName.toLowerCase().includes(keyword) ||
        (b.borrowerStudentId && b.borrowerStudentId.includes(keyword))
      );
    }
    
    // 按时间范围筛选
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      borrows = borrows.filter(b => new Date(b.borrowDate) >= startDate);
    }
    
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      borrows = borrows.filter(b => new Date(b.borrowDate) <= endDate);
    }
    
    // 按借阅时间倒序排列
    return borrows.sort((a, b) => 
      new Date(b.borrowDate) - new Date(a.borrowDate)
    );
  }
  
  /**
   * 检查并更新逾期状态
   */
  checkOverdueBooks() {
    const borrows = this.storage.getBorrows();
    const now = new Date();
    let updated = false;
    
    borrows.forEach(borrow => {
      if (borrow.status === 'borrowing' && !borrow.isOverdue) {
        const dueDate = new Date(borrow.dueDate);
        if (now > dueDate) {
          borrow.isOverdue = true;
          borrow.overdueDays = Math.ceil((now - dueDate) / (1000 * 60 * 60 * 24));
          
          const settings = this.storage.getSettings();
          borrow.fineAmount = borrow.overdueDays * settings.finePerDay;
          
          updated = true;
        }
      }
    });
    
    if (updated) {
      this.storage.saveBorrows(borrows);
    }
  }
  
  /**
   * 获取逾期图书列表
   */
  getOverdueBorrows() {
    this.checkOverdueBooks();
    const borrows = this.storage.getBorrows();
    
    return borrows.filter(b => b.status === 'borrowing' && b.isOverdue)
      .sort((a, b) => b.overdueDays - a.overdueDays);
  }
  
  /**
   * 获取借阅统计信息
   */
  getBorrowStats() {
    const borrows = this.storage.getBorrows();
    
    return {
      total: borrows.length,
      borrowing: borrows.filter(b => b.status === 'borrowing').length,
      returned: borrows.filter(b => b.status === 'returned').length,
      overdue: borrows.filter(b => b.status === 'borrowing' && b.isOverdue).length,
      renewed: borrows.filter(b => b.status === 'renewed').length
    };
  }
}
