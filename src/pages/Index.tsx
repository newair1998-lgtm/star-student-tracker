import { useState, useEffect } from 'react';
import { useStudents } from '@/hooks/useStudents';
import Header from '@/components/Header';
import AddStudentsSection from '@/components/AddStudentsSection';
import GradeSection from '@/components/GradeSection';
import { Loader2 } from 'lucide-react';
import { Grade, EducationStage, getGradesForStage, GradeSection as GradeSectionType } from '@/types/student';

const Index = () => {
  const {
    loading,
    addStudents,
    updateStudent,
    deleteStudent,
    getStudentsByGradeAndSubject,
    getGradeSections,
    transferStudent,
    duplicateGradeSection,
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

  // Get grade sections to show based on the education stage
  const getSectionsToShow = (): GradeSectionType[] => {
    if (!educationStage) return [];
    const stageGrades = getGradesForStage(educationStage);
    const allSections = getGradeSections();
    
    // Get sections that belong to this stage
    const stageSections = allSections.filter(section => stageGrades.includes(section.grade));
    
    // Also include empty grades (grades without any students yet)
    const sectionsWithStudents = new Set(stageSections.map(s => `${s.grade}_${s.subject}`));
    const emptySections: GradeSectionType[] = stageGrades
      .filter(grade => !allSections.some(s => s.grade === grade))
      .map(grade => ({ grade, subject: 'default' }));
    
    // Combine and sort by grade order
    const combined = [...stageSections, ...emptySections];
    combined.sort((a, b) => {
      const gradeOrder = stageGrades.indexOf(a.grade) - stageGrades.indexOf(b.grade);
      if (gradeOrder !== 0) return gradeOrder;
      // Same grade, sort by subject (default first)
      if (a.subject === 'default') return -1;
      if (b.subject === 'default') return 1;
      return a.subject.localeCompare(b.subject, 'ar');
    });
    
    return combined;
  };

  const sectionsToShow = getSectionsToShow();

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
          {sectionsToShow.map((section) => (
            <GradeSection
              key={`${section.grade}_${section.subject}`}
              grade={section.grade}
              subject={section.subject}
              students={getStudentsByGradeAndSubject(section.grade, section.subject)}
              onUpdateStudent={updateStudent}
              onDeleteStudent={deleteStudent}
              onTransferStudent={transferStudent}
              onDuplicateGradeSection={duplicateGradeSection}
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
