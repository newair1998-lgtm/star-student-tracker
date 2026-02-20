import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudents } from '@/hooks/useStudents';
import { useClassroom, StarsArray } from '@/hooks/useClassroom';
import Header from '@/components/Header';
import { ArrowRight, Star, Users2, StickyNote, ShieldAlert, Loader2, Plus, Minus, Trash2, MessageSquare, Handshake, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { EducationStage, getGradesForStage, gradeLabels, gradeColors, GradeSection as GradeSectionType } from '@/types/student';

const StarRating = ({ 
  stars, 
  onToggle, 
  onReset,
  onFillGreen,
}: { 
  stars: StarsArray; 
  onToggle: (index: number) => void; 
  onReset: () => void;
  onFillGreen: () => void;
}) => (
  <div className="flex items-center gap-0.5">
    {stars.map((value, i) => (
      <button
        key={i}
        onClick={() => onToggle(i)}
        className="p-0.5 transition-transform hover:scale-125 focus:outline-none"
        title={value === 0 ? 'فارغ' : value === 1 ? 'أخضر' : 'أحمر'}
      >
        <Star
          className={cn(
            "w-5 h-5 transition-colors",
            value === 0 && "text-muted-foreground/30",
            value === 1 && "text-success fill-success",
            value === 2 && "text-destructive fill-destructive"
          )}
        />
      </button>
    ))}
    <button onClick={onReset} className="p-1 mr-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors" title="إعادة تعيين">
      <RotateCcw className="w-3.5 h-3.5" />
    </button>
    <button onClick={onFillGreen} className="p-1 text-success/50 hover:text-success transition-colors" title="الكل أخضر">
      <Star className="w-4 h-4 fill-current" />
    </button>
  </div>
);

const ClassroomManagement = () => {
  const navigate = useNavigate();
  const { loading, getStudentsByGradeAndSubject, getGradeSections } = useStudents();

  const [educationStage] = useState<EducationStage | ''>(() =>
    (localStorage.getItem('educationStage') as EducationStage) || ''
  );

  const [selectedSection, setSelectedSection] = useState<string>('');

  const {
    loadingClassroom,
    getBehaviorStars, toggleBehaviorStar, resetBehaviorStars, fillBehaviorGreen, fillBehaviorOneRed,
    getDisturbanceStars, toggleDisturbanceStar, resetDisturbanceStars, fillDisturbanceGreen, fillDisturbanceOneRed,
    getCooperationStars, toggleCooperationStar, resetCooperationStars, fillCooperationGreen, fillCooperationOneRed,
    getCleanlinessStars, toggleCleanlinessStar, resetCleanlinessStars, fillCleanlinessGreen, fillCleanlinessOneRed,
    groups, addGroup, deleteGroup, addGroupPoints, toggleGroupMember,
    notes, addNote, deleteNote,
  } = useClassroom(selectedSection);

  const [newNoteText, setNewNoteText] = useState('');
  const [newNoteStudentId, setNewNoteStudentId] = useState('');
  const [newNoteType, setNewNoteType] = useState<'positive' | 'negative' | 'general'>('general');
  const [newGroupName, setNewGroupName] = useState('');

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

  useEffect(() => {
    if (sectionsToShow.length > 0 && !selectedSection) {
      const first = sectionsToShow[0];
      setSelectedSection(`${first.grade}_${first.subject}_${first.sectionNumber}`);
    }
  }, [sectionsToShow, selectedSection]);

  const getSelectedStudents = () => {
    if (!selectedSection) return [];
    const parts = selectedSection.split('_');
    const gradeKey = `${parts[0]}_${parts[1]}`;
    const subjectKey = parts.slice(2, -1).join('_');
    const secNum = parseInt(parts[parts.length - 1]) || 1;
    return getStudentsByGradeAndSubject(gradeKey as any, subjectKey, secNum);
  };

  const selectedStudents = getSelectedStudents();

  const handleAddNote = () => {
    if (!newNoteText.trim() || !newNoteStudentId) return;
    const student = selectedStudents.find(s => s.id === newNoteStudentId);
    if (!student) return;
    addNote(newNoteStudentId, student.name, newNoteText, newNoteType);
    setNewNoteText('');
    setNewNoteStudentId('');
  };

  const handleAddGroup = () => {
    if (!newGroupName.trim()) return;
    addGroup(newGroupName);
    setNewGroupName('');
  };

  if (loading || loadingClassroom) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  const StarsTable = ({
    getStars,
    onToggle,
    onReset,
    onFillGreen,
    onFillOneRed,
  }: {
    getStars: (id: string) => StarsArray;
    onToggle: (id: string, index: number) => void;
    onReset: (id: string) => void;
    onFillGreen: (id: string) => void;
    onFillOneRed: (id: string) => void;
  }) => {
    const fillAllStudentsGreen = () => {
      selectedStudents.forEach(student => onFillGreen(student.id));
    };

    const resetAllStudents = () => {
      selectedStudents.forEach(student => onReset(student.id));
    };

    const fillAllStudentsOneRed = () => {
      selectedStudents.forEach(student => onFillOneRed(student.id));
    };

    return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30">
              <TableHead className="text-center w-10">#</TableHead>
              <TableHead className="min-w-[120px]">اسم الطالبة</TableHead>
              <TableHead className="text-center min-w-[280px]">
                <div className="flex items-center justify-center gap-2">
                  <span>التقييم</span>
                  <button
                    onClick={fillAllStudentsGreen}
                    className="p-1 text-success/60 hover:text-success transition-colors"
                    title="تعبئة الكل أخضر لجميع الطالبات"
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                  <button
                    onClick={fillAllStudentsOneRed}
                    className="p-1 text-destructive/60 hover:text-destructive transition-colors"
                    title="تعبئة نجمة حمراء واحدة لجميع الطالبات"
                  >
                    <Star className="w-5 h-5 fill-current" />
                  </button>
                  <button
                    onClick={resetAllStudents}
                    className="p-1 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                    title="إعادة تعيين جميع الطالبات"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {selectedStudents.map((student, idx) => (
              <TableRow key={student.id} className="hover:bg-accent/30">
                <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                <TableCell className="font-medium text-foreground">{student.name}</TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <StarRating
                      stars={getStars(student.id)}
                      onToggle={(i) => onToggle(student.id, i)}
                      onReset={() => onReset(student.id)}
                      onFillGreen={() => onFillGreen(student.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )};


  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <Header />

      <main className="container py-6 space-y-6">
        <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
          <ArrowRight className="w-4 h-4" />
          الرجوع للرئيسية
        </Button>

        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-foreground">الإدارة الصفية</h1>
          <p className="text-xs text-muted-foreground mt-1">اضغط على النجمة: فارغ ← أخضر ← أحمر</p>
        </div>

        {sectionsToShow.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {sectionsToShow.map(section => {
              const key = `${section.grade}_${section.subject}_${section.sectionNumber}`;
              const colorClass = gradeColors[section.grade];
              const label = `${gradeLabels[section.grade]} - فصل ${section.sectionNumber === 1 ? '١' : '٢'}`;
              return (
                <Button
                  key={key}
                  variant={selectedSection === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSection(key)}
                  className={cn(selectedSection === key && 'shadow-md')}
                  style={selectedSection === key ? { backgroundColor: `hsl(var(--${colorClass}))` } : {}}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        )}

        {sectionsToShow.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg">لا توجد بيانات طالبات</p>
            <p className="text-sm mt-2">قم بإضافة طالبات من صفحة أعمال السنة أولاً</p>
          </div>
        )}

        {selectedStudents.length > 0 && (
          <Tabs defaultValue="behavior" dir="rtl" className="w-full">
            <TabsList className="grid grid-cols-6 w-full max-w-3xl mx-auto">
              <TabsTrigger value="behavior" className="gap-1 text-xs sm:text-sm">
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">نقاط السلوك</span>
                <span className="sm:hidden">السلوك</span>
              </TabsTrigger>
              <TabsTrigger value="disturbance" className="gap-1 text-xs sm:text-sm">
                <ShieldAlert className="w-4 h-4" />
                <span>الإزعاج</span>
              </TabsTrigger>
              <TabsTrigger value="cooperation" className="gap-1 text-xs sm:text-sm">
                <Handshake className="w-4 h-4" />
                <span>التعاون</span>
              </TabsTrigger>
              <TabsTrigger value="cleanliness" className="gap-1 text-xs sm:text-sm">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">بيئة الفصل</span>
                <span className="sm:hidden">النظافة</span>
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-1 text-xs sm:text-sm">
                <Users2 className="w-4 h-4" />
                <span className="hidden sm:inline">المجموعات</span>
                <span className="sm:hidden">مجموعات</span>
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1 text-xs sm:text-sm">
                <StickyNote className="w-4 h-4" />
                <span className="hidden sm:inline">الملاحظات</span>
                <span className="sm:hidden">ملاحظات</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="behavior">
              <StarsTable getStars={getBehaviorStars} onToggle={toggleBehaviorStar} onReset={resetBehaviorStars} onFillGreen={fillBehaviorGreen} onFillOneRed={fillBehaviorOneRed} />
            </TabsContent>

            <TabsContent value="disturbance">
              <StarsTable getStars={getDisturbanceStars} onToggle={toggleDisturbanceStar} onReset={resetDisturbanceStars} onFillGreen={fillDisturbanceGreen} onFillOneRed={fillDisturbanceOneRed} />
            </TabsContent>

            <TabsContent value="cooperation">
              <StarsTable getStars={getCooperationStars} onToggle={toggleCooperationStar} onReset={resetCooperationStars} onFillGreen={fillCooperationGreen} onFillOneRed={fillCooperationOneRed} />
            </TabsContent>

            <TabsContent value="cleanliness">
              <StarsTable getStars={getCleanlinessStars} onToggle={toggleCleanlinessStar} onReset={resetCleanlinessStars} onFillGreen={fillCleanlinessGreen} onFillOneRed={fillCleanlinessOneRed} />
            </TabsContent>

            {/* المجموعات التعاونية */}
            <TabsContent value="groups">
              <div className="space-y-4">
                <div className="bg-card rounded-xl shadow-card p-4">
                  <div className="flex gap-2">
                    <Input
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="اسم المجموعة الجديدة..."
                      className="flex-1"
                      dir="rtl"
                    />
                    <Button onClick={handleAddGroup} className="gap-1">
                      <Plus className="w-4 h-4" />
                      إضافة
                    </Button>
                  </div>
                </div>

                {groups.map((group) => (
                  <div key={group.id} className="bg-card rounded-xl shadow-card overflow-hidden">
                    <div className="bg-primary/10 px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users2 className="w-5 h-5 text-primary" />
                        <h3 className="font-bold text-foreground">{group.name}</h3>
                        <span className={cn(
                          "inline-block py-0.5 px-2 rounded-full text-xs font-bold",
                          group.points > 0 ? "bg-success/15 text-success" : group.points < 0 ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"
                        )}>
                          {group.points} نقطة
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="iconSm" variant="ghost" onClick={() => addGroupPoints(group.id, 1)} className="text-success hover:bg-success/10">
                          <Plus className="w-4 h-4" />
                        </Button>
                        <Button size="iconSm" variant="ghost" onClick={() => addGroupPoints(group.id, -1)} className="text-destructive hover:bg-destructive/10">
                          <Minus className="w-4 h-4" />
                        </Button>
                        <Button size="iconSm" variant="ghost" onClick={() => deleteGroup(group.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {selectedStudents.map(student => {
                          const isMember = group.members.includes(student.id);
                          return (
                            <button
                              key={student.id}
                              onClick={() => toggleGroupMember(group.id, student.id)}
                              className={cn(
                                "px-3 py-1.5 rounded-full text-sm border transition-all",
                                isMember
                                  ? "bg-primary/15 border-primary/30 text-primary font-medium"
                                  : "bg-muted/50 border-border text-muted-foreground hover:border-primary/30"
                              )}
                            >
                              {student.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}

                {groups.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users2 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>لا توجد مجموعات - أضف مجموعة جديدة</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* سجل الملاحظات */}
            <TabsContent value="notes">
              <div className="space-y-4">
                <div className="bg-card rounded-xl shadow-card p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={newNoteStudentId}
                      onChange={(e) => setNewNoteStudentId(e.target.value)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      dir="rtl"
                    >
                      <option value="">اختر الطالبة...</option>
                      {selectedStudents.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-1">
                      {(['positive', 'negative', 'general'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setNewNoteType(type)}
                          className={cn(
                            "flex-1 py-1.5 rounded-md text-xs font-medium border transition-all",
                            newNoteType === type && type === 'positive' && "bg-success/15 border-success/30 text-success",
                            newNoteType === type && type === 'negative' && "bg-destructive/15 border-destructive/30 text-destructive",
                            newNoteType === type && type === 'general' && "bg-primary/15 border-primary/30 text-primary",
                            newNoteType !== type && "bg-muted/50 border-border text-muted-foreground"
                          )}
                        >
                          {type === 'positive' ? 'إيجابية' : type === 'negative' ? 'سلبية' : 'عامة'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="اكتب الملاحظة..."
                    className="min-h-[80px] resize-none"
                    dir="rtl"
                  />
                  <Button onClick={handleAddNote} className="gap-1">
                    <Plus className="w-4 h-4" />
                    إضافة ملاحظة
                  </Button>
                </div>

                <div className="space-y-2">
                  {notes.filter(n => selectedStudents.some(s => s.id === n.studentId)).map(note => (
                    <div key={note.id} className={cn(
                      "bg-card rounded-lg shadow-sm p-3 border-r-4",
                      note.type === 'positive' && "border-r-success",
                      note.type === 'negative' && "border-r-destructive",
                      note.type === 'general' && "border-r-primary"
                    )}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-sm text-foreground">{note.studentName}</span>
                            <span className="text-xs text-muted-foreground">{note.date}</span>
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded-full",
                              note.type === 'positive' && "bg-success/15 text-success",
                              note.type === 'negative' && "bg-destructive/15 text-destructive",
                              note.type === 'general' && "bg-primary/15 text-primary"
                            )}>
                              {note.type === 'positive' ? 'إيجابية' : note.type === 'negative' ? 'سلبية' : 'عامة'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{note.text}</p>
                        </div>
                        <Button size="iconSm" variant="ghost" onClick={() => deleteNote(note.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {notes.filter(n => selectedStudents.some(s => s.id === n.studentId)).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p>لا توجد ملاحظات بعد</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/50 bg-card/50">
        <p>نظام إدارة الدرجات © 2026</p>
        <p className="mt-1 font-medium text-foreground/70">الحقوق محفوظة للدكتورة نوير الحربي</p>
      </footer>
    </div>
  );
};

export default ClassroomManagement;
