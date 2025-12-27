import { useState, useEffect } from 'react';
import { useStudents } from '@/hooks/useStudents';
import Header from '@/components/Header';
import AddStudentsSection from '@/components/AddStudentsSection';
import GradeSection from '@/components/GradeSection';
import { Loader2 } from 'lucide-react';
import { Grade, EducationStage, getGradesForStage } from '@/types/student';

const Index = () => {
  const {
    loading,
    addStudents,
    updateStudent,
    deleteStudent,
    getStudentsByGrade,
  } = useStudents();

  const [educationStage, setEducationStage] = useState<EducationStage | ''>(() => 
    (localStorage.getItem('educationStage') as EducationStage) || ''
  );

  useEffect(() => {
    const handleStorageChange = () => {
      setEducationStage((localStorage.getItem('educationStage') as EducationStage) || '');
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Check for changes periodically (for same-tab updates)
    const interval = setInterval(() => {
      const currentStage = (localStorage.getItem('educationStage') as EducationStage) || '';
      if (currentStage !== educationStage) {
        setEducationStage(currentStage);
      }
    }, 100);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [educationStage]);

  const getGradesToShow = (): Grade[] => {
    if (!educationStage) return [];
    return getGradesForStage(educationStage);
  };

  const gradesToShow = getGradesToShow();

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
          {gradesToShow.map((grade) => (
            <GradeSection
              key={grade}
              grade={grade}
              students={getStudentsByGrade(grade)}
              onUpdateStudent={updateStudent}
              onDeleteStudent={deleteStudent}
            />
          ))}
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/50 bg-card/50">
        <p>نظام إدارة الدرجات © 2026</p>
        <p className="mt-1 font-medium text-foreground/70">الحقوق محفوظة للدكتورة نوير الحربي</p>
      </footer>
    </div>
  );
};

export default Index;
