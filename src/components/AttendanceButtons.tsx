import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AttendanceButtonsProps {
  attendance: ('present' | 'absent' | null)[];
  onAttendanceChange: (index: number, status: 'present' | 'absent') => void;
}

const AttendanceButtons = ({ attendance, onAttendanceChange }: AttendanceButtonsProps) => {
  // Ensure we always have 5 items
  const attendanceArray = [...(attendance || []), null, null, null, null, null].slice(0, 5);

  return (
    <div className="flex gap-2 justify-center">
      {/* 5 Present buttons */}
      <div className="flex gap-0.5">
        {attendanceArray.map((status, index) => (
          <button
            key={`present-${index}`}
            onClick={() => onAttendanceChange(index, 'present')}
            className={cn(
              "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200",
              status === 'present'
                ? "bg-success border-success text-success-foreground"
                : "border-muted-foreground/30 text-muted-foreground hover:border-success hover:text-success hover:bg-success/10"
            )}
          >
            <Check className="w-3 h-3" />
          </button>
        ))}
      </div>
      
      {/* 5 Absent buttons */}
      <div className="flex gap-0.5">
        {attendanceArray.map((status, index) => (
          <button
            key={`absent-${index}`}
            onClick={() => onAttendanceChange(index, 'absent')}
            className={cn(
              "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200",
              status === 'absent'
                ? "bg-destructive border-destructive text-destructive-foreground"
                : "border-muted-foreground/30 text-muted-foreground hover:border-destructive hover:text-destructive hover:bg-destructive/10"
            )}
          >
            <X className="w-3 h-3" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default AttendanceButtons;
