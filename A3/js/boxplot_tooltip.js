let table;

const COL = "Total_Sales";

let vals = [];
let stats = null;

// store outliers as objects with stable jittered x positions
let outlierPts = [];
let hoveredPt = null;

const W = 700, H = 560;
const margin = { l: 110, r: 40, t: 60, b: 90 };
let chartW, chartH;

function preload() {
  table = loadTable("data/Online-eCommerce_A3_clean.csv", "csv", "header");
}

function setup() {
  createCanvas(W, H);
  chartW = width - margin.l - margin.r;
  chartH = height - margin.t - margin.b;

  computeBoxStats();
  buildStableOutlierPoints();
}

function quantile(sortedArr, q) {
  const pos = (sortedArr.length - 1) * q;
  const base = floor(pos);
  const rest = pos - base;
  if (sortedArr[base + 1] !== undefined) {
    return sortedArr[base] + rest * (sortedArr[base + 1] - sortedArr[base]);
  }
  return sortedArr[base];
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

function computeBoxStats() {
  vals = [];
  for (let r = 0; r < table.getRowCount(); r++) {
    const v = parseFloat(table.getString(r, COL));
    if (!isNaN(v)) vals.push(v);
  }
  vals.sort((a, b) => a - b);

  const minV = vals[0];
  const q1 = quantile(vals, 0.25);
  const med = quantile(vals, 0.50);
  const q3 = quantile(vals, 0.75);
  const maxV = vals[vals.length - 1];

  const iqr = q3 - q1;
  const lowFence = q1 - 1.5 * iqr;
  const highFence = q3 + 1.5 * iqr;

  // whiskers = most extreme non-outlier points
  let whiskLow = minV;
  let whiskHigh = maxV;
  for (let v of vals) {
    if (v >= lowFence) { whiskLow = v; break; }
  }
  for (let i = vals.length - 1; i >= 0; i--) {
    if (vals[i] <= highFence) { whiskHigh = vals[i]; break; }
  }

  const outliers = vals.filter(v => v < lowFence || v > highFence);

  stats = { minV, q1, med, q3, maxV, iqr, lowFence, highFence, whiskLow, whiskHigh, outliers };
}

function buildStableOutlierPoints() {
  outlierPts = [];

  // stable jitter so hover works
  randomSeed(42);

  const xCenter = margin.l + chartW / 2;
  const jitter = 28;

  for (let v of stats.outliers) {
    const px = xCenter + random(-jitter, jitter);
    outlierPts.push({ v, px });
  }
}

function draw() {
  background(255);
  hoveredPt = null;

  const x = margin.l + chartW / 2;
  const boxW = 170;

  // y mapping: show full min..max range (or start at 0 if you prefer)
  // show box clearly by scaling to fences, not extreme max
const pad = (stats.highFence - stats.lowFence) * 0.08;
const minYVal = max(0, stats.lowFence - pad);
const maxYVal = stats.highFence + pad;


  function yMap(v) {
  const vv = constrain(v, minYVal, maxYVal);
  return map(vv, minYVal, maxYVal, margin.t + chartH, margin.t);
}


  // ---- Grid + Y ticks ----
  const yStep = niceStep(maxYVal - minYVal, 6);
  stroke(235);
  strokeWeight(1);

  // grid lines + tick labels
  textSize(12);
  textAlign(RIGHT, CENTER);
  fill(0);

  for (let tv = Math.ceil(minYVal / yStep) * yStep; tv <= maxYVal; tv += yStep) {
    const y = yMap(tv);
    line(margin.l, y, margin.l + chartW, y);

    stroke(0);
    line(margin.l - 6, y, margin.l, y);
    noStroke();
    text(tv.toFixed(0), margin.l - 10, y);

    stroke(235);
  }

  // ---- Axes ----
  stroke(0);
  line(margin.l, margin.t, margin.l, margin.t + chartH);
  line(margin.l, margin.t + chartH, margin.l + chartW, margin.t + chartH);

  // ---- Boxplot geometry ----
  const yQ1 = yMap(stats.q1);
  const yMed = yMap(stats.med);
  const yQ3 = yMap(stats.q3);
  const yWL = yMap(stats.whiskLow);
  const yWH = yMap(stats.whiskHigh);

  stroke(0);
  strokeWeight(2);
  noFill();
  rectMode(CORNERS);

  // whisker line
  line(x, yWH, x, yWL);
  // caps
  line(x - boxW / 3, yWH, x + boxW / 3, yWH);
  line(x - boxW / 3, yWL, x + boxW / 3, yWL);

  // box
  rect(x - boxW / 2, yQ3, x + boxW / 2, yQ1);
  // median
  line(x - boxW / 2, yMed, x + boxW / 2, yMed);

  // ---- Outliers (stable) ----
  noStroke();
  fill(220, 0, 0, 170);

  for (let p of outlierPts) {
    const py = yMap(p.v);
    circle(p.px, py, 7);

    if (dist(mouseX, mouseY, p.px, py) <= 9) {
      hoveredPt = { v: p.v };
    }
  }

  // ---- Titles/labels ----
  noStroke();
  fill(0);
  textSize(18);
  textAlign(LEFT, BASELINE);
  text(`Box Plot — ${COL} (Outliers Highlighted: ${stats.outliers.length})`, margin.l, 30);

textSize(12);
textAlign(LEFT, TOP);
text(`Outlier points drawn: ${outlierPts.length}`, margin.l, 40);


  textSize(12);
  textAlign(CENTER, TOP);
  text(COL, width / 2, height - 30);

  push();
  translate(25, margin.t + chartH / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, TOP);
  text("Value", 0, 0);
  pop();

  // summary line
  textAlign(LEFT, TOP);
  textSize(12);
  text(
    `Q1=${stats.q1.toFixed(2)}  Median=${stats.med.toFixed(2)}  Q3=${stats.q3.toFixed(2)}  IQR=${stats.iqr.toFixed(2)}`,
    margin.l, height - 70
  );

  // tooltip
  if (hoveredPt) {
    drawTooltip(`Outlier\n${COL}: ${hoveredPt.v.toFixed(2)}`, mouseX, mouseY);
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
