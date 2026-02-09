// Dot plot: Total Sales by Brand
// Expects a CSV in the same folder named: brand_sales.csv
// CSV format (with header):
// Brand,TotalSales
// Asus,2947594
// MSI,3205254
// ...

let table;
let data = [];

const W = 1000;
const H = 520;

const margin = { top: 50, right: 40, bottom: 70, left: 160 };

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
    const sales = Number(String(salesRaw).replace(/,/g, "")); // safe if commas exist
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
    text("No data loaded. Check brand_sales.csv file path/name.", 30, 40);
    return;
  }

  // Determine range
  const maxSales = max(data.map((d) => d.sales));
  const minSales = min(data.map((d) => d.sales));

  // Plot area
  const x0 = margin.left;
  const x1 = width - margin.right;
  const y0 = margin.top;
  const y1 = height - margin.bottom;

  // Title
  fill(0);
  textSize(18);
  textAlign(LEFT, CENTER);
  text("Dot Plot — Total Sales by Brand", margin.left, 22);

  // X-scale mapping
  const xScale = (v) => map(v, 0, maxSales * 1.05, x0, x1);

  // Y positions
  const rowStep = (y1 - y0) / (data.length - 1);

  // --- Axes ---
  stroke(0);
  strokeWeight(1);

  // X-axis
  line(x0, y1, x1, y1);

  // Y-axis
  line(x0, y0, x0, y1);

  // --- X ticks (in Millions) ---
  const ticks = 8;
  const tickSalesStep = (maxSales * 1.05) / ticks;

  textSize(12);
  fill(0);
  noStroke();

  for (let i = 0; i <= ticks; i++) {
    const v = i * tickSalesStep;
    const x = xScale(v);

    // tick mark
    stroke(0);
    line(x, y1, x, y1 + 6);
    noStroke();

    // label in M
    const label = (v / 1_000_000).toFixed(1) + "M";
    textAlign(CENTER, TOP);
    text(label, x, y1 + 10);
  }

  // Axis labels
  fill(0);
  textSize(14);
  textAlign(CENTER, TOP);
  text("Total Sales", (x0 + x1) / 2, height - margin.bottom + 40);

  push();
  translate(20, (y0 + y1) / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, TOP);
  text("Brand", 0, 0);
  pop();

  // --- Points + brand labels ---
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const y = y0 + i * rowStep;
    const x = xScale(d.sales);

    // brand labels (left)
    fill(0);
    noStroke();
    textSize(13);
    textAlign(LEFT, CENTER);
    text(d.brand, x0 - 140, y);

    // dot
    stroke(40);
    strokeWeight(1);
    fill(70, 130, 180);
    circle(x, y, 14);

    // value label (right of dot, in M)
    noStroke();
    fill(0);
    textSize(12);
    textAlign(LEFT, CENTER);
    const vLabel = (d.sales / 1_000_000).toFixed(2) + "M";
    text(vLabel, x + 10, y);
  }

  // Small note
  noStroke();
  fill(70);
  textSize(12);
  textAlign(LEFT, TOP);
  text(
    "Data source: brand_sales.csv (exported/aggregated from Online-eCommerce dataset)",
    margin.left,
    height - 28
  );
}
