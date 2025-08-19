const { Engine, Render, World, Bodies, Mouse, MouseConstraint, Body } = Matter;

// Create an engine
const engine = Engine.create();

 // Create a renderer
const menuEl = document.getElementById('menu');
const getAvailableWidth = () => window.innerWidth - (menuEl ? menuEl.offsetWidth : 280);

const render = Render.create({
    element: document.querySelector('.container'),
    engine: engine,
    canvas: document.getElementById('worldCanvas'),
    options: {
        width: getAvailableWidth(),
        height: window.innerHeight,
        wireframes: false
    }
});

 // enforce layout ordering so menu stays on the right and canvas on the left
const containerEl = document.querySelector('.container');
if (containerEl) {
    containerEl.style.flexDirection = 'row';
    // ensure menu is the last child so it visually sits on the right
    if (menuEl && containerEl.lastElementChild !== menuEl) {
        containerEl.appendChild(menuEl);
    }
}
if (menuEl) {
    menuEl.style.order = '2';
    menuEl.style.flex = '0 0 280px';
}
const canvasEl = document.getElementById('worldCanvas');
if (canvasEl) {
    canvasEl.style.order = '1';
    canvasEl.style.display = 'block';
    canvasEl.style.width = `${getAvailableWidth()}px`;
    canvasEl.style.height = `${window.innerHeight}px`;
}

 // Function to add walls
function addWalls() {
    World.clear(engine.world); // Clear existing walls before adding new ones
    const wallThickness = 120;
    const w = getAvailableWidth();
    const h = window.innerHeight;
    World.add(engine.world, [
        Bodies.rectangle(w / 2, -wallThickness / 2, w, wallThickness, { isStatic: true }), // Top
        Bodies.rectangle(w / 2, h + wallThickness / 2, w, wallThickness, { isStatic: true }), // Bottom
        Bodies.rectangle(w + wallThickness / 2, h / 2, wallThickness, h, { isStatic: true }), // Right
        Bodies.rectangle(-wallThickness / 2, h / 2, wallThickness, h, { isStatic: true }) // Left
    ]);
}

// Add walls
addWalls();

 // Add bouncy cards
const cardWidth = 110;
const cardHeight = 160;
let cardImages = [
    `https://cdn7.mazoku.cc/cards/dfe6530a-43f5-41ca-8414-0529a76635b9.webp`,
    `https://cdn7.mazoku.cc/cards/f288b208-7fbe-4a77-a969-cd8e738df108.webp`,
    `https://cdn7.mazoku.cc/cards/e9b8dd53-d935-444f-b3c4-d5c7f97647fa.webp`,
    `https://cdn7.mazoku.cc/cards/cde43390-77eb-4e04-b42e-11d3b4f42b0f.webp`,
    `https://cdn7.mazoku.cc/cards/de9c7c9c-267e-4052-88e6-3c93af4fcede.webp`,
    `https://cdn7.mazoku.cc/cards/a7ffc51e-b6d3-4ffa-95c6-9c89dcfe0fbf.webp`,
    `https://cdn7.mazoku.cc/cards/7bb1517b-d598-4540-9a82-1f47a8c371ff.webp`,
    `https://cdn7.mazoku.cc/cards/af3e1655-4a90-4f44-95d2-fd8a53030ea7.webp`,
    `https://cdn7.mazoku.cc/cards/56a06aa8-b866-4929-b06e-63a4a50be910.webp`,
    `https://cdn7.mazoku.cc/cards/4d684fa3-bc51-40c6-a465-6d2cc33f86cf.webp`,
    `https://cdn7.mazoku.cc/cards/d099996d-c6c0-45e0-9a7c-3d9ac9f4d54b.webp`,
    `https://cdn7.mazoku.cc/cards/b50e754f-8dcb-42f2-b4a8-374eba05f2b9.webp`,
    `https://cdn7.mazoku.cc/cards/c6556dfc-f30e-498d-b917-1a3d46625564.webp`,
    `https://cdn7.mazoku.cc/cards/e2115237-bedc-4cf6-a7bd-7c79797db341.webp`
];

let selectedCard = null; // Track the selected card

// Track created card bodies and associated image URLs
const cardBodies = [];
const MAX_CARDS = 20;

 // Helper to create a card body and add to world + tracking array
