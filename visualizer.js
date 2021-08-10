// scene objects
/** @type {HTMLCanvasElement} */
// @ts-ignore
const canvas = document.getElementById("visualizer-canvas");
canvas.width = canvas.offsetWidth;
canvas.height = canvas.offsetHeight;

const engine = new BABYLON.Engine(canvas, true);
engine.enableOfflineSupport = false;

const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3(226/255,215/255,86/255);

const camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, new BABYLON.Vector3(0, 1, 0), scene);
camera.setPosition(new BABYLON.Vector3(3, 3, 3));
camera.wheelPrecision = 50;
camera.lowerRadiusLimit = 2;
camera.upperRadiusLimit = 20;
camera.attachControl(canvas, true);

const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0,1,0), scene);
light.intensity = 0.5;


// meshes
var boltBase, boltGrip, boltThreadStart, boltThreadMiddle, boltThreadEnd, combinedThreadMesh;
// object for storing bolt dimensions
var bolt = { headDiameter: 0, headThickness: 0, boltDiameter: 0, gripLength: 0, threadedLength: 0, threadPitch: 0 };
// object for storing bolt dimension labels (lines and text)
var dimensionLabels = [];

var metal;




//TODO: parent everything to base so everything can move together (problem: parenting leads to scaling issues)
function createBolt() {
    
    // scale and position base and grip
    setScale(boltGrip, bolt.boltDiameter, bolt.gripLength);
    boltGrip.position = new BABYLON.Vector3(0, getHeight(boltGrip), 0);
    setScale(boltBase, bolt.headDiameter, bolt.headThickness);
    boltBase.position = new BABYLON.Vector3(0, getHeight(boltGrip)+getHeight(boltBase), 0);

    // if combinedThresMesh already exists from last time slider was changed, dispose of it
    if (combinedThreadMesh)
        combinedThreadMesh.dispose();

    // create new array to store all thread sub-meshes that will be combined into one single thread mesh
    // the middle threads are clones of each other, the only threads that are different are the first and last
    var threadSubMeshes = [];

    // position the first thread at bottom of the grip
    boltThreadStart.position = new BABYLON.Vector3(0, getBottomPos(boltGrip, true), 0);
    setScale(boltThreadStart, bolt.boltDiameter, bolt.threadPitch*2);

    // figure out how many times to clone the middleThread to get as close as possible to the desired threadedLength, then clone and position them
    var numberClones = Math.floor(bolt.threadedLength/10 / (boltThreadMiddle.getBoundingInfo().boundingBox.extendSize.y * boltThreadStart.scaling.y));
    for (var i=0; i < numberClones-1; i++) {
        threadSubMeshes[i] = boltThreadMiddle.clone("thread"+i, null, true, false);
        threadSubMeshes[i].scaling = boltThreadStart.scaling;
        var top = i==0 ? getBottomPos(boltThreadStart) : getBottomPos(threadSubMeshes[i-1]);
        threadSubMeshes[i].position = new BABYLON.Vector3(0, top, 0);
    }

    // position end thread at bottom of last middle thread
    boltThreadEnd.scaling = boltThreadStart.scaling;

    var test = threadSubMeshes[numberClones-2];
    console.log({
        threadSubMeshes: threadSubMeshes,
        numberClones: numberClones,
        test: test
    });

    boltThreadEnd.position = new BABYLON.Vector3(0, getBottomPos(test), 0);

    // combine the middle thread clones into one mesh (makes disposing easier next time)
    combinedThreadMesh = BABYLON.Mesh.MergeMeshes(threadSubMeshes, true);

    // now create labels for each dimension
    createLabels();
}

