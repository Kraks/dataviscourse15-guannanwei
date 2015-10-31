/*globals Detector, THREE, Stats, XMLHttpRequest, document, window*/

function VolumeRenderer(targetDivId, volumes, callback) {
    "use strict";
    var self = this;
    
    if (!Detector.webgl) {
        Detector.addGetWebGLMessage();
    }
    
    self.container = document.getElementById(targetDivId);
    
    // Load the 2D volume slices
    self.cubeTextures = {};
    var volName;
    for (volName in volumes) {
        self.cubeTextures[volName] = THREE.ImageUtils.loadTexture(volumes[volName]);
    }
    
    // Some initial settings
    self.steps = 256;
    self.alphaCorrection = 0.05;
    
    // Set up THREE.js stuff
    self.clock = new THREE.Clock();
    
    var bounds = self.container.getBoundingClientRect();
    self.camera = new THREE.PerspectiveCamera(40, bounds.width / bounds.height, 0.01, 3000.0);
    self.camera.position.z = 2.0;
    
    self.controls = new THREE.OrbitControls(self.camera, self.container);
    self.controls.center.set(0.0, 0.0, 0.0);
    
    self.rtTexture = new THREE.WebGLRenderTarget(bounds.width, bounds.height, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBFormat,
        type: THREE.FloatType
    });
    self.rtTexture.wrapS = self.rtTexture.wrapT = THREE.ClampToEdgeWrapping;
    
    self.renderer = new THREE.WebGLRenderer();
    self.container.appendChild(self.renderer.domElement);
    
    // Init our transfer texture
    self.transferTexture = self.updateTransferFunction();
    
    // These obviously don't do anything yet... just
    // a reminder that these class variables exist (they're
    // initialized after the shader code is loaded)
    self.tempTransferFunc = undefined;
    self.materialFirstPass = undefined;
    self.materialSecondPass = undefined;
    self.sceneFirstPass = undefined;
    self.sceneSecondPass = undefined;
    self.stats = undefined;
    
    // Finally, load up the shader code files (async)
    self.shaderCode = {
        'shaders/fragmentShaderFirstPass.frag' : null,
        'shaders/fragmentShaderSecondPass.frag' : null,
        'shaders/vertexShaderFirstPass.vert' : null,
        'shaders/vertexShaderSecondPass.vert' : null
    };
    
    self.loadShaderCode(callback);
}
VolumeRenderer.prototype.loadShaderCode = function (callback) {
    "use strict";
    var self = this,
        req,
        path,
        numLoaded = 0,
        generateCollectorFunction = function (request, codePath) {
            return function () {
                if (request.readyState === 4) {
                    self.shaderCode[codePath] = request.responseText;
                    numLoaded += 1;

                    if (numLoaded === Object.keys(self.shaderCode).length) {
                        // All the shader text is loaded, so proceed
                        // to set up the app
                        self.init();
                        self.animate();
                        // Finally, notify whomever instantiated
                        // the VolumeRenderer that it's finally ready
                        callback();
                    }
                }
            };
        };

    for (path in self.shaderCode) {
        if (self.shaderCode.hasOwnProperty(path)) {
            req = new XMLHttpRequest();
            req.open('GET', path);
            req.onreadystatechange = generateCollectorFunction(req, path);
            req.send();
        }
    }
};
VolumeRenderer.prototype.init = function () {
    "use strict";
    var self = this;
    
    self.materialFirstPass = new THREE.ShaderMaterial({
        vertexShader: self.shaderCode['shaders/vertexShaderFirstPass.vert'],
        fragmentShader: self.shaderCode['shaders/fragmentShaderFirstPass.frag'],
        side: THREE.BackSide
    });

    self.materialSecondPass = new THREE.ShaderMaterial({
        vertexShader: self.shaderCode['shaders/vertexShaderSecondPass.vert'],
        fragmentShader: self.shaderCode['shaders/fragmentShaderSecondPass.frag'],
        side: THREE.FrontSide,
        uniforms: {
            tex: {
                type: "t",
                value: self.rtTexture
            },
            cubeTex: {
                type: "t",
                value: self.cubeTextures.bonsai
            },
            transferTex: {
                type: "t",
                value: self.updateTransferFunction(self.tempTransferFunc)
            },
            steps: {
                type: "1f",
                value: self.steps
            },
            alphaCorrection: {
                type: "1f",
                value: self.alphaCorrection
            },
            origin: {
                type: "3f",
								value: self.camera.position
            }

        }
    });

    self.sceneFirstPass = new THREE.Scene();
    self.sceneSecondPass = new THREE.Scene();
    
    var boxGeometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    boxGeometry.doubleSided = true;
    
    self.meshFirstPass = new THREE.Mesh(boxGeometry, self.materialFirstPass);
    self.meshSecondPass = new THREE.Mesh(boxGeometry, self.materialSecondPass);
    
    self.sceneFirstPass.add(self.meshFirstPass);
    self.sceneSecondPass.add(self.meshSecondPass);
    
    // Create the performance widget
    self.stats = new Stats();
    self.stats.domElement.style.position = 'absolute';
    self.stats.domElement.style.top = '0px';
    self.stats.domElement.style.left = '0px';
    self.container.appendChild(self.stats.domElement);
    
    self.resize();
};
VolumeRenderer.prototype.addVolume = function (volName, path) {
    var self = this;
    self.cubeTextures[volName] = THREE.ImageUtils.loadTexture(path);
};
VolumeRenderer.prototype.switchVolume = function (volName) {
    var self = this;
    self.materialSecondPass.uniforms.cubeTex.value = self.cubeTextures[volName];
};
VolumeRenderer.prototype.resize = function () {
    var self = this,
        bounds = document.getElementById('renderContainer').getBoundingClientRect();
    self.camera.aspect = bounds.width / bounds.height;
    self.camera.updateProjectionMatrix();

    self.renderer.setSize(bounds.width, bounds.height);
};
VolumeRenderer.prototype.animate = function () {
    var self = this;
    window.requestAnimationFrame(function () {
        self.animate();
    });

    self.render();
    self.stats.update();
};
VolumeRenderer.prototype.render = function () {
    var self = this,
        delta = self.clock.getDelta();

    //Render first pass and store the world space coords of the back face fragments into the texture.
    self.renderer.render(self.sceneFirstPass, self.camera, self.rtTexture, true);

    //Render the second pass and perform the volume rendering.
    self.renderer.render(self.sceneSecondPass, self.camera);
    
    self.materialSecondPass.uniforms.steps.value = self.steps;
    self.materialSecondPass.uniforms.alphaCorrection.value = self.alphaCorrection;
    self.materialSecondPass.uniforms.origin.value = self.camera.position;
		
};
VolumeRenderer.prototype.updateTransferFunction = function (colorScale) {
    var self = this,
        canvas = document.createElement('canvas'),
        ctx,
        i,
        transferTexture;
    
    // Default color scale: stupid linear map
    if (colorScale === undefined) {
        colorScale = function (intensity) {
            return 'rgba(255,255,255,' + intensity + ')';
        };
    } else {
        // If the client changes the transfer function while we're
        // still loading shader code (happens more than you'd think!),
        // we want to use the last thing they sent us instead
        // of the default
        self.tempTransferFunc = colorScale;
    }
    
    canvas.height = 1;
    canvas.width = self.steps;
    
    // Evaluate the mapping function for each possible value
    // (from 0-1 to a range of colors... colorScale could be a D3 color scale)
    // and store the result as a 1-pixel-high texture
    ctx = canvas.getContext('2d');
    for (i = 0; i < self.steps; i += 1) {
        ctx.fillStyle = colorScale(i/self.steps);
        ctx.fillRect(i, 0, 1, 2);
    }
    
    transferTexture = new THREE.Texture(canvas);
    transferTexture.wrapS = transferTexture.wrapT = THREE.ClampToEdgeWrapping;
    transferTexture.needsUpdate = true;
    
    if (self.materialSecondPass !== undefined) {
        self.materialSecondPass.uniforms.transferTex.value = transferTexture;
    }
    return transferTexture;
};
