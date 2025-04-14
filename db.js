const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ridedb',
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS rides (
        id SERIAL PRIMARY KEY,
        type VARCHAR(255) NOT NULL,
        datetime TIMESTAMP NOT NULL,
        user_id BIGINT NOT NULL,
        driver_id BIGINT NOT NULL,
        city_code VARCHAR(50) NOT NULL,
        pickup_location_id BIGINT NOT NULL,
        dropoff_location_id BIGINT NOT NULL,
        passenger_count BIGINT NOT NULL,
        trip_distance FLOAT NOT NULL,
        fare_amount FLOAT NOT NULL,
        extra_amount FLOAT NOT NULL,
        tip_amount FLOAT NOT NULL,
        total_amount FLOAT NOT NULL,
        payment_type INTEGER NOT NULL,
        currency_code VARCHAR(10) NOT NULL,
        active BOOLEAN DEFAULT TRUE
      );
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database', err);
    throw err;
  } finally {
    client.release();
  }
}

async function createRide(ride) {
  const result = await pool.query(`
    INSERT INTO rides (
      type, datetime, user_id, driver_id, city_code,
      pickup_location_id, dropoff_location_id, passenger_count,
      trip_distance, fare_amount, extra_amount, tip_amount,
      total_amount, payment_type, currency_code
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id
  `, [
    ride.Type, 
    ride.Datetime, 
    ride.UserID, 
    ride.DriverID, 
    ride.CityCode,
    ride.PickupLocationID, 
    ride.DropoffLocationID, 
    ride.PassengerCount,
    ride.TripDistance, 
    ride.FareAmount, 
    ride.ExtraAmount, 
    ride.TipAmount,
    ride.TotalAmount, 
    ride.PaymentType, 
    ride.CurrencyCode
  ]);
  
  return result.rows[0];
}

async function getActiveRides() {
  const result = await pool.query(`
    SELECT * FROM rides 
    WHERE Type = 'active'
  `);
  
  return result.rows;
}

async function healthCheck() {
  try {
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Database health check failed', err);
    return false;
  }
}

module.exports = {
  pool,
  initDb,
  createRide,
  getActiveRides,
  healthCheck
};