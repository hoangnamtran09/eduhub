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