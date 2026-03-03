// =====================
// Config
// =====================
const CSV_PATH = "data/data_date.csv";

const TITLE = "Scatterplot Matrix (AQI, 7-Day Avg, 1-Day Change)";
const SUBTITLE = "India vs China vs United States of America";

const COL_DATE = "Date";
const COL_COUNTRY = "Country";
const COL_AQI = "AQI Value";

const COUNTRIES_TO_USE = ["India", "China", "United States of America"];

const parseDate = d3.timeParse("%Y-%m-%d");
const formatDate = d3.timeFormat("%b %d, %Y");

// 3 numeric variables -> 3x3 matrix
const VARS = [
  { key: "aqi", label: "AQI" },
  { key: "aqi_7d_avg", label: "AQI (7d avg)" },
  { key: "aqi_1d_change", label: "AQI (1d change)" }
];

// =====================
// SVG layout
// =====================
const svgWidth = 980;
const svgHeight = 720;

const margin = { top: 90, right: 180, bottom: 70, left: 70 };

const n = VARS.length;
const cellSize = 170;
const padding = 24;

const plotWidth = n * cellSize + (n - 1) * padding;
const plotHeight = n * cellSize + (n - 1) * padding;

const width = margin.left + plotWidth + margin.right;
const height = margin.top + plotHeight + margin.bottom;

const container = d3.select("#chart-container");
container.selectAll("*").remove();
container.style("position", "relative");

const svg = container.append("svg")
  .attr("width", width)
  .attr("height", height);

// Tooltip
const tooltip = container.append("div")
  .style("position", "absolute")
  .style("opacity", 0)
  .style("background", "white")
  .style("padding", "6px 10px")
  .style("border", "1px solid #999")
  .style("border-radius", "6px")
  .style("font-size", "12px")
  .style("pointer-events", "none")
  .style("box-shadow", "0 2px 10px rgba(0,0,0,0.15)");

// Title
svg.append("text")
  .attr("x", width / 2)
  .attr("y", 28)
  .attr("text-anchor", "middle")
  .attr("font-size", 16)
  .attr("font-weight", 700)
  .text(TITLE);

svg.append("text")
  .attr("x", width / 2)
  .attr("y", 48)
  .attr("text-anchor", "middle")
  .attr("font-size", 12)
  .attr("fill", "#444")
  .text(SUBTITLE);

const root = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// =====================
// Helpers: rolling mean + change per country
// =====================
function rollingMean(values, windowSize) {
  const out = new Array(values.length).fill(NaN);
  let sum = 0;
  let q = []; // queue of last windowSize values

  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    q.push(v);
    sum += v;

    if (q.length > windowSize) {
      sum -= q.shift();
    }

    // mean of whatever is in the window (works for early rows too)
    out[i] = sum / q.length;
  }
  return out;
}

