/*globals d3, topojson, document*/
// These are helpers for those using JSHint

var data,
    locationData,
    teamSchedules,
    selectedSeries,
    colorScale;

// Here add global max attendance and min attendance
var maxAttendance = 0;
var minAttendance = 0;

/* EVENT RESPONSE FUNCTIONS */

function setHover(d) {
    // There are FOUR data_types that can be hovered;
    // nothing (null), a single Game, a Team, or
    // a Locationd
    var getPlayers = function(game) {
        return game["Home Team Name"] + "@" + game["Visit Team Name"]
    }
    var info = d3.select("#info");
    if (d == null) {
        info.html("");
    } else if (d.data_type === "Team") {
        info.html(d.name);
    } else if (d.data_type === "Game") {
        info.html(getPlayers(d));
    } else if (d.data_type === "Location") {
        info.html(d.games.map(getPlayers));
    } else {
        //do nothing
    }
}

function clearHover() {
    setHover(null);
}

function resetPoints() {
    d3.select("#map")
        .selectAll("circle")
        .style("fill", "transparent")
        .style("r", 5);
}

function findMaxAndMinAttendance() {
    // find the max and min of all attendance.
    for (var team in teamSchedules) {
        var teamMax = teamSchedules[team].map(function(x) {
            return x.attendance;
        }).reduce(function(x, y) {
            if (x > y) return x;
            return y;
        });
        if (teamMax > maxAttendance) maxAttendance = teamMax;

        var teamMin = teamSchedules[team].map(function(x) {
            return x.attendance;
        }).reduce(function(x, y) {
            if (x < y) return x;
            return y;
        });
        if (teamMin < minAttendance || minAttendance === 0)
            minAttendance = teamMin;
    }
}

function auxPointFill(d) {
    return colorScale(d.games.map(function(x) {
        return x.attendance || 0;
    }).reduce(function(x, y) {
        return x + y;
    }) / d.games.length);
}

function auxUpdateForceLayout(filterFunc) {
    d3.select("#nodes").selectAll("path")
        .filter(filterFunc)
        .attr("transform", function(d) {
            return "translate(" + d.x + ", " + d.y + ") scale(2)";
        })
        .style("fill", function(node) {
            return colorScale(node.attendance);
        });
}

function auxUpdateMapPoint(filterFunc) {
    d3.select("#map").selectAll("circle")
        .filter(filterFunc)
        .style("fill", auxPointFill)
        .style("r", 10);
}

function resetNodes() {
    d3.select("#nodes").selectAll("path")
        .style("fill", function(d) {
            if (d.data_type === "Team") return "gray";
            return "white";
        })
        .style("stroke", "gray")
        .attr("transform", function(d, i) {
            return "translate(" + d.x + ", " + d.y + ") scale(1) ";
        });
}

function changeSelection(d) {
    var tagName = this.tagName;

    resetNodes();
    resetPoints();
    if (tagName === "rect") {
        selectedSeries = [d];
        auxUpdateForceLayout(function(n, i) {
            return n["_id"] === d["_id"];
        });
        auxUpdateMapPoint(function(p, i) {
            return p.games.map(function(g) {
                return g["_id"];
            }).indexOf(d["_id"]) !== -1;
        });
    } else if (tagName === "path") {
        var locations;
        if (d.data_type === "Team") {
            selectedSeries = teamSchedules[d.name];
            locations = selectedSeries.map(function(d) {
                return d["latitude"] + "," + d["longitude"];
            });

            var selectedNodesId = selectedSeries.map(function(d) {
                return d["_id"];
            });
            auxUpdateForceLayout(function(d, i) {
                return (d.data_type === "Game" && selectedNodesId.indexOf(d["_id"]) !== -1);
            });
        } else if (d.data_type === "Game") {
            selectedSeries = [d];
            locations = [d["latitude"] + "," + d["longitude"]];
            auxUpdateForceLayout(function(n, i) {
                return n["_id"] === d["_id"];
            })
        }

        auxUpdateMapPoint(function(d, i) {
            return locations.indexOf(d["latitude"] + "," + d["longitude"]) !== -1;
        });
    } else if (tagName === "circle") {
        selectedSeries = d.games;
        d3.select(this).style("fill", auxPointFill).style("r", 10);
        var gamesId = d.games.map(function(x) {
            return x["_id"];
        });
        auxUpdateForceLayout(function(d, i) {
            return (d.data_type === "Game" && gamesId.indexOf(d["_id"]) !== -1);
        });
    } else {
        //do nothing
    }
    updateBarChart();
}

/* DRAWING FUNCTIONS */

