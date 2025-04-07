// Load and visualize the processed motion data

// Set up SVG canvas dimensions for heatmap and line chart
const heatmapWidth = 400, heatmapHeight = 300;
const chartWidth = 800, chartHeight = 300, margin = { top: 20, right: 30, bottom: 100, left: 50 };

// Load CSV
d3.csv("../data/processed_all_activity_data.csv").then(function(data) {
    console.log("✅ CSV loaded");
    console.log("Sample row:", data[0]);
    console.log("Columns:", Object.keys(data[0]));

    // Format and parse data
    data.forEach(d => {
        d.motion_intensity = +d.motion_intensity;
        d.Timestamp = new Date(+d.Timestamp * 1000);
        d.Participant_ID = +d.Participant_ID;
    });

    const activities = [...new Set(data.map(d => d.Activity_Type))];
    const participants = [...new Set(data.map(d => d.Participant_ID))];

    // Append activity dropdown
    const activityDropdown = d3.select("#activity-filter");
    activityDropdown.selectAll("option.activity")
        .data(activities)
        .enter()
        .append("option")
        .attr("class", "activity")
        .attr("value", d => d)
        .text(d => d);

    // Append participant dropdown
    const participantDropdown = d3.select("#participant-filter");
    participantDropdown.selectAll("option")
        .data(participants)
        .enter()
        .append("option")
        .attr("value", d => d)
        .text(d => `Participant ${d}`);

    // Heatmap setup
    const heatmapSVG = d3.select("#heatmap")
        .attr("width", heatmapWidth)
        .attr("height", heatmapHeight);

    const colorScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.motion_intensity), d3.max(data, d => d.motion_intensity)])
        .range(["blue", "red"]);

    const tooltip = d3.select("body").append("div")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "5px")
        .style("border", "1px solid black")
        .style("border-radius", "5px")
        .style("visibility", "hidden");

    function renderHeatmap(filteredData) {
        const cells = heatmapSVG.selectAll("rect").data(filteredData, (d, i) => i);

        cells.enter()
            .append("rect")
            .attr("x", (d, i) => (i % 30) * 25)
            .attr("y", (d, i) => Math.floor(i / 30) * 25)
            .attr("width", 25)
            .attr("height", 25)
            .attr("fill", d => colorScale(d.motion_intensity))
            .on("mouseover", (event, d) => {
                tooltip.style("visibility", "visible")
                    .text(`Intensity: ${d.motion_intensity}`);
            })
            .on("mousemove", event => {
                tooltip.style("top", (event.pageY - 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", () => {
                tooltip.style("visibility", "hidden");
            });

        cells.transition()
            .duration(500)
            .attr("fill", d => colorScale(d.motion_intensity));

        cells.exit().remove();
    }

    // Initial render
    renderHeatmap(data);

    activityDropdown.on("change", updateViews);
    participantDropdown.on("change", updateViews);

    function updateViews() {
        const selectedActivity = activityDropdown.node().value;
        const selectedParticipant = +participantDropdown.node().value;

        let filtered = data;
        if (selectedActivity !== "all") filtered = filtered.filter(d => d.Activity_Type === selectedActivity);
        filtered = filtered.filter(d => d.Participant_ID === selectedParticipant);

        renderHeatmap(filtered);
        renderLineChart(filtered);
    }

    // Line chart setup
    const chartSVG = d3.select("#motion-chart")
        .attr("width", chartWidth + margin.left + margin.right)
        .attr("height", chartHeight + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime().range([0, chartWidth]);
    const y = d3.scaleLinear().range([chartHeight, 0]);

    const xAxis = chartSVG.append("g")
        .attr("transform", `translate(0,${chartHeight})`);
    const yAxis = chartSVG.append("g");

    const line = d3.line()
        .x(d => x(d.Timestamp))
        .y(d => y(d.motion_intensity));

    const clip = chartSVG.append("defs").append("SVG:clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", chartWidth)
        .attr("height", chartHeight)
        .attr("x", 0)
        .attr("y", 0);

    const chartBody = chartSVG.append("g")
        .attr("clip-path", "url(#clip)");

    const brush = d3.brushX()
        .extent([[0, 0], [chartWidth, chartHeight]])
        .on("end", updateChart);

    chartBody.append("g")
        .attr("class", "brush")
        .call(brush);

    function renderLineChart(filteredData) {
        x.domain(d3.extent(filteredData, d => d.Timestamp));
        y.domain([0, d3.max(filteredData, d => d.motion_intensity)]);

        xAxis.transition().duration(500).call(d3.axisBottom(x));
        yAxis.transition().duration(500).call(d3.axisLeft(y));

        chartBody.selectAll(".line-path").remove();

        chartBody.append("path")
            .datum(filteredData)
            .attr("class", "line-path")
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 2)
            .attr("d", line);
    }

    function updateChart(event) {
        const extent = event.selection;
        if (!extent) return;

        const [x0, x1] = extent.map(x.invert);
        const selected = data.filter(d => d.Timestamp >= x0 && d.Timestamp <= x1);

        renderLineChart(selected);
    }

    // Initial line chart render with first participant
    participantDropdown.property("value", participants[0]);
    updateViews();
});
