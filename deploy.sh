#!/bin/bash
# ODONG Foundation Website Deployment Script
# Usage: sudo bash deploy.sh

set -e  # Exit on error

echo "🚀 Starting ODONG Foundation website deployment..."

# Variables
DOMAIN="odongfoundation.org"
WEB_ROOT="/var/www/$DOMAIN"
REPO_URL="https://github.com/mewt/odongfoundantion.org.git"
NGINX_CONF="/etc/nginx/sites-available/$DOMAIN"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (sudo)"
    exit 1
fi

# Update system
echo "📦 Updating system packages..."
apt-get update
apt-get upgrade -y

# Install required packages
echo "📦 Installing Nginx..."
apt-get install -y nginx certbot python3-certbot-nginx

# Clone or update website
echo "📥 Cloning website repository..."
if [ -d "$WEB_ROOT" ]; then
    echo "📁 Website directory exists, pulling updates..."
    cd "$WEB_ROOT"
    git pull origin main
else
    git clone "$REPO_URL" "$WEB_ROOT"
fi

# Set permissions
echo "🔒 Setting permissions..."
chown -R www-data:www-data "$WEB_ROOT"
chmod -R 755 "$WEB_ROOT"

# Configure Nginx
echo "⚙️ Configuring Nginx..."
cp "$WEB_ROOT/nginx-example.conf" "$NGINX_CONF"

# Enable site
if [ ! -f "/etc/nginx/sites-enabled/$DOMAIN" ]; then
    ln -s "$NGINX_CONF" "/etc/nginx/sites-enabled/"
fi

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
nginx -t

# Restart Nginx
echo "🔄 Restarting Nginx..."
systemctl restart nginx

echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Configure DNS for $DOMAIN to point to this server"
echo "2. Run SSL certificate setup:"
echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo "3. Set up WordPress blog at blog.$DOMAIN"
echo "4. Update WP_API_URL in js/blog.js and js/blog-post.js"
echo ""
echo "🌐 Website should now be accessible at: http://$DOMAIN"