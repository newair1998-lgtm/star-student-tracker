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
import { Input } from '@/components/ui/input';
import { CopyPlus } from 'lucide-react';
import { Grade, gradeLabels } from '@/types/student';

interface DuplicateSameGradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: Grade;
  subject: string;
  studentsCount: number;
  onConfirm: (newSubject: string, includeScores: boolean) => void;
}

export const DuplicateSameGradeDialog = ({
  open,
  onOpenChange,
  grade,
  subject,
  studentsCount,
  onConfirm,
}: DuplicateSameGradeDialogProps) => {
  const [includeScores, setIncludeScores] = useState(true);
  const [newSubject, setNewSubject] = useState('');

  const handleConfirm = () => {
    const subjectName = newSubject.trim() || `مادة ${Date.now()}`;
    onConfirm(subjectName, includeScores);
    onOpenChange(false);
    setIncludeScores(true);
    setNewSubject('');
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
    if (!isOpen) {
      setNewSubject('');
      setIncludeScores(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CopyPlus className="w-5 h-5" />
            تكرار لمادة أخرى
          </DialogTitle>
          <DialogDescription>
            سيتم نسخ {studentsCount} طالبة من {gradeLabels[grade]}
            {subject !== 'default' && ` (${subject})`} إلى نفس الصف لمادة جديدة.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">اسم المادة الجديدة</label>
            <Input
              placeholder="مثال: الرياضيات، العلوم، اللغة العربية..."
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              className="bg-background"
            />
          </div>

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
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleConfirm}>
            تكرار الصف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
