import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ScoreInputProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
}

const ScoreInput = ({ value, max, onChange, className }: ScoreInputProps) => {
  const [localValue, setLocalValue] = useState(value.toString());
  const [isLocked, setIsLocked] = useState(value > 0);
  const [showConfirm, setShowConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value.toString());
    setIsLocked(value > 0);
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (isLocked) {
      e.target.blur();
      setShowConfirm(true);
    }
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    setIsLocked(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setLocalValue(inputValue);
    
    const numValue = parseInt(inputValue) || 0;
    const clampedValue = Math.min(Math.max(0, numValue), max);
    onChange(clampedValue);
  };

  const handleBlur = () => {
    const numValue = parseInt(localValue) || 0;
    const clampedValue = Math.min(Math.max(0, numValue), max);
    setLocalValue(clampedValue.toString());
    onChange(clampedValue);
    if (clampedValue > 0) {
      setIsLocked(true);
    }
  };

  return (
    <>
      <Input
        ref={inputRef}
        type="number"
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        min={0}
        max={max}
        className={cn(
          "w-14 h-8 text-center text-sm font-medium px-1 bg-secondary/50 border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20",
          isLocked && "cursor-pointer",
          className
        )}
      />
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد تعديل الدرجة</AlertDialogTitle>
            <AlertDialogDescription>
              الدرجة الحالية هي {value}. هل تريدين تعديلها؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              تعديل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ScoreInput;
