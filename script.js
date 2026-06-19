const canvas = document.getElementById("art");
const ctx = canvas.getContext("2d");

let W = 0;
let H = 0;
let DPR = 1;
let t = 0;
let hoverNode = -1;
let selectedNode = -1;
let bgFade = 0;
let mouse = { x: 0.52, y: 0.48, active: false };

const TAU = Math.PI * 2;
const lerp = (a, b, p) => a + (b - a) * p;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hsl = (h, s, l, a = 1) => `hsla(${h}, ${s}%, ${l}%, ${a})`;

/*
  Replace these placeholder image paths with your final exported node images.
  Example folder structure:
  images/node-01-alert.png
  images/node-02-investigation.png
  etc.
*/
const storyNodes = [
  { img: "images/node1.png",          icon: "alert",   hue: 330,   danger: true  },
  { img: "images/node2.png",  icon: "clue",    hue: 165, danger: false },
  { img: "images/node3.png",         icon: "breach",  hue: 350, danger: true  },
  { img: "images/node4.png",          icon: "trail",   hue: 175, danger: false },
  { img: "images/node5.png",icon:"web",     hue: 330, danger: true  },
  { img: "images/node6.png",     icon: "shield",  hue: 178, danger: false },
  { img: "images/node7.png",  icon: "villain", hue: 350, danger: true  },
  { img: "images/node8.png",  icon: "break",   hue: 185, danger: false },
  { img: "images/node9.png",        icon: "capture", hue: 215, danger: false },
  { img: "images/node10.png",   icon: "safe",    hue: 205, danger: false }
];

const loadedImages = storyNodes.map(node => {
  const image = new Image();
  image.ready = false;

  image.onload = () => {
    image.ready = true;
    console.log("LOADED:", node.img);
  };

  image.onerror = () => {
    image.ready = false;
    console.log("FAILED:", node.img);
  };

  image.src = node.img;
  return image;
});

const nodes = [
  [0.075, 0.78], [0.18, 0.68], [0.30, 0.61], [0.42, 0.57], [0.51, 0.48],
  [0.62, 0.43], [0.72, 0.34], [0.81, 0.27], [0.90, 0.23], [0.93, 0.21]
];

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.width = innerWidth * DPR;
  H = canvas.height = innerHeight * DPR;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

resize();
addEventListener("resize", resize);
addEventListener("mousemove", e => {
  mouse.x = e.clientX / innerWidth;
  mouse.y = e.clientY / innerHeight;
  mouse.active = true;
});
addEventListener("touchmove", e => {
  if (!e.touches[0]) return;
  mouse.x = e.touches[0].clientX / innerWidth;
  mouse.y = e.touches[0].clientY / innerHeight;
  mouse.active = true;
}, { passive: true });

addEventListener("click", () => {
  updateHover();
  if (hoverNode >= 0) selectedNode = hoverNode;
});

addEventListener("touchend", () => {
  updateHover();
  if (hoverNode >= 0) selectedNode = hoverNode;
});

function point(i) {
  const p = nodes[i];
  const breath = Math.sin(t * 0.018 + i * 0.9) * 7;
  return { x: p[0] * innerWidth, y: p[1] * innerHeight + breath };
}

