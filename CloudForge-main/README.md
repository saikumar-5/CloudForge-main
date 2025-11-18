# CloudPlay - Cloud-Based Gaming Platform

CloudPlay is a scalable, cloud-native web-based gaming platform that provides users with a seamless experience to play classic multiplayer games including Tic Tac Toe, Connect 4, Ludo, and Tambola.

## 🎮 Features

### User Features
- **Authentication System**
  - Standard login/signup with email and password
  - Guest mode for quick access (no registration required)
  - JWT-based secure authentication
  - Profile management

- **Game Modes**
  - **Play with Friends**: Create private rooms with unique codes
  - **Online Multiplayer**: Automatic matchmaking with 30-second timeout
  - Real-time gameplay with WebSocket communication
  - Reconnection support (30-second grace period)

- **Games Available**
  - **Tic Tac Toe**: Classic 3x3 grid game (2 players)
  - **Connect 4**: Connect four in a row (2 players)
  - **Ludo**: Simplified board game (2-4 players)
  - **Tambola**: Number calling bingo game (2-8 players)

- **In-Game Currency**
  - Earn coins by winning games
  - Different coin rewards for each game
  - Track your total earnings

### Technical Features
- **Cloud-Native Architecture**
  - Microservices-based backend
  - Containerized with Docker
  - Kubernetes-ready with auto-scaling
  - MongoDB Atlas for database
  - Socket.IO for real-time communication

- **Scalability**
  - Horizontal Pod Autoscaler (HPA) configuration
  - Auto-scales based on CPU and memory usage
  - Handles variable concurrent users efficiently

- **High Availability**
  - Health checks and liveness probes
  - Automatic failover
  - Session persistence with reconnection logic

## 🏗️ Architecture

```
┌─────────────────┐
│   Frontend      │  React + Vite + TailwindCSS
│   (Nginx)       │  Socket.IO Client
└────────┬────────┘
         │
         ├─── HTTP/REST ───┐
         │                 │
         └─── WebSocket ───┤
                          │
                   ┌──────▼──────┐
                   │   Backend   │  Node.js + Express
                   │  Socket.IO  │  JWT Auth
                   └──────┬──────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
    ┌────▼────┐    ┌─────▼─────┐   ┌─────▼─────┐
    │  Auth   │    │Matchmaking│   │   Game    │
    │ Service │    │  Service  │   │  Logic    │
    └─────────┘    └───────────┘   └───────────┘
                          │
                   ┌──────▼──────┐
                   │  MongoDB    │  User Data
                   │   Atlas     │  Game Rooms
                   └─────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (or local MongoDB)
- npm or yarn

### Local Development Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd CloudForge-main
```

2. **Backend Setup**
```bash
cd backend

# Install dependencies
npm install

# Create .env file (already exists)
# Make sure it contains:
# MONGODB_URI=mongodb+srv://adityaparecha23cse_db_user:nfk676swX9TQIAOb@cluster0.fakvo84.mongodb.net/cloudplay?appName=Cluster0
# PORT=5000
# JWT_SECRET=your-secret-key-here
# NODE_ENV=development
# CLIENT_URL=http://localhost:5173

# Start development server
npm run dev
```

3. **Frontend Setup**
```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file (optional, defaults work for local dev)
# VITE_API_URL=http://localhost:5000/api
# VITE_SOCKET_URL=http://localhost:5000

# Start development server
npm run dev
```

4. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## 🐳 Docker Deployment

### Using Docker Compose (Recommended for Development)

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Docker Build

**Backend:**
```bash
cd backend
docker build -t cloudplay-backend .
docker run -p 5000:5000 \
  -e MONGODB_URI="your-mongodb-uri" \
  -e JWT_SECRET="your-secret" \
  cloudplay-backend
```

**Frontend:**
```bash
cd frontend
docker build -t cloudplay-frontend .
docker run -p 80:80 cloudplay-frontend
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (EKS, GKE, AKS, or local minikube)
- kubectl configured
- Docker images pushed to a registry

### Deployment Steps

1. **Create Secrets**
```bash
# Update k8s/secrets.yaml with your actual values
kubectl apply -f k8s/secrets.yaml
```

2. **Deploy Backend**
```bash
kubectl apply -f k8s/backend-deployment.yaml
```

3. **Deploy Frontend**
```bash
kubectl apply -f k8s/frontend-deployment.yaml
```

4. **Verify Deployment**
```bash
# Check pods
kubectl get pods

# Check services
kubectl get services

# Check HPA
kubectl get hpa
```

5. **Access the Application**
```bash
# Get the external IP
kubectl get service cloudplay-frontend

