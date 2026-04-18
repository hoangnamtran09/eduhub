# EduHub LMS - Technical Specification

## 1. Concept & Vision

EduHub là nền tảng học tập thông minh với AI, được thiết kế để cá nhân hóa trải nghiệm học cho học sinh THCS/THPT. Khác với các platform học trực tuyến truyền thống, EduHub không chỉ cung cấp nội dung mà còn đóng vai trò "trợ giảng AI" - theo dõi tiến độ, chẩn đoán điểm yếu, và gợi ý lộ trình học phù hợp với từng học sinh.

**Personality:** Thân thiện, động lực, rõ ràng. Mỗi học sinh thấy được "ngày mai học gì" và "mình đã tiến bộ thế nào".

---

## 2. Design Language

### Aesthetic Direction
Inspiration: Notion meets Duolingo - clean, functional with gamification elements. Sử dụng card-based layout với progressive disclosure.

### Color Palette
```
Primary:        #6366F1 (Indigo 500 - thông minh, tập trung)
Secondary:      #8B5CF6 (Violet 500 - sáng tạo)
Accent Success: #10B981 (Emerald 500 - hoàn thành, đúng)
Accent Warning: #F59E0B (Amber 500 - cần chú ý)
Accent Error:   #EF4444 (Red 500 - lỗi sai)
Background:     #F8FAFC (Slate 50)
Surface:        #FFFFFF
Text Primary:   #1E293B (Slate 800)
Text Secondary: #64748B (Slate 500)
Border:         #E2E8F0 (Slate 200)
```

### Typography
- **Headings:** Inter (700, 600)
- **Body:** Inter (400, 500)
- **Mono:** JetBrains Mono (code snippets)
- Scale: 12/14/16/18/20/24/30/36/48px

### Spatial System
- Base unit: 4px
- Spacing scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
- Card padding: 24px
- Section gap: 32px
- Border radius: 8px (cards), 6px (buttons), 12px (modals)

### Motion Philosophy
- **Page transitions:** Fade + subtle slide (200ms ease-out)
- **Card interactions:** Scale 1.02 on hover (150ms)
- **Progress updates:** Number counting animation (400ms)
- **AI responses:** Typewriter effect for chat (40ms/char)
- **Success states:** Confetti burst for milestones

### Visual Assets
- **Icons:** Lucide React (consistent stroke width)
- **Illustrations:** Custom SVG for empty states
- **Avatars:** Generated initials with gradient backgrounds
- **Charts:** Recharts with theme colors

---

## 3. Layout & Structure

