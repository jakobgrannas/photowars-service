'use strict';

const restify = require('restify');
const { Service } = require('node-service');
const { whoDis, getFaceDescriptor } = require('./lib/faceRecognition');
const fs = require('fs').promises;
const path = require('path');
const ip = require('ip');
const faceapi = require('face-api.js');

const { user: User } = require('./schema'); // TODO: Change schema to export with capital first letter

class PhotoWarsService extends Service {

  constructor(options) {
    super(options);

    this.port = options.service.port;
    this.logger = options.logger;
  }

  async postAddUser(req, res, next) {
    const responseHandler = this.createResponseHandler(req, res, next);

    // TODO: Check that username is unique

    const publicPath = 'public/photos';
    const uploadPath = path.join(__dirname, `${publicPath}`);
    const { username, name } = req.body;
    const { File } = req.files;
    const filePath = path.join(uploadPath, `${username}${path.extname(File.name)}`);
    const protocol = req.isSecure() ? 'https' : 'http';

    try {
      const file = await fs.writeFile(filePath, req.params.File);
    } catch(err) {
      this.logger.error({ err }, 'postAddUser failed to write user photo file');
    }
    
    const descriptor = await getFaceDescriptor(filePath);

    const publicPhotoUrl = `${protocol}://${ip.address()}:${this.port}/${publicPath}/${username}${path.extname(filePath)}`;

    const newUser = new User({
      username,
      name,
      photo: {
        url: publicPhotoUrl
      },
      // Convert Float32Array > Array
      faceDescriptor: Array.from(descriptor)
    });

    try {
      const user = await User.create(newUser);
      responseHandler(null, { user });
    } catch (err) {
      this.logger.error({ err }, 'Failed to add user');
      responseHandler(err);
    }
  }

  // TODO: Refactor this
  async postKill(req, res, next) {
    const responseHandler = this.createResponseHandler(req, res, next);

    // https://github.com/mscdex/busboy/issues/81
    res.header('Connection', 'close');

    let users = [];

    try {
      const usersFromDb = await User.find();

      users = usersFromDb.filter(u => u.photo && u.photo.url)
        .map((user) => {
          const { username, name, photo, faceDescriptor } = user;
          return {
            username,
            name,
            photo,
            faceDescriptor
          };
        });

      console.log(users);
    } catch (err) {
      this.logger.error({ err }, 'Failed to fetch users from db');
      return;
    }

    // Get face descriptors of all user photos so that we can search for a match among them
    const labeledFaceDescriptors = users.map(({ username, faceDescriptor }) => {
      return new faceapi.LabeledFaceDescriptors(username, [Float32Array.from(faceDescriptor)]);
    });

    // upload kill photo
    const { File } = req.files;
    const uploadedFile = File ? File.path : null;
    const match = await whoDis(this.logger.child({ logger: 'faceRecognition' }), uploadedFile, labeledFaceDescriptors);

    const matchedUser = users.find(u => u.username === match) || {};

    const { username, photo = {} } = matchedUser;

    const data = {
      isHit: Boolean(username),
      username: username || null,
      photo: photo.url || null
    };
    
    responseHandler(null, data);
  }

  getTopKillers(req, res, next) {
    // TODO: Implement
    next();
  }

  setupRoutes() {
    this.server.post('/kill', this.postKill.bind(this));
    this.server.post('/user/add', this.postAddUser.bind(this));
    this.server.get('/topkillers', this.getTopKillers.bind(this));
    this.server.get('/public/*', restify.plugins.serveStaticFiles('./public'));
  }

}

module.exports = PhotoWarsService;