# Access via the external IP or LoadBalancer URL
```

### Auto-Scaling Configuration

The platform includes Horizontal Pod Autoscaler (HPA) that automatically scales based on:
- **Backend**: 2-10 replicas (CPU: 70%, Memory: 80%)
- **Frontend**: 2-5 replicas (CPU: 70%)

## 📁 Project Structure

```
CloudForge-main/
├── backend/
│   ├── controllers/          # Request handlers
│   │   └── authController.js
│   ├── middleware/           # Express middleware
│   │   └── auth.js
│   ├── models/              # MongoDB schemas
│   │   ├── User.js
│   │   └── GameRoom.js
│   ├── routes/              # API routes
│   │   └── auth.js
│   ├── services/            # Business logic
│   │   ├── matchmakingService.js
│   │   └── gameLogic/
│   │       ├── ticTacToeLogic.js
│   │       ├── connect4Logic.js
│   │       ├── ludoLogic.js
│   │       └── tambolaLogic.js
│   ├── socket/              # Socket.IO handlers
│   │   └── gameHandler.js
│   ├── server/
│   │   └── index.js         # Main server file
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── auth/
│   │   │   ├── game/
│   │   │   ├── games/
│   │   │   ├── home/
│   │   │   ├── profile/
│   │   │   └── ui/          # shadcn/ui components
│   │   ├── contexts/        # React contexts
│   │   │   ├── auth-context.jsx
│   │   │   └── realtime-context.jsx
│   │   ├── services/        # API services
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── k8s/                     # Kubernetes configs
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── secrets.yaml
│
└── docker-compose.yml
```

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/guest` - Login as guest
- `GET /api/auth/me` - Get current user (protected)
- `PUT /api/auth/profile` - Update profile (protected)

### Health & Status
- `GET /` - API info
- `GET /health` - Health check

## 🔌 Socket.IO Events

### Client → Server
- `authenticate` - Authenticate user with socket
- `createRoom` - Create private game room
- `joinRoom` - Join room with code
- `leaveRoom` - Leave current room
- `toggleReady` - Toggle ready status
- `startGame` - Start game (host only)
- `joinQueue` - Join matchmaking queue
- `leaveQueue` - Leave matchmaking queue
- `gameMove` - Make a game move

### Server → Client
- `authenticated` - Authentication successful
- `roomCreated` - Room created successfully
- `roomJoined` - Joined room successfully
- `playerJoined` - Another player joined
- `playerLeft` - Player left room
- `playerReadyChanged` - Player ready status changed
- `gameStarted` - Game has started
- `matchFound` - Match found in queue
- `gameStateUpdated` - Game state changed
- `gameOver` - Game finished
- `playerReconnecting` - Player disconnected, reconnecting
- `playerDisconnected` - Player permanently disconnected
- `error` - Error occurred

## 🎮 Game Logic

### Tic Tac Toe
- 3x3 grid
- Win: 3 in a row (horizontal, vertical, or diagonal)
- Coins: Winner gets 100, Draw gets 25

### Connect 4
- 6x7 grid
- Win: 4 in a row (horizontal, vertical, or diagonal)
- Coins: Winner gets 150, Draw gets 30

### Ludo (Simplified)
- 4 tokens per player
- Roll dice to move
- Need 6 to start
- Coins: Winner gets 200, 25 per token finished

### Tambola
- 3x9 ticket with 15 numbers
- Auto-mark called numbers
- Prizes: Top/Middle/Bottom line (50 each), Full House (150)

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Input validation
- Rate limiting (recommended for production)
- Secure WebSocket connections

## 🌐 Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cloudplay
PORT=5000
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 📊 Monitoring & Scaling

### Health Checks
- Backend: `GET /health`
- Frontend: `GET /health`

### Metrics to Monitor
- Active WebSocket connections
- Game rooms count
- User registrations
- API response times
- Database query performance

### Scaling Triggers
- CPU usage > 70%
- Memory usage > 80%
- Active connections > threshold

## 🚧 Future Enhancements

- [ ] Leaderboard system
- [ ] Friend system
- [ ] Chat functionality in games
- [ ] More games (Chess, Checkers, etc.)
- [ ] Tournament mode
- [ ] Spectator mode
- [ ] Game replays
- [ ] Mobile app (React Native)
- [ ] Redis for session management
- [ ] Prometheus metrics
- [ ] Grafana dashboards

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Team

Developed as a cloud-based gaming platform demonstrating:
- Microservices architecture
- Real-time communication
- Cloud-native deployment
- Scalable infrastructure

## 🆘 Troubleshooting

### Backend won't start
- Check MongoDB connection string
- Ensure all dependencies are installed: `npm install`
- Verify .env file exists with correct values

### Frontend can't connect to backend
- Check VITE_API_URL and VITE_SOCKET_URL
- Ensure backend is running on correct port
- Check CORS settings

### Socket.IO connection issues
- Verify WebSocket support in browser
- Check firewall/proxy settings
- Ensure backend Socket.IO is running

### Kubernetes pods not starting
- Check secrets are created: `kubectl get secrets`
- Verify image names and registry
- Check pod logs: `kubectl logs <pod-name>`

## 📞 Support

For issues and questions:
- Create an issue on GitHub
- Check existing documentation
- Review logs for error messages

---

**Built with ❤️ using Node.js, React, MongoDB, Socket.IO, Docker, and Kubernetes**