### Page Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo | Nav | Search | Notifications | Profile  │
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  Sidebar   │           Main Content Area                │
│  (240px)   │           (fluid)                          │
│            │                                            │
│  - Dashboard│                                           │
│  - Courses │                                           │
│  - Progress│                                           │
│  - AI Tutor│                                           │
│  - Settings│                                           │
│            │                                            │
├────────────┴────────────────────────────────────────────┤
│  Footer: Links | Support | Version                      │
└─────────────────────────────────────────────────────────┘
```

### Key Pages

1. **Dashboard (`/`)** - Single source of truth
   - Today's learning goal
   - Weekly streak counter
   - Weak areas needing attention
   - Recommended next lessons
   - Recent activity timeline

2. **Courses (`/courses`)** - Subject browser
   - Subject cards (Math, English, Physics...)
   - Progress rings per subject
   - Filter by grade level

3. **Course Detail (`/courses/[slug]`)** 
   - Course header with progress
   - Chapter list with completion status
   - AI Tutor quick access

4. **Lesson (`/lessons/[id]`)** - Core learning
   - Theory section (markdown)
   - Examples with step-by-step
   - Quick quiz checkpoint
   - AI Tutor sidebar (collapsible)

5. **Quiz (`/quizzes/[id]`)** - Assessment
   - Question card with progress bar
   - Timer (optional)
   - Immediate feedback mode
   - Review answers after completion

6. **AI Tutor (`/tutor`)** - Conversational learning
   - Chat interface with context
   - Conversation history per lesson
   - Suggested prompts

7. **Progress (`/progress`)** - Analytics
   - Overall mastery chart
   - Time spent graph
   - Strengths/weaknesses radar
   - Achievement badges

8. **Onboarding (`/onboarding`)** - New user flow
   - Step 1: Profile setup
   - Step 2: Grade & subjects
   - Step 3: Diagnostic quiz
   - Step 4: Goal setting

### Responsive Strategy
- **Desktop (1280px+):** Full sidebar + content
- **Tablet (768-1279px):** Collapsible sidebar
- **Mobile (<768px):** Bottom nav + full content

---

## 4. Features & Interactions

### MVP Features

#### F1: Authentication
- **Register:** Email + password, email verification
- **Login:** Email + password, "Remember me"
- **OAuth:** Google Sign-in
- **Password Reset:** Email-based reset flow
- **Profile:** Avatar, name, grade level, subjects

#### F2: Student Profile
- Fields: display_name, grade_level (6-12), subjects[], goals, strengths[], weaknesses[]
- Editable via `/settings/profile`
- Affects AI Tutor responses and content difficulty

#### F3: Course Browser
- Grid of subject cards
- Each shows: title, description, lesson count, progress %
- Click → Course detail page

#### F4: Lesson Viewer
- Markdown-rendered content
- Code blocks with syntax highlighting
- Image support
- Progress auto-saved on scroll

#### F5: Quiz System
- Multiple choice questions
- Instant feedback (correct/incorrect)
- Explanation shown after answering
- Score summary at end
- Retry capability

#### F6: AI Tutor
- Context-aware chat (knows current lesson)
- Socratic prompting (asks before answering)
- Step-by-step explanations
- Adapts to student's grade level
- Conversation history stored per lesson

#### F7: Progress Tracking
- Lessons completed counter
- Quiz scores over time
- Time spent learning
- Streak tracking
- Weak topics identification

#### F8: Recommendations
- "Next lesson" based on completion
- "Review this" for failed quiz topics
- "Keep going" for streak maintenance

### Interaction Details

| Action | Response |
|--------|----------|
| Click lesson | Navigate to lesson, start timer |
| Complete quiz | Update progress, show confetti, suggest next |
| Ask AI a question | Stream response, save to history |
| Hover course card | Lift shadow, show "Continue" button |
| Click streak | Show calendar heatmap |
| Submit wrong answer | Shake animation, show hint |

### Edge Cases

- **Empty states:** Custom illustrations + CTA buttons
- **Loading:** Skeleton screens matching content shape
- **Errors:** Toast notifications with retry option
- **Offline:** Show cached content with "Reconnect" banner
- **AI timeout:** "Taking longer than expected" + retry button

---

## 5. Component Inventory

### Layout Components

#### `Sidebar`
- States: expanded (240px), collapsed (64px), hidden (mobile)
- Contains: logo, nav items with icons, user quick info
- Active item: indigo background, bold text

#### `Header`
- Contains: search input, notification bell (badge count), user avatar dropdown
- Sticky on scroll
- Mobile: hamburger menu

#### `PageContainer`
- Max-width: 1280px, centered
- Padding: 32px desktop, 16px mobile

### Content Components

#### `CourseCard`
- Props: course (object), progress (number)
- States: default, hover (elevated), locked (grayed)
- Shows: thumbnail, title, lesson count, progress ring

#### `LessonCard`
- Props: lesson (object), status (locked|available|completed)
- Shows: number, title, duration, completion icon

#### `QuizQuestion`
- Props: question, options, selected, showFeedback
- States: unanswered, selected, correct, incorrect
- Animations: selection pulse, feedback slide-in

#### `AIChatBubble`
- Props: message, isUser, timestamp
- Types: text, code, math, suggestions
- AI bubbles: avatar + typing indicator

#### `ProgressRing`
- Props: percentage, size, strokeWidth
- Animated fill on mount
- Center shows number or icon

#### `StreakBadge`
- Props: days, currentDay
- Shows: flame icon, day count
- Animation: flame flicker on hover

### Form Components

#### `Input`
- States: default, focus, error, disabled
- Shows: label, helper text, error message

#### `Button`
- Variants: primary, secondary, ghost, danger
- States: default, hover, active, loading, disabled
- Sizes: sm, md, lg

#### `Select`
- Custom styled dropdown
- Search functionality for long lists
- Multi-select for subjects

---

## 6. Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                  │
│  App Router │ Server Components │ Client Components    │
├─────────────────────────────────────────────────────────┤
│                    API Layer (Route Handlers)           │
│  /api/auth │ /api/courses │ /api/lessons │ /api/ai      │
├─────────────────────────────────────────────────────────┤
│                  Supabase (PostgreSQL)                  │
│  Auth │ Database │ Storage │ Realtime │ Vector Search   │
├─────────────────────────────────────────────────────────┤
│                    AI Service                           │
│  OpenAI Responses API │ Structured Outputs             │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14+ (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Components | shadcn/ui base + custom |
| Database | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| ORM | Prisma |
| AI | OpenAI Responses API |
| State | Zustand (client) |
| Charts | Recharts |
| Icons | Lucide React |

### Data Model (Prisma Schema)

```prisma
model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String?
  fullName      String?
  avatarUrl     String?
  gradeLevel    Int?     // 6-12
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  profile       StudentProfile?
  enrollments   Enrollment[]
  progress      LessonProgress[]
  quizAttempts  QuizAttempt[]
  aiConversations AICo[]
}

