const width = 1100;
const height = 700;
const VALUE_COLUMN = "POP_ESTIMATE_2023";

const svg = d3.select("svg")
  .attr("width", width)
  .attr("height", height);

const tooltip = d3.select("#tooltip");

const projection = d3.geoAlbersUsa()
  .translate([width / 2, height / 2])
  .scale(1300);

const path = d3.geoPath().projection(projection);

function parseNumber(value) {
  return +String(value ?? "").replace(/,/g, "").trim();
}

function getCountyFips(row) {
  const stateCode = String(row.STATE ?? "").trim().padStart(2, "0");
  const countyCode = String(row.COUNTY ?? "").trim().padStart(3, "0");

  if (stateCode && countyCode && stateCode !== "00" && countyCode !== "000") {
    return stateCode + countyCode;
  }

  const rawFips = String(row.FIPStxt ?? "").trim().padStart(5, "0");
  if (rawFips.length === 5 && !rawFips.endsWith("000")) {
    return rawFips;
  }

  return null;
}

function isCountyRow(row) {
  const value = parseNumber(row[VALUE_COLUMN]);
  const fips = getCountyFips(row);

  return fips !== null && !isNaN(value);
}

function addLegendTopRight(colorScale, legendTitle) {
  const legendWidth = 260;
  const legendHeight = 16;
  const x = width - legendWidth - 40;
  const y = 40;

  const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${x}, ${y})`);

  legend.append("rect")
    .attr("x", -12)
    .attr("y", -28)
    .attr("width", legendWidth + 24)
    .attr("height", 58)
    .attr("fill", "white")
    .attr("opacity", 0.9)
    .attr("rx", 4);

  legend.append("text")
    .attr("x", 0)
    .attr("y", -10)
    .attr("font-size", 12)
    .attr("font-weight", "600")
    .text(legendTitle);

  const legendData = colorScale.range().map(function(color) {
    const extent = colorScale.invertExtent(color);
    return {
      color: color,
      min: extent[0],
      max: extent[1]
    };
  });

  const boxWidth = legendWidth / legendData.length;

  legend.selectAll("rect.color-box")
    .data(legendData)
    .join("rect")
    .attr("class", "color-box")
    .attr("x", function(d, i) { return i * boxWidth; })
    .attr("y", 0)
    .attr("width", boxWidth)
    .attr("height", legendHeight)
    .attr("fill", function(d) { return d.color; })
    .attr("stroke", "#999")
    .attr("stroke-width", 0.3);

  const tickIndices = [0, 2, 4, 6];

  legend.selectAll("text.tick")
    .data(tickIndices)
    .join("text")
    .attr("class", "tick")
    .attr("x", function(i) { return i * boxWidth; })
    .attr("y", legendHeight + 16)
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text(function(i) {
      return d3.format(".2s")(legendData[i].min);
    });

  legend.append("text")
    .attr("x", legendWidth)
    .attr("y", legendHeight + 16)
    .attr("font-size", 10)
    .attr("text-anchor", "end")
    .text(d3.format(".2s")(legendData[legendData.length - 1].max));
}

d3.csv("./data/PopulationEstimates(Population).csv")
  .then(function(data) {
    const countyRows = data.filter(isCountyRow);

    const valueMap = new Map();

    countyRows.forEach(function(d) {
      const fips = getCountyFips(d);
      const value = parseNumber(d[VALUE_COLUMN]);

      valueMap.set(fips, {
        county: d.CTYNAME || d.Area_Name || "Unknown County",
        state: d.STNAME || d.State || "",
        value: value
      });
    });

    const values = countyRows
      .map(function(d) { return parseNumber(d[VALUE_COLUMN]); })
      .filter(function(v) { return !isNaN(v); });

    const color = d3.scaleQuantile()
      .domain(values)
      .range(d3.schemeBlues[7]);

    d3.json("./data/counties-10m.json")
      .then(function(us) {
        const countiesObject =
          us.objects.counties ||
          us.objects.Counties ||
          us.objects.county;

        const counties = topojson.feature(us, countiesObject).features;

        svg.selectAll("path.county")
          .data(counties)
          .join("path")
          .attr("class", "county")
          .attr("d", path)
          .attr("fill", function(d) {
            const fips = String(d.id).padStart(5, "0");
            const record = valueMap.get(fips);
            return record ? color(record.value) : "#e5e5e5";
          })
          .attr("stroke", "#ffffff")
          .attr("stroke-width", 0.2)
          .on("mouseover", function(event, d) {
            const fips = String(d.id).padStart(5, "0");
            const record = valueMap.get(fips);

            tooltip
              .style("opacity", 1)
              .html(
                record
                  ? `<strong>${record.county}, ${record.state}</strong><br>Population: ${record.value.toLocaleString()}`
                  : "<strong>No data</strong>"
              );
          })
          .on("mousemove", function(event) {
            tooltip
              .style("left", (event.pageX + 12) + "px")
              .style("top", (event.pageY - 28) + "px");
          })
          .on("mouseout", function() {
            tooltip.style("opacity", 0);
          });

        addLegendTopRight(color, "Population (County)");
      })
      .catch(function(error) {
        console.error("Error loading topojson:", error);
      });
  })
  .catch(function(error) {
    console.error("Error loading CSV:", error);
  });