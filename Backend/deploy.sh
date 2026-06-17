#!/bin/bash

# Deployment script for Django backend
echo "🚀 Starting deployment process..."

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser if needed (optional)
# echo "👤 Creating superuser..."
# python manage.py createsuperuser --noinput

echo "✅ Deployment complete!"
echo "🌐 Starting server..."
gunicorn core.wsgi:application --bind 0.0.0.0:$PORT