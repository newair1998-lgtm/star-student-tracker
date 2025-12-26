import { BookOpen, GraduationCap } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-card shadow-soft border-b border-border/50">
      <div className="container py-5">
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
            <h1 className="text-2xl font-bold text-foreground">
              نظام متابعة الطالبات
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              المرحلة الابتدائية العليا • الصفوف ٤ - ٥ - ٦
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
