let table;

const CAT_COL = "Category";
const VAL_COL = "Total_Sales";

let groups = {};
let cats = [];
let allVals = [];
let points = []; // precomputed point positions for stable jitter

// consistent canvas + margins
const W = 950, H = 600;
const margin = { l: 110, r: 40, t: 60, b: 140 };
let chartW, chartH;

// scale cache
let maxV = 0;

function preload() {
  table = loadTable("data/Online-eCommerce_A3_clean.csv", "csv", "header");
}

function setup() {
  createCanvas(W, H);
  chartW = width - margin.l - margin.r;
  chartH = height - margin.t - margin.b;

  buildGroupsAndPoints();
}

function niceStep(maxVal, ticks = 6) {
  const raw = maxVal / ticks;
  const pow10 = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow10;
  let step;
  if (n < 1.5) step = 1;
  else if (n < 3) step = 2;
  else if (n < 7) step = 5;
  else step = 10;
  return step * pow10;
}

function buildGroupsAndPoints() {
  groups = {};
  allVals = [];
  points = [];

  // collect data
  for (let r = 0; r < table.getRowCount(); r++) {
    const cat = table.getString(r, CAT_COL);
    const v = parseFloat(table.getString(r, VAL_COL));
    if (!cat || isNaN(v)) continue;

    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(v);
    allVals.push(v);
  }

  // pick top 10 categories by count
  cats = Object.keys(groups)
    .sort((a, b) => groups[b].length - groups[a].length)
    .slice(0, 10);

  // y-scale: 0 -> padded max (consistent with your histogram/ECDF)
  const rawMax = max(allVals);
  maxV = rawMax * 1.05;

  // build stable jitter points ONCE
  const stepX = chartW / cats.length;

  // deterministic jitter so points don't "dance"
  // (optional: change seed number if you want different jitter layout)
  randomSeed(42);

  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i];
    const xCenter = margin.l + (i + 0.5) * stepX;

    for (let v of groups[cat]) {
      const xJ = random(-stepX * 0.18, stepX * 0.18);
      points.push({ cat, v, xCenter, xJ });
    }
  }
}

function draw() {
  background(255);

  const x0 = margin.l;
  const y0 = margin.t + chartH;

  function yMap(v) {
    return map(v, 0, maxV, margin.t + chartH, margin.t);
  }

  // ---- Grid + axes ----
  const yStep = niceStep(maxV, 6);

  stroke(235);
  strokeWeight(1);

  // horizontal grid
  for (let v = 0; v <= maxV; v += yStep) {
    const y = yMap(v);
    line(margin.l, y, margin.l + chartW, y);
  }

  // axes
  stroke(0);
  line(margin.l, margin.t, margin.l, margin.t + chartH);
  line(margin.l, margin.t + chartH, margin.l + chartW, margin.t + chartH);

  // ---- y ticks ----
  noStroke();
  fill(0);
  textSize(12);
  textAlign(RIGHT, CENTER);

  for (let v = 0; v <= maxV; v += yStep) {
    const y = yMap(v);
    stroke(0);
    line(margin.l - 6, y, margin.l, y);
    noStroke();
    text(Math.round(v), margin.l - 10, y);
  }

  // ---- points ----
  const stepX = chartW / cats.length;

  noStroke();
  fill(0, 0, 0, 110);

  for (let p of points) {
    const i = cats.indexOf(p.cat);
    if (i === -1) continue;

    const px = p.xCenter + p.xJ;
    const py = yMap(p.v);
    circle(px, py, 5);

    // store drawn position for tooltip hit-testing
    p.px = px;
    p.py = py;
  }

  // ---- Titles/labels ----
  noStroke();
  fill(0);
  textAlign(LEFT, BASELINE);
  textSize(18);
  text(`Strip Plot of ${VAL_COL} by ${CAT_COL} (Top 10)`, margin.l, 30);

  textSize(12);
  textAlign(CENTER, TOP);
  text("Category", margin.l + chartW / 2, margin.t + chartH + 60);

  push();
  translate(25, margin.t + chartH / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, TOP);
  text(VAL_COL, 0, 0);
  pop();

  // ---- category labels ----
  textSize(12);
  textAlign(CENTER, TOP);

  for (let i = 0; i < cats.length; i++) {
    const x = margin.l + (i + 0.5) * stepX;
    push();
    translate(x, margin.t + chartH + 10);
    rotate(radians(25));
    text(cats[i], 0, 20);
    pop();
  }

  // ---- tooltip: nearest point under mouse ----
  const hit = findNearestPoint(mouseX, mouseY, 8);
  if (hit) {
    drawTooltip(`${hit.cat}\n${VAL_COL}: ${hit.v.toFixed(0)}`, mouseX, mouseY);
  }
}

function findNearestPoint(mx, my, radius) {
  let best = null;
  let bestD = radius;

  for (let p of points) {
    if (p.px === undefined) continue;
    const d = dist(mx, my, p.px, p.py);
    if (d <= bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}

function drawTooltip(msg, x, y) {
  const padding = 8;
  textSize(12);
  textAlign(LEFT, TOP);

  const lines = msg.split("\n");
  const tw = max(lines.map(s => textWidth(s))) + padding * 2;
  const th = lines.length * 16 + padding * 2;

  let tx = x + 12, ty = y + 12;
  if (tx + tw > width) tx = x - tw - 12;
  if (ty + th > height) ty = y - th - 12;

  stroke(0);
  fill(255);
  rect(tx, ty, tw, th);

  noStroke();
  fill(0);
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], tx + padding, ty + padding + i * 16);
  }
}
