import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttendanceRecord } from '@/types/student';

interface AttendanceButtonsProps {
  attendance: AttendanceRecord;
  onAttendanceChange: (type: 'present' | 'absent', index: number) => void;
}

const DEFAULT_ATTENDANCE: AttendanceRecord = {
  present: [false, false, false, false],
  absent: [false, false, false, false],
};

const AttendanceButtons = ({ attendance, onAttendanceChange }: AttendanceButtonsProps) => {
  const safeAttendance = attendance || DEFAULT_ATTENDANCE;
  const presentArray = safeAttendance.present || [false, false, false, false];
  const absentArray = safeAttendance.absent || [false, false, false, false];

  return (
    <div className="flex flex-col gap-1 items-center">
      {/* 4 Present buttons on top */}
      <div className="flex gap-0.5">
        {presentArray.map((isPresent, index) => (
          <button
            key={`present-${index}`}
            onClick={() => onAttendanceChange('present', index)}
            className={cn(
              "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200",
              isPresent
                ? "bg-success border-success text-success-foreground"
                : "border-muted-foreground/30 text-muted-foreground hover:border-success hover:text-success hover:bg-success/10"
            )}
          >
            <Check className="w-3 h-3" />
          </button>
        ))}
      </div>
      
      {/* 4 Absent buttons below */}
      <div className="flex gap-0.5">
        {absentArray.map((isAbsent, index) => (
          <button
            key={`absent-${index}`}
            onClick={() => onAttendanceChange('absent', index)}
            className={cn(
              "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200",
              isAbsent
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
