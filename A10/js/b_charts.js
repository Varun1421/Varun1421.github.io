const deceptiveMargin = { top: 50, right: 30, bottom: 60, left: 70 };
const deceptiveWidth = 420 - deceptiveMargin.left - deceptiveMargin.right;
const deceptiveHeight = 520 - deceptiveMargin.top - deceptiveMargin.bottom;

const ethicalMargin = { top: 50, right: 30, bottom: 60, left: 70 };
const ethicalWidth = 420 - ethicalMargin.left - ethicalMargin.right;
const ethicalHeight = 320 - ethicalMargin.top - ethicalMargin.bottom;

d3.csv("data/USD_INR Historical Data.csv", d => ({
  date: parseDate(d.Date),
  price: +String(d.Price).replace(/,/g, "")
})).then(data => {
  const cleaned = data
    .filter(d => d.date && !Number.isNaN(d.price))
    .sort((a, b) => a.date - b.date);

  const deceptiveData = cleaned.filter(d =>
    d.date >= new Date(2026, 2, 30) && d.date <= new Date(2026, 3, 9)
  );

  drawDeceptiveBChart(deceptiveData);
  drawEthicalBChart(cleaned);
});

function parseDate(dateString) {
  const parsed = d3.timeParse("%m/%d/%Y")(dateString);
  if (parsed) return parsed;

  const stripped = String(dateString).replace(/"/g, "").trim();
  return d3.timeParse("%m/%d/%Y")(stripped);
}

function drawDeceptiveBChart(data) {
  const svg = d3.select("#deceptive-b-chart")
    .append("svg")
    .attr("width", deceptiveWidth + deceptiveMargin.left + deceptiveMargin.right)
    .attr("height", deceptiveHeight + deceptiveMargin.top + deceptiveMargin.bottom);

  const chart = svg.append("g")
    .attr("transform", `translate(${deceptiveMargin.left},${deceptiveMargin.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, deceptiveWidth]);

  // Misleading: tightly truncated axis to exaggerate a modest decline
  const y = d3.scaleLinear()
    .domain([92.2, 94.6])
    .range([deceptiveHeight, 0]);

  chart.append("g")
    .attr("transform", `translate(0,${deceptiveHeight})`)
    .call(
      d3.axisBottom(x)
        .ticks(data.length)
        .tickFormat(d3.timeFormat("%m/%d"))
    )
    .selectAll("text")
    .attr("transform", "rotate(-35)")
    .style("text-anchor", "end");

  chart.append("g")
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", (deceptiveWidth + deceptiveMargin.left + deceptiveMargin.right) / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("font-size", "22px")
    .style("font-weight", "bold")
    .text("Rupee Surges Against Dollar");

  svg.append("text")
    .attr("x", (deceptiveWidth + deceptiveMargin.left + deceptiveMargin.right) / 2)
    .attr("y", deceptiveHeight + deceptiveMargin.top + 52)
    .attr("text-anchor", "middle")
    .text("Date");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(deceptiveHeight + deceptiveMargin.top) / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .text("USD/INR Rate");

  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.price));

  chart.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#1e8e3e")
    .attr("stroke-width", 4)
    .attr("d", line);

  chart.selectAll(".b-deceptive-point")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "b-deceptive-point")
    .attr("cx", d => x(d.date))
    .attr("cy", d => y(d.price))
    .attr("r", 5.5)
    .attr("fill", "#1e8e3e");

  const lowPoint = data.reduce((min, d) => d.price < min.price ? d : min, data[0]);

  chart.append("line")
    .attr("x1", x(lowPoint.date))
    .attr("y1", y(lowPoint.price))
    .attr("x2", x(lowPoint.date) - 85)
    .attr("y2", y(lowPoint.price) - 35)
    .attr("stroke", "black");

  chart.append("text")
    .attr("x", x(lowPoint.date) - 90)
    .attr("y", y(lowPoint.price) - 40)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Strong weekly rupee");

  chart.append("text")
    .attr("x", x(lowPoint.date) - 90)
    .attr("y", y(lowPoint.price) - 24)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("recovery");
}

function drawEthicalBChart(data) {
  const svg = d3.select("#ethical-b-chart")
    .append("svg")
    .attr("width", ethicalWidth + ethicalMargin.left + ethicalMargin.right)
    .attr("height", ethicalHeight + ethicalMargin.top + ethicalMargin.bottom);

  const chart = svg.append("g")
    .attr("transform", `translate(${ethicalMargin.left},${ethicalMargin.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, ethicalWidth]);

  const y = d3.scaleLinear()
    .domain([
      d3.min(data, d => d.price) - 0.5,
      d3.max(data, d => d.price) + 0.5
    ])
    .range([ethicalHeight, 0]);

  chart.append("g")
    .attr("transform", `translate(0,${ethicalHeight})`)
    .call(
      d3.axisBottom(x)
        .ticks(6)
        .tickFormat(d3.timeFormat("%m/%d"))
    );

  chart.append("g")
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", (ethicalWidth + ethicalMargin.left + ethicalMargin.right) / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("USD/INR Across the Full Month");

  svg.append("text")
    .attr("x", (ethicalWidth + ethicalMargin.left + ethicalMargin.right) / 2)
    .attr("y", ethicalHeight + ethicalMargin.top + 45)
    .attr("text-anchor", "middle")
    .text("Date");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(ethicalHeight + ethicalMargin.top) / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .text("USD/INR Rate");

  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.price));

  chart.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#2c3e50")
    .attr("stroke-width", 2.5)
    .attr("d", line);

  chart.selectAll(".b-ethical-point")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "b-ethical-point")
    .attr("cx", d => x(d.date))
    .attr("cy", d => y(d.price))
    .attr("r", 3.5)
    .attr("fill", "#2c3e50");

  svg.append("text")
    .attr("x", (ethicalWidth + ethicalMargin.left + ethicalMargin.right) / 2)
    .attr("y", ethicalHeight + ethicalMargin.top + 68)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#555")
    .text("A short decline in USD/INR can suggest INR strength, but the monthly view adds needed context.");
}