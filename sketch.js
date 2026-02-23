let selectedFrog = null;
let selectedSize = 5;
let selectedBiome = null;
let selectedPalette = null;

// Images
let outlineImg;
let bgRainforest, bgLowlands, bgSavannah, bgRiver;

let maskBack, maskBelly, maskFeet, maskToes, maskEye, maskIris, maskLines, maskSpots;

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
  maskLines = loadImage("mask_lines.png");
  maskSpots = loadImage("mask_spots.png");
  bgRainforest = loadImage("rainforest.png");
  bgLowlands = loadImage("tropical_lowlands.png");
  bgSavannah = loadImage("savannah.png");
  bgRiver = loadImage("river.png");
}

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("visualization");

  // Normalize JSON to array
  if (Array.isArray(frogsRaw)) frogs = frogsRaw;
  else if (frogsRaw && typeof frogsRaw === "object") frogs = Object.values(frogsRaw);
  else frogs = [];

  setupDropdown();
}

function draw() {
  if (!selectedFrog) {
  background(240);
  return;
  }

  const cx = width / 2;
  const bottomY = height - 18;

  let biome = selectedBiome;

  if (biome === "rainforests") image(bgRainforest, 0, 0, width, height);
  else if (biome === "tropical_lowlands") image(bgLowlands, 0, 0, width, height);
  else if (biome === "savannahs") image(bgSavannah, 0, 0, width, height);
  else if (biome === "rivers") image(bgRiver, 0, 0, width, height);

  // Base width limit
  const baseTargetW = min(width * 0.58, 560);

  // Get frog size in cm
  const avgSize = selectedSize;

  // Define realistic min/max frog sizes in your dataset
  const MIN_CM = 2;   // smallest frog
  const MAX_CM = 32;  // largest frog

  // Map frog size to a scale factor
  const sizeFactor = map(avgSize, MIN_CM, MAX_CM, 0.35, 1.2, true);

  const s = (baseTargetW / CROP.sw) * sizeFactor;

  const pal = selectedPalette;

  // Draw masks (tinted)
  drawTinted(maskBack, pal.back, cx, bottomY, s);
  drawTinted(maskBelly, pal.belly, cx, bottomY, s);
  
  // Draw optional patterns ONLY if this frog has them
  if (pal.spots) drawTinted(maskSpots, pal.spots, cx, bottomY, s);
  if (pal.lines) drawTinted(maskLines, pal.lines, cx, bottomY, s);

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
    selectedBiome = getBiomeFromHabitat(selectedFrog);
    selectedSize = getFrogAverageSize(selectedFrog);
    selectedPalette = getPartPalette(selectedFrog);
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
    lines: null,
    spots: null,
  };

  if (!frog) return defaults;

  return {
    back: parseColor(frog["Back color"], defaults.back),
    belly: parseColor(frog["Belly color"], defaults.belly),
    feet: parseColor(frog["Feet color"], defaults.feet),
    toe: parseColor(frog["Toe color"], defaults.toe),
    eye: parseColor(frog["Eye color"], defaults.eye),
    iris: parseColor(frog["Iris color"], defaults.iris),

    // OPTIONAL: only frogs that have these keys will get them
    spots: frog["Spot color"] ? parseColor(frog["Spot color"], color("#000000")) : null,
    lines: frog["Line color"] ? parseColor(frog["Line color"], color("#000000")) : null,
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

function getFrogAverageSize(frog) {
  if (!frog || !frog["Size"]) return 5; // default medium size

  const nums = frog["Size"].match(/[\d.]+/g);
  if (!nums || nums.length === 0) return 5;

  const values = nums.map(Number);
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function getBiomeFromHabitat(frog) {
  if (!frog || !frog.Habitat) return "rainforest";

  const h = String(frog.Habitat).toLowerCase();

  // Priority order (so "lowland rainforests" becomes tropical_lowlands)
  if (h.includes("river") || h.includes("stream") || h.includes("fast-flowing") || h.includes("water")) {
    return "rivers";
  }
  if (h.includes("savanna") || h.includes("grassland") || h.includes("shrubland")) {
    return "savannahs";
  }
  if (h.includes("tropical lowland") || (h.includes("lowland") && h.includes("tropical"))) {
    return "tropical_lowlands";
  }
  if (h.includes("rainforest") || h.includes("jungle") || h.includes("forest") || h.includes("canopy")) {
    return "rainforests";
  }

  return "rainforests";
}