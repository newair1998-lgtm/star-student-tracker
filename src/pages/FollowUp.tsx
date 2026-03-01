import { useState, useEffect, useCallback } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Loader2, ArrowRight, Check, X, ChevronDown, ChevronUp, ChevronLeft, ChevronRight as ChevronRightIcon, CalendarIcon } from 'lucide-react';
import { Grade, EducationStage, getGradesForStage, gradeLabels, gradeColors, GradeSection as GradeSectionType, stageLabels } from '@/types/student';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek, isSameDay } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type DailyStatus = 'none' | 'done' | 'not_done';
type AttendanceStatus = 'present' | 'absent' | 'none';

interface DailyRecord {
  attendance: AttendanceStatus[];
  homework: DailyStatus[];
  participation: DailyStatus[];
  performanceTasks: DailyStatus;
}

const defaultRecord = (): DailyRecord => ({
  attendance: ['none', 'none'],
  homework: ['none', 'none'],
  participation: ['none', 'none'],
  performanceTasks: 'none',
});

const isRecordEmpty = (record: DailyRecord): boolean => {
  return (
    record.attendance.every(v => v === 'none') &&
    record.homework.every(v => v === 'none') &&
    record.participation.every(v => v === 'none') &&
    record.performanceTasks === 'none'
  );
};

// Normalize records from DB (may have 4 slots) to 2 slots
const normalizeRecord = (record: DailyRecord): DailyRecord => ({
  attendance: record.attendance.slice(0, 2) as AttendanceStatus[],
  homework: record.homework.slice(0, 2) as DailyStatus[],
  participation: record.participation.slice(0, 2) as DailyStatus[],
  performanceTasks: record.performanceTasks,
});

