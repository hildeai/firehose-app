#!/bin/bash
# Deployment script for Firehose App on Hetzner CX22/CX32

set -e

# Configuration
APP_DIR="/opt/firehose-app"
SERVICE_NAME="firehose-app"
SYSTEMD_PATH="/etc/systemd/system"
DB_NAME="ridedb"
DB_USER="nodeapp"
DB_PASSWORD=$(openssl rand -base64 12)

# Create user if it doesn't exist
if ! id -u nodejs > /dev/null 2>&1; then
  echo "Creating nodejs user..."
  useradd -r -m -s /bin/bash nodejs
fi

# Create application directory
echo "Setting up application directory..."
mkdir -p $APP_DIR
chown nodejs:nodejs $APP_DIR

# Copy application files
echo "Copying application files..."
cp -r ./* $APP_DIR/
cp -r ./.env* $APP_DIR/ 2>/dev/null || true
chown -R nodejs:nodejs $APP_DIR

# Install dependencies
echo "Installing npm dependencies..."
cd $APP_DIR
npm install --production

# Install PostgreSQL if not installed
if ! command -v psql &> /dev/null; then
  echo "Installing PostgreSQL..."
  apt-get update
  apt-get install -y postgresql postgresql-contrib
  
  # Start and enable PostgreSQL
  systemctl start postgresql
  systemctl enable postgresql
fi

# Setup database (idempotent operations)
echo "Setting up database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1 || sudo -u postgres psql -c "CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

# Setup environment variables
echo "Setting up environment variables..."
if [ ! -f "$APP_DIR/.env" ]; then
  cat > $APP_DIR/.env << EOF
# Database connection
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME

# Environment
NODE_ENV=production
EOF
  echo "Created .env file with generated credentials"
else
  echo ".env file already exists, skipping"
fi

chown nodejs:nodejs $APP_DIR/.env
chmod 600 $APP_DIR/.env

# Install and configure systemd service
echo "Setting up systemd service..."
cp $APP_DIR/firehose-app.service $SYSTEMD_PATH/$SERVICE_NAME.service
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl restart $SERVICE_NAME

# Wait for service to start and check status
echo "Waiting for service to start..."
sleep 5
if systemctl is-active --quiet $SERVICE_NAME; then
  echo "Service is running successfully!"
else
  echo "WARNING: Service failed to start, checking logs..."
  journalctl -u $SERVICE_NAME -n 20
fi

echo "Deployment completed successfully!"
echo "The application is now running at http://server-ip:80"
echo "Database credentials have been saved to $APP_DIR/.env"
echo "Check service status with: systemctl status $SERVICE_NAME"
echo "View logs with: journalctl -u $SERVICE_NAME -f"