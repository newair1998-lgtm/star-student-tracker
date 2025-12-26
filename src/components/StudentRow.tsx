import { Student, AttendanceRecord } from '@/types/student';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import AttendanceButtons from './AttendanceButtons';
import ScoreInput from './ScoreInput';
import { cn } from '@/lib/utils';

const DEFAULT_ATTENDANCE: AttendanceRecord = {
  present: [false, false, false, false],
  absent: [false, false, false, false],
};

interface StudentRowProps {
  student: Student;
  index: number;
  onUpdate: (id: string, updates: Partial<Student>) => void;
  onDelete: (id: string) => void;
  performanceTasksMax?: number;
  exam1Max?: number;
  exam2Max?: number;
  finalTotalMax?: number;
}

const StudentRow = ({ student, index, onUpdate, onDelete, performanceTasksMax = 10, exam1Max = 30, exam2Max = 30, finalTotalMax = 100 }: StudentRowProps) => {
  const tasksTotal = performanceTasksMax === 20 
    ? Math.min(student.performanceTasks, 20) + student.book + student.homework 
    : student.performanceTasks + student.participation + student.book + student.homework;
  const examsTotal = Math.min(student.exam1, exam1Max) + Math.min(student.exam2, exam2Max);
  const finalTotal = finalTotalMax === 60 
    ? Math.min(tasksTotal + examsTotal, 60) 
    : tasksTotal + examsTotal;

  const getScoreColor = (score: number, max: number) => {
    const percentage = (score / max) * 100;
    if (percentage >= 80) return 'text-success font-bold';
    if (percentage >= 60) return 'text-foreground font-medium';
    if (percentage >= 40) return 'text-warning font-medium';
    return 'text-destructive font-bold';
  };

  return (
    <TableRow className="hover:bg-accent/30 transition-colors">
      <TableCell className="font-medium text-muted-foreground text-center w-10">
        {index + 1}
      </TableCell>
      <TableCell className="font-medium text-foreground min-w-[140px]">
        {student.name}
      </TableCell>
      <TableCell>
        <AttendanceButtons
          attendance={student.attendance || DEFAULT_ATTENDANCE}
          onAttendanceChange={(type, idx) => {
            const currentAttendance = student.attendance || DEFAULT_ATTENDANCE;
            const newAttendance: AttendanceRecord = {
              present: [...currentAttendance.present],
              absent: [...currentAttendance.absent],
            };
            newAttendance[type][idx] = !newAttendance[type][idx];
            onUpdate(student.id, { attendance: newAttendance });
          }}
        />
      </TableCell>
      <TableCell className="text-center">
        <ScoreInput
          value={student.performanceTasks}
          max={performanceTasksMax}
          onChange={(value) => onUpdate(student.id, { performanceTasks: value })}
        />
      </TableCell>
      {performanceTasksMax === 10 && (
        <TableCell className="text-center">
          <ScoreInput
            value={student.participation}
            max={10}
            onChange={(value) => onUpdate(student.id, { participation: value })}
          />
        </TableCell>
      )}
      <TableCell className="text-center">
        <ScoreInput
          value={student.book}
          max={10}
          onChange={(value) => onUpdate(student.id, { book: value })}
        />
      </TableCell>
      <TableCell className="text-center">
        <ScoreInput
          value={student.homework}
          max={10}
          onChange={(value) => onUpdate(student.id, { homework: value })}
        />
      </TableCell>
      <TableCell className={cn("text-center font-bold", getScoreColor(tasksTotal, 40))}>
        <div className="bg-accent/50 rounded-md py-1 px-2 inline-block min-w-[40px]">
          {tasksTotal}/40
        </div>
      </TableCell>
      <TableCell className="text-center">
        <ScoreInput
          value={student.exam1}
          max={exam1Max}
          onChange={(value) => onUpdate(student.id, { exam1: value })}
        />
      </TableCell>
      <TableCell className="text-center">
        <ScoreInput
          value={student.exam2}
          max={exam2Max}
          onChange={(value) => onUpdate(student.id, { exam2: value })}
        />
      </TableCell>
      <TableCell className={cn("text-center font-bold", getScoreColor(finalTotal, finalTotalMax))}>
        <div className="bg-primary/10 rounded-md py-1 px-2 inline-block min-w-[50px]">
          {finalTotal}/{finalTotalMax}
        </div>
      </TableCell>
      <TableCell className="text-center">
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => onDelete(student.id)}
          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default StudentRow;
