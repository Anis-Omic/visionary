// Copyright (c) 2018 ml5
//
// This software is released under the MIT License.
// https://opensource.org/licenses/MIT

/* ===
ml5 Example
Image Classification using Feature Extraction with MobileNet. Built with p5.js
This example uses a callback pattern to create the classifier
=== */

let featureExtractor;
let classifier;
let video;
let loss;
let dogImages = 0;
let catImages = 0;
let badgerImages = 0;

let letters = ["A", "B", "C", "D", "E", "F"]; //"G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
let index = 0;

function setup() {
  noCanvas();
  // Create a video element
  video = createCapture(VIDEO);
  video.parent("videoContainer");
  video.size(380, 300);

  featureExtractor = ml5.featureExtractor("MobileNet", modelReady);

  // Create a new classifier using those features and give the video we want to use
  const options = { numLabels: 3 };
  classifier = featureExtractor.classification(video, options);
  // Set up the UI buttons
  setupButtons();
}

// A function to be called when the model has been loaded
function modelReady() {
  classifier.load("model.json", function() {
    console.log("custom model loaded");
  });
  // If you want to load a pre-trained model at the start
  // classifier.load('./model/model.json', function() {
  //   select('#modelStatus').html('Custom Model Loaded!');
  // });
}

// Classify the current frame.
function classify() {
  classifier.classify(gotResults);
}

// A util function to create UI buttons
function setupButtons() {
  // When the Cat button is pressed, add the current frame
  // from the video with a label of "cat" to the classifi3r

  setInterval(() => {
    () => {};
  }, 100);

  button1 = select("#startRecording");
  button1.mousePressed(function() {
    classifier.addImage("A");
    select("#amountN1").html(n1++);
  });
  button2 = select("#n2");
  button2.mousePressed(function() {
    classifier.addImage("B");
    select("#amountN2").html(n2++);
  });
  button3 = select("#n3");
  button3.mousePressed(function() {
    classifier.addImage("C");
    select("#amountN3").html(n3++);
  });
  button4 = select("#n4");
  button4.mousePressed(function() {
    classifier.addImage("D");
    select("#amountN4").html(n4++);
  });
  button5 = select("#n5");
  button5.mousePressed(function() {
    classifier.addImage("D");
    select("#amountN5").html(n5++);
  });

  // Train Button
  train = select("#train");
  train.mousePressed(function() {
    classifier.train(function(lossValue) {
      if (lossValue) {
        loss = lossValue;
        select("#loss").html("Loss: " + loss);
      } else {
        select("#loss").html("Done Training! Final Loss: " + loss);
      }
    });
  });

  // Predict Button
  buttonPredict = select("#buttonPredict");
  buttonPredict.mousePressed(classify);

  // Save model
  saveBtn = select("#save");
  saveBtn.mousePressed(function() {
    classifier.save();
  });

  // Load model
  loadBtn = select("#load");
  loadBtn.changed(function() {
    classifier.load(loadBtn.elt.files, function() {
      select("#modelStatus").html("Custom Model Loaded!");
    });
  });
}

// Show the results
function gotResults(err, results) {
  // Display any error
  if (err) {
    console.error(err);
  }
  if (results && results[0]) {
    select("#result").html(results[0].label);
    select("#confidence").html(results[0].confidence.toFixed(2) * 100 + "%");
    classify();
  }
}
