require('./jeelizFaceFilter');
window.THREE = require('three');
require('./JeelizThreejsHelper');
require('./JeelizResizer');
require('./JeelizThreeGlassesCreator');

'use strict'

let path = 'node_modules/pinsel-vto/';

let green = (text) => {
    console.log("%c" + text, "color:green;");
}

let $this;

class VTO {

    _setOptions(options) {

        this.options = {};

        this.options.canvasId = options.canvasId || 'canvas';
        this.options.canvasSize = options.canvasSize || 'auto'; // [800, 800] | 'fullscreen' | 'auto'
        this.options.facingMode = options.facingMode || 'user';
        this.options.debug = options.debug || false;
        this.options.debugBox = options.debugBox || false;
        this.options.showOccluder = options.showOccluder || false;
        this.options.mirror = options.mirror || (this.options.facingMode == 'user' ? true : false);

        this.options.onDetect = options.onDetect || this._onDetect;
        this.options.onWebcamAsk = options.onWebcamAsk || this._onWebcamAsk;
        this.options.onWebcamGet = options.onWebcamGet || this._onWebcamGet;
        this.options.onErrorThrown = options.onErrorThrown || this._onErrorThrown;
        this.options.onCanvasResize = options.onCanvasResize || this._onCanvasResize;
        this.options.onShotMade = options.onShotMade || this._onShotMade;
        this.options.onMeshAdded = options.onMeshAdded || this._onMeshAdded;
        this.options.onMeshRemoved = options.onMeshRemoved || this._onMeshRemoved;
        this.options.onPauseToggled = options.onPauseToggled || this._onPauseToggled;

        this._isPaused = false;

    }

    _setCanvas() {

        try {
            
            this.canvas = document.getElementById(this.options.canvasId);

            if(this.canvas.tagName.toLowerCase() != 'canvas') {
                console.error('DOM element with id `%s` must be canvas, `%s` found', this.options.canvasId, this.canvas.tagName.toLowerCase());
                return false;
            }

            if(this.options.mirror) this.canvas.style.cssText = '-webkit-transform: scale(-1, 1); transform: scale(-1, 1);';

            if(this.options.debug) green('canvas set');   

        } catch(error) {
            console.error('canvas with id `%s` not found (%s)', this.options.canvasId, error);
        }

    }

    _setCanvasSize() {

        let debugSize;

        if(typeof(this.options.canvasSize) == 'object') {

            this.canvas.width = this.options.canvasSize[0];
            this.canvas.height = this.options.canvasSize[0];

            debugSize = this.options.canvasSize[0] + 'x' + this.options.canvasSize[1];

        } else {

            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            debugSize = 'fullscreen ('+ window.innerWidth +'x'+ window.innerHeight +')';

        }

        if(this.options.debug) {
            console.log('%ccanvas current size is - %c%s', 'color:green;', 'color:orange;', debugSize);
        }

        return new Promise((resolve) => {
            
            JeelizResizer.size_canvas({
                canvasId: $this.options.canvasId,
                callback: (isError, bestVideoSettings) => {

                    if($this.options.debug) {
                        green('JeelizResizer is ready');
                        console.log('%cJeelizResizer recommend canvas size - %c%s', 'color:green;', 'color:orange;', bestVideoSettings.idealWidth + 'x' + bestVideoSettings.idealHeight);
                    }

                    if(isError) {
                        console.error('JeelizResizer has thrown an error');
                    } else {

                        let videoSettings = {};

                        if($this.options.canvasSize == 'auto') {
                            $this.canvas.width = bestVideoSettings.idealWidth;
                            $this.canvas.height = bestVideoSettings.idealHeight;

                            if($this.options.debug) green('canvas size was set to the best video settings by JeelizResizer');
                        }

                        videoSettings.idealWidth = $this.canvas.width;
                        videoSettings.idealHeight = $this.canvas.height;
                        videoSettings.facingMode = $this.options.facingMode;

                        $this.videoSettings = videoSettings;

                    }

                    resolve();

                }
            });

        });

    }

    _initFaceFilter() {

        return new Promise((resolve) => {

            JEEFACEFILTERAPI.init({
                videoSettings: $this.videoSettings,
                followZRot: true,
                canvas: $this.canvas,
                NNCpath: path + 'src/nnc/jeefitNNC.json',
                maxFacesDetected: 1,

                onWebcamAsk: $this.options.onWebcamAsk,

                onWebcamGet: $this.options.onWebcamGet,

                callbackReady: (errCode, spec) => {

                    if($this.options.debug) green('JeelizFaceFilter is ready');

                    if(errCode) $this.options.onErrorThrown(errCode);

                    resolve(spec);

                },

                callbackTrack: (detectState) => {
                    try {
                        THREE.JeelizHelper.render(detectState, $this._threeCamera);
                    } catch(error) {

                    }
                }
            });

        });

    }

