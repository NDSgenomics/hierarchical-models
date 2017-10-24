// ScatterPlot
import * as d3 from 'd3';
import d3tip from 'd3-tip';

var ScatterPlot = function() {
    // Set default values
    var height = 500,
        width = 500,
        xScale = d3.scaleLinear(),
        yScale = d3.scaleLinear(),
        xTitle = 'X Axis Title',
        yTitle = 'Y Axis Title',
        duration = 1000,
        colorScale = (d) => d.color || 'green',
        radius = (d) => 6,
        margin = {
            left: 70,
            bottom: 50,
            top: 0,
            right: 50,
        },
        delay = (d) => xScale(d.x) * 5,
        pack = false,
        packGroup = 'group',
        packValue = 'y',
        yFormat = (d) => "$" + d3.format(".2s")(d)

    // Function returned by ScatterPlot
    var chart = function(selection) {
        // Height/width of the drawing area itself
        var chartHeight = height - margin.bottom - margin.top;
        var chartWidth = width - margin.left - margin.right;

        // Iterate through selections, in case there are multiple
        selection.each(function(data) {
            // Use the data-join to create the svg (if necessary)
            var ele = d3.select(this);
            var svg = ele.selectAll("svg").data([data]);

            // Append static elements (i.e., only added once)
            var gEnter = svg.enter()
                .append("svg")
                .attr('width', width)
                .attr("height", height)
                .append("g");

            // g element for markers
            gEnter.append('g')
                .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
                .attr('height', chartHeight)
                .attr('width', chartWidth)
                .attr('class', 'chartG');


            // Append axes to the gEnter element
            gEnter.append('g')
                .attr('transform', 'translate(' + margin.left + ',' + (chartHeight + margin.top) + ')')
                .attr('class', pack == true ? 'axis x' : 'axis x')
                .style('opacity', pack == true ? 0 : 1);

            gEnter.append('g')
                .attr('class', 'axis y')
                .attr('transform', 'translate(' + margin.left + ',' + (margin.top) + ')')
                .style('opacity', pack == true ? 0 : 1);

            // Add a title g for the x axis
            gEnter.append('text')
                .attr('transform', 'translate(' + (margin.left + chartWidth / 2) + ',' + (chartHeight + margin.top + 40) + ')')
                .attr('class', 'title x')
                .style('opacity', pack == true ? 0 : 1);

            // Add a title g for the y axis
            gEnter.append('text')
                .attr('transform', 'translate(' + (margin.left - 50) + ',' + (margin.top + chartHeight / 2) + ') rotate(-90)')
                .attr('class', 'title y')
                .style('opacity', pack == true ? 0 : 1);

            // Define xAxis and yAxis functions
            var xAxis = d3.axisBottom();
            var yAxis = d3.axisLeft();

            // // Define a hover
            var tip = d3tip()
                .attr('class', 'd3-tip')
                .offset([-10, 0])
                .html(function(d) {
                    return "<strong>" + d.id + "</strong>";
                });

            ele.select('svg').call(tip);
            // Calculate x and y scales
            let xMax = d3.max(data.scatter, (d) => +d.x) * 1.05;
            let xMin = d3.min(data.scatter, (d) => +d.x) * .6;
            xScale.range([0, chartWidth]).domain([xMin, xMax]);

            var yMin = d3.min(data.scatter, (d) => +d.y) * .95;
            var yMax = d3.max(data.scatter, (d) => +d.y) * 1.05;
            yScale.range([chartHeight, 0]).domain([yMin, yMax]);

            // Update axes
            xAxis.scale(xScale);
            yAxis.scale(yScale).tickFormat(yFormat);
            ele.select('.axis.x').transition().duration(1000)
                .style('opacity', pack == true ? 0 : 1)
                .call(xAxis);
            ele.select('.axis.y').transition().duration(1000)
                .style('opacity', pack == true ? 0 : 1)
                .call(yAxis);

            // Update titles
            ele.select('.title.x').text(xTitle).transition().duration(duration).style('opacity', pack == true ? 0 : 1)
            ele.select('.title.y').text(yTitle).transition().duration(duration).style('opacity', pack == true ? 0 : 1)

            // Define data
            var chartData;
            if (pack == true) {
                // Create a packing function to pack circles
                var packer = d3.pack()
                    .size([width, width]);
                // Nest your data *by group* using d3.nest()
                var nestedData = d3.nest()
                    .key(function(d) {
                        return d[packGroup];
                    })
                    .entries(data.pack);

                // Define a hierarchy for your data using d3.hierarchy
                var root = d3.hierarchy({
                    values: nestedData
                }, function(d) {
                    return d.values;
                }).sum(function(d) {
                    return +d[packValue];
                });
                // (Re)build your pack hierarchy data structure by passing your `root` to your `pack` function
                packer(root);
                chartData = root.descendants()
                    .filter((d) => d.depth != 0).map(function(d) {
                    console.log(d.data.color)
                    return {
                        x: d.x,
                        y: d.y,
                        id: d.data.id,
                        color: d.data.color,
                        r: d.r,
                        container: d.depth == 1
                    }
                });
                xMin = d3.min(chartData, (d) => d.x)
                xMax = d3.max(chartData, (d) => d.x)
                xScale.domain([xMin, xMax]).range([xMin, xMax])
                yMin = d3.min(chartData, (d) => d.y)
                yMax = d3.max(chartData, (d) => d.y)
                yScale.domain([yMin, yMax]).range([yMin, yMax])
                radius = (d) => d.r
            } else {
                chartData = data.scatter;
            }
            console.log('pack ', pack, 'chart data ', chartData)
            // Draw markers
            let circles = ele.select('.chartG').selectAll('circle')
                .data(chartData, function(d) {
                    return d.id
                })
            // Use the .enter() method to get entering elements, and assign initial position
            circles.enter().append('circle')
                .style('opacity', .3)
                .attr('cx', (d) => xScale(d.x))
                .attr('cy', (d) => yScale(d.y))
                .attr('r', 0)
                .on('mouseover', tip.show)
                .on('mouseout', tip.hide)
                // Transition properties of the + update selections
                .merge(circles)
                .transition()
                .duration(1500)
                .delay(delay)
                // .style('fill', (d) => colorScale(d.color))
                .style('fill', function(d) {
                    return d.container == true ? 'none' : colorScale(d.color)
                })
                .style('stroke', (d) => d.container == true ? 'black' : 'none')
                .attr('cx', (d) => xScale(d.x))
                .attr('cy', (d) => yScale(d.y))
                .attr('r', (d) => radius(d));

            // Use the .exit() and .remove() methods to remove elements that are no longer in the data
            circles.exit().remove();

            // Define a line function that will return a `path` element based on data
            var line = d3.line()
                .x(function(d) {
                    return xScale(+d.x)
                })
                .y(function(d) {
                    return yScale(+d.y)
                });
            // let circles = ele.select('.chartG').selectAll('circle').data(data.scatter, (d) => d.id);
            let lines = ele.select('.chartG').selectAll('path').data(data.line, (d) => d.key);

            // Handle entering elements (see README.md)
            lines.enter().append("path")
                .attr("d", function(d) {
                    return line(d.values)
                })
                .attr("fill", "none")
                .attr("stroke-width", 1.5)
                // .attr("stroke-dasharray", function(d) {
                //     var totalLength = d3.select(this).node().getTotalLength();
                //     return (totalLength + " " + totalLength);
                // })
                // .attr("stroke-dashoffset", function(d) {
                //     return -d3.select(this).node().getTotalLength();
                // })
                .merge(lines)
                .transition()
                .duration(duration)
                .attr("d", function(d) {
                    return line(d.values)
                })
                .attr("stroke", function(d) {
                    return colorScale(d.key)
                })
                .transition()
                .duration(2000)
                // .attr("stroke-dashoffset", function(d) {
                //     return 0;
                // });

            // Handle updating elements (see README.md)
                // countries.attr("stroke-dasharray", "none")
                //     .transition()
                //     .duration(2000)
                //     .attr("d", function(d) {
                //         return line(d.values)
                //     })
                //     .attr('stroke', function(d) {
                //         return colorScale(d.key)
                //     })

            lines.exit().remove()


        // Handle exiting elements (see README.md)
        // countries.exit()
        //     .transition()
        //     .duration(1500)
        //     .attr("stroke-dashoffset", function(d) {
        //         return -d3.select(this).node().getTotalLength();
        //     })
        //     .attr("stroke-dasharray", function(d) {
        //         var totalLength = d3.select(this).node().getTotalLength();
        //         return (totalLength + " " + totalLength);
        //     })
        //     .remove();
        });
    };

    // Getter/setter methods to change locally scoped options
    chart.height = function(value) {
        if (!arguments.length) return height;
        height = value;
        return chart;
    };

    chart.width = function(value) {
        if (!arguments.length) return width;
        width = value;
        return chart;
    };

    chart.colorScale = function(value) {
        if (!arguments.length) return colorScale;
        colorScale = value;
        return chart;
    };

    chart.xTitle = function(value) {
        if (!arguments.length) return xTitle;
        xTitle = value;
        return chart;
    };

    chart.yTitle = function(value) {
        if (!arguments.length) return yTitle;
        yTitle = value;
        return chart;
    };
    chart.radius = function(value) {
        if (!arguments.length) return radius;
        radius = value;
        return chart;
    }
    chart.pack = function(value) {
        if (!arguments.length) return pack;
        pack = value;
        return chart;
    }
    chart.packValue = function(value) {
        if (!arguments.length) return packValue;
        packValue = value;
        return chart;
    }
    chart.packGroup = function(value) {
        if (!arguments.length) return packGroup;
        packGroup = value;
        return chart;
    }
    chart.delay = function(value) {
        if (!arguments.length) return delay;
        delay = value;
        return chart;
    };

    return chart;
};


export default ScatterPlot;