function createCard(url, x = 100, y = 100) {
    // preload the image so we can downscale/compress it before using as a texture
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        // target a smaller upload width to reduce texture size and improve FPS
        const maxTargetWidth = Math.min(img.width, 200);
        const scaleFactor = maxTargetWidth / img.width;
        const targetW = Math.max(1, Math.round(img.width * scaleFactor));
        const targetH = Math.max(1, Math.round(img.height * scaleFactor));

        const off = document.createElement('canvas');
        off.width = targetW;
        off.height = targetH;
        const ctx = off.getContext('2d');
        ctx.drawImage(img, 0, 0, targetW, targetH);

        // compress to reduce memory; fallback to default if not supported
        let dataUrl;
        try {
            dataUrl = off.toDataURL('image/webp', 0.6);
        } catch (e) {
            dataUrl = off.toDataURL();
        }

        const xScale = cardWidth / targetW;
        const yScale = cardHeight / targetH;

        const card = Bodies.rectangle(x, y, cardWidth, cardHeight, {
            render: { sprite: { texture: dataUrl, xScale: xScale, yScale: yScale } }
        });

        World.add(engine.world, card);
        cardBodies.push({ body: card, url: dataUrl });

        // update UI after card is added
        if (typeof updateCardUI === 'function') updateCardUI();
    };

    img.onerror = () => {
        // fallback: create card with conservative default scale
        const defaultScaleX = cardWidth / 400;
        const defaultScaleY = cardHeight / 400;
        const card = Bodies.rectangle(x, y, cardWidth, cardHeight, {
            render: { sprite: { texture: url, xScale: defaultScaleX, yScale: defaultScaleY } }
        });
        World.add(engine.world, card);
        cardBodies.push({ body: card, url });
        if (typeof updateCardUI === 'function') updateCardUI();
    };

    img.src = url;

    // body is created asynchronously after image loads; return null for synchronous callers
    return null;
}

// Initialize existing cards with a random selection of 5
const initialImages = [...cardImages].sort(() => 0.5 - Math.random()).slice(0, 5);
initialImages.forEach((url, index) => {
    createCard(url, 100 + index * 120, 100);
});

// UI wiring (right-side menu)
const addBtn = document.getElementById('addCardBtn');
const removeLastBtn = document.getElementById('removeLastBtn');
const cardCountEl = document.getElementById('cardCount');
const cardListEl = document.getElementById('cardList');

function updateCardUI() {
    cardCountEl.textContent = `${cardBodies.length} / ${MAX_CARDS}`;
    cardListEl.innerHTML = '';

    cardBodies.forEach((item, idx) => {
        const row = document.createElement('div');
        row.className = 'card-item';

        const label = document.createElement('div');
        label.textContent = `Card ${idx + 1}`;
        label.style.display = 'flex';
        label.style.alignItems = 'center';
        label.style.gap = '8px';

        const thumb = document.createElement('img');
        thumb.src = item.url;
        thumb.style.width = '28px';
        thumb.style.height = '40px';
        thumb.style.objectFit = 'cover';
        thumb.style.borderRadius = '4px';
        thumb.style.marginRight = '6px';

        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.alignItems = 'center';
        left.appendChild(thumb);
        left.appendChild(document.createTextNode(`Card ${idx + 1}`));

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.addEventListener('click', () => removeCardAt(idx));

        row.appendChild(left);
        row.appendChild(delBtn);
        cardListEl.appendChild(row);
    });
}

// Remove a card at a specific index
function removeCardAt(index) {
    const item = cardBodies[index];
    if (!item) return;
    World.remove(engine.world, item.body);
    cardBodies.splice(index, 1);
    updateCardUI();
}

 // Add a random card (uses pool of image URLs)
function addRandomCard() {
    if (cardBodies.length >= MAX_CARDS) return;
    const url = cardImages[Math.floor(Math.random() * cardImages.length)];
    const x = Math.random() * (getAvailableWidth() - 200) + 100;
    const y = 50;
    // createCard will call updateCardUI() after the image loads and the body is added
    createCard(url, x, y);
}

addBtn.addEventListener('click', () => {
    addRandomCard();
});
removeLastBtn.addEventListener('click', () => {
    if (cardBodies.length > 0) removeCardAt(cardBodies.length - 1);
});

