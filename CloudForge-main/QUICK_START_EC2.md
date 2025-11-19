# CloudForge EC2 Quick Start (Copy-Paste Commands)

Complete copy-paste command sequences for rapid EC2 deployment.

## 1. SSH Into Your EC2 Instance

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<REPLACE_WITH_YOUR_EC2_PUBLIC_IP>
```

## 2. Update System and Install Dependencies

```bash
sudo apt update -y
sudo apt install -y nodejs npm git curl
sudo npm install -g pm2
```

## 3. Clone Repository and Install Dependencies

```bash
cd ~
git clone https://github.com/your-username/CloudForge-main.git
cd CloudForge-main

# Install backend dependencies
cd backend
npm install
cd ..

# Install frontend dependencies and build
cd frontend
npm install
npm run build
cd ..
```

## 4. Create .env File

```bash
cd backend
cat > .env << 'EOF'
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cloudforge?appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-12345-change-this
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
FIREBASE_API_KEY=your-firebase-api-key
CLIENT_URL=http://your-ec2-ip:5000
EOF
```

**Remember to replace the values:**
- `mongodb+srv://...` - Get from MongoDB Atlas connection string
- `your-super-secret-jwt-key-12345-change-this` - Make up a random string
- `your-google-client-id...` - Get from Firebase project
- `your-firebase-api-key` - Get from Firebase project
- `your-ec2-ip` - Your EC2 public IPv4 address

Verify the file:
```bash
cat .env
```

## 5. Start Application with PM2

```bash
cd ~/CloudForge-main/backend
pm2 start server/index.js --name cloudforge
pm2 save
sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Check status:
```bash
pm2 logs cloudforge
```

You should see:
```
🚀 Server is running on port 5000
🎮 Socket.IO is ready for connections
📊 Environment: production
MongoDB connected
```

## 6. Test the Deployment

**From your local machine:**

```bash
# Replace with your actual EC2 public IP
curl http://<EC2_PUBLIC_IP>:5000/health

# Should return:
# {"status":"healthy","timestamp":"...","database":"connected"}
```

**In a browser:** Open `http://<EC2_PUBLIC_IP>:5000`

You should see the CloudForge home page!

## 7. Verify Socket.IO Works

1. Open `http://<EC2_PUBLIC_IP>:5000` in a browser
2. Open DevTools (F12) → Console tab
3. Look for: `🔗 Socket.IO connecting to: ...`
4. Create a game room
5. Open the same URL in another browser/device
6. Join the room
7. Verify both players see real-time updates

## 8. Useful Commands After Deployment

```bash
# View app logs
pm2 logs cloudforge

# Check app status
pm2 status

# Restart app (if you made code changes)
pm2 restart cloudforge

# Stop app temporarily
pm2 stop cloudforge

# Start app again
pm2 start cloudforge

# Rebuild frontend (if JS/CSS changed on server)
cd ~/CloudForge-main/frontend
npm run build

# Rebuild and restart
pm2 restart cloudforge
```

## 9. If Something Goes Wrong

```bash
# Check error logs
pm2 logs cloudforge --err

# See what processes are running
pm2 list

# Kill app completely
pm2 delete cloudforge

# Restart from scratch
cd ~/CloudForge-main/backend
pm2 start server/index.js --name cloudforge
pm2 logs cloudforge

# Check if MongoDB connection works
curl http://localhost:5000/health
```

## 10. Optional: Set Up Nginx Reverse Proxy (For Port 80)

If you want to serve on port 80 instead of 5000:

```bash
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/cloudforge > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/cloudforge /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

Then visit: `http://<EC2_PUBLIC_IP>` (no port needed)

## Summary

After Step 5, your app is **live on the internet** at `http://<EC2_PUBLIC_IP>:5000`

- ✅ Frontend: Served by Express (no CORS issues)
- ✅ Backend: Node.js + Socket.IO on EC2
- ✅ Database: Connected to MongoDB Atlas
- ✅ Persistent: PM2 keeps it running after reboots
- ✅ Multiplayer: Real-time Socket.IO communication

Ready for your demo! 🎮
