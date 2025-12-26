import { useStudents } from '@/hooks/useStudents';
import Header from '@/components/Header';
import AddStudentsSection from '@/components/AddStudentsSection';
import GradeSection from '@/components/GradeSection';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const {
    loading,
    addStudents,
    updateStudent,
    deleteStudent,
    getStudentsByGrade,
  } = useStudents();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 space-y-6">
        <AddStudentsSection onAddStudents={addStudents} />
        
        <div className="space-y-5">
          <GradeSection
            grade="fourth"
            students={getStudentsByGrade('fourth')}
            onUpdateStudent={updateStudent}
            onDeleteStudent={deleteStudent}
          />
          <GradeSection
            grade="fifth"
            students={getStudentsByGrade('fifth')}
            onUpdateStudent={updateStudent}
            onDeleteStudent={deleteStudent}
          />
          <GradeSection
            grade="sixth"
            students={getStudentsByGrade('sixth')}
            onUpdateStudent={updateStudent}
            onDeleteStudent={deleteStudent}
          />
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/50 bg-card/50">
        نظام متابعة حضور وتقييم الطالبات © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Index;