const FollowUp = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    loading,
    getStudentsByGradeAndSubject,
    getGradeSections,
  } = useStudents();

  const [educationStage] = useState<EducationStage | ''>(() =>
    (localStorage.getItem('educationStage') as EducationStage) || ''
  );

  const [dailyRecords, setDailyRecords] = useState<Record<string, DailyRecord>>({});
  const [dbLoading, setDbLoading] = useState(true);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: () => void;
    message: string;
  }>({ open: false, action: () => {}, message: '' });

  const weekStartDate = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const today = format(weekStartDate, 'yyyy-MM-dd');
  const currentWeekStart = weekStartDate;
  const currentWeekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
  const isCurrentWeek = isSameDay(startOfWeek(new Date(), { weekStartsOn: 0 }), currentWeekStart);

  // Load records from database when date changes
  useEffect(() => {
    if (!user) return;
    const loadRecords = async () => {
      setDbLoading(true);
      setDailyRecords({});
      const { data, error } = await supabase
        .from('daily_followup')
        .select('*')
        .eq('user_id', user.id)
        .eq('record_date', today);

      if (error) {
        console.error('Error loading followup:', error);
        toast.error('خطأ في تحميل بيانات المتابعة');
      } else if (data) {
        const records: Record<string, DailyRecord> = {};
        data.forEach((row: any) => {
          records[row.student_id] = normalizeRecord({
            attendance: row.attendance as AttendanceStatus[],
            homework: row.homework as DailyStatus[],
            participation: row.participation as DailyStatus[],
            performanceTasks: row.performance_tasks as DailyStatus,
          });
        });
        setDailyRecords(records);
      }
      setDbLoading(false);
    };
    loadRecords();
  }, [user, today]);

  // Save a single student record to DB
  const saveRecord = useCallback(async (studentId: string, record: DailyRecord) => {
    if (!user) return;
    const { error } = await supabase
      .from('daily_followup')
      .upsert({
        user_id: user.id,
        student_id: studentId,
        record_date: today,
        attendance: record.attendance as any,
        homework: record.homework as any,
        participation: record.participation as any,
        performance_tasks: record.performanceTasks,
      }, { onConflict: 'user_id,student_id,record_date' });

    if (error) {
      console.error('Error saving followup:', error);
      toast.error('خطأ في حفظ البيانات');
    }
  }, [user, today]);

  const toggleCollapse = (key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const getRecord = (studentId: string): DailyRecord => {
    return dailyRecords[studentId] || defaultRecord();
  };

  const hasExistingData = (studentId: string, field: keyof DailyRecord, index?: number): boolean => {
    const record = getRecord(studentId);
    if (field === 'performanceTasks') {
      return record.performanceTasks !== 'none';
    }
    if (index !== undefined) {
      return (record[field] as string[])[index] !== 'none';
    }
    return (record[field] as string[]).some(v => v !== 'none');
  };

  const updateAndSave = (studentId: string, updates: Partial<DailyRecord>) => {
    const newRecord = { ...getRecord(studentId), ...updates };
    setDailyRecords(prev => ({ ...prev, [studentId]: newRecord }));
    saveRecord(studentId, newRecord);
  };

  const requestConfirmation = (message: string, action: () => void) => {
    setConfirmDialog({ open: true, action, message });
  };

  const toggleAttendance = (studentId: string, index: number) => {
    const doToggle = () => {
      const record = getRecord(studentId);
      const newAttendance = [...record.attendance] as AttendanceStatus[];
      if (newAttendance[index] === 'none' || newAttendance[index] === 'absent') {
        newAttendance[index] = 'present';
      } else {
        newAttendance[index] = 'absent';
      }
      updateAndSave(studentId, { attendance: newAttendance });
    };

    if (hasExistingData(studentId, 'attendance', index)) {
      requestConfirmation('هل تريد تغيير حالة الحضور؟', doToggle);
    } else {
      doToggle();
    }
  };

  const toggleStatus = (studentId: string, field: 'homework' | 'participation', index: number) => {
    const doToggle = () => {
      const record = getRecord(studentId);
      const arr = [...record[field]] as DailyStatus[];
      arr[index] = arr[index] === 'none' || arr[index] === 'not_done' ? 'done' : 'not_done';
      updateAndSave(studentId, { [field]: arr });
    };

    if (hasExistingData(studentId, field, index)) {
      const label = field === 'homework' ? 'الواجبات' : 'المشاركة';
      requestConfirmation(`هل تريد تغيير حالة ${label}؟`, doToggle);
    } else {
      doToggle();
    }
  };

  const togglePerformanceTasks = (studentId: string) => {
    const doToggle = () => {
      const record = getRecord(studentId);
      const current = record.performanceTasks;
      const next: DailyStatus = current === 'none' ? 'done' : current === 'done' ? 'not_done' : 'done';
      updateAndSave(studentId, { performanceTasks: next });
    };

    if (hasExistingData(studentId, 'performanceTasks')) {
      requestConfirmation('هل تريد تغيير حالة المهام الأدائية؟', doToggle);
    } else {
      doToggle();
    }
  };

  const markAllPresent = (students: { id: string }[]) => {
    const hasAnyData = students.some(s => hasExistingData(s.id, 'attendance'));
    const doMark = () => {
      const updated = { ...dailyRecords };
      students.forEach(s => {
        const record = updated[s.id] || defaultRecord();
        const newRecord = { ...record, attendance: ['present', 'present'] as AttendanceStatus[] };
        updated[s.id] = newRecord;
        saveRecord(s.id, newRecord);
      });
      setDailyRecords(updated);
    };
    if (hasAnyData) {
      requestConfirmation('هل تريد تغيير حالة الحضور لجميع الطالبات؟', doMark);
    } else {
      doMark();
    }
  };

  const markAllField = (students: { id: string }[], field: 'homework' | 'participation') => {
    const hasAnyData = students.some(s => hasExistingData(s.id, field));
    const doMark = () => {
      const updated = { ...dailyRecords };
      students.forEach(s => {
        const record = updated[s.id] || defaultRecord();
        const newRecord = { ...record, [field]: ['done', 'done'] as DailyStatus[] };
        updated[s.id] = newRecord;
        saveRecord(s.id, newRecord);
      });
      setDailyRecords(updated);
    };
    const label = field === 'homework' ? 'الواجبات' : 'المشاركة';
    if (hasAnyData) {
      requestConfirmation(`هل تريد تغيير حالة ${label} لجميع الطالبات؟`, doMark);
    } else {
      doMark();
    }
  };

  const markAllPerformance = (students: { id: string }[]) => {
    const hasAnyData = students.some(s => hasExistingData(s.id, 'performanceTasks'));
    const doMark = () => {
      const updated = { ...dailyRecords };
      students.forEach(s => {
        const record = updated[s.id] || defaultRecord();
        const newRecord = { ...record, performanceTasks: 'done' as DailyStatus };
        updated[s.id] = newRecord;
        saveRecord(s.id, newRecord);
      });
      setDailyRecords(updated);
    };
    if (hasAnyData) {
      requestConfirmation('هل تريد تغيير حالة المهام الأدائية لجميع الطالبات؟', doMark);
    } else {
      doMark();
    }
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

  const sectionsToShow = getSectionsToShow();

  if (loading || dbLoading) {
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
        <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          الرجوع للرئيسية
        </Button>

        <div className="text-center mb-6 space-y-3">
          <h1 className="text-2xl font-bold text-foreground">أعمال المتابعة الأسبوعية</h1>
          
          {/* Week Navigation */}
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => addWeeks(d, 1))} disabled={isCurrentWeek}>
              <ChevronRightIcon className="w-4 h-4" />
            </Button>
            
            <div className="text-sm font-medium text-foreground bg-secondary/50 px-4 py-2 rounded-lg min-w-[220px]">
              {currentWeekStart.toLocaleDateString('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long' })} - {currentWeekEnd.toLocaleDateString('ar-SA-u-ca-islamic', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>

            <Button variant="outline" size="icon" onClick={() => setSelectedDate(d => subWeeks(d, 1))}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </div>


          {!isCurrentWeek && (
            <Button variant="link" className="text-primary" onClick={() => setSelectedDate(new Date())}>
              العودة للأسبوع الحالي
            </Button>
          )}
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
                <button
                  onClick={() => toggleCollapse(sectionKey)}
                  className="w-full px-4 py-3 border-b border-border/50 flex items-center justify-between transition-colors"
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
                            <Button variant="outline" size="sm" onClick={() => markAllPresent(students)}
                              className="h-6 text-xs bg-success/10 border-success/20 hover:bg-success/20 text-success">
                              حضور الكل
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span>الواجبات</span>
                            <Button variant="outline" size="sm" onClick={() => markAllField(students, 'homework')}
                              className="h-6 text-xs bg-success/10 border-success/20 hover:bg-success/20 text-success">
                              الكل ✓
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span>المشاركة</span>
                            <Button variant="outline" size="sm" onClick={() => markAllField(students, 'participation')}
                              className="h-6 text-xs bg-success/10 border-success/20 hover:bg-success/20 text-success">
                              الكل ✓
                            </Button>
                          </div>
                        </TableHead>
                        <TableHead className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span>المهام الأدائية</span>
                            <Button variant="outline" size="sm" onClick={() => markAllPerformance(students)}
                              className="h-6 text-xs bg-success/10 border-success/20 hover:bg-success/20 text-success">
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
                                  <button key={i} onClick={() => toggleAttendance(student.id, i)}
                                    className={cn(
                                      "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200",
                                      state === 'present' && "bg-success border-success text-success-foreground",
                                      state === 'absent' && "bg-destructive border-destructive text-destructive-foreground",
                                      state === 'none' && "border-muted-foreground/30 text-muted-foreground hover:border-success hover:text-success hover:bg-success/10"
                                    )}>
                                    {state === 'absent' ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                  </button>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-0.5 justify-center">
                                {record.homework.map((status, i) => (
                                  <button key={i} onClick={() => toggleStatus(student.id, 'homework', i)}
                                    className={cn(
                                      "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200",
                                      status === 'done' && "bg-success border-success text-success-foreground",
                                      status === 'not_done' && "bg-destructive border-destructive text-destructive-foreground",
                                      status === 'none' && "border-muted-foreground/30 text-muted-foreground hover:border-success hover:text-success hover:bg-success/10"
                                    )}>
                                    {status === 'not_done' ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                                  </button>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-0.5 justify-center">
                                {record.participation.map((status, i) => (
                                  <button key={i} onClick={() => toggleStatus(student.id, 'participation', i)}
                                    className={cn(
                                      "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200",
                                      status === 'done' && "bg-success border-success text-success-foreground",
                                      status === 'not_done' && "bg-destructive border-destructive text-destructive-foreground",
                                      status === 'none' && "border-muted-foreground/30 text-muted-foreground hover:border-success hover:text-success hover:bg-success/10"
                                    )}>
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

      <Footer />

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد التعديل</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.message}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogAction onClick={() => { confirmDialog.action(); setConfirmDialog(prev => ({ ...prev, open: false })); }}>
              نعم، تعديل
            </AlertDialogAction>
            <AlertDialogCancel onClick={() => setConfirmDialog(prev => ({ ...prev, open: false }))}>
              إلغاء
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FollowUp;
