/*globals VolumeRenderer, d3, console*/

var renderer,
    allHistograms = {};

var cp  = document.getElementById("colorPicker"),
    cpCtx = cp.getContext('2d');

var initColor = [200, 150, 180];

function initColorPicker() {
    // Reference for color picker:
    // http://stackoverflow.com/questions/19997933/how-can-i-generate-a-rainbow-circle-using-html5-canvas
    var CX = cp.width / 2, CY = cp.height/ 2,
        sx = CX, sy = CY;

    for(var i = 0; i < 360; i+=0.1){
        var rad = i * (2*Math.PI) / 360;
        cpCtx.strokeStyle = "hsla("+i+", 100%, 50%, 1.0)";   
        cpCtx.beginPath();
        cpCtx.moveTo(CX, CY);
        cpCtx.lineTo(CX + sx * Math.cos(rad), CY + sy * Math.sin(rad));
        cpCtx.stroke();
    }

    cp.onclick = function(e) {
        var x = e.offsetX, y = e.offsetY,
            p = cpCtx.getImageData(x, y, 1, 1),
            data = p.data;
        console.log(data);
        updateTransferFunction(data);
    };
}

function updateTransferFunction(color) {
    renderer.updateTransferFunction(function (value) {
        // ******* Your solution here! *******
        // Given a voxel value in the range [0.0, 1.0],
        // return a (probably somewhat transparent) color
        console.log("value: ", value);
        if (value > 2 * 1/3) {
            return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${value})`;
        }
        else if (value > 2 * 1/4) {
            return `rgba(${color[2]}, ${color[0]}, ${color[1]}, ${value})`;
        }
        else {
            return `rgba(${color[1]}, ${color[2]}, ${color[0]}, ${value})`;
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

    updateTransferFunction(initColor);
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
