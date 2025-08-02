const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 30;
const MAP_COLS = canvas.width / TILE_SIZE;
const MAP_ROWS = canvas.height / TILE_SIZE;

let gameOver = false;
let gameLoopId; // To store the requestAnimationFrame ID
let enemiesEliminatedCount = 0; // New: Counter for eliminated enemies

// Sound Effects
const playerShotSound = new Audio('./sounds/player_shot.mp3');
const enemyHitSound = new Audio('./sounds/enemy_hit.mp3');
const playerHitSound = new Audio('./sounds/player_hit.mp3');

// Attempt to load sounds (important for some browsers)
playerShotSound.load();
enemyHitSound.load();
playerHitSound.load();

let audioContextUnlocked = false;

// Player Tank
const player = {
    x: canvas.width / 2 - TILE_SIZE / 2,
    y: canvas.height - TILE_SIZE * 2,
    size: TILE_SIZE,
    speed: 5,
    dx: 0,
    dy: 0,
    color: 'green',
    direction: 'up', // 'up', 'down', 'left', 'right'
    bullets: [],
    lastBulletTime: 0,
    fireRate: 200, // milliseconds between shots
    isAlive: true
};

// Initial Game Map (used for resetting)
const initialGameMap = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];
let gameMap = JSON.parse(JSON.stringify(initialGameMap)); // Deep copy

const enemies = [];
const enemyBullets = [];

let lastEnemySpawnTime = 0;
const enemySpawnRate = 3000; // Spawn a new enemy every 3 seconds

const scoreDisplay = document.getElementById('scoreDisplay');

function updateScoreDisplay() {
    scoreDisplay.textContent = `Enemigos eliminados: ${enemiesEliminatedCount}`;
}

function drawPlayer() {
    if (!player.isAlive) return;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.size, player.size);

    // Draw direction indicator
    ctx.fillStyle = 'black'; // Indicator color
    const indicatorSize = player.size / 3;
    switch (player.direction) {
        case 'up':
            ctx.fillRect(player.x + player.size / 2 - indicatorSize / 2, player.y, indicatorSize, indicatorSize);
            break;
        case 'down':
            ctx.fillRect(player.x + player.size / 2 - indicatorSize / 2, player.y + player.size - indicatorSize, indicatorSize, indicatorSize);
            break;
        case 'left':
            ctx.fillRect(player.x, player.y + player.size / 2 - indicatorSize / 2, indicatorSize, indicatorSize);
            break;
        case 'right':
            ctx.fillRect(player.x + player.size - indicatorSize, player.y + player.size / 2 - indicatorSize / 2, indicatorSize, indicatorSize);
            break;
    }
}

function drawBullets() {
    player.bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size);
    });
    enemyBullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.size, bullet.size);
    });
}

function drawEnemies() {
    enemies.forEach(enemy => {
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);

        // Draw direction indicator for enemy
        ctx.fillStyle = 'black'; // Indicator color
        const indicatorSize = enemy.size / 3;
        switch (enemy.direction) {
            case 'up':
                ctx.fillRect(enemy.x + enemy.size / 2 - indicatorSize / 2, enemy.y, indicatorSize, indicatorSize);
                break;
            case 'down':
                ctx.fillRect(enemy.x + enemy.size / 2 - indicatorSize / 2, enemy.y + enemy.size - indicatorSize, indicatorSize, indicatorSize);
                break;
            case 'left':
                ctx.fillRect(enemy.x, enemy.y + enemy.size / 2 - indicatorSize / 2, indicatorSize, indicatorSize);
                break;
            case 'right':
                ctx.fillRect(enemy.x + enemy.size - indicatorSize, enemy.y + enemy.size / 2 - indicatorSize / 2, indicatorSize, indicatorSize);
                break;
        }
    });
}

function drawMap() {
    for (let row = 0; row < MAP_ROWS; row++) {
        for (let col = 0; col < MAP_COLS; col++) {
            const tile = gameMap[row][col];
            if (tile === 1) {
                ctx.fillStyle = 'gray'; // Brick wall
                ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }
    }
}

function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.size &&
           rect1.x + rect1.size > rect2.x &&
           rect1.y < rect2.y + rect2.size &&
           rect1.y + rect1.size > rect2.y;
}

