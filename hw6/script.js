/*globals VolumeRenderer, d3, console*/

var renderer,
    allHistograms = {};

var currentColor = [[200, 150, 180], [145, 123, 231], [123, 45, 19]];
var currentRatio = [0.3, 0.6];

function initColorPicker() {
    [1, 2, 3].map(function(no) {
        $("#step" + no).spectrum({
            color: "rgb(" + currentColor[no-1].join(",") + ")",
            showButtons: false,
            move: function(c) { 
                c = c.toRgb();
                currentColor[no-1] = [c.r, c.g, c.b];
                updateTransferFunction(currentColor, currentRatio);
            }
        });
    })
}

function initRanger() {
    var MAX_SIZE = 500;
    $("#colorPicker" ).slider({
        range: true,
        min: 0,
        max: MAX_SIZE,
        values: currentRatio.map(function(v) { return v * MAX_SIZE; }),
        change: function(e, ui) {
            currentRatio = ui.values.map(function(v) { return v / MAX_SIZE; });
            updateTransferFunction(currentColor, currentRatio);
        }
    });
}

function updateTransferFunction(colors, ratio) {
    renderer.updateTransferFunction(function (value) {
        // ******* Your solution here! *******
        // Given a voxel value in the range [0.0, 1.0],
        // return a (probably somewhat transparent) color
        if (value > ratio[1]) {
            return `rgba(${colors[0][0]}, ${colors[0][1]}, ${colors[0][2]}, ${value})`;
        }
        else if (value > ratio[0]) {
            return `rgba(${colors[1][0]}, ${colors[1][1]}, ${colors[1][2]}, ${value})`;
        }
        else {
            return `rgba(${colors[2][0]}, ${colors[2][1]}, ${colors[2][2]}, ${value})`;
        }
    });
}

function setup() {
    d3.select('#volumeMenu').on('change', function () {
        renderer.switchVolume(this.value);
        console.log(this.value + ' histogram:', getHistogram(this.value, 0.025));
    });
    console.log('bonsai histogram:', getHistogram('bonsai', 0.025));
    initColorPicker();
    initRanger();

    updateTransferFunction(currentColor, currentRatio);
}

/*

You shouldn't need to edit any code beyond this point
(though, as this assignment is more open-ended, you are
welcome to edit as you see fit)

*/


function getHistogram(volumeName, binSize) {
    /*
    This function resamples the histogram
    and returns bins from 0.0 to 1.0 with
    the appropriate counts
    (binSize should be between 0.0 and 1.0)
    
    */
    
    var steps = 256,    // the original histograms ranges from 0-255, not 0.0-1.0
        result = [],
        thisBin,
        i = 0.0,
        j,
        nextBin;
    while (i < 1.0) {
        thisBin = {
            count : 0,
            lowBound : i,
            highBound : i + binSize
        };
        j = Math.floor(i * steps);
        nextBin = Math.floor((i + binSize) * steps);
        while (j < nextBin && j < steps) {
            thisBin.count += Number(allHistograms[volumeName][j].count);
            j += 1;
        }
        i += binSize;
        result.push(thisBin);
    }
    return result;
}

/*
Program execution starts here:

We create a VolumeRenderer once we've loaded all the csv files,
and VolumeRenderer calls setup() once it has finished loading
its volumes and shader code

*/
var loadedHistograms = 0,
    volumeName,
    histogramsToLoad = {
        'bonsai' : 'volumes/bonsai.histogram.csv',
        'foot' : 'volumes/foot.histogram.csv',
        'teapot' : 'volumes/teapot.histogram.csv'
    };

function generateCollector(name) {
    /*
    This may seem like an odd pattern; why are we generating a function instead of
    doing this inline?
    
    The trick is that the "volumeName" variable in the for loop below changes, but the callbacks
    are asynchronous; by the time any of the files are loaded, "volumeName" will always refer
    to "teapot"**. By generating a function this way, we are storing "volumeName" at the time that
    the call is issued in "name".
    
    ** This is yet ANOTHER javascript quirk: technically, the order that javascript iterates
    over an object's properties is arbitrary (you wouldn't want to rely on the last value
    actually being "teapot"), though in practice most browsers iterate in the order that
    properties were originally assigned.
    
    */
    return function (error, data) {
        if (error) {
            throw new Error("Encountered a problem loading the histograms!");
        }
        allHistograms[name] = data;
        loadedHistograms += 1;
        
        if (loadedHistograms === Object.keys(histogramsToLoad).length) {
            renderer = new VolumeRenderer('renderContainer', {
                'bonsai': 'volumes/bonsai.raw.png',
                'foot': 'volumes/foot.raw.png',
                'teapot': 'volumes/teapot.raw.png'
            }, setup);
        }
    };
}

for(volumeName in histogramsToLoad) {
    if (histogramsToLoad.hasOwnProperty(volumeName)) {
        d3.csv(histogramsToLoad[volumeName], generateCollector(volumeName));
    }
}