// createLabels: disposes of previous labels and creates new ones
function createLabels() {
    for (i=0; i<dimensionLabels.length; i++) {
        if (dimensionLabels[i]) {
            dimensionLabels[i].line.dispose();
            dimensionLabels[i].label.dispose();
        }
    }

    dimensionLabels[0] = createLabel(boltBase, bolt.headDiameter, true, false, new BABYLON.Color3(0, 0, 0));
    dimensionLabels[1] = createLabel(boltBase, bolt.headThickness, false, false, new BABYLON.Color3(0, 0, 0));
    dimensionLabels[2] = createLabel(boltGrip, bolt.gripLength, false, true, new BABYLON.Color3(0, 0, 0));
    dimensionLabels[3] = createLabel(combinedThreadMesh, bolt.threadedLength, false, false, new BABYLON.Color3(0, 0, 0));
    dimensionLabels[4] = createLabel(boltThreadStart, bolt.threadPitch, false, true, new BABYLON.Color3(0, 0, 0));
    dimensionLabels[5] = createLabel(boltThreadEnd, bolt.boltDiameter, true, true, new BABYLON.Color3(0, 0, 0));
}
// createLabel: takes a mesh, a value to display, and 2 position booleans to determine where/how to place the line and label for each bolt dimension
// returns the line and label stored into one object
function createLabel(mesh, value, horizontal, leftOrBottom, color) {
    var verticalPadding = leftOrBottom ? 0.05 : 0.1;
    var horizontalPadding = 0.2;

    var radius = getRadius(mesh);
    var line;
    var label = makeTextPlane(value+"mm", "black", 1);

    // horizontal line
    if (horizontal) {
        // bottom horizontal
        if (leftOrBottom) {
            line = BABYLON.Mesh.CreateLines("line", [new BABYLON.Vector3(-radius, mesh.position.y-getHeight(mesh), 0), new BABYLON.Vector3(-radius, mesh.position.y -getHeight(mesh) - 2*verticalPadding, 0), new BABYLON.Vector3(-radius, mesh.position.y-getHeight(mesh)-verticalPadding, 0), new BABYLON.Vector3(radius, mesh.position.y-getHeight(mesh)-verticalPadding, 0), new BABYLON.Vector3(radius, mesh.position.y-getHeight(mesh), 0), new BABYLON.Vector3(radius, mesh.position.y-getHeight(mesh)-2*verticalPadding, 0)], scene);
            label.position = new BABYLON.Vector3(0, mesh.position.y-getHeight(mesh)-verticalPadding*3.5, 0);
        }
        // top horizontal
        else {
            line = BABYLON.Mesh.CreateLines("line", [new BABYLON.Vector3(-radius, mesh.position.y, 0), new BABYLON.Vector3(-radius, mesh.position.y + 2 * verticalPadding, 0), new BABYLON.Vector3(-radius, mesh.position.y + verticalPadding, 0), new BABYLON.Vector3(radius, mesh.position.y + verticalPadding, 0), new BABYLON.Vector3(radius, mesh.position.y, 0), new BABYLON.Vector3(radius, mesh.position.y + 2 * verticalPadding, 0)], scene);
            label.position = new BABYLON.Vector3(0, mesh.position.y + verticalPadding*3.5, 0);
        }
    }
    // vertical line
    else {
        // left vertical
        if (leftOrBottom) {
            line = BABYLON.Mesh.CreateLines("headThicknessLine", [new BABYLON.Vector3(-radius-horizontalPadding/2, mesh.position.y, 0), new BABYLON.Vector3(-radius-3/2*horizontalPadding, mesh.position.y, 0), new BABYLON.Vector3(-radius-horizontalPadding, mesh.position.y, 0), new BABYLON.Vector3(-radius-horizontalPadding, mesh.position.y-getHeight(mesh), 0), new BABYLON.Vector3(-radius-horizontalPadding/2, mesh.position.y-getHeight(mesh), 0), new BABYLON.Vector3(-radius-3/2*horizontalPadding, mesh.position.y-getHeight(mesh), 0)], scene);
            label.position = new BABYLON.Vector3(-radius-horizontalPadding*4, mesh.position.y-getHeight(mesh)/2, 0);
        }
        // right vertical
        else {
            line = BABYLON.Mesh.CreateLines("headThicknessLine", [new BABYLON.Vector3(radius+horizontalPadding/2, mesh.position.y, 0), new BABYLON.Vector3(radius+3/2*horizontalPadding, mesh.position.y, 0), new BABYLON.Vector3(radius+horizontalPadding, mesh.position.y, 0), new BABYLON.Vector3(radius+horizontalPadding, mesh.position.y-getHeight(mesh), 0), new BABYLON.Vector3(radius+horizontalPadding/2, mesh.position.y-getHeight(mesh), 0), new BABYLON.Vector3(radius+3/2*horizontalPadding, mesh.position.y-getHeight(mesh), 0)], scene);
            label.position = new BABYLON.Vector3(radius+horizontalPadding*3.5, mesh.position.y-getHeight(mesh)/2, 0);
        }
    }

    line.color = color;
    line.billboardMode = BABYLON.Mesh.BILLBOARDMODE_Y;
    label.parent = line;
    label.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    return { line: line, label: label };
}
// makeTextPlane: returns a plane with a dynamic texture for drawing text onto
function makeTextPlane(text, color, size) {
    var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 64, scene, true);
    dynamicTexture.hasAlpha = true;
    dynamicTexture.drawText(text, 5, 40, "bold 18px Open Sans", color, "transparent");
    var plane = BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
    plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
    plane.material.backFaceCulling = false;
    plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
    plane.material.diffuseTexture = dynamicTexture;
    return plane;
}