function dist(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function updateHover() {
  hoverNode = -1;
  const m = { x: mouse.x * innerWidth, y: mouse.y * innerHeight };
  for (let i = 0; i < nodes.length; i++) {
    const p = point(i);
    const r = clamp(Math.min(innerWidth, innerHeight) * 0.052, 38, 72);
    if (dist(m, p) < r) hoverNode = i;
  }
}

function glowLine(a, b, color, width, alpha = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 5; i >= 1; i--) {
    ctx.globalAlpha = alpha * 0.05 * i;
    ctx.strokeStyle = color;
    ctx.lineWidth = width * i * 2.6;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

function coverImage(img, x, y, w, h) {
  const scale = Math.max(w / img.width, h / img.height);
  const iw = img.width * scale;
  const ih = img.height * scale;
  ctx.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
}

function drawNodeImageBackground() {
  const activeNode = hoverNode >= 0 ? hoverNode : selectedNode;
  bgFade = lerp(bgFade, activeNode >= 0 ? 1 : 0, 0.08);
  if (activeNode < 0 || bgFade < 0.01) return;

  const img = loadedImages[activeNode];
  const node = storyNodes[activeNode];

  ctx.save();
  ctx.globalAlpha = bgFade;

  if (img.ready) {
    coverImage(img, 0, 0, innerWidth, innerHeight);
  } else {
    const g = ctx.createRadialGradient(innerWidth * .5, innerHeight * .5, 40, innerWidth * .5, innerHeight * .5, Math.max(innerWidth, innerHeight));
    g.addColorStop(0, node.danger ? "rgba(120,0,30,.75)" : "rgba(0,130,120,.65)");
    g.addColorStop(.55, "rgba(5,8,24,.9)");
    g.addColorStop(1, "rgba(2,1,8,1)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, innerWidth, innerHeight);

    ctx.save();
    ctx.translate(innerWidth * .5, innerHeight * .5);
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = .7;
    placeholderIcon(node.icon, Math.min(innerWidth, innerHeight) * .55);
    ctx.restore();
  }

  // Dark comic overlay so nodes, path, and hero remain readable.
  ctx.fillStyle = "rgba(0,0,0,.22)";
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  const wash = ctx.createRadialGradient(innerWidth * .5, innerHeight * .5, 80, innerWidth * .5, innerHeight * .5, Math.max(innerWidth, innerHeight));
  wash.addColorStop(0, node.danger ? "rgba(255,20,70,.12)" : "rgba(0,255,220,.10)");
  wash.addColorStop(1, "rgba(0,0,0,.45)");
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  ctx.restore();
}

function background() {
  const g = ctx.createRadialGradient(
    innerWidth * mouse.x, innerHeight * mouse.y, 20,
    innerWidth * 0.5, innerHeight * 0.5, Math.max(innerWidth, innerHeight)
  );
  g.addColorStop(0, hsl(195 + mouse.x * 70, 86, 20, 0.95));
  g.addColorStop(0.38, "#101035");
  g.addColorStop(1, "#020108");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  ctx.save();
  ctx.globalCompositeOperation = "screen";

  // Matrix rain, kept subtle so the node images stay readable.
  for (let i = 0; i < 420; i++) {
    const x = (Math.sin(i * 19.71 + t * 0.007) * 0.5 + 0.5) * innerWidth;
    const y = (i * 29 + t * (0.45 + (i % 9) * 0.055)) % innerHeight;
    const near = 1 - Math.min(1, Math.hypot(mouse.x - x / innerWidth, mouse.y - y / innerHeight) * 1.9);
    ctx.fillStyle = hsl(155 + (i % 35), 90, 58, 0.06 + near * 0.18);
    ctx.fillRect(x, y, 1.3 + near * 3.5, 6 + near * 18);
  }

  // Comic speed lines.
  for (let i = 0; i < 80; i++) {
    const y = i / 80 * innerHeight + Math.sin(t * 0.011 + i) * 18;
    ctx.strokeStyle = i % 6 === 0 ? "rgba(0,255,190,.18)" : "rgba(180,0,255,.10)";
    ctx.lineWidth = i % 6 === 0 ? 1.2 : 0.5;
    ctx.beginPath();
    ctx.moveTo(-100, y);
    ctx.lineTo(innerWidth + 100, y + Math.sin(i + mouse.x * 6) * 120);
    ctx.stroke();
  }

  // Distant criminal-web silhouettes.
  for (let i = 0; i < 34; i++) {
    const x = (i * 137 + Math.sin(t * 0.01 + i) * 60) % innerWidth;
    const y = (i * 83 + Math.cos(t * 0.008 + i) * 40) % innerHeight;
    ctx.strokeStyle = i % 3 === 0 ? "rgba(255,35,80,.12)" : "rgba(0,255,210,.09)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 22 + (i % 5) * 10, 0, TAU);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPath() {
  const pts = nodes.map((_, i) => point(i));

  for (let i = 0; i < pts.length - 1; i++) {
    const active = hoverNode >= 0 && i < hoverNode;
    const color = active ? "rgba(0,255,220,.98)" : "rgba(145,120,255,.72)";
    glowLine(pts[i], pts[i + 1], color, active ? 5 : 3.3, active ? 1 : 0.55);
  }

  // Animated data packet moving through the completed/hovered route.
  if (hoverNode > 0) {
    for (let i = 0; i < hoverNode; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const p = (t * 0.025 + i * 0.23) % 1;
      const x = lerp(a.x, b.x, p);
      const y = lerp(a.y, b.y, p);
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = "rgba(140,255,230,.95)";
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
}

function placeholderIcon(type, size) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = size * 0.055;
  ctx.strokeStyle = "rgba(190,255,245,.9)";
  ctx.fillStyle = "rgba(0,0,0,.28)";

  if (type === "alert") {
    ctx.beginPath(); ctx.roundRect(-size*.22, -size*.34, size*.44, size*.68, size*.06); ctx.stroke();
    ctx.strokeStyle = "rgba(255,45,80,.95)";
    ctx.beginPath(); ctx.moveTo(0, -size*.18); ctx.lineTo(0, size*.08); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, size*.20, size*.025, 0, TAU); ctx.fill();
  }

  if (type === "clue") {
    for (let i = 0; i < 9; i++) {
      const a = i * TAU / 9;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a)*size*.34, Math.sin(a)*size*.34); ctx.stroke();
      ctx.beginPath(); ctx.arc(Math.cos(a)*size*.38, Math.sin(a)*size*.38, size*.035, 0, TAU); ctx.stroke();
    }
  }

  if (type === "breach") {
    ctx.beginPath(); ctx.roundRect(-size*.32, -size*.22, size*.64, size*.44, size*.05); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -size*.22, size*.18, Math.PI, 0); ctx.stroke();
    ctx.strokeStyle = "rgba(255,45,80,.95)";
    ctx.beginPath(); ctx.moveTo(-size*.04, -size*.24); ctx.lineTo(-size*.15, 0); ctx.lineTo(size*.03, size*.08); ctx.lineTo(-size*.08, size*.24); ctx.stroke();
  }

  if (type === "trail") {
    let last = null;
    for (let i = 0; i < 10; i++) {
      const x = Math.sin(i * 1.8) * size * .35;
      const y = -size * .32 + i * size * .07;
      if (last) { ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(x, y); ctx.stroke(); }
      ctx.beginPath(); ctx.arc(x, y, size*.035, 0, TAU); ctx.stroke();
      last = { x, y };
    }
  }

  if (type === "web") {
    for (let i = 0; i < 18; i++) {
      const a = i * TAU / 18;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a)*size*.42, Math.sin(a)*size*.42); ctx.stroke();
    }
    for (let r = .16; r <= .42; r += .13) {
      ctx.beginPath(); ctx.arc(0, 0, size*r, 0, TAU); ctx.stroke();
    }
  }

  if (type === "shield") {
    ctx.beginPath();
    ctx.moveTo(0, -size*.38); ctx.lineTo(size*.34, -size*.19); ctx.lineTo(size*.25, size*.24);
    ctx.lineTo(0, size*.42); ctx.lineTo(-size*.25, size*.24); ctx.lineTo(-size*.34, -size*.19);
    ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-size*.16, 0); ctx.lineTo(-size*.04, size*.13); ctx.lineTo(size*.22, -size*.17); ctx.stroke();
  }

  if (type === "villain") {
    ctx.strokeStyle = "rgba(255,45,80,.95)";
    ctx.beginPath(); ctx.moveTo(0, -size*.38); ctx.lineTo(size*.3, size*.32); ctx.lineTo(-size*.3, size*.32); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-size*.11, -size*.05); ctx.lineTo(-size*.04, size*.02); ctx.moveTo(-size*.04, -size*.05); ctx.lineTo(-size*.11, size*.02); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(size*.04, -size*.05); ctx.lineTo(size*.11, size*.02); ctx.moveTo(size*.11, -size*.05); ctx.lineTo(size*.04, size*.02); ctx.stroke();
  }

  if (type === "break") {
    ctx.strokeStyle = "rgba(0,255,220,.95)";
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      ctx.beginPath(); ctx.moveTo(Math.cos(a)*size*.08, Math.sin(a)*size*.08); ctx.lineTo(Math.cos(a)*size*.42, Math.sin(a)*size*.42); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,45,80,.7)";
    ctx.beginPath(); ctx.arc(0, 0, size*.24, 0, TAU); ctx.stroke();
  }

  if (type === "capture") {
    ctx.beginPath(); ctx.arc(0, 0, size*.32, 0, TAU); ctx.stroke();
    ctx.strokeStyle = "rgba(120,180,255,.95)";
    ctx.beginPath(); ctx.moveTo(-size*.22, size*.22); ctx.lineTo(size*.22, -size*.22); ctx.stroke();
  }

  if (type === "safe") {
    const pts = [];
    for (let i = 0; i < 12; i++) {
      const a = i * TAU / 12;
      pts.push({ x: Math.cos(a)*size*.34, y: Math.sin(a)*size*.34 });
    }
    pts.forEach((p, i) => {
      const q = pts[(i + 3) % pts.length];
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
      ctx.beginPath(); ctx.arc(p.x, p.y, size*.025, 0, TAU); ctx.stroke();
    });
  }

  ctx.restore();
}

