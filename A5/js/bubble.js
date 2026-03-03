// =====================
// Config
// =====================
const CSV_PATH = "data/data_date.csv";

const TITLE = "AQI Bubble Chart (Date vs AQI)";
const SUBTITLE = "India vs China vs United States of America";
const X_LABEL = "Date";
const Y_LABEL = "AQI Value";

const COL_DATE = "Date";
const COL_COUNTRY = "Country";
const COL_AQI = "AQI Value";

const COUNTRIES_TO_PLOT = ["India", "China", "United States of America"];

const parseDate = d3.timeParse("%Y-%m-%d");
const formatDate = d3.timeFormat("%b %d, %Y");

// =====================
// SVG setup
// =====================
const svgWidth = 950;
const svgHeight = 600;

const margin = { top: 80, right: 180, bottom: 95, left: 80 };
const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const container = d3.select("#chart-container");
container.selectAll("*").remove();
container.style("position", "relative");

const svg = container.append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

const chart = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

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

// Title + subtitle
svg.append("text")
  .attr("x", svgWidth / 2)
  .attr("y", 28)
  .attr("text-anchor", "middle")
  .attr("font-size", 16)
  .attr("font-weight", 700)
  .text(TITLE);

svg.append("text")
  .attr("x", svgWidth / 2)
  .attr("y", 48)
  .attr("text-anchor", "middle")
  .attr("font-size", 12)
  .attr("fill", "#444")
  .text(SUBTITLE);

// =====================
// Load & Draw
// =====================
d3.csv(CSV_PATH).then(raw => {
  const data = raw.map(d => ({
    date: parseDate((d[COL_DATE] ?? "").trim()),
    country: (d[COL_COUNTRY] ?? "").trim(),
    aqi: +d[COL_AQI]
  })).filter(d =>
    d.date instanceof Date && !isNaN(d.date) &&
    d.country.length > 0 &&
    COUNTRIES_TO_PLOT.includes(d.country) &&
    Number.isFinite(d.aqi)
  );

  if (data.length === 0) {
    container.append("p").text("No valid rows found for selected countries.");
    return;
  }

  // Global x domain (month boundaries) so it starts cleanly
  const [minDate, maxDate] = d3.extent(data, d => d.date);
  const xStart = d3.timeMonth.floor(minDate);
  const xEnd = d3.timeMonth.ceil(maxDate);

  // Scales
  const x = d3.scaleTime()
    .domain([xStart, xEnd])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain(d3.extent(data, d => d.aqi))
    .nice()
    .range([height, 0]);

  const size = d3.scaleSqrt()
    .domain(d3.extent(data, d => d.aqi))
    .range([2, 18]);

  const color = d3.scaleOrdinal()
    .domain(COUNTRIES_TO_PLOT)
    .range(d3.schemeTableau10);

  // Axes
  const xAxis = d3.axisBottom(x)
    .ticks(d3.timeMonth.every(2))
    .tickFormat(d3.timeFormat("%b %Y"));

  const yAxis = d3.axisLeft(y).ticks(8);

  const xAxisG = chart.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(xAxis);

  xAxisG.selectAll("text")
    .attr("text-anchor", "end")
    .attr("transform", "rotate(-35)")
    .attr("dx", "-0.6em")
    .attr("dy", "0.4em");

  chart.append("g").call(yAxis);

  // Axis labels
  svg.append("text")
    .attr("x", margin.left + width / 2)
    .attr("y", svgHeight - 18)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text(X_LABEL);

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(margin.top + height / 2))
    .attr("y", 18)
    .attr("text-anchor", "middle")
    .attr("font-size", 12)
    .text(Y_LABEL);

  // Bubbles
  chart.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", d => x(d.date))
    .attr("cy", d => y(d.aqi))
    .attr("r", d => size(d.aqi))
    .attr("fill", d => color(d.country))
    .attr("opacity", 0.55)
    .on("mouseenter", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`
          <div><strong>${d.country}</strong></div>
          <div>Date: ${formatDate(d.date)}</div>
          <div>AQI: ${Math.round(d.aqi)}</div>
        `);
    })
    .on("mousemove", (event) => {
      tooltip
        .style("left", (event.pageX + 12) + "px")
        .style("top", (event.pageY + 12) + "px");
    })
    .on("mouseleave", () => tooltip.style("opacity", 0));

  // Legend
  const legend = svg.append("g")
    .attr("transform", `translate(${margin.left + width + 20}, ${margin.top})`);

  legend.append("text")
    .attr("x", 0)
    .attr("y", 0)
    .attr("font-weight", 700)
    .attr("font-size", 12)
    .text("Country");

  const legendRow = legend.selectAll("g.row")
    .data(COUNTRIES_TO_PLOT)
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
