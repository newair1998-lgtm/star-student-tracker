import { useState, useEffect } from 'react';
import { Student, Grade, gradeLabels, gradeShortLabels, AttendanceRecord, getStageFromGrade, stageLabels } from '@/types/student';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, GraduationCap, BarChart3, Eraser, Trash2, Copy, CopyPlus, Pencil, Check, X, ChevronDown, ChevronLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';
import StudentRow from './StudentRow';
import BulkScoreSelector from './BulkScoreSelector';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DuplicateGradeDialog } from './DuplicateGradeDialog';
import { DuplicateSameGradeDialog } from './DuplicateSameGradeDialog';

const DEFAULT_ATTENDANCE: AttendanceRecord = {
  present: [false, false, false, false],
  absent: [false, false, false, false],
};

interface GradeSectionProps {
  grade: Grade;
  subject: string;
  sectionNumber: number;
  students: Student[];
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onBulkUpdate?: (studentIds: string[], updates: Partial<Student>) => void;
  onTransferStudent?: (id: string, newGrade: Grade, newSubject?: string) => void;
  onDuplicateGradeSection?: (sourceGrade: Grade, sourceSubject: string, targetGrade: Grade, targetSubject: string, includeScores: boolean) => void;
  onUpdateSubject?: (grade: Grade, oldSubject: string, newSubject: string) => void;
}

const getGradeColorIndex = (grade: Grade): number => {
  if (grade.includes('first')) return 0;
  if (grade.includes('second')) return 1;
  if (grade.includes('third')) return 2;
  if (grade.includes('fourth')) return 3;
  if (grade.includes('fifth')) return 4;
  if (grade.includes('sixth')) return 5;
  return 0;
};

const gradeHeaderColorsList = [
  'from-grade-one/20 to-grade-one/5 border-grade-one/30',
  'from-grade-two/20 to-grade-two/5 border-grade-two/30',
  'from-grade-three/20 to-grade-three/5 border-grade-three/30',
  'from-grade-four/20 to-grade-four/5 border-grade-four/30',
  'from-grade-five/20 to-grade-five/5 border-grade-five/30',
  'from-grade-six/20 to-grade-six/5 border-grade-six/30',
];

const gradeIconColorsList = [
  'bg-grade-one/20 text-grade-one',
  'bg-grade-two/20 text-grade-two',
  'bg-grade-three/20 text-grade-three',
  'bg-grade-four/20 text-grade-four',
  'bg-grade-five/20 text-grade-five',
  'bg-grade-six/20 text-grade-six',
];

