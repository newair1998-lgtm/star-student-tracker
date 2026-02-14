import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudents } from '@/hooks/useStudents';
import { useClassroom } from '@/hooks/useClassroom';
import Header from '@/components/Header';
import { ArrowRight, Star, Users2, StickyNote, ShieldAlert, Loader2, Plus, Minus, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { EducationStage, getGradesForStage, gradeLabels, gradeColors, GradeSection as GradeSectionType } from '@/types/student';

const ClassroomManagement = () => {
  const navigate = useNavigate();
  const { loading, getStudentsByGradeAndSubject, getGradeSections } = useStudents();

  const [educationStage] = useState<EducationStage | ''>(() =>
    (localStorage.getItem('educationStage') as EducationStage) || ''
  );

  const [selectedSection, setSelectedSection] = useState<string>('');

  const {
    loadingClassroom,
    getBehavior,
    addPoints,
    resetBehavior,
    getDisturbance,
    addDisturbance,
    resetDisturbance,
    groups,
    addGroup,
    deleteGroup,
    addGroupPoints,
    toggleGroupMember,
    notes,
    addNote,
    deleteNote,
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
            <TabsList className="grid grid-cols-4 w-full max-w-2xl mx-auto">
              <TabsTrigger value="behavior" className="gap-1 text-xs sm:text-sm">
                <Star className="w-4 h-4" />
                نقاط السلوك
              </TabsTrigger>
              <TabsTrigger value="disturbance" className="gap-1 text-xs sm:text-sm">
                <ShieldAlert className="w-4 h-4" />
                عدم الإزعاج
              </TabsTrigger>
              <TabsTrigger value="groups" className="gap-1 text-xs sm:text-sm">
                <Users2 className="w-4 h-4" />
                المجموعات
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-1 text-xs sm:text-sm">
                <StickyNote className="w-4 h-4" />
                الملاحظات
              </TabsTrigger>
            </TabsList>

            {/* نقاط السلوك */}
            <TabsContent value="behavior">
              <div className="bg-card rounded-xl shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/30">
                        <TableHead className="text-center w-10">#</TableHead>
                        <TableHead className="min-w-[140px]">اسم الطالبة</TableHead>
                        <TableHead className="text-center">النقاط</TableHead>
                        <TableHead className="text-center">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStudents.map((student, idx) => {
                        const behavior = getBehavior(student.id);
                        return (
                          <TableRow key={student.id} className="hover:bg-accent/30">
                            <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="font-medium text-foreground">{student.name}</TableCell>
                            <TableCell className="text-center">
                              <span className={cn(
                                "inline-block min-w-[40px] py-1 px-3 rounded-full font-bold text-sm",
                                behavior.points > 0 && "bg-success/15 text-success",
                                behavior.points < 0 && "bg-destructive/15 text-destructive",
                                behavior.points === 0 && "bg-muted text-muted-foreground"
                              )}>
                                {behavior.points}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button size="iconSm" variant="ghost" onClick={() => addPoints(student.id, 1)} className="text-success hover:bg-success/10">
                                  <Plus className="w-4 h-4" />
                                </Button>
                                <Button size="iconSm" variant="ghost" onClick={() => addPoints(student.id, -1)} className="text-destructive hover:bg-destructive/10">
                                  <Minus className="w-4 h-4" />
                                </Button>
                                <Button size="iconSm" variant="ghost" onClick={() => resetBehavior(student.id)} className="text-muted-foreground hover:bg-muted">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            {/* عدم الإزعاج */}
            <TabsContent value="disturbance">
              <div className="bg-card rounded-xl shadow-card overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-secondary/30">
                        <TableHead className="text-center w-10">#</TableHead>
                        <TableHead className="min-w-[140px]">اسم الطالبة</TableHead>
                        <TableHead className="text-center">عدد المخالفات</TableHead>
                        <TableHead className="text-center">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStudents.map((student, idx) => {
                        const record = getDisturbance(student.id);
                        return (
                          <TableRow key={student.id} className="hover:bg-accent/30">
                            <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="font-medium text-foreground">{student.name}</TableCell>
                            <TableCell className="text-center">
                              <span className={cn(
                                "inline-block min-w-[40px] py-1 px-3 rounded-full font-bold text-sm",
                                record.count > 0 ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success"
                              )}>
                                {record.count}
                              </span>
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button size="iconSm" variant="ghost" onClick={() => addDisturbance(student.id)} className="text-destructive hover:bg-destructive/10">
                                  <Plus className="w-4 h-4" />
                                </Button>
                                <Button size="iconSm" variant="ghost" onClick={() => resetDisturbance(student.id)} className="text-muted-foreground hover:bg-muted">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
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
