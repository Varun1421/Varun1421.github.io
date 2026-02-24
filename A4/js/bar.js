const CSV_PATH = "data/brands_sales.csv";

const LABEL_COL = "brand";
const VALUE_COL = "total_sales";

const TITLE = "Total Sales by Brand";
const X_LABEL = "Total Sales";
const Y_LABEL = "Brand";

const svgWidth = 900;
const svgHeight = 520;

const margin = { top: 40, right: 40, bottom: 70, left: 180 };

const width = svgWidth - margin.left - margin.right;
const height = svgHeight - margin.top - margin.bottom;

const tooltip = d3.select("#tooltip");

// SVG
const svg = d3.select("#chart-container")
.append("svg")
.attr("width", svgWidth)
.attr("height", svgHeight);

const chart = svg.append("g")
.attr("transform",
`translate(${margin.left},${margin.top})`
);

// Load CSV
d3.csv(CSV_PATH, d3.autoType).then(raw => {

const data = raw.map(d => ({
label:String(d[LABEL_COL]),
value:+d[VALUE_COL]
}));

// Sort descending
data.sort((a,b)=> d3.descending(a.value,b.value));

// Title
chart.append("text")
.attr("x", width/2)
.attr("y",-15)
.attr("text-anchor","middle")
.attr("font-weight",700)
.text(TITLE);


// X scale (numeric)
const scaleX = d3.scaleLinear()
.domain([0,d3.max(data,d=>d.value)])
.nice()
.range([0,width]);

// Y scale (categories)
const scaleY = d3.scaleBand()
.domain(data.map(d=>d.label))
.range([0,height])
.padding(0.15);


// Axes
chart.append("g")
.attr("class","axis axis-x")
.attr("transform",`translate(0,${height})`)
.call(d3.axisBottom(scaleX).ticks(6));

chart.append("g")
.attr("class","axis axis-y")
.call(d3.axisLeft(scaleY));


// Axis Labels
chart.append("text")
.attr("x",width/2)
.attr("y",height+50)
.attr("text-anchor","middle")
.text(X_LABEL);

chart.append("text")
.attr("transform","rotate(-90)")
.attr("x",-height/2)
.attr("y",-140)
.attr("text-anchor","middle")
.text(Y_LABEL);


// Bars
chart.selectAll(".bar")
.data(data)
.enter()
.append("rect")
.attr("class","bar")
.attr("y",d=>scaleY(d.label))
.attr("x",0)
.attr("height",scaleY.bandwidth())
.attr("width",d=>scaleX(d.value))

.on("mouseover",(event,d)=>{

tooltip
.html(`<strong>${d.label}</strong>: ${d3.format(",")(d.value)}`)
.style("opacity",1);

})

.on("mousemove",(event)=>{

tooltip
.style("left",(event.pageX+12)+"px")
.style("top",(event.pageY-28)+"px");

})

.on("mouseleave",()=>tooltip.style("opacity",0));


// Data Labels
chart.selectAll(".bar-label")
.data(data)
.enter()
.append("text")
.attr("x",d=>scaleX(d.value)+5)
.attr("y",d=>scaleY(d.label)+scaleY.bandwidth()/2+4)
.attr("font-size",11)
.text(d=>d3.format(",")(d.value));

});