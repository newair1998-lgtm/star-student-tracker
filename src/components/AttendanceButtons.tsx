import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceButtonsProps {
  attendance: 'present' | 'absent' | null;
  onAttendanceChange: (status: 'present' | 'absent') => void;
}

const AttendanceButtons = ({ attendance, onAttendanceChange }: AttendanceButtonsProps) => {
  return (
    <div className="flex gap-0.5 justify-center">
      <button
        onClick={() => onAttendanceChange('present')}
        className={cn(
          "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200",
          attendance === 'present'
            ? "bg-success border-success text-success-foreground"
            : "border-muted-foreground/30 text-muted-foreground hover:border-success hover:text-success hover:bg-success/10"
        )}
      >
        <Check className="w-2.5 h-2.5" />
      </button>
      <button
        onClick={() => onAttendanceChange('absent')}
        className={cn(
          "w-5 h-5 rounded-full border flex items-center justify-center transition-all duration-200",
          attendance === 'absent'
            ? "bg-destructive border-destructive text-destructive-foreground"
            : "border-muted-foreground/30 text-muted-foreground hover:border-destructive hover:text-destructive hover:bg-destructive/10"
        )}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </div>
  );
};

export default AttendanceButtons;
