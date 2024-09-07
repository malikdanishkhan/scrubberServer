const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const fastcsv = require('fast-csv');
const cors = require('cors');

const app = express();
const port = 5000;

// Middleware
app.use(cors()); // Allow cross-origin requests

// Increase the limit for body-parser
app.use(bodyParser.json({ limit: '50mb' })); // Adjust this limit as needed
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // For form submissions if needed

// Path to the reference file
const referenceFilePath = path.join(__dirname, 'reference.csv');

// Load reference file into a Set for fast lookup
const referenceSet = new Set();

fs.createReadStream(referenceFilePath)
  .pipe(fastcsv.parse({ headers: true }))
  .on('data', (row) => {
    referenceSet.add(row[Object.keys(row)[0]]); // Assuming the key is in the first column
  })
  .on('end', () => {
    console.log('Reference file loaded');
  });

// Endpoint to scrub data
app.post('/api/scrub', (req, res) => {
  const uploadedData = req.body.data;

  // Filter out rows where the first column value is in the reference set
  const scrubbedData = uploadedData.filter(row => !referenceSet.has(row[Object.keys(row)[0]])); // Assuming the key is in the first column

  // Set headers for file download
  res.setHeader('Content-Disposition', 'attachment; filename=scrubbed_data.csv');
  res.setHeader('Content-Type', 'text/csv');

  // Create a CSV stream and pipe it to the response
  const csvStream = fastcsv.format({ headers: true });
  csvStream.pipe(res);

  scrubbedData.forEach(row => csvStream.write(row));
  csvStream.end();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
