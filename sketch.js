let selectedFrog = null;
let selectedSize = 5;
let selectedBiome = null;
let selectedPalette = null;
let frogBounds = null; // stores frog hitbox
let showTooltip = false;

// Vial UI (poison indicator)
let vialEmptyImg, vialMildImg, vialFullImg;
let vialBounds = null; // stores vial hitbox
let showVialTooltip = false;

// Hand comparison (top-right)
let handImg;
let handPanelBounds = null;
let showHandTooltip = false;

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

  // Poison indicator vials
  vialEmptyImg = loadImage("vial_empty.png");
  vialMildImg = loadImage("vial_mild.png");
  vialFullImg = loadImage("vial_full.png");


  // Hand (size comparison)
  handImg = loadImage("hand.png");
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
  // Default screen: white background + frog outline (no colors, no tooltip, no vial)
  if (!selectedFrog) {
    background(255);

    const cx = width / 2;
    const bottomY = height - 18;

    // Match sizing logic used in scenes
    const baseTargetW = min(width * 0.58, 560);

    // Use a reasonable default size so outline matches the other scenes
    const MIN_CM = 2;   // smallest frog
    const MAX_CM = 32;  // largest frog
    const defaultCm = 5;

    const sizeFactor = map(defaultCm, MIN_CM, MAX_CM, 0.35, 1.2, true);
    const s = (baseTargetW / CROP.sw) * sizeFactor;

    // Top-right hand size comparison (default)
    drawHandComparison(defaultCm);

    // Hover tooltip for the hand comparison panel
    showHandTooltip = false;
    if (handPanelBounds &&
        mouseX >= handPanelBounds.left && mouseX <= handPanelBounds.right &&
        mouseY >= handPanelBounds.top && mouseY <= handPanelBounds.bottom) {
      showHandTooltip = true;
      drawHandTooltip(mouseX + 12, mouseY + 12, `${nf(defaultCm,0,1)} cm`);
    }


    drawOutline(cx, bottomY, s);
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

  // Top-right hand size comparison (current frog)
  drawHandComparison(avgSize);

  // Define realistic min/max frog sizes in your dataset
  const MIN_CM = 2;   // smallest frog
  const MAX_CM = 32;  // largest frog

  // Map frog size to a scale factor
  const sizeFactor = map(avgSize, MIN_CM, MAX_CM, 0.35, 1.2, true);

  const s = (baseTargetW / CROP.sw) * sizeFactor;

  const pal = selectedPalette;

  // Calculate frog bounding box
    const frogW = CROP.sw * s;
    const frogH = CROP.sh * s;

    frogBounds = {
      left: cx - frogW / 2,
      right: cx + frogW / 2,
      top: bottomY - frogH,
      bottom: bottomY
    };

    // Detect hover
  showTooltip = false;
  showVialTooltip = false;

    if (selectedFrog) {
      if (
        mouseX >= frogBounds.left &&
        mouseX <= frogBounds.right &&
        mouseY >= frogBounds.top &&
        mouseY <= frogBounds.bottom
      ) {
        showTooltip = true;
      }
    }

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
  
  if (showTooltip && selectedFrog) {
  drawTooltip(mouseX + 15, mouseY + 15, selectedFrog);
}

  // Draw poison vial bottom-right (and its own hover tooltip)
  drawPoisonVial();
  if (showVialTooltip && selectedFrog) {
    drawVialTooltip(selectedFrog);
  }

  // Hover tooltip for hand comparison panel (shows JSON Size)
  showHandTooltip = false;
  if (handPanelBounds &&
      mouseX >= handPanelBounds.left && mouseX <= handPanelBounds.right &&
      mouseY >= handPanelBounds.top && mouseY <= handPanelBounds.bottom) {
    showHandTooltip = true;
    const sizeText = String(selectedFrog["Size"] || `${nf(avgSize,0,1)} cm`);
    drawHandTooltip(mouseX + 12, mouseY + 12, sizeText);
  }
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
    const val = String(e.target.value);

    // Placeholder option ("Select a frog") should reset to default outline screen
    // (Number("") becomes 0, so we must special-case it)
    if (!val) {
      selectedFrog = null;
      selectedBiome = null;
      selectedSize = 5;
      selectedPalette = null;
      showTooltip = false;
      showVialTooltip = false;
      vialBounds = null;
      frogBounds = null;
      return;
    }

    const idx = Number(val);
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
   Hand + Frog Outline comparison (top-right)
----------------------------- */
function drawHandComparison(frogCm) {
  if (!handImg || !outlineImg) return;

  const HAND_CM = 19.3;
  const margin = 18;
  const gap = 14;

  // Panel size (responsive)
  const handH = constrain(height * 0.22, 120, 300);
  const handW = handH * (handImg.width / handImg.height);

  const ratio = constrain(frogCm / HAND_CM, 0.05, 2.2);
  const frogH = handH * ratio;
  const frogW = frogH * (CROP.sw / CROP.sh);

  // Layout (top-right), align bottoms
  let panelTop = margin;
  let baseY = panelTop + handH;

  // Avoid dropdown overlap
  const dropdownEl = document.getElementById("dropdown");
  if (dropdownEl) {
    const r = dropdownEl.getBoundingClientRect();
    const dd = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };

    const handX0 = width - margin - handW;
    const frogX0 = handX0 - gap - frogW;

    const pLeft0 = Math.min(frogX0, handX0) - 10;
    const pRight0 = handX0 + handW + 10;
    const pTop0 = panelTop - 10;
    const pBottom0 = baseY + 10;

    const overlaps = pLeft0 < dd.right && pRight0 > dd.left && pTop0 < dd.bottom && pBottom0 > dd.top;
    if (overlaps) {
      panelTop = dd.bottom + 12;
      baseY = panelTop + handH;
    }
  }

  const handX = width - margin - handW;
  const handY = panelTop;

  let frogX = handX - gap - frogW;
  let frogY = baseY - frogH;
  if (frogX < margin) frogX = margin;

  const panelLeft = min(frogX, handX) - 10;
  const panelTopRect = panelTop - 10;
  const panelRight = handX + handW + 10;
  const panelBottom = baseY + 10;

  handPanelBounds = { left: panelLeft, right: panelRight, top: panelTopRect, bottom: panelBottom };

  push();
  noTint();
  noStroke();
  fill(255, 65);
  rect(panelLeft, panelTopRect, panelRight - panelLeft, panelBottom - panelTopRect, 12);

  image(outlineImg, frogX, frogY, frogW, frogH);
  image(handImg, handX, handY, handW, handH);
  pop();
}

