const { Engine, Render, World, Bodies, Mouse, MouseConstraint, Body } = Matter;

// Create an engine
const engine = Engine.create();

// Create a renderer
const render = Render.create({
    element: document.body,
    engine: engine,
    canvas: document.getElementById('worldCanvas'),
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false
    }
});

// Function to add walls
function addWalls() {
    World.clear(engine.world); // Clear existing walls before adding new ones
    const wallThickness = 50;
    World.add(engine.world, [
        Bodies.rectangle(window.innerWidth / 2, -wallThickness / 2, window.innerWidth, wallThickness, { isStatic: true }), // Top
        Bodies.rectangle(window.innerWidth / 2, window.innerHeight + wallThickness / 2, window.innerWidth, wallThickness, { isStatic: true }), // Bottom
        Bodies.rectangle(window.innerWidth + wallThickness / 2, window.innerHeight / 2, wallThickness, window.innerHeight, { isStatic: true }), // Right
        Bodies.rectangle(-wallThickness / 2, window.innerHeight / 2, wallThickness, window.innerHeight, { isStatic: true }) // Left
    ]);
}

// Add walls
addWalls();

// Add bouncy cards
const cardWidth = 150;
const cardHeight = 150;
let cardImages = [
    `https://cdn7.mazoku.cc/cards/dfe6530a-43f5-41ca-8414-0529a76635b9.webp`,
    `https://cdn7.mazoku.cc/cards/f288b208-7fbe-4a77-a969-cd8e738df108.webp`,
    `https://cdn7.mazoku.cc/cards/e9b8dd53-d935-444f-b3c4-d5c7f97647fa.webp`,
    `https://cdn7.mazoku.cc/cards/cde43390-77eb-4e04-b42e-11d3b4f42b0f.webp`,
    `https://cdn7.mazoku.cc/cards/de9c7c9c-267e-4052-88e6-3c93af4fcede.webp`,
    `https://cdn7.mazoku.cc/cards/e2115237-bedc-4cf6-a7bd-7c79797db341.webp`
];

let selectedCard = null; // Track the selected card

cardImages.forEach((url, index) => {
    let card = Bodies.rectangle(100 + index * 100, 100, cardWidth, cardHeight, {
        render: { sprite: { texture: url, xScale: cardWidth / 400, yScale: cardHeight / 400 } }
    });
    World.add(engine.world, card);
});

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

// Run the engine and renderer
Engine.run(engine);
Render.run(render);

// Resize canvas and walls on window resize
window.addEventListener('resize', () => {
    render.canvas.width = window.innerWidth;
    render.canvas.height = window.innerHeight;
    Render.lookAt(render, {
        min: { x: 0, y: 0 },
        max: { x: window.innerWidth, y: window.innerHeight }
    });
    addWalls(); // Re-add walls for new size
});

// --- Collision effect code commented out ---
/*
// Load the collision effect image
const collisionImage = new Image();
collisionImage.src = 'collisionEffect.png'; // Replace with your image file name
collisionImage.style.position = 'absolute';
collisionImage.style.display = 'none';
document.body.appendChild(collisionImage);

// Function to show collision effect
function showCollisionEffect(x, y) {
    collisionImage.style.left = `${x}px`;
    collisionImage.style.top = `${y}px`;
    collisionImage.style.display = 'block';
    collisionImage.style.scale = '0.09';

    // Hide the image after a short duration
    setTimeout(() => {
        collisionImage.style.display = 'none';
    }, 100); // Duration in milliseconds
}

// Collision event listener
Matter.Events.on(engine, 'collisionStart', function(event) {
    const pairs = event.pairs;

    pairs.forEach(function(pair) {

        // Check if the bodies in the pair are defined
        if (pair.bodyA && pair.bodyB) {
            const collisionPointX = (pair.bodyA.position.x + pair.bodyB.position.x) / 2;
            const collisionPointY = (pair.bodyA.position.y + pair.bodyB.position.y) / 2;
            showCollisionEffect(collisionPointX, collisionPointY);
        } else {
            console.log("Undefined bodies in pair", pair);
        }
    });
});
*/
