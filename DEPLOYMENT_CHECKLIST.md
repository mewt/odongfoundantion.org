# ODONG Foundation Website - Deployment Checklist

## ✅ Completed Tasks
1. ✅ Created complete bilingual website (English/Indonesian)
2. ✅ Implemented language switcher with flag icons
3. ✅ Set up headless WordPress blog system (API ready)
4. ✅ Added SEO meta tags (currently with noindex, nofollow)
5. ✅ Pushed code to GitHub: https://github.com/mewt/odongfoundantion.org.git
6. ✅ Removed unnecessary documentation files
7. ✅ Tested locally with fresh clone

## 🔧 Next Steps for Production Deployment

### 1. Server Configuration (Nginx)
**For clean URLs (without .html extensions):**

```nginx
location / {
    try_files $uri $uri.html $uri/ =404;
}
```

**Complete Nginx configuration:** See `nginx-example.conf` file.

### 2. WordPress Blog Setup
1. **Install WordPress** at: `blog.odongfoundation.org`
2. **Enable REST API** (enabled by default in WordPress)
3. **Update blog configuration** in `js/blog.js` and `js/blog-post.js`:
   ```javascript
   const WP_API_URL = 'https://blog.odongfoundation.org';
   ```

### 3. Domain Configuration
1. **Register domain**: `odongfoundation.org`
2. **Configure DNS**:
   - A record: `@` → VPS server IP
   - CNAME: `blog` → `blog.odongfoundation.org`
3. **SSL certificates** (Let's Encrypt):
   ```bash
   sudo certbot --nginx -d odongfoundation.org -d www.odongfoundation.org
   sudo certbot --nginx -d blog.odongfoundation.org
   ```

### 4. Production Server Setup
```bash
# Clone repository
git clone https://github.com/mewt/odongfoundantion.org.git /var/www/odongfoundation.org

# Set permissions
sudo chown -R www-data:www-data /var/www/odongfoundation.org
sudo chmod -R 755 /var/www/odongfoundation.org

# Configure web server (Nginx)
sudo cp nginx-example.conf /etc/nginx/sites-available/odongfoundation.org
sudo ln -s /etc/nginx/sites-available/odongfoundation.org /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### 5. Final Configuration Updates
1. **Remove noindex meta tags** (after client approval):
   - Remove from all HTML files: `<meta name="robots" content="noindex, nofollow">`
   
2. **Update contact information** if needed:
   - Email addresses
   - Phone numbers
   - Social media links

3. **Test bilingual functionality**:
   - Language switching
   - LocalStorage persistence
   - All translated content

### 6. Testing Checklist
- [ ] All pages load correctly
- [ ] Language switcher works
- [ ] Blog loads posts from WordPress
- [ ] Contact form submits correctly
- [ ] Mobile responsive design
- [ ] Page load speed (< 3 seconds)
- [ ] SEO meta tags present
- [ ] Clean URLs work

### 7. Maintenance
1. **Regular backups** of WordPress database
2. **Update WordPress** and plugins monthly
3. **Monitor website analytics**
4. **Update content** as needed

## 📁 File Structure
```
/var/www/odongfoundation.org/
├── index.html
├── about.html
├── programs.html
├── contact.html
├── blog.html
├── blog-post.html
├── css/
│   └── style.css
├── js/
│   ├── main.js
│   ├── translations.js      # CRITICAL: Bilingual translations
│   ├── blog.js             # Requires WP_API_URL update
│   └── blog-post.js        # Requires WP_API_URL update
├── img/
│   ├── logo-odong.png
│   ├── lang/
│   │   ├── united-states-of-america.png
│   │   └── indonesia.png
│   └── foto2/              # Program images
└── robots.txt
```

## 🔗 Important URLs
- **GitHub**: https://github.com/mewt/odongfoundantion.org.git
- **Production**: https://odongfoundation.org
- **Blog**: https://blog.odongfoundation.org
- **WordPress Admin**: https://blog.odongfoundation.org/wp-admin

## 📞 Support
For deployment assistance, contact the development team with access to:
1. VPS server credentials
2. Domain registrar account
3. WordPress admin access