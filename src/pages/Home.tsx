import { useNavigate } from 'react-router-dom';
import { ClipboardList, BookOpen, School } from 'lucide-react';
import Header from '@/components/Header';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-center text-foreground mb-12">
            اختر نوع العمل
          </h1>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* أعمال المتابعة */}
            <button
              onClick={() => navigate('/follow-up')}
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card shadow-sm hover:shadow-lg hover:border-primary/50 hover:bg-accent/30 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <ClipboardList className="w-8 h-8 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">أعمال المتابعة</span>
              <span className="text-sm text-muted-foreground text-center">متابعة الحضور والغياب والأداء اليومي</span>
            </button>

            {/* أعمال السنة */}
            <button
              onClick={() => navigate('/yearly-work')}
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card shadow-sm hover:shadow-lg hover:border-primary/50 hover:bg-accent/30 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">أعمال السنة</span>
              <span className="text-sm text-muted-foreground text-center">الدرجات والاختبارات والتقييم النهائي</span>
            </button>

            {/* الإدارة الصفية */}
            <button
              onClick={() => navigate('/classroom')}
              className="group flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-border bg-card shadow-sm hover:shadow-lg hover:border-primary/50 hover:bg-accent/30 transition-all duration-300"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <School className="w-8 h-8 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">الإدارة الصفية</span>
              <span className="text-sm text-muted-foreground text-center">إدارة وتنظيم الفصول الدراسية</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
