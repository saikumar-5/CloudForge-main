# EC2 Deployment Reference Card

**Print this or bookmark it for tomorrow's deployment!**

## Demo URL Once Deployed
```
http://<EC2_PUBLIC_IP>:5000
```

## Critical EC2 Setup (Do Tonight)

### Create Instance
- **AMI**: Ubuntu 22.04 LTS
- **Type**: t3.micro (free tier)
- **Security Group** - Allow incoming:
  - SSH (22) - from your IP
  - HTTP (80) - from anywhere
  - TCP 5000 - from anywhere
- **Key Pair**: Download & save `.pem` file

## Critical EC2 Setup (Do Before Running)

### SSH Command
```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### Install on EC2
```bash
sudo apt update -y && sudo apt install -y nodejs npm git
sudo npm install -g pm2
```

### Get Code on EC2
```bash
cd ~ && git clone https://github.com/your-username/CloudForge-main.git
cd CloudForge-main/backend && npm install
cd ../frontend && npm install && npm run build
```

### Configure on EC2
```bash
cd ~/CloudForge-main/backend
nano .env
# Add: PORT=5000, NODE_ENV=production, MONGODB_URI=..., JWT_SECRET=...
# Ctrl+O, Enter, Ctrl+X to save
```

### Run on EC2
```bash
pm2 start server/index.js --name cloudforge
pm2 logs cloudforge    # Should see "🚀 Server is running on port 5000"
pm2 save
sudo pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

## Test the Deployment

### From Your Laptop
```bash
curl http://<EC2_PUBLIC_IP>:5000/health
```

### In Browser
```
http://<EC2_PUBLIC_IP>:5000
```
Should show CloudForge home page.

### Multiplayer Test
1. Open URL on Device A
2. Create game room
3. Open same URL on Device B
4. Join room
5. Verify real-time updates work

## If It Breaks

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Check status
pm2 logs cloudforge

# Restart
pm2 restart cloudforge

# Check health
curl localhost:5000/health
```

## Files You Need to Know

- **Code Changes**: `backend/server/index.js`, `frontend/src/contexts/realtime-context.jsx`
- **Build Output**: `frontend/dist/` (Express will serve this)
- **Guide**: `QUICK_START_EC2.md` (in your repo)
- **Check**: `backend/.env.example` (reference for env vars)

## 3 Key Changes Made

1. **Backend serves frontend** - Express now serves `../frontend/dist` as static files
2. **Dynamic Socket.IO URL** - Client uses `window.location.origin` instead of hardcoded localhost
3. **Frontend built** - `npm run build` created production bundle in `dist/`

## Demo Script (60 seconds)

> "CloudForge is a real-time multiplayer game platform. The frontend is React + Vite, built to static files and served by Express. Socket.IO connects to the same origin, so no CORS issues. Everything runs on a single t3.micro EC2 instance. Let me show you the multiplayer in action..."

**[Open URL on two devices]**

> "Both players are connected in real-time over WebSockets. When one player moves, the other sees it instantly. The game state is persisted in MongoDB Atlas."

## Remember

- ✅ `npm run build` before pushing to EC2
- ✅ `.env` must have real MONGODB_URI and FIREBASE_API_KEY
- ✅ Security group must allow TCP 5000 from anywhere (or your IP)
- ✅ `pm2 logs cloudforge` shows everything happening
- ✅ First load might take 5-10s while Node starts

**Good luck! 🚀**
