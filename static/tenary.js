d3.csv("../data/processed_all_activity_data.csv").then(function(data) {
    // Step 1: Extract activity types and prepare an index
    const activityTypes = [...new Set(data.map(d => d.Activity_Type))];
    const index = activityTypes.reduce((acc, activity, i) => {
        acc[activity] = i;
        return acc;
    }, {});

    // Step 2: Create the matrix (relationships between activities based on motion intensity)
    const matrix = Array.from({ length: activityTypes.length }, () => Array(activityTypes.length).fill(0));

    // Fill the matrix based on motion intensity
    data.forEach(d => {
        const i = index[d.Activity_Type];
        const j = index[d.Activity_Type]; // Here we assume an activity interacts with itself for simplicity
        matrix[i][j] += d.motion_intensity;
    });

    // Step 3: Create the chord diagram
    const width = 600;
    const height = 600;
    const radius = Math.min(width, height) / 2;

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const svg = d3.select("#chord-diagram")
        .append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const chord = d3.chord()
        .padAngle(0.05)
        .sortSubgroups(d3.descending);

    const arc = d3.arc()
        .innerRadius(radius - 100)
        .outerRadius(radius);

    const ribbon = d3.ribbon()
        .radius(radius - 100);

    // Chord diagram data
    const chords = chord(matrix);

    // Step 4: Add the arcs for each activity type
    svg.append("g")
        .selectAll("g")
        .data(chords.groups)
        .enter().append("g")
        .append("path")
        .attr("d", arc)
        .style("fill", d => color(d.index))
        .style("stroke", "#fff")
        .style("stroke-width", 1)
        .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`Activity: ${activityTypes[d.index]}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(200).style("opacity", 0);
        });

    // Step 5: Add the ribbons (connections between activities)
    svg.append("g")
        .selectAll(".chord")
        .data(chords)
        .enter().append("path")
        .attr("d", ribbon)
        .attr("class", "chord")
        .style("fill", d => color(d.source.index))
        .style("stroke", "#fff")
        .style("stroke-width", 1)
        .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`From: ${activityTypes[d.source.index]}<br>To: ${activityTypes[d.target.index]}<br>Intensity: ${d.source.value}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(200).style("opacity", 0);
        });

    // Step 6: Add labels to the arcs
    svg.append("g")
        .selectAll("text")
        .data(chords.groups)
        .enter().append("text")
        .attr("transform", d => {
            const angle = (d.startAngle + d.endAngle) / 2;
            return `rotate(${angle * 180 / Math.PI - 90}) translate(0, -20)`;
        })
        .attr("text-anchor", "middle")
        .attr("alignment-baseline", "middle")
        .style("font-size", "12px")
        .style("fill", "#333")
        .text(d => activityTypes[d.index]);

    // Tooltip for showing information on hover
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "5px")
        .style("border", "1px solid gray")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0);
});
