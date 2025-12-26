import { Student, Grade, gradeLabels } from '@/types/student';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap } from 'lucide-react';
import StudentRow from './StudentRow';
import BulkScoreSelector from './BulkScoreSelector';
import { cn } from '@/lib/utils';

interface GradeSectionProps {
  grade: Grade;
  students: Student[];
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onBulkUpdate?: (studentIds: string[], updates: Partial<Student>) => void;
}

const gradeHeaderColors: Record<Grade, string> = {
  first: 'from-grade-one/20 to-grade-one/5 border-grade-one/30',
  second: 'from-grade-two/20 to-grade-two/5 border-grade-two/30',
  third: 'from-grade-three/20 to-grade-three/5 border-grade-three/30',
  fourth: 'from-grade-four/20 to-grade-four/5 border-grade-four/30',
  fifth: 'from-grade-five/20 to-grade-five/5 border-grade-five/30',
  sixth: 'from-grade-six/20 to-grade-six/5 border-grade-six/30',
};

const gradeIconColors: Record<Grade, string> = {
  first: 'bg-grade-one/20 text-grade-one',
  second: 'bg-grade-two/20 text-grade-two',
  third: 'bg-grade-three/20 text-grade-three',
  fourth: 'bg-grade-four/20 text-grade-four',
  fifth: 'bg-grade-five/20 text-grade-five',
  sixth: 'bg-grade-six/20 text-grade-six',
};

const GradeSection = ({ grade, students, onUpdateStudent, onDeleteStudent, onBulkUpdate }: GradeSectionProps) => {
  const presentCount = students.reduce((sum, s) => sum + (s.attendance || []).filter(a => a === 'present').length, 0);
  const absentCount = students.reduce((sum, s) => sum + (s.attendance || []).filter(a => a === 'absent').length, 0);

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

  const handleBulkAttendance = (status: 'present' | 'absent') => {
    students.forEach(student => {
      const newAttendance: ('present' | 'absent' | null)[] = [status, status, status, status, status];
      onUpdateStudent(student.id, { attendance: newAttendance });
    });
  };

  return (
    <div className="bg-card rounded-xl shadow-card overflow-hidden animate-fade-in">
      {/* Header */}
      <div className={cn(
        "px-5 py-4 bg-gradient-to-l border-b",
        gradeHeaderColors[grade]
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", gradeIconColors[grade])}>
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{gradeLabels[grade]}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {students.length} طالبة
              </p>
            </div>
          </div>
          
          {students.length > 0 && (
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success"></span>
                <span className="text-muted-foreground">حاضرات: {presentCount}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-destructive"></span>
                <span className="text-muted-foreground">غائبات: {absentCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      {students.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                <TableHead className="text-center w-10">#</TableHead>
                <TableHead className="min-w-[140px]">اسم الطالبة</TableHead>
                <TableHead className="text-center w-24">
                  <div className="flex flex-col items-center gap-1">
                    <span>الحضور</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAttendance('present')}
                      className="h-6 text-xs bg-success/10 border-success/20 hover:bg-success/20 text-success"
                    >
                      حضور الكل
                    </Button>
                  </div>
                </TableHead>
                <TableHead className="text-center w-20">
                  <BulkScoreSelector
                    max={10}
                    label="المهام الأدائية"
                    subLabel="(10)"
                    onSelect={(value) => handleBulkScoreUpdate('performanceTasks', value)}
                  />
                </TableHead>
                <TableHead className="text-center w-20">
                  <BulkScoreSelector
                    max={10}
                    label="مشاركة"
                    subLabel="(10)"
                    onSelect={(value) => handleBulkScoreUpdate('participation', value)}
                  />
                </TableHead>
                <TableHead className="text-center w-20">
                  <BulkScoreSelector
                    max={10}
                    label="الأنشطة الصفية"
                    subLabel="كتاب (10)"
                    onSelect={(value) => handleBulkScoreUpdate('book', value)}
                  />
                </TableHead>
                <TableHead className="text-center w-20">
                  <BulkScoreSelector
                    max={10}
                    label="واجبات"
                    subLabel="(10)"
                    onSelect={(value) => handleBulkScoreUpdate('homework', value)}
                  />
                </TableHead>
                <TableHead className="text-center w-24">
                  <div className="flex flex-col items-center">
                    <span>مجموع المهام</span>
                    <span className="text-xs text-muted-foreground">(40)</span>
                  </div>
                </TableHead>
                <TableHead className="text-center w-20">
                  <BulkScoreSelector
                    max={30}
                    label="اختبار ١"
                    subLabel="(30)"
                    onSelect={(value) => handleBulkScoreUpdate('exam1', value)}
                  />
                </TableHead>
                <TableHead className="text-center w-20">
                  <BulkScoreSelector
                    max={30}
                    label="اختبار ٢"
                    subLabel="(30)"
                    onSelect={(value) => handleBulkScoreUpdate('exam2', value)}
                  />
                </TableHead>
                <TableHead className="text-center w-28">
                  <div className="flex flex-col items-center">
                    <span>المجموع النهائي</span>
                    <span className="text-xs text-muted-foreground">(100)</span>
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
                />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="py-12 text-center">
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">لا توجد طالبات في هذا الصف</p>
          <p className="text-sm text-muted-foreground/70 mt-1">أضيفي طالبات من القسم أعلاه</p>
        </div>
      )}
    </div>
  );
};

export default GradeSection;
