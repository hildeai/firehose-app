const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ridedb',
});

// Initialize database schema
async function initDb() {
  const client = await pool.connect();
  try {
    // Create rides table if it doesn't exist (idempotent operation)
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

    // Create index for active rides if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE indexname = 'idx_rides_active'
        ) THEN
          CREATE INDEX idx_rides_active ON rides(active);
        END IF;
      END
      $$;
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database', err);
    throw err;
  } finally {
    client.release();
  }
}

// Create a new ride
async function createRide(ride) {
  const result = await pool.query(`
    INSERT INTO rides (
      type, datetime, user_id, driver_id, city_code,
      pickup_location_id, dropoff_location_id, passenger_count,
      trip_distance, fare_amount, extra_amount, tip_amount,
      total_amount, payment_type, currency_code, active
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, TRUE)
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

// Get all active rides
async function getActiveRides() {
  const result = await pool.query(`
    SELECT * FROM rides 
    WHERE active = TRUE
  `);
  
  return result.rows;
}

// Health check for database connection
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