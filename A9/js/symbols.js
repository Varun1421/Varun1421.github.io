const map = L.map("map", {
  zoomControl: true
});

const usBounds = [
  [18, -161],   // southwest
  [50, -66]     // northeast
];

map.fitBounds(usBounds);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

const svg = d3.select(map.getPanes().overlayPane)
  .append("svg")
  .attr("class", "d3-overlay");

const g = svg.append("g")
  .attr("class", "leaflet-zoom-hide");

const tooltip = document.getElementById("tooltip");

function formatNumber(value) {
  return d3.format(",")(Math.round(value));
}

function addSizeLegend(radiusScale) {
  const legendSvg = d3.select(map.getContainer())
    .append("svg")
    .attr("class", "size-legend")
    .style("position", "absolute")
    .style("top", "20px")
    .style("right", "20px")
    .style("width", "170px")
    .style("height", "140px")
    .style("pointer-events", "none")
    .style("background", "rgba(255,255,255,0.9)")
    .style("border-radius", "6px")
    .style("box-shadow", "0 0 4px rgba(0,0,0,0.2)");

  legendSvg.append("text")
    .attr("x", 12)
    .attr("y", 18)
    .attr("font-size", 12)
    .attr("font-weight", "600")
    .text("Cost Index");

  const legend = legendSvg.append("g")
    .attr("transform", "translate(55,105)");

  const legendValues = [
    radiusScale.domain()[0],
    (radiusScale.domain()[0] + radiusScale.domain()[1]) / 2,
    radiusScale.domain()[1]
  ];

  legend.selectAll("circle")
    .data(legendValues)
    .join("circle")
    .attr("cx", 0)
    .attr("cy", function(d) { return -radiusScale(d); })
    .attr("r", function(d) { return radiusScale(d); })
    .attr("fill", "none")
    .attr("stroke", "#333")
    .attr("stroke-width", 1);

  legend.selectAll("line")
    .data(legendValues)
    .join("line")
    .attr("x1", function(d) { return radiusScale(d); })
    .attr("x2", 70)
    .attr("y1", function(d) { return -2 * radiusScale(d); })
    .attr("y2", function(d) { return -2 * radiusScale(d); })
    .attr("stroke", "#333")
    .attr("stroke-dasharray", "2,2");

  legend.selectAll("text.value")
    .data(legendValues)
    .join("text")
    .attr("class", "value")
    .attr("x", 74)
    .attr("y", function(d) { return -2 * radiusScale(d); })
    .attr("font-size", 11)
    .attr("alignment-baseline", "middle")
    .text(function(d) { return formatNumber(d); });

  legendSvg.append("circle")
    .attr("cx", 20)
    .attr("cy", 122)
    .attr("r", 6)
    .attr("fill", "orange")
    .attr("fill-opacity", 0.55)
    .attr("stroke", "#333");

  legendSvg.append("text")
    .attr("x", 32)
    .attr("y", 126)
    .attr("font-size", 11)
    .text("Top 10 states");
}

d3.csv("./data/lat.csv").then(function(latData) {
  d3.csv("./data/expensive-states.csv").then(function(costData) {

    const costMap = new Map();

    costData.forEach(function(d) {
      const stateName = d.State.trim();
      const costIndex = +String(d.costIndex).replace(/,/g, "");

      costMap.set(stateName, {
        costRank: d.costRank,
        costIndex: costIndex,
        groceryCost: +String(d.groceryCost).replace(/,/g, ""),
        housingCost: +String(d.housingCost).replace(/,/g, ""),
        utilitiesCost: +String(d.utilitiesCost).replace(/,/g, ""),
        transportationCost: +String(d.transportationCost).replace(/,/g, ""),
        miscCost: +String(d.miscCost).replace(/,/g, "")
      });
    });

    const mergedData = [];

    latData.forEach(function(d) {
      const stateName = d.state.trim();
      const match = costMap.get(stateName);

      if (match) {
        mergedData.push({
          state: stateName,
          postal_code: d.postal_code,
          lat: +d.lat,
          lng: +d.lng,
          costRank: match.costRank,
          costIndex: match.costIndex,
          groceryCost: match.groceryCost,
          housingCost: match.housingCost,
          utilitiesCost: match.utilitiesCost,
          transportationCost: match.transportationCost,
          miscCost: match.miscCost
        });
      }
    });

    const radiusScale = d3.scaleSqrt()
      .domain(d3.extent(mergedData, function(d) { return d.costIndex; }))
      .range([5, 30]);

    const top10States = new Set(
      mergedData
        .slice()
        .sort(function(a, b) { return b.costIndex - a.costIndex; })
        .slice(0, 10)
        .map(function(d) { return d.state; })
    );

    const circles = g.selectAll("circle.symbol")
      .data(mergedData)
      .join("circle")
      .attr("class", "symbol")
      .attr("r", function(d) { return radiusScale(d.costIndex); })
      .attr("fill", function(d) {
        return top10States.has(d.state) ? "orange" : "steelblue";
      })
      .attr("fill-opacity", 0.55)
      .attr("stroke", "#333")
      .attr("stroke-width", 1)
      .on("mouseover", function(event, d) {
        d3.select(this).attr("fill-opacity", 0.85);

        tooltip.style.display = "block";
        tooltip.innerHTML = `
          <strong>${d.state}</strong><br>
          Cost Index: ${formatNumber(d.costIndex)}<br>
          Rank: ${d.costRank}<br>
          Housing: ${formatNumber(d.housingCost)}<br>
          Grocery: ${formatNumber(d.groceryCost)}<br>
          Utilities: ${formatNumber(d.utilitiesCost)}<br>
          Transportation: ${formatNumber(d.transportationCost)}<br>
          Misc: ${formatNumber(d.miscCost)}
        `;
      })
      .on("mousemove", function(event) {
        tooltip.style.left = (event.pageX + 12) + "px";
        tooltip.style.top = (event.pageY - 28) + "px";
      })
      .on("mouseout", function() {
        d3.select(this).attr("fill-opacity", 0.55);
        tooltip.style.display = "none";
      });

    function update() {
      const topLeft = map.latLngToLayerPoint(map.getBounds().getNorthWest());
      const bottomRight = map.latLngToLayerPoint(map.getBounds().getSouthEast());

      svg
        .style("left", topLeft.x + "px")
        .style("top", topLeft.y + "px")
        .attr("width", bottomRight.x - topLeft.x)
        .attr("height", bottomRight.y - topLeft.y);

      g.attr("transform", `translate(${-topLeft.x},${-topLeft.y})`);

      circles
        .attr("cx", function(d) {
          return map.latLngToLayerPoint([d.lat, d.lng]).x;
        })
        .attr("cy", function(d) {
          return map.latLngToLayerPoint([d.lat, d.lng]).y;
        });
    }

    update();
    map.on("moveend zoomend", update);

    addSizeLegend(radiusScale);

  }).catch(function(error) {
    console.error("Error loading expensive-states.csv:", error);
  });
}).catch(function(error) {
  console.error("Error loading lat.csv:", error);
});