// Load and visualize the processed motion data
d3.csv("../data/processed_all_activity_data.csv").then(function(data) {

    // Get unique activity types from data
    const activities = [...new Set(data.map(d => d.Activity_Type))];
    
    // Convert motion intensity to numbers
    data.forEach(d => {
        d.motion_intensity = +d.motion_intensity;
    });

    // Set up SVG canvas dimensions
    const width = 800, height = 500;
    const svg = d3.select("#heatmap")
                  .attr("width", width)
                  .attr("height", height);

    // Define color scale (low intensity = blue, high = red)
    const colorScale = d3.scaleLinear()
        .domain([d3.min(data, d => d.motion_intensity), d3.max(data, d => d.motion_intensity)])
        .range(["blue", "red"]);

    // Create heatmap cells (assuming motion data is structured with X, Y positions)
    svg.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", (d, i) => (i % 30) * 25) // Arrange in a grid
        .attr("y", (d, i) => Math.floor(i / 30) * 25)
        .attr("width", 25)
        .attr("height", 25)
        .attr("fill", d => colorScale(d.motion_intensity))
        .append("title")  // Tooltip on hover
        .text(d => `Intensity: ${d.motion_intensity}`);

    // Append a tooltip div (hidden by default)
    const tooltip = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("background", "white")
    .style("padding", "5px")
    .style("border", "1px solid black")
    .style("border-radius", "5px")
    .style("visibility", "hidden");

    // Modify heatmap cells to show tooltip on hover
    svg.selectAll("rect")
        .data(data)
        .enter()
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
    .on("mousemove", (event) => {
        tooltip.style("top", (event.pageY - 10) + "px")
            .style("left", (event.pageX + 10) + "px");
    })
    .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
    });

    // Populate the dropdown menu
    const dropdown = d3.select("#activity-filter");
    activities.forEach(activity => {
        dropdown.append("option").text(activity).attr("value", activity);
    });

    // Function to update heatmap based on selected activity
    function updateHeatmap(selectedActivity) {
        let filteredData = selectedActivity === "all" ? data : data.filter(d => d.Activity_Type === selectedActivity);

        let cells = svg.selectAll("rect").data(filteredData);

        // Update existing cells
        // cells.transition()
        //     .duration(500)
        //     .attr("fill", d => colorScale(d.motion_intensity));

        

        // Update existing cells smoothly
        cells.transition()
            .duration(500)
            // .style("opacity", 0.7)
            .attr("fill", d => colorScale(d.motion_intensity));

        // Fade in new cells
        cells.enter()
            .append("rect")
            .attr("x", (d, i) => (i % 30) * 25)
            .attr("y", (d, i) => Math.floor(i / 30) * 25)
            .attr("width", 25)
            .attr("height", 25)
            .style("opacity", 0)
            .transition()
            .duration(500)
            .style("opacity", 1);

        // Remove extra cells
        cells.exit().remove();
    }

    // Listen for dropdown changes
    dropdown.on("change", function() {
        updateHeatmap(this.value);
    });


});

