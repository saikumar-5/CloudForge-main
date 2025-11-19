# CloudForge AWS EC2 Deployment Guide

This guide provides step-by-step instructions to deploy the CloudForge application on AWS EC2 with Node.js + Socket.IO backend and a production-built Vite frontend.

## Architecture Overview

- **Frontend**: React + Vite (built to static files, served by Express)
- **Backend**: Node.js + Express + Socket.IO running on EC2
- **Database**: MongoDB (either MongoDB Atlas or local MongoDB)
- **Real-time**: Socket.IO for multiplayer game synchronization
- **Authentication**: Firebase + JWT

## Prerequisites

1. AWS Account with EC2 access (free tier eligible)
2. Git installed on your local machine
3. Node.js and npm installed locally for building
4. GitHub repository with CloudForge code
5. MongoDB Atlas account (or plan to run MongoDB locally)
6. Firebase project with credentials

## Step 1: Prepare the Application Locally

### 1.1 Build the Frontend

```bash
cd frontend
npm install
npm run build
```

This creates a `dist/` directory with optimized static files.

### 1.2 Verify Backend Configuration

The backend has been updated to:
- Listen on `0.0.0.0:5000` (accessible from anywhere)
- Serve static files from `../frontend/dist`
- Automatically redirect SPA routes to `index.html`
- Use environment variables from `.env`

Check `backend/server/index.js` to confirm these settings are in place.

### 1.3 Verify Environment Variables

The backend now uses the following key variables:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...  # Your MongoDB URI
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=...
FIREBASE_API_KEY=...
```

Ensure you have these values ready (from Firebase, MongoDB Atlas, etc.).

## Step 2: Create an AWS EC2 Instance

### 2.1 Launch EC2 Instance

1. Go to [AWS Console](https://console.aws.amazon.com) → EC2 → "Launch Instances"
2. **Name**: Give it a name like `cloudforge-demo`
3. **AMI**: Choose "Ubuntu Server 22.04 LTS" (free tier eligible)
4. **Instance Type**: 
   - Choose `t3.micro` (1 GB RAM, eligible for free tier)
   - Or `t4g.micro` (Graviton processor, also free tier)
5. **Key Pair**: 
   - Create a new key pair: `cloudforge-key`
   - Download the `.pem` file and save it securely
6. **Network Settings**:
   - VPC: Default
   - Auto-assign public IP: Enable
7. **Security Group**: Create new
   - Inbound rules:
     - SSH: TCP 22 from your IP (or 0.0.0.0/0 for testing)
     - HTTP: TCP 80 from 0.0.0.0/0
     - Custom: TCP 5000 from 0.0.0.0/0 (your app port)
   - Outbound: Allow all (default)
8. **Storage**: 20 GB (default) is sufficient
9. Click "Launch Instance"

### 2.2 Wait for Instance to Start

Watch the Instances list until the state is "running" with a green checkmark. Note the **Public IPv4 address**.

## Step 3: Connect to EC2 and Install Dependencies

### 3.1 SSH into the Instance

```bash
# Navigate to the folder with your .pem file
chmod 400 cloudforge-key.pem
ssh -i cloudforge-key.pem ubuntu@<EC2_PUBLIC_IP>
```

Replace `<EC2_PUBLIC_IP>` with the actual public IP from the AWS console.

### 3.2 Update System and Install Node.js, npm, git

```bash
sudo apt update -y
sudo apt install -y nodejs npm git curl
```

Verify installation:
```bash
node --version
npm --version
```

### 3.3 Install PM2 (Process Manager)

PM2 keeps your app running and automatically restarts on server reboot.

```bash
sudo npm install -g pm2
```

## Step 4: Clone and Build on EC2

### 4.1 Clone the Repository

```bash
cd ~
git clone https://github.com/your-username/CloudForge-main.git
cd CloudForge-main
```

### 4.2 Install Backend Dependencies

```bash
cd backend
npm install
cd ..
```

### 4.3 Install Frontend Dependencies and Build

```bash
cd frontend
npm install
npm run build
cd ..
```

This creates the `dist/` directory that the backend will serve.

## Step 5: Set Environment Variables on EC2

### 5.1 Create .env File

```bash
cd backend
nano .env
```

### 5.2 Add Configuration

Copy and modify the following. Get values from:
- **MONGODB_URI**: From MongoDB Atlas connection string
- **JWT_SECRET**: Make up a random strong string
- **GOOGLE_CLIENT_ID** & **FIREBASE_API_KEY**: From your Firebase project

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cloudforge?appName=Cluster0
JWT_SECRET=your-super-secret-key-12345-change-this
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
FIREBASE_API_KEY=your-firebase-api-key
CLIENT_URL=http://<EC2_PUBLIC_IP>:5000
```

