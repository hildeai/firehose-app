require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();

app.use(express.json());
app.use(cors());

app.post('/rides', async (req, res) => {
  const ride = req.body;
  
  const requiredFields = [
    'Type', 'Datetime', 'UserID', 'DriverID', 'CityCode',
    'PickupLocationID', 'DropoffLocationID', 'PassengerCount',
    'TripDistance', 'FareAmount', 'ExtraAmount', 'TipAmount',
    'TotalAmount', 'PaymentType', 'CurrencyCode'
  ];
  
  const missingFields = requiredFields.filter(field => ride[field] === undefined);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missingFields.join(', ')}`
    });
  }
  
  try {
    const result = await db.createRide(ride);
    
    res.status(201).json({
      message: 'Ride created successfully',
      id: result.id
    });
  } catch (err) {
    console.error('Error saving ride', err);
    res.status(500).json({ error: 'Failed to save ride' });
  }
});

app.get('/active', async (req, res) => {
  try {
    const activeRides = await db.getActiveRides();
    res.json(activeRides);
  } catch (err) {
    console.error('Error fetching active rides', err);
    res.status(500).json({ error: 'Failed to fetch active rides' });
  }
});

app.get('/health', async (req, res) => {
  const dbStatus = await db.healthCheck();
  
  if (dbStatus) {
    res.status(200).json({ status: 'healthy', database: 'connected' });
  } else {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

const PORT = 8080;

db.initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database, retrying in 5 seconds...', err);
    setTimeout(() => {
      db.initDb()
        .then(() => {
          app.listen(PORT, () => {
            console.log(`Server running on port ${PORT} after retry`);
          });
        })
        .catch(err => {
          console.error('Failed to initialize database after retry, exiting', err);
          process.exit(1);
        });
    }, 5000);
  });