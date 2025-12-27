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
import { Copy } from 'lucide-react';
import { Grade, gradeLabels } from '@/types/student';

interface DuplicateSameGradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade: Grade;
  studentsCount: number;
  onConfirm: () => void;
}

export const DuplicateSameGradeDialog = ({
  open,
  onOpenChange,
  grade,
  studentsCount,
  onConfirm,
}: DuplicateSameGradeDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5" />
            تكرار لمادة أخرى
          </AlertDialogTitle>
          <AlertDialogDescription>
            سيتم نسخ {studentsCount} طالبة من {gradeLabels[grade]} إلى نفس الصف مرة أخرى.
            <br />
            هذا مفيد لاستخدام نفس الطالبات في مادة دراسية أخرى.
            <br />
            <span className="text-muted-foreground text-xs mt-2 block">
              ملاحظة: سيتم إنشاء سجلات جديدة بدون درجات.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            تكرار الطالبات
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
