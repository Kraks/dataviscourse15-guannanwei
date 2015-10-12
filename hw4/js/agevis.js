/*globals d3*/

/**
 * Created by Hendrik Strobelt (hendrik.strobelt.com) on 1/28/15.
 * Modified by Alex Bigelow (alex.bigelowsite.com) on 9/25/15.
 */

/*
 *
 * ======================================================
 * We follow the vis template of init - wrangle - update
 * ======================================================
 *
 * */

/**
 * AgeVis object for HW4
 * @param _parentElement -- the (D3-selected) HTML or SVG element to which to attach the vis
 * @param _data -- the data array
 * @param _metaData -- the meta-data / data description object
 * @constructor
 */
function AgeVis(_parentElement, _data, _metaData) {
    /**
     * A word about "this":
     *
     * The meaning of "this" can change from function call to function call; the way
     * we have implemented the class, "this" refers to the AgeVis class
     * in each of the AgeVis.prototype.xxxxxxxx = functions.
     * However, when you create inline functions, "this" often refers
     * to something else. Usually it points to the function itself. In D3
     * .attr(function (d, i) {}) functions, for example, "this" refers
     * to the DOM element that corresponds to the "d" data value.
     * 
     * It's usually a good idea to store a reference to the class itself
     * so that you can still refer to the class inside one of these functions;
     * in this case, we rename the class-level "this" as "self" (though you
     * could name it anything you want).
     */
    var self = this;

    self.parentElement = _parentElement;
    self.data = _data;
    self.metaData = _metaData;
    self.displayData = [];

    self.initVis();
}

/**
 * Method should be called as soon as data is available.. sets up the SVG and the variables
 */
AgeVis.prototype.initVis = function () {
    var self = this;
    self.svg = self.parentElement.select("svg");

    self.graphW = 200;
    self.graphH = 270;

    self.xScale = d3.scale.linear().range([0, self.graphW]);
    self.yScale = d3.scale.linear().range([0, self.graphH]).domain([0, 99]);
    // the yScale and yAxis are constant, they don't change with data

    self.xAxis = d3.svg.axis().scale(self.xScale).ticks(5);
    self.yAxis = d3.svg.axis().scale(self.yScale).orient("left");
    // the yScale and yAxis are constant, they don't change with data

    // visual elements
    self.visG = self.svg.append("g").attr({
        "transform": "translate(" + 20 + "," + 10 + ")"
    });

    self.visG.append("g").attr("class", "xAxis axis").attr("transform", "translate(0," + self.graphH + ")");

    self.visG.append("g").attr("class", "yAxis axis").call(self.yAxis);
    // the yScale and yAxis are constant, they don't change with data -- no update needed

    // filter, aggregate, modify data
    self.wrangleData(null);

    // call the update method
    self.updateVis();
};

/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
AgeVis.prototype.wrangleData = function (_filterFunction) {
    var self = this;
    // displayData should hold the data which is visualized
    self.displayData = self.filterAndAggregate(_filterFunction);

    //// you might be able to pass some options,
    //// if you don't pass options -- set the default options
    //// the default is: var options = {filter: function(){return true;} }
    //var options = _options || {filter: function(){return true;}};
};


/**
 * the drawing function - should use the D3 selection, enter, exit
 */
AgeVis.prototype.updateVis = function () {
    // Dear JS hipster,
    // you might be able to pass some options as parameter _option
    // But it's not needed to solve the task.
    // var options = _options || {};

    var self = this;

    // update the scales:
    var minMaxX = d3.extent(self.displayData);
    self.xScale.domain(minMaxX);
    self.xAxis.scale(self.xScale);

    // draw the scales:
    self.visG.select(".xAxis").call(self.xAxis);

    // area path generator:
    var area = d3.svg.area()
        .x1(function (d, i) {
            return self.xScale(d);
        })
        .x0(0)
        .y(function (d, i) {
            return self.yScale(i);
        });
    area.interpolate("step");

    // draw the path:
    var areaGraph = self.visG.selectAll(".area").data([self.displayData]);
    areaGraph.enter()
        .append("path")
        .attr("class", "area");
    areaGraph
        .attr("d", area);
};

/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
AgeVis.prototype.onSelectionChange = function (selectionStart, selectionEnd) {
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
 * */

/**
 * The aggregate function that creates the counts for each age for a given filter.
 * @param _filter - A filter can be, e.g.,  a function that is only true for data of a given time range
 * @returns {Array|*}
 */
AgeVis.prototype.filterAndAggregate = function (_filter) {
    var self = this;

    // Set filter to a function that accepts all items
    // ONLY if the parameter _filter is NOT null use this parameter
    var filter = function () {
        return true;
    };
    if (_filter !== null) {
        filter = _filter;
    }
    // Dear JS hipster, a more hip variant of this construct would be:
    // var filter = _filter || function(){return true;}

    // create an array of values for age 0-99
    var res = d3.range(0, 99).map(function () {
        return 0;
    });

    // accumulate all values that fulfill the filter criterion

    // Implement the function that filters the data and sums the values
    self.data.filter(filter).forEach(function (datum) {
        d3.range(0, 99).forEach(function (index) {
            res[index] += datum.ages[index];
        });
    });

    return res;
};
