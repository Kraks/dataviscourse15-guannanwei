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
 * PrioVis object for HW4
 * @param _parentElement -- the (D3-selected) HTML or SVG element to which to attach the vis
 * @param _data -- the data array
 * @param _metaData -- the meta-data / data description object
 * @constructor
 */
function PrioVis (_parentElement, _data, _metaData) {
    /**
     * A word about "this":
     *
     * The meaning of "this" can change from function call to function call; the way
     * we have implemented the class, "this" refers to the PrioVis class
     * in each of the PrioVis.prototype.xxxxxxxx = functions.
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
PrioVis.prototype.initVis = function () {
    var self = this; // read about the this

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

    // call the update method
    self.updateVis();
};


/**
 * Method to wrangle the data. In this case it takes an options object
 * @param _filterFunction - a function that filters data or "null" if none
 */
PrioVis.prototype.wrangleData = function (_filterFunction) {
    var self = this;
    
    // displayData should hold the data which is visualized
    self.displayData = self.filterAndAggregate(_filterFunction);
};

/**
 * the drawing function - should use the D3 selection, enter, exit
 */
PrioVis.prototype.updateVis = function () {
    var self = this;

    // update the scales :
    var minMaxY = [0, d3.max(self.displayData)];
    self.yScale.domain(minMaxY);
    self.yAxis.scale(self.yScale);

    // draw the scales :
    self.visG.select(".yAxis").call(self.yAxis);
    
    // draw the bars :
    var bars = self.visG.selectAll(".bar").data(self.displayData);
    bars.exit().remove();
    bars.enter().append("rect")
        .attr({
            "class": "bar",
            "width": self.xScale.rangeBand(),
            "x": function (d, i) {
                return self.xScale(i);
            }
        }).style({
            "fill": function (d, i) {
                return self.metaData.priorities[i]["item-color"];
            }
        });

    bars.attr({
        "height": function (d) {
            return self.graphH - self.yScale(d) - 1;
        },
        "y": function (d) {
            return self.yScale(d);
        }
    });
};


/**
 * Gets called by event handler and should create new aggregated data
 * aggregation is done by the function "aggregate(filter)". Filter has to
 * be defined here.
 * @param selection
 */
PrioVis.prototype.onSelectionChange = function (selectionStart, selectionEnd) {
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

/**
 * The aggregate function that creates the counts for each priority for a given filter.
 * @param _filter - A filter can be, e.g.,  a function that is only true for data of a given time range
 * @returns {Array|*}
 */
PrioVis.prototype.filterAndAggregate = function (_filter) {
    var self = this;

    // Set filter to a function that accepts all items
    // ONLY if the parameter _filter is NOT null use this parameter
    var filter = function(){return true;};
    if (_filter !== null){
        filter = _filter;
    }
    
    // ******* TASK 1b *******
    // Implement the function that filters the data and sums the values
    return self.data.filter(filter).map(function(each) {
        return each.prios;
    }).reduce(function(x, y) {
        return x.map(function(v, i) { return v + y[i]; });
    }, repeat(0, 16));
};
