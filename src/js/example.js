import VTO from './vto';

var vt = new VTO({
    canvasSize: 'fullscreen'
}).then((instance) => {
    console.log(instance);

    var glasses = instance.createGlasses({
        envMapURL: "src/assets/envMap4.jpg",
        frameMeshURL: "src/assets/models3D/glassesFramesBranchesBent3.json",
        lensesMeshURL: "src/assets/models3D/glassesLenses3.json",
        material: new THREE.MeshPhongMaterial({
            color: 0x000000,    
            specular: 0x2b2b2b,
            shininess: 25
        })
    });

    instance.addMesh(glasses);

    document.getElementById('shot').addEventListener('click', () => {
        instance.makeShot('name');
    });

    window.addEventListener('resize', () => {
        instance.resize('fullscreen');
    });
});