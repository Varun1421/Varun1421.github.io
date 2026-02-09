// Dot plot: Total Sales by Brand
// Expects a CSV in the same folder named: brands_sales.csv
// CSV format (with header):
// Brand, TotalSales
// Asus,2947594
// MSI,3205254
// ...

let table;
let data = [];

// Slightly wider so everything breathes
const W = 1100;
const H = 520;

// Increase left margin so brand labels + axis title fit
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
  textSize(18);
  textAlign(LEFT, CENTER);
  text("Dot Plot — Total Sales by Brand", margin.left, 22);

  // X scale
  const xScale = (v) => map(v, 0, maxSales * 1.05, x0, x1);

  // Row spacing
  const rowStep = (y1 - y0) / (data.length - 1);

  // Axes
  stroke(0);
  strokeWeight(1);
  line(x0, y1, x1, y1); // x-axis
  line(x0, y0, x0, y1); // y-axis

  // X ticks (Millions)
  const ticks = 8;
  const tickSalesStep = (maxSales * 1.05) / ticks;

  textSize(12);
  fill(0);

  for (let i = 0; i <= ticks; i++) {
    const v = i * tickSalesStep;
    const x = xScale(v);

    stroke(0);
    line(x, y1, x, y1 + 6);
    noStroke();

    const label = (v / 1_000_000).toFixed(1) + "M";
    textAlign(CENTER, TOP);
    text(label, x, y1 + 10);
  }

  // Axis labels
  fill(0);
  textSize(14);
  textAlign(CENTER, TOP);
  text("Total Sales", (x0 + x1) / 2, height - margin.bottom + 40);

  // Move Y-axis title LEFT so it doesn't overlap brand names
  push();
  translate(margin.left - 190, (y0 + y1) / 2);  // <— key change
  rotate(-HALF_PI);
  textAlign(CENTER, CENTER);
  text("Brand", 0, 0);
  pop();

  // Points + brand labels
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const y = y0 + i * rowStep;
    const x = xScale(d.sales);

    // Brand labels: align RIGHT just left of the axis
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

    // Value label centered above/below the dot (no crowding)
    noStroke();
    fill(0);
    textSize(12);
    textAlign(CENTER, CENTER);

    const vLabel = (d.sales / 1_000_000).toFixed(2) + "M";
    const yOffset = (i % 2 === 0) ? -14 : 14;
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
