// import nodejs bindings to native tensorflow,
// not required, but will speed up things drastically (python required)
require('@tensorflow/tfjs-node');

const faceapi = require('face-api.js');
const canvas = require('canvas');

// patch nodejs environment, we need to provide an implementation of
// HTMLCanvasElement and HTMLImageElement, additionally an implementation
// of ImageData is required, in case you want to use the MTCNN
const { Canvas, Image, ImageData } = canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const { faceDetectionOptions } = require('./faceDetection');
const saveFile = require('./utils/saveFile');

const debug = true; // TODO: Remove this or use env var

async function whoDis(logger, uploadedImage, refLabeledDescriptors) {
  const queryImage = await canvas.loadImage(uploadedImage);

  const singleQuery = await faceapi.detectSingleFace(queryImage, faceDetectionOptions)
    .withFaceLandmarks()
    .withFaceDescriptor();

  const faceMatcher = new faceapi.FaceMatcher(refLabeledDescriptors);

  /*if (debug) {
    const labels = faceMatcher.labeledDescriptors.map(ld => ld.label);
    const refDrawBoxes = resultsRef
      .map(res => res.detection.box)
      .map((box, i) => new faceapi.draw.DrawBox(box, { label: labels[i] }));
    const outRef = faceapi.createCanvasFromMedia(referenceImage);
    refDrawBoxes.forEach(drawBox => drawBox.draw(outRef));

    saveFile('referenceImage.jpg', outRef.toBuffer('image/jpeg'));
  }*/

  
  const outQuery = faceapi.createCanvasFromMedia(queryImage);
  const bestMatch = faceMatcher.findBestMatch(singleQuery.descriptor);

  console.log('match', bestMatch.toString());

  if (debug) {
    const queryDrawBox = new faceapi.draw.DrawBox(singleQuery.detection.box, { label: bestMatch.toString() });
    queryDrawBox.draw(outQuery);
    saveFile('queryImage.jpg', outQuery.toBuffer('image/jpeg'));
  }

  console.log('done, saved results to ../debugImages/queryImage.jpg');
  const includeProbability = false;
  return Promise.resolve(bestMatch.toString(includeProbability));
}

async function getFaceDescriptor(imagePath) {
  const image = await canvas.loadImage(imagePath);
  const query = await faceapi.detectSingleFace(image, faceDetectionOptions)
    .withFaceLandmarks()
    .withFaceDescriptor();

  return query.descriptor;
}

module.exports = {
  whoDis,
  getFaceDescriptor
};
