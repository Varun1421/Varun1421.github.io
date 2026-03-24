const svg = d3.select("#chart");
const width = +svg.attr("width");
const height = +svg.attr("height");

const margin = { top: 70, right: 220, bottom: 70, left: 80 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];


const selectedCities = ["Mumbai", "New Delhi", "New York City", "San Francisco"];

d3.csv("data/temp.csv").then(data => {
  const filtered = data.filter(d => selectedCities.includes(d.City));

  const cityData = filtered.map(city => {
    return {
      city: city.City,
      values: months.map(month => ({
        month: month,
        value: +city[month]
      }))
    };
  });

  const x = d3.scalePoint()
    .domain(months)
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([
      d3.min(cityData, d => d3.min(d.values, v => v.value)),
      d3.max(cityData, d => d.max ? d.max : d3.max(d.values, v => v.value))
    ])
    .nice()
    .range([innerHeight, 0]);

  // safer y-domain calculation
  y.domain([
    d3.min(cityData, d => d3.min(d.values, v => v.value)),
    d3.max(cityData, d => d3.max(d.values, v => v.value))
  ]).nice();

  const color = d3.scaleOrdinal()
    .domain(cityData.map(d => d.city))
    .range(d3.schemeTableau10);

  const xAxis = d3.axisBottom(x);
  const yAxis = d3.axisLeft(y);

  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(xAxis);

  g.append("g")
    .call(yAxis);

  g.append("text")
    .attr("class", "axis-label")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 50)
    .attr("text-anchor", "middle")
    .text("Month");

  g.append("text")
    .attr("class", "axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -55)
    .attr("text-anchor", "middle")
    .text("Temperature (°C)");

  svg.append("text")
    .attr("class", "chart-title")
    .attr("x", margin.left)
    .attr("y", 35)
    .text("Average Monthly Temperatures");

  const line = d3.line()
    .x(d => x(d.month))
    .y(d => y(d.value));

  g.selectAll(".line")
    .data(cityData)
    .enter()
    .append("path")
    .attr("fill", "none")
    .attr("stroke", d => color(d.city))
    .attr("stroke-width", 2.5)
    .attr("d", d => line(d.values));

  g.selectAll(".city-points")
    .data(cityData)
    .enter()
    .append("g")
    .each(function(city) {
      d3.select(this)
        .selectAll("circle")
        .data(city.values)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.month))
        .attr("cy", d => y(d.value))
        .attr("r", 3)
        .attr("fill", color(city.city));
    });

  const legend = d3.legendColor()
    .scale(color)
    .shape("line")
    .shapeWidth(30)
    .shapePadding(10)
    .title("Cities");

  svg.append("g")
    .attr("transform", `translate(${width - 170}, ${margin.top + 20})`)
    .call(legend);
}).catch(error => {
  console.error("Error loading CSV:", error);

  svg.append("text")
    .attr("x", 40)
    .attr("y", 40)
    .attr("fill", "red")
    .text("Could not load temp.csv. Check file path and city names.");
});
