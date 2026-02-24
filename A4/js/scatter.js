const CSV_PATH = "data/scatter_quantity_vs_sales.csv";

const X_COL = "quantity";
const Y_COL = "total_sales";

const TITLE = "Quantity vs Total Sales";
const X_LABEL = "Quantity";
const Y_LABEL = "Total Sales";

// Flip this if you want a log y-axis (often looks way better with sales data)
const USE_LOG_Y = false;

const svgWidth = 900;
const svgHeight = 520;
const margin = { top: 40, right: 40, bottom: 70, left: 90 };
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const tooltip = d3.select("#tooltip");

// SVG
const svg = d3.select("#chart-container")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

const chart = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv(CSV_PATH, d3.autoType).then(raw => {
  const data = raw
    .filter(d => d[X_COL] != null && d[Y_COL] != null)
    .map(d => ({
      x: +d[X_COL],
      y: +d[Y_COL],
      brand: d.brand,
      category: d.category
    }))
    .filter(d => Number.isFinite(d.x) && Number.isFinite(d.y));

  if (data.length === 0) {
    chart.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text("No valid data. Check CSV path/columns.");
    return;
  }

  // Title
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", -15)
    .attr("text-anchor", "middle")
    .attr("font-weight", 700)
    .text(TITLE);

  // Since Quantity is discrete (1–4), use a band scale + jitter inside the band
  const quantities = Array.from(new Set(data.map(d => d.x))).sort((a, b) => a - b);

  const xBand = d3.scaleBand()
    .domain(quantities)
    .range([0, width])
    .padding(0.35);

  // Y scale (linear or log)
  const yMin = d3.min(data, d => d.y);
  const yMax = d3.max(data, d => d.y);

  const y = USE_LOG_Y
    ? d3.scaleLog()
        // log can’t include 0, so clamp lower bound to at least 1
        .domain([Math.max(1, yMin), yMax])
        .nice()
        .range([height, 0])
    : d3.scaleLinear()
        .domain([0, yMax])
        .nice()
        .range([height, 0]);

  // Axes (nice integer ticks for quantity)
  chart.append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xBand).tickFormat(d3.format("d")));

  chart.append("g")
    .attr("class", "axis axis-y")
    .call(USE_LOG_Y ? d3.axisLeft(y).ticks(7, "~s") : d3.axisLeft(y).ticks(8));

  // Axis labels
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .attr("text-anchor", "middle")
    .text(X_LABEL);

  chart.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -65)
    .attr("text-anchor", "middle")
    .text(Y_LABEL);

  // Jitter amount: keep within band so dots don’t overlap perfectly
  const jitter = xBand.bandwidth() * 0.35;

  chart.selectAll(".dot")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "dot")
    .attr("cx", d => xBand(d.x) + xBand.bandwidth() / 2 + (Math.random() * 2 - 1) * jitter)
    .attr("cy", d => y(d.y))
    .attr("r", 2.5)
    .attr("fill", "black")
    .attr("opacity", 0.35)
    .on("mouseover", (event, d) => {
      tooltip
        .html(
          `<strong>${d.brand || "Unknown"}</strong><br>` +
          `Category: ${d.category || "Unknown"}<br>` +
          `Quantity: ${d.x}<br>` +
          `Total Sales: ${d3.format(",")(d.y)}`
        )
        .style("opacity", 1);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseleave", () => tooltip.style("opacity", 0));

}).catch(err => {
  console.error(err);
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .text("Error loading CSV. Run via a local server (not file://).");
});