/*globals alert, document, d3, console*/
// These keep JSHint quiet if you're using it (highly recommended!)

function staircase() {
    var svgHeight = 200;
    var barWidth = 10;
    var svg = document.getElementById("barChart_a");
    var rects = svg.getElementsByTagName("rect");
    for (var i = 0; i < rects.length; i++) {
        var rect = rects[i];
        rect.setAttribute("height", i * barWidth);
    }
}

function update(error, data) {
    if (error !== null) {
        alert("Couldn't load the dataset!");
    } else {
        // D3 loads all CSV data as strings;
        // while Javascript is pretty smart
        // about interpreting strings as
        // numbers when you do things like
        // multiplication, it will still
        // treat them as strings where it makes
        // sense (e.g. adding strings will
        // concatenate them, not add the values
        // together, or comparing strings
        // will do string comparison, not
        // numeric comparison).

        // We need to explicitly convert values
        // to numbers so that comparisons work
        // when we call d3.max()
        data.forEach(function(d) {
            d.a = parseInt(d.a);
            d.b = parseFloat(d.b);
        });
    }

    // Set up the scales
    var aScale = d3.scale.linear()
        .domain([0, d3.max(data, function(d) {
            return d.a;
        })])
        .range([0, 150]);
    var bScale = d3.scale.linear()
        .domain([0, d3.max(data, function(d) {
            return d.b;
        })])
        .range([0, 150]);
    var iScale = d3.scale.linear()
        .domain([0, data.length])
        .range([0, 110]);

    // ****** PART III (you will also edit in PART V) ******

    /*==============Bar Chart A==============*/
    var rectsA = d3.select("#barChart_a")
        .select("g").selectAll("rect").data(data);

    rectsA.enter()
        .append("rect")
        .attr("opacity", 0)
        .transition()
        .duration(1000)
        .attr("opacity", 1);

    rectsA
        .transition()
        .duration(1000)
        .attr("opacity", 1)
        .attr("y", 0)
        .attr("x", function(d, i) {
            return i * 10;
        })
        .attr("height", function(d, i) {
            return aScale(d.a);
        })
        .attr("width", function(d, i) {
            return 10;
        });

    rectsA
        .on("mouseenter", function(d) {
            d3.select(this).style("fill", "#00CCFF");
        })
        .on("mouseleave", function(d) {
            d3.select(this).style("fill", "steelblue");
        });

    rectsA.exit()
        .transition()
        .duration(1000)
        .attr("opacity", 0)
        .remove();

    /*==============Bar Chart B==============*/

    var rectsB = d3.select("#barChart_b")
        .select("g").selectAll("rect").data(data);

    rectsB.enter()
        .append("rect")
        .attr("opacity", 0)
        .transition()
        .duration(1000)
        .attr("opacity", 1);

    rectsB
        .transition()
        .duration(1000)
        .attr("opacity", 1)
        .attr("y", 0)
        .attr("x", function(d, i) {
            return i * 10;
        })
        .attr("height", function(d, i) {
            return bScale(d.b);
        })
        .attr("width", function(d, i) {
            return 10;
        });

    rectsB
        .on("mouseenter", function(d) {
            d3.select(this).style("fill", "#00CCFF");
        })
        .on("mouseleave", function(d) {
            d3.select(this).style("fill", "steelblue");
        });

    rectsB.exit()
        .transition()
        .duration(1000)
        .attr("opacity", 0)
        .remove();

    /*==============Line Chart A==============*/

    var aLineGenerator = d3.svg.line()
        .x(function(d, i) {
            return iScale(i);
        })
        .y(function(d) {
            return aScale(d.a);
        });

    var pathA = d3.select("#linesChart_a").select("path").data(data);
    pathA.transition()
        .duration(1000)
        .attr("opacity", 1)
        .attr("d", aLineGenerator(data));

    /*==============Line Chart B==============*/

    var bLineGenerator = d3.svg.line()
        .x(function(d, i) {
            return iScale(i);
        })
        .y(function(d) {
            return bScale(d.b);
        });

    var pathB = d3.select("#linesChart_b").select("path").data(data);
    pathB.transition()
        .duration(1000)
        .attr("opacity", 1)
        .attr("d", bLineGenerator(data));

    /*==============Area Chart A==============*/

    var aAreaGenerator = d3.svg.area()
        .x(function(d, i) {
            return iScale(i);
        })
        .y0(0)
        .y1(function(d) {
            return aScale(d.a);
        });

    var areaA = d3.select("#areaChart_a").select("path").data(data);
    areaA.transition()
        .duration(1000)
        .attr("opacity", 1)
        .attr("d", aAreaGenerator(data));

    /*==============Area Chart B==============*/

    var bAreaGenerator = d3.svg.area()
        .x(function(d, i) {
            return iScale(i);
        })
        .y0(0)
        .y1(function(d) {
            return bScale(d.b);
        });

    var areaB = d3.select("#areaChart_b").select("path").data(data);
    areaB.transition()
        .duration(1000)
        .attr("opacity", 1)
        .attr("d", bAreaGenerator(data));

    /*==============Scatterplot==============*/

    var scatterplot = d3.select("#scatterplot")
        .select("g").selectAll("circle").data(data);

    scatterplot.enter()
        .append("circle")
        .attr("opacity", 0)
        .transition()
        .duration(1000)
        .attr("opacity", 1);

    scatterplot
        .transition()
        .duration(1000)
        .attr("opacity", 1)
        .attr("cx", function(d, i) {
            return aScale(d.a)
        })
        .attr("cy", function(d, i) {
            return bScale(d.b);
        })
        .attr("r", function(d, i) {
            return 5;
        });

    scatterplot
        .on("click", function(d) {
            console.log("x: " + d.a + " y: " + d.b);
        })
        .on("mouseover", function(d) {
            d3.select("#tooltip")
                .html(function() {
                    return "x: " + d.a + "</br>" + " y: " + d.b;
                })
                .transition()
                .duration(200)
                .style("display", "block")
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 30) + "px");
        })
        .on("mouseout", function(d) {
            d3.select("#tooltip")
                .style("display", "none");
        });

    scatterplot.exit()
        .transition()
        .duration(1000)
        .attr("opacity", 0)
        .remove();
}

function changeData() {
    // Load the file indicated by the select menu
    var dataFile = document.getElementById('dataset').value;
    d3.csv('data/' + dataFile + '.csv', update);
}

function randomSubset() {
    // Load the file indicated by the select menu,
    // and then slice out a random chunk before
    // passing the data to update()
    var dataFile = document.getElementById('dataset').value;
    d3.csv('data/' + dataFile + '.csv', function(error, data) {
        var subset = [];
        data.forEach(function(d) {
            if (Math.random() > 0.5) {
                subset.push(d);
            }
        });
        console.log(subset.length);
        update(error, subset);
    });
}
