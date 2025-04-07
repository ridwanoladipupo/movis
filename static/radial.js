d3.csv("../data/processed_all_activity_data.csv").then(function(data) {
    data.forEach(d => {
        d.motion_intensity = +d.motion_intensity;
        d.Timestamp = new Date(+d.Timestamp * 1000);
        d.hour = d.Timestamp.getHours();
    });

    const svg = d3.select("#radial-clock"),
          width = +svg.attr("width"),
          height = +svg.attr("height"),
          radius = Math.min(width, height) / 2 - 50;

    const g = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const labelGroup = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);

    const hourScale = d3.scaleLinear().domain([0, 24]).range([0, 2 * Math.PI]);

    const activities = [...new Set(data.map(d => d.Activity_Type))];
    const colorScale = d3.scaleOrdinal()
        .domain(activities)
        .range(d3.schemeCategory10.concat(d3.schemePaired, d3.schemeSet3));

    const arc = d3.arc()
        .innerRadius(radius * 0.4)
        .outerRadius(d => radius * 0.9 * (d.avg_intensity));

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "white")
        .style("padding", "5px")
        .style("border", "1px solid gray")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("opacity", 0);

    const dropdown = d3.select("#activity-filter-clock");

    activities.forEach(activity => {
        dropdown.append("option").text(activity).attr("value", activity);
    });

    let hourFilter = [0, 24];

    function prepareData(activity) {
        let filtered = data.filter(d => d.hour >= hourFilter[0] && d.hour < hourFilter[1]);

        if (activity !== "all") {
            filtered = filtered.filter(d => d.Activity_Type === activity);
        }

        const grouped = d3.rollups(filtered, v => ({
            avg_intensity: d3.mean(v, d => d.motion_intensity),
            activity: v[0].Activity_Type
        }), d => d.hour + "-" + (activity === "all" ? d.Activity_Type : activity));

        const maxIntensity = d3.max(grouped, d => d[1].avg_intensity || 1);

        return grouped.map(([key, val]) => {
            const [hourStr, act] = key.split("-");
            return {
                hour: +hourStr,
                avg_intensity: val.avg_intensity / maxIntensity,
                activity: act
            };
        });
    }

    function drawClock(activity) {
        const hourData = prepareData(activity);

        g.selectAll("path").remove();
        labelGroup.selectAll("*").remove();

        g.selectAll("path")
            .data(hourData)
            .join(
                enter => enter.append("path")
                    .attr("fill", d => colorScale(activity === "all" ? d.activity : activity))
                    .attr("d", d => {
                        const start = hourScale(d.hour);
                        const end = hourScale(d.hour + 1);
                        return arc({
                            startAngle: start,
                            endAngle: end,
                            avg_intensity: d.avg_intensity
                        });
                    })
                    .on("mouseover", (event, d) => {
                        tooltip.transition().duration(200).style("opacity", 1);
                        tooltip.html(`Hour: ${d.hour}<br>Avg Intensity: ${d3.format(".2f")(d.avg_intensity)}`);
                    })
                    .on("mousemove", (event) => {
                        tooltip.style("top", (event.pageY + 10) + "px")
                               .style("left", (event.pageX + 10) + "px");
                    })
                    .on("mouseout", () => {
                        tooltip.transition().duration(200).style("opacity", 0);
                    })
                    .style("opacity", 0)
                    .transition().duration(750)
                    .style("opacity", 1),

                update => update.transition().duration(750)
                    .attr("d", d => arc({
                        startAngle: hourScale(d.hour),
                        endAngle: hourScale(d.hour + 1),
                        avg_intensity: d.avg_intensity
                    })),

                exit => exit.transition().duration(750).style("opacity", 0).remove()
            );

        const is24h = d3.select("#toggle-24h").property("checked");
        const ticks = d3.range(0, is24h ? 24 : 12);

        labelGroup.selectAll("line")
            .data(ticks)
            .join("line")
            .attr("x1", d => Math.sin(hourScale(d)) * (radius * 0.4))
            .attr("y1", d => -Math.cos(hourScale(d)) * (radius * 0.4))
            .attr("x2", d => Math.sin(hourScale(d)) * (radius * 0.95))
            .attr("y2", d => -Math.cos(hourScale(d)) * (radius * 0.95))
            .attr("stroke", "#aaa")
            .attr("stroke-width", 1);

        labelGroup.selectAll("text")
            .data(ticks)
            .join("text")
            .attr("x", d => Math.sin(hourScale(d)) * (radius + 15))
            .attr("y", d => -Math.cos(hourScale(d)) * (radius + 15))
            .attr("text-anchor", "middle")
            .attr("alignment-baseline", "middle")
            .style("font-size", "11px")
            .style("fill", "#333")
            .text(d => is24h ? d : (d === 0 ? 12 : d));
    }

    dropdown.on("change", function() {
        drawClock(this.value);
    });

    d3.select("#toggle-24h").on("change", function() {
        const is24h = this.checked;
        hourScale.domain(is24h ? [0, 24] : [0, 12]);
        drawClock(dropdown.node().value);
    });

    d3.select("#hour-range").on("input", function() {
        hourFilter[1] = +this.value;
        drawClock(dropdown.node().value);
    });

    drawClock("all");
});
