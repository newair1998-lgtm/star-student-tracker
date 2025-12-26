import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BulkScoreSelectorProps {
  max: number;
  onSelect: (value: number) => void;
  label: string;
  subLabel?: string;
}

const BulkScoreSelector = ({ max, onSelect, label, subLabel }: BulkScoreSelectorProps) => {
  const options = Array.from({ length: max + 1 }, (_, i) => i);

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sm">{label}</span>
      {subLabel && <span className="text-xs text-muted-foreground">{subLabel}</span>}
      <Select onValueChange={(value) => onSelect(Number(value))}>
        <SelectTrigger className="h-7 w-16 text-xs bg-primary/10 border-primary/20 hover:bg-primary/20">
          <SelectValue placeholder="الكل" />
        </SelectTrigger>
        <SelectContent>
          {options.map((value) => (
            <SelectItem key={value} value={String(value)} className="text-sm">
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default BulkScoreSelector;
