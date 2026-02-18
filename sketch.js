let frogsRaw;
let frogs = [];
let selectedFrog = null;

// Images
let outlineImg;
let maskBack, maskBelly, maskFeet, maskToes, maskEye, maskIris;

// Cropped dimensions (from generated masks)
const CROP = { sw: 646, sh: 622 };

function preload() {
  frogsRaw = loadJSON("frog.JSON");

  outlineImg = loadImage("outline_cropped.png");
  maskBack = loadImage("mask_back.png");
  maskBelly = loadImage("mask_belly.png");
  maskFeet = loadImage("mask_feet.png");
  maskToes = loadImage("mask_toes.png");
  maskEye = loadImage("mask_eye.png");
  maskIris = loadImage("mask_iris.png");
}

function setup() {
  const canvas = createCanvas(windowWidth, windowWidth);
  canvas.parent("visualization");

  // Normalize JSON to array
  if (Array.isArray(frogsRaw)) frogs = frogsRaw;
  else if (frogsRaw && typeof frogsRaw === "object") frogs = Object.values(frogsRaw);
  else frogs = [];

  setupDropdown();
}

function draw() {
  //background(240);

  const cx = width / 2;
  const bottomY = height - 18;

  const targetW = min(width * 0.58, 560);
  const s = targetW / CROP.sw;

  const pal = getPartPalette(selectedFrog);

  // Draw masks (tinted)
  drawTinted(maskBack, pal.back, cx, bottomY, s);
  drawTinted(maskBelly, pal.belly, cx, bottomY, s);
  drawTinted(maskFeet, pal.feet, cx, bottomY, s);
  drawTinted(maskToes, pal.toe, cx, bottomY, s);
  drawTinted(maskEye, pal.eye, cx, bottomY, s);
  drawTinted(maskIris, pal.iris, cx, bottomY, s);

  drawOutline(cx, bottomY, s);
}


/* -----------------------------
   Dropdown (HTML <select id="dropdown">)
----------------------------- */
function setupDropdown() {
  const dropdown = document.getElementById("dropdown");
  if (!dropdown) return;

  dropdown.innerHTML = "";

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Select a frog";
  dropdown.appendChild(placeholder);

  frogs.forEach((frog, i) => {
    const opt = document.createElement("option");
    opt.value = String(i);
    opt.textContent = frog["Frog name"];
    dropdown.appendChild(opt);
  });

  dropdown.addEventListener("change", (e) => {
    const idx = Number(e.target.value);
    selectedFrog = Number.isFinite(idx) ? frogs[idx] ?? null : null;
  });
}

/* -----------------------------
   Drawing helpers
----------------------------- */
function drawTinted(img, col, cx, bottomY, s) {
  push();
  translate(cx, bottomY);
  scale(s);
  translate(-CROP.sw / 2, -CROP.sh);

  tint(col);
  image(img, 0, 0, CROP.sw, CROP.sh);
  pop();
}

function drawOutline(cx, bottomY, s) {
  push();
  translate(cx, bottomY);
  scale(s);
  translate(-CROP.sw / 2, -CROP.sh);

  noTint();
  image(outlineImg, 0, 0, CROP.sw, CROP.sh);
  pop();
}

/* -----------------------------
   Color parsing (supports 8-digit hex)
----------------------------- */
function getPartPalette(frog) {
  const defaults = {
    back: color("#6fb66a"),
    belly: color("#d7f0c5"),
    feet: color("#4f9152"),
    toe: color("#9cd49b"),
    eye: color("#000000"),
    iris: color("#ffffff"),
  };

  if (!frog) return defaults;

  return {
    back: parseColor(frog["Back color"], defaults.back),
    belly: parseColor(frog["Belly color"], defaults.belly),
    feet: parseColor(frog["Feet color"], defaults.feet),
    toe: parseColor(frog["Toe color"], defaults.toe),
    eye: parseColor(frog["Eye color"], defaults.eye),
    iris: parseColor(frog["Iris color"], defaults.iris),
  };
}

function parseColor(v, fallback) {
  if (!v) return fallback;

  if (typeof v === "string") {
    const hex8 = v.match(/^#([0-9a-fA-F]{8})$/);
    if (hex8) {
      const h = hex8[1];
      return color(
        parseInt(h.slice(0, 2), 16),
        parseInt(h.slice(2, 4), 16),
        parseInt(h.slice(4, 6), 16),
        parseInt(h.slice(6, 8), 16)
      );
    }
    return color(v);
  }

  return fallback;
}