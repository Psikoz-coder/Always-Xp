const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Responsive values
let PLATFORM_HEIGHT;
let monitorY;
let monitorSpeed;
let monitorX;
let bsodWidth;
let bsodHeight;
let monitorWidth;
let monitorHeight;
let errorWidth;
let errorHeight;

// Canvas boyutlarını ayarla
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Responsive değerleri güncelle
    PLATFORM_HEIGHT = canvas.height / 12;
    monitorY = canvas.height / 2;
    monitorSpeed = canvas.height / 60;
    monitorX = canvas.width / 6;
    
    // Resimleri cihaz boyutuna göre ölçeklendir
    const scaleFactor = Math.min(canvas.width / 1920, canvas.height / 1080); // Baz çözünürlük 1920x1080 kabul ediyoruz
    
    bsodWidth = bsodOriginalWidth * bsodScaleFactor * scaleFactor;
    bsodHeight = bsodOriginalHeight * bsodScaleFactor * scaleFactor;
    monitorWidth = monitorOriginalWidth * monitorScaleFactor * scaleFactor;
    monitorHeight = monitorOriginalHeight * monitorScaleFactor * scaleFactor;
    errorWidth = errorOriginalWidth * errorScaleFactor * scaleFactor;
    errorHeight = errorOriginalHeight * errorScaleFactor * scaleFactor;
}

window.addEventListener('resize', () => {
    resizeCanvas();
    
    // Oyun devam ediyorsa, monitörün pozisyonunu düzelt
    if (gameStarted && !gameOver) {
        monitorY = Math.max(PLATFORM_HEIGHT, Math.min(canvas.height - PLATFORM_HEIGHT - monitorHeight, monitorY));
    }
});

const WHITE = '#FFFFFF';
const BLACK = '#000000';
const RED = '#FF0000';

let gameOver = false;
let gameStarted = false;
let score = 0;
let monitorDirection = 'up';

let bsodList = [];
let errorList = [];
let spawnInterval;

// Zorluk seviyeleri
const difficultyLevels = {
    easy: { speed: 1, spawnRate: 2000, obstacleFrequency: 0.5 },
    medium: { speed: 1.5, spawnRate: 1500, obstacleFrequency: 0.7 },
    hard: { speed: 2, spawnRate: 1000, obstacleFrequency: 0.9 }
};
let currentDifficulty = difficultyLevels.easy;

// Resimleri yükle
const bsodImage = document.getElementById('bsodImage');
const monitorImage = document.getElementById('monitorImage');
const errorImages = [
    document.getElementById('errorImage1'),
    document.getElementById('errorImage2'),
    document.getElementById('errorImage3')
];
const backgroundImage = document.getElementById('backgroundImage');

// Ses dosyalarını yükle
const errorSound = document.getElementById('errorSound');
const xpInstallMusic = document.getElementById('xpInstallMusic');

// Resimlerin orijinal boyutlarını al
const bsodOriginalWidth = bsodImage.naturalWidth;
const bsodOriginalHeight = bsodImage.naturalHeight;
const monitorOriginalWidth = monitorImage.naturalWidth;
const monitorOriginalHeight = monitorImage.naturalHeight;

// Error resimlerinin orijinal boyutlarını al
const errorOriginalWidth = errorImages[0].naturalWidth;
const errorOriginalHeight = errorImages[0].naturalHeight;

// Resimleri küçült (en-boy oranını koru)
const bsodScaleFactor = 0.9; // BSOD resmi için ölçek
const monitorScaleFactor = 0.5; // Monitör resmi için ölçek
const errorScaleFactor = 0.3; // Error resimleri için ölçek (daha küçük)

// HTML Elementleri
const startMenu = document.getElementById('startMenu');
const gameOverMenu = document.getElementById('gameOverMenu');
const finalScore = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const difficultyButton = document.getElementById('difficultyButton');
const mainMenuButton = document.getElementById('mainMenuButton');
const easyButton = document.getElementById('easyButton');
const mediumButton = document.getElementById('mediumButton');
const hardButton = document.getElementById('hardButton');

// Arka plan kaydırma için değişken
let backgroundOffset = 0;

