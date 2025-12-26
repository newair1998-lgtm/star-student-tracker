import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Users, BookOpen, User } from 'lucide-react';
import { Grade } from '@/types/student';

interface AddStudentsSectionProps {
  onAddStudents: (names: string[], grade: Grade) => void;
}

const AddStudentsSection = ({ onAddStudents }: AddStudentsSectionProps) => {
  const [studentNames, setStudentNames] = useState('');
  const [subject, setSubject] = useState(() => localStorage.getItem('subject') || '');
  const [teacherName, setTeacherName] = useState(() => localStorage.getItem('teacherName') || '');
  const [semester, setSemester] = useState(() => localStorage.getItem('semester') || '');
  const [academicYear, setAcademicYear] = useState(() => localStorage.getItem('academicYear') || '');

  useEffect(() => {
    localStorage.setItem('subject', subject);
  }, [subject]);

  useEffect(() => {
    localStorage.setItem('teacherName', teacherName);
  }, [teacherName]);

  useEffect(() => {
    localStorage.setItem('semester', semester);
  }, [semester]);

  useEffect(() => {
    localStorage.setItem('academicYear', academicYear);
  }, [academicYear]);

  const handleAddToGrade = (grade: Grade) => {
    const names = studentNames
      .split('\n')
      .map(name => {
        // Remove leading numbers, dots, dashes, and spaces (e.g., "1. فاطمة" or "1- فاطمة" or "1 فاطمة")
        return name.trim().replace(/^[\d\s.\-\)]+/, '').trim();
      })
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
        {/* Subject, Teacher Name, Semester, and Academic Year Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              المادة
            </label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="أدخلي اسم المادة..."
              className="bg-secondary/30 border-border/50 focus:border-primary focus:ring-primary/20"
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <User className="w-4 h-4" />
              اسم المعلمة
            </label>
            <Input
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="أدخلي اسم المعلمة..."
              className="bg-secondary/30 border-border/50 focus:border-primary focus:ring-primary/20"
              dir="rtl"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              الفصل الدراسي
            </label>
            <Select value={semester} onValueChange={setSemester} dir="rtl">
              <SelectTrigger className="bg-secondary/30 border-border/50 focus:border-primary focus:ring-primary/20">
                <SelectValue placeholder="اختاري الفصل الدراسي..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="الفصل الأول">الفصل الأول</SelectItem>
                <SelectItem value="الفصل الثاني">الفصل الثاني</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              العام الدراسي
            </label>
            <Select value={academicYear} onValueChange={setAcademicYear} dir="rtl">
              <SelectTrigger className="bg-secondary/30 border-border/50 focus:border-primary focus:ring-primary/20">
                <SelectValue placeholder="اختاري العام الدراسي..." />
              </SelectTrigger>
              <SelectContent className="bg-card border-border z-50">
                <SelectItem value="1445-1446">1445-1446</SelectItem>
                <SelectItem value="1446-1447">1446-1447</SelectItem>
                <SelectItem value="1447-1448">1447-1448</SelectItem>
                <SelectItem value="1448-1449">1448-1449</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

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
