const margin = { top: 60, right: 180, bottom: 80, left: 180 };
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
    d.Price_USD = +d.Price_USD;
  });

  const avgPriceByAirline = Array.from(
    d3.rollup(
      data,
      values => d3.mean(values, d => d.Price_USD),
      d => d.Airline
    ),
    ([Airline, AvgPrice]) => ({
      Airline,
      AvgPrice
    })
  );

  avgPriceByAirline.sort((a, b) => d3.descending(a.AvgPrice, b.AvgPrice));

  const maxPrice = d3.max(avgPriceByAirline, d => d.AvgPrice);

  const x = d3
    .scaleLinear()
    .domain([0, maxPrice])
    .nice()
    .range([0, width]);

  const y = d3
    .scaleBand()
    .domain(avgPriceByAirline.map(d => d.Airline))
    .range([0, height])
    .padding(0.2);

  const color = d3
    .scaleSequential(d3.interpolateBlues)
    .domain([0, maxPrice]);

  chartGroup
    .append("g")
    .attr("class", "axis")
    .call(d3.axisLeft(y));

  chartGroup
    .append("g")
    .attr("class", "axis")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(8).tickFormat(d3.format("$.2s")));

  chartGroup
    .selectAll("rect")
    .data(avgPriceByAirline)
    .enter()
    .append("rect")
    .attr("x", 0)
    .attr("y", d => y(d.Airline))
    .attr("width", d => x(d.AvgPrice))
    .attr("height", y.bandwidth())
    .attr("fill", d => color(d.AvgPrice));

  chartGroup
    .append("text")
    .attr("class", "chart-title")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .text("Average Ticket Price by Airline");

  chartGroup
    .append("text")
    .attr("x", width / 2)
    .attr("y", height + 55)
    .attr("text-anchor", "middle")
    .text("Average Ticket Price (USD)");

  chartGroup
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -height / 2)
    .attr("y", -140)
    .attr("text-anchor", "middle")
    .text("Airline");

  const legendGroup = svg
    .append("g")
    .attr("transform", `translate(${width + margin.left + 40}, ${margin.top + 60})`);

  legendGroup
    .append("text")
    .attr("class", "legend-title")
    .attr("x", 0)
    .attr("y", -12)
    .text("Avg Price (USD)");

  const legendScale = d3
    .scaleSequential(d3.interpolateBlues)
    .domain([0, maxPrice]);

  const legend = d3
    .legendColor()
    .scale(legendScale)
    .shapeWidth(30)
    .shapeHeight(12)
    .cells(6)
    .orient("vertical")
    .labelFormat(d3.format("$.0f"));

  legendGroup.call(legend);
});