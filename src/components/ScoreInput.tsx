import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ScoreInputProps {
  value: number;
  max: number;
  onChange: (value: number) => void;
  className?: string;
}

const ScoreInput = ({ value, max, onChange, className }: ScoreInputProps) => {
  const [localValue, setLocalValue] = useState(value.toString());

  useEffect(() => {
    setLocalValue(value.toString());
  }, [value]);

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
  };

  return (
    <Input
      type="number"
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      min={0}
      max={max}
      className={cn(
        "w-14 h-8 text-center text-sm font-medium px-1 bg-secondary/50 border-border/50 focus:border-primary focus:ring-1 focus:ring-primary/20",
        className
      )}
    />
  );
};

export default ScoreInput;
