/**
 * Canvas 验证码生成器
 * 支持自定义长度、颜色、干扰线、噪点等
 */

class CaptchaGenerator {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = this.canvas.getContext('2d');
    this.code = '';
    
    // 默认配置
    this.options = {
      length: options.length || 4,              // 验证码长度
      fontSize: options.fontSize || 28,         // 字体大小
      fontFamily: options.fontFamily || 'Arial',// 字体
      colors: options.colors || ['#FF6B6B', '#4A90E2', '#2ECC71', '#FF9F43', '#9B59B6'],
      bgColor: options.bgColor || '#F8F9FA',    // 背景色
      noiseCount: options.noiseCount || 50,     // 噪点数量
      lineCount: options.lineCount || 4,        // 干扰线数量
      chars: options.chars || 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    };
    
    // 设置canvas尺寸
    this.canvas.width = 120;
    this.canvas.height = 50;
    
    // 点击刷新
    this.canvas.addEventListener('click', () => this.generate());
  }
  
  /**
   * 生成随机颜色
   */
  randomColor(colors = this.options.colors) {
    const index = Math.floor(Math.random() * colors.length);
    return colors[index];
  }
  
  /**
   * 生成随机数
   */
  randomNum(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }
  
  /**
   * 绘制背景
   */
  drawBackground() {
    this.ctx.fillStyle = this.options.bgColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
  
  /**
   * 绘制噪点
   */
  drawNoise() {
    for (let i = 0; i < this.options.noiseCount; i++) {
      const x = this.randomNum(0, this.canvas.width);
      const y = this.randomNum(0, this.canvas.height);
      
      this.ctx.beginPath();
      this.ctx.arc(x, y, 1, 0, 2 * Math.PI);
      this.ctx.fillStyle = this.randomColor();
      this.ctx.fill();
    }
  }
  
  /**
   * 绘制干扰线
   */
  drawLines() {
    for (let i = 0; i < this.options.lineCount; i++) {
      const x1 = this.randomNum(0, this.canvas.width);
      const y1 = this.randomNum(0, this.canvas.height);
      const x2 = this.randomNum(0, this.canvas.width);
      const y2 = this.randomNum(0, this.canvas.height);
      
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.strokeStyle = this.randomColor();
      this.ctx.lineWidth = 1;
      this.ctx.stroke();
    }
  }
  
  /**
   * 绘制验证码文字
   */
  drawText(code) {
    const charWidth = this.canvas.width / (code.length + 1);
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      
      // 随机字体大小
      const fontSize = this.randomNum(this.options.fontSize - 4, this.options.fontSize + 4);
      this.ctx.font = `${fontSize}px ${this.options.fontFamily}`;
      
      // 随机颜色
      this.ctx.fillStyle = this.randomColor();
      
      // 随机旋转角度
      const angle = this.randomNum(-20, 20);
      
      // 计算位置
      const x = charWidth * (i + 0.5);
      const y = this.canvas.height / 2 + fontSize / 3;
      
      // 保存状态
      this.ctx.save();
      
      // 移动并旋转
      this.ctx.translate(x, y);
      this.ctx.rotate(angle * Math.PI / 180);
      
      // 绘制文字
      this.ctx.fillText(char, 0, 0);
      
      // 恢复状态
      this.ctx.restore();
    }
  }
  
  /**
   * 生成验证码
   */
  generate() {
    // 生成随机验证码
    this.code = '';
    const chars = this.options.chars;
    
    for (let i = 0; i < this.options.length; i++) {
      const index = Math.floor(Math.random() * chars.length);
      this.code += chars[index];
    }
    
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 绘制各元素
    this.drawBackground();
    this.drawNoise();
    this.drawLines();
    this.drawText(this.code);
    
    // 返回验证码字符串
    return this.code;
  }
  
  /**
   * 验证输入
   */
  verify(input) {
    if (!input || !this.code) {
      return false;
    }
    
    // 不区分大小写比较
    return input.toLowerCase().trim() === this.code.toLowerCase();
  }
  
  /**
   * 获取当前验证码（用于调试，生产环境慎用）
   */
  getCode() {
    return this.code;
  }
}