function updateBarChart() {
    var svgBounds = document.getElementById("barChart").getBoundingClientRect(),
        xAxisSize = 100,
        yAxisSize = 60;

    var xScale = d3.scale.ordinal()
        .rangeRoundBands([0, svgBounds.width - yAxisSize], 0.1)
        .domain(selectedSeries.map(function(d) {
            return d.Date;
        }));
    var xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(selectedSeries.length);

    d3.select("#barChart")
        .select("#xAxis")
        .attr("transform", "translate(0, " + (svgBounds.height - xAxisSize) + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("transform", function(d) {
            return "translate(-20, 50) rotate(270)";
        });

    ///////////////////////////////////
    var yScale = d3.scale.linear()
        .range([0, svgBounds.height - xAxisSize])
        .domain([maxAttendance, minAttendance]);
    var yAxis = d3.svg.axis().scale(yScale).orient("left");

    d3.select("#barChart")
        .select("#yAxis")
        .call(yAxis);

    ///////////////////////////////////
    var barInterval = 5;
    var barWidth = (svgBounds.width - yAxisSize) / selectedSeries.length - barInterval;

    d3.select("#barChart").select("#bars")
        .attr("transform", "translate(" + barInterval + ", " + (svgBounds.height - xAxisSize) + ") scale(1, -1)");
    var rects = d3.select("#barChart").select("#bars").selectAll("rect").data(selectedSeries);

    rects.enter()
        .append("rect");

    rects
        .attr("x", function(d, i) {
            return i * (barWidth + 4);
        })
        .attr("y", 0)
        .style("fill", function(d) {
            return colorScale(d.attendance);
        })
        .attr("width", barWidth)
        .attr("height", function(d, i) {
            return svgBounds.height - xAxisSize - yScale(d.attendance);
        });

    rects.on("click", changeSelection)
        .on("mouseenter", setHover)
        .on("mouseleave", clearHover);

    rects.exit().remove();
}

var auxGetScale = function(s) {
    if (s == null) return "1";
    var pos = s.indexOf("scale(");
    if (pos !== -1) {
        return s.slice(pos+6, pos+6+1);
    }
    return "1";
}

function updateForceDirectedGraph() {
    var svgBounds = document.getElementById("graph").getBoundingClientRect();
    var width = svgBounds.width;
    var height = svgBounds.height;
    var force = d3.layout.force()
        .charge(-120)
        .linkDistance(30)
        .friction(0.9)
        .gravity(0.1)
        .size([width, height]);

    force.nodes(data.vertices)
        .links(data.edges)
        .start();

    var link = d3.select("#links")
        .selectAll("line")
        .data(data.edges)
        .enter()
        .append("line")
        .style("stroke-width", function(d) {
            return 1.5;
        });

    var node = d3.select("#nodes")
        .selectAll("path")
        .data(data.vertices)
        .enter()
        .append("path")
        .attr("d",
            d3.svg.symbol()
            .type(function(d) {
                if (d.data_type === "Team")
                    return "triangle-up";
                return "circle";
            }))
        .style("fill", function(d) {
            if (d.data_type === "Team") return "gray";
            return "white";
        })
        .style("stroke", "gray")
        .call(force.drag);

    node
        .on("click", changeSelection)
        .on("mouseenter", setHover)
        .on("mouseleave", clearHover);

    force.on("tick", function(x) {
        link
            .attr("x1", function(d) {
                return d.source.x;
            })
            .attr("y1", function(d) {
                return d.source.y;
            })
            .attr("x2", function(d) {
                return d.target.x;
            })
            .attr("y2", function(d) {
                return d.target.y;
            });

        node
            .attr("transform", function(d) {
                // It's a ugly way to deal with scale when tick
                // but works good
                var s = auxGetScale(this.getAttribute("transform"));
                return "translate(" + d.x + ", " + d.y + ") scale(" + s + ")";
            });
    });

}

function updateMap() {
    var proj = d3.geo.albers().scale(1060);

    var points = d3.select("#map")
        .select("#points")
        .selectAll("circle")
        .data(d3.values(locationData));

    points
        .enter()
        .append("circle");

    points
        .attr("cx", function(d) {
            return proj([d.longitude, d.latitude])[0];
        })
        .attr("cy", function(d) {
            return proj([d.longitude, d.latitude])[1];
        })
        .attr("r", 5)
        .style("fill", "transparent")
        .style("stroke", "gray");

    points.on("click", changeSelection)
        .on("mouseenter", setHover)
        .on("mouseleave", clearHover);
}

function drawStates(usStateData) {
    // Reference: http://bl.ocks.org/mbostock/4108203
    var path = d3.geo.path();
    var states = topojson.feature(usStateData, usStateData.objects.states);
    d3.select("#map").select("#states")
        .data([states])
        .attr("d", path);
}

/* DATA DERIVATION */

// You won't need to edit any of this code, but you
// definitely WILL need to read through it to
// understand how to do the assignment!

function dateComparator(a, b) {
    // Compare actual dates instead of strings!
    return Date.parse(a.Date) - Date.parse(b.Date);
}

function isObjectInArray(obj, array) {
    // With Javascript primitives (strings, numbers), you
    // can test its presence in an array with
    // array.indexOf(obj) !== -1

    // However, with actual objects, we need this
    // helper function:
    var i;
    for (i = 0; i < array.length; i += 1) {
        if (array[i] === obj) {
            return true;
        }
    }
    return false;
}

function deriveGraphData() {
    // Currently, each edge points to the "_id" attribute
    // of each node with "_outV" and "_inV" attributes.
    // d3.layout.force expects source and target attributes
    // that point to node index numbers.

    // This little snippet adds "source" and "target"
    // attributes to the edges:
    var indexLookup = {};
    data.vertices.forEach(function(d, i) {
        indexLookup[d._id] = i;
    });
    data.edges.forEach(function(d) {
        d.source = indexLookup[d._outV];
        d.target = indexLookup[d._inV];
    });
}

function deriveLocationData() {
    var key;

    // Obviously, lots of games are played in the same location...
    // ... but we only want one interaction target for each
    // location! In fact, when we select a location, we want to
    // know about ALL games that have been played there - which
    // is a different slice of data than what we were given. So
    // let's reshape it ourselves!

    // We're going to create a hash map, keyed by the
    // concatenated latitude / longitude strings of each game
    locationData = {};

    data.vertices.forEach(function(d) {
        // Only deal with games that have a location
        if (d.data_type === "Game" &&
            d.hasOwnProperty('latitude') &&
            d.hasOwnProperty('longitude')) {

            key = d.latitude + "," + d.longitude;

            // Each data item in our new set will be an object
            // with:

            // latitude and longitude properties,

            // a data_type property, similar to the ones in the
            // original dataset that you can use to identify
            // what type of selection the current selection is,

            // and a list of all the original game objects that
            // happened at this location

            if (!locationData.hasOwnProperty(key)) {
                locationData[key] = {
                    "latitude": d.latitude,
                    "longitude": d.longitude,
                    "data_type": "Location",
                    "games": []
                };
            }
            locationData[key].games.push(d);
        }
    });

    // Finally, let's sort each list of games by date
    for (key in locationData) {
        if (locationData.hasOwnProperty(key)) {
            locationData[key].games = locationData[key].games.sort(dateComparator);
        }
    }
}

function deriveTeamSchedules() {
    var teamName;

    // We're going to need a hash map, keyed by the
    // Name property of each team, containing a list
    // of all the games that team played, ordered by
    // date
    teamSchedules = {};

    // First pass: I'm going to sneakily iterate over
    // the *edges*... this will let me know which teams
    // are associated with which games
    data.edges.forEach(function(d) {
        // "source" always refers to a game; "target" always refers to a team
        teamName = data.vertices[d.target].name;
        if (!teamSchedules.hasOwnProperty(teamName)) {
            teamSchedules[teamName] = [];
        }
        teamSchedules[teamName].push(data.vertices[d.source]);
    });

    // Now that we've added all the game objects, we still need
    // to sort by date
    for (teamName in teamSchedules) {
        if (teamSchedules.hasOwnProperty(teamName)) {
            teamSchedules[teamName] = teamSchedules[teamName].sort(dateComparator);
        }
    }
}

/* DATA LOADING */

// This is where execution begins; everything
// above this is just function definitions
// (nothing actually happens)

d3.json("data/us.json", function(error, usStateData) {
    if (error) throw error;

    drawStates(usStateData);
});
d3.json("data/pac12_2013.json", function(error, loadedData) {
    if (error) throw error;

    // Store the data in a global variable for all functions to access
    data = loadedData;

    // These functions help us get slices of the data in
    // different shapes
    deriveGraphData();
    deriveLocationData();
    deriveTeamSchedules();

    // Start off with Utah's games selected
    selectedSeries = teamSchedules.Utah;

    findMaxAndMinAttendance();
    // colorScale should initialze only once.
    colorScale = d3.scale.quantize()
        .domain([minAttendance, maxAttendance]).range(colorbrewer.PuBu[8].slice(2));

    // Draw everything for the first time
    updateBarChart();
    updateForceDirectedGraph();
    updateMap();
});
