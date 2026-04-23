# EduHub - Hệ thống Quản lý Học tập

Một nền tảng quản lý học tập hiện đại được xây dựng bằng Next.js 14 với TypeScript, Prisma và Tailwind CSS.

## 🚀 Tính năng

- **Quản lý khóa học**: Tạo, chỉnh sửa và quản lý các khóa học trực tuyến
- **Hệ thống bài học**: Tổ chức bài học theo từng môn học
- **Tích hợp AI**: Hỗ trợ chatbot AI để hỗ trợ học tập
- **Xem và upload PDF**: Hỗ trợ tải lên và xem tài liệu PDF
- **Theo dõi tiến độ**: Theo dõi quá trình học tập của học sinh
- **Giao diện người dùng**: Thiết kế responsive và thân thiện

## 🛠️ Công nghệ sử dụng

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon)
- **AI Integration**: OpenAI GPT
- **Authentication**: Supabase

## 📦 Cài đặt

```bash
# Clone repository
git clone https://github.com/hoangnamtran09/eduhub.git
cd eduhub

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Setup database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

## ⚙️ Cấu hình môi trường

Tạo file `.env.local` với các biến môi trường sau:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Beeknoee (PDF processing)
BEKNOEE_API_KEY=your_beeknoee_api_key
```

## Deploy

Kiến trúc phù hợp với codebase hiện tại:

- `backend/` FastAPI deploy trên Railway
- app Next.js hiện tại nên deploy trên nền tảng hỗ trợ Node server runtime đầy đủ

Lý do: repo này có nhiều `src/app/api/*` route dùng `Prisma`, `fs`, `path`, `Buffer` và ghi file vào `public/`, nên không phù hợp để đưa nguyên app lên Cloudflare Pages runtime theo mô hình Workers.

### Railway cho backend FastAPI

Thư mục backend đã có sẵn:

- `backend/Dockerfile`
- `backend/requirements.txt`
- `backend/railway.json`
- `backend/.env.example`

Thiết lập trên Railway:

1. Tạo service mới từ GitHub repo này.
2. Đặt `Root Directory` là `backend`.
3. Railway sẽ build bằng `Dockerfile` có sẵn.
4. Thêm các biến môi trường theo `backend/.env.example`.
5. Đặt `ALLOWED_ORIGINS` thành domain frontend production của bạn.

Ví dụ:

```env
PROJECT_NAME=EduHub AI Backend
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
BEEKNOEE_API_KEY=your_ai_provider_api_key
BEEKNOEE_BASE_URL=https://api.krouter.net/v1
TAVILY_API_KEY=your_tavily_api_key
ALLOWED_ORIGINS=https://app.yourdomain.com
```

Sau khi deploy, kiểm tra:

```bash
curl https://your-railway-domain.up.railway.app/health
```

### Frontend app

Frontend cần có biến môi trường:

```env
NEXT_PUBLIC_BACKEND_URL=https://your-railway-domain.up.railway.app
```

Route `src/app/api/upload-pdf/route.ts` hiện đã yêu cầu biến này phải tồn tại để tránh âm thầm fallback về `localhost` khi chạy production.

### Nếu vẫn bắt buộc dùng Cloudflare

Cloudflare nên đặt ở lớp CDN/domain/proxy cho frontend hoặc static assets. Với codebase hiện tại, không nên deploy toàn bộ app Next.js hiện tại lên Cloudflare Pages nếu chưa tách các API route Node-only ra khỏi app hoặc chuyển chúng sang backend riêng.

## 📁 Cấu trúc dự án

```
├── src/
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   ├── lib/          # Utilities và API clients
│   ├── stores/       # State management
│   └── types/        # TypeScript types
├── prisma/           # Database schema
└── public/           # Static files
```

## 📝 License

MIT License