    _initThreeScene(spec) {

        return new Promise((resolve) => {

            const threeStuffs = THREE.JeelizHelper.init(spec, $this.options.onDetect);

            $this._threeStuffs = threeStuffs;

            if($this.options.debugBox) {
                let geometry = new THREE.BoxBufferGeometry( 1, 1, 1 );
                let material = new THREE.MeshPhongMaterial({
                    color: 0xff0000,    
                    specular: 0x2b2b2b,
                    shininess: 50
                });
                let box = new THREE.Mesh(geometry, material);
                threeStuffs.faceObject.add(box);
            }

            const color = 0xFFFFFF;
            const intensity = 1;
            const light = new THREE.PointLight(color, intensity, 500, 2);
            light.position.set(-1, 2, 4);
            threeStuffs.scene.add(light);

            const aspecRatio = spec.canvasElement.width / spec.canvasElement.height;
            $this._threeCamera = new THREE.PerspectiveCamera(40, aspecRatio, 0.1, 100);

            if($this.options.debug) green('Three scene created');

            resolve();

        });

    }

    constructor(options) {

        $this = this;

        this._setOptions(options);
        this._setCanvas();

        return new Promise((resolve) => {

            $this._setCanvasSize().then(() => {
                
                $this._initFaceFilter().then((spec) => {

                    $this._initThreeScene(spec).then(() => {
                        resolve($this);
                    });

                });

            });   

        });

    }

    // public methods

    getFace() {
        return this._threeStuffs.faceObject;
    }

    getScene() {
        return this._threeStuffs.scene;
    }

    createGlasses(options) {
        const r = JeelizThreeGlassesCreator({
            envMapURL: options.envMapURL,
            frameMeshURL: options.frameMeshURL,
            lensesMeshURL: options.lensesMeshURL,
            occluderURL: path + "src/assets/models3D/face.json",
            material: options.material
        }, this.options.showOccluder);

        this._threeStuffs.faceObject.add(r.occluder);
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
        return new Promise((resolve) => {
            $this._isPaused = !$this._isPaused;
            JEEFACEFILTERAPI.toggle_pause($this._isPaused);
            $this.options.onPauseToggled($this._isPaused);
            resolve();
        });
    }

    setPause(pause) {
        return new Promise((resolve) => {
            $this._isPaused = pause;
            JEEFACEFILTERAPI.toggle_pause($this._isPaused);
            $this.options.onPauseToggled($this._isPaused);
        });
    }

    makeShot(imgName) {
        JEEFACEFILTERAPI.toggle_pause(true);

        var MIME_TYPE = "image/png";

        var imgURL = this.canvas.toDataURL(MIME_TYPE);
        var dlLink = document.createElement('a');
        dlLink.download = imgName;
        dlLink.href = imgURL;
        dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(':');

        JEEFACEFILTERAPI.toggle_pause(false);

        this.options.onShotMade(dlLink);

        return dlLink;
    }

    resize(canvasSize = 'auto') {
        this.options.canvasSize = canvasSize;
        this._setCanvasSize().then(() => {
            JEEFACEFILTERAPI.resize();
            $this._threeCamera.aspect = $this.canvas.width / $this.canvas.height;
            $this._threeCamera.updateProjectionMatrix();
            $this.options.onCanvasResize();
        });
    }

    addMesh(mesh) {
        this._threeStuffs.faceObject.add(mesh);
        this.options.onMeshAdded(mesh);
    }

    removeMesh(mesh) {
        this._threeStuffs.faceObject.remove(mesh);
        this.options.onMeshRemoved(mesh);
    }

    // callbacks

    _onDetect(faceIndex, isDetected) {
        if($this.options.debug) {
            if(isDetected) {
                green('face detected');
            } else {
                green('face lost');
            }
        }
    }

    _onWebcamAsk() {
        if($this.options.debug) {
            green('webcam ask');
        }
    }

    _onWebcamGet(videoElement) {
        if($this.options.debug) {
            green('webcam asked');
            console.log(videoElement);
        }
    }

    _onErrorThrown(errCode) {
        console.error('JeelizFaceFilter thrown error: %s', errCode);
    }

    _onCanvasResize() {
        if($this.options.debug) {
            green('canvas resized');
        }
    }

    _onShotMade(shot) {
        if($this.options.debug) {
            green('shot made');
            console.log(shot);
        }
    }

    _onMeshAdded(mesh) {
        if($this.options.debug) {
            green('mesh added');
            console.log(mesh);
        }
    }

    _onMeshRemoved(mesh) {
        if($this.options.debug) {
            green('mesh removed');
            console.log(mesh);
        }
    }
    
    _onPauseToggled(pause) {
        if($this.options.debug) {
            console.log('%cpause toggled to: %s', 'color:green;', pause);
        }
    }

}

export default VTO;