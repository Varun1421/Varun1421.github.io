let table;
const COL = "Total_Sales";

let xs = [];   // sorted values
let hovered = null;

function preload() {
  table = loadTable("data/Online-eCommerce_A3_clean.csv", "csv", "header");
}

function setup() {
  createCanvas(950, 520);
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

function draw() {
  background(255);
  hovered = null;

  const margin = { l: 70, r: 20, t: 40, b: 70 };
  const w = width - margin.l - margin.r;
  const h = height - margin.t - margin.b;

  const minX = xs[0];
  const maxX = xs[xs.length - 1];

  function xMap(v) { return map(v, minX, maxX, margin.l, margin.l + w); }
  function yMap(p) { return map(p, 0, 1, margin.t + h, margin.t); }

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

  // ECDF line
  stroke(0);
  strokeWeight(2);
  noFill();

  beginShape();
  for (let i = 0; i < xs.length; i++) {
    const p = (i + 1) / xs.length;
    vertex(xMap(xs[i]), yMap(p));
  }
  endShape();

  // hover: find nearest x by mouse x
  const mx = mouseX;
  if (mx >= margin.l && mx <= margin.l + w) {
    // binary search-ish: estimate index by proportion, then adjust
    const targetX = map(mx, margin.l, margin.l + w, minX, maxX);
    let idx = nearestIndex(xs, targetX);
    const p = (idx + 1) / xs.length;
    const px = xMap(xs[idx]);
    const py = yMap(p);

    if (dist(mouseX, mouseY, px, py) < 12) hovered = { idx, x: xs[idx], p, px, py };

    // draw marker anyway (nice UX)
    noStroke();
    fill(0);
    circle(px, py, 6);

    if (hovered) {
      drawTooltip(`${COL}: ${hovered.x.toFixed(0)}\nECDF: ${hovered.p.toFixed(3)}`, mouseX, mouseY);
    }
  }

  // labels
  noStroke();
  fill(0);
  textSize(16);
  text("ECDF — Total_Sales (hover near curve)", margin.l, 25);

  textSize(12);
  textAlign(CENTER);
  text(COL, margin.l + w / 2, height - 25);

  push();
  translate(20, margin.t + h / 2);
  rotate(-HALF_PI);
  text("F(x)", 0, 0);
  pop();
}

function nearestIndex(arr, x) {
  // returns index of closest value to x in sorted arr
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
