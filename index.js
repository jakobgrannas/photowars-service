'use strict';

const config = require('./config');

const async = require('async');
const faceapi = require('face-api.js');
const { faceDetectionNet } = require('./lib/faceDetection');
const path = require('path');
const weightsPath = path.resolve(__dirname, './weights');

const mongoose = require('mongoose');

const PhotoWarsService = require('./Service');

const { createLogger } = require('node-service');
const logger = createLogger({ name: config.service.name});

const TASK_SERVICE = 'TASK_SERVICE';
const TASK_MODELS = 'TASK_MODELS';
const TASK_MONGODB = 'TASK_MONGODB';


async.auto({

  [TASK_MONGODB]: (done) => {
    console.log(`${config.MONGODB_URL}/${config.database}`);
    mongoose.connect(`${config.MONGODB_URL}/${config.database}`, { useNewUrlParser: true });

    const db = mongoose.connection;
    db.on('error', done);
    db.once('open', () => done());
  },

  [TASK_MODELS]: (done) => {
    Promise.all([
      faceDetectionNet.loadFromDisk(weightsPath),
      faceapi.nets.faceLandmark68Net.loadFromDisk(weightsPath),
      faceapi.nets.faceRecognitionNet.loadFromDisk(weightsPath)
    ])
      .then(() => {
        logger.info(TASK_MODELS);
        done();
      })
      .catch((err) => {
        logger.error({ err }, TASK_MODELS);
      });
  },


  [TASK_SERVICE]: [TASK_MODELS, TASK_MONGODB, (deps, done) => {
    const options = {
      logger: logger.child({ logger: 'PhotoWarsService' }),
      service: config.service,
      restify: {
        bodyParser: {
          mapFiles: true
        }
      }
    };

    const photoWarsService = new PhotoWarsService(options);

    photoWarsService.start((err) => {
      logger.info({ err }, TASK_SERVICE);
      done(err, photoWarsService);
    });
  }]
}, (err, result) => {
  if (err) {
    logger.error({ err }, `${config.service.name} FAILED TO START!`);
    throw err;
  }

  logger.info(result[TASK_SERVICE].server.address(), `${config.service.name} STARTED!`);
});
