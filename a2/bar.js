// Bar chart: Total Sales by State
// Expects states_sales.csv with header: State,TotalSales

let table;

// Canvas
const W = 900;
const H = 500;

// Margins (more room for y ticks)
const margin = { top: 40, right: 30, bottom: 80, left: 90 };

function preload() {
  table = loadTable("states_sales.csv", "csv", "header");
}

function setup() {
  const canvas = createCanvas(W, H);
  canvas.parent("sketch-holder");
  textFont("Arial");
  noLoop(); // static chart
}

function draw() {
  background(255);

  if (!table || table.getRowCount() === 0) {
    fill(0);
    textSize(16);
    text("No data loaded. Check states_sales.csv file path/name/headers.", 30, 40);
    return;
  }

  const x0 = margin.left;
  const x1 = width - margin.right;
  const y0 = margin.top;
  const y1 = height - margin.bottom;

  const chartW = x1 - x0;
  const chartH = y1 - y0;

  // Collect values + find max
  let maxSales = 0;
  for (let r = 0; r < table.getRowCount(); r++) {
    const v = Number(String(table.getString(r, "TotalSales")).replace(/,/g, ""));
    if (!isNaN(v)) maxSales = max(maxSales, v);
  }

  // ---- Nice linear y-axis (normal scale) ----
  const desiredTicks = 6;
  const tickStep = niceStep(maxSales / desiredTicks);
  const axisMax = Math.ceil(maxSales / tickStep) * tickStep;

  const yScale = (v) => map(v, 0, axisMax, y1, y0); // higher value -> higher on screen

  // ---- Horizontal gridlines + y tick labels ----
  stroke(235);
  strokeWeight(1);
  fill(0);
  noStroke();
  textSize(12);
  textAlign(RIGHT, CENTER);

  for (let v = 0; v <= axisMax + 0.0001; v += tickStep) {
    const y = yScale(v);

    // gridline
    stroke(235);
    line(x0, y, x1, y);

    // tick label
    noStroke();
    fill(0);
    text(formatMillions(v), x0 - 10, y);
  }

  // ---- Axes (on top of grid) ----
  stroke(0);
  strokeWeight(1);
  line(x0, y0, x0, y1); // y-axis
  line(x0, y1, x1, y1); // x-axis

  // Bars
  const n = table.getRowCount();
  const slotW = chartW / n;
  const barW = slotW * 0.75;

  noStroke();
  fill(70, 130, 180);

  for (let r = 0; r < n; r++) {
    const state = table.getString(r, "State");
    const sales = Number(String(table.getString(r, "TotalSales")).replace(/,/g, ""));
    const h = map(sales, 0, axisMax, 0, chartH);

    const x = x0 + r * slotW + (slotW - barW) / 2;
    const y = y1 - h;

    rect(x, y, barW, h);

    // X labels (state)
    fill(0);
    noStroke();
    textSize(12);
    textAlign(CENTER, TOP);
    text(state, x + barW / 2, y1 + 6);

    fill(70, 130, 180);
  }

  // Y-axis label
  push();
  translate(25, (y0 + y1) / 2);
  rotate(-HALF_PI);
  noStroke();
  fill(0);
  textSize(14);
  textAlign(CENTER, CENTER);
  text("Total Sales", 0, 0);
  pop();
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

// Formats as 0M, 2M, 4M ... (or 2.5M when needed)
function formatMillions(v) {
  const m = v / 1_000_000;
  if (Math.abs(m - Math.round(m)) < 1e-9) return Math.round(m) + "M";
  return m.toFixed(1) + "M";
}