// Restart simulation: remove all cards and re-populate initial set
const restartBtn = document.getElementById('restartBtn');
function restartSimulation() {
    // remove card bodies from world
    for (let i = cardBodies.length - 1; i >= 0; i--) {
        const item = cardBodies[i];
        if (item && item.body) {
            World.remove(engine.world, item.body);
        }
    }
    cardBodies.length = 0;

    // re-add the initial set of cards with the same random 5
    const restartImages = [...cardImages].sort(() => 0.5 - Math.random()).slice(0, 5);
    restartImages.forEach((url, index) => {
        // small stagger so they don't all overlap exactly
        const x = 100 + index * 120;
        const y = 100;
        createCard(url, x, y);
    });

    // update UI (createCard will also call updateCardUI after each load)
    updateCardUI();
}

if (restartBtn) {
    restartBtn.addEventListener('click', () => {
        restartSimulation();
    });
}

 // Initial UI update
updateCardUI();

 // --- Runtime controls: gravity / timescale / bounciness / presets ---
// Elements are defined in the menu; wire them up here and expose helpers.
// These variables are intentionally lightweight and optimized for per-tick usage.
const gravitySlider = document.getElementById('gravitySlider');
const gravityValue = document.getElementById('gravityValue');
const timescaleSlider = document.getElementById('timescaleSlider');
const timescaleValue = document.getElementById('timescaleValue');
const bouncinessSlider = document.getElementById('bouncinessSlider');
const bouncinessValue = document.getElementById('bouncinessValue');
const explosionStrengthSlider = document.getElementById('explosionStrengthSlider');
const explosionStrengthValue = document.getElementById('explosionStrengthValue');
const explosionToggleBtn = document.getElementById('explosionToggleBtn');
const presetSelect = document.getElementById('presetSelect');

let pushEffectEnabled = false;
const PUSH_EFFECT_RADIUS = 150;
let pushEffectStrength = 0.05; // Default explosion strength

let globalBounciness = 0.8; // Default bounciness

// Tornado preset support (soft central attractor)
let tornadoCenter = { x: (render && render.canvas) ? render.canvas.width / 2 : 0, y: (render && render.canvas) ? render.canvas.height / 2 : 0, enabled: false };

function updateSliderDisplays() {
    if (gravityValue) gravityValue.textContent = (engine.world.gravity.y || 0).toFixed(2);
    if (timescaleValue) timescaleValue.textContent = (engine.timing.timeScale || 1).toFixed(2);
    if (bouncinessValue) bouncinessValue.textContent = globalBounciness.toFixed(2);
    if (explosionStrengthValue) explosionStrengthValue.textContent = pushEffectStrength.toFixed(2);
}

// Slider wiring (debounced UI isn't required for range because changes are cheap)
if (gravitySlider) {
    gravitySlider.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        engine.world.gravity.y = v;
        if (gravityValue) gravityValue.textContent = v.toFixed(2);
    });
}

if (timescaleSlider) {
    timescaleSlider.addEventListener('input', (e) => {
        const v = parseFloat(e.target.value);
        engine.timing.timeScale = v;
        if (timescaleValue) timescaleValue.textContent = v.toFixed(2);
    });
}

if (bouncinessSlider) {
    bouncinessSlider.addEventListener('input', (e) => {
        globalBounciness = parseFloat(e.target.value);
        // Update bounciness for all existing cards
        for (let i = 0; i < cardBodies.length; i++) {
            const b = cardBodies[i] && cardBodies[i].body;
            if (b && !b.isStatic) {
                b.restitution = globalBounciness;
            }
        }
        if (bouncinessValue) bouncinessValue.textContent = globalBounciness.toFixed(2);
    });
}

if (explosionStrengthSlider) {
    explosionStrengthSlider.addEventListener('input', (e) => {
        pushEffectStrength = parseFloat(e.target.value);
        if (explosionStrengthValue) explosionStrengthValue.textContent = pushEffectStrength.toFixed(2);
    });
}

