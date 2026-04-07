const width = 1100;
const height = 650;

const svg = d3.select("svg")
  .attr("width", width)
  .attr("height", height);

const tooltip = d3.select("#tooltip");

const projection = d3.geoNaturalEarth1()
  .scale(180)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

d3.csv("./data/world_population.csv").then(function(data) {
  const valueMap = new Map();

  data.forEach(function(d) {
    let country = d["Country/Territory"]?.trim();
    const value = +String(d["2022 Population"]).replace(/,/g, "");

    if (country === "United States") country = "United States of America";

    if (country && !isNaN(value)) {
      valueMap.set(country, value);
    }
  });

  const values = data
    .map(function(d) {
      return +String(d["2022 Population"]).replace(/,/g, "");
    })
    .filter(function(v) {
      return !isNaN(v);
    });

  const color = d3.scaleQuantize()
    .domain(d3.extent(values))
    .range(d3.schemeGreens[7]);

  const legendWidth = 300;
const legendHeight = 10;

const legend = svg.append("g")
  .attr("transform", `translate(20, ${height - 40})`);

const legendScale = d3.scaleLinear()
  .domain(color.domain())
  .range([0, legendWidth]);

const legendAxis = d3.axisBottom(legendScale)
  .ticks(5)
  .tickFormat(d3.format(".2s"));

legend.selectAll("rect")
  .data(color.range().map(function(d) {
    const r = color.invertExtent(d);
    return r;
  }))
  .join("rect")
  .attr("x", d => legendScale(d[0]))
  .attr("y", 0)
  .attr("width", d => legendScale(d[1]) - legendScale(d[0]))
  .attr("height", legendHeight)
  .attr("fill", d => color(d[0]));

legend.append("g")
  .attr("transform", `translate(0, ${legendHeight})`)
  .call(legendAxis);

  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
  .then(function(world) {

    const countries = topojson.feature(world, world.objects.countries).features;

    svg.selectAll("path")
      .data(countries)
      .join("path")
      .attr("d", path)
      .attr("fill", function(d) {
        const countryName = d.properties.name;
        const value = valueMap.get(countryName);
        return value != null ? color(value) : "#ddd";
      })
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5)
        .on("mouseover", function(event, d) {
          const countryName =
            d.properties.name ||
            d.properties.NAME ||
            "Unknown";

          const value = valueMap.get(countryName);

          tooltip
            .style("opacity", 1)
            .html(
              value != null
                ? `<strong>${countryName}</strong><br>Population: ${value.toLocaleString()}`
                : `<strong>${countryName}</strong><br>No data`
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
    })
    .catch(function(error) {
      console.error("Error loading local world.topo.json:", error);
    });

}).catch(function(error) {
  console.error("Error loading world_population.csv:", error);
});