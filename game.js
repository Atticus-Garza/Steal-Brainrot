class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    
    this.player = new Player(this.width / 2, this.height / 2);
    this.brainrots = [];
    this.enemies = [];
    this.particles = [];
    
    this.score = 0;
    this.health = 100;
    this.collected = 0;
    
    this.keys = {};
    this.lastTime = 0;
    
    this.brainrotSpawnTimer = 0;
    this.enemySpawnTimer = 0;
    
    this.setupEventListeners();
    this.gameLoop();
  }
  
  setupEventListeners() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });
    
    document.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }
  
  spawnBrainrot() {
    const x = Math.random() * this.width;
    const y = Math.random() * this.height;
    const brainrot = new Brainrot(x, y);
    this.brainrots.push(brainrot);
  }
  
  spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(side) {
      case 0: x = -30; y = Math.random() * this.height; break;
      case 1: x = this.width + 30; y = Math.random() * this.height; break;
      case 2: x = Math.random() * this.width; y = -30; break;
      case 3: x = Math.random() * this.width; y = this.height + 30; break;
    }
    
    const enemy = new Enemy(x, y, this.player);
    this.enemies.push(enemy);
  }
  
  update(deltaTime) {
    // Handle input
    if (this.keys['w'] || this.keys['arrowup']) this.player.moveUp();
    if (this.keys['s'] || this.keys['arrowdown']) this.player.moveDown();
    if (this.keys['a'] || this.keys['arrowleft']) this.player.moveLeft();
    if (this.keys['d'] || this.keys['arrowright']) this.player.moveRight();
    
    this.player.update(this.width, this.height);
    
    // Spawn brainrots
    this.brainrotSpawnTimer += deltaTime;
    if (this.brainrotSpawnTimer > 2000) {
      this.spawnBrainrot();
      this.brainrotSpawnTimer = 0;
    }
    
    // Spawn enemies
    this.enemySpawnTimer += deltaTime;
    if (this.enemySpawnTimer > 3000) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;
    }
    
    // Update brainrots
    this.brainrots.forEach(brainrot => {
      brainrot.update(deltaTime);
      
      // Check collision with player
      if (this.checkCollision(this.player, brainrot)) {
        this.collectBrainrot(brainrot);
        this.brainrots = this.brainrots.filter(b => b !== brainrot);
      }
    });
    
    // Update enemies
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime);
      
      // Check collision with player
      if (this.checkCollision(this.player, enemy)) {
        this.takeDamage(enemy.damage);
        this.enemies = this.enemies.filter(e => e !== enemy);
      }
    });
    
    // Remove off-screen enemies
    this.enemies = this.enemies.filter(enemy => 
      enemy.x > -50 && enemy.x < this.width + 50 && 
      enemy.y > -50 && enemy.y < this.height + 50
    );
    
    // Update particles
    this.particles.forEach(particle => particle.update(deltaTime));
    this.particles = this.particles.filter(particle => particle.life > 0);
    
    // Check game over
    if (this.health <= 0) {
      this.gameOver();
    }
  }
  
  checkCollision(obj1, obj2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < obj1.radius + obj2.radius;
  }
  
  collectBrainrot(brainrot) {
    this.score += brainrot.points;
    this.collected++;
    
    // Create collection particles
    for (let i = 0; i < 5; i++) {
      this.particles.push(new Particle(brainrot.x, brainrot.y, brainrot.color));
    }
    
    this.updateUI();
  }
  
  takeDamage(damage) {
    this.health -= damage;
    if (this.health < 0) this.health = 0;
    this.updateUI();
  }
  
  updateUI() {
    document.getElementById('score').textContent = this.score;
    document.getElementById('health').textContent = this.health;
    document.getElementById('collected').textContent = this.collected;
  }
  
  gameOver() {
    alert(`Game Over! Final Score: ${this.score}, Brainrots Collected: ${this.collected}`);
    location.reload();
  }
  
  render() {
    // Clear canvas
    this.ctx.fillStyle = '#0f0f23';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    // Draw grid pattern
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 50) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
    
    // Draw game objects
    this.brainrots.forEach(brainrot => brainrot.render(this.ctx));
    this.enemies.forEach(enemy => enemy.render(this.ctx));
    this.particles.forEach(particle => particle.render(this.ctx));
    this.player.render(this.ctx);
  }
  
  gameLoop(currentTime = 0) {
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.update(deltaTime);
    this.render();
    
    requestAnimationFrame((time) => this.gameLoop(time));
  }
}

