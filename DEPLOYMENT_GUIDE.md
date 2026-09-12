# Deployment Guide for Debian Server

## Security Overview ✅
This app is ALREADY secure:
- ✅ All API routes require authentication (cookie-based JWT)
- ✅ Server-side validation for all operations
- ✅ Ownership checks (can't equip items you don't own)
- ✅ Coin validation (can't spend coins you don't have)
- ✅ httpOnly cookies (can't be stolen by XSS)
- ✅ Database operations on server only (client can't modify data)

## What Your Friend Needs to Do:

### 1. SSH into the server
```bash
ssh user@server-ip
```

### 2. Install Node.js 18+
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should show v18.x or higher
```

### 3. Install PostgreSQL
```bash
sudo apt-get update
sudo apt-get install -y postgresql postgresql-contrib
```

### 4. Create Database and User
```bash
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
CREATE DATABASE fitness_app;
CREATE USER fitness_user WITH PASSWORD 'USE_A_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE fitness_app TO fitness_user;
ALTER DATABASE fitness_app OWNER TO fitness_user;
\q
```

### 5. Create Project Directory
```bash
cd /var/www
sudo mkdir -p fitness-app
sudo chown -R $USER:$USER fitness-app
cd fitness-app
```

### 6. Extract the zip file
(Your friend will unzip the file you send here)

### 7. Install Dependencies
```bash
npm install
```

### 8. Create Environment File
```bash
nano .env
```

Add these lines:
```
DATABASE_URL="postgresql://fitness_user:USE_A_STRONG_PASSWORD_HERE@localhost:5432/fitness_app"
JWT_SECRET="GENERATE_A_RANDOM_LONG_SECRET_KEY_HERE_AT_LEAST_32_CHARACTERS"
NODE_ENV="production"
```

**IMPORTANT:**
- Use a STRONG password for PostgreSQL
- Generate a random JWT_SECRET (use: `openssl rand -base64 32`)
- Never share these values

### 9. Setup Database Schema
```bash
npx prisma generate
npx prisma db push
```

### 10. Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 11. Start the App with PM2
```bash
pm2 start npm --name "fitness-app" -- start
pm2 save
pm2 startup
```

The last command will give you a command to run - copy and run it.

### 12. Configure Firewall (UFW)
```bash
sudo ufw allow 22          # SSH
sudo ufw allow 80          # HTTP
sudo ufw allow 443         # HTTPS
sudo ufw enable
```

### 13. Set Up Nginx (Recommended for HTTPS)

Install Nginx:
```bash
sudo apt-get install -y nginx
```

Create Nginx config:
```bash
sudo nano /etc/nginx/sites-available/fitness-app
```

Add this content:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or server IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/fitness-app /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 14. Set Up HTTPS with Let's Encrypt (Free SSL)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### 15. Configure Port Forwarding (Router)
- Forward port 80 to your server's internal IP
- Forward port 443 to your server's internal IP
- If not using a domain, just forward port 3000 (not recommended for security)

### 16. Monitor the App
```bash
pm2 logs fitness-app      # View logs
pm2 status               # Check status
pm2 restart fitness-app  # Restart if needed
```

## Security Checklist:

- ✅ Strong PostgreSQL password
- ✅ Random JWT_SECRET (32+ characters)
- ✅ HTTPS enabled (Let's Encrypt)
- ✅ Firewall configured (UFW)
- ✅ PM2 auto-restart on boot
- ✅ Nginx reverse proxy (hides Node.js from direct access)
- ✅ Regular backups (your friend should set up PostgreSQL backups)

## Additional Security Notes:

1. **Never expose the app directly on port 3000** - always use Nginx
2. **Keep Node.js and dependencies updated** - run `npm update` regularly
3. **Backup the database** - use `pg_dump` regularly
4. **Monitor logs** - check for suspicious activity
5. **Rate limiting** - consider adding rate limiting to API routes (optional)

## Database Backup (Recommended)

Add this to crontab for daily backups:
```bash
sudo crontab -e
```

Add this line (backs up at 2 AM daily):
```
0 2 * * * pg_dump -U fitness_user fitness_app > /var/backups/fitness-app-$(date +\%Y\%m\%d).sql
```

## Troubleshooting:

If the app doesn't start:
```bash
pm2 logs fitness-app
```

If database connection fails:
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Check DATABASE_URL in .env file
- Check PostgreSQL user permissions

If port forwarding doesn't work:
- Check router settings
- Check firewall: `sudo ufw status`
- Check Nginx is running: `sudo systemctl status nginx`

## Done!

Your app should now be accessible at:
- `http://your-domain.com` (or your server IP if no domain)
- `https://your-domain.com` (if HTTPS is set up)
