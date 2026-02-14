import { useState, useEffect } from 'react';
import { useStudents } from '@/hooks/useStudents';
import Header from '@/components/Header';
import { Loader2, ArrowRight, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Grade, EducationStage, getGradesForStage, gradeLabels, gradeColors, GradeSection as GradeSectionType, stageLabels } from '@/types/student';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type DailyStatus = 'none' | 'done' | 'not_done';

interface DailyRecord {
  attendance: ('present' | 'absent' | 'none')[];
  homework: DailyStatus[];
  participation: DailyStatus[];
  performanceTasks: DailyStatus;
}

const FollowUp = () => {
  const navigate = useNavigate();
  const {
    loading,
    getStudentsByGradeAndSubject,
    getGradeSections,
  } = useStudents();

  const [educationStage] = useState<EducationStage | ''>(() =>
    (localStorage.getItem('educationStage') as EducationStage) || ''
  );

  // Daily records keyed by student ID
  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyRecord>>(() => {
    const today = new Date().toISOString().split('T')[0];
    const saved = localStorage.getItem(`followup_${today}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Track collapsed sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const toggleCollapse = (key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Save to localStorage whenever records change
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`followup_${today}`, JSON.stringify(dailyRecords));
  }, [dailyRecords]);

  const getRecord = (studentId: string): DailyRecord => {
    return dailyRecords[studentId] || {
      attendance: ['none', 'none', 'none', 'none'],
      homework: ['none', 'none', 'none', 'none'],
      participation: ['none', 'none', 'none', 'none'],
      performanceTasks: 'none',
    };
  };

  const updateRecord = (studentId: string, updates: Partial<DailyRecord>) => {
    setDailyRecords(prev => ({
      ...prev,
      [studentId]: { ...getRecord(studentId), ...updates },
    }));
  };

  const toggleAttendance = (studentId: string, index: number) => {
    const record = getRecord(studentId);
    const newAttendance = [...record.attendance];
    if (newAttendance[index] === 'none' || newAttendance[index] === 'absent') {
      newAttendance[index] = 'present';
    } else {
      newAttendance[index] = 'absent';
    }
    updateRecord(studentId, { attendance: newAttendance as DailyRecord['attendance'] });
  };

  const toggleStatus = (studentId: string, field: 'homework' | 'participation', index: number) => {
    const record = getRecord(studentId);
    const arr = [...record[field]];
    arr[index] = arr[index] === 'none' || arr[index] === 'not_done' ? 'done' : 'not_done';
    updateRecord(studentId, { [field]: arr });
  };

  const togglePerformanceTasks = (studentId: string) => {
    const record = getRecord(studentId);
    const current = record.performanceTasks;
    const next: DailyStatus = current === 'none' ? 'done' : current === 'done' ? 'not_done' : 'done';
    updateRecord(studentId, { performanceTasks: next });
  };

  const getSectionsToShow = (): GradeSectionType[] => {
    if (!educationStage) return [];
    const stageGrades = getGradesForStage(educationStage);
    const allSections = getGradeSections();
    const stageSections = allSections.filter(section => stageGrades.includes(section.grade));
    stageSections.sort((a, b) => {
      const gradeOrder = stageGrades.indexOf(a.grade) - stageGrades.indexOf(b.grade);
      if (gradeOrder !== 0) return gradeOrder;
      return a.sectionNumber - b.sectionNumber;
    });
    return stageSections;
  };

  const defaultRecord = (): DailyRecord => ({
    attendance: ['none', 'none', 'none', 'none'],
    homework: ['none', 'none', 'none', 'none'],
    participation: ['none', 'none', 'none', 'none'],
    performanceTasks: 'none',
  });

  const markAllPresent = (students: { id: string }[]) => {
    setDailyRecords(prev => {
      const updated = { ...prev };
      students.forEach(s => {
        const record = updated[s.id] || defaultRecord();
        updated[s.id] = { ...record, attendance: ['present', 'present', 'present', 'present'] };
      });
      return updated;
    });
  };

  const markAllField = (students: { id: string }[], field: 'homework' | 'participation') => {
    setDailyRecords(prev => {
      const updated = { ...prev };
      students.forEach(s => {
        const record = updated[s.id] || defaultRecord();
        updated[s.id] = { ...record, [field]: ['done', 'done', 'done', 'done'] };
      });
      return updated;
    });
  };

  const markAllPerformance = (students: { id: string }[]) => {
    setDailyRecords(prev => {
      const updated = { ...prev };
      students.forEach(s => {
        const record = updated[s.id] || defaultRecord();
        updated[s.id] = { ...record, performanceTasks: 'done' };
      });
      return updated;
    });
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

  const StatusButton = ({ status, onClick }: { status: DailyStatus; onClick: () => void }) => (
    <button
      onClick={onClick}
      className={cn(
        "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200",
        status === 'done' && "bg-success border-success text-success-foreground",
        status === 'not_done' && "bg-destructive border-destructive text-destructive-foreground",
        status === 'none' && "border-muted-foreground/30 text-muted-foreground hover:border-primary hover:bg-primary/10"
      )}
    >
      {status === 'done' && <Check className="w-4 h-4" />}
      {status === 'not_done' && <X className="w-4 h-4" />}
      {status === 'none' && <span className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
    </button>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />
      
      <main className="container py-6 space-y-6">
        {/* Back button */}
        <Button
          variant="outline"
          onClick={() => navigate('/')}
          className="gap-2"
        >
          <ArrowRight className="w-4 h-4" />
          الرجوع للرئيسية
        </Button>

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground">أعمال المتابعة اليومية</h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {sectionsToShow.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">لا توجد بيانات طالبات</p>
            <p className="text-sm mt-2">قم بإضافة طالبات من صفحة أعمال السنة أولاً</p>
          </div>
        )}

        <div className="space-y-6">
          {sectionsToShow.map((section) => {
            const students = getStudentsByGradeAndSubject(section.grade, section.subject, section.sectionNumber);
            if (students.length === 0) return null;

            const sectionKey = `${section.grade}_${section.subject}_${section.sectionNumber}`;
            const sectionLabel = `${gradeLabels[section.grade]} - فصل ${section.sectionNumber === 1 ? '١' : '٢'}`;
            const colorClass = gradeColors[section.grade];

            return (
              <div key={sectionKey} className="bg-card rounded-xl shadow-card overflow-hidden">
                {/* Section Header */}
                <button
                  onClick={() => toggleCollapse(sectionKey)}
                  className={`w-full px-4 py-3 border-b border-border/50 flex items-center justify-between transition-colors bg-${colorClass}/15 hover:bg-${colorClass}/25`}
                  style={{ backgroundColor: `hsl(var(--${colorClass}) / 0.15)` }}
                >
                  <h2 className="text-lg font-bold" style={{ color: `hsl(var(--${colorClass}))` }}>{sectionLabel}</h2>
                  {collapsedSections.has(sectionKey) ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  )}
                </button>

                {!collapsedSections.has(sectionKey) && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                        <TableHead className="text-center w-10">#</TableHead>
                        <TableHead className="min-w-[140px]">اسم الطالبة</TableHead>
                        <TableHead className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span>الحضور</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAllPresent(students)}
                              className="h-6 text-xs bg-success/10 border-success/20 hover:bg-success/20 text-success"
                            >
                              حضور الكل
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span>الواجبات</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAllField(students, 'homework')}
                              className="h-6 text-xs bg-success/10 border-success/20 hover:bg-success/20 text-success"
                            >
                              الكل ✓
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span>المشاركة</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAllField(students, 'participation')}
                              className="h-6 text-xs bg-success/10 border-success/20 hover:bg-success/20 text-success"
                            >
                              الكل ✓
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span>المهام الأدائية</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAllPerformance(students)}
                              className="h-6 text-xs bg-success/10 border-success/20 hover:bg-success/20 text-success"
                            >
                              الكل ✓
                            </Button>
                          </div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, idx) => {
                        const record = getRecord(student.id);
                        return (
                          <TableRow key={student.id} className="hover:bg-accent/30 transition-colors">
                            <TableCell className="text-center font-medium text-muted-foreground w-10">
                              {idx + 1}
                            </TableCell>
                            <TableCell className="font-medium text-foreground min-w-[140px]">
                              {student.name}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-0.5 justify-center">
                                {record.attendance.map((state, i) => (
                                  <button
                                    key={i}
                                    onClick={() => toggleAttendance(student.id, i)}
                                    className={cn(
                                      "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200",
                                      state === 'present' && "bg-success border-success text-success-foreground",
                                      state === 'absent' && "bg-destructive border-destructive text-destructive-foreground",
                                      state === 'none' && "border-muted-foreground/30 text-muted-foreground hover:border-success hover:text-success hover:bg-success/10"
                                    )}
                                  >
                                    {state === 'absent' ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                  </button>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-0.5 justify-center">
                                {record.homework.map((status, i) => (
                                  <button
                                    key={i}
                                    onClick={() => toggleStatus(student.id, 'homework', i)}
                                    className={cn(
                                      "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200",
                                      status === 'done' && "bg-success border-success text-success-foreground",
                                      status === 'not_done' && "bg-destructive border-destructive text-destructive-foreground",
                                      status === 'none' && "border-muted-foreground/30 text-muted-foreground hover:border-success hover:text-success hover:bg-success/10"
                                    )}
                                  >
                                    {status === 'not_done' ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                  </button>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-0.5 justify-center">
                                {record.participation.map((status, i) => (
                                  <button
                                    key={i}
                                    onClick={() => toggleStatus(student.id, 'participation', i)}
                                    className={cn(
                                      "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200",
                                      status === 'done' && "bg-success border-success text-success-foreground",
                                      status === 'not_done' && "bg-destructive border-destructive text-destructive-foreground",
                                      status === 'none' && "border-muted-foreground/30 text-muted-foreground hover:border-success hover:text-success hover:bg-success/10"
                                    )}
                                  >
                                    {status === 'not_done' ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                  </button>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex justify-center">
                                <StatusButton status={record.performanceTasks} onClick={() => togglePerformanceTasks(student.id)} />
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/50 bg-card/50">
        <p>نظام إدارة الدرجات © 2026</p>
        <p className="mt-1 font-medium text-foreground/70">الحقوق محفوظة للدكتورة نوير الحربي</p>
      </footer>
    </div>
  );
};

export default FollowUp;
