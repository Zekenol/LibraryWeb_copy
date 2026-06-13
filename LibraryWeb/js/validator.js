/**
 * 表单验证模块
 * 提供常用的表单验证规则
 */

const Validator = {
  /**
   * 必填验证
   */
  required(value, message = '此项为必填项') {
    if (!value || value.trim() === '') {
      return { valid: false, message };
    }
    return { valid: true };
  },
  
  /**
   * 最小长度
   */
  minLength(value, length, message = `最少需要${length}个字符`) {
    if (!value || value.length < length) {
      return { valid: false, message };
    }
    return { valid: true };
  },
  
  /**
   * 最大长度
   */
  maxLength(value, length, message = `最多允许${length}个字符`) {
    if (value && value.length > length) {
      return { valid: false, message };
    }
    return { valid: true };
  },
  
  /**
   * 邮箱格式验证
   */
  isEmail(value, message = '请输入有效的邮箱地址') {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(value)) {
      return { valid: false, message };
    }
    return { valid: true };
  },
  
  /**
   * 手机号验证
   */
  isPhone(value, message = '请输入有效的手机号码') {
    const regex = /^1[3-9]\d{9}$/;
    if (!regex.test(value)) {
      return { valid: false, message };
    }
    return { valid: true };
  },
  
  /**
   * 密码强度验证（至少包含字母和数字，6-20位）
   */
  isPassword(value, message = '密码需包含字母和数字，6-20位') {
    const regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,20}$/;
    if (!regex.test(value)) {
      return { valid: false, message };
    }
    return { valid: true };
  },
  
  /**
   * 确认密码验证
   */
  confirmPassword(password, confirmPassword, message = '两次输入的密码不一致') {
    if (password !== confirmPassword) {
      return { valid: false, message };
    }
    return { valid: true };
  },
  
  /**
   * 数字范围验证
   */
  range(value, min, max, message = `请输入${min}到${max}之间的数字`) {
    const num = Number(value);
    if (isNaN(num) || num < min || num > max) {
      return { valid: false, message };
    }
    return { valid: true };
  },
  
  /**
   * 自定义正则验证
   */
  pattern(value, regex, message = '格式不正确') {
    if (!regex.test(value)) {
      return { valid: false, message };
    }
    return { valid: true };
  },
  
  /**
   * 组合验证（多个规则）
   */
  validate(rules) {
    for (const rule of rules) {
      const result = rule.validator(rule.value, ...rule.params);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  }
};

/**
 * 实时验证助手
 * 为表单字段添加实时验证功能
 */
class FormValidator {
  constructor(formElement) {
    this.form = formElement;
    this.errors = {};
  }
  
  /**
   * 验证单个字段
   */
  validateField(fieldName, value, rules) {
    for (const rule of rules) {
      const result = Validator[rule.type](value, ...(rule.params || []));
      
      if (!result.valid) {
        this.showFieldError(fieldName, result.message);
        return false;
      }
    }
    
    this.clearFieldError(fieldName);
    return true;
  }
  
  /**
   * 显示字段错误
   */
  showFieldError(fieldName, message) {
    const field = this.form.querySelector(`[name="${fieldName}"]`);
    if (!field) return;
    
    // 添加错误样式
    field.classList.add('is-invalid');
    field.classList.remove('is-valid');
    
    // 显示错误消息
    let feedback = field.parentElement.querySelector('.invalid-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.className = 'invalid-feedback';
      field.parentElement.appendChild(feedback);
    }
    feedback.textContent = message;
    
    this.errors[fieldName] = message;
  }
  
  /**
   * 清除字段错误
   */
  clearFieldError(fieldName) {
    const field = this.form.querySelector(`[name="${fieldName}"]`);
    if (!field) return;
    
    field.classList.remove('is-invalid');
    field.classList.add('is-valid');
    
    const feedback = field.parentElement.querySelector('.invalid-feedback');
    if (feedback) {
      feedback.textContent = '';
    }
    
    delete this.errors[fieldName];
  }
  
  /**
   * 验证整个表单
   */
  validateForm(validationRules) {
    let isValid = true;
    
    for (const [fieldName, rules] of Object.entries(validationRules)) {
      const field = this.form.querySelector(`[name="${fieldName}"]`);
      if (field) {
        const fieldValid = this.validateField(fieldName, field.value, rules);
        if (!fieldValid) {
          isValid = false;
        }
      }
    }
    
    return isValid;
  }
  
  /**
   * 重置验证状态
   */
  reset() {
    this.form.querySelectorAll('.is-invalid, .is-valid').forEach(field => {
      field.classList.remove('is-invalid', 'is-valid');
    });
    
    this.form.querySelectorAll('.invalid-feedback').forEach(feedback => {
      feedback.textContent = '';
    });
    
    this.errors = {};
  }
}
