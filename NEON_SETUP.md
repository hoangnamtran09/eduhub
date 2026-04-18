dât# Hướng dẫn sử dụng Neon Database

## 1. Tạo tài khoản Neon

1. Truy cập [Neon Console](https://neon.tech)
2. Đăng ký tài khoản (dùng GitHub hoặc email)
3. Sau khi đăng nhập, click **Create a project**

### Tạo Project mới:
- **Project Name:** eduhub
- **Database Name:** eduhub_db
- **Region:** Chọn region gần nhất (Singapore hoặc Tokyo)
- Click **Create Project**

## 2. Lấy Connection String

Sau khi tạo project, bạn sẽ thấy connection string:

```
postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/eduhub?sslmode=require
```

### Cách lấy:
1. Trong Neon Dashboard, chọn project của bạn
2. Click tab **Connection Details**
3. Copy connection string

## 3. Cấu hình trong dự án

### Tạo file `.env.local`:
```bash
cd eduhub
cp .env.example .env.local
```

### Sửa `.env.local`:
```env
# Database - Lấy từ Neon Dashboard
DATABASE_URL=postgresql://username:password@host/dbname?sslmode=require

# OpenAI - Tạo key tại https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# JWT Secret - Tạo secret ngẫu nhiên
JWT_SECRET=your-super-secret-key-min-32-chars

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. Setup Database Schema

### Chạy Prisma commands:
```bash
# Generate Prisma Client
npx prisma generate

# Push schema lên Neon
npx prisma db push
```

## 5. Kiểm tra kết nối

### Tạo file test:
```typescript
// src/lib/neon/test.ts
import { sql } from '@/lib/neon/client';

export async function testConnection() {
  try {
    const result = await sql`SELECT version()`;
    console.log('Connected to:', result[0].version);
    return true;
  } catch (error) {
    console.error('Connection failed:', error);
    return false;
  }
}
```

### Hoặc dùng psql:
```bash
# Cài đặt psql nếu chưa có
brew install postgresql

# Kết nối trực tiếp
psql "postgresql://username:password@host/dbname?sslmode=require"

# Kiểm tra tables
\dt
```

## 6. Schema cho EduHub

File `prisma/schema.prisma` đã được cấu hình sẵn với các bảng:
- User, StudentProfile
- Subject, Course, Chapter, Lesson
- Quiz, QuizQuestion, QuizAttempt
- AIConversation, AIMessage
- Progress tracking

## 7. Tiếp tục phát triển

### Auth với JWT:
Đã tích hợp jose library cho JWT authentication:
- Sign in `/src/lib/auth/sign.ts`
- Verify token `/src/lib/auth/verify.ts`

### API Routes:
Tạo API routes trong `/src/app/api/`:
```typescript
// src/app/api/courses/route.ts
import { sql } from '@/lib/neon/client';

export async function GET() {
  const courses = await sql`
    SELECT * FROM courses WHERE is_published = true
  `;
  return Response.json(courses);
}
```

## 8. Troubleshooting

### Lỗi kết nối SSL:
```env
DATABASE_URL=postgresql://.../?sslmode=require
```

### Lỗi connection timeout:
- Kiểm tra firewall
- Đảm bảo IP của bạn được allow trong Neon settings

### Kiểm tra quota:
- Neon free tier: 0.5 GB storage, 20 connections
- Theo dõi usage trong Dashboard

## 9. Deploy

### Vercel:
1. Connect repo với Vercel
2. Add Environment Variables trong Vercel Dashboard
3. Deploy

### Các biến cần thiết trên Vercel:
- `DATABASE_URL`
- `OPENAI_API_KEY`
- `JWT_SECRET`
