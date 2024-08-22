const mongoose = require('mongoose');

const ipfsDataSchema = new mongoose.Schema({
  cid: { type: String, required: true },
  text: { type: String, required: true },
});

const IPFSData = mongoose.model('IPFSData', ipfsDataSchema);

module.exports = IPFSData;
