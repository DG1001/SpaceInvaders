const canvas = document.createElement('canvas');
canvas.width = 800;
canvas.height = 600;
document.querySelector('#app')!.innerHTML = '';
document.querySelector('#app')!.appendChild(canvas);
const ctx = canvas.getContext('2d')!;

// Game state
const state = {
  player: {
    x: canvas.width / 2 - 25,
    y: canvas.height - 60,
    width: 50,
    height: 30,
    speed: 5,
    color: '#0f0',
    lives: 3
  },
  bullets: [] as {x: number, y: number, width: number, height: number, speed: number}[],
  enemyBullets: [] as {x: number, y: number, width: number, height: number, speed: number}[],
  enemies: [] as {x: number, y: number, width: number, height: number, speed: number}[],
  explosions: [] as {x: number, y: number, radius: number, maxRadius: number, alpha: number}[],
  enemyDirection: 1,
  enemySpeed: 1,
  lastEnemySpawn: 0,
  lastEnemyShot: 0,
  score: 0,
  gameOver: false
};

// Initialize enemies
for (let row = 0; row < 4; row++) {
  for (let col = 0; col < 8; col++) {
    state.enemies.push({
      x: 100 + col * 70,
      y: 50 + row * 50,
      width: 40,
      height: 30,
      speed: 1
    });
  }
}

// Input handling
const keys: Record<string, boolean> = {};
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

function createExplosion(x: number, y: number) {
  state.explosions.push({
    x,
    y,
    radius: 5,
    maxRadius: 30,
    alpha: 1
  });
}

function update() {
  if (state.gameOver) return;

  // Update explosions
  state.explosions = state.explosions.filter(explosion => {
    explosion.radius += 1;
    explosion.alpha -= 0.02;
    return explosion.radius < explosion.maxRadius && explosion.alpha > 0;
  });

  // Player movement
  if (keys['ArrowLeft'] && state.player.x > 0) {
    state.player.x -= state.player.speed;
  }
  if (keys['ArrowRight'] && state.player.x < canvas.width - state.player.width) {
    state.player.x += state.player.speed;
  }
  if (keys[' '] && state.bullets.length < 3) {
    state.bullets.push({
      x: state.player.x + state.player.width / 2 - 2,
      y: state.player.y,
      width: 4,
      height: 10,
      speed: 7
    });
  }

  // Bullet movement
  state.bullets = state.bullets.filter(bullet => {
    bullet.y -= bullet.speed;
    return bullet.y > 0;
  });

  // Enemy bullets movement
  state.enemyBullets = state.enemyBullets.filter(bullet => {
    bullet.y += bullet.speed;
    return bullet.y < canvas.height;
  });

  // Enemy firing logic
  const now = Date.now();
  if (now - state.lastEnemyShot > 1000 && state.enemies.length > 0) {
    const randomEnemy = state.enemies[Math.floor(Math.random() * state.enemies.length)];
    state.enemyBullets.push({
      x: randomEnemy.x + randomEnemy.width / 2 - 2,
      y: randomEnemy.y + randomEnemy.height,
      width: 4,
      height: 10,
      speed: 3
    });
    state.lastEnemyShot = now;
  }

  // Enemy movement
  let edgeReached = false;
  state.enemies.forEach(enemy => {
    enemy.x += state.enemySpeed * state.enemyDirection;
    if (enemy.x <= 0 || enemy.x >= canvas.width - enemy.width) {
      edgeReached = true;
    }
  });

  if (edgeReached) {
    state.enemyDirection *= -1;
    state.enemies.forEach(enemy => {
      enemy.y += 20;
      if (enemy.y >= canvas.height - 50) {
        state.gameOver = true;
      }
    });
  }

  // Collision detection - player bullets
  state.bullets.forEach((bullet, bulletIndex) => {
    state.enemies.forEach((enemy, enemyIndex) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
        state.bullets.splice(bulletIndex, 1);
        state.enemies.splice(enemyIndex, 1);
        state.score += 10;
        return;
      }
    });
  });

  // Collision detection - enemy bullets
  state.enemyBullets.forEach((bullet, bulletIndex) => {
    if (
      bullet.x < state.player.x + state.player.width &&
      bullet.x + bullet.width > state.player.x &&
      bullet.y < state.player.y + state.player.height &&
      bullet.y + bullet.height > state.player.y
    ) {
      createExplosion(bullet.x, bullet.y);
      state.enemyBullets.splice(bulletIndex, 1);
      state.player.lives--;
      if (state.player.lives <= 0) {
        state.gameOver = true;
      }
      return;
    }
  });

  if (state.enemies.length === 0) {
    // Level complete
    state.enemySpeed += 0.5;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) {
        state.enemies.push({
          x: 100 + col * 70,
          y: 50 + row * 50,
          width: 40,
          height: 30,
          speed: state.enemySpeed
        });
      }
    }
  }
}

function draw() {
  // Clear canvas
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw explosions
  state.explosions.forEach(explosion => {
    ctx.beginPath();
    ctx.arc(explosion.x, explosion.y, explosion.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 165, 0, ${explosion.alpha})`;
    ctx.fill();
  });

  // Draw player
  ctx.fillStyle = state.player.color;
  ctx.fillRect(state.player.x, state.player.y, state.player.width, state.player.height);

  // Draw bullets
  ctx.fillStyle = '#ff0';
  state.bullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Draw enemy bullets
  ctx.fillStyle = '#f00';
  state.enemyBullets.forEach(bullet => {
    ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
  });

  // Draw enemies
  ctx.fillStyle = '#f00';
  state.enemies.forEach(enemy => {
    ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
  });

  // Draw score and lives
  ctx.fillStyle = '#fff';
  ctx.font = '24px Arial';
  ctx.fillText(`Score: ${state.score}`, 10, 30);
  ctx.fillText(`Lives: ${state.player.lives}`, 10, 60);

  // Draw game over
  if (state.gameOver) {
    ctx.fillStyle = '#fff';
    ctx.font = '48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
    ctx.textAlign = 'left';
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
