let video;
let features;
let knn;
let labelP;
let ready = false;
let x;
let y;
let label = 'nothing';

function setup() {
    createCanvas(320, 240);
    video = createCapture(VIDEO);
    video.size(320, 240);
    features = ml5.featureExtractor('MobileNet', modelReady);
    knn = ml5.KNNClassifier();
    labelP = createP('need training data');
    labelP.style('font-size', '32pt');
    x = width / 2;
    y = height / 2;
}

function goClassify() {
    const logits = features.infer(video);
    knn.classify(logits, function (error, result) {
        if (error) {
            console.error(error);
        } else {
            label = result.label;
            labelP.html(result.label);
            goClassify();
        }
    });
}

function keyPressed() {
    const logits = features.infer(video);
    if (key == 'l') {
        knn.addExample(logits, 'left');
        console.log('left');
    } else if (key == 'r') {
        knn.addExample(logits, 'right');
        console.log('right');
    } else if (key == 'u') {
        knn.addExample(logits, 'up');
        console.log('up');
    } else if (key == 'd') {
        knn.addExample(logits, 'down');
        console.log('down');
    } else if (key == 'm') {
        knn.addExample(logits, 'middle')
        console.log('middle')
    } else if (key == 's') {
        save(knn, 'model.json');
        //knn.save('model.json');
    } else if (key == '1') {
        knn.addExample(logits, 'up-left')
    } else if (key == '2') {
        knn.addExample(logits, 'up-right')
    } else if (key == '3') {
        knn.addExample(logits, 'down-left')
    } else if (key == '4') {
        knn.addExample(logits, 'down-right')
    }
}

function modelReady() {
    console.log('model ready!');
    // Comment back in to load your own model!
    knn.load('model.json', function () {
        console.log('knn loaded');
    });
}

function draw() {
    background(0);
    fill(255);
    ellipse(x, y, 24);

    console.log(x + ' , ' + y);

    if (label == 'left') {
        x < 12 ? 12 : x--;
    } else if (label == 'right') {
        x > 320-12 ? 320-12 : x++;
    } else if (label == 'up') {
        y < 12 ? 12 : y--;
    } else if (label == 'down') {
        y > 228 ? 228 : y++;
    } else if (label == 'up-left') {
        y < 12 ? 12 : y--;
        x < 12 ? 12 : x--;
    } else if (label == 'up-right') {
        y < 12 ? 12 : y--;
        x > 320-12 ? 320-12 : x++;
    } else if (label == 'down-left') {
        y > 228 ? 228 : y++;
        x < 12 ? 12 : x--;
    } else if (label == 'down-right') {
        y > 228 ? 228 : y++;
        x > 320-12 ? 320-12 : x++;
    }  else if (label == 'middle') {
        x = x;
        y = y;
    }

    //image(video, 0, 0);
    if (!ready && knn.getNumLabels() > 0) {
        goClassify();
        ready = true;
    }
}

// Temporary save code until ml5 version 0.2.2
const save = (knn, name) => {
    const dataset = knn.knnClassifier.getClassifierDataset();
    if (knn.mapStringToIndex.length > 0) {
        Object.keys(dataset).forEach(key => {
            if (knn.mapStringToIndex[key]) {
                dataset[key].label = knn.mapStringToIndex[key];
            }
        });
    }
    const tensors = Object.keys(dataset).map(key => {
        const t = dataset[key];
        if (t) {
            return t.dataSync();
        }
        return null;
    });
    let fileName = 'myKNN.json';
    if (name) {
        fileName = name.endsWith('.json') ? name : `${name}.json`;
    }
    saveFile(fileName, JSON.stringify({
        dataset,
        tensors
    }));
};

const saveFile = (name, data) => {
    const downloadElt = document.createElement('a');
    const blob = new Blob([data], {
        type: 'octet/stream'
    });
    const url = URL.createObjectURL(blob);
    downloadElt.setAttribute('href', url);
    downloadElt.setAttribute('download', name);
    downloadElt.style.display = 'none';
    document.body.appendChild(downloadElt);
    downloadElt.click();
    document.body.removeChild(downloadElt);
    URL.revokeObjectURL(url);
};