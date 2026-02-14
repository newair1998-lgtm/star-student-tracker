import { BookOpen, GraduationCap, Award, Sparkles, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Header = () => {
  const { signOut, user } = useAuth();

  return (
    <header className="bg-card shadow-soft border-b border-border/50">
      <div className="container py-6">
        <div className="flex flex-col items-center gap-4">
          {/* Logout Button */}
          <div className="w-full flex justify-end">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={signOut}
              className="gap-2 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </Button>
          </div>

          {/* Top Badge */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 via-accent to-primary/10 px-4 py-1.5 rounded-full">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">رقمنة العمل لأداء متميز</span>
            <Sparkles className="w-4 h-4 text-primary" />
          </div>

          {/* Icons and Title */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 bg-gradient-to-br from-primary to-primary/80 rounded-xl shadow-soft">
                <GraduationCap className="w-7 h-7 text-primary-foreground" />
              </div>
              <div className="p-2 bg-accent rounded-lg">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-grade-five mb-1">
                خبير مايكروسوفت للتعليم الإبداعي
              </p>
              <p className="text-lg font-bold text-grade-four mb-1">
                الدكتورة نوير مسري الحربي
              </p>
              <h1 className="text-2xl font-bold text-foreground">
                نظام إدارة الدرجات
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-accent rounded-lg">
                <Award className="w-5 h-5 text-primary" />
              </div>
              <div className="p-2.5 bg-gradient-to-br from-grade-five to-grade-five/80 rounded-xl shadow-soft">
                <Sparkles className="w-6 h-6 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Bottom Description */}
        </div>
      </div>
    </header>
  );
};

export default Header;
