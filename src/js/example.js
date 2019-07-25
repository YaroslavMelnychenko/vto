import VTO from './index';

var i = 0;

var vt = new VTO({
    canvasId: 'canvas',
    canvasSize: 'fullscreen',
    detectCallback: (faceIndex, isDetected) => {
        
    },
    webcamAskCallback: function() {
        
    },
    webcamGetCallback: function(videoElement) {
        
    }
});

vt.then((instance) => {

    var glasses = instance.glassCreator({
        envMapURL: "src/assets/envMap4.jpg",
        frameMeshURL: "src/assets/models3D/glassesFramesBranchesBent.json",
        lensesMeshURL: "src/assets/models3D/glassesLenses.json",
        material: new THREE.MeshPhongMaterial({
            color: 0xff0000,    
            specular: 0x2b2b2b,
            shininess: 50
        })
    });

    instance.addMesh(glasses);

    document.getElementById('shot').addEventListener('click', () => {
        i++;
        instance.takeShot('IMG' + i).click();
    });

    window.addEventListener('resize', () => {
        instance.resize();
    });

});