const GradeSection = ({ grade, subject, sectionNumber, students, onUpdateStudent, onDeleteStudent, onBulkUpdate, onTransferStudent, onDuplicateGradeSection, onUpdateSubject }: GradeSectionProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [duplicateSameGradeDialogOpen, setDuplicateSameGradeDialogOpen] = useState(false);
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [editedSubject, setEditedSubject] = useState(subject === 'default' ? '' : subject);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [unmasteredSkills, setUnmasteredSkills] = useState<string>(() => {
    return localStorage.getItem(`unmasteredSkills_${grade}_${subject}_${sectionNumber}`) || '';
  });
  const [enrichmentLink, setEnrichmentLink] = useState<string>(() => {
    return localStorage.getItem(`enrichmentLink_${grade}_${subject}_${sectionNumber}`) || '';
  });
  const [remedialLink, setRemedialLink] = useState<string>(() => {
    return localStorage.getItem(`remedialLink_${grade}_${subject}_${sectionNumber}`) || '';
  });
  const [enrichmentLink2, setEnrichmentLink2] = useState<string>(() => {
    return localStorage.getItem(`enrichmentLink2_${grade}_${subject}_${sectionNumber}`) || '';
  });
  const [remedialLink2, setRemedialLink2] = useState<string>(() => {
    return localStorage.getItem(`remedialLink2_${grade}_${subject}_${sectionNumber}`) || '';
  });

  useEffect(() => {
    localStorage.setItem(`unmasteredSkills_${grade}_${subject}_${sectionNumber}`, unmasteredSkills);
  }, [unmasteredSkills, grade, subject, sectionNumber]);

  useEffect(() => {
    localStorage.setItem(`enrichmentLink_${grade}_${subject}_${sectionNumber}`, enrichmentLink);
  }, [enrichmentLink, grade, subject, sectionNumber]);

  useEffect(() => {
    localStorage.setItem(`remedialLink_${grade}_${subject}_${sectionNumber}`, remedialLink);
  }, [remedialLink, grade, subject, sectionNumber]);

  useEffect(() => {
    localStorage.setItem(`enrichmentLink2_${grade}_${subject}_${sectionNumber}`, enrichmentLink2);
  }, [enrichmentLink2, grade, subject, sectionNumber]);

  useEffect(() => {
    localStorage.setItem(`remedialLink2_${grade}_${subject}_${sectionNumber}`, remedialLink2);
  }, [remedialLink2, grade, subject, sectionNumber]);
  
  const colorIndex = getGradeColorIndex(grade);
  const gradeHeaderColor = gradeHeaderColorsList[colorIndex];
  const gradeIconColor = gradeIconColorsList[colorIndex];
  
  // Load performance tasks max from localStorage
  const [performanceTasksMax, setPerformanceTasksMax] = useState<number>(() => {
    const saved = localStorage.getItem(`performanceTasksMax_${grade}`);
    return saved ? parseInt(saved) : 10;
  });
  
  // Load exam max scores from localStorage
  const [exam1Max, setExam1Max] = useState<number>(() => {
    const saved = localStorage.getItem(`exam1Max_${grade}`);
    return saved ? parseInt(saved) : 30;
  });
  const [exam2Max, setExam2Max] = useState<number>(() => {
    const saved = localStorage.getItem(`exam2Max_${grade}`);
    return saved ? parseInt(saved) : 30;
  });
  
  // Calculate finalTotalMax based on exam1Max
  const finalTotalMax = exam1Max === 20 ? 60 : 100;

  useEffect(() => {
    localStorage.setItem(`performanceTasksMax_${grade}`, performanceTasksMax.toString());
  }, [performanceTasksMax, grade]);

  useEffect(() => {
    localStorage.setItem(`exam1Max_${grade}`, exam1Max.toString());
  }, [exam1Max, grade]);

  useEffect(() => {
    localStorage.setItem(`exam2Max_${grade}`, exam2Max.toString());
  }, [exam2Max, grade]);

  useEffect(() => {
    localStorage.setItem(`finalTotalMax_${grade}`, finalTotalMax.toString());
  }, [finalTotalMax, grade]);

  const handleBulkScoreUpdate = (field: keyof Student, value: number) => {
    if (onBulkUpdate) {
      const studentIds = students.map(s => s.id);
      onBulkUpdate(studentIds, { [field]: value });
    } else {
      students.forEach(student => {
        onUpdateStudent(student.id, { [field]: value });
      });
    }
  };

  const handleBulkAttendance = () => {
    students.forEach(student => {
      const newAttendance: AttendanceRecord = { present: [true, true, true, true], absent: [false, false, false, false] };
      onUpdateStudent(student.id, { attendance: newAttendance });
    });
  };

  const goToAnalysis = () => {
    navigate(`/analysis/${grade}?subject=${encodeURIComponent(subject)}&section=${sectionNumber}`);
  };

  const handleClearAllData = () => {
    students.forEach(student => {
      onUpdateStudent(student.id, {
        attendance: DEFAULT_ATTENDANCE,
        performanceTasks: 0,
        participation: 0,
        book: 0,
        homework: 0,
        exam1: 0,
        exam2: 0,
      });
    });
    toast({
      title: "تم مسح البيانات",
      description: `تم مسح جميع بيانات ${gradeLabels[grade]} بنجاح`,
    });
  };

  const handleDeleteAllStudents = () => {
    students.forEach(student => {
      onDeleteStudent(student.id);
    });
    toast({
      title: "تم إزالة الطالبات",
      description: `تم إزالة جميع طالبات ${gradeLabels[grade]} بنجاح`,
    });
  };

  const handleSaveSubject = () => {
    if (onUpdateSubject) {
      const newSubject = editedSubject.trim() || 'default';
      onUpdateSubject(grade, subject, newSubject);
      toast({
        title: "تم تحديث المادة",
        description: `تم تحديث اسم المادة بنجاح`,
      });
    }
    setIsEditingSubject(false);
  };

  const handleCancelEditSubject = () => {
    setEditedSubject(subject === 'default' ? '' : subject);
    setIsEditingSubject(false);
  };

  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className={cn(
        "px-5 py-4 bg-gradient-to-l border-b",
        gradeHeaderColor
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn("p-2 rounded-lg transition-colors cursor-pointer", gradeIconColor)}
              title={isCollapsed ? "عرض الطالبات" : "إخفاء الطالبات"}
            >
              {isCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            <div className={cn("p-2 rounded-lg", gradeIconColor)}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">
                  {gradeLabels[grade]} - فصل {sectionNumber}
                </h3>
                {isEditingSubject ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editedSubject}
                      onChange={(e) => setEditedSubject(e.target.value)}
                      placeholder="اسم المادة..."
                      className="h-7 w-32 text-sm bg-background"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveSubject();
                        if (e.key === 'Escape') handleCancelEditSubject();
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-success hover:text-success hover:bg-success/10"
                      onClick={handleSaveSubject}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={handleCancelEditSubject}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-primary">
                      {subject !== 'default' ? `(${subject})` : '(بدون مادة)'}
                    </span>
                    {onUpdateSubject && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                        onClick={() => setIsEditingSubject(true)}
                        title="تعديل اسم المادة"
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {students.length} طالبة
              </p>
            </div>
          </div>
          {students.length > 0 && (
            <div className="flex items-center gap-2">
              {onDuplicateGradeSection && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title="تكرار لمادة أخرى"
                    onClick={() => setDuplicateSameGradeDialogOpen(true)}
                  >
                    <CopyPlus className="w-4 h-4 ml-1" />
                    تكرار لمادة أخرى
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                    title="تكرار لصف آخر"
                    onClick={() => setDuplicateDialogOpen(true)}
                  >
                    <Copy className="w-4 h-4 ml-1" />
                    تكرار لصف آخر
                  </Button>
                </>
              )}
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="إزالة جميع البيانات"
                  >
                    <Eraser className="w-4 h-4 ml-1" />
                    إزالة جميع الدرجات
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>مسح جميع البيانات</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنتِ متأكدة من مسح جميع بيانات {gradeLabels[grade]}؟ سيتم إعادة تعيين جميع الدرجات والحضور إلى الصفر.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearAllData}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      مسح البيانات
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="إزالة جميع الطالبات"
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    إزالة جميع الطالبات
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>إزالة جميع الطالبات</AlertDialogTitle>
                    <AlertDialogDescription>
                      هل أنتِ متأكدة من إزالة جميع طالبات {gradeLabels[grade]}؟ سيتم حذف جميع الطالبات نهائياً.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel>إلغاء</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAllStudents}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      إزالة الطالبات
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
          
          {onDuplicateGradeSection && (
            <>
              <DuplicateGradeDialog
                open={duplicateDialogOpen}
                onOpenChange={setDuplicateDialogOpen}
                sourceGrade={grade}
                studentsCount={students.length}
                onDuplicate={(targetGrade, includeScores) => onDuplicateGradeSection(grade, subject, targetGrade, 'default', includeScores)}
              />
              <DuplicateSameGradeDialog
                open={duplicateSameGradeDialogOpen}
                onOpenChange={setDuplicateSameGradeDialogOpen}
                grade={grade}
                subject={subject}
                studentsCount={students.length}
                onConfirm={(newSubject, includeScores) => onDuplicateGradeSection(grade, subject, grade, newSubject, includeScores)}
              />
            </>
          )}
        </div>
      </div>

      {/* Table */}
      {!isCollapsed && students.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                  <TableHead className="text-center w-10">#</TableHead>
                  <TableHead className="min-w-[140px]">اسم الطالبة</TableHead>
                  <TableHead className="text-center w-28">
                    <div className="flex flex-col items-center gap-1">
                      <span>المهام الأدائية</span>
                      <div className="flex items-center gap-1">
                        <Select value={performanceTasksMax.toString()} onValueChange={(val) => setPerformanceTasksMax(parseInt(val))}>
                          <SelectTrigger className="h-7 w-14 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkScoreUpdate('performanceTasks', performanceTasksMax)}
                          className="h-7 min-w-[40px] text-xs bg-primary/10 border-primary/20 hover:bg-primary/20 hover:text-primary"
                          title="تعبئة الكل"
                        >
                          {performanceTasksMax}
                        </Button>
                      </div>
                    </div>
                  </TableHead>
                  {performanceTasksMax === 10 && (
                    <TableHead className="text-center w-20">
                      <BulkScoreSelector
                        max={10}
                        label="مشاركة"
                        onSelect={(value) => handleBulkScoreUpdate('participation', value)}
                      />
                    </TableHead>
                  )}
                  <TableHead className="text-center w-20">
                    <BulkScoreSelector
                      max={10}
                      label="الأنشطة الصفية"
                      onSelect={(value) => handleBulkScoreUpdate('book', value)}
                    />
                  </TableHead>
                  <TableHead className="text-center w-20">
                    <BulkScoreSelector
                      max={10}
                      label="واجبات"
                      onSelect={(value) => handleBulkScoreUpdate('homework', value)}
                    />
                  </TableHead>
                  <TableHead className="text-center w-24">
                    <div className="flex flex-col items-center">
                      <span>مجموع المهام</span>
                      <span className="text-xs text-muted-foreground">(40)</span>
                    </div>
                  </TableHead>
                  <TableHead className="text-center w-28">
                    <div className="flex flex-col items-center gap-1">
                      <span>اختبار ١</span>
                      <div className="flex items-center gap-1">
                        <Select value={exam1Max.toString()} onValueChange={(val) => setExam1Max(parseInt(val))}>
                          <SelectTrigger className="h-7 w-14 text-xs bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            <SelectItem value="0">0</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="30">30</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBulkScoreUpdate('exam1', exam1Max)}
                          className="h-7 min-w-[40px] text-xs bg-primary/10 border-primary/20 hover:bg-primary/20 hover:text-primary"
                          title="تعبئة الكل"
                        >
                          {exam1Max}
                        </Button>
                      </div>
                    </div>
                  </TableHead>
                  {exam1Max !== 20 && (
                    <TableHead className="text-center w-28">
                      <div className="flex flex-col items-center gap-1">
                        <span>اختبار ٢</span>
                        <div className="flex items-center gap-1">
                          <Select value={exam2Max.toString()} onValueChange={(val) => setExam2Max(parseInt(val))}>
                            <SelectTrigger className="h-7 w-14 text-xs bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              <SelectItem value="0">0</SelectItem>
                              <SelectItem value="20">20</SelectItem>
                              <SelectItem value="30">30</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleBulkScoreUpdate('exam2', exam2Max)}
                            className="h-7 min-w-[40px] text-xs bg-primary/10 border-primary/20 hover:bg-primary/20 hover:text-primary"
                            title="تعبئة الكل"
                          >
                            {exam2Max}
                          </Button>
                        </div>
                      </div>
                    </TableHead>
                  )}
                  <TableHead className="text-center w-28">
                    <div className="flex flex-col items-center gap-1">
                      <span>المجموع النهائي</span>
                      <span className="text-xs text-muted-foreground">({finalTotalMax})</span>
                    </div>
                  </TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, index) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    index={index}
                    onUpdate={onUpdateStudent}
                    onDelete={onDeleteStudent}
                    onTransfer={onTransferStudent}
                    performanceTasksMax={performanceTasksMax}
                    exam1Max={exam1Max}
                    exam2Max={exam2Max}
                    finalTotalMax={finalTotalMax}
                    hideExam2={exam1Max === 20}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Action Buttons */}
          <div className="p-4 border-t border-border/50 flex flex-col gap-3 items-center">
            <div className="flex gap-3 items-center">
              <Button
                variant="outline"
                onClick={goToAnalysis}
                className="bg-grade-five/10 border-grade-five/30 text-grade-five hover:bg-grade-five/20"
              >
                <BarChart3 className="w-4 h-4 ml-2" />
                تحليل النتائج
              </Button>
            </div>
            <div className="w-full max-w-lg grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                value={enrichmentLink}
                onChange={(e) => setEnrichmentLink(e.target.value)}
                placeholder="رابط الخطة الإثرائية 1..."
                className="text-sm"
                dir="ltr"
              />
              <Input
                value={enrichmentLink2}
                onChange={(e) => setEnrichmentLink2(e.target.value)}
                placeholder="رابط الخطة الإثرائية 2..."
                className="text-sm"
                dir="ltr"
              />
              <Input
                value={remedialLink}
                onChange={(e) => setRemedialLink(e.target.value)}
                placeholder="رابط الخطة العلاجية 1..."
                className="text-sm"
                dir="ltr"
              />
              <Input
                value={remedialLink2}
                onChange={(e) => setRemedialLink2(e.target.value)}
                placeholder="رابط الخطة العلاجية 2..."
                className="text-sm"
                dir="ltr"
              />
            </div>
            <div className="w-full max-w-md">
              <Textarea
                value={unmasteredSkills}
                onChange={(e) => setUnmasteredSkills(e.target.value)}
                placeholder="أضيفي المهارات غير المتقنة هنا... (ستظهر في تحليل النتائج تحت الخطة العلاجية)"
                className="text-sm min-h-[60px] resize-y"
                dir="rtl"
              />
            </div>
          </div>
        </>
      ) : !isCollapsed ? (
        <div className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary/50 mb-3">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground font-medium">لا توجد طالبات في هذا الصف</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            أضيفي طالبات من قسم الإضافة أعلاه
          </p>
        </div>
      ) : null}
    </div>
  );
};

export default GradeSection;
