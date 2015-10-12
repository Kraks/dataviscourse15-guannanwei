/*globals d3, queue, CountVis, AgeVis, PrioVis*/

/**
 * Created by Alex Bigelow (alex.bigelowsite.com) on 9/25/15.
 */

(function () {
    // some variables
    var allData = [];
    var metaData = {};

    // this function can convert Date objects to a string
    // it can also convert strings to Date objects
    // see: https://github.com/mbostock/d3/wiki/Time-Formatting
    var dateFormatter = d3.time.format("%Y-%m-%d");

    // call this function after Data is loaded, reformatted and bound to the variables
    function initVis() {
        
        // ******* TASK 3b, 3c *******
        // Create a handler that will deal with a custom event named "selectionChanged"
        // (you will need to edit this line)
        var eventHandler = d3.dispatch("selectionChanged");

        // Instantiate all Vis Objects here
        var countVis = new CountVis(d3.select("#countVis"), allData, metaData, eventHandler);
        var ageVis = new AgeVis(d3.select("#ageVis"), allData, metaData);
        var prioVis = new PrioVis(d3.select("#prioVis"), allData, metaData);
        var compVis = new CompVis(d3.select("#compVis"), allData, metaData);
        
        // ******** TASK 3b, 3c *******
        // Bind the eventHandler to the Vis Objects
        // events will be created from the CountVis object (TASK 4b)
        // events will be consumed by the PrioVis and AgeVis object
        // (you should bind the appropriate functions here)
        // Also make sure to display something reasonable about
        // the brush in #brushInfo

        eventHandler.on("selectionChanged", function(start, end) {
            prioVis.onSelectionChange(start, end);
            ageVis.onSelectionChange(start, end);
            compVis.onSelectionChange(start, end);
        });

    }

    // call this function after both files are loaded -- error should be "null" if no error
    function dataLoaded(error, perDayData, _metaData) {
        if (!error) {
            // make our data look nicer and more useful:
            allData = perDayData.map(function (d) {
                var res = {
                    time: dateFormatter.parse(d.day),
                    count: +d["count(*)"]
                };
                
                res.prios = d3.range(0, 16).map(function (counter) {
                        return d["sum(p" + counter + ")"];
                    });
                res.ages = d3.range(0, 99).map(function () {
                    return 0;
                });
                d.age.forEach(function (a) {
                    if (a.age < 100) {
                        res.ages[a.age] = a["count(*)"];
                    }
                });
                return res;
            });
            metaData = _metaData;

            initVis();
        }
    }

    function startHere() {
        // ******* TASK 1a *******
        // Load each data file ASYNCHRONOUSLY, and then call dataLoaded() when they are finished.
        var loadJsonData = function(path) {
            return new Promise(function(resolve, reject) {
                d3.json(path, function(error, json) {
                    if (error) reject(error);
                    else resolve(json);
                });
            });
        };
        var loadAllData = loadJsonData("data/perDayData.json");
        var loadMetaData = loadJsonData("data/MYWorld_fields.json");

        Promise.all([loadAllData, loadMetaData]).then(function(results) {
            dataLoaded(null, results[0], results[1]);
        });
    }
    
    startHere();
})();
