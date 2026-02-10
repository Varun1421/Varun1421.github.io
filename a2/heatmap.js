// Heatmap: Monthly Sales Intensity by Category
// Reads: category_month_sales.csv
// Header: Category,Month,TotalSales

let table;
let rows = [];

let categories = [];
let months = [];
let grid = {}; // grid[category][month] = value

const W = 1280;
const H = 640;

const margin = { top: 90, right: 180, bottom: 110, left: 240 };

let hoverCell = null;

function preload() {
  table = loadTable("category_month_sales.csv", "csv", "header");
}

function setup() {
  const canvas = createCanvas(W, H);
  canvas.parent("sketch-holder");
  textFont("Arial");

  // Read rows
  rows = [];
  for (let r = 0; r < table.getRowCount(); r++) {
    const category = table.getString(r, "Category");
    const monthRaw = table.getString(r, "Month");
    const salesRaw = table.getString(r, "TotalSales");
    const sales = Number(String(salesRaw).replace(/,/g, ""));

    if (!category || !monthRaw || isNaN(sales)) continue;
    rows.push({ category, month: monthRaw.trim(), sales });
  }

  const monthOrder = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  // Keep only months present but preserve Jan..Dec order
  const presentMonths = new Set(rows.map(d => d.month));
  months = monthOrder.filter(m => presentMonths.has(m));

  categories = Array.from(new Set(rows.map(d => d.category)));
  categories.sort((a, b) => a.localeCompare(b));

  grid = {};
  for (const c of categories) grid[c] = {};
  for (const d of rows) grid[d.category][d.month] = d.sales;

  loop(); // enable hover
}

function draw() {
  background(255);

  if (rows.length === 0) {
    fill(0);
    textSize(16);
    text("No data loaded. Check category_month_sales.csv name/path/headers.", 30, 40);
    noLoop();
    return;
  }

  const x0 = margin.left;
  const x1 = width - margin.right;
  const y0 = margin.top;
  const y1 = height - margin.bottom;

  const cellW = (x1 - x0) / months.length;
  const cellH = (y1 - y0) / categories.length;

  // min/max for colors
  const values = [];
  for (const c of categories) {
    for (const m of months) {
      const v = grid[c][m];
      if (v !== undefined) values.push(v);
    }
  }
  const vMin = min(values);
  const vMax = max(values);

  // Title
  noStroke();
  fill(0);
  textSize(22);
  textAlign(LEFT, CENTER);
  text("Monthly Sales Intensity by Category", margin.left, 36);

  // Axis label top
  fill(60);
  textSize(14);
  textAlign(CENTER, CENTER);
  text("Order Date (Month)", (x0 + x1) / 2, 66);

  // Axis label left
  push();
  translate(55, (y0 + y1) / 2);
  rotate(-HALF_PI);
  textAlign(CENTER, CENTER);
  text("Category", 0, 0);
  pop();

  // Heatmap cells + hover detect
  hoverCell = null;

  for (let i = 0; i < categories.length; i++) {
    const c = categories[i];
    const y = y0 + i * cellH;

    for (let j = 0; j < months.length; j++) {
      const m = months[j];
      const x = x0 + j * cellW;

      const v = grid[c][m];
      let t = 0;
      if (v !== undefined) t = map(v, vMin, vMax, 0, 1, true);

      // light -> dark blue ramp (clean)
      const r = lerp(225, 30, t);
      const g = lerp(245, 110, t);
      const b = lerp(255, 170, t);

      stroke(240);
      strokeWeight(1);
      fill(r, g, b);
      rect(x, y, cellW, cellH);

      if (mouseX >= x && mouseX <= x + cellW && mouseY >= y && mouseY <= y + cellH) {
        hoverCell = { category: c, month: m, value: v, x, y, w: cellW, h: cellH };
      }
    }
  }

  // Month labels (top)
  noStroke();
  fill(0);
  textSize(13);
  textAlign(CENTER, BOTTOM);
  for (let j = 0; j < months.length; j++) {
    const x = x0 + j * cellW + cellW / 2;
    text(months[j], x, y0 - 10);
  }

  // Category labels (left)
  textAlign(LEFT, CENTER);
  for (let i = 0; i < categories.length; i++) {
    const y = y0 + i * cellH + cellH / 2;
    text(categories[i], x0 - 210, y);
  }

  // Legend
  drawLegend(vMin, vMax);

  // Hover tooltip
  if (hoverCell) {
    noFill();
    stroke(0);
    strokeWeight(2);
    rect(hoverCell.x, hoverCell.y, hoverCell.w, hoverCell.h);

    const valText = hoverCell.value === undefined ? "No data" : formatNumber(hoverCell.value);
    const tip = `${hoverCell.category}\n${hoverCell.month}\nSales: ${valText}`;
    drawTooltip(tip, mouseX + 12, mouseY + 12);
  }

  // X-axis label + data source (NO overlap)
  noStroke();
  fill(0);
  textSize(14);
  textAlign(CENTER, TOP);
  text("Total Sales (Color Scale)", (x0 + x1) / 2, height - margin.bottom + 35);

  fill(80);
  textSize(12);
  textAlign(LEFT, TOP);
  text(
    "Data source: category_month_sales.csv (manually constructed to match Tableau heatmap structure)",
    margin.left,
    height - 18
  );
}

function drawLegend(vMin, vMax) {
  const x = width - margin.right + 50;
  const y = margin.top + 10;
  const w = 20;
  const h = 240;

  noStroke();
  for (let i = 0; i < h; i++) {
    const t = map(i, 0, h, 1, 0);
    const r = lerp(225, 30, t);
    const g = lerp(245, 110, t);
    const b = lerp(255, 170, t);
    fill(r, g, b);
    rect(x, y + i, w, 1);
  }

  fill(0);
  textSize(12);
  textAlign(LEFT, CENTER);
  text("SUM(Total Sales)", x - 10, y - 18);

  textAlign(LEFT, TOP);
  text(formatNumber(vMax), x + 30, y - 2);

  textAlign(LEFT, BOTTOM);
  text(formatNumber(vMin), x + 30, y + h + 2);
}

function drawTooltip(txt, x, y) {
  const padding = 10;
  textSize(12);
  textAlign(LEFT, TOP);

  const lines = txt.split("\n");
  let maxW = 0;
  for (const line of lines) maxW = max(maxW, textWidth(line));
  const boxW = maxW + padding * 2;
  const boxH = lines.length * 16 + padding * 2;

  let bx = x;
  let by = y;
  if (bx + boxW > width - 10) bx = width - boxW - 10;
  if (by + boxH > height - 10) by = height - boxH - 10;

  noStroke();
  fill(255, 245);
  rect(bx, by, boxW, boxH, 6);

  fill(0);
  let ty = by + padding;
  for (const line of lines) {
    text(line, bx + padding, ty);
    ty += 16;
  }
}

function formatNumber(n) {
  return Math.round(n).toLocaleString("en-US");
}
