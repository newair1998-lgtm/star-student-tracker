import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Users, BookOpen, User, School } from 'lucide-react';
import { Grade, EducationStage, getGradesForStage, gradeShortLabels, stageLabels } from '@/types/student';

interface AddStudentsSectionProps {
  onAddStudents: (names: string[], grade: Grade, subject?: string, sectionNumber?: number) => void;
}

const AddStudentsSection = ({ onAddStudents }: AddStudentsSectionProps) => {
  const [studentNames, setStudentNames] = useState('');
  const [teacherName, setTeacherName] = useState(() => localStorage.getItem('teacherName') || '');
  const [semester, setSemester] = useState(() => localStorage.getItem('semester') || '');
  const [academicYear, setAcademicYear] = useState(() => localStorage.getItem('academicYear') || '');
  const [educationStage, setEducationStage] = useState<EducationStage | ''>(() => 
    (localStorage.getItem('educationStage') as EducationStage) || ''
  );
  const [sectionNumber, setSectionNumber] = useState<number>(() => 
    parseInt(localStorage.getItem('sectionNumber') || '1')
  );

  useEffect(() => {
    localStorage.setItem('teacherName', teacherName);
  }, [teacherName]);

  useEffect(() => {
    localStorage.setItem('semester', semester);
  }, [semester]);

  useEffect(() => {
    localStorage.setItem('academicYear', academicYear);
  }, [academicYear]);

  useEffect(() => {
    localStorage.setItem('educationStage', educationStage);
  }, [educationStage]);

  useEffect(() => {
    localStorage.setItem('sectionNumber', sectionNumber.toString());
  }, [sectionNumber]);

  const handleAddToGrade = (grade: Grade) => {
    const names = studentNames
      .split('\n')
      .map(name => {
        // Remove leading numbers, dots, dashes, and spaces (e.g., "1. فاطمة" or "1- فاطمة" or "1 فاطمة")
        return name.trim().replace(/^[\d\s.\-\)]+/, '').trim();
      })
      .filter(name => name.length > 0);
    
    if (names.length > 0) {
      onAddStudents(names, grade, 'default', sectionNumber);
      setStudentNames('');
    }
  };

  const getButtonVariant = (index: number) => {
    const variants = ['gradeOne', 'gradeTwo', 'gradeThree', 'gradeFour', 'gradeFive', 'gradeSix'] as const;
    return variants[index] || 'gradeOne';
  };

  const renderGradeButtons = () => {
    if (!educationStage) return null;
    
    const grades = getGradesForStage(educationStage);
    const stageSuffix = stageLabels[educationStage];
    
    return (
      <div className="flex flex-wrap gap-3">
        {grades.map((grade, index) => (
          <Button
            key={grade}
            variant={getButtonVariant(index)}
            onClick={() => handleAddToGrade(grade)}
            className="flex-1 min-w-[140px]"
          >
            <Users className="w-4 h-4" />
            إضافة إلى {gradeShortLabels[grade]} {stageSuffix}
          </Button>
        ))}
      </div>
    );
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <SelectItem value="1447">1447</SelectItem>
                <SelectItem value="1448">1448</SelectItem>
                <SelectItem value="1449">1449</SelectItem>
                <SelectItem value="1450">1450</SelectItem>
                <SelectItem value="1451">1451</SelectItem>
                <SelectItem value="1452">1452</SelectItem>
                <SelectItem value="1453">1453</SelectItem>
                <SelectItem value="1454">1454</SelectItem>
                <SelectItem value="1455">1455</SelectItem>
                <SelectItem value="1456">1456</SelectItem>
                <SelectItem value="1457">1457</SelectItem>
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
        
        {/* Education Stage Dropdown */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <School className="w-4 h-4" />
            المرحلة الدراسية
          </label>
          <Select value={educationStage} onValueChange={(val) => setEducationStage(val as EducationStage)} dir="rtl">
            <SelectTrigger className="bg-secondary/30 border-border/50 focus:border-primary focus:ring-primary/20">
              <SelectValue placeholder="اختاري المرحلة الدراسية..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              <SelectItem value="primary">ابتدائي</SelectItem>
              <SelectItem value="middle">متوسط</SelectItem>
              <SelectItem value="secondary">ثانوي</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Section Number Selector */}
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" />
            رقم الفصل
          </label>
          <Select value={sectionNumber.toString()} onValueChange={(val) => setSectionNumber(parseInt(val))} dir="rtl">
            <SelectTrigger className="bg-secondary/30 border-border/50 focus:border-primary focus:ring-primary/20">
              <SelectValue placeholder="اختاري رقم الفصل..." />
            </SelectTrigger>
            <SelectContent className="bg-card border-border z-50">
              <SelectItem value="1">فصل ١</SelectItem>
              <SelectItem value="2">فصل ٢</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grade Buttons - Show based on selected education stage */}
        {renderGradeButtons()}
      </div>
    </div>
  );
};

export default AddStudentsSection;