// Presets
function applyPreset(name) {
    tornadoCenter.enabled = false;
    switch (name) {
        case 'moon':
            engine.world.gravity.y = 0.15;
            engine.timing.timeScale = 1;
            globalBounciness = 0.8; // Reset bounciness
            break;
        case 'pinball':
            engine.world.gravity.y = 2.0; // Increased gravity
            engine.timing.timeScale = 1;
            globalBounciness = 0.9; // High bounciness for pinball
            break;
        case 'tornado':
            engine.world.gravity.y = 0.6;
            engine.timing.timeScale = 1;
            globalBounciness = 0.8; // Reset bounciness
            tornadoCenter.enabled = true;
            tornadoCenter.x = render.canvas.width / 2;
            tornadoCenter.y = render.canvas.height / 2;
            break;
        default:
            engine.world.gravity.y = 1;
            engine.timing.timeScale = 1;
            globalBounciness = 0.8; // Reset bounciness
            tornadoCenter.enabled = false;
    }
    // Update all cards with the new bounciness
    for (let i = 0; i < cardBodies.length; i++) {
        const b = cardBodies[i] && cardBodies[i].body;
        if (b && !b.isStatic) {
            b.restitution = globalBounciness;
        }
    }
    // sync sliders and labels
    if (gravitySlider) gravitySlider.value = engine.world.gravity.y;
    if (timescaleSlider) timescaleSlider.value = engine.timing.timeScale;
    if (bouncinessSlider) bouncinessSlider.value = globalBounciness;
    updateSliderDisplays();
}

if (presetSelect) {
    presetSelect.addEventListener('change', (e) => applyPreset(e.target.value));
}

// Push effect function
function applyPushEffect(x, y) {
    if (!pushEffectEnabled) return;
    for (let i = 0; i < cardBodies.length; i++) {
        const item = cardBodies[i];
        if (!item || !item.body || item.body.isStatic) continue;
        const b = item.body;
        const dx = b.position.x - x;
        const dy = b.position.y - y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > PUSH_EFFECT_RADIUS || d < 1) continue; // Avoid division by zero and limit effect range

        const forceMagnitude = (1 - d / PUSH_EFFECT_RADIUS) * pushEffectStrength * b.mass;
        // Normalize direction vector and apply force
        // This creates a radial push away from the click point
        const nx = dx / d;
        const ny = dy / d;
        Body.applyForce(b, b.position, { x: nx * forceMagnitude, y: ny * forceMagnitude });
    }
}

// Toggle push effect
function setPushEffectState(enabled) {
    pushEffectEnabled = !!enabled;
    if (explosionToggleBtn) {
        explosionToggleBtn.textContent = `Push Effect: ${pushEffectEnabled ? 'On' : 'Off'}`;
        explosionToggleBtn.style.background = pushEffectEnabled ? '#ef4444' : '#2563eb'; // Red when on, blue when off
    }
    if (render && render.canvas) {
        render.canvas.style.cursor = pushEffectEnabled ? 'pointer' : 'default';
    }
}

if (explosionToggleBtn) {
    explosionToggleBtn.addEventListener('click', () => {
        setPushEffectState(!pushEffectEnabled);
    });
}

// Canvas click handler for push effect
if (render && render.canvas) {
    render.canvas.addEventListener('click', (e) => {
        if (!pushEffectEnabled) return;
        const rect = render.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        applyPushEffect(x, y);

        // Brief visual feedback: flash canvas tint
        const prevBg = render.canvas.style.background || '#0b0b0b'; // Default to original bg if not set
        render.canvas.style.transition = 'background 0.08s';
        
        // Function to lighten a hex color slightly
        function lightenColor(hex, percent) {
            const num = parseInt(hex.replace("#",""), 16);
            const amt = Math.round(2.55 * percent);
            const R = (num >> 16) + amt;
            const G = (num >> 8 & 0x00FF) + amt;
            const B = (num & 0x0000FF) + amt;
            return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
        }

        let currentBgColor;
        if (prevBg.startsWith('rgb')) {
            // Convert rgb to hex for easier manipulation
            const values = prevBg.match(/\d+/g);
            const hex = "#" + ((1 << 24) + (parseInt(values[0]) << 16) + (parseInt(values[1]) << 8) + parseInt(values[2])).toString(16).slice(1);
            currentBgColor = lightenColor(hex, 10); // Lighten by 10%
        } else if (prevBg.startsWith('#')) {
            currentBgColor = lightenColor(prevBg, 10); // Lighten by 10%
        } else {
            // Fallback to a very light version of the default dark bg
            currentBgColor = lightenColor('#0b0b0b', 10);
        }
        
        render.canvas.style.background = currentBgColor;
        setTimeout(() => { render.canvas.style.background = prevBg; }, 80);
    });
}

