/**
 * 权限控制模块
 * 基于角色的访问控制（RBAC）
 */

class PermissionManager {
  constructor() {
    this.currentUser = Storage.getCurrentUser();
    this.role = this.currentUser?.role || 'guest';
  }
  
  /**
   * 角色层级定义
   */
  getRoleHierarchy() {
    return {
      'guest': 0,
      'user': 1,
      'librarian': 2,
      'admin': 3
    };
  }
  
  /**
   * 检查是否有指定角色或更高级别
   */
  hasRole(requiredRole) {
    const hierarchy = this.getRoleHierarchy();
    const currentLevel = hierarchy[this.role] || 0;
    const requiredLevel = hierarchy[requiredRole] || 0;
    
    return currentLevel >= requiredLevel;
  }
  
  /**
   * 检查是否可以执行某个操作
   */
  can(action, resource) {
    const permissions = {
      'user': {
        'view': ['books', 'categories', 'own_borrows', 'own_profile'],
        'borrow': ['books'],
        'return': ['own_books'],
        'renew': ['own_books'],
        'edit': ['own_profile']
      },
      'librarian': {
        'view': ['books', 'categories', 'all_borrows', 'users'],
        'create': ['books', 'categories'],
        'edit': ['books', 'categories'],
        'delete': ['books'],
        'approve': ['borrow_requests'],
        'manage': ['borrows']
      },
      'admin': {
        'view': ['*'],
        'create': ['*'],
        'edit': ['*'],
        'delete': ['*'],
        'manage': ['users', 'system', 'borrows', 'categories']
      }
    };
    
    const userPerms = permissions[this.role] || {};
    const allowedResources = userPerms[action] || [];
    
    return allowedResources.includes('*') || 
           allowedResources.includes(resource);
  }
  
  /**
   * 应用权限控制（显示/隐藏元素）
   */
  applyPermissions() {
    document.querySelectorAll('[data-permission]').forEach(el => {
      const requiredRole = el.dataset.permission;
      if (!this.hasRole(requiredRole)) {
        el.style.display = 'none';
      }
    });
  }
  
  /**
   * 检查权限，不足则拒绝访问
   */
  requireRole(requiredRole, message = '您没有权限访问此页面') {
    if (!this.hasRole(requiredRole)) {
      alert(message);
      window.location.href = 'index.html';
      return false;
    }
    return true;
  }
  
  /**
   * 检查操作权限
   */
  requirePermission(action, resource, message = '您没有权限执行此操作') {
    if (!this.can(action, resource)) {
      alert(message);
      return false;
    }
    return true;
  }
  
  /**
   * 获取用户角色名称
   */
  getRoleName() {
    const roleNames = {
      'admin': '系统管理员',
      'librarian': '图书管理员',
      'user': '普通用户'
    };
    
    return roleNames[this.role] || '访客';
  }
  
  /**
   * 获取角色徽章样式
   */
  getRoleBadgeClass() {
    const badgeClasses = {
      'admin': 'badge-danger',
      'librarian': 'badge-warning',
      'user': 'badge-primary'
    };
    
    return badgeClasses[this.role] || 'badge-secondary';
  }
}