function drawHandTooltip(x, y, sizeText) {
  push();

  const HAND_CM = 19.3;
  const HAND_IN = 7.6;

  const padding = 12;
  const lineSpacing = 18;
  const boxW = 310;

  textSize(14);
  textAlign(LEFT, TOP);

  const lines = [
    `Frog size: ${sizeText || "N/A"}`,
    `Hand reference: ${HAND_CM} cm (${HAND_IN} in)`
  ];

  const boxH = padding * 2 + lines.length * lineSpacing;

  if (x + boxW > width) x = width - boxW - 10;
  if (y + boxH > height) y = height - boxH - 10;
  if (x < 10) x = 10;
  if (y < 10) y = 10;

  fill(0, 200);
  stroke(255);
  rect(x, y, boxW, boxH, 12);

  noStroke();
  fill(255);
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], x + padding, y + padding + i * lineSpacing);
  }

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

  const raw = String(frog["Size"]);
  const cmPartMatch = raw.match(/^(.*?\bcm\b)/i);
  const cmPart = cmPartMatch ? cmPartMatch[1] : raw;

  const nums = cmPart.match(/[\d.]+/g);
  if (!nums || nums.length === 0) return 5;

  const values = nums.map(Number).filter((n) => Number.isFinite(n));
  if (!values.length) return 5;

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

