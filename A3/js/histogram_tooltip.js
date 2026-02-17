let table;
let bins = [];
let edges = [];
let hoveredBin = -1;

const COL = "Total_Sales";
const BIN_COUNT = 30;

// Consistent sizing (match ECDF/boxplot)
const W = 900, H = 550;
const margin = { l: 90, r: 40, t: 60, b: 80 };
let chartW, chartH;

// cached for ticks
let maxC = 0;
let maxX = 0;

function preload() {
  table = loadTable("data/Online-eCommerce_A3_clean.csv", "csv", "header");
}

function setup() {
  createCanvas(W, H);
  chartW = width - margin.l - margin.r;
  chartH = height - margin.t - margin.b;
  buildHistogram();
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

function buildHistogram() {
  const values = [];
  for (let r = 0; r < table.getRowCount(); r++) {
    const v = parseFloat(table.getString(r, COL));
    if (!isNaN(v)) values.push(v);
  }

  // ---- Use consistent x-range: 0 -> padded max ----
  const minV = 0;
  const rawMax = max(values);
  maxX = rawMax * 1.05; // 5% padding
  const step = (maxX - minV) / BIN_COUNT;

  bins = new Array(BIN_COUNT).fill(0);
  edges = [];
  for (let i = 0; i <= BIN_COUNT; i++) edges.push(minV + i * step);

  for (const v of values) {
    // values below 0 (unlikely for sales) clamp to first bin
    let idx = floor((v - minV) / step);
    idx = constrain(idx, 0, BIN_COUNT - 1);
    bins[idx]++;
  }

  maxC = max(bins);
}

function draw() {
  background(255);

  hoveredBin = -1;

  // mapping helpers
  const xMap = v => map(v, 0, maxX, margin.l, margin.l + chartW);
  const yMap = c => map(c, 0, maxC, margin.t + chartH, margin.t);

  // ---- Grid (vertical + horizontal) ----
  const xStep = niceStep(maxX, 7);
  const yStep = max(1, floor(niceStep(maxC, 6)));

  stroke(235);
  strokeWeight(1);

  // horizontal grid
  for (let v = 0; v <= maxC; v += yStep) {
    const y = yMap(v);
    line(margin.l, y, margin.l + chartW, y);
  }

  // vertical grid
  for (let v = 0; v <= maxX; v += xStep) {
    const x = xMap(v);
    line(x, margin.t, x, margin.t + chartH);
  }

  // ---- Axes ----
  stroke(0);
  line(margin.l, margin.t, margin.l, margin.t + chartH);
  line(margin.l, margin.t + chartH, margin.l + chartW, margin.t + chartH);

  // ---- Tick labels ----
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

  // y ticks
  textAlign(RIGHT, CENTER);
  for (let v = 0; v <= maxC; v += yStep) {
    const y = yMap(v);
    stroke(0);
    line(margin.l - 6, y, margin.l, y);
    noStroke();
    text(v, margin.l - 10, y);
  }

  // ---- Bars + hover detection ----
  const barW = chartW / bins.length;

  for (let i = 0; i < bins.length; i++) {
    const count = bins[i];
    const barH = map(count, 0, maxC, 0, chartH);

    const x = margin.l + i * barW;
    const y = margin.t + chartH - barH;

    const over =
      mouseX >= x && mouseX <= x + barW &&
      mouseY >= y && mouseY <= margin.t + chartH;

    if (over) hoveredBin = i;

    noStroke();
    fill(over ? 60 : 120);
    rect(x, y, barW - 1, barH);
  }

  // ---- Titles/labels ----
  noStroke();
  fill(0);
  textAlign(LEFT, BASELINE);
  textSize(18);
  text(`Histogram of ${COL}`, margin.l, 30);

  textSize(12);
  textAlign(CENTER, TOP);
  text(COL, margin.l + chartW / 2, margin.t + chartH + 40);

  push();
  translate(25, margin.t + chartH / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, TOP);
  text("Count", 0, 0);
  pop();

  // ---- Tooltip ----
  if (hoveredBin !== -1) {
    const lo = edges[hoveredBin];
    const hi = edges[hoveredBin + 1];
    const count = bins[hoveredBin];

    drawTooltip(
      `Bin range:\n${lo.toFixed(0)} – ${hi.toFixed(0)}\nCount: ${count}`,
      mouseX, mouseY
    );
  }
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