function drawNode(i) {
  const p = point(i);
  const node = storyNodes[i];
  const hovered = i === hoverNode;
  const active = hoverNode >= 0 && i <= hoverNode;
  const size = hovered ? 108 : active ? 86 : 74;
  const pulse = Math.sin(t * 0.06 + i) * 0.5 + 0.5;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.globalCompositeOperation = "screen";

  // Removed the large hover wave/ripple glow so the background image stays prominent.
  // This keeps only a small soft glow directly behind each node.
  ctx.globalAlpha = hovered ? 0.22 : 0.12;
  ctx.fillStyle = hsl(node.hue, 95, hovered ? 62 : 52, 0.75);
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.34 + pulse * 2, 0, TAU);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.strokeStyle = hovered ? "rgba(255,255,255,.86)" : "rgba(170,255,240,.36)";
  ctx.lineWidth = hovered ? 3 : 2;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.46, 0, TAU);
  ctx.stroke();

  ctx.restore();

  // Draw placeholder image if it exists. Otherwise draw the built-in icon.
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.39, 0, TAU);
  ctx.clip();
  ctx.fillStyle = node.danger ? "rgba(45,0,15,.86)" : "rgba(0,30,38,.86)";
  ctx.fillRect(-size/2, -size/2, size, size);

  const img = loadedImages[i];
  if (img.ready) {
    ctx.drawImage(img, -size/2, -size/2, size, size);
  } else {
    // visual placeholder, no words
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.strokeStyle = node.danger ? "rgba(255,35,80,.35)" : "rgba(0,255,220,.35)";
    for (let r = size * .16; r < size * .46; r += size * .1) {
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    }
    placeholderIcon(node.icon, size);
    ctx.restore();
  }

  ctx.restore();
}

