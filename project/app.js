let mobilenet;
const modelReady = () => {
  console.log("fefe");
  // mobilenet.predict(merc, results);
};

const results = (error, data) => {
  if (error) {
    console.error(error);
  } else {
    console.log(data);
  }
};

function setup() {
  createCanvas(640, 480);
  merc = createImg("images/merc1.jpeg", () => image(merc, 0, 0, widht, height));
  merc.hide();
  background("#FF0000");

  mobilenet = ml5.imageClassifier("MobileNer", modelReady);
}
