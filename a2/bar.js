let table;

function preload() {
  table = loadTable("states_sales.csv", "csv", "header");
}

function setup() {
  let canvas = createCanvas(900, 500);
  canvas.parent("sketch-holder");
}


function draw() {
  background(255);

  let margin = 60;
  let chartWidth = width - margin * 2;
  let chartHeight = height - margin * 2;

  // Find max sales value
  let maxSales = 0;
  for (let r = 0; r < table.getRowCount(); r++) {
    let val = table.getNum(r, "TotalSales");
    if (val > maxSales) maxSales = val;
  }

  let barWidth = chartWidth / table.getRowCount();

  // Axes
  stroke(0);
  line(margin, margin, margin, height - margin); // y-axis
  line(margin, height - margin, width - margin, height - margin); // x-axis

  // Bars
  noStroke();
  fill(70, 130, 180);

  for (let r = 0; r < table.getRowCount(); r++) {
    let sales = table.getNum(r, "TotalSales");
    let barHeight = map(sales, 0, maxSales, 0, chartHeight);

    let x = margin + r * barWidth;
    let y = height - margin - barHeight;

    rect(x, y, barWidth * 0.8, barHeight);

    // State labels
    fill(0);
    textAlign(CENTER, TOP);
    text(table.getString(r, "State"), x + barWidth * 0.4, height - margin + 5);

    fill(70, 130, 180);
  }

  // Y-axis label
  push();
  translate(15, height / 2);
  rotate(-HALF_PI);
  textAlign(CENTER);
  fill(0);
  text("Total Sales", 0, 0);
  pop();
}
