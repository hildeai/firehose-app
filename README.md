# Ride Management API

A simple Express.js API for processing ride data with PostgreSQL database integration.

## Setup

### Local Development
1. Clone this repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example` and update with your database credentials
4. Make sure PostgreSQL is running and the database is created

### Deployment on Hetzner CX22/CX32
The application includes a setup script for Hetzner servers:

1. Clone this repository on your server:
   ```
   git clone https://github.com/yourusername/firehose-app.git
   cd firehose-app
   ```

2. Make the setup script executable (if needed):
   ```
   chmod +x setup.sh
   ```

3. Run the setup script as root:
   ```
   sudo ./setup.sh
   ```

The script will:
- Install Node.js, npm, and PostgreSQL if not already installed
- Create a nodejs user
- Install the application in /opt/firehose-app
- Create the necessary database and user with secure random password
- Set up a systemd service that ensures PostgreSQL is running
- Enable and start the service
- Display useful commands for managing the application

## Running the Application

Development mode (with hot reloading):
```
npm run dev
```

Production mode:
```
npm start
```

## API Endpoints

### POST /rides
Creates a new ride entry in the database.

Example request:
```json
{
  "Type": "standard",
  "Datetime": "2023-04-14T14:30:00Z",
  "UserID": 12345,
  "DriverID": 67890,
  "CityCode": "NYC",
  "PickupLocationID": 1001,
  "DropoffLocationID": 1002,
  "PassengerCount": 2,
  "TripDistance": 3.5,
  "FareAmount": 15.50,
  "ExtraAmount": 2.00,
  "TipAmount": 3.00,
  "TotalAmount": 20.50,
  "PaymentType": 1,
  "CurrencyCode": "USD"
}
```

### GET /active
Returns all active rides from the database.

## Database Schema

The application uses a PostgreSQL database with the following schema:

```sql
CREATE TABLE rides (
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
```