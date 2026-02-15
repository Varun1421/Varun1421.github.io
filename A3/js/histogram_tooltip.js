let table;
let bins = [];
let edges = [];
let hoveredBin = -1;

const COL = "Total_Sales";
const BIN_COUNT = 30;

function preload() {
  table = loadTable("data/Online-eCommerce_A3_clean.csv", "csv", "header");
}

function setup() {
  createCanvas(950, 520);
  buildHistogram();
}

function buildHistogram() {
  const values = [];
  for (let r = 0; r < table.getRowCount(); r++) {
    const v = parseFloat(table.getString(r, COL));
    if (!isNaN(v)) values.push(v);
  }

  const minV = min(values);
  const maxV = max(values);
  const step = (maxV - minV) / BIN_COUNT;

  bins = new Array(BIN_COUNT).fill(0);
  edges = [];
  for (let i = 0; i <= BIN_COUNT; i++) edges.push(minV + i * step);

  for (const v of values) {
    let idx = floor((v - minV) / step);
    idx = constrain(idx, 0, BIN_COUNT - 1);
    bins[idx]++;
  }
}

function draw() {
  background(255);

  const margin = { l: 70, r: 20, t: 40, b: 70 };
  const w = width - margin.l - margin.r;
  const h = height - margin.t - margin.b;

  // faint grid
  stroke(220);
  strokeWeight(1);
  for (let i = 0; i <= 10; i++) {
    const y = margin.t + (h * i) / 10;
    line(margin.l, y, margin.l + w, y);
  }

  // axes
  stroke(0);
  line(margin.l, margin.t, margin.l, margin.t + h);
  line(margin.l, margin.t + h, margin.l + w, margin.t + h);

  // bars + hover detection
  const maxC = max(bins);
  const barW = w / bins.length;
  hoveredBin = -1;

  for (let i = 0; i < bins.length; i++) {
    const barH = map(bins[i], 0, maxC, 0, h);
    const x = margin.l + i * barW;
    const y = margin.t + h - barH;

    const over =
      mouseX >= x && mouseX <= x + barW &&
      mouseY >= y && mouseY <= margin.t + h;

    if (over) hoveredBin = i;

    noStroke();
    fill(over ? 60 : 100);
    rect(x, y, barW - 1, barH);
  }

  // labels
  noStroke();
  fill(0);
  textSize(16);
  text("Interactive Histogram — Total_Sales (hover bars)", margin.l, 25);

  textSize(12);
  textAlign(CENTER);
  text("Total_Sales", margin.l + w / 2, height - 25);

  push();
  translate(20, margin.t + h / 2);
  rotate(-HALF_PI);
  text("Count", 0, 0);
  pop();

  // tooltip
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
