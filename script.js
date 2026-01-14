const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let gameState = 'MENU';
let currentTab = 'bird';
let score = 0;
let highScore = parseInt(localStorage.getItem('oraHighScore')) || 0;

let selections = {
    bird: localStorage.getItem('sBird') || 1,
    pipe: localStorage.getItem('sPipe') || 1,
    bg: localStorage.getItem('sBg') || 1
};

// Assets
const assets = { bird: [], pipe: [], bg: [] };
function loadAssets() {
    for(let i=1; i<=10; i++) {
        assets.bird[i] = new Image(); assets.bird[i].src = `skinbird${i}.webp`;
        assets.pipe[i] = new Image(); assets.pipe[i].src = `skinpipa${i}.webp`;
        assets.bg[i] = new Image(); assets.bg[i].src = `skinlatar${i}.webp`;
    }
}

let bird, pipes, animationId;
const gravity = 0.25;
const jump = -6;

function initGame() {
    // Sesuaikan ukuran canvas dengan container (wrapper)
    const rect = canvas.parentNode.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    bird = { x: canvas.width * 0.2, y: canvas.height / 2, velocity: 0, size: 55 };
    pipes = [];
    score = 0;
    updateHUD();
}

function updateHUD() {
    document.getElementById('current-score').innerText = score;
    document.getElementById('high-score').innerText = highScore;
}

function switchTab(type, e) {
    currentTab = type;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    renderSkinGrid();
}

function renderSkinGrid() {
    const grid = document.getElementById('skin-grid');
    grid.innerHTML = '';
    const prefix = currentTab === 'bird' ? 'bird' : currentTab === 'pipe' ? 'pipa' : 'latar';
    for(let i=1; i<=10; i++) {
        const activeClass = selections[currentTab] == i ? 'active' : '';
        grid.innerHTML += `
            <div class="skin-item ${activeClass}" onclick="selectSkin('${currentTab}', ${i})">
                <img src="skin${prefix}${i}.webp" onerror="this.style.opacity='0';">
                <span style="font-size:0.6rem; color:#ccc;">Skin ${i}</span>
            </div>`;
    }
}

function selectSkin(type, index) {
    selections[type] = index;
    localStorage.setItem(`s${type.charAt(0).toUpperCase() + type.slice(1)}`, index);
    renderSkinGrid();
}

function showSkins() {
    document.getElementById('home-menu').style.display = 'none';
    document.getElementById('skin-menu').style.display = 'flex';
    renderSkinGrid();
}

function hideSkins() {
    document.getElementById('skin-menu').style.display = 'none';
    document.getElementById('home-menu').style.display = 'flex';
}

function createPipe() {
    const gap = 220;
    const pipeW = 100;
    const minH = 80;
    const h = Math.floor(Math.random() * (canvas.height - gap - 160)) + minH;
    pipes.push({ x: canvas.width, y: h, gap: gap, width: pipeW, passed: false });
}

function update() {
    if (gameState !== 'PLAYING') return;
    bird.velocity += gravity;
    bird.y += bird.velocity;

    if (bird.y > canvas.height || bird.y < 0) endGame();

    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - 350) createPipe();

    pipes.forEach((p, i) => {
        p.x -= 4.5;
        const hitbox = bird.size * 0.38;
        if (bird.x + hitbox > p.x && bird.x - hitbox < p.x + p.width) {
            if (bird.y - hitbox < p.y || bird.y + hitbox > p.y + p.gap) endGame();
        }

        if (!p.passed && p.x + p.width < bird.x) {
            score++;
            p.passed = true;
            if (score > highScore) {
                highScore = score;
                localStorage.setItem('oraHighScore', highScore);
            }
            updateHUD();
        }
        if (p.x + p.width < -100) pipes.splice(i, 1);
    });
}

function draw() {
    const bgImg = assets.bg[selections.bg];
    if (bgImg.complete && bgImg.naturalWidth !== 0) {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#70c5ce";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    pipes.forEach(p => {
        const pImg = assets.pipe[selections.pipe];
        if (pImg.complete && pImg.naturalWidth !== 0) {
            ctx.drawImage(pImg, p.x, 0, p.width, p.y);
            ctx.drawImage(pImg, p.x, p.y + p.gap, p.width, canvas.height);
            ctx.drawImage(pImg, p.x - 10, p.y - 35, p.width + 20, 35);
            ctx.drawImage(pImg, p.x - 10, p.y + p.gap, p.width + 20, 35);
        } else {
            ctx.fillStyle = "#2ecc71";
            ctx.fillRect(p.x, 0, p.width, p.y);
            ctx.fillRect(p.x, p.y + p.gap, p.width, canvas.height);
        }
    });

    const bImg = assets.bird[selections.bird];
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(Math.min(Math.PI/4, Math.max(-Math.PI/4, bird.velocity * 0.07)));
    if (bImg.complete && bImg.naturalWidth !== 0) {
        ctx.drawImage(bImg, -bird.size/2, -bird.size/2, bird.size, bird.size);
    } else {
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath(); ctx.arc(0, 0, bird.size/2, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
}

function startGame() {
    initGame();
    gameState = 'PLAYING';
    document.getElementById('home-menu').style.display = 'none';
    document.getElementById('hud').style.display = 'block';
    gameLoop();
}

function endGame() {
    gameState = 'MENU';
    cancelAnimationFrame(animationId);
    document.getElementById('home-menu').style.display = 'flex';
    document.getElementById('hud').style.display = 'none';
}

function exitGame() {
    if(confirm("Keluar dari game?")) window.close();
}

function gameLoop() {
    if (gameState === 'PLAYING') {
        update();
        draw();
        animationId = requestAnimationFrame(gameLoop);
    }
}

// Input Handling
const flap = (e) => { 
    if(gameState === 'PLAYING') bird.velocity = jump; 
};
window.addEventListener('keydown', (e) => { if(e.code === 'Space') flap(); });
canvas.addEventListener('mousedown', flap);
canvas.addEventListener('touchstart', (e) => { 
    e.preventDefault(); 
    flap(); 
}, {passive: false});

// Handle Orientation/Resize
window.addEventListener('resize', () => {
    setTimeout(initGame, 100);
});

loadAssets();
initGame();
