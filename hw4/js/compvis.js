function CompVis (_parentElement, _data, _metaData) {
    var self = this;

    self.parentElement = _parentElement;
    self.data = _data;
    self.metaData = _metaData;
    self.displayData = [];
    self.overallData = auxFilterAndAggregate(_data, null);

    self.initVis();
}


/**
 * Method should be called as soon as data is available.. sets up the SVG and the variables
 */
CompVis.prototype.initVis = function () {
    var self = this;

    self.svg = self.parentElement.select("svg");

    self.graphW = 500;
    self.graphH = 300;

    self.xScale = d3.scale.ordinal().rangeBands([0, self.graphW], 0.1).domain(d3.range(0, 16));
    // xScale and xAxis stays constant
    self.yScale = d3.scale.linear().range([self.graphH, 0]);
    self.xAxis = d3.svg.axis().scale(self.xScale);
    // xScale and xAxis stays constant
    self.yAxis = d3.svg.axis().scale(self.yScale).orient("left");

    // visual elements
    self.visG = self.svg.append("g").attr({
        "transform": "translate(" + 60 + "," + 10 + ")"
    });

    // xScale and xAxis stays constant:
    // copied from http://bl.ocks.org/mbostock/4403522
    self.visG.append("g")
        .attr("class", "xAxis axis")
        .attr("transform", "translate(0," + self.graphH + ")")
        .call(self.xAxis)
        .selectAll("text")
        .attr("y", 3) // magic number
        .attr("x", 10) // magic number
        .attr("transform", "rotate(45)")
        .style("text-anchor", "start")
        .text(function (d) {
            return self.metaData.priorities[d]["item-title"];
        });

    self.visG.append("g").attr("class", "yAxis axis");

    // filter, aggregate, modify data
    self.wrangleData(null);

    self.lineGenerator = d3.svg.line()
        .x(function(d, i) {
            return self.xScale(i) + 20;
        })
        .y(function(d, i) {
            return self.yScale(d) - 1;
        });

    // init overall line chart
    self.initOverallChart();
};

CompVis.prototype.initOverallChart = function() {
    var self = this;
    // update the scales:
    var minMaxY = [0, d3.max(self.overallData)];
    self.yScale.domain(minMaxY);
    self.yAxis.scale(self.yScale);
    // draw the scales:
    self.visG.select(".yAxis").call(self.yAxis);

    var path = self.visG.append("path");
    path.attr("d", self.lineGenerator(self.overallData))
        .attr("id", "overall")
        .style({
            "stroke": "steelblue",
            "stroke-width": "3px",
            "fill": "none"
        });
};


/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
CompVis.prototype.wrangleData = function (_filterFunction) {
    var self = this;
    
    // displayData should hold the data which is visualized
    self.displayData = self.filterAndAggregate(_filterFunction);
};

/**
 * the drawing function - should use the D3 selection, enter, exit
 */
CompVis.prototype.updateVis = function () {
    var self = this;
    var path = self.visG.select("#selected");
    if (path[0][0] == null) {
        path = self.visG.append("path");
        path.attr("id", "selected");
    }

    path.attr("d", self.lineGenerator(self.displayData))
        .style({
            "stroke": "red",
            "stroke-width": "3px",
            "fill": "none"
        });
};

/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
CompVis.prototype.onSelectionChange = function (selectionStart, selectionEnd) {
    var self = this;

    // call wrangleData with a filter function
    self.wrangleData(function (data) {
        return (data.time <= selectionEnd && data.time >= selectionStart);
    });

    self.updateVis();
};

/*
 *
 * ==================================
 * From here on only HELPER functions
 * ==================================
 *
 **/

var repeat = function(val, n) {
    var arr = [];
    for (var i = 1; i <= n; i++) {
        arr.push(val);
    }
    return arr;
};

var auxFilterAndAggregate = function(data, _filter) {
    var filter = function(){return true;};
    if (_filter !== null){
        filter = _filter;
    }
    
    return data.filter(filter).map(function(each) {
        return each.prios;
    }).reduce(function(x, y) {
        return x.map(function(v, i) { return v + y[i]; });
    }, repeat(0, 16));
};

/**
 * The aggregate function that creates the counts for each priority for a given filter.
 * @param _filter - A filter can be, e.g.,  a function that is only true for data of a given time range
 * @returns {Array|*}
 */
CompVis.prototype.filterAndAggregate = function (_filter) {
    var self = this;

    // Set filter to a function that accepts all items
    // ONLY if the parameter _filter is NOT null use this parameter
    return auxFilterAndAggregate(self.data, _filter);
};