model StudentProfile {
  id          String   @id @default(cuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  goals       String[]
  strengths   String[]
  weaknesses  String[]
  streakDays  Int      @default(0)
  lastActive  DateTime?
}

model Subject {
  id          String   @id @default(cuid())
  name        String   // Toán, Tiếng Anh, Vật Lý...
  slug        String   @unique
  description String?
  icon        String?
  color       String?
  courses     Course[]
}

model Course {
  id          String   @id @default(cuid())
  subjectId   String
  subject     Subject  @relation(fields: [subjectId], references: [id])
  title       String
  slug        String   @unique
  description String?
  thumbnail   String?
  gradeLevel  Int
  isPublished Boolean  @default(false)
  createdAt   DateTime @default(now())
  
  chapters    Chapter[]
  enrollments Enrollment[]
}

model Chapter {
  id      String   @id @default(cuid())
  courseId String
  course   Course   @relation(fields: [courseId], references: [id])
  title    String
  order    Int
  
  lessons  Lesson[]
}

model Lesson {
  id          String   @id @default(cuid())
  chapterId   String
  chapter     Chapter  @relation(fields: [chapterId], references: [id])
  title       String
  content     String   @db.Text // Markdown
  videoUrl    String?
  order       Int
  duration    Int?     // minutes
  
  quizzes     Quiz[]
  progress    LessonProgress[]
  aiConversations AICo[]
}

model Quiz {
  id        String   @id @default(cuid())
  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id])
  title     String?
  questions QuizQuestion[]
  attempts  QuizAttempt[]
}

model QuizQuestion {
  id           String   @id @default(cuid())
  quizId       String
  quiz         Quiz     @relation(fields: [quizId], references: [id])
  question     String   @db.Text
  options      Json     // [{text, isCorrect}]
  explanation  String?  @db.Text
  order        Int
}