function drawTooltip(x, y, frog) {
  push();

  const padding = 14;
  const maxWidth = 340;   // maximum tooltip width
  const lineSpacing = 18;

  textSize(14);
  textAlign(LEFT, TOP);

  // Exclude rendering-only color keys
  const excludedKeys = [
    "Back color",
    "Belly color",
    "Feet color",
    "Toe color",
    "Eye color",
    "Iris color",
    "Spot color",
    "Line color",
    "Is poisonous?",
    "Size"
  ];

  const entries = Object.entries(frog)
    .filter(([key]) => !excludedKeys.includes(key));

  // Build wrapped lines
  let wrappedLines = [];

  for (let [key, value] of entries) {
    let fullText = `${key}: ${value}`;

    // Wrap text to fit inside maxWidth
    let words = fullText.split(" ");
    let currentLine = "";

    for (let word of words) {
      let testLine = currentLine + word + " ";
      if (textWidth(testLine) > maxWidth - padding * 2) {
        wrappedLines.push(currentLine);
        currentLine = word + " ";
      } else {
        currentLine = testLine;
      }
    }

    wrappedLines.push(currentLine);
  }

  // Calculate dynamic height
  const boxHeight = padding * 2 + wrappedLines.length * lineSpacing;
  const boxWidth = maxWidth;

  // Keep tooltip inside screen
  if (x + boxWidth > width) x = width - boxWidth - 10;
  if (y + boxHeight > height) y = height - boxHeight - 10;

  // Background box
  fill(0, 190);
  stroke(255);
  rect(x, y, boxWidth, boxHeight, 12);

  // Draw text
  noStroke();
  fill(255);

  for (let i = 0; i < wrappedLines.length; i++) {
    text(wrappedLines[i], x + padding, y + padding + i * lineSpacing);
  }

  pop();
}

/* -----------------------------
   Poison vial UI (bottom-right)
----------------------------- */
function getPoisonLevel(frog) {
  const raw = frog ? String(frog["Is poisonous?"] || "").toLowerCase() : "";

  if (raw.includes("mild")) return "mild";
  if (raw.startsWith("y")) return "poisonous"; // "yes"
  return "none";
}

function getPoisonLabel(level, frog) {
  const raw = frog ? String(frog["Is poisonous?"] || "") : "";

  if (level === "poisonous") return `Poisonous: ${raw || "Yes"}`;
  if (level === "mild") return `Poisonous: ${raw || "Yes (mild)"}`;
  return "Poisonous: No";
}

function drawPoisonVial() {
  if (!selectedFrog) return;

  const level = getPoisonLevel(selectedFrog);

  let img = vialEmptyImg;
  if (level === "mild") img = vialMildImg;
  else if (level === "poisonous") img = vialFullImg;

  const margin = 24;
  const vialW = 90;
  const vialH = 90;

  const x = width - margin - vialW;
  const y = height - margin - vialH;

  vialBounds = { left: x, right: x + vialW, top: y, bottom: y + vialH };

  // Hover check for vial
  if (
    mouseX >= vialBounds.left &&
    mouseX <= vialBounds.right &&
    mouseY >= vialBounds.top &&
    mouseY <= vialBounds.bottom
  ) {
    showVialTooltip = true;
  }

  // Draw vial
  push();
  noTint();
  image(img, x, y, vialW, vialH);

  // Optional subtle hover outline
  if (showVialTooltip) {
    noFill();
    stroke(255);
    strokeWeight(2);
    rect(x - 6, y - 6, vialW + 12, vialH + 12, 10);
  }
  pop();
}

function drawVialTooltip(frog) {
  if (!vialBounds || !frog) return;

  const level = getPoisonLevel(frog);
  const label = getPoisonLabel(level, frog);

  push();
  textSize(14);
  textAlign(LEFT, TOP);

  const padding = 12;
  const maxWidth = 260;

  // Wrap label if needed
  const words = label.split(" ");
  let lines = [];
  let line = "";
  for (const w of words) {
    const test = (line + w + " ").trimEnd();
    if (textWidth(test) > maxWidth - padding * 2 && line.length) {
      lines.push(line.trimEnd());
      line = w + " ";
    } else {
      line += w + " ";
    }
  }
  if (line.trim().length) lines.push(line.trimEnd());

  const lineH = 18;
  const boxW = maxWidth;
  const boxH = padding * 2 + lines.length * lineH;

  // Position tooltip just above-left of the vial, but keep on-screen
  let x = vialBounds.left - boxW - 12;
  let y = vialBounds.top - boxH - 12;

  if (x < 10) x = 10;
  if (y < 10) y = 10;

  fill(0, 190);
  stroke(255);
  rect(x, y, boxW, boxH, 12);

  noStroke();
  fill(255);
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], x + padding, y + padding + i * lineH);
  }

  pop();
}
