import { useState, useCallback } from 'react';
import { Student, Grade } from '@/types/student';
import Header from '@/components/Header';
import AddStudentsSection from '@/components/AddStudentsSection';
import GradeSection from '@/components/GradeSection';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const { toast } = useToast();

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleAddStudents = useCallback((names: string[], grade: Grade) => {
    const newStudents: Student[] = names.map(name => ({
      id: generateId(),
      name,
      grade,
      attendance: null,
      participation: 0,
      book: 0,
      homework: 0,
      exam1: 0,
      exam2: 0,
    }));

    setStudents(prev => [...prev, ...newStudents]);

    const gradeNames: Record<Grade, string> = {
      fourth: 'الرابع',
      fifth: 'الخامس',
      sixth: 'السادس',
    };

    toast({
      title: 'تمت الإضافة بنجاح',
      description: `تم إضافة ${names.length} طالبة إلى الصف ${gradeNames[grade]}`,
    });
  }, [toast]);

  const handleUpdateStudent = useCallback((id: string, updates: Partial<Student>) => {
    setStudents(prev =>
      prev.map(student =>
        student.id === id ? { ...student, ...updates } : student
      )
    );
  }, []);

  const handleDeleteStudent = useCallback((id: string) => {
    setStudents(prev => prev.filter(student => student.id !== id));
    toast({
      title: 'تم الحذف',
      description: 'تم حذف الطالبة من القائمة',
    });
  }, [toast]);

  const getStudentsByGrade = (grade: Grade) =>
    students.filter(student => student.grade === grade);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-6 space-y-6">
        <AddStudentsSection onAddStudents={handleAddStudents} />
        
        <div className="space-y-5">
          <GradeSection
            grade="fourth"
            students={getStudentsByGrade('fourth')}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
          />
          <GradeSection
            grade="fifth"
            students={getStudentsByGrade('fifth')}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
          />
          <GradeSection
            grade="sixth"
            students={getStudentsByGrade('sixth')}
            onUpdateStudent={handleUpdateStudent}
            onDeleteStudent={handleDeleteStudent}
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