// İlk çağrı
resizeCanvas();

function createBsod() {
    const yPos = Math.random() < 0.5 ? PLATFORM_HEIGHT : canvas.height - PLATFORM_HEIGHT - bsodHeight;
    bsodList.push({ x: canvas.width, y: yPos, scored: false });
}

function createError() {
    const yPos = Math.random() < 0.5 ? PLATFORM_HEIGHT : canvas.height - PLATFORM_HEIGHT - errorHeight;
    const randomErrorImage = errorImages[Math.floor(Math.random() * errorImages.length)];
    errorList.push({ x: canvas.width, y: yPos, image: randomErrorImage, scored: false });
}

function restartGame() {
    gameOver = false;
    gameStarted = true;
    score = 0;
    monitorY = canvas.height / 2;
    bsodList = [];
    errorList = [];
    backgroundOffset = 0;

    // Menüleri gizle
    startMenu.style.display = 'none';
    gameOverMenu.style.display = 'none';

    // Müziği başlat
    xpInstallMusic.currentTime = 0; // Müziği başa sar
    xpInstallMusic.play(); // Müziği çal

    // Engelleri oluşturma aralığını başlat
    clearInterval(spawnInterval);
    spawnInterval = setInterval(() => {
        // Zorluk seviyesine göre engel oluşturma olasılığını belirle
        if (Math.random() < currentDifficulty.obstacleFrequency) {
            // Ekran boyutuna göre rastgele engel oluştur
            if (Math.random() < 0.5) {
                createBsod();
            } else {
                createError();
            }
            
            // Yüksek zorluk seviyelerinde ek engeller oluştur
            if (currentDifficulty === difficultyLevels.medium && Math.random() < 0.3) {
                setTimeout(() => {
                    if (Math.random() < 0.5) {
                        createBsod();
                    } else {
                        createError();
                    }
                }, currentDifficulty.spawnRate / 3);
            } else if (currentDifficulty === difficultyLevels.hard && Math.random() < 0.5) {
                setTimeout(() => {
                    if (Math.random() < 0.5) {
                        createBsod();
                    } else {
                        createError();
                    }
                }, currentDifficulty.spawnRate / 4);
            }
        }
    }, currentDifficulty.spawnRate);
}

function playErrorSound() {
    errorSound.currentTime = 0; // Sesi başa sar
    errorSound.play(); // Sesi çal
}

