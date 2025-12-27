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
import { ArrowLeftRight } from 'lucide-react';

interface TransferStudentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  currentGrade: Grade;
  onTransfer: (newGrade: Grade) => void;
}

export const TransferStudentDialog = ({
  open,
  onOpenChange,
  studentName,
  currentGrade,
  onTransfer,
}: TransferStudentDialogProps) => {
  const currentStage = getStageFromGrade(currentGrade);
  const [selectedStage, setSelectedStage] = useState<EducationStage>(currentStage);
  const [selectedGrade, setSelectedGrade] = useState<Grade | ''>('');

  const availableGrades = getGradesForStage(selectedStage).filter(g => g !== currentGrade);

  const handleTransfer = () => {
    if (selectedGrade) {
      onTransfer(selectedGrade);
      onOpenChange(false);
      setSelectedGrade('');
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
            <ArrowLeftRight className="w-5 h-5" />
            نقل الطالبة
          </DialogTitle>
          <DialogDescription>
            نقل الطالبة "{studentName}" من {gradeLabels[currentGrade]} إلى صف آخر
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
            <label className="text-sm font-medium">الصف الجديد</label>
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
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button onClick={handleTransfer} disabled={!selectedGrade}>
            نقل الطالبة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
