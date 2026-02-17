let table;
const COL = "Total_Sales";

let xs = [];   // sorted values
let hovered = null;

// Consistent sizing (matches the other charts if you want)
const W = 900, H = 550;
const margin = { l: 90, r: 40, t: 60, b: 80 };
let chartW, chartH;

function preload() {
  table = loadTable("data/Online-eCommerce_A3_clean.csv", "csv", "header");
}

function setup() {
  createCanvas(W, H);
  chartW = width - margin.l - margin.r;
  chartH = height - margin.t - margin.b;
  buildECDF();
}

function buildECDF() {
  xs = [];
  for (let r = 0; r < table.getRowCount(); r++) {
    const v = parseFloat(table.getString(r, COL));
    if (!isNaN(v)) xs.push(v);
  }
  xs.sort((a, b) => a - b);
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

function draw() {
  background(255);
  hovered = null;

  // --- Scale ---
  const minX = 0;
  const rawMax = xs[xs.length - 1];
  const maxX = rawMax * 1.05; // 5% padding

  function xMap(v) { return map(v, minX, maxX, margin.l, margin.l + chartW); }
  function yMap(p) { return map(p, 0, 1, margin.t + chartH, margin.t); }

  // --- Grid (both directions) ---
  const xStep = niceStep(maxX, 7);

  stroke(235);

  // horizontal grid at 0, .25, .5, .75, 1
  for (let i = 0; i <= 4; i++) {
    const p = i / 4;
    const y = yMap(p);
    line(margin.l, y, margin.l + chartW, y);
  }

  // vertical grid
  for (let v = 0; v <= maxX; v += xStep) {
    const x = xMap(v);
    line(x, margin.t, x, margin.t + chartH);
  }

  // --- Axes ---
  stroke(0);
  line(margin.l, margin.t, margin.l, margin.t + chartH);
  line(margin.l, margin.t + chartH, margin.l + chartW, margin.t + chartH);

  // --- Tick labels ---
  noStroke();
  fill(0);
  textSize(12);

  // x ticks
  textAlign(CENTER, TOP);
  for (let v = 0; v <= maxX; v += xStep) {
    const x = xMap(v);
    stroke(0);
    line(x, margin.t + chartH, x, margin.t + chartH + 6);
    noStroke();
    text(Math.round(v), x, margin.t + chartH + 10);
  }

  // y ticks (0..1)
  textAlign(RIGHT, CENTER);
  for (let i = 0; i <= 4; i++) {
    const p = i / 4;
    const y = yMap(p);
    stroke(0);
    line(margin.l - 6, y, margin.l, y);
    noStroke();
    text(p.toFixed(2), margin.l - 10, y);
  }

  // --- ECDF curve ---
  stroke(0);
  strokeWeight(2);
  noFill();

  beginShape();
  for (let i = 0; i < xs.length; i++) {
    const p = (i + 1) / xs.length;
    vertex(xMap(xs[i]), yMap(p));
  }
  endShape();

  // --- Hover ---
  const mx = mouseX;
  const my = mouseY;

  if (mx >= margin.l && mx <= margin.l + chartW && my >= margin.t && my <= margin.t + chartH) {
    const targetX = map(mx, margin.l, margin.l + chartW, minX, maxX);
    const idx = nearestIndex(xs, targetX);
    const p = (idx + 1) / xs.length;

    const px = xMap(xs[idx]);
    const py = yMap(p);

    // marker
    noStroke();
    fill(0);
    circle(px, py, 6);

    if (dist(mx, my, px, py) < 12) {
      hovered = { idx, x: xs[idx], p, px, py };
      drawTooltip(`${COL}: ${hovered.x.toFixed(0)}\nECDF: ${hovered.p.toFixed(3)}`, mx, my);
    }
  }

  // --- Titles/labels ---
  noStroke();
  fill(0);
  textAlign(LEFT, BASELINE);
  textSize(18);
  text(`ECDF of ${COL}`, margin.l, 30);

  textSize(12);
  textAlign(CENTER, TOP);
  text(COL, margin.l + chartW / 2, margin.t + chartH + 40);

  push();
  translate(25, margin.t + chartH / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, TOP);
  text("F(x)", 0, 0);
  pop();
}

function nearestIndex(arr, x) {
  let lo = 0, hi = arr.length - 1;
  while (hi - lo > 1) {
    const mid = floor((lo + hi) / 2);
    if (arr[mid] < x) lo = mid;
    else hi = mid;
  }
  if (abs(arr[lo] - x) < abs(arr[hi] - x)) return lo;
  return hi;
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
