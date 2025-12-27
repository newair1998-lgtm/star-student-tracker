import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CopyPlus } from 'lucide-react';
import { Grade, gradeLabels } from '@/types/student';

interface DuplicateSameGradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: Grade;
  studentsCount: number;
  onConfirm: (includeScores: boolean) => void;
}

export const DuplicateSameGradeDialog = ({
  open,
  onOpenChange,
  grade,
  studentsCount,
  onConfirm,
}: DuplicateSameGradeDialogProps) => {
  const [includeScores, setIncludeScores] = useState(true);

  const handleConfirm = () => {
    onConfirm(includeScores);
    onOpenChange(false);
    setIncludeScores(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CopyPlus className="w-5 h-5" />
            تكرار لمادة أخرى
          </DialogTitle>
          <DialogDescription>
            سيتم نسخ {studentsCount} طالبة من {gradeLabels[grade]} إلى نفس الصف مرة أخرى.
            <br />
            هذا مفيد لاستخدام نفس الطالبات في مادة دراسية أخرى.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox 
              id="includeScoresSame" 
              checked={includeScores} 
              onCheckedChange={(checked) => setIncludeScores(checked as boolean)}
            />
            <label
              htmlFor="includeScoresSame"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              نسخ الدرجات والحضور أيضاً
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleConfirm}>
            تكرار الطالبات
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