function checkPlayerWallCollision() {
    const nextPlayerX = player.x + player.dx;
    const nextPlayerY = player.y + player.dy;

    // Get the tiles the player is currently occupying or will occupy
    const playerLeft = Math.floor(nextPlayerX / TILE_SIZE);
    const playerRight = Math.floor((nextPlayerX + player.size - 1) / TILE_SIZE);
    const playerTop = Math.floor(nextPlayerY / TILE_SIZE);
    const playerBottom = Math.floor((nextPlayerY + player.size - 1) / TILE_SIZE);

    for (let row = playerTop; row <= playerBottom; row++) {
        for (let col = playerLeft; col <= playerRight; col++) {
            if (row >= 0 && row < MAP_ROWS && col >= 0 && col < MAP_COLS) {
                if (gameMap[row][col] === 1) { // If it's a brick wall
                    // Collision detected, prevent movement in that direction
                    if (player.dx > 0) player.x = col * TILE_SIZE - player.size;
                    if (player.dx < 0) player.x = (col + 1) * TILE_SIZE;
                    if (player.dy > 0) player.y = row * TILE_SIZE - player.size;
                    if (player.dy < 0) player.y = (row + 1) * TILE_SIZE;
                    player.dx = 0;
                    player.dy = 0;
                    return true; // Collision occurred
                }
            }
        }
    }
    return false; // No collision
}

function shoot() {
    const currentTime = Date.now();
    if (currentTime - player.lastBulletTime < player.fireRate) {
        return; // Too soon to fire again
    }

    player.lastBulletTime = currentTime;

    let bulletX = player.x + player.size / 2 - 2; // Center the bullet
    let bulletY = player.y + player.size / 2 - 2;
    let bulletDx = 0;
    let bulletDy = 0;
    const bulletSize = 4;
    const bulletSpeed = 10;

    switch (player.direction) {
        case 'up':
            bulletY = player.y - bulletSize;
            bulletDy = -bulletSpeed;
            break;
        case 'down':
            bulletY = player.y + player.size;
            bulletDy = bulletSpeed;
            break;
        case 'left':
            bulletX = player.x - bulletSize;
            bulletDx = -bulletSpeed;
            break;
        case 'right':
            bulletX = player.x + player.size;
            bulletDx = bulletSpeed;
            break;
    }

    player.bullets.push({
        x: bulletX,
        y: bulletY,
        size: bulletSize,
        dx: bulletDx,
        dy: bulletDy,
        color: 'yellow'
    });
    playerShotSound.currentTime = 0; // Rewind to start
    playerShotSound.play(); // Play sound
}

function spawnEnemy() {
    const spawnX = Math.floor(Math.random() * (MAP_COLS - 2) + 1) * TILE_SIZE; // Avoid spawning on edges
    const spawnY = TILE_SIZE; // Spawn at the top

    enemies.push({
        x: spawnX,
        y: spawnY,
        size: TILE_SIZE,
        color: 'red',
        dx: 0,
        dy: 1, // Start moving down
        speed: 1, // Slower enemy speed
        direction: 'down',
        bullets: [],
        lastBulletTime: 0,
        fireRate: 2000 + Math.random() * 1000, // Slower random fire rate for enemies
        lastDirectionChangeTime: 0,
        directionChangeRate: 1000 + Math.random() * 2000 // Change direction every 1-3 seconds
    });
}

function enemyShoot(enemy) {
    const currentTime = Date.now();
    if (currentTime - enemy.lastBulletTime < enemy.fireRate) {
        return; // Too soon to fire again
    }

    enemy.lastBulletTime = currentTime;

    let bulletX = enemy.x + enemy.size / 2 - 2;
    let bulletY = enemy.y + enemy.size / 2 - 2;
    let bulletDx = 0;
    let bulletDy = 0;
    const bulletSize = 4;
    const bulletSpeed = 4; // Slower enemy bullet speed

    // Determine direction (vertical or horizontal) based on which axis is closer to player
    const dxToPlayer = player.x - enemy.x;
    const dyToPlayer = player.y - enemy.y;

    if (Math.abs(dxToPlayer) > Math.abs(dyToPlayer)) {
        // Shoot horizontally
        bulletDx = dxToPlayer > 0 ? bulletSpeed : -bulletSpeed;
        enemy.direction = bulletDx > 0 ? 'right' : 'left';
    } else {
        // Shoot vertically
        bulletDy = dyToPlayer > 0 ? bulletSpeed : -bulletSpeed;
        enemy.direction = dyToPlayer > 0 ? 'down' : 'up';
    }

    enemyBullets.push({
        x: bulletX,
        y: bulletY,
        size: bulletSize,
        dx: bulletDx,
        dy: bulletDy,
        color: 'orange'
    });
}