function drawBackground() {
    // Arka plan resmini canvas boyutuna sığacak şekilde çiz
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

function gameLoop() {
    // Arka planı çiz
    drawBackground();

    if (!gameStarted) {
        return;
    }

    if (gameOver) {
        finalScore.textContent = score;
        gameOverMenu.style.display = 'block';
        xpInstallMusic.pause(); // Müziği durdur
        return;
    }

    // Üst ve alt platformları çiz (daha ince)
    ctx.fillStyle = BLACK;
    ctx.fillRect(0, 0, canvas.width, PLATFORM_HEIGHT);
    ctx.fillRect(0, canvas.height - PLATFORM_HEIGHT, canvas.width, PLATFORM_HEIGHT);

    // Monitörü hareket ettir
    if (monitorDirection === 'up') {
        monitorY -= monitorSpeed * currentDifficulty.speed;
    } else {
        monitorY += monitorSpeed * currentDifficulty.speed;
    }

    // Platform sınırlarını kontrol et
    if (monitorY <= PLATFORM_HEIGHT) {
        monitorY = PLATFORM_HEIGHT;
    } else if (monitorY + monitorHeight >= canvas.height - PLATFORM_HEIGHT) {
        monitorY = canvas.height - PLATFORM_HEIGHT - monitorHeight;
    }

    // BSOD engellerini güncelle
    bsodList.forEach(bsod => {
        bsod.x -= monitorSpeed * currentDifficulty.speed;

        // Skor kontrolü
        if (monitorX > bsod.x + bsodWidth && !bsod.scored) {
            score++;
            bsod.scored = true;
        }

        // Çarpışma kontrolü (daha hassas)
        if (monitorX + monitorWidth * 0.8 > bsod.x + bsodWidth * 0.2 && 
            monitorX + monitorWidth * 0.2 < bsod.x + bsodWidth * 0.8 &&
            monitorY + monitorHeight * 0.8 > bsod.y + bsodHeight * 0.2 && 
            monitorY + monitorHeight * 0.2 < bsod.y + bsodHeight * 0.8) {
            gameOver = true;
            playErrorSound(); // Çarpışma sesini çal
        }
    });

    // Error engellerini güncelle
    errorList.forEach(error => {
        error.x -= monitorSpeed * currentDifficulty.speed;

        // Skor kontrolü
        if (monitorX > error.x + errorWidth && !error.scored) {
            score++;
            error.scored = true;
        }

        // Çarpışma kontrolü (daha hassas)
        if (monitorX + monitorWidth * 0.8 > error.x + errorWidth * 0.2 && 
            monitorX + monitorWidth * 0.2 < error.x + errorWidth * 0.8 &&
            monitorY + monitorHeight * 0.8 > error.y + errorHeight * 0.2 && 
            monitorY + monitorHeight * 0.2 < error.y + errorHeight * 0.8) {
            gameOver = true;
            playErrorSound(); // Çarpışma sesini çal
        }
    });

    // Ekrandan çıkan engelleri sil
    bsodList = bsodList.filter(bsod => bsod.x > -bsodWidth);
    errorList = errorList.filter(error => error.x > -errorWidth);

    // BSOD engellerini çiz
    bsodList.forEach(bsod => {
        ctx.drawImage(bsodImage, bsod.x, bsod.y, bsodWidth, bsodHeight);
    });

    // Error engellerini çiz
    errorList.forEach(error => {
        ctx.drawImage(error.image, error.x, error.y, errorWidth, errorHeight);
    });

    // Monitörü çiz
    ctx.drawImage(monitorImage, monitorX, monitorY, monitorWidth, monitorHeight);

    // Skoru göster
    ctx.fillStyle = BLACK;
    const fontSize = Math.max(16, Math.floor(canvas.width / 50));
    ctx.font = `${fontSize}px Arial`;
    ctx.fillText(`Skor: ${score}`, canvas.width - (fontSize * 7), fontSize * 1.2);

    requestAnimationFrame(gameLoop);
}

// Buton olayları
easyButton.addEventListener('click', () => {
    currentDifficulty = difficultyLevels.easy;
    restartGame();
    gameLoop(); // Oyun döngüsünü başlat
});

mediumButton.addEventListener('click', () => {
    currentDifficulty = difficultyLevels.medium;
    restartGame();
    gameLoop(); // Oyun döngüsünü başlat
});

hardButton.addEventListener('click', () => {
    currentDifficulty = difficultyLevels.hard;
    restartGame();
    gameLoop(); // Oyun döngüsünü başlat
});

restartButton.addEventListener('click', () => {
    restartGame();
    gameLoop(); // Oyun döngüsünü başlat
});

difficultyButton.addEventListener('click', () => {
    gameOverMenu.style.display = 'none';
    startMenu.style.display = 'block';
    xpInstallMusic.pause(); // Müziği durdur
});

mainMenuButton.addEventListener('click', () => {
    window.location.href = '/index.html'; 
});

// Mouse tıklama olayı
document.addEventListener('click', () => {
    if (gameStarted && !gameOver) {
        monitorDirection = monitorDirection === 'up' ? 'down' : 'up';
    }
});

// Klavye ok tuşları olayı
document.addEventListener('keydown', (e) => {
    if (gameStarted && !gameOver) {
        if (e.key === 'ArrowUp') {
            monitorDirection = 'up';
        } else if (e.key === 'ArrowDown') {
            monitorDirection = 'down';
        }
    }
});

// Dokunmatik ekran için
document.addEventListener('touchstart', (e) => {
    if (gameStarted && !gameOver) {
        e.preventDefault(); // Sayfanın kaymasını engelle
        monitorDirection = monitorDirection === 'up' ? 'down' : 'up';
    }
});

// Oyun döngüsünü başlat
requestAnimationFrame(gameLoop);