// initial UI reflect
updateSliderDisplays();

// Add mouse control
const mouse = Mouse.create(render.canvas);
const mouseConstraint = MouseConstraint.create(engine, {
    mouse: mouse,
    constraint: { stiffness: 0.2, render: { visible: false } }
});

mouseConstraint.mouse.element.addEventListener('mousedown', function(event) {
    if (mouseConstraint.body) {
        selectedCard = mouseConstraint.body; // Update selected card on mouse down
        if (selectedCard) {
            const rotationForce = 0.05; // Adjust rotation force as needed
            if (event.key === 'r') { // Choose the key for rotation (e.g., 'r')
                Body.rotate(selectedCard, rotationForce);
            }
        }
    }
});

mouseConstraint.mouse.element.addEventListener('mouseup', function(event) {
    selectedCard = null; // Clear selected card on mouse up
});

World.add(engine.world, mouseConstraint);

 // Improve collision stability for fast-moving bodies (balanced for performance)
engine.positionIterations = 12;
engine.velocityIterations = 12;
engine.constraintIterations = 4;

 // Prevent tunneling: clamp bodies that cross world bounds each tick
Matter.Events.on(engine, 'beforeUpdate', function() {
    const w = getAvailableWidth();
    const h = window.innerHeight;
    const padding = 10;

    // iterate once: clamp positions AND apply lightweight global effects (tornado)
    for (let i = 0; i < cardBodies.length; i++) {
        const item = cardBodies[i];
        if (!item || !item.body) continue;
        const body = item.body;
        let px = body.position.x;
        let py = body.position.y;
        let vx = body.velocity.x;
        let vy = body.velocity.y;
        let moved = false;

        // Tornado soft attractor (if enabled)
        if (tornadoCenter && tornadoCenter.enabled && !body.isStatic && !body.isSleeping) {
            const dx = tornadoCenter.x - body.position.x;
            const dy = tornadoCenter.y - body.position.y;
            const d2 = dx * dx + dy * dy;
            const r = Math.sqrt(d2) || 0.0001;
            // pull scales inversely with distance, small magnitude
            const pull = 0.00003 * (1 / r) * engine.timing.timeScale;
            Body.applyForce(body, body.position, { x: dx * pull * body.mass, y: dy * pull * body.mass });
            // slight rotational component to create spiral (cheap)
            const spin = 0.00002 * engine.timing.timeScale;
            Body.applyForce(body, body.position, { x: -dy * spin * body.mass, y: dx * spin * body.mass });
        }

        if (px < -padding) { px = padding; vx = Math.abs(vx) * 0.5; moved = true; }
        else if (px > w + padding) { px = w - padding; vx = -Math.abs(vx) * 0.5; moved = true; }

        if (py < -padding) { py = padding; vy = Math.abs(vy) * 0.5; moved = true; }
        else if (py > h + padding) { py = h - padding; vy = -Math.abs(vy) * 0.5; moved = true; }

        if (moved) {
            Body.setPosition(body, { x: px, y: py });
            Body.setVelocity(body, { x: vx, y: vy });
        }
    }

    // update tornado center to canvas center (keeps it adaptive on resize/viewport changes)
    if (tornadoCenter && tornadoCenter.enabled && render && render.canvas) {
        tornadoCenter.x = render.canvas.width / 2;
        tornadoCenter.y = render.canvas.height / 2;
    }
});

// Run the engine and renderer
Engine.run(engine);
Render.run(render);

 // Resize canvas and walls on window resize
window.addEventListener('resize', () => {
    const availW = getAvailableWidth();
    render.canvas.width = availW;
    render.canvas.height = window.innerHeight;
    // keep CSS layout in sync (canvas is flex:1)
    render.canvas.style.width = `${availW}px`;
    render.canvas.style.height = `${window.innerHeight}px`;
    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: availW, y: window.innerHeight }
    });
    addWalls(); // Re-add walls for new size
});
