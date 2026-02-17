let table;

// Use Total_Sales for real outliers (Quantity often has none)
const COL = "Total_Sales"; // <-- change to "Quantity" if you insist

let vals = [];
let outliers = [];      // array of { v, jx } where jx is stable jitter
let stats = null;
let hoveredPt = null;

// Canvas + margins (consistent with other charts)
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
  computeBoxStats();
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

  // Outliers + stable jitter value (so they don't jump each frame)
  outliers = [];
  for (let i = 0; i < vals.length; i++) {
    const v = vals[i];
    if (v < lowFence || v > highFence) {
      // stable pseudo-random jitter based on index + value
      const seed = (i * 97 + Math.floor(v * 1000)) % 1000;
      const jx = map(seed, 0, 999, -30, 30);
      outliers.push({ v, jx });
    }
  }

  stats = { minV, q1, med, q3, maxV, iqr, lowFence, highFence, whiskLow, whiskHigh };
}

function draw() {
  background(255);

  // ---- Better scale choice ----
  // Use fences as the visible range so the "box" is readable.
  // Add a little padding so it doesn't touch edges.
  const pad = (stats.highFence - stats.lowFence) * 0.08;
  const yMin = max(0, stats.lowFence - pad);     // clamp at 0 for sales-like data
  const yMax = stats.highFence + pad;

  function yMap(v) {
    // clamp to visible area so extreme outliers stay on chart
    const vv = constrain(v, yMin, yMax);
    return map(vv, yMin, yMax, margin.t + chartH, margin.t);
  }

  // ---- Grid + ticks (nice numbers) ----
  const step = niceStep(yMax);
  stroke(235);
  for (let v = 0; v <= yMax; v += step) {
    const y = map(v, yMin, yMax, margin.t + chartH, margin.t);
    line(margin.l, y, margin.l + chartW, y);
  }

  // Axes
  stroke(0);
  line(margin.l, margin.t, margin.l, margin.t + chartH);
  line(margin.l, margin.t + chartH, margin.l + chartW, margin.t + chartH);

  // Y axis ticks/labels
  noStroke();
  fill(0);
  textSize(12);
  textAlign(RIGHT, CENTER);
  for (let v = 0; v <= yMax; v += step) {
    const y = map(v, yMin, yMax, margin.t + chartH, margin.t);
    stroke(0);
    line(margin.l - 6, y, margin.l, y);
    noStroke();
    text(Math.round(v), margin.l - 10, y);
  }

  // ---- Box plot drawing ----
  const x = margin.l + chartW / 2;
  const boxW = 180;

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

  // ---- Outliers (stable jitter, hoverable) ----
  hoveredPt = null;
  noStroke();
  fill(220, 0, 0, 170);

  for (let p of outliers) {
    const px = x + p.jx;
    const py = yMap(p.v);
    circle(px, py, 7);

    if (dist(mouseX, mouseY, px, py) <= 7) {
      hoveredPt = { v: p.v, px, py };
    }
  }

  // ---- Title & labels ----
  noStroke();
  fill(0);
  textAlign(LEFT, BASELINE);
  textSize(18);
  text(`Box Plot of ${COL}`, margin.l, 30);

  textSize(12);
  textAlign(CENTER, TOP);
  text(COL, margin.l + chartW / 2, margin.t + chartH + 40);

  // Small caption (clean)
  textAlign(LEFT, TOP);
  text(
    `Outliers: ${outliers.length}   (IQR fences: < ${stats.lowFence.toFixed(2)}  or  > ${stats.highFence.toFixed(2)})`,
    margin.l, height - 40
  );

  // Tooltip
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
