let table;

const COL = "Quantity";
let vals = [];
let outliers = [];
let stats = null;
let hoveredPt = null;

function preload() {
  table = loadTable("data/Online-eCommerce_A3_clean.csv", "csv", "header");
}

function setup() {
  createCanvas(700, 560);
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

  // whiskers should be the most extreme non-outlier points
  let whiskLow = minV;
  let whiskHigh = maxV;
  for (let v of vals) {
    if (v >= lowFence) { whiskLow = v; break; }
  }
  for (let i = vals.length - 1; i >= 0; i--) {
    if (vals[i] <= highFence) { whiskHigh = vals[i]; break; }
  }

  outliers = vals.filter(v => v < lowFence || v > highFence);

  stats = { minV, q1, med, q3, maxV, iqr, lowFence, highFence, whiskLow, whiskHigh };
}

function draw() {
  background(255);

  const margin = { l: 90, r: 40, t: 40, b: 80 };
  const w = width - margin.l - margin.r;
  const h = height - margin.t - margin.b;

  // map value -> y (use min..max to show all points)
  function yMap(v) {
    return map(v, stats.minV, stats.maxV, margin.t + h, margin.t);
  }

  // faint grid
  stroke(220);
  for (let i = 0; i <= 10; i++) {
    const y = margin.t + (h * i) / 10;
    line(margin.l, y, margin.l + w, y);
  }

  // axes
  stroke(0);
  line(margin.l, margin.t, margin.l, margin.t + h);
  line(margin.l, margin.t + h, margin.l + w, margin.t + h);

  // boxplot center
  const x = margin.l + w / 2;
  const boxW = 170;

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

  // outliers (highlighted)
  hoveredPt = null;
  noStroke();
  fill(220, 0, 0, 170);

  // We'll draw them slightly jittered in x so they don't overlap
  for (let v of outliers) {
    const px = x + random(-30, 30);
    const py = yMap(v);
    circle(px, py, 7);

    if (dist(mouseX, mouseY, px, py) <= 7) {
      hoveredPt = { v, px, py };
    }
  }

  // titles & labels
  noStroke();
  fill(0);
  textSize(16);
  text("Interactive Box Plot — Quantity (outliers highlighted)", margin.l, 25);

  textSize(12);
  textAlign(CENTER);
  text(COL, width / 2, height - 25);

  push();
  translate(25, margin.t + h / 2);
  rotate(-HALF_PI);
  text("Value", 0, 0);
  pop();

  // show fences (optional but useful)
  textAlign(LEFT);
  text(
    `Q1=${stats.q1.toFixed(2)}  Median=${stats.med.toFixed(2)}  Q3=${stats.q3.toFixed(2)}  IQR=${stats.iqr.toFixed(2)}`,
    margin.l, height - 50
  );
  text(
    `Outlier fences: < ${stats.lowFence.toFixed(2)} or > ${stats.highFence.toFixed(2)} (outliers: ${outliers.length})`,
    margin.l, height - 32
  );

  // tooltip for outliers
  if (hoveredPt) {
    drawTooltip(`Outlier\n${COL}: ${hoveredPt.v}`, mouseX, mouseY);
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
