// =====================
// Config
// =====================
const CSV_PATH = "data/data_date.csv";

const TITLE = "AQI Over Time (Daily AQI by Country)";
const X_LABEL = "Date";
const Y_LABEL = "AQI Value";

const COL_DATE = "Date";
const COL_COUNTRY = "Country";
const COL_AQI = "AQI Value";

const COUNTRIES_TO_PLOT = ["India", "China", "United States of America"];

// Date format
const parseDate = d3.timeParse("%Y-%m-%d");
const formatTooltipDate = d3.timeFormat("%b %d, %Y");

// =====================
// SVG setup
// =====================
const svgWidth = 950;
const svgHeight = 550;

// Extra bottom margin for rotated tick labels
const margin = { top: 70, right: 220, bottom: 95, left: 80 };
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

// Title
svg.append("text")
  .attr("x", svgWidth / 2)
  .attr("y", 28)
  .attr("text-anchor", "middle")
  .attr("font-size", 16)
  .attr("font-weight", 700)
  .text(TITLE);

// =====================
// Load & draw
// =====================
d3.csv(CSV_PATH).then(raw => {
  console.log("Rows loaded:", raw.length);
  console.log("Sample row:", raw[0]);

  // Clean all rows (for global date range)
  const cleanedAll = raw.map(d => {
    const country = (d[COL_COUNTRY] ?? "").trim();
    const date = parseDate((d[COL_DATE] ?? "").trim());
    const aqi = +d[COL_AQI];
    return { country, date, aqi };
  }).filter(d =>
    d.country.length > 0 &&
    d.date instanceof Date && !isNaN(d.date) &&
    Number.isFinite(d.aqi)
  );

  if (cleanedAll.length === 0) {
    container.append("p").text("No valid rows after cleaning. Check CSV headers and date format.");
    return;
  }

  // Force x-axis domain to dataset-wide extent (month boundaries)
  const [minDate, maxDate] = d3.extent(cleanedAll, d => d.date);
  const xStart = d3.timeMonth.floor(minDate); // should become Jul 01 2022
  const xEnd = d3.timeMonth.ceil(maxDate);

  // Filter to chosen countries 
  const cleaned = cleanedAll.filter(d => COUNTRIES_TO_PLOT.includes(d.country));
  console.log("Rows after country filter:", cleaned.length);

  if (cleaned.length === 0) {
    container.append("p").text("No rows matched COUNTRIES_TO_PLOT. Check exact country spellings.");
    const uniques = Array.from(new Set(cleanedAll.map(d => d.country))).sort();
    console.log("Available countries:", uniques);
    return;
  }

  // Aggregate daily mean per country (in case duplicates exist)
  const byCountry = d3.groups(cleaned, d => d.country).map(([country, rows]) => {
    const byDay = d3.rollups(
      rows,
      v => d3.mean(v, x => x.aqi),
      r => +r.date
    ).map(([dateNum, avgAQI]) => ({
      date: new Date(+dateNum),
      aqi: avgAQI,
      country
    })).sort((a, b) => a.date - b.date);

    return { country, values: byDay };
  });

  const allPoints = byCountry.flatMap(g => g.values);

  // Scales
  const x = d3.scaleTime()
    .domain([xStart, xEnd])   // <-- starts at Jul 2022
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain(d3.extent(allPoints, d => d.aqi))
    .nice()
    .range([height, 0]);

  const color = d3.scaleOrdinal()
    .domain(COUNTRIES_TO_PLOT)
    .range(d3.schemeTableau10);

  // Axes (reduce overlap)
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

  // Line generator
  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.aqi));

  // Draw lines
  chart.append("g")
    .selectAll("path")
    .data(byCountry)
    .join("path")
    .attr("fill", "none")
    .attr("stroke", d => color(d.country))
    .attr("stroke-width", 2)
    .attr("d", d => line(d.values));

  // Points + tooltips
  chart.append("g")
    .selectAll("g")
    .data(byCountry)
    .join("g")
    .attr("fill", d => color(d.country))
    .selectAll("circle")
    .data(d => d.values)
    .join("circle")
    .attr("cx", d => x(d.date))
    .attr("cy", d => y(d.aqi))
    .attr("r", 3)
    .on("mouseenter", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(`
          <div><strong>${d.country}</strong></div>
          <div>Date: ${formatTooltipDate(d.date)}</div>
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
    .data(byCountry.map(d => d.country))
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
