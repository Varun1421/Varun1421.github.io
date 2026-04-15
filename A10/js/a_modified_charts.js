const modifiedMargin = { top: 50, right: 30, bottom: 60, left: 70 };
const modifiedWidth = 420 - modifiedMargin.left - modifiedMargin.right;
const modifiedHeight = 520 - modifiedMargin.top - modifiedMargin.bottom;

const originalMargin = { top: 50, right: 30, bottom: 60, left: 70 };
const originalWidth = 420 - originalMargin.left - originalMargin.right;
const originalHeight = 320 - originalMargin.top - originalMargin.bottom;

Promise.all([
  d3.csv("data/usd_inr_modified.csv", d => ({
    date: parseDate(d.Date),
    price: +String(d.Price).replace(/,/g, "")
  })),
  d3.csv("data/USD_INR Historical Data.csv", d => ({
    date: parseDate(d.Date || d['"Date"']),
    price: +String(d.Price || d['"Price"']).replace(/,/g, "").replace(/"/g, "")
  }))
]).then(([modifiedData, originalData]) => {
  const cleanModified = modifiedData
    .filter(d => d.date && !Number.isNaN(d.price))
    .sort((a, b) => a.date - b.date);

  const cleanOriginal = originalData
    .filter(d => d.date && !Number.isNaN(d.price))
    .sort((a, b) => a.date - b.date);

  drawModifiedChart(cleanModified);
  drawOriginalChart(cleanOriginal);
});

function parseDate(dateString) {
  const cleaned = String(dateString).replace(/"/g, "").trim();
  return d3.timeParse("%m/%d/%Y")(cleaned);
}

function drawModifiedChart(data) {
  const svg = d3.select("#modified-chart")
    .append("svg")
    .attr("width", modifiedWidth + modifiedMargin.left + modifiedMargin.right)
    .attr("height", modifiedHeight + modifiedMargin.top + modifiedMargin.bottom);

  const chart = svg.append("g")
    .attr("transform", `translate(${modifiedMargin.left},${modifiedMargin.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, modifiedWidth]);

  // Tight axis to exaggerate the manipulated drop
  const y = d3.scaleLinear()
    .domain([89, 95])
    .range([modifiedHeight, 0]);

  chart.append("g")
    .attr("transform", `translate(0,${modifiedHeight})`)
    .call(
      d3.axisBottom(x)
        .ticks(6)
        .tickFormat(d3.timeFormat("%m/%d"))
    );

  chart.append("g")
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", (modifiedWidth + modifiedMargin.left + modifiedMargin.right) / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("font-size", "22px")
    .style("font-weight", "bold")
    .text("Historic Rupee Surge");

  svg.append("text")
    .attr("x", (modifiedWidth + modifiedMargin.left + modifiedMargin.right) / 2)
    .attr("y", modifiedHeight + modifiedMargin.top + 45)
    .attr("text-anchor", "middle")
    .text("Date");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(modifiedHeight + modifiedMargin.top) / 2)
    .attr("y", 20)
    .attr("text-anchor", "middle")
    .text("USD/INR Rate");

  const line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.price));

  chart.append("path")
    .datum(data)
    .attr("fill", "none")
    .attr("stroke", "#11823b")
    .attr("stroke-width", 4)
    .attr("d", line);

  chart.selectAll(".modified-point")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "modified-point")
    .attr("cx", d => x(d.date))
    .attr("cy", d => y(d.price))
    .attr("r", 4.5)
    .attr("fill", "#11823b");

  const lastPoint = data[data.length - 1];

  chart.append("line")
    .attr("x1", x(lastPoint.date))
    .attr("y1", y(lastPoint.price))
    .attr("x2", x(lastPoint.date) - 95)
    .attr("y2", y(lastPoint.price) - 45)
    .attr("stroke", "black");

  chart.append("text")
    .attr("x", x(lastPoint.date) - 105)
    .attr("y", y(lastPoint.price) - 50)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("Strongest rupee");

  chart.append("text")
    .attr("x", x(lastPoint.date) - 105)
    .attr("y", y(lastPoint.price) - 34)
    .style("font-size", "12px")
    .style("font-weight", "bold")
    .text("recovery in months");
}

function drawOriginalChart(data) {
  const svg = d3.select("#original-chart")
    .append("svg")
    .attr("width", originalWidth + originalMargin.left + originalMargin.right)
    .attr("height", originalHeight + originalMargin.top + originalMargin.bottom);

  const chart = svg.append("g")
    .attr("transform", `translate(${originalMargin.left},${originalMargin.top})`);

  const x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, originalWidth]);

  const y = d3.scaleLinear()
    .domain([
      d3.min(data, d => d.price) - 0.5,
      d3.max(data, d => d.price) + 0.5
    ])
    .range([originalHeight, 0]);

  chart.append("g")
    .attr("transform", `translate(0,${originalHeight})`)
    .call(
      d3.axisBottom(x)
        .ticks(6)
        .tickFormat(d3.timeFormat("%m/%d"))
    );

  chart.append("g")
    .call(d3.axisLeft(y));

  svg.append("text")
    .attr("x", (originalWidth + originalMargin.left + originalMargin.right) / 2)
    .attr("y", 25)
    .attr("text-anchor", "middle")
    .style("font-size", "20px")
    .style("font-weight", "bold")
    .text("Original USD/INR Data");

  svg.append("text")
    .attr("x", (originalWidth + originalMargin.left + originalMargin.right) / 2)
    .attr("y", originalHeight + originalMargin.top + 45)
    .attr("text-anchor", "middle")
    .text("Date");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -(originalHeight + originalMargin.top) / 2)
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

  chart.selectAll(".original-point")
    .data(data)
    .enter()
    .append("circle")
    .attr("class", "original-point")
    .attr("cx", d => x(d.date))
    .attr("cy", d => y(d.price))
    .attr("r", 3.5)
    .attr("fill", "#2c3e50");

  svg.append("text")
    .attr("x", (originalWidth + originalMargin.left + originalMargin.right) / 2)
    .attr("y", originalHeight + originalMargin.top + 68)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .style("fill", "#555")
    .text("Original data shows volatility, not the dramatic recovery created in the modified version.");
}