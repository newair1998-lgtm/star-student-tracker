import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AttendanceButtonsProps {
  attendance: 'present' | 'absent' | null;
  onAttendanceChange: (status: 'present' | 'absent') => void;
}

const AttendanceButtons = ({ attendance, onAttendanceChange }: AttendanceButtonsProps) => {
  return (
    <div className="flex gap-1.5 justify-center">
      <Button
        variant="attendance"
        size="iconSm"
        onClick={() => onAttendanceChange('present')}
        className={cn(
          "rounded-full",
          attendance === 'present'
            ? "bg-success border-success text-success-foreground"
            : "border-muted-foreground/30 text-muted-foreground hover:border-success hover:text-success hover:bg-success/10"
        )}
      >
        <Check className="w-4 h-4" />
      </Button>
      <Button
        variant="attendance"
        size="iconSm"
        onClick={() => onAttendanceChange('absent')}
        className={cn(
          "rounded-full",
          attendance === 'absent'
            ? "bg-destructive border-destructive text-destructive-foreground"
            : "border-muted-foreground/30 text-muted-foreground hover:border-destructive hover:text-destructive hover:bg-destructive/10"
        )}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default AttendanceButtons;
