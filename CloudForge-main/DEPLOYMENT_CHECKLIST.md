# CloudForge Deployment Checklist

A quick reference for deploying CloudForge to AWS EC2.

## Pre-Deployment (Local)

- [x] Backend configured to listen on `0.0.0.0:5000`
- [x] Backend serves static files from `../frontend/dist`
- [x] Backend has SPA fallback routing (catch-all `*` route)
- [x] Socket.IO client uses `window.location.origin` (dynamic URL)
- [x] Frontend built with `npm run build` → creates `dist/` folder
- [x] `.env.example` created in backend folder
- [x] `DEPLOYMENT.md` documentation created
- [ ] All environment variables documented (MONGODB_URI, JWT_SECRET, etc.)
- [ ] Git repository is up to date

## AWS Setup

- [ ] AWS Account with EC2 access
- [ ] EC2 instance created (Ubuntu 22.04, t3.micro or t4g.micro)
- [ ] Security groups configured:
  - [ ] SSH (TCP 22) from your IP
  - [ ] HTTP (TCP 80) from anywhere
  - [ ] TCP 5000 from anywhere (or 0.0.0.0/0)
- [ ] Key pair downloaded and saved securely (.pem file)

## Server Configuration

- [ ] SSH access verified: `ssh -i your-key.pem ubuntu@<IP>`
- [ ] Node.js and npm installed
- [ ] PM2 installed globally: `sudo npm install -g pm2`
- [ ] Git installed: `sudo apt install -y git`
- [ ] Repository cloned to EC2
- [ ] Backend dependencies installed: `npm install` (in backend/)
- [ ] Frontend dependencies installed: `npm install` (in frontend/)
- [ ] Frontend built on server: `npm run build`

## Configuration on EC2

- [ ] `.env` file created in `backend/` with:
  - [ ] `PORT=5000`
  - [ ] `NODE_ENV=production`
  - [ ] `MONGODB_URI=<your-mongo-connection-string>`
  - [ ] `JWT_SECRET=<random-secret-key>`
  - [ ] `GOOGLE_CLIENT_ID=<firebase-client-id>`
  - [ ] `FIREBASE_API_KEY=<firebase-api-key>`
  - [ ] `CLIENT_URL=http://<EC2_PUBLIC_IP>:5000`
- [ ] `.env` file verified: `cat .env`

## Application Start

- [ ] PM2 started backend: `pm2 start server/index.js --name cloudforge`
- [ ] PM2 logs checked: `pm2 logs cloudforge` (no errors)
- [ ] PM2 configured for startup: `pm2 startup && pm2 save`
- [ ] Health check working: `curl http://localhost:5000/health`

## Testing

- [ ] Browser test: Open `http://<EC2_PUBLIC_IP>:5000`
- [ ] Frontend loads correctly
- [ ] API endpoint works: `/health` returns JSON
- [ ] Socket.IO connection in browser console shows connection
- [ ] Create a game room
- [ ] Invite another player (same or different device)
- [ ] Multiplayer real-time updates work (moves, chat, etc.)
- [ ] Both players can see the game board updates instantly

## Post-Deployment

- [ ] Application is stable (no crashes)
- [ ] PM2 will restart app on reboot: `pm2 list`
- [ ] Optional: Set up Nginx reverse proxy on port 80
- [ ] Optional: Configure SSL/HTTPS with Let's Encrypt
- [ ] Optional: Set up CloudWatch monitoring
- [ ] Document any custom configuration changes

## Demo Readiness

- [ ] EC2 IP address noted
- [ ] URL format memorized: `http://<EC2_PUBLIC_IP>:5000`
- [ ] Test users created (or Firebase demo auth working)
- [ ] Practice multiplayer game demo
- [ ] Prepare talking points about architecture

## Quick Commands Reference

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Check app status
cd ~/CloudForge-main/backend
pm2 status

# View logs
pm2 logs cloudforge

# Restart app
pm2 restart cloudforge

# Rebuild frontend (if code changed)
cd ~/CloudForge-main/frontend
npm run build

# Stop app temporarily
pm2 stop cloudforge

# Start app again
pm2 start server/index.js --name cloudforge
```

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Port 5000 not reachable | Check security group allows TCP 5000, verify PM2 status |
| `dist/` folder missing | Run `npm run build` in frontend/ on EC2 |
| Socket.IO won't connect | Check browser console, verify MONGODB_URI is valid |
| PM2 won't start | Check logs: `pm2 logs cloudforge` |
| MongoDB connection error | Verify MONGODB_URI syntax and IP whitelist in Atlas |

## Success Indicators

✅ Backend running on `0.0.0.0:5000`
✅ Frontend HTML served from `http://<IP>:5000`
✅ Socket.IO WebSocket connection established
✅ Two players can join same game room
✅ Real-time moves sync across all connected clients
✅ No CORS errors in browser console
✅ PM2 keeps app alive on server restart
