/*globals d3, jQuery*/

/**
 * Created by Hendrik Strobelt (hendrik.strobelt.com) on 1/28/15.
 * Modified by Alex Bigelow (alex.bigelowsite.com) on 9/25/15.
 * Modified by Alexander Lex (alexander.lex@gmail.com) on 9/25/15.
 */

/*
 * ======================================================
 * We follow the vis template of init - wrangle - update
 * ======================================================
 *
 * */

/**
 * CountVis object for HW4
 * @param _parentElement -- the (D3-selected) HTML or SVG element in which to draw the Vis
 * @param _eventHandler -- the Eventhandling Object to emit data to (see Task 4)
 * @constructor
 */
function CountVis(_parentElement, _data, _metaData, _eventHandler) {
    /**
     * A word about "this":
     *
     * The meaning of "this" can change from function call to function call; the way
     * we have implemented the class, "this" refers to the CountVis class
     * in each of the CountVis.prototype.xxxxxxxx = functions.
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
    self.eventHandler = _eventHandler;
    self.displayData = [];

    self.initVis();
}

/**
 * Method should be called as soon as data is available. Sets up the SVG and the variables
 * @param _data -- the data array
 * @param _metaData -- the meta-data / data description object
 */
CountVis.prototype.initVis = function () {
    var self = this;

    self.svg = d3.select("#countVis svg");

    self.graphW = 550;
    self.graphH = 270;

    self.xScale = d3.time.scale().range([0, self.graphW]);
    self.yScale = d3.scale.pow().exponent(1).range([self.graphH, 0]);
    //self.yScale = d3.scale.pow().range([self.graphH, 0]); // POWER SCALE HERE !!!

    self.xAxis = d3.svg.axis().scale(self.xScale);
    self.yAxis = d3.svg.axis().scale(self.yScale).orient("left");

    // visual elements
    self.visG = self.svg.append("g").attr({
        "transform": "translate(" + 100 + "," + 10 + ")"
    });
    
    //////////////////////////
    // ******* TASK 2a and 3a *******
    // define a clipping region for the graph, create the brush
    var dates = self.data.map(function(d) { return d.time; });
    var dateBegin = d3.min(dates)
    var dateEnd = d3.max(dates);

    var visScale = d3.time.scale().domain([dateBegin, dateEnd]).range([self.graphW, 0]); //TODO
    var brushed = function(x) {
        //self.updateVis();
        if (!brush.empty()) {
            var extent = brush.extent();
            self.eventHandler.selectionChanged(extent[0], extent[1]);
        }
    };

    var brush = d3.svg.brush().x(visScale).on("brush", brushed);
    self.visG.append("g")
        .attr("class", "brush")
        .call(brush)
        .selectAll("rect").attr({
            height: self.graphH
        });
    //////////////////////////

    self.visG.append("g").attr("class", "xAxis axis").attr("transform", "translate(0," + self.graphH + ")");
    self.visG.append("g").attr("class", "yAxis axis");

    // filter, aggregate, modify data
    self.wrangleData();

    // define the domain of scales, because they do not change for countvis
    var minMaxY = [0, d3.max(self.displayData.map(function (d) {
        return d.count;
    }))];
    self.yScale.domain(minMaxY);

    var minMaxX = d3.extent(self.displayData.map(function (d) {
        return d.time;
    }));
    self.xScale.domain(minMaxX);
   
    // ******* TASK 2b *******
    self.addSlider(self.svg);
    
    // ******* BONUS TASK 2c *******
    // define zoom

    // call the update method
    self.updateVis();
};


/**
 * Method to wrangle the data
 */
CountVis.prototype.wrangleData = function () {
    var self = this;

    // displayData should hold the data which is visualized
    // pretty simple in this case -- no modifications needed
    self.displayData = self.data;
};

/**
 * The main drawing function
 */
CountVis.prototype.updateVis = function () {
    var self = this;

    // update the scales :
    self.yAxis.scale(self.yScale);
    self.xAxis.scale(self.xScale);

    // draw the scales :
    self.visG.select(".xAxis").call(self.xAxis);
    self.visG.select(".yAxis").call(self.yAxis);

    // ******* TASK 2a *******
    // update the brush

    // ******* BONUS TASK 2c *******
    // add zoom, and block two events
    
    var area = d3.svg.area()
        .x(function (d) {
            return self.xScale(d.time);
        })
        .y0(270)
        .y1(function (d) {
            return self.yScale(d.count);
        });
    area.interpolate("step");

    // ******* BONUS TASK 2c (you will need to edit this code) *******
    var areaGraph = self.visG.selectAll(".area").data([self.displayData]);
    areaGraph.enter()
        .append("path")
        .attr("class", "area");

    areaGraph
        .attr("d", area);
};

/**
 * Creates the y axis slider
 * @param svg -- the svg element to which the slider is attached
 * See http://bl.ocks.org/mbostock/6452972 for an example
 * TODO: implement the update of the scale according to the value of the slider in this function
 */
CountVis.prototype.addSlider = function (svg) {
    var self = this;
    // Think of what is domain and what is range for the y axis slider !!

    var sliderScale = d3.scale.linear().domain([1, 0.1]).range([200, 0]);

    var sliderDragged = function () {
        var value = Math.max(0, Math.min(200, d3.event.y));

        var sliderValue = sliderScale.invert(value);
        
        // ******* TASK 2b *******
        // the current value of the slider:
        self.yScale.exponent(sliderValue);
        
        // do something here to deform the y scale
        d3.select(this)
            .attr("y", function () {
                return sliderScale(sliderValue);
            });

        self.updateVis({});
    };
    var sliderDragBehaviour = d3.behavior.drag()
        .on("drag", sliderDragged);

    var sliderGroup = svg.append("g").attr({
        class: "sliderGroup",
        "transform": "translate(" + 0 + "," + 30 + ")"
    });

    sliderGroup.append("rect").attr({
        class: "sliderBg",
        x: 5,
        width: 10,
        height: 200
    }).style({
        fill: "lightgray"
    });

    sliderGroup.append("rect").attr({
        "class": "sliderHandle",
        y: sliderScale(1),
        width: 20,
        height: 10,
        rx: 2,
        ry: 2
    }).style({
        fill: "#333333"
    }).call(sliderDragBehaviour);
};
