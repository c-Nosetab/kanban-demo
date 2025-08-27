# Deployment Guide

This guide covers deploying the Kanban demo application using different methods.

## 🐳 Docker Deployment

### Local Development with Docker Compose

```bash
# Build and run locally
docker-compose up --build

# Access the application
# Frontend: http://localhost:8080
# Backend API: http://localhost:8080/api/
```

### Production Docker Build

```bash
# Build the production image
docker build -t kanban-demo:latest .

# Run the container
docker run -p 8080:80 kanban-demo:latest

# Or with environment variables
docker run -p 8080:80 \
  -e NODE_ENV=production \
  -e FRONTEND_ORIGIN=http://your-domain.com \
  kanban-demo:latest
```

## ☸️ Kubernetes Deployment

### Prerequisites
- Kubernetes cluster (local: minikube, kind, or cloud provider)
- kubectl configured

### Deploy to Kubernetes

```bash
# Apply the deployment
kubectl apply -f k8s/deployment.yaml

# Check deployment status
kubectl get pods
kubectl get services

# Get the external IP (if using LoadBalancer)
kubectl get service kanban-demo-service
```

### Access the Application
- If using LoadBalancer: Use the external IP from the service
- If using NodePort: Use `http://<node-ip>:<node-port>`
- If using minikube: `minikube service kanban-demo-service`

## 🚀 Platform-as-a-Service Options

### Railway (Recommended for Demo)

1. **Connect Repository**: Link your GitHub repo to Railway
2. **Auto-Deploy**: Railway will detect the Dockerfile and deploy automatically
3. **Environment Variables**: Set in Railway dashboard:
   ```
   NODE_ENV=production
   FRONTEND_ORIGIN=https://your-app.railway.app
   ```

### Render

1. **Create Web Service**: Connect your GitHub repository
2. **Build Command**: `docker build -t kanban-demo .`
3. **Start Command**: `docker run -p $PORT:80 kanban-demo`
4. **Environment Variables**: Set in Render dashboard

### Heroku

1. **Create App**: `heroku create your-kanban-demo`
2. **Add Container Registry**: `heroku container:login`
3. **Build and Push**:
   ```bash
   docker build -t registry.heroku.com/your-kanban-demo/web .
   docker push registry.heroku.com/your-kanban-demo/web
   ```
4. **Release**: `heroku container:release web`

## 🔧 Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment mode | `development` | No |
| `FRONTEND_ORIGIN` | Frontend URL for CORS | `http://localhost:4200` | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` (15min) | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | `100` | No |
| `PORT` | Backend port | `3000` | No |

## 📊 Health Checks

The application includes health check endpoints:

- **Frontend Health**: `GET /health` (served by nginx)
- **Backend Health**: `GET /api/health` (if implemented)

## 🔍 Monitoring

### Logs
```bash
# Docker logs
docker logs <container-id>

# Kubernetes logs
kubectl logs -f deployment/kanban-demo

# Nginx logs (if mounted)
tail -f logs/access.log
tail -f logs/error.log
```

### Metrics
- **Resource Usage**: Monitor CPU/Memory in Kubernetes dashboard
- **Response Times**: Check nginx access logs
- **Error Rates**: Monitor error logs

## 🛠️ Troubleshooting

### Common Issues

1. **Frontend not loading**
   - Check nginx configuration
   - Verify Angular build output exists

2. **API calls failing**
   - Check CORS configuration
   - Verify backend is running on port 3000
   - Check nginx proxy configuration

3. **Container won't start**
   - Check Docker logs: `docker logs <container-id>`
   - Verify all required files are copied
   - Check start.sh permissions

### Debug Commands

```bash
# Enter running container
docker exec -it <container-id> sh

# Check nginx status
docker exec <container-id> nginx -t

# Check backend logs
docker exec <container-id> ps aux | grep node

# Test API directly
curl http://localhost:3000/api/tasks
```

## 🔄 CI/CD Pipeline

### GitHub Actions Example

```yaml
name: Deploy to Railway
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        uses: railway/deploy@v1
        with:
          service: your-service-name
```

## 📝 Notes

- The application runs on **port 80** (nginx) and **port 3000** (backend)
- Frontend is served by nginx, API calls are proxied to the backend
- Single container architecture for simplicity
- Suitable for demo/portfolio applications with low traffic
