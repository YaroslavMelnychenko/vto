require('./jeelizFaceFilter');
window.THREE = require('three');
require('./JeelizThreejsHelper');
require('./JeelizResizer');
require('./JeelizThreeGlassesCreator');

'use strict'

let DEBUG;

console.green = function(text) {
    console.log("%c" + text, "color:green;");
}

class Jeeliz {
    constructor() {
        this.FACEFILTERAPI = JEEFACEFILTERAPI;
    }
}

/**
 * @typedef {Object} Settings
 * @property {string} canvasId
 * @property {any} canvasSize
 */

/**
 * @param {Settings} settings set of settings
 */

class VTO {

    setSettings(settings) {
        this.settings = {};

        this.settings.canvasId = settings.canvasId || 'canvas';
        this.settings.canvasSize = settings.canvasSize || 'auto';
        this.settings.facingMode = settings.facingMode || 'user';
        this.settings.debug = settings.debug || false;
        this.settings.debugBox = settings.debugBox || false;
        this.settings.mirror = settings.mirror || true;

        this.settings.detectCallback = settings.detectCallback || this.detectCallback; 
        this.settings.webcamAskCallback = settings.webcamAskCallback || this.webcamAskCallback;
        this.settings.webcamGetCallback = settings.webcamGetCallback || this.webcamGetCallback;
        
        this.isOnPause = false;

        this.DEBUG = this.settings.debug;
        DEBUG = this.DEBUG;
        this.DEBUGBOX = this.settings.debugBox;

        this.JEELIZ = new Jeeliz();

        if(this.DEBUG) {
            console.green('settings set');
        }
    }

    setCanvas() {
        try {
            this.CANVAS = document.getElementById(this.settings.canvasId);
            this.CANVAS.tagName == 'CANVAS' ? '' : console.error('`' + this.settings.canvasId + '` must be canvas'); 

            if(this.settings.mirror) {
                if(this.settings.facingMode == 'user') {
                    this.CANVAS.style.cssText = '-webkit-transform: scale(-1, 1); transform: scale(-1, 1);';
                }
            }

            if(this.DEBUG) {
                console.green('canvas set');
            }

        } catch (error) {
            console.error('canvas with id `' + this.settings.canvasId + '` not found. ', error);
        }
    }

    setCanvasSize() {
        let $this = this;

        var debugSize;

        if(typeof(this.settings.canvasSize) == 'object') {

            this.CANVAS.width = this.settings.canvasSize[0];
            this.CANVAS.height = this.settings.canvasSize[1];

            debugSize = this.settings.canvasSize[0] + 'x' + this.settings.canvasSize[1];

        } else {

            this.CANVAS.width = window.innerWidth;
            this.CANVAS.height = window.innerHeight;

            debugSize = 'fullscreen ('+ window.innerWidth + 'x' + window.innerHeight +')';

        }

        if(this.DEBUG) {
            console.log('%ccanvas current size is - %c' + debugSize, 'color: green;', 'color: orange;');
        }

        return new Promise((resolve) => {
            JeelizResizer.size_canvas({
                canvasId: $this.settings.canvasId,
                callback: function(isError, bestVideoSettings) {

                    if($this.DEBUG) {
                        console.green('JeelizResizer is ready');
                    }

                    if($this.DEBUG) {
                        console.log('%cJeelizResizer recommend - %c' + bestVideoSettings.idealWidth + 'x' + bestVideoSettings.idealHeight, 'color: green;', 'color: orange;');
                    }

                    if(isError) {
                        console.error('JeelizResizer throw an error');
                    } else {
                        
                        let videoSettings = {};

                        if($this.settings.canvasSize == 'auto') {
                            $this.CANVAS.width = bestVideoSettings.idealWidth;
                            $this.CANVAS.height = bestVideoSettings.idealHeight;

                            if($this.DEBUG) {
                                console.green('canvas auto sized due to recommendation');
                            }
                        }

                        videoSettings.idealWidth = $this.CANVAS.width;
                        videoSettings.idealHeight = $this.CANVAS.height;
                        videoSettings.facingMode = $this.settings.facingMode;

                        $this.videoSettings = videoSettings;
                    }
                    
                    resolve();

                }
            });
        });
        
    }

