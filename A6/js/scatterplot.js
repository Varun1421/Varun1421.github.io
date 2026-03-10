const margin = { top: 60, right: 180, bottom: 80, left: 90 };
const width = 1000 - margin.left - margin.right;
const height = 550 - margin.top - margin.bottom;

const svg = d3
  .select("#chart")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom);

const chartGroup = svg
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

d3.csv("data/airline_ticket_prices_dataset.csv").then(data => {
  data.forEach(d => {
    d.Distance_km = +d.Distance_km;
    d.Price_USD = +d.Price_USD;
  });

  const x = d3
    .scaleLinear()
    .domain([0, d3.max(data, d => d.Distance_km)])
    .nice()
    .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([0, d3.max(data, d => d.Price_USD)])
    .nice()
    .range([height, 0]);

  const classes = [...new Set(data.map(d => d.Class))];

  const color = d3
    .scaleOrdinal()
    .domain(classes)
    .range(d3.schemeSet2);

  chartGroup
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(8));

  chartGroup
    .append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y).ticks(8).tickFormat(d3.format("$.2s")));

  chartGroup
    .selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("cx", d => x(d.Distance_km))
    .attr("cy", d => y(d.Price_USD))
    .attr("r", 5)
    .attr("fill", d => color(d.Class))
    .attr("opacity", 0.75);

  chartGroup
    .append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .text("Ticket Price vs Flight Distance by Class");

  chartGroup
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + 55)
    .attr("text-anchor", "middle")
    .text("Distance (km)");

  chartGroup
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -55)
    .attr("text-anchor", "middle")
    .text("Ticket Price (USD)");

  const legendGroup = svg
    .append("g")
    .attr("transform", `translate(${width + margin.left + 40}, ${margin.top + 60})`);

  legendGroup
    .append("text")
    .attr("class", "legend-title")
    .attr("x", 0)
    .attr("y", -12)
    .text("Ticket Class");

  const legend = d3
    .legendColor()
    .scale(color)
    .shape("circle")
    .shapeRadius(7)
    .orient("vertical");

  legendGroup.call(legend);
});
