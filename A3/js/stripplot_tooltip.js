let table;

const CAT_COL = "Category";
const VAL_COL = "Total_Sales";

let groups = {};
let cats = [];
let allVals = [];
let points = []; // store drawn points for tooltip

function preload() {
  table = loadTable("data/Online-eCommerce_A3_clean.csv", "csv", "header");
}

function setup() {
  createCanvas(1050, 580);
  buildGroups();
}

function buildGroups() {
  groups = {};
  allVals = [];

  for (let r = 0; r < table.getRowCount(); r++) {
    const cat = table.getString(r, CAT_COL);
    const v = parseFloat(table.getString(r, VAL_COL));
    if (!cat || isNaN(v)) continue;

    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(v);
    allVals.push(v);
  }

  // top 10 categories for readability
  cats = Object.keys(groups)
    .sort((a, b) => groups[b].length - groups[a].length)
    .slice(0, 10);
}

function draw() {
  background(255);
  points = [];

  const margin = { l: 80, r: 30, t: 40, b: 110 };
  const w = width - margin.l - margin.r;
  const h = height - margin.t - margin.b;

  const minV = min(allVals);
  const maxV = max(allVals);

  function yMap(v) {
    return map(v, minV, maxV, margin.t + h, margin.t);
  }

  // grid
  stroke(220);
  for (let i = 0; i <= 10; i++) {
    const y = margin.t + (h * i) / 10;
    line(margin.l, y, margin.l + w, y);
  }

  // axes
  stroke(0);
  line(margin.l, margin.t, margin.l, margin.t + h);
  line(margin.l, margin.t + h, margin.l + w, margin.t + h);

  const step = w / cats.length;

  // draw points with jitter (random)
  noStroke();
  fill(0, 0, 0, 110);

  for (let i = 0; i < cats.length; i++) {
    const cat = cats[i];
    const xCenter = margin.l + (i + 0.5) * step;

    for (let v of groups[cat]) {
      const y = yMap(v);
      const xJ = random(-step * 0.18, step * 0.18); // jitter
      const px = xCenter + xJ;
      const py = y;
      circle(px, py, 5);

      points.push({ px, py, cat, v });
    }
  }

  // labels
  noStroke();
  fill(0);
  textSize(16);
  text("Interactive Strip Plot — Total_Sales by Category (hover points)", margin.l, 25);

  textSize(12);
  textAlign(CENTER);
  text("Category (top 10)", margin.l + w / 2, height - 25);

  push();
  translate(25, margin.t + h / 2);
  rotate(-HALF_PI);
  text(VAL_COL, 0, 0);
  pop();

  // category labels
  for (let i = 0; i < cats.length; i++) {
    const x = margin.l + (i + 0.5) * step;
    push();
    translate(x, margin.t + h + 10);
    rotate(radians(25));
    text(cats[i], 0, 20);
    pop();
  }

  // tooltip: nearest point under mouse
  const hit = findNearestPoint(mouseX, mouseY, 8);
  if (hit) {
    drawTooltip(`${hit.cat}\n${VAL_COL}: ${hit.v.toFixed(0)}`, mouseX, mouseY);
  }
}

function findNearestPoint(mx, my, radius) {
  let best = null;
  let bestD = radius;

  for (let p of points) {
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