function resetGame() {
    gameOver = false;
    player.x = canvas.width / 2 - TILE_SIZE / 2;
    player.y = canvas.height - TILE_SIZE * 2;
    player.dx = 0;
    player.dy = 0;
    player.direction = 'up';
    player.bullets = [];
    player.isAlive = true;
    enemies.length = 0; // Clear enemies
    enemyBullets.length = 0; // Clear enemy bullets
    lastEnemySpawnTime = 0;
    enemiesEliminatedCount = 0; // Reset enemy count
    updateScoreDisplay(); // Update display on reset
    gameMap = JSON.parse(JSON.stringify(initialGameMap)); // Reset map
    document.getElementById('restartButton').style.display = 'none';
    gameLoopId = requestAnimationFrame(update);
}

function update() {
    if (gameOver) {
        ctx.fillStyle = 'white';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        document.getElementById('restartButton').style.display = 'block';
        return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update player position
    player.x += player.dx;
    player.y += player.dy;

    // Keep player within bounds
    if (player.x < 0) player.x = 0;
    if (player.x + player.size > canvas.width) player.x = canvas.width - player.size;
    if (player.y < 0) player.y = 0;
    if (player.y + player.size > canvas.height) player.y = canvas.height - player.size;

    // Check player-wall collision
    checkPlayerWallCollision();

    // Update player bullets
    for (let i = player.bullets.length - 1; i >= 0; i--) {
        const bullet = player.bullets[i];
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        // Remove bullet if out of bounds
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            player.bullets.splice(i, 1);
            continue;
        }

        // Bullet-wall collision
        const bulletTileX = Math.floor(bullet.x / TILE_SIZE);
        const bulletTileY = Math.floor(bullet.y / TILE_SIZE);
        if (bulletTileY >= 0 && bulletTileY < MAP_ROWS && bulletTileX >= 0 && bulletTileX < MAP_COLS) {
            if (gameMap[bulletTileY][bulletTileX] === 1) {
                player.bullets.splice(i, 1); // Remove bullet
                gameMap[bulletTileY][bulletTileX] = 0; // Destroy the wall
                continue;
            }
        }

        // Bullet-enemy collision
        for (let j = enemies.length - 1; j >= 0; j--) {
            const enemy = enemies[j];
            if (checkCollision(bullet, enemy)) {
                player.bullets.splice(i, 1); // Remove bullet
                enemies.splice(j, 1); // Remove enemy
                enemiesEliminatedCount++; // Increment enemy count
                updateScoreDisplay(); // Update display
                enemyHitSound.currentTime = 0; // Rewind to start
                enemyHitSound.play(); // Play sound
                break; // Bullet hit one enemy, no need to check others
            }
        }
    }

    // Spawn enemies
    const currentTime = Date.now();
    if (currentTime - lastEnemySpawnTime > enemySpawnRate) {
        spawnEnemy();
        lastEnemySpawnTime = currentTime;
    }

    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.x += enemy.dx;
        enemy.y += enemy.dy;

        // Enemy movement and direction change
        if (currentTime - enemy.lastDirectionChangeTime > enemy.directionChangeRate) {
            enemy.lastDirectionChangeTime = currentTime;
            // Randomly choose a new direction (horizontal or vertical)
            if (Math.random() < 0.5) { // Move horizontally
                enemy.dx = (Math.random() < 0.5 ? 1 : -1) * enemy.speed;
                enemy.dy = 0;
            } else { // Move vertically
                enemy.dy = (Math.random() < 0.5 ? 1 : -1) * enemy.speed;
                enemy.dx = 0;
            }
        }

        // Keep enemy within bounds and handle wall collisions
        const nextEnemyX = enemy.x + enemy.dx;
        const nextEnemyY = enemy.y + enemy.dy;

        const enemyLeft = Math.floor(nextEnemyX / TILE_SIZE);
        const enemyRight = Math.floor((nextEnemyX + enemy.size - 1) / TILE_SIZE);
        const enemyTop = Math.floor(nextEnemyY / TILE_SIZE);
        const enemyBottom = Math.floor((nextEnemyY + enemy.size - 1) / TILE_SIZE);

        let collisionWithWall = false;
        for (let row = enemyTop; row <= enemyBottom; row++) {
            for (let col = enemyLeft; col <= enemyRight; col++) {
                if (row >= 0 && row < MAP_ROWS && col >= 0 && col < MAP_COLS) {
                    if (gameMap[row][col] === 1) {
                        collisionWithWall = true;
                        // Reverse direction if collision occurs
                        if (enemy.dx !== 0) enemy.dx *= -1;
                        if (enemy.dy !== 0) enemy.dy *= -1;
                        break;
                    }
                }
            }
            if (collisionWithWall) break;
        }

        // If no wall collision, update position
        if (!collisionWithWall) {
            enemy.x = nextEnemyX;
            enemy.y = nextEnemyY;
        }

        // Boundary collision (if not handled by wall collision)
        if (enemy.x < 0) { enemy.x = 0; enemy.dx *= -1; }
        if (enemy.x + enemy.size > canvas.width) { enemy.x = canvas.width - enemy.size; enemy.dx *= -1; }
        if (enemy.y < 0) { enemy.y = 0; enemy.dy *= -1; }
        if (enemy.y + enemy.size > canvas.height) { enemy.y = canvas.height - enemy.size; enemy.dy *= -1; }

        // Enemy shooting
        enemyShoot(enemy);
    }

    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const bullet = enemyBullets[i];
        bullet.x += bullet.dx;
        bullet.y += bullet.dy;

        // Remove bullet if out of bounds
        if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
            enemyBullets.splice(i, 1);
            continue;
        }

        // Bullet-wall collision
        const bulletTileX = Math.floor(bullet.x / TILE_SIZE);
        const bulletTileY = Math.floor(bullet.y / TILE_SIZE);
        if (bulletTileY >= 0 && bulletTileY < MAP_ROWS && bulletTileX >= 0 && bulletTileX < MAP_COLS) {
            if (gameMap[bulletTileY][bulletTileX] === 1) {
                enemyBullets.splice(i, 1); // Remove bullet
                gameMap[bulletTileY][bulletTileX] = 0; // Destroy the wall
                continue;
            }
        }

        // Bullet-player collision
        if (player.isAlive && checkCollision(bullet, player)) {
            gameOver = true;
            player.isAlive = false;
            enemyBullets.splice(i, 1); // Remove bullet
            playerHitSound.currentTime = 0; // Rewind to start
            playerHitSound.play(); // Play sound
            cancelAnimationFrame(gameLoopId); // Stop the game loop
            break; // Player hit, no need to check other bullets
        }
    }

    // Draw everything
    drawMap();
    drawPlayer();
    drawBullets();
    drawEnemies();

    gameLoopId = requestAnimationFrame(update);
}

