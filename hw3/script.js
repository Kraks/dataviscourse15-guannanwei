/*globals d3, topojson, document*/
// These are helpers for those using JSHint

var data,
    locationData,
    teamSchedules,
    selectedSeries,
    colorScale;

/* EVENT RESPONSE FUNCTIONS */

function setHover(d) {
    // There are FOUR data_types that can be hovered;
    // nothing (null), a single Game, a Team, or
    // a Location

    // ******* TODO: PART V *******
}

function clearHover() {
    setHover(null);
}

function changeSelection(d) {
    // There are FOUR data_types that can be selected;
    // an empty selection (null), a single Game,
    // a Team, or a Location.

    // ******* TODO: PART V *******

    // Update everything that is data-dependent
    // Note that updateBarChart() needs to come first
    // so that the color scale is set
}

/* DRAWING FUNCTIONS */

function updateBarChart() {
    var svgBounds = document.getElementById("barChart").getBoundingClientRect(),
        xAxisSize = 100,
        yAxisSize = 60;

    var bottomPadding = 90;
    var leftPadding = 60;

    var xScale = d3.scale.ordinal()
        .rangeRoundBands([0, svgBounds.width - leftPadding], 0.1)
        .domain(selectedSeries.map(function(d) {
            return d.Date;
        }));
    var xAxis = d3.svg.axis().scale(xScale).orient("bottom").ticks(selectedSeries.length);
    d3.select("#barChart")
      .select("#xAxis")
      .attr("transform", "translate(0, " + (svgBounds.height - bottomPadding) + ")")
      .call(xAxis)
      .selectAll("text")
      .attr("transform", function(d) {
        return "translate(-20, 50) rotate(270)";
      });
    
    ///////////////////////////////////
    var yScale = d3.scale.linear()
        .range([0, svgBounds.height - bottomPadding])
        .domain([d3.max(selectedSeries, function(d) {
            return d.attendance;
        }), 0]);
    var yAxis = d3.svg.axis().scale(yScale).orient("left");
    d3.select("#barChart")
      .select("#yAxis")
      .call(yAxis);
    
    ///////////////////////////////////
    colorScale = d3.scale.quantize()
      .domain([d3.min(selectedSeries, function(d) {
        return d.attendance; 
      }), d3.max(selectedSeries, function(d) {
        return d.attendance;
      })])
      .range(colorbrewer.PuBu[3]);

    var barInterval = 5;
    var barWidth = (svgBounds.width-leftPadding)/selectedSeries.length - barInterval;
    var rects = d3.select("#barChart").select("#bars")
      .attr("transform", "translate("+barInterval+", "+(svgBounds.height - bottomPadding)+") scale(1, -1)")
      .selectAll("rect").data(selectedSeries)
      .enter()
      .append("rect")
      .attr("opacity", 1)
      .attr("x", function(d, i) {
        return i * (barWidth + 4);
      })
      .attr("y", function(d, i) {
        return 0;
      })
      .attr("width", function(d, i) {
        return barWidth;
      })
      .attr("height", function(d, i) {
        return svgBounds.height - bottomPadding - yScale(d.attendance);
      })
      .style("fill", function(d) {
        console.log(colorScale(d.attendance));
        
        return colorScale(d.attendance);
      })
    
    // ******* TODO: PART IV *******

    // Make the bars respond to hover and click events
}

function updateForceDirectedGraph() {
    // ******* TODO: PART II *******

    // Set up the force-directed
    // layout engine

    // Draw the links (hint: use #links)

    // Update the links based on the current selection

    // Draw the nodes (hint: use #nodes), and make them respond to dragging

    // ******* TODO: PART IV *******

    // Make the nodes respond to hover and click events

    // ******* TODO: PART V *******

    // Color and size the Game nodes if they are in selectedSeries

    // ******* TODO: PART II *******

    // Finally, tell the layout engine how
    // to manipulate the nodes and links
    // that we've drawn
}

function updateMap() {
    // ******* TODO: PART III *******

    // Draw the games on the map (hint: use #points)

    // NOTE: locationData is *NOT* a Javascript Array, like
    // we'd normally use for .data() ... instead, it's just an
    // object (often called an Associative Array)!

    // ******* TODO: PART V *******

    // Update the circle appearance (set the fill to the
    // mean attendance of all selected games... if there
    // are no matching games, revert to the circle's default style)
}

function drawStates(usStateData) {
    // ******* TODO: PART III *******

    // Draw the background (state outlines; hint: use #states)
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
    data.vertices.forEach(function (d, i) {
        indexLookup[d._id] = i;
    });
    data.edges.forEach(function (d) {
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

    data.vertices.forEach(function (d) {
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
    data.edges.forEach(function (d) {
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

d3.json("data/us.json", function (error, usStateData) {
    if (error) throw error;

    drawStates(usStateData);
});
d3.json("data/pac12_2013.json", function (error, loadedData) {
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
    // Draw everything for the first time
    updateBarChart();
    updateForceDirectedGraph();
    updateMap();
});
