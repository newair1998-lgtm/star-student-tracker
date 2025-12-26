import { Student, Grade, gradeLabels } from '@/types/student';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Users, GraduationCap } from 'lucide-react';
import StudentRow from './StudentRow';
import { cn } from '@/lib/utils';

interface GradeSectionProps {
  grade: Grade;
  students: Student[];
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
}

const gradeHeaderColors: Record<Grade, string> = {
  fourth: 'from-grade-four/20 to-grade-four/5 border-grade-four/30',
  fifth: 'from-grade-five/20 to-grade-five/5 border-grade-five/30',
  sixth: 'from-grade-six/20 to-grade-six/5 border-grade-six/30',
};

const gradeIconColors: Record<Grade, string> = {
  fourth: 'bg-grade-four/20 text-grade-four',
  fifth: 'bg-grade-five/20 text-grade-five',
  sixth: 'bg-grade-six/20 text-grade-six',
};

const GradeSection = ({ grade, students, onUpdateStudent, onDeleteStudent }: GradeSectionProps) => {
  const presentCount = students.filter(s => s.attendance === 'present').length;
  const absentCount = students.filter(s => s.attendance === 'absent').length;

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
                <TableHead className="text-center w-24">الحضور</TableHead>
                <TableHead className="text-center w-20">
                  <div className="flex flex-col items-center">
                    <span>المهام الأدائية</span>
                    <span className="text-xs text-muted-foreground">(10)</span>
                  </div>
                </TableHead>
                <TableHead className="text-center w-20">
                  <div className="flex flex-col items-center">
                    <span>مشاركة</span>
                    <span className="text-xs text-muted-foreground">(10)</span>
                  </div>
                </TableHead>
                <TableHead className="text-center w-20">
                  <div className="flex flex-col items-center">
                    <span>الأنشطة الصفية</span>
                    <span className="text-xs text-muted-foreground">كتاب (10)</span>
                  </div>
                </TableHead>
                <TableHead className="text-center w-20">
                  <div className="flex flex-col items-center">
                    <span>واجبات</span>
                    <span className="text-xs text-muted-foreground">(10)</span>
                  </div>
                </TableHead>
                <TableHead className="text-center w-24">
                  <div className="flex flex-col items-center">
                    <span>مجموع المهام</span>
                    <span className="text-xs text-muted-foreground">(40)</span>
                  </div>
                </TableHead>
                <TableHead className="text-center w-20">
                  <div className="flex flex-col items-center">
                    <span>اختبار ١</span>
                    <span className="text-xs text-muted-foreground">(30)</span>
                  </div>
                </TableHead>
                <TableHead className="text-center w-20">
                  <div className="flex flex-col items-center">
                    <span>اختبار ٢</span>
                    <span className="text-xs text-muted-foreground">(30)</span>
                  </div>
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