function keyDown(e) {
    if (!audioContextUnlocked) {
        // Play a silent sound or any sound on first user interaction to unlock audio context
        const silentSound = new Audio(); // Create a new Audio object
        silentSound.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA='; // A very short, silent WAV
        silentSound.play().then(() => {
            audioContextUnlocked = true;
            console.log("Audio context unlocked!");
        }).catch(error => {
            console.error("Failed to unlock audio context:", error);
        });
    }

    if (gameOver) {
        if (e.key === ' ') { // Spacebar to restart
            resetGame();
        }
        return;
    }

    if (e.key === 'ArrowRight' || e.key === 'd') {
        player.dx = player.speed;
        player.dy = 0;
        player.direction = 'right';
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        player.dx = -player.speed;
        player.dy = 0;
        player.direction = 'left';
    } else if (e.key === 'ArrowUp' || e.key === 'w') {
        player.dy = -player.speed;
        player.dx = 0;
        player.direction = 'up';
    } else if (e.key === 'ArrowDown' || e.key === 's') {
        player.dy = player.speed;
        player.dx = 0;
        player.direction = 'down';
    } else if (e.key === ' ') { // Spacebar to shoot
        shoot();
    }
}

function keyUp(e) {
    if (gameOver) return;

    if (
        e.key === 'ArrowRight' ||
        e.key === 'd' ||
        e.key === 'ArrowLeft' ||
        e.key === 'a' ||
        e.key === 'ArrowUp' ||
        e.key === 'w' ||
        e.key === 'ArrowDown' ||
        e.key === 's'
    ) {
        player.dx = 0;
        player.dy = 0;
    }
}

