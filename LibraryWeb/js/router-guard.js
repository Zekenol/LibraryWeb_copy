/**
 * 路由守卫模块
 * 检查登录状态和页面访问权限
 */

const RouterGuard = {
  /**
   * 需要登录才能访问的页面
   */
  protectedPages: [
    'index.html',
    'books/list.html',
    'books/detail.html',
    'books/add.html',
    'books/edit.html',
    'borrow/my-borrows.html',
    'borrow/all-borrows.html',
    'categories/manage.html',
    'users/manage.html',
    'users/profile.html',
    'admin/dashboard.html'
  ],
  
  /**
   * 仅管理员可访问的页面
   */
  adminOnlyPages: [
    'users/manage.html',
    'admin/dashboard.html'
  ],
  
  /**
   * 仅图书管理员及以上可访问的页面
   */
  librarianOnlyPages: [
    'books/add.html',
    'books/edit.html',
    'borrow/all-borrows.html',
    'categories/manage.html'
  ],
  
  /**
   * 检查登录状态
   */
  checkAuth() {
    const currentPage = this.getCurrentPage();
    
    // 检查是否是受保护页面
    if (this.protectedPages.includes(currentPage)) {
      if (!Storage.isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
      }
    }
    
    return true;
  },
  
  /**
   * 检查页面访问权限
   */
  checkPermission() {
    const currentPage = this.getCurrentPage();
    const perm = new PermissionManager();
    
    // 检查管理员专属页面
    if (this.adminOnlyPages.includes(currentPage)) {
      return perm.requireRole('admin', '仅管理员可访问此页面');
    }
    
    // 检查图书管理员专属页面
    if (this.librarianOnlyPages.includes(currentPage)) {
      return perm.requireRole('librarian', '仅图书管理员可访问此页面');
    }
    
    return true;
  },
  
  /**
   * 获取当前页面名称
   */
  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop();
    return filename || 'index.html';
  },
  
  /**
   * 重定向到首页
   */
  redirectToHome() {
    window.location.href = 'index.html';
  },
  
  /**
   * 重定向到登录页
   */
  redirectToLogin() {
    window.location.href = 'login.html';
  },
  
  /**
   * 初始化路由守卫（在页面加载时调用）
   */
  init() {
    this.checkAuth();
    this.checkPermission();
  }
};
