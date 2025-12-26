import { Student } from '@/types/student';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import AttendanceButtons from './AttendanceButtons';
import ScoreInput from './ScoreInput';
import { cn } from '@/lib/utils';

interface StudentRowProps {
  student: Student;
  index: number;
  onUpdate: (id: string, updates: Partial<Student>) => void;
  onDelete: (id: string) => void;
}

const StudentRow = ({ student, index, onUpdate, onDelete }: StudentRowProps) => {
  const tasksTotal = student.performanceTasks + student.participation + student.book + student.homework;
  const examsTotal = student.exam1 + student.exam2;
  const finalTotal = tasksTotal + examsTotal;

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
          attendance={student.attendance}
          onAttendanceChange={(status) => onUpdate(student.id, { attendance: status })}
        />
      </TableCell>
      <TableCell className="text-center">
        <ScoreInput
          value={student.performanceTasks}
          max={10}
          onChange={(value) => onUpdate(student.id, { performanceTasks: value })}
        />
      </TableCell>
      <TableCell className="text-center">
        <ScoreInput
          value={student.participation}
          max={10}
          onChange={(value) => onUpdate(student.id, { participation: value })}
        />
      </TableCell>
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
          max={30}
          onChange={(value) => onUpdate(student.id, { exam1: value })}
        />
      </TableCell>
      <TableCell className="text-center">
        <ScoreInput
          value={student.exam2}
          max={30}
          onChange={(value) => onUpdate(student.id, { exam2: value })}
        />
      </TableCell>
      <TableCell className={cn("text-center font-bold", getScoreColor(finalTotal, 100))}>
        <div className="bg-primary/10 rounded-md py-1 px-2 inline-block min-w-[50px]">
          {finalTotal}/100
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