function keyUp(e) {
    if (gameOver) return;

    if (
        e.key === 'ArrowRight' ||
        e.key === 'd' ||
        e.key === 'ArrowLeft' ||
        e.key === 'a' ||
        e.key === 'ArrowUp' ||
        e.key === 'w' ||
        e.key === 'ArrowDown' ||
        e.key === 's'
    ) {
        player.dx = 0;
        player.dy = 0;
    }
}

// Helper function to simulate keyboard events for touch controls
function simulateKeyEvent(key, type) {
    const event = new KeyboardEvent(type, { key: key });
    if (type === 'keydown') {
        keyDown(event);
    } else if (type === 'keyup') {
        keyUp(event);
    }
}

// Get references to the new control buttons
const upButton = document.getElementById('upButton');
const downButton = document.getElementById('downButton');
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');
const fireButton = document.getElementById('fireButton');

// Add event listeners for touch and mouse for directional buttons
upButton.addEventListener('touchstart', () => simulateKeyEvent('ArrowUp', 'keydown'));
upButton.addEventListener('touchend', () => simulateKeyEvent('ArrowUp', 'keyup'));
upButton.addEventListener('mousedown', () => simulateKeyEvent('ArrowUp', 'keydown'));
upButton.addEventListener('mouseup', () => simulateKeyEvent('ArrowUp', 'keyup'));

downButton.addEventListener('touchstart', () => simulateKeyEvent('ArrowDown', 'keydown'));
downButton.addEventListener('touchend', () => simulateKeyEvent('ArrowDown', 'keyup'));
downButton.addEventListener('mousedown', () => simulateKeyEvent('ArrowDown', 'keydown'));
downButton.addEventListener('mouseup', () => simulateKeyEvent('ArrowDown', 'keyup'));

leftButton.addEventListener('touchstart', () => simulateKeyEvent('ArrowLeft', 'keydown'));
leftButton.addEventListener('touchend', () => simulateKeyEvent('ArrowLeft', 'keyup'));
leftButton.addEventListener('mousedown', () => simulateKeyEvent('ArrowLeft', 'keydown'));
leftButton.addEventListener('mouseup', () => simulateKeyEvent('ArrowLeft', 'keyup'));

rightButton.addEventListener('touchstart', () => simulateKeyEvent('ArrowRight', 'keydown'));
rightButton.addEventListener('touchend', () => simulateKeyEvent('ArrowRight', 'keyup'));
rightButton.addEventListener('mousedown', () => simulateKeyEvent('ArrowRight', 'keydown'));
rightButton.addEventListener('mouseup', () => simulateKeyEvent('ArrowRight', 'keyup'));

// Add event listeners for touch and mouse for fire button
fireButton.addEventListener('touchstart', () => simulateKeyEvent(' ', 'keydown'));
fireButton.addEventListener('touchend', () => simulateKeyEvent(' ', 'keyup'));
fireButton.addEventListener('mousedown', () => simulateKeyEvent(' ', 'keydown'));
fireButton.addEventListener('mouseup', () => simulateKeyEvent(' ', 'keyup'));

// Event Listeners
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

// Add event listener for the restart button
document.getElementById('restartButton').addEventListener('click', resetGame);

// Start the game loop
resetGame(); // Call resetGame to initialize and start the game