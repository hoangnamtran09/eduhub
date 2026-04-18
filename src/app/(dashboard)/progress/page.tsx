import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, Target, Calendar, Award, ChevronRight } from "lucide-react";

const weeklyProgress = [
  { day: "T2", hours: 2.5, completed: true },
  { day: "T3", hours: 1.5, completed: true },
  { day: "T4", hours: 3.0, completed: true },
  { day: "T5", hours: 0, completed: false },
  { day: "T6", hours: 2.0, completed: true },
  { day: "T7", hours: 1.0, completed: true },
  { day: "CN", hours: 0.5, completed: true },
];

const achievements = [
  { id: "1", title: "Chăm chỉ", description: "Học 7 ngày liên tiếp", icon: "🔥", unlocked: true },
  { id: "2", title: "Thành tích", description: "Đạt 10 điểm quiz", icon: "🎯", unlocked: true },
  { id: "3", title: "Khám phá", description: "Hoàn thành 10 bài", icon: "📚", unlocked: false },
  { id: "4", title: "Chuyên gia", description: "Hoàn thành 1 khóa", icon: "⭐", unlocked: false },
];

export default function ProgressPage() {
  const totalHours = weeklyProgress.reduce((sum, day) => sum + day.hours, 0);
  const maxHours = Math.max(...weeklyProgress.map((d) => d.hours), 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tiến độ học tập</h1>
        <p className="text-slate-500 mt-1">Theo dõi hành trình học tập của bạn</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">8.5</p>
              <p className="text-sm text-slate-500">Điểm TB</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-success/10">
              <Target className="w-6 h-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">24</p>
              <p className="text-sm text-slate-500">Bài hoàn thành</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-warning/10">
              <Calendar className="w-6 h-6 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalHours}h</p>
              <p className="text-sm text-slate-500">Tuần này</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-secondary/10">
              <Award className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">2/4</p>
              <p className="text-sm text-slate-500">Thành tựu</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Hoạt động tuần này
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between h-40 gap-2">
            {weeklyProgress.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex flex-col items-center">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      day.hours > 0 ? "bg-primary" : "bg-slate-100"
                    }`}
                    style={{ height: `${(day.hours / maxHours) * 100}%`, minHeight: day.hours > 0 ? "8px" : "4px" }}
                  />
                  {day.hours > 0 && (
                    <span className="text-xs text-slate-500 mt-1">{day.hours}h</span>
                  )}
                </div>
                <span className={`text-xs font-medium ${day.completed ? "text-slate-700" : "text-slate-400"}`}>
                  {day.day}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-warning" />
          Thành tựu
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((achievement) => (
            <Card
              key={achievement.id}
              className={`${!achievement.unlocked ? "opacity-60" : ""}`}
            >
              <CardContent className="p-4 text-center">
                <div className={`text-4xl mb-2 ${!achievement.unlocked ? "grayscale" : ""}`}>
                  {achievement.icon}
                </div>
                <h4 className="font-medium text-slate-900">{achievement.title}</h4>
                <p className="text-sm text-slate-500 mt-1">{achievement.description}</p>
                {achievement.unlocked ? (
                  <span className="inline-block mt-2 text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                    Đã đạt được
                  </span>
                ) : (
                  <Button variant="ghost" size="sm" className="mt-2 gap-1">
                    Tiếp tục <ChevronRight className="w-3 h-3" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