model QuizAttempt {
  id        String   @id @default(cuid())
  quizId    String
  quiz      Quiz     @relation(fields: [quizId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  score     Int
  answers   Json     // [{questionId, selectedOption, isCorrect}]
  startedAt DateTime @default(now())
  completedAt DateTime?
}

model LessonProgress {
  id        String   @id @default(cuid())
  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  completed Boolean  @default(false)
  completedAt DateTime?
  
  @@unique([lessonId, userId])
}

model Enrollment {
  id        String   @id @default(cuid())
  courseId  String
  course    Course   @relation(fields: [courseId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  enrolledAt DateTime @default(now())
  
  @@unique([courseId, userId])
}

model AICo {
  id        String   @id @default(cuid())
  lessonId  String?
  lesson    Lesson?  @relation(fields: [lessonId], references: [id])
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  messages  AIMessage[]
  createdAt DateTime @default(now())
}

model AIMessage {
  id        String   @id @default(cuid())
  conversationId String
  conversation AICo   @relation(fields: [conversationId], references: [id])
  role      String   // "user" | "assistant"
  content   String   @db.Text
  createdAt DateTime @default(now())
}
```

### API Endpoints

```
Auth:
  POST   /api/auth/register     - Create account
  POST   /api/auth/login       - Login
  POST   /api/auth/logout      - Logout
  GET    /api/auth/me          - Get current user
  POST   /api/auth/reset       - Reset password

Profile:
  GET    /api/profile          - Get profile
  PUT    /api/profile          - Update profile

Subjects:
  GET    /api/subjects         - List all subjects

Courses:
  GET    /api/courses          - List courses (with filters)
  GET    /api/courses/[slug]   - Get course detail
  POST   /api/courses/[slug]/enroll - Enroll in course

Lessons:
  GET    /api/lessons/[id]     - Get lesson content
  POST   /api/lessons/[id]/progress - Mark lesson complete

Quizzes:
  GET    /api/quizzes/[id]     - Get quiz with questions
  POST   /api/quizzes/[id]/attempt - Submit quiz attempt

AI Tutor:
  POST   /api/ai/chat          - Send message to AI
  GET    /api/ai/history/[lessonId] - Get conversation history

Progress:
  GET    /api/progress         - Get overall progress
  GET    /api/progress/[courseSlug] - Get course progress
```

### AI Prompt Strategy

```typescript
// Tutor Profile - for AI responses
const TUTOR_PROMPT = `Bạn là Gia Sư AI của EduHub, một nền tảng học tập cho học sinh Việt Nam.
Bạn đang hỗ trợ học sinh lớp {gradeLevel} học môn {subject}.
Nguyên tắc:
1. Giải thích bằng ngôn ngữ phù hợp với lứa tuổi
2. Ưu tiên gợi mở, hỏi lại trước khi đưa đáp án
3. Chia nhỏ bài toán thành từng bước
4. Sử dụng ví dụ gần gũi với cuộc sống hàng ngày
5. Không bịa đặt kiến thức - nếu không chắc, nói rõ
6. Không đưa đáp án ngay trong chế độ luyện tập`;
```

---

## 7. File Structure

```
eduhub/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx (dashboard)
│   │   │   ├── courses/page.tsx
│   │   │   ├── courses/[slug]/page.tsx
│   │   │   ├── lessons/[id]/page.tsx
│   │   │   ├── quizzes/[id]/page.tsx
│   │   │   ├── progress/page.tsx
│   │   │   ├── tutor/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── onboarding/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...auth]/route.ts
│   │   │   ├── courses/route.ts
│   │   │   ├── lessons/[id]/route.ts
│   │   │   ├── ai/chat/route.ts
│   │   │   └── ...
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── page-container.tsx
│   │   ├── courses/
│   │   │   ├── course-card.tsx
│   │   │   ├── course-list.tsx
│   │   │   └── chapter-list.tsx
│   │   ├── lessons/
│   │   │   ├── lesson-content.tsx
│   │   │   ├── lesson-card.tsx
│   │   │   └── lesson-sidebar.tsx
│   │   ├── quizzes/
│   │   │   ├── quiz-card.tsx
│   │   │   ├── quiz-question.tsx
│   │   │   └── quiz-results.tsx
│   │   ├── ai-tutor/
│   │   │   ├── chat-window.tsx
│   │   │   ├── chat-bubble.tsx
│   │   │   └── chat-input.tsx
│   │   ├── progress/
│   │   │   ├── progress-ring.tsx
│   │   │   ├── streak-badge.tsx
│   │   │   └── stats-card.tsx
│   │   └── shared/
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       └── card.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── middleware.ts
│   │   ├── prisma/
│   │   │   └── client.ts
│   │   ├── ai/
│   │   │   ├── openai.ts
│   │   │   └── prompts.ts
│   │   └── utils.ts
│   ├── stores/
│   │   ├── auth-store.ts
│   │   └── progress-store.ts
│   └── types/
│       └── index.ts
├── prisma/
│   └── schema.prisma
├── public/
│   └── ...
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## 8. MVP Implementation Order

### Phase 1: Foundation (Week 1-2)
1. [x] Project setup (Next.js + TypeScript + Tailwind)
2. [ ] Database schema (Prisma)
3. [ ] Supabase auth integration
4. [ ] Basic layout components (Sidebar, Header)
5. [ ] Login/Register pages

### Phase 2: Core Learning (Week 3-4)
1. [ ] Dashboard page
2. [ ] Courses listing
3. [ ] Course detail page
4. [ ] Lesson viewer
5. [ ] Progress tracking

### Phase 3: Assessment (Week 5-6)
1. [ ] Quiz system
2. [ ] Quiz attempts & scoring
3. [ ] Results & review

### Phase 4: AI Tutor (Week 7-8)
1. [ ] Chat interface
2. [ ] OpenAI integration
3. [ ] Context-aware responses
4. [ ] Conversation history

### Phase 5: Polish (Week 9-10)
1. [ ] Onboarding flow
2. [ ] Seed data
3. [ ] Error handling
4. [ ] Mobile responsive
5. [ ] Performance optimization
