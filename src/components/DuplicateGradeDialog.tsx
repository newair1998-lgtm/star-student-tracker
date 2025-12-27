import { useState } from 'react';
import { Grade, gradeLabels, getGradesForStage, EducationStage, stageLabels, getStageFromGrade } from '@/types/student';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Copy } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface DuplicateGradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceGrade: Grade;
  studentsCount: number;
  onDuplicate: (targetGrade: Grade, includeScores: boolean) => void;
}

export const DuplicateGradeDialog = ({
  open,
  onOpenChange,
  sourceGrade,
  studentsCount,
  onDuplicate,
}: DuplicateGradeDialogProps) => {
  const currentStage = getStageFromGrade(sourceGrade);
  const [selectedStage, setSelectedStage] = useState<EducationStage>(currentStage);
  const [selectedGrade, setSelectedGrade] = useState<Grade | ''>('');
  const [includeScores, setIncludeScores] = useState(false);

  const availableGrades = getGradesForStage(selectedStage).filter(g => g !== sourceGrade);

  const handleDuplicate = () => {
    if (selectedGrade) {
      onDuplicate(selectedGrade, includeScores);
      onOpenChange(false);
      setSelectedGrade('');
      setIncludeScores(false);
    }
  };

  const handleStageChange = (stage: EducationStage) => {
    setSelectedStage(stage);
    setSelectedGrade('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            تكرار الصف
          </DialogTitle>
          <DialogDescription>
            نسخ طالبات {gradeLabels[sourceGrade]} ({studentsCount} طالبة) إلى صف آخر
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">المرحلة الدراسية</label>
            <Select value={selectedStage} onValueChange={(val) => handleStageChange(val as EducationStage)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="اختر المرحلة" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="primary">{stageLabels.primary}</SelectItem>
                <SelectItem value="middle">{stageLabels.middle}</SelectItem>
                <SelectItem value="secondary">{stageLabels.secondary}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">الصف المستهدف</label>
            <Select value={selectedGrade} onValueChange={(val) => setSelectedGrade(val as Grade)}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="اختر الصف" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {availableGrades.map((grade) => (
                  <SelectItem key={grade} value={grade}>
                    {gradeLabels[grade]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <Checkbox 
              id="includeScores" 
              checked={includeScores} 
              onCheckedChange={(checked) => setIncludeScores(checked as boolean)}
            />
            <label
              htmlFor="includeScores"
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
          <Button onClick={handleDuplicate} disabled={!selectedGrade}>
            تكرار الصف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
