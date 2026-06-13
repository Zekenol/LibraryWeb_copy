/**
 * 认证模块
 * 处理用户登录、注册、登出等功能
 */

const Auth = {
  /**
   * 用户登录
   */
  login(username, password) {
    const user = Storage.getUserByUsername(username);
    
    if (!user) {
      throw new Error('用户名或密码错误');
    }
    
    if (user.status !== 'active') {
      throw new Error('账户已被禁用，请联系管理员');
    }
    
    if (user.password !== password) {
      throw new Error('用户名或密码错误');
    }
    
    // 设置当前用户会话
    const sessionUser = { ...user };
    delete sessionUser.password; // 不保存密码到会话
    Storage.setCurrentUser(sessionUser);
    
    // 生成会话token
    localStorage.setItem('sessionToken', this.generateToken());
    
    return sessionUser;
  },
  
  /**
   * 用户注册
   */
  register(userData) {
    // 验证用户名是否已存在
    if (Storage.getUserByUsername(userData.username)) {
      throw new Error('用户名已存在');
    }
    
    // 验证邮箱是否已注册
    const users = Storage.getUsers();
    if (users.some(u => u.email === userData.email)) {
      throw new Error('邮箱已被注册');
    }
    
    // 创建新用户（默认普通用户角色）
    const newUser = Storage.addUser({
      username: userData.username,
      password: userData.password,
      email: userData.email,
      realName: userData.realName,
      studentId: userData.studentId,
      department: userData.department,
      phone: userData.phone || '',
      role: userData.role || 'user',
      avatar: '',
      maxBorrowCount: userData.maxBorrowCount || 5
    });
    
    return newUser;
  },
  
  /**
   * 用户登出
   */
  logout() {
    Storage.clearCurrentUser();
    localStorage.removeItem('sessionToken');

    const isHomePage = /\/index\.html$/i.test(window.location.pathname) || window.location.pathname === '/index.html';
    const loginUrl = new URL(
      isHomePage ? 'login.html' : '../login.html',
      window.location.href
    );

    window.location.href = `${loginUrl.toString()}?t=${Date.now()}`;
  },
  
  /**
   * 检查是否已登录
   */
  isLoggedIn() {
    return Storage.isLoggedIn();
  },
  
  /**
   * 获取当前用户
   */
  getCurrentUser() {
    return Storage.getCurrentUser();
  },
  
  /**
   * 更新用户信息
   */
  updateProfile(userData) {
    const currentUser = Storage.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('未登录');
    }
    
    const updatedUser = Storage.updateUser({
      id: currentUser.id,
      ...userData
    });
    
    // 更新会话中的用户信息
    const sessionUser = { ...updatedUser };
    delete sessionUser.password;
    Storage.setCurrentUser(sessionUser);
    
    return sessionUser;
  },
  
  /**
   * 修改密码
   */
  changePassword(oldPassword, newPassword) {
    const currentUser = Storage.getCurrentUser();
    
    if (!currentUser) {
      throw new Error('未登录');
    }
    
    const user = Storage.getUserById(currentUser.id);
    
    if (user.password !== oldPassword) {
      throw new Error('原密码错误');
    }
    
    Storage.updateUser({
      id: user.id,
      password: newPassword
    });
    
    return true;
  },
  
  /**
   * 生成会话token
   */
  generateToken() {
    return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },
  
  /**
   * 检查会话是否有效
   */
  checkSession() {
    const token = localStorage.getItem('sessionToken');
    const user = Storage.getCurrentUser();
    
    if (!token || !user) {
      return false;
    }
    
    // 简单验证（实际项目中应该有更复杂的验证机制）
    return true;
  }
};
