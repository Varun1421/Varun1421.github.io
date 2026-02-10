// Dot plot: Total Sales by Brand
// Expects a CSV in the same folder named: brands_sales.csv
// CSV format (with header):
// Brand,TotalSales

let table;
let data = [];

// Canvas
const W = 1100;
const H = 520;

// Margins
const margin = { top: 50, right: 40, bottom: 100, left: 220 };

function preload() {
  table = loadTable("brands_sales.csv", "csv", "header");
}

function setup() {
  const canvas = createCanvas(W, H);
  canvas.parent("sketch-holder");
  textFont("Arial");

  // Read data
  data = [];
  for (let r = 0; r < table.getRowCount(); r++) {
    const brand = table.getString(r, "Brand");
    const salesRaw = table.getString(r, "TotalSales");
    const sales = Number(String(salesRaw).replace(/,/g, ""));
    if (brand && !isNaN(sales)) data.push({ brand, sales });
  }

  // Sort descending by sales (highest at top)
  data.sort((a, b) => b.sales - a.sales);

  noLoop();
}

function draw() {
  background(255);

  if (data.length === 0) {
    fill(0);
    textSize(16);
    text("No data loaded. Check brands_sales.csv file path/name.", 30, 40);
    return;
  }

  const maxSales = max(data.map((d) => d.sales));

  // Plot area
  const x0 = margin.left;
  const x1 = width - margin.right;
  const y0 = margin.top;
  const y1 = height - margin.bottom;

  // Title
  fill(0);
  noStroke();
  textSize(18);
  textAlign(LEFT, CENTER);
  text("Dot Plot — Total Sales by Brand", margin.left, 22);

  // --- Nice tick scale (linear, "normal") ---
  // Choose a nice step so ticks land on clean numbers (e.g., 0, 2M, 4M, ...)
  const desiredTicks = 8;
  const tickStep = niceStep(maxSales / desiredTicks);
  const axisMax = Math.ceil(maxSales / tickStep) * tickStep; // round up to nice tick

  // X scale (linear)
  const xScale = (v) => map(v, 0, axisMax, x0, x1);

  // Row spacing
  const rowStep = data.length > 1 ? (y1 - y0) / (data.length - 1) : 0;

  // --- Gridlines (draw first, behind everything) ---
  // Vertical gridlines at ticks
  stroke(230);
  strokeWeight(1);
  for (let v = 0; v <= axisMax + 0.0001; v += tickStep) {
    const x = xScale(v);
    line(x, y0, x, y1);
  }

  // Horizontal gridlines at each row
  stroke(245);
  strokeWeight(1);
  for (let i = 0; i < data.length; i++) {
    const y = y0 + i * rowStep;
    line(x0, y, x1, y);
  }

  // --- Axes on top of grid ---
  stroke(0);
  strokeWeight(1);
  line(x0, y1, x1, y1); // x-axis
  line(x0, y0, x0, y1); // y-axis

  // --- X ticks + labels (nice clean values) ---
  textSize(12);
  fill(0);
  for (let v = 0; v <= axisMax + 0.0001; v += tickStep) {
    const x = xScale(v);

    // tick mark
    stroke(0);
    line(x, y1, x, y1 + 6);

    // label
    noStroke();
    textAlign(CENTER, TOP);
    text(formatMillions(v), x, y1 + 10);
  }

  // Axis labels
  noStroke();
  fill(0);
  textSize(14);
  textAlign(CENTER, TOP);
  text("Total Sales", (x0 + x1) / 2, height - margin.bottom + 40);

  // Y-axis title (kept away from brand names)
  push();
  translate(margin.left - 190, (y0 + y1) / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, CENTER);
  text("Brand", 0, 0);
  pop();

  // --- Points + brand labels ---
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const y = y0 + i * rowStep;
    const x = xScale(d.sales);

    // Brand labels: right-aligned just left of y-axis
    fill(0);
    noStroke();
    textSize(13);
    textAlign(RIGHT, CENTER);
    text(d.brand, x0 - 12, y);

    // Dot
    stroke(40);
    strokeWeight(1);
    fill(70, 130, 180);
    circle(x, y, 14);

    // Value label above/below alternating
    noStroke();
    fill(0);
    textSize(12);
    textAlign(CENTER, CENTER);
    const vLabel = (d.sales / 1_000_000).toFixed(2) + "M";
    const yOffset = i % 2 === 0 ? -14 : 14;
    text(vLabel, x, y + yOffset);
  }

  // Note
  noStroke();
  fill(120);
  textSize(11);
  textAlign(LEFT, TOP);
  text(
    "Data source: brands_sales.csv (exported/aggregated from Online-eCommerce dataset)",
    margin.left,
    height - 10
  );
}

// ---------- Helpers ----------

// Picks a "nice" step size: 1, 2, 2.5, 5, 10 * 10^n
function niceStep(rawStep) {
  if (rawStep <= 0) return 1;

  const exp = Math.floor(Math.log10(rawStep));
  const base = Math.pow(10, exp);
  const f = rawStep / base;

  let niceF;
  if (f <= 1) niceF = 1;
  else if (f <= 2) niceF = 2;
  else if (f <= 2.5) niceF = 2.5;
  else if (f <= 5) niceF = 5;
  else niceF = 10;

  return niceF * base;
}

// Formats tick labels in millions cleanly (0M, 2M, 4M, 6M...)
function formatMillions(v) {
  const m = v / 1_000_000;
  // show no decimals for clean ticks unless needed
  if (Math.abs(m - Math.round(m)) < 1e-9) return Math.round(m) + "M";
  return m.toFixed(1) + "M";
}
