import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AttendanceRecord } from '@/types/student';

interface AttendanceButtonsProps {
  attendance: AttendanceRecord;
  onToggleSlot: (index: number) => void;
}

const DEFAULT_ATTENDANCE: AttendanceRecord = {
  present: [false, false, false, false],
  absent: [false, false, false, false],
};

const AttendanceButtons = ({ attendance, onToggleSlot }: AttendanceButtonsProps) => {
  const safeAttendance = attendance || DEFAULT_ATTENDANCE;
  const presentArray = safeAttendance.present || [false, false, false, false];
  const absentArray = safeAttendance.absent || [false, false, false, false];

  const getSlotState = (index: number): 'present' | 'absent' | 'none' => {
    if (presentArray[index]) return 'present';
    if (absentArray[index]) return 'absent';
    return 'none';
  };

  return (
    <div className="flex gap-0.5 items-center">
      {[0, 1, 2, 3].map((index) => {
        const state = getSlotState(index);
        return (
          <button
            key={`slot-${index}`}
            onClick={() => onToggleSlot(index)}
            className={cn(
              "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-200",
              state === 'present' && "bg-success border-success text-success-foreground",
              state === 'absent' && "bg-destructive border-destructive text-destructive-foreground",
              state === 'none' && "border-muted-foreground/30 text-muted-foreground hover:border-success hover:text-success hover:bg-success/10"
            )}
          >
            {state === 'absent' ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
          </button>
        );
      })}
    </div>
  );
};

export default AttendanceButtons;