    initFaceFilter() {
        var $this = this;

        return new Promise((resolve) => {
                        
            this.JEELIZ.FACEFILTERAPI.init({
                videoSettings: $this.videoSettings,
                followZRot: true,
                canvasId: $this.settings.canvasId,
                NNCpath: 'src/nnc/jeefitNNC.json',
                maxFacesDetected: 1,

                onWebcamAsk: $this.settings.webcamAskCallback,

                onWebcamGet: $this.settings.webcamGetCallback,

                callbackReady: function(errCode, spec) {

                    if($this.DEBUG) {
                        console.green('JeelizFaceFilter is ready');
                    }

                    if(errCode) {
                        console.error('JeelizFaceFilter thrown error: ' + errCode);
                    }

                    resolve(spec);

                },

                callbackTrack: function(detectState) {
                    try {
                        THREE.JeelizHelper.render(detectState, $this.THREECAMERA);
                    } catch (error) {
                        
                    }
                }
            });

        });
    }

    initThreeScene(spec) {

        var $this = this;

        return new Promise((resolve) => {

            const threeStuffs = THREE.JeelizHelper.init(spec, $this.settings.detectCallback);

            $this.THREESTUFFS = threeStuffs;

            if($this.DEBUGBOX) {
                var geometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
                var material = new THREE.MeshPhongMaterial({
                    color: 0xff0000,    
                    specular: 0x2b2b2b,
                    shininess: 50
                });
                var mesh = new THREE.Mesh( geometry, material );
                threeStuffs.faceObject.add(mesh);
            }

            const color = 0xFFFFFF;
            const intensity = 1;
            const light = new THREE.PointLight(color, intensity, 500, 2);
            light.position.set(-1, 2, 4);
            threeStuffs.scene.add(light);

            const aspecRatio = spec.canvasElement.width / spec.canvasElement.height;
            $this.THREECAMERA = new THREE.PerspectiveCamera(40, aspecRatio, 0.1, 100);

            if($this.DEBUG) {
                console.green('three scene created');
            }

            resolve();

        });

    }

    constructor(settings) {

        let $this = this;

        return new Promise((resolve) => {

            $this.setSettings(settings);
            $this.setCanvas();
            $this.setCanvasSize().then(

                $this.initFaceFilter().then((spec) => {

                    $this.initThreeScene(spec).then(() => {
                        resolve($this);
                    });
                    
                })

            );

        });

    }

    addMesh(mesh) {
        this.THREESTUFFS.faceObject.add(mesh);
    }

    removeMesh(mesh) {
        this.THREESTUFFS.faceObject.remove(mesh);
    }

    glassCreator(options) {
        const r = JeelizThreeGlassesCreator({
            envMapURL: options.envMapURL,
            frameMeshURL: options.frameMeshURL,
            lensesMeshURL: options.lensesMeshURL,
            occluderURL: "src/assets/models3D/face.json",
            material: options.material
        });

        this.THREESTUFFS.faceObject.add(r.occluder);
        window.re = r.occluder;
        r.occluder.rotation.set(0.3,0,0);
        r.occluder.position.set(0,0.1,-0.04);
        r.occluder.scale.multiplyScalar(0.0084);

        const threeGlasses = r.glasses;
        threeGlasses.position.set(0,0.07,0.4);
        threeGlasses.scale.multiplyScalar(0.006);

        return threeGlasses;
    }

    togglePause() {
        this.isOnPause = !this.isOnPause;
        this.JEELIZ.FACEFILTERAPI.toggle_pause(this.isOnPause);
    }

    setPause(isOnPause) {
        this.isOnPause = isOnPause;
        this.JEELIZ.FACEFILTERAPI.toggle_pause(this.isOnPause);
    }

    takeShot(name) {
        this.setPause(true);
        
        var MIME_TYPE = "image/png";

        var imgURL = this.CANVAS.toDataURL(MIME_TYPE);
        var dlLink = document.createElement('a');
        dlLink.download = name;
        dlLink.href = imgURL;
        dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(':');

        this.setPause(false);

        return dlLink;
    }

    resize(canvasSize = 'fullscreen') {
        var $this = this;

        this.settings.canvasSize = canvasSize;
        this.setCanvasSize().then(() => {
            $this.JEELIZ.FACEFILTERAPI.resize();
            $this.THREECAMERA.aspect = $this.CANVAS.width / $this.CANVAS.height;
            $this.THREECAMERA.updateProjectionMatrix();
        });
    }

    detectCallback(faceIndex, isDetected) {
        if(DEBUG) {
            if(isDetected) {
                console.green('face detected');
            } else {
                console.green('face lost');
            }
        }
    }

    webcamAskCallback() {
        if(DEBUG) {
            console.green('webcam ask');
        }
    }

    webcamGetCallback(videoElement) {
        if(DEBUG) {
            console.green('webcam asked, videoelement: ');
            console.log(videoElement);
        }
    }

}

export default VTO;