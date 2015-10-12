/*globals d3*/

/**
 * Created by Hendrik Strobelt (hendrik.strobelt.com) on 3/1/15.
 * Modified by Alex Bigelow (alex.bigelowsite.com) on 9/24/15.
 */


function Tester() {
    this.t1a_Selector = "#t2a";
    this.t1b_Selector = "#t2b";
}

Tester.prototype.allLoaded = function (perDayData, metaData) {
    var passed = false;

    if (perDayData !== null && perDayData.length > 300) {
        if (metaData && metaData.hasOwnProperty("priorities")) {
            // DO NOT CHANGE
            d3.select(this.t1a_Selector).attr({
                class: "panel panel-success"
            }).selectAll(".panel-heading").text("Task 1a seems to be solved");
            
            passed = true;
        }
    }
    
    if (!passed) {
        d3.select(this.t1a_Selector).attr({
            class: "panel panel-danger"
        }).selectAll(".panel-heading").text("Task 1a not solved");
    }
};

Tester.prototype.checkCount = function (count) {
    // DO NOT CHANGE
    if (count == 21835) {
        d3.select(this.t1b_Selector).attr({
            class: "panel panel-success"
        }).selectAll(".panel-heading").text("Task 1b seems to be solved");
    } else if (count >= 20100 && count < 21835) {
        d3.select(this.t1b_Selector).attr({
            class: "panel panel-warning"
        }).selectAll(".panel-heading").text("Task 1b -- have you included Jan 1 and Jan 31 as counts?");
    } else {
        d3.select(this.t1b_Selector).attr({
            class: "panel panel-danger"
        }).selectAll(".panel-heading").text("Task 1b -- not yet there..");
    }
};

Tester.prototype.simpleTest = function () {
    d3.select("#t4a1").attr({
        class: "panel panel-success"
    }).selectAll(".panel-heading").text("Task 4a - simple Test seems to be solved");
};

Tester.prototype.sumTest = function (x) {
    if (x == 30) {
        d3.select("#t4a2").attr({
            class: "panel panel-success"
        }).selectAll(".panel-heading").text("Task 4b - sum Test seems to be solved");
    } else {
        d3.select("#t4a2").attr({
            class: "panel panel-danger"
        }).selectAll(".panel-heading").text("Task 4b - not yet there");
    }

};

var tester = new Tester();