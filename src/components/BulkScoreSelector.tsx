import { Button } from '@/components/ui/button';

interface BulkScoreSelectorProps {
  max: number;
  onSelect: (value: number) => void;
  label: string;
  subLabel?: string;
}

const BulkScoreSelector = ({ max, onSelect, label, subLabel }: BulkScoreSelectorProps) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-sm">{label}</span>
      {subLabel && <span className="text-xs text-muted-foreground">{subLabel}</span>}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSelect(max)}
        className="h-7 min-w-[40px] text-xs bg-primary/10 border-primary/20 hover:bg-primary/20 hover:text-primary"
      >
        {max}
      </Button>
    </div>
  );
};

export default BulkScoreSelector;