// =====================
// Load + build
// =====================
d3.csv(CSV_PATH).then(raw => {
  // Parse + keep only 3 countries
  let rows = raw.map(d => ({
    date: parseDate((d[COL_DATE] ?? "").trim()),
    country: (d[COL_COUNTRY] ?? "").trim(),
    aqi: +d[COL_AQI]
  })).filter(d =>
    d.date instanceof Date && !isNaN(d.date) &&
    d.country.length > 0 &&
    COUNTRIES_TO_USE.includes(d.country) &&
    Number.isFinite(d.aqi)
  );

  if (rows.length === 0) {
    container.append("p").text("No valid rows after filtering. Check country names and CSV headers.");
    return;
  }

  // Sort by country, then date
  rows.sort((a, b) => d3.ascending(a.country, b.country) || d3.ascending(a.date, b.date));

  // Compute derived variables per country
  const byCountry = d3.groups(rows, d => d.country);
  const enriched = [];

  for (const [country, r] of byCountry) {
    const aqiSeries = r.map(d => d.aqi);
    const avg7 = rollingMean(aqiSeries, 7);

    for (let i = 0; i < r.length; i++) {
      const prev = i > 0 ? r[i - 1].aqi : NaN;
      const change1 = i > 0 ? (r[i].aqi - prev) : NaN;

      enriched.push({
        country,
        date: r[i].date,
        aqi: r[i].aqi,
        aqi_7d_avg: avg7[i],
        aqi_1d_change: change1
      });
    }
  }

  // Drop rows that are missing derived vars for cleaner plots.
  const data = enriched;

  // Color scale
  const color = d3.scaleOrdinal()
    .domain(COUNTRIES_TO_USE)
    .range(d3.schemeTableau10);

  // Domains per variable
  const domains = {};
  for (const v of VARS) {
    domains[v.key] = d3.extent(data.filter(d => Number.isFinite(d[v.key])), d => d[v.key]);
  }

  // Build cells
  const cells = d3.cross(d3.range(n), d3.range(n)); // [col, row]
  const cellG = root.selectAll("g.cell")
    .data(cells)
    .join("g")
    .attr("class", "cell")
    .attr("transform", ([col, row]) => {
      const x0 = col * (cellSize + padding);
      const y0 = row * (cellSize + padding);
      return `translate(${x0},${y0})`;
    });

  // Background rect + hover highlight
  cellG.append("rect")
    .attr("width", cellSize)
    .attr("height", cellSize)
    .attr("fill", "white")
    .attr("stroke", "#ddd");

  cellG.on("mouseenter", function () {
    d3.select(this).select("rect").attr("stroke", "#333").attr("stroke-width", 1.5);
  }).on("mouseleave", function () {
    d3.select(this).select("rect").attr("stroke", "#ddd").attr("stroke-width", 1);
  });

  // Draw each cell scatter
  cellG.each(function ([col, row]) {
    const xVar = VARS[col].key;
    const yVar = VARS[row].key;

    const x = d3.scaleLinear()
      .domain(domains[xVar]).nice()
      .range([10, cellSize - 10]);

    const y = d3.scaleLinear()
      .domain(domains[yVar]).nice()
      .range([cellSize - 10, 10]);

    const g = d3.select(this);

    // Axes only on outer edges to keep it readable
    if (row === n - 1) {
      g.append("g")
        .attr("transform", `translate(0,${cellSize - 10})`)
        .call(d3.axisBottom(x).ticks(4));
    }

    if (col === 0) {
      g.append("g")
        .attr("transform", `translate(10,0)`)
        .call(d3.axisLeft(y).ticks(4));
    }

    // Points
    g.append("g")
      .selectAll("circle")
      .data(data.filter(d => Number.isFinite(d[xVar]) && Number.isFinite(d[yVar])))
      .join("circle")
      .attr("cx", d => x(d[xVar]))
      .attr("cy", d => y(d[yVar]))
      .attr("r", 2.5)
      .attr("fill", d => color(d.country))
      .attr("opacity", 0.65)
      .on("mouseenter", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`
            <div><strong>${d.country}</strong></div>
            <div>Date: ${formatDate(d.date)}</div>
            <div>AQI: ${Math.round(d.aqi)}</div>
            <div>7d avg: ${Math.round(d.aqi_7d_avg)}</div>
            <div>1d change: ${Number.isFinite(d.aqi_1d_change) ? Math.round(d.aqi_1d_change) : "N/A"}</div>
          `);
      })
      .on("mousemove", (event) => {
        tooltip
          .style("left", (event.pageX + 12) + "px")
          .style("top", (event.pageY + 12) + "px");
      })
      .on("mouseleave", () => tooltip.style("opacity", 0));

    // Diagonal labels
    if (row === col) {
      g.append("text")
        .attr("x", cellSize / 2)
        .attr("y", cellSize / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .attr("font-weight", 700)
        .attr("fill", "#333")
        .text(VARS[col].label);
    }
  });

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${margin.left + plotWidth + 30}, ${margin.top + 10})`);

  legend.append("text")
    .attr("x", 0)
    .attr("y", 0)
    .attr("font-weight", 700)
    .attr("font-size", 12)
    .text("Country");

  const legendRow = legend.selectAll("g.row")
    .data(COUNTRIES_TO_USE)
    .join("g")
    .attr("class", "row")
    .attr("transform", (d, i) => `translate(0, ${18 + i * 20})`);

  legendRow.append("rect")
    .attr("x", 0)
    .attr("y", -10)
    .attr("width", 14)
    .attr("height", 14)
    .attr("fill", d => color(d));

  legendRow.append("text")
    .attr("x", 20)
    .attr("y", 0)
    .attr("dominant-baseline", "middle")
    .text(d => d);

}).catch(err => {
  console.error("CSV load error:", err);
  container.append("p").text("Error loading CSV. Check console and CSV_PATH.");
});
