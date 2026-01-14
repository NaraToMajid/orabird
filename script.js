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

const assets = { bird: [], pipe: [], bg: [] };
function loadAssets() {
    for(let i=1; i<=10; i++) {
        assets.bird[i] = new Image(); assets.bird[i].src = `skinbird${i}.webp`;
        assets.pipe[i] = new Image(); assets.pipe[i].src = `skinpipa${i}.webp`;
        assets.bg[i] = new Image(); assets.bg[i].src = `skinlatar${i}.webp`;
    }
}

let bird, pipes, animationId;
let gravity, jump, pipeSpeed, pipeGap, birdSize;

function setupDimensions() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Skala dinamis berdasarkan ukuran layar
    const scale = Math.min(canvas.width, canvas.height) / 400;
    birdSize = 45 * scale;
    gravity = 0.25 * scale;
    jump = -5.5 * scale;
    pipeSpeed = 4 * scale;
    pipeGap = 180 * scale;

    if (!bird) {
        bird = { x: canvas.width * 0.2, y: canvas.height / 2, velocity: 0 };
    } else {
        bird.x = canvas.width * 0.2;
    }
}

function updateHUD() {
    document.getElementById('current-score').innerText = score;
    document.getElementById('high-score').innerText = highScore;
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
            </div>`;
    }
}

function selectSkin(type, index) {
    selections[type] = index;
    localStorage.setItem(`s${type.charAt(0).toUpperCase() + type.slice(1)}`, index);
    renderSkinGrid();
}

function createPipe() {
    const pipeW = birdSize * 1.8;
    const minH = 50;
    const h = Math.floor(Math.random() * (canvas.height - pipeGap - 100)) + minH;
    pipes.push({ x: canvas.width, y: h, gap: pipeGap, width: pipeW, passed: false });
}

function update() {
    if (gameState !== 'PLAYING') return;
    
    bird.velocity += gravity;
    bird.y += bird.velocity;

    if (bird.y + birdSize/2 > canvas.height || bird.y - birdSize/2 < 0) endGame();

    if (pipes.length === 0 || pipes[pipes.length - 1].x < canvas.width - (birdSize * 6)) {
        createPipe();
    }

    pipes.forEach((p, i) => {
        p.x -= pipeSpeed;
        const hb = birdSize * 0.4;
        if (bird.x + hb > p.x && bird.x - hb < p.x + p.width) {
            if (bird.y - hb < p.y || bird.y + hb > p.y + p.gap) endGame();
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const bgImg = assets.bg[selections.bg];
    if (bgImg.complete && bgImg.naturalWidth !== 0) {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#70c5ce"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    pipes.forEach(p => {
        const pImg = assets.pipe[selections.pipe];
        if (pImg.complete && pImg.naturalWidth !== 0) {
            ctx.drawImage(pImg, p.x, 0, p.width, p.y);
            ctx.drawImage(pImg, p.x, p.y + p.gap, p.width, canvas.height);
            // Muncung
            ctx.drawImage(pImg, p.x - 5, p.y - 30, p.width + 10, 30);
            ctx.drawImage(pImg, p.x - 5, p.y + p.gap, p.width + 10, 30);
        } else {
            ctx.fillStyle = "#2ecc71";
            ctx.fillRect(p.x, 0, p.width, p.y);
            ctx.fillRect(p.x, p.y + p.gap, p.width, canvas.height);
        }
    });

    const bImg = assets.bird[selections.bird];
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(Math.min(Math.PI/4, Math.max(-Math.PI/4, bird.velocity * 0.08)));
    if (bImg.complete && bImg.naturalWidth !== 0) {
        ctx.drawImage(bImg, -birdSize/2, -birdSize/2, birdSize, birdSize);
    } else {
        ctx.fillStyle = "yellow"; ctx.beginPath(); ctx.arc(0, 0, birdSize/2, 0, Math.PI*2); ctx.fill();
    }
    ctx.restore();
}

function startGame() {
    score = 0;
    pipes = [];
    bird = { x: canvas.width * 0.2, y: canvas.height / 2, velocity: 0 };
    gameState = 'PLAYING';
    document.getElementById('home-menu').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    updateHUD();
    gameLoop();
}

function endGame() {
    gameState = 'MENU';
    cancelAnimationFrame(animationId);
    document.getElementById('home-menu').style.display = 'flex';
    document.getElementById('hud').style.display = 'none';
}

function exitGame() { if(confirm("Keluar?")) window.close(); }

function gameLoop() {
    if (gameState === 'PLAYING') {
        update();
        draw();
        animationId = requestAnimationFrame(gameLoop);
    }
}

const handleInput = (e) => { if(gameState === 'PLAYING') bird.velocity = jump; };
window.addEventListener('keydown', (e) => { if(e.code === 'Space') handleInput(); });
canvas.addEventListener('mousedown', handleInput);
canvas.addEventListener('touchstart', (e) => { e.preventDefault(); handleInput(); }, {passive: false});

window.addEventListener('resize', setupDimensions);

loadAssets();
setupDimensions();