class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 15;
    this.speed = 5;
    this.color = '#00ff88';
  }
  
  moveUp() { this.y -= this.speed; }
  moveDown() { this.y += this.speed; }
  moveLeft() { this.x -= this.speed; }
  moveRight() { this.x += this.speed; }
  
  update(canvasWidth, canvasHeight) {
    // Keep player within bounds
    this.x = Math.max(this.radius, Math.min(canvasWidth - this.radius, this.x));
    this.y = Math.max(this.radius, Math.min(canvasHeight - this.radius, this.y));
  }
  
  render(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Player glow effect
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    
    // Player face
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(this.x - 5, this.y - 3, 2, 0, Math.PI * 2);
    ctx.arc(this.x + 5, this.y - 3, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y + 3, 5, 0, Math.PI);
    ctx.stroke();
  }
}

class Brainrot {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 12;
    this.bobOffset = Math.random() * Math.PI * 2;
    this.bobSpeed = 0.003;
    this.originalY = y;
    
    // Determine rarity and properties
    this.rarity = this.determineRarity();
    this.setRarityProperties();
    
    // Mutation chance
    if (Math.random() < 0.1) {
      this.mutate();
    }
  }
  
  determineRarity() {
    const rand = Math.random();
    if (rand < 0.4) return 'common';
    if (rand < 0.65) return 'uncommon';
    if (rand < 0.8) return 'rare';
    if (rand < 0.92) return 'epic';
    if (rand < 0.98) return 'legendary';
    return 'mythic';
  }
  
  setRarityProperties() {
    const rarityData = {
      common: { color: '#9e9e9e', points: 10, glow: false },
      uncommon: { color: '#4caf50', points: 25, glow: false },
      rare: { color: '#2196f3', points: 50, glow: true },
      epic: { color: '#9c27b0', points: 100, glow: true },
      legendary: { color: '#ff9800', points: 200, glow: true },
      mythic: { color: '#f44336', points: 500, glow: true }
    };
    
    const data = rarityData[this.rarity];
    this.color = data.color;
    this.points = data.points;
    this.hasGlow = data.glow;
  }
  
  mutate() {
    this.isMutated = true;
    this.radius *= 1.5;
    this.points *= 2;
    
    // Create rainbow effect for mutations
    this.mutationHue = 0;
  }
  
  update(deltaTime) {
    this.bobOffset += this.bobSpeed * deltaTime;
    this.y = this.originalY + Math.sin(this.bobOffset) * 5;
    
    if (this.isMutated) {
      this.mutationHue += 0.01;
      if (this.mutationHue > 360) this.mutationHue = 0;
    }
  }
  
  render(ctx) {
    let renderColor = this.color;
    
    if (this.isMutated) {
      renderColor = `hsl(${this.mutationHue}, 100%, 50%)`;
    }
    
    if (this.hasGlow || this.isMutated) {
      ctx.shadowColor = renderColor;
      ctx.shadowBlur = 15;
    }
    
    ctx.fillStyle = renderColor;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Brainrot face
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(this.x - 4, this.y - 2, 1.5, 0, Math.PI * 2);
    ctx.arc(this.x + 4, this.y - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Mutation indicator
    if (this.isMutated) {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius + 3, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

class Enemy {
  constructor(x, y, target) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.radius = 10;
    this.speed = 2;
    this.color = '#ff4444';
    this.damage = 10;
    this.angle = 0;
  }
  
  update(deltaTime) {
    // Move towards player
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      this.x += (dx / distance) * this.speed;
      this.y += (dy / distance) * this.speed;
    }
    
    this.angle += 0.1;
  }
  
  render(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Enemy spikes
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    for (let i = 0; i < 6; i++) {
      const spikeAngle = (Math.PI * 2 / 6) * i + this.angle;
      const spikeX = this.x + Math.cos(spikeAngle) * (this.radius + 5);
      const spikeY = this.y + Math.sin(spikeAngle) * (this.radius + 5);
      
      ctx.beginPath();
      ctx.moveTo(this.x + Math.cos(spikeAngle) * this.radius, 
                 this.y + Math.sin(spikeAngle) * this.radius);
      ctx.lineTo(spikeX, spikeY);
      ctx.stroke();
    }
    
    // Enemy eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(this.x - 3, this.y - 2, 2, 0, Math.PI * 2);
    ctx.arc(this.x + 3, this.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(this.x - 3, this.y - 2, 1, 0, Math.PI * 2);
    ctx.arc(this.x + 3, this.y - 2, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.color = color;
    this.life = 1;
    this.decay = 0.02;
    this.radius = Math.random() * 3 + 1;
  }
  
  update(deltaTime) {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    this.radius *= 0.98;
  }
  
  render(ctx) {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

// Start the game
new Game();
