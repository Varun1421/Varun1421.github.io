const CSV_PATH = "data/histogram_total_sales.csv";
const VALUE_COL = "total_sales";

const TITLE = "Distribution of Total Sales";
const X_LABEL = "Total Sales";
const Y_LABEL = "Count";

const svgWidth = 900;
const svgHeight = 520;

// Better padding
const margin = { top: 50, right: 40, bottom: 95, left: 85 };

const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const tooltip = d3.select("#tooltip");

// SVG
const svg = d3.select("#chart-container")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

const chart = svg.append("g")
  .attr("transform",
    `translate(${margin.left},${margin.top})`
  );

d3.csv(CSV_PATH, d3.autoType).then(raw => {

  const values = raw
    .map(d => +d[VALUE_COL])
    .filter(v => Number.isFinite(v) && v > 0);

  if (values.length === 0) {

    chart.append("text")
      .attr("x", width / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .text("No valid data.");

    return;
  }

  // LOG transform
  const logValues = values.map(v => Math.log10(v));

  // Title
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", -18)
    .attr("text-anchor", "middle")
    .attr("font-weight", 700)
    .text(TITLE);

  // X scale (log space)
  const x = d3.scaleLinear()
    .domain(d3.extent(logValues))
    .nice()
    .range([0, width]);

  // Histogram bins
  const binGen = d3.bin()
    .domain(x.domain())
    .thresholds(28);

  const bins = binGen(logValues);

  // Y scale
  const y = d3.scaleLinear()
    .domain([0, d3.max(bins, d => d.length)])
    .nice()
    .range([height, 0]);

  // ---------- CLEAN X AXIS ----------

  const tickVals = [
    500,
    1000,
    2000,
    5000,
    10000,
    20000,
    50000,
    100000
  ].filter(v =>
    v >= d3.min(values) &&
    v <= d3.max(values)
  );

  const tickPos = tickVals.map(v => Math.log10(v));

  chart.append("g")
    .attr("class", "axis axis-x")
    .attr("transform", `translate(0,${height})`)
    .call(

      d3.axisBottom(x)
        .tickValues(tickPos)
        .tickFormat(d =>
          d3.format("~s")(Math.pow(10, d))
        )

    );

  // Y axis
  chart.append("g")
    .attr("class", "axis axis-y")
    .call(d3.axisLeft(y).ticks(8));

  // Axis Labels
  chart.append("text")
    .attr("x", width / 2)
    .attr("y", height + 75)
    .attr("text-anchor", "middle")
    .text(X_LABEL);

  chart.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -60)
    .attr("text-anchor", "middle")
    .text(Y_LABEL);

  // Bars
  chart.selectAll(".bar")
    .data(bins)
    .enter()
    .append("rect")
    .attr("class", "bar")
    .attr("x", d => x(d.x0))
    .attr("y", d => y(d.length))
    .attr("width",
      d => Math.max(
        0,
        x(d.x1) - x(d.x0)
      )
    )
    .attr("height",
      d => height - y(d.length)
    )

    .on("mouseover", (event, d) => {

      tooltip
        .html(

          `Range:
${d3.format(",")(Math.pow(10, d.x0))}
 —
${d3.format(",")(Math.pow(10, d.x1))}<br>
Count: ${d.length}`

        )
        .style("opacity", 1);

    })

    .on("mousemove", (event) => {

      tooltip
        .style("left",
          (event.pageX + 12) + "px")
        .style("top",
          (event.pageY - 28) + "px");

    })

    .on("mouseleave",
      () => tooltip.style("opacity", 0)
    );

})
.catch(err => {

  console.error(err);

  chart.append("text")
    .attr("x", width / 2)
    .attr("y", height / 2)
    .attr("text-anchor", "middle")
    .text("Error loading CSV.");

});