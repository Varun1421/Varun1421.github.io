const margin = { top: 50, right: 30, bottom: 60, left: 80 };
const width = 480 - margin.left - margin.right;
const height = 320 - margin.top - margin.bottom;

d3.csv("data/rupee_realworld.csv", d => ({
  month: d3.timeParse("%Y-%m-%d")(d.month),
  value: +d.rupees_per_dollar
})).then(data => {
  const cleaned = data
    .filter(d => d.month && !Number.isNaN(d.value))
    .sort((a, b) => a.month - b.month);

  drawChart(cleaned);
});

function drawChart(data) {
  const svg = d3.select("#ethical-realworld-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  const chart = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.month))
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([
      d3.min(data, d => d.value) - 0.5,
      d3.max(data, d => d.value) + 0.5
    ])
    .range([height, 0]);

  chart.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(
      d3.axisBottom(x)
        .ticks(7)
        .tickFormat(d3.timeFormat("%b %Y"))
    )
    .selectAll("text")
    .attr("transform", "rotate(-30)")
    .style("text-anchor", "end");

  chart.append("g")
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("USD/INR Trend With Clearer Context");

  svg.append("text")
    .attr("x", (width + margin.left + margin.right) / 2)
    .attr("y", height + margin.top + 55)
    .attr("text-anchor", "middle")
    .text("Date");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(height + margin.top) / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .text("Rupees per Dollar (higher = weaker INR)");

  const line = d3.line()
    .x(d => x(d.month))
    .y(d => y(d.value));

  chart.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#c0392b")
    .attr("stroke-width", 3)
    .attr("d", line);

  chart.selectAll(".point")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "point")
    .attr("cx", d => x(d.month))
    .attr("cy", d => y(d.value))
    .attr("r", 4)
    .attr("fill", "#c0392b");

  const lastPoint = data[data.length - 1];

  chart.append("line")
    .attr("x1", x(lastPoint.month))
    .attr("y1", y(lastPoint.value))
    .attr("x2", x(lastPoint.month) - 115)
    .attr("y2", y(lastPoint.value) - 35)
    .attr("stroke", "black");

  chart.append("text")
    .attr("x", x(lastPoint.month) - 120)
    .attr("y", y(lastPoint.value) - 40)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Higher values mean");

  chart.append("text")
    .attr("x", x(lastPoint.month) - 120)
    .attr("y", y(lastPoint.value) - 24)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("a weaker rupee");
}
