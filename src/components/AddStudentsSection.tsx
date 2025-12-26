import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UserPlus, Users } from 'lucide-react';
import { Grade } from '@/types/student';

interface AddStudentsSectionProps {
  onAddStudents: (names: string[], grade: Grade) => void;
}

const AddStudentsSection = ({ onAddStudents }: AddStudentsSectionProps) => {
  const [studentNames, setStudentNames] = useState('');

  const handleAddToGrade = (grade: Grade) => {
    const names = studentNames
      .split('\n')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    if (names.length > 0) {
      onAddStudents(names, grade);
      setStudentNames('');
    }
  };

  return (
    <div className="bg-card rounded-xl shadow-card p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-primary/10 rounded-lg">
          <UserPlus className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground">إضافة الطالبات</h2>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            أسماء الطالبات (اسم واحد في كل سطر)
          </label>
          <Textarea
            value={studentNames}
            onChange={(e) => setStudentNames(e.target.value)}
            placeholder="أدخلي أسماء الطالبات هنا...&#10;مثال:&#10;فاطمة أحمد&#10;نورة محمد&#10;سارة علي"
            className="min-h-[140px] text-base resize-none bg-secondary/30 border-border/50 focus:border-primary focus:ring-primary/20"
            dir="rtl"
          />
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Button
            variant="gradeOne"
            onClick={() => handleAddToGrade('first')}
            className="flex-1 min-w-[140px]"
          >
            <Users className="w-4 h-4" />
            إضافة إلى الصف الأول
          </Button>
          <Button
            variant="gradeTwo"
            onClick={() => handleAddToGrade('second')}
            className="flex-1 min-w-[140px]"
          >
            <Users className="w-4 h-4" />
            إضافة إلى الصف الثاني
          </Button>
          <Button
            variant="gradeThree"
            onClick={() => handleAddToGrade('third')}
            className="flex-1 min-w-[140px]"
          >
            <Users className="w-4 h-4" />
            إضافة إلى الصف الثالث
          </Button>
          <Button
            variant="gradeFour"
            onClick={() => handleAddToGrade('fourth')}
            className="flex-1 min-w-[140px]"
          >
            <Users className="w-4 h-4" />
            إضافة إلى الصف الرابع
          </Button>
          <Button
            variant="gradeFive"
            onClick={() => handleAddToGrade('fifth')}
            className="flex-1 min-w-[140px]"
          >
            <Users className="w-4 h-4" />
            إضافة إلى الصف الخامس
          </Button>
          <Button
            variant="gradeSix"
            onClick={() => handleAddToGrade('sixth')}
            className="flex-1 min-w-[140px]"
          >
            <Users className="w-4 h-4" />
            إضافة إلى الصف السادس
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddStudentsSection;
