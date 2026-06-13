/**
 * 用户管理模块
 * 仅管理员可使用
 */

class UserManager {
  constructor() {
    this.storage = Storage;
    this.permission = new PermissionManager();
  }
  
  /**
   * 获取所有用户
   */
  getAllUsers() {
    if (!this.permission.hasRole('admin')) {
      throw new Error('只有管理员可以查看所有用户');
    }
    
    const users = this.storage.getUsers();
    
    // 移除密码字段
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }
  
  /**
   * 根据ID获取用户
   */
  getUserById(userId) {
    const user = this.storage.getUserById(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 检查权限：只能查看自己或管理员可以查看所有
    if (user.id !== this.permission.currentUser?.id && !this.permission.hasRole('admin')) {
      throw new Error('无权查看此用户信息');
    }
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  
  /**
   * 更新用户信息
   */
  updateUser(userId, updateData) {
    const currentUser = this.permission.currentUser;
    
    // 检查权限：只能修改自己或管理员可以修改所有
    if (userId !== currentUser?.id && !this.permission.hasRole('admin')) {
      throw new Error('无权修改此用户信息');
    }
    
    const user = this.storage.getUserById(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 不允许普通用户修改角色
    if (!this.permission.hasRole('admin')) {
      delete updateData.role;
      delete updateData.status;
      delete updateData.maxBorrowCount;
    }
    
    const updatedUser = this.storage.updateUser({
      ...user,
      ...updateData
    });
    
    // 如果修改的是当前用户，更新会话
    if (userId === currentUser?.id) {
      const sessionUser = { ...updatedUser };
      delete sessionUser.password;
      Storage.setCurrentUser(sessionUser);
    }
    
    const { password, ...result } = updatedUser;
    return result;
  }
  
  /**
   * 删除用户（仅管理员）
   */
  deleteUser(userId) {
    if (!this.permission.hasRole('admin')) {
      throw new Error('只有管理员可以删除用户');
    }
    
    const user = this.storage.getUserById(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 不能删除自己
    if (userId === this.permission.currentUser?.id) {
      throw new Error('不能删除自己的账号');
    }
    
    // 检查是否有借阅记录
    const borrows = this.storage.getBorrows();
    const activeBorrows = borrows.filter(b => b.userId === userId && b.status === 'borrowing');
    
    if (activeBorrows.length > 0) {
      throw new Error('该用户有未归还的图书，无法删除');
    }
    
    this.storage.deleteUser(userId);
    
    return true;
  }
  
  /**
   * 修改用户角色（仅管理员）
   */
  changeUserRole(userId, newRole) {
    if (!this.permission.hasRole('admin')) {
      throw new Error('只有管理员可以修改用户角色');
    }
    
    const validRoles = ['user', 'librarian', 'admin'];
    
    if (!validRoles.includes(newRole)) {
      throw new Error('无效的角色');
    }
    
    return this.updateUser(userId, { role: newRole });
  }
  
  /**
   * 启用/禁用用户（仅管理员）
   */
  toggleUserStatus(userId) {
    if (!this.permission.hasRole('admin')) {
      throw new Error('只有管理员可以启用/禁用用户');
    }
    
    const user = this.storage.getUserById(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    const newStatus = user.status === 'active' ? 'disabled' : 'active';
    
    return this.updateUser(userId, { status: newStatus });
  }
  
  /**
   * 重置用户密码（仅管理员）
   */
  resetPassword(userId, newPassword) {
    if (!this.permission.hasRole('admin')) {
      throw new Error('只有管理员可以重置密码');
    }
    
    const user = this.storage.getUserById(userId);
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    return this.storage.updateUser({
      ...user,
      password: newPassword
    });
  }
  
  /**
   * 搜索用户
   */
  searchUsers(keyword, role = 'all', status = 'all') {
    if (!this.permission.hasRole('admin')) {
      throw new Error('只有管理员可以搜索用户');
    }
    
    let users = this.storage.getUsers();
    
    // 按关键词搜索
    if (keyword) {
      const lowerKeyword = keyword.toLowerCase();
      users = users.filter(u => 
        u.username.toLowerCase().includes(lowerKeyword) ||
        u.realName.toLowerCase().includes(lowerKeyword) ||
        (u.studentId && u.studentId.includes(keyword)) ||
        u.email.toLowerCase().includes(lowerKeyword)
      );
    }
    
    // 按角色筛选
    if (role && role !== 'all') {
      users = users.filter(u => u.role === role);
    }
    
    // 按状态筛选
    if (status && status !== 'all') {
      users = users.filter(u => u.status === status);
    }
    
    // 移除密码字段
    return users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  }
  
  /**
   * 获取用户统计信息
   */
  getUserStats() {
    if (!this.permission.hasRole('admin')) {
      throw new Error('只有管理员可以查看统计信息');
    }
    
    const users = this.storage.getUsers();
    
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      disabled: users.filter(u => u.status === 'disabled').length,
      byRole: {
        admin: users.filter(u => u.role === 'admin').length,
        librarian: users.filter(u => u.role === 'librarian').length,
        user: users.filter(u => u.role === 'user').length
      }
    };
  }
}
