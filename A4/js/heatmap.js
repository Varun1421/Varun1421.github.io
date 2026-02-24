const CSV_PATH = "data/orders_raw.csv";
// Heatmap dimensions
const ROW_COL = "State_Code";     // y-axis
const COL_COL = "Category";       // x-axis
const VALUE_COL = "Total_Sales";  // color = sum of this

const TITLE = "Total Sales Heatmap by State Code and Category";
const X_LABEL = "Category";
const Y_LABEL = "State Code";

// Must show at least 5 “locations” -> we’ll show top 10 states by sales
const TOP_N_ROWS = 10;

const svgWidth = 950;
const svgHeight = 520;
const margin = { top: 55, right: 40, bottom: 90, left: 130 };
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

// Load data + aggregate with D3 (matches the hint)
d3.csv(CSV_PATH, d3.autoType).then(raw => {
  // Clean needed fields
  const filtered = raw
    .filter(d => d[ROW_COL] != null && d[COL_COL] != null && d[VALUE_COL] != null)
    .map(d => ({
      row: String(d[ROW_COL]).trim(),
      col: String(d[COL_COL]).trim(),
      value: +d[VALUE_COL]
    }))
    .filter(d => d.row !== "" && d.col !== "" && Number.isFinite(d.value));

  if (filtered.length === 0) {
    chart.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text("No valid rows found. Check CSV path/columns.");
    return;
  }

  // 1) Find top N rows by total sales
  const rowTotals = d3.rollups(
    filtered,
    v => d3.sum(v, d => d.value),
    d => d.row
  ).map(([row, total]) => ({ row, total }))
   .sort((a, b) => d3.descending(a.total, b.total));

  const topRows = rowTotals.slice(0, TOP_N_ROWS).map(d => d.row);

  // 2) Keep only those top rows
  const topData = filtered.filter(d => topRows.includes(d.row));

  // 3) Aggregate into a single value per (row, col)
  const rolled = d3.rollups(
    topData,
    v => d3.sum(v, d => d.value),
    d => d.row,
    d => d.col
  );

  // Unique columns (categories)
  const cols = Array.from(new Set(topData.map(d => d.col))).sort(d3.ascending);

  // Flatten to cell list, fill missing combos with 0 (so grid is complete)
  const cellMap = new Map();
  rolled.forEach(([r, colArr]) => {
    colArr.forEach(([c, sum]) => {
      cellMap.set(`${r}||${c}`, sum);
    });
  });

  const cells = [];
  for (const r of topRows) {
    for (const c of cols) {
      const v = cellMap.get(`${r}||${c}`) ?? 0;
      cells.push({ row: r, col: c, value: v });
    }
  }

  const maxV = d3.max(cells, d => d.value);

  // Scales
  // X = states
const x = d3.scaleBand()
.domain(topRows)
.range([0,width])
.padding(0.08);

// Y = categories
const y = d3.scaleBand()
.domain(cols)
.range([0,height])
.padding(0.08);

  const color = d3.scaleSequentialLog()
.domain([1, maxV]) // log scale can't start at 0
.interpolator(d3.interpolateTurbo);

  // Title
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("font-weight", 700)
    .text(TITLE);

  // Axes
  chart.append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll("text")
    .attr("text-anchor", "end")
    .attr("dx", "-0.6em")
    .attr("dy", "0.15em")
    .attr("transform", "rotate(-25)");

  chart.append("g")
    .attr("class", "axis axis-y")
    .call(d3.axisLeft(y));

  // Axis labels
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", height + 75)
    .attr("text-anchor", "middle")
    .text(X_LABEL);

  chart.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -105)
    .attr("text-anchor", "middle")
    .text(Y_LABEL);

  // Cells
  chart.selectAll(".cell")
    .data(cells)
    .enter()
    .append("rect")
    .attr("class", "cell")
    .attr("x", d => x(d.row))
.attr("y", d => y(d.col))
    .attr("width", x.bandwidth())
    .attr("height", y.bandwidth())
    .attr("fill", d => color(d.value))
    .on("mouseover", (event, d) => {
      tooltip
        .html(
          `<strong>${d.row}</strong> / ${d.col}<br>` +
          `Total Sales: ${d3.format(",")(d.value)}`
        )
        .style("opacity", 1);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseleave", () => tooltip.style("opacity", 0));

  // Simple legend (minimal)
  const legendWidth = 220;
  const legendHeight = 10;

  const legend = chart.append("g")
    .attr("transform", `translate(${width - legendWidth},${-5})`);

  // Gradient
  const defs = svg.append("defs");
  const gradId = "heatmap-grad";
  const gradient = defs.append("linearGradient")
    .attr("id", gradId)
    .attr("x1", "0%").attr("x2", "100%")
    .attr("y1", "0%").attr("y2", "0%");

  const stops = d3.range(0, 1.0001, 0.1);
  gradient.selectAll("stop")
    .data(stops)
    .enter()
    .append("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => color(d * maxV));

  legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("fill", `url(#${gradId})`)
    .attr("stroke", "#ccc");

  const legendScale = d3.scaleLog()
.domain([1,maxV])
.range([0,legendWidth]);

  legend.append("g")
    .attr("transform", `translate(0,${legendHeight})`)
    .call(d3.axisBottom(legendScale).ticks(4).tickFormat(d3.format("~s")))
    .select(".domain").remove();

}).catch(err => {
  console.error(err);
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .text("Error loading CSV. Run via a local server (not file://).");
});