/* HELPER FUNCTIONS */
// setScale: sets mesh's scale such that 1 babylon unit = 10mm
function setScale(mesh, desiredDiameter, desiredLength) {
    var defaultDiameter = 2*mesh.getBoundingInfo().boundingBox.extendSize.x;
    var defaultLength = 2*mesh.getBoundingInfo().boundingBox.extendSize.y;

    var diameterScale = desiredDiameter/10 / defaultDiameter;
    var lengthScale = desiredLength/10 / defaultLength;
    mesh.scaling = new BABYLON.Vector3(diameterScale, lengthScale, diameterScale);
}
// getRadius/getHeight: returns width/height respectively of mesh's boundingBox multiplied by it's scaling on that axis (bounding box never changes, only scaling does)
function getRadius(mesh) {
    return mesh.getBoundingInfo().boundingBox.extendSize.x * mesh.scaling.x;
}
function getHeight(mesh) {
    return 2*(mesh.getBoundingInfo().boundingBox.extendSize.y * mesh.scaling.y);
}
// getBottomPos: finds the position directly below this mesh (for placing a mesh pixel perfectly below another)
// if entireHeight is true, it means the mesh is positioned such that local (0,0,0) is at the top of the mesh, so we have to look down it's entire height
// if entireHeight is false, then local (0,0,0) is the direct center of the mesh and we only need to look down half of it's entire height
function getBottomPos(mesh, entireHeight) {
    if (entireHeight)
        return mesh.position.y - 2*(mesh.getBoundingInfo().boundingBox.extendSize.y * mesh.scaling.y);
    else
        return mesh.position.y - (mesh.getBoundingInfo().boundingBox.extendSize.y * mesh.scaling.y);
}

// resize canvas and engine when screen resizes
window.addEventListener('resize', function() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    engine.resize();
}, false);



// init on load
window.onload = function init() {

    // Environment Texture (for shiny metallic material, only if environment.dds is located in textures folder. otherwise plain gray)
    $.ajax({
        url:'textures/environment.dds',
        type:'HEAD',
        success: function() {
            var hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("textures/environment.dds", scene);
            metal = new BABYLON.PBRMaterial("metal", scene);
            metal.reflectionTexture = hdrTexture;
            metal.microSurface = 0.95;
            metal.reflectivityColor = new BABYLON.Color3(0.4, 0.4, 0.4);
            metal.albedoColor = new BABYLON.Color3(0.01, 0.01, 0.01);
        }
    });

    // get bolt dimensions from JSON (titled bolt.json inside json folder)
    $.ajax({
        type: 'GET',
        dataType: 'json',
        url: 'bolt.json',
        success: function(data) {
            bolt = data;

            console.log(bolt);

            // if slider div exists in page, create sliders for each dimension that will modify json. (not necessary)
            if (document.getElementById('slider-div')) {
                // create a custom slider with given id and range and put it in $('#slider-div')
                var createSlider = function(id, minValue, maxValue, step) {
                    // remove "-" and title case the id for the label string
                    var labelString = id.replace("-", " ").replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
                    // remove "-" and camel case for attribute string
                    var attributeString = id.replace("-", " ").replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) { return index == 0 ? letter.toLowerCase() : letter.toUpperCase();}).replace(/\s+/g, '');
                    $('#slider-div').append("<div class = 'slider-container'> <p class = 'slider-label'> <label for='"+id+"-value'>"+labelString+":</label></p> <div id='"+id+"-slider' class = 'slider'></div> </div>");
                    $('#'+id+'-slider').slider({
                        range: "min",
                        value: bolt[attributeString] ? bolt[attributeString] : 1,
                        min: minValue,
                        max: maxValue,
                        step: step ? step : 1,
                        slide: function(event, ui) {
                            //TODO: make certain slider values effect ranges of others
                            bolt[attributeString] = ui.value;
                            createBolt();

                            // SAVING CURRENTLY DISABLED
                            /*
                            $.ajax({
                                url: 'save.php/',
                                type: 'POST',
                                data: { data: bolt },
                                dataType: 'json',
                                error: function(xhr, desc, err) {
                                    console.log("php post error..." + err);
                                }
                            });
                            */
                        }
                    });
                };

                createSlider('head-diameter', 5, 20);
                createSlider('head-thickness', 3, 12);
                createSlider('bolt-diameter', 3, 20);
                createSlider('grip-length', 0, 30);
                createSlider('threaded-length', 5, 30);
                createSlider('thread-pitch', 0.5, 2, 0.5);
            }

            // load bolt mesh from models directory
            BABYLON.SceneLoader.ImportMesh("", "models/", "bolt.babylon", scene, function(meshes) {
                boltBase = scene.getMeshByName("Base");
                boltGrip = scene.getMeshByName("Grip");
                boltThreadStart = scene.getMeshByName("Start Piece");
                boltThreadMiddle = scene.getMeshByName("Middle Piece");
                boltThreadEnd = scene.getMeshByName("End Piece");

                console.log({
                    boltBase: boltBase,
                    boltGrip: boltGrip ,
                    boltThreadStart: boltThreadStart,
                    boltThreadMiddle: boltThreadMiddle,
                    boltThreadEnd: boltThreadEnd
                })

                // if environment.dds was in the textures folder and the metal material was created, use it
                if(metal)
                    boltBase.material = boltGrip.material = boltThreadStart.material = boltThreadMiddle.material = boltThreadEnd.material = metal;

                // hide thread pieces off of screen as they will only be used for cloning
                boltThreadMiddle.position = boltThreadStart.position = boltThreadEnd.position = new BABYLON.Vector3(0, 0, 9999);

                // assemble the bolt using the mesh pieces that were just loaded in and the dimensions found from json
                createBolt();
            });
        }
    });

    // render loop
    scene.executeWhenReady(function() {
        engine.runRenderLoop(function () {
            scene.render();
        });
    });
}
