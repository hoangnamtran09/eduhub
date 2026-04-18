import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Flame, 
  BookOpen, 
  Trophy, 
  Target, 
  TrendingUp, 
  Clock,
  ArrowRight,
  Play,
  Sparkles,
  GraduationCap,
  Calendar,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

// Demo data
const stats = [
  { label: "Streak", value: "7", suffix: "ngày liên tiếp", icon: Flame, color: "text-amber-500", bgColor: "bg-amber-50" },
  { label: "Bài học", value: "24", suffix: "đã hoàn thành", icon: BookOpen, color: "text-brand-600", bgColor: "bg-brand-50" },
  { label: "Điểm TB", value: "8.5", suffix: "/10", icon: Trophy, color: "text-emerald-500", bgColor: "bg-emerald-50" },
  { label: "Thời gian", value: "12", suffix: "giờ tuần này", icon: Clock, color: "text-blue-600", bgColor: "bg-blue-50" },
];

const recommendedLessons = [
  { id: "1", title: "Phương trình bậc hai", subject: "Toán", chapter: "Đại số 9", progress: 60, icon: "📐", gradient: "from-amber-400 to-orange-500" },
  { id: "2", title: "Thì hiện tại hoàn thành", subject: "Tiếng Anh", chapter: "Ngữ pháp 9", progress: 30, icon: "📝", gradient: "from-violet-400 to-fuchsia-500" },
  { id: "3", title: "Chuyển động thẳng đều", subject: "Vật Lý", chapter: "Lớp 8", progress: 0, icon: "⚡", gradient: "from-blue-400 to-indigo-500" },
];

const recentActivity = [
  { type: "lesson", title: "Hoàn thành bài: Tỉ số lượng giác", time: "2 giờ trước", icon: "✓", color: "text-emerald-500", bgColor: "bg-emerald-50" },
  { type: "quiz", title: "Quiz Toán: 8/10 điểm", time: "5 giờ trước", icon: "🎯", color: "text-brand-600", bgColor: "bg-brand-50" },
  { type: "chat", title: "Hỏi Gia sư AI về Hàm số", time: "Hôm qua", icon: "💬", color: "text-blue-600", bgColor: "bg-blue-50" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-10 animate-fade-in pb-10">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Chào buổi sáng! 👋</h1>
          <p className="text-slate-500 text-lg">Hôm nay là ngày tốt để học thêm những điều mới!</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="h-12 px-6 rounded-2xl font-bold text-slate-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
            <Target className="w-4 h-4 mr-2" />
            Mục tiêu
          </Button>
          <Button className="h-12 px-8 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 font-bold shadow-xl shadow-slate-200 transition-all active:scale-95">
            <Play className="w-4 h-4 mr-2 fill-current" />
            Bắt đầu học
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="group hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 border-none bg-white rounded-[32px] overflow-hidden">
              <CardContent className="p-8">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                    <p className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-tight">{stat.suffix}</p>
                  </div>
                  <div className={cn("p-4 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-sm", stat.bgColor)}>
                    <Icon className={cn("w-6 h-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-12 gap-10">
        {/* Recommended Lessons */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Bài học gợi ý</h2>
            <Button variant="ghost" size="sm" className="font-bold text-brand-600 hover:bg-brand-50 rounded-xl">
              Xem tất cả <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="grid gap-4">
            {recommendedLessons.map((lesson) => (
              <div
                key={lesson.id}
                className="group flex items-center gap-6 p-6 bg-white rounded-[32px] border border-slate-200/60 hover:border-brand-200 hover:shadow-2xl hover:shadow-slate-200 transition-all duration-500 cursor-pointer"
              >
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg shadow-slate-100 group-hover:scale-110 transition-transform duration-500 bg-gradient-to-br",
                  lesson.gradient
                )}>
                  {lesson.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-900 text-lg group-hover:text-brand-600 transition-colors">
                    {lesson.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border border-slate-100">
                      {lesson.subject}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-200" />
                    <span className="text-xs font-bold text-slate-400">{lesson.chapter}</span>
                  </div>
                </div>

                <div className="w-32 hidden sm:block">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tiến độ</span>
                    <span className="text-[10px] font-bold text-slate-900">{lesson.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full transition-all duration-1000"
                      style={{ width: `${lesson.progress}%` }}
                    />
                  </div>
                </div>

                <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-brand-500 flex items-center justify-center transition-all duration-300">
                  <Play className="w-4 h-4 text-slate-400 group-hover:text-white fill-current" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          {/* Recent Activity */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-900 px-2">Hoạt động gần đây</h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-3xl border border-slate-100 hover:border-slate-200 transition-all group">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-sm",
                    activity.bgColor,
                    activity.color
                  )}>
                    {activity.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800 leading-tight">{activity.title}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Banner */}
          <div className="relative group overflow-hidden bg-slate-900 rounded-[40px] p-8 shadow-2xl shadow-slate-300">
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <Sparkles className="w-6 h-6 text-brand-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2 leading-tight">Cần giúp đỡ?</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                Gia sư AI luôn sẵn sàng hỗ trợ bạn 24/7. Hỏi bất kỳ điều gì!
              </p>
              <Button className="w-full h-12 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-bold gap-2 shadow-xl shadow-brand-500/20 transition-all active:scale-95">
                Trò chuyện ngay
              </Button>
            </div>
            {/* Decorative blobs */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-brand-500/20 rounded-full blur-3xl group-hover:bg-brand-500/30 transition-colors" />
            <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}
