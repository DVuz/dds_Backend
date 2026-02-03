# Deploy to Koyeb - Step by Step Guide

## ⚠️ TRƯỚC KHI DEPLOY - BẮT BUỘC

### 1. Đổi tất cả secrets (đã bị leak trên Git)

```bash
# Truy cập các service và tạo credentials mới:

# Aiven MySQL - Rotate password
https://console.aiven.io

# JWT Secrets - Tạo random strong keys
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Email - Tạo App Password mới
https://myaccount.google.com/apppasswords

# Cloudinary - Rotate API Secret
https://console.cloudinary.com/settings/security

# Redis - Rotate password (nếu có thể)
https://app.redislabs.com
```

## 🚀 DEPLOY STEPS

### Option 1: Deploy từ GitHub (Recommended)

1. **Push code lên GitHub**

   ```bash
   git add .
   git commit -m "feat: add Koyeb deployment configs"
   git push origin main
   ```

2. **Truy cập Koyeb Dashboard**
   - Vào https://app.koyeb.com
   - Click "Create App"
   - Chọn "GitHub" deployment

3. **Configure Deployment**
   - **Repository**: chọn repo của bạn
   - **Branch**: main
   - **Build method**:
     - Auto-detect (Koyeb sẽ phát hiện Node.js)
     - Hoặc chọn "Dockerfile" nếu muốn dùng Docker
   - **Build command**: `npm install` (auto)
   - **Run command**: `npm start` (auto)

4. **Environment Variables** (Quan trọng!)
   Thêm TẤT CẢ các biến trong `.env.example`:

   ```
   NODE_ENV=production
   PORT=8000
   DB_HOST=<your-new-db-host>
   DB_PASSWORD=<your-new-password>
   JWT_SECRET=<new-strong-secret>
   JWT_REFRESH_SECRET=<new-strong-secret>
   ... (copy từ .env.example và điền giá trị MỚI)
   ```

5. **Health Check**
   - Path: `/health`
   - Port: `8000` (hoặc để trống, Koyeb auto-detect)
   - Initial delay: `10s`

6. **Deploy!**
   - Click "Deploy"
   - Đợi ~3-5 phút build
   - Kiểm tra logs nếu có lỗi

### Option 2: Deploy bằng Docker

```bash
# Build local để test
docker build -t backend-api .

# Run local test
docker run -p 3000:3000 --env-file .env backend-api

# Test health check
curl http://localhost:3000/health
```

Sau đó deploy lên Koyeb như Option 1, chọn "Dockerfile" build method.

## 🔍 KIỂM TRA SAU KHI DEPLOY

### 1. Health Check

```bash
curl https://your-app.koyeb.app/health
```

Expected response:

```json
{
  "success": true,
  "message": "Server is running!",
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-04T..."
  }
}
```

### 2. Test API Endpoints

```bash
# Test product API
curl https://your-app.koyeb.app/api/products

# Test category API
curl https://your-app.koyeb.app/api/categories
```

### 3. Check Logs

- Vào Koyeb Dashboard → App → Logs
- Tìm dòng: `✅ Database connection established successfully`
- Tìm dòng: `🚀 Server is running on http://0.0.0.0:8000`

## 🐛 TROUBLESHOOTING

### Lỗi: Database connection failed

```
⚠️  Database connection attempt 1/5 failed: connect ETIMEDOUT
```

**Fix**:

- Kiểm tra DB_HOST, DB_PORT, DB_PASSWORD đúng chưa
- Kiểm tra Aiven firewall rules (allow all IPs hoặc Koyeb IPs)

### Lỗi: Application failed to start

**Fix**:

- Check logs trên Koyeb Dashboard
- Kiểm tra environment variables đã set đủ chưa
- Test build locally: `npm install && npm start`

### Lỗi: Cloudinary upload failed

**Fix**:

- Kiểm tra CLOUDINARY_NAME, API_KEY, API_SECRET
- Test credentials: https://console.cloudinary.com

### Lỗi: Redis connection failed

**Fix**:

- Kiểm tra REDIS_HOST, REDIS_PORT, REDIS_PASSWORD
- Redis có thể optional, code của bạn cần handle gracefully nếu Redis down

## 📊 PERFORMANCE TUNING

### Auto-scaling (Koyeb feature)

- Min instances: 1
- Max instances: 3
- Auto-scale based on CPU/Memory

### Database Connection Pool

Đã config trong `config/database.js`:

- connectionLimit: 10
- maxIdle: 10
- idleTimeout: 60000

## 🔒 SECURITY CHECKLIST

- [x] Dockerfile runs as non-root user
- [x] Rate limiting enabled
- [x] Helmet security headers
- [x] CORS configured
- [ ] Rotate tất cả secrets
- [ ] Enable Koyeb SSL (auto)
- [ ] Set CORS_ORIGIN to frontend URL only
- [ ] Monitor logs for suspicious activity

## 💰 COST ESTIMATE (Koyeb)

**Hobby Plan** (FREE):

- 1 service
- Shared CPU
- 512MB RAM
- 2GB storage
- Good for development/testing

**Starter Plan** (~$5-10/month):

- Dedicated resources
- Auto-scaling
- Better performance
- Recommended for production

## 📞 SUPPORT

Nếu gặp vấn đề:

1. Check Koyeb logs
2. Check application logs: `logger` outputs
3. Koyeb Discord: https://discord.gg/koyeb
4. Koyeb Docs: https://www.koyeb.com/docs
