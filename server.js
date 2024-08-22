const express = require('express');
const mongoose = require('mongoose');
const Moralis = require('moralis').default;
require('dotenv').config();

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define schema and model
const ipfsDataSchema = new mongoose.Schema({
  cid: { type: String, required: true },
  text: { type: String, required: true },
  filename: { type: String, required: true },
});

const IPFSData = mongoose.model('IPFSData', ipfsDataSchema);

// Initialize Moralis
Moralis.start({
  apiKey: process.env.MORALIS_API_KEY,
});

// API endpoint to store text data on IPFS and save hash in MongoDB
app.post('/store-text', async (req, res) => {
  try {
    const { text, filename } = req.body;

    if (!text || !filename) {
      return res.status(400).json({ error: 'Text and filename are required.' });
    }

    // Create the file array
    const uploadArray = [
      {
        path: `${filename}.txt`,
        content: Buffer.from(text).toString('base64'), // Convert text to Base64
      },
    ];

    // Upload to IPFS via Moralis
    const response = await Moralis.EvmApi.ipfs.uploadFolder({ abi: uploadArray });

    if (!response || response.result.length === 0) {
      throw new Error('Failed to get CID from upload');
    }

    const cid = response.result[0].path; // IPFS CID

    // Store the IPFS hash, filename, and text in MongoDB
    const ipfsData = new IPFSData({ cid, text, filename });
    await ipfsData.save();

    res.json({ cid });
  } catch (error) {
    console.error('Error storing data on IPFS:', error.message || error);
    res.status(500).json({ error: 'Failed to store data on IPFS.' });
  }
});

// API endpoint to retrieve data by IPFS hash
app.get('/retrieve-text/:cid', async (req, res) => {
  try {
    const { cid } = req.params;

    // Retrieve the data from MongoDB based on the IPFS hash
    const ipfsData = await IPFSData.findOne({ cid });

    if (!ipfsData) {
      return res.status(404).json({ error: 'Data not found for the provided IPFS hash.' });
    }

    res.json({ text: ipfsData.text });
  } catch (error) {
    console.error('Error retrieving data:', error);
    res.status(500).json({ error: 'Failed to retrieve data.' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
