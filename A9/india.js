const width = 900;
const height = 900;

const svg = d3.select("svg")
  .attr("width", width)
  .attr("height", height);

const tooltip = d3.select("#tooltip");

const projection = d3.geoMercator()
  .center([82.8, 22.5])
  .scale(1200)
  .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

d3.csv("./data/India.csv")
  .then(function(data) {
    console.log("India CSV loaded");
    console.log(data[0]);

    const valueMap = new Map();

    data.forEach(function(d) {
      let stateName = d.State ? d.State.trim() : "";
      const value = +String(d.total_population).replace(/,/g, "");

      if (stateName === "ORISSA") stateName = "ODISHA";
      if (stateName === "UTTARANCHAL") stateName = "UTTARAKHAND";
      if (stateName === "J&K") stateName = "JAMMU AND KASHMIR";
      if (stateName === "ANDAMAN & NICOBAR ISLANDS") stateName = "ANDAMAN AND NICOBAR ISLANDS";

      if (stateName && !isNaN(value)) {
        valueMap.set(stateName.toUpperCase(), value);
      }
    });

    const values = data
      .map(function(d) {
        return +String(d.total_population).replace(/,/g, "");
      })
      .filter(function(v) {
        return !isNaN(v);
      });

    const color = d3.scaleQuantize()
      .domain(d3.extent(values))
      .range(d3.schemeOranges[7]);
    
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

    d3.json("./data/india.json")
      .then(function(india) {
        console.log("India TopoJSON loaded");
        console.log(Object.keys(india.objects));

        // pick the first object inside the topology
        const objectName = Object.keys(india.objects)[0];
        const states = topojson.feature(india, india.objects[objectName]).features;

        console.log(states[0]);

        svg.selectAll("path")
          .data(states)
          .join("path")
          .attr("d", path)
          .attr("fill", function(d) {
            let geoName =
              d.properties.NAME_1 ||
              d.properties.ST_NM ||
              d.properties.st_nm ||
              d.properties.STATE ||
              d.properties.State ||
              d.properties.NAME ||
              d.properties.name ||
              "";

            geoName = geoName.trim().toUpperCase();

            const value = valueMap.get(geoName);
            return value != null ? color(value) : "#ddd";
          })
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.8)
          .on("mouseover", function(event, d) {
            let geoName =
              d.properties.NAME_1 ||
              d.properties.ST_NM ||
              d.properties.st_nm ||
              d.properties.STATE ||
              d.properties.State ||
              d.properties.NAME ||
              d.properties.name ||
              "Unknown";

            const lookupName = geoName.trim().toUpperCase();
            const value = valueMap.get(lookupName);

            tooltip
              .style("opacity", 1)
              .html(
                value != null
                  ? `<strong>${geoName}</strong><br>Total population: ${value.toLocaleString()}`
                  : `<strong>${geoName}</strong><br>No data`
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
        console.error("Error loading india.json:", error);
      });
  })
  .catch(function(error) {
    console.error("Error loading India.csv:", error);
  });