function drawStoryFocus() {
  const focusNode = hoverNode >= 0 ? hoverNode : selectedNode;
  if (focusNode < 0) return;
  const p = point(focusNode);
  const node = storyNodes[focusNode];
  const w = clamp(innerWidth * 0.30, 240, 420);
  const h = w * 0.62;
  const x = clamp(p.x - w / 2, 24, innerWidth - w - 24);
  const y = p.y < innerHeight * 0.48 ? p.y + 86 : p.y - h - 86;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.strokeStyle = node.danger ? "rgba(255,45,90,.85)" : "rgba(0,255,220,.85)";
  ctx.fillStyle = "rgba(2,5,14,.82)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 18);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(x + w/2, y + h/2);
  ctx.stroke();

  const img = loadedImages[focusNode];
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 10, w - 20, h - 20, 14);
  ctx.clip();
  ctx.fillStyle = node.danger ? "rgba(35,0,15,.8)" : "rgba(0,28,38,.8)";
  ctx.fillRect(x + 10, y + 10, w - 20, h - 20);
  if (img.ready) {
    ctx.drawImage(img, x + 10, y + 10, w - 20, h - 20);
  } else {
    ctx.translate(x + w/2, y + h/2);
    placeholderIcon(node.icon, Math.min(w, h) * 0.75);
  }
  ctx.restore();

  ctx.restore();
}

function drawHero() {
  const focusNode = hoverNode >= 0 ? hoverNode : selectedNode;
  let progress = focusNode >= 0 ? focusNode / (nodes.length - 1) : (t * 0.0018) % 1;
  const exact = progress * (nodes.length - 1);
  const i = Math.min(nodes.length - 2, Math.floor(exact));
  const f = exact - i;
  const a = point(i);
  const b = point(i + 1);
  const x = lerp(a.x, b.x, f);
  const y = lerp(a.y, b.y, f) - 42;
  const angle = Math.atan2(b.y - a.y, b.x - a.x);

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle * 0.16);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(0,255,220,.9)";
  ctx.shadowBlur = 14;

  ctx.fillStyle = "rgba(0,0,0,.96)";
  ctx.strokeStyle = "rgba(170,255,245,.88)";
  ctx.lineWidth = 3;

  ctx.beginPath(); ctx.arc(0, -30, 12, 0, TAU); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(0, 20); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(24, -20); ctx.moveTo(0, -6); ctx.lineTo(-22, 10); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(18, 44); ctx.moveTo(0, 20); ctx.lineTo(-14, 45); ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(0,0,0,.78)";
  ctx.beginPath();
  ctx.moveTo(-7, -16);
  ctx.lineTo(-58, 44 + Math.sin(t * 0.07) * 8);
  ctx.lineTo(-3, 28);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function halftone() {
  ctx.save();
  ctx.globalAlpha = 0.075;
  for (let y = 0; y < innerHeight; y += 14) {
    for (let x = 0; x < innerWidth; x += 14) {
      const dx = x - innerWidth * mouse.x;
      const dy = y - innerHeight * mouse.y;
      const r = 1 + 3 * Math.max(0, 1 - Math.hypot(dx, dy) / 560);
      ctx.fillStyle = "white";
      ctx.beginPath();
      ctx.arc(x, y, r, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

function vignette() {
  const g = ctx.createRadialGradient(innerWidth * .5, innerHeight * .5, 80, innerWidth * .5, innerHeight * .5, Math.max(innerWidth, innerHeight) * .78);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,.76)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, innerWidth, innerHeight);
}

function animate() {
  t++;
  updateHover();
  background();
  drawNodeImageBackground();
  drawPath();
  for (let i = 0; i < storyNodes.length; i++) drawNode(i);
  // drawStoryFocus(); // disabled: removes hover popup preview panel
  // drawHero();
  halftone();
  vignette();
  requestAnimationFrame(animate);
}

animate();
