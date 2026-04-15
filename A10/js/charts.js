const deceptiveMargin = { top: 50, right: 30, bottom: 50, left: 70 };
const deceptiveWidth = 420 - deceptiveMargin.left - deceptiveMargin.right;
const deceptiveHeight = 520 - deceptiveMargin.top - deceptiveMargin.bottom; // tall on purpose

const ethicalMargin = { top: 50, right: 30, bottom: 50, left: 70 };
const ethicalWidth = 460 - ethicalMargin.left - ethicalMargin.right;
const ethicalHeight = 320 - ethicalMargin.top - ethicalMargin.bottom; // more balanced

d3.csv("data/gaming_iq.csv", d => ({
  hours: +d.hours_gaming_per_day,
  iq: +d.average_iq_score
})).then(data => {
  drawDeceptiveChart(data);
  drawEthicalChart(data);
});

function drawDeceptiveChart(data) {
  const svg = d3.select("#deceptive-chart")
    .append("svg")
    .attr("width", deceptiveWidth + deceptiveMargin.left + deceptiveMargin.right)
    .attr("height", deceptiveHeight + deceptiveMargin.top + deceptiveMargin.bottom);

  const chart = svg.append("g")
    .attr("transform", `translate(${deceptiveMargin.left},${deceptiveMargin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.hours))
    .range([0, deceptiveWidth]);

  // Misleading: truncated axis
  const y = d3.scaleLinear()
    .domain([90, 120])
    .range([deceptiveHeight, 0]);

  chart.append("g")
    .attr("transform", `translate(0,${deceptiveHeight})`)
    .call(d3.axisBottom(x).ticks(data.length));

  chart.append("g")
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", (deceptiveWidth + deceptiveMargin.left + deceptiveMargin.right) / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("font-size", "22px")
    .style("font-weight", "bold")
    .text("Gaming Sharply Boosts IQ");

  svg.append("text")
    .attr("x", (deceptiveWidth + deceptiveMargin.left + deceptiveMargin.right) / 2)
    .attr("y", deceptiveHeight + deceptiveMargin.top + 40)
    .attr("text-anchor", "middle")
    .text("Hours Gaming Per Day");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(deceptiveHeight + deceptiveMargin.top) / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .text("Average IQ Score");

  const line = d3.line()
    .x(d => x(d.hours))
    .y(d => y(d.iq));

  chart.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#c0392b")
    .attr("stroke-width", 4)
    .attr("d", line);

  chart.selectAll(".deceptive-point")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "deceptive-point")
    .attr("cx", d => x(d.hours))
    .attr("cy", d => y(d.iq))
    .attr("r", 6)
    .attr("fill", "#c0392b");

  chart.append("line")
    .attr("x1", x(6))
    .attr("y1", y(118))
    .attr("x2", x(4.6))
    .attr("y2", y(119.2))
    .attr("stroke", "black");

  chart.append("text")
    .attr("x", x(4.5))
    .attr("y", y(119.5))
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Highest IQ observed");

  chart.append("text")
    .attr("x", x(4.5))
    .attr("y", y(118.3))
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("among heavy gamers");
}

function drawEthicalChart(data) {
  const svg = d3.select("#ethical-chart")
    .append("svg")
    .attr("width", ethicalWidth + ethicalMargin.left + ethicalMargin.right)
    .attr("height", ethicalHeight + ethicalMargin.top + ethicalMargin.bottom);

  const chart = svg.append("g")
    .attr("transform", `translate(${ethicalMargin.left},${ethicalMargin.top})`);

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.hours))
    .range([0, ethicalWidth]);

  // More honest scale
  const y = d3.scaleLinear()
    .domain([0, 130])
    .range([ethicalHeight, 0]);

  chart.append("g")
    .attr("transform", `translate(0,${ethicalHeight})`)
    .call(d3.axisBottom(x).ticks(data.length));

  chart.append("g")
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", (ethicalWidth + ethicalMargin.left + ethicalMargin.right) / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Gaming Hours and IQ Scores");

  svg.append("text")
    .attr("x", (ethicalWidth + ethicalMargin.left + ethicalMargin.right) / 2)
    .attr("y", ethicalHeight + ethicalMargin.top + 40)
    .attr("text-anchor", "middle")
    .text("Hours Gaming Per Day");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(ethicalHeight + ethicalMargin.top) / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .text("Average IQ Score");

  const line = d3.line()
    .x(d => x(d.hours))
    .y(d => y(d.iq));

  chart.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#2c3e50")
    .attr("stroke-width", 2.5)
    .attr("d", line);

  chart.selectAll(".ethical-point")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "ethical-point")
    .attr("cx", d => x(d.hours))
    .attr("cy", d => y(d.iq))
    .attr("r", 5)
    .attr("fill", "#2c3e50");

  svg.append("text")
    .attr("x", (ethicalWidth + ethicalMargin.left + ethicalMargin.right) / 2)
    .attr("y", ethicalHeight + ethicalMargin.top + 65)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#555")
    .text("Invented dataset; pattern shown does not establish causation.");
}