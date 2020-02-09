const faceapi = require('face-api.js');

// ssdMobilenetv1 model is slower but more accurate
//const faceDetectionNet = faceapi.nets.ssdMobilenetv1;

// tinyFaceDetector is faster but less accurate with smaller faces
const faceDetectionNet = faceapi.nets.tinyFaceDetector;

// SsdMobilenetv1Options
const minConfidence = 0.5;

// TinyFaceDetectorOptions
const inputSize = 416;
const scoreThreshold = 0.5;

function getFaceDetectorOptions(net) {
  if (net === faceapi.nets.ssdMobilenetv1) {
    return new faceapi.SsdMobilenetv1Options({ minConfidence });
  }
  
  return new faceapi.TinyFaceDetectorOptions({ inputSize, scoreThreshold });
}

module.exports = {
  faceDetectionOptions: getFaceDetectorOptions(faceDetectionNet),
  faceDetectionNet
};