**Save**: Press `Ctrl+O`, then `Enter`, then `Ctrl+X` to save and exit nano.

### 5.3 Verify the .env File

```bash
cat .env
```

## Step 6: Start the Application with PM2

### 6.1 Start the Backend

From the backend directory:

```bash
cd ~/CloudForge-main/backend
pm2 start server/index.js --name "cloudforge"
```

Check logs:
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

### 6.2 Set PM2 to Start on Reboot

```bash
pm2 startup
# Follow the printed instruction (usually something like):
# sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu

pm2 save
```

### 6.3 Verify the Service

```bash
pm2 list
pm2 logs cloudforge
```

## Step 7: Test the Deployment

### 7.1 Get EC2 Public IP

From the AWS console, note the **Public IPv4 address** (e.g., `54.123.45.67`).

### 7.2 Test in Browser

Open a browser and navigate to:

```
http://<EC2_PUBLIC_IP>:5000
```

You should see the CloudForge home page.

### 7.3 Test API Endpoint

```bash
curl http://<EC2_PUBLIC_IP>:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-19T...",
  "database": "connected"
}
```

### 7.4 Test Real-time Multiplayer

1. Open `http://<EC2_PUBLIC_IP>:5000` on one device/browser
2. Open the same URL on another device or browser window
3. Create a room → Invite the other player → Start a game
4. The Socket.IO connection should work seamlessly across both clients

**Expected behavior**: You'll see real-time updates (board changes, chat, room updates) without page refreshes.

## Step 8: Production Optimization

### 8.1 (Optional) Set Up Nginx Reverse Proxy

For better performance, you can run Nginx on port 80 and proxy to your Node app on port 5000:

```bash
sudo apt install -y nginx
```

Create/edit `/etc/nginx/sites-available/cloudforge`:

```nginx
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
```

Enable and start Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/cloudforge /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

Now visit `http://<EC2_PUBLIC_IP>:80` (or just the IP without port) and traffic is proxied to your Node app.

### 8.2 Monitor Application

Check logs anytime:

```bash
pm2 logs cloudforge
```

Check status:

```bash
pm2 status
```

Restart if needed:

```bash
pm2 restart cloudforge
```

## Troubleshooting

### Connection Refused on Port 5000

**Problem**: `curl: (7) Failed to connect to port 5000`

**Solution**:
1. Check security group allows TCP 5000 from your IP
2. Check PM2 status: `pm2 logs cloudforge`
3. Verify backend is running: `pm2 list`
4. SSH into EC2 and test locally: `curl localhost:5000`

### Socket.IO Connection Issues

**Problem**: Client connects but Socket.IO events don't work

**Solution**:
1. Check browser console for errors
2. Verify `MONGODB_URI` is correct
3. Check server logs: `pm2 logs cloudforge`
4. Ensure CORS is properly configured for production

### Build Fails or dist/ Missing

**Problem**: `Cannot find module ../frontend/dist`

**Solution**:
1. Rebuild frontend on EC2: `cd frontend && npm run build`
2. Check that `dist/index.html` exists: `ls -la frontend/dist/`

### Git Clone Permission Denied

**Problem**: Permission denied when cloning private repo

**Solution**:
1. Use HTTPS with personal access token
2. Or set up SSH key on EC2 and GitHub

## Demo Talking Points

When presenting CloudForge:

1. **Architecture**: "We've deployed a full-stack real-time multiplayer game platform on AWS EC2. The frontend (React + Vite) is built once and served statically by Express, eliminating CORS issues."

2. **Real-time**: "Socket.IO handles all real-time game synchronization. When one player makes a move, all connected players see it instantly over WebSockets."

3. **Scalability**: "The backend can handle multiple concurrent game rooms. Each room manages its own game state, players, and moves independently."

4. **Cloud Infrastructure**: "Everything is running on a single t3.micro EC2 instance under AWS free tier. In production, we could scale to multiple instances behind a load balancer."

5. **Data**: "Game rooms and user data are persisted in MongoDB Atlas, so games continue seamlessly even if the server restarts."

## Next Steps

- Set up SSL/HTTPS with Let's Encrypt for security
- Configure custom domain with Route53
- Set up CloudWatch monitoring and alarms
- Implement auto-scaling for multiple instances
- Add database backups

## Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [Socket.IO Deployment Guide](https://socket.io/docs/v4/server-deployment/)
- [MongoDB Atlas Connection](https://docs.mongodb.com/manual/reference/connection-string/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
