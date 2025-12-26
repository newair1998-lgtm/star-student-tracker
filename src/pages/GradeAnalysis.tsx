import { useParams, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { Grade, gradeLabels, AttendanceRecord } from '@/types/student';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

const DEFAULT_ATTENDANCE: AttendanceRecord = {
  present: [false, false, false, false],
  absent: [false, false, false, false],
};

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#F97316', '#EF4444'];

const getGradeLevel = (total: number, maxTotal: number) => {
  const percentage = (total / maxTotal) * 100;
  if (percentage >= 90) return 'ممتاز';
  if (percentage >= 80) return 'جيد جداً';
  if (percentage >= 70) return 'جيد';
  if (percentage >= 60) return 'مقبول';
  return 'ضعيف';
};

interface StudentType {
  id: string;
  name: string;
  performanceTasks: number;
  participation: number;
  book: number;
  homework: number;
  exam1: number;
  exam2: number;
  attendance?: AttendanceRecord;
}

const calculateTotal = (student: StudentType, performanceTasksMax: number, exam1Max: number, exam2Max: number, finalTotalMax: number) => {
  const tasksTotal = performanceTasksMax === 20 
    ? Math.min(student.performanceTasks, 20) + student.book + student.homework 
    : student.performanceTasks + student.participation + student.book + student.homework;
  const examsTotal = exam1Max === 20 
    ? Math.min(student.exam1, exam1Max) 
    : Math.min(student.exam1, exam1Max) + Math.min(student.exam2, exam2Max);
  const rawTotal = tasksTotal + examsTotal;
  return finalTotalMax === 60 ? Math.min(rawTotal, 60) : rawTotal;
};

const GradeAnalysis = () => {
  const { grade } = useParams<{ grade: Grade }>();
  const navigate = useNavigate();
  const { getStudentsByGrade, loading } = useStudents();
  const tableRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const STUDENTS_PER_PAGE = 25;

  // Load settings from localStorage
  const performanceTasksMax = parseInt(localStorage.getItem(`performanceTasksMax_${grade}`) || '10');
  const exam1Max = parseInt(localStorage.getItem(`exam1Max_${grade}`) || '30');
  const exam2Max = parseInt(localStorage.getItem(`exam2Max_${grade}`) || '30');
  const finalTotalMax = parseInt(localStorage.getItem(`finalTotalMax_${grade}`) || '100');

  const exportToExcel = (studentsData: StudentType[]) => {
    const subject = localStorage.getItem('subject') || '';
    const teacherName = localStorage.getItem('teacherName') || '';
    
    // Prepare data for Excel
    const excelData = studentsData.map((student, index) => {
      const total = calculateTotal(student, performanceTasksMax, exam1Max, exam2Max, finalTotalMax);
      const gradeLevel = getGradeLevel(total, finalTotalMax);
      
    if (performanceTasksMax === 20) {
      const baseData = {
        '#': index + 1,
        'الاسم': student.name,
        'المهام الأدائية': student.performanceTasks,
        'الأنشطة': student.book,
        'الواجبات': student.homework,
        'اختبار ١': student.exam1,
        'المجموع': total,
        'التقدير': gradeLevel,
      };
      if (exam1Max !== 20) {
        return { ...baseData, 'اختبار ٢': student.exam2 };
      }
      return baseData;
    }
    
    const baseData = {
      '#': index + 1,
      'الاسم': student.name,
      'المهام الأدائية': student.performanceTasks,
      'المشاركة': student.participation,
      'الأنشطة': student.book,
      'الواجبات': student.homework,
      'اختبار ١': student.exam1,
      'المجموع': total,
      'التقدير': gradeLevel,
    };
    if (exam1Max !== 20) {
      return { ...baseData, 'اختبار ٢': student.exam2 };
    }
    return baseData;
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);

    // Add header info
    const headerInfo = [
      [`تفاصيل درجات طالبات ${gradeLabels[grade as Grade]}`],
      [subject ? `المادة: ${subject}` : ''],
      [teacherName ? `المعلمة: ${teacherName}` : ''],
      [''],
    ];

    // Create worksheet with header
    const wsWithHeader = XLSX.utils.aoa_to_sheet(headerInfo);
    XLSX.utils.sheet_add_json(wsWithHeader, excelData, { origin: 'A5' });

    // Set column widths
    wsWithHeader['!cols'] = [
      { wch: 5 },   // #
      { wch: 25 },  // الاسم
      { wch: 15 },  // المهام الأدائية
      { wch: 10 },  // المشاركة
      { wch: 10 },  // الأنشطة
      { wch: 10 },  // الواجبات
      { wch: 10 },  // اختبار ١
      { wch: 10 },  // اختبار ٢
      { wch: 10 },  // المجموع
      { wch: 10 },  // التقدير
    ];

    XLSX.utils.book_append_sheet(wb, wsWithHeader, 'الدرجات');

    // Save file
    XLSX.writeFile(wb, `تفاصيل_درجات_${gradeLabels[grade as Grade]}.xlsx`);

    toast({
      title: 'تم الحفظ بنجاح',
      description: 'تم حفظ الملف بصيغة Excel',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">جاري تحميل البيانات...</p>
      </div>
    );
  }

  const students = getStudentsByGrade(grade as Grade);

  if (students.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">لا توجد طالبات في هذا الصف</p>
        <Button onClick={() => navigate('/')}>
          <ArrowRight className="w-4 h-4 ml-2" />
          العودة للصفحة الرئيسية
        </Button>
      </div>
    );
  }

  const totals = students.map(s => calculateTotal(s, performanceTasksMax, exam1Max, exam2Max, finalTotalMax));
  const totalSum = totals.reduce((a, b) => a + b, 0);
  const average = totalSum / students.length;
  const maxScore = Math.max(...totals);
  const minScore = Math.min(...totals);
  const achievementPercentage = (average / finalTotalMax) * 100;

  // Calculate grade distribution based on percentage
  const gradeDistribution = {
    'ممتاز': totals.filter(t => (t / finalTotalMax) * 100 >= 90).length,
    'جيد جداً': totals.filter(t => (t / finalTotalMax) * 100 >= 80 && (t / finalTotalMax) * 100 < 90).length,
    'جيد': totals.filter(t => (t / finalTotalMax) * 100 >= 70 && (t / finalTotalMax) * 100 < 80).length,
    'مقبول': totals.filter(t => (t / finalTotalMax) * 100 >= 60 && (t / finalTotalMax) * 100 < 70).length,
    'ضعيف': totals.filter(t => (t / finalTotalMax) * 100 < 60).length,
  };

  const pieData = Object.entries(gradeDistribution).map(([name, value]) => ({ name, value }));

  // Student scores for bar chart
  const studentScoresData = students.map((s, i) => ({
    name: s.name.split(' ')[0],
    الدرجة: calculateTotal(s, performanceTasksMax, exam1Max, exam2Max, finalTotalMax),
  }));

  // Category breakdown - hide participation if performanceTasksMax is 20, hide exam2 if exam1Max is 20
  const categoryData = (() => {
    const baseCategories = performanceTasksMax === 20 
      ? [
          { name: 'المهام الأدائية', المتوسط: students.reduce((a, s) => a + s.performanceTasks, 0) / students.length },
          { name: 'الأنشطة', المتوسط: students.reduce((a, s) => a + s.book, 0) / students.length },
          { name: 'الواجبات', المتوسط: students.reduce((a, s) => a + s.homework, 0) / students.length },
          { name: 'اختبار ١', المتوسط: students.reduce((a, s) => a + s.exam1, 0) / students.length },
        ]
      : [
          { name: 'المهام الأدائية', المتوسط: students.reduce((a, s) => a + s.performanceTasks, 0) / students.length },
          { name: 'المشاركة', المتوسط: students.reduce((a, s) => a + s.participation, 0) / students.length },
          { name: 'الأنشطة', المتوسط: students.reduce((a, s) => a + s.book, 0) / students.length },
          { name: 'الواجبات', المتوسط: students.reduce((a, s) => a + s.homework, 0) / students.length },
          { name: 'اختبار ١', المتوسط: students.reduce((a, s) => a + s.exam1, 0) / students.length },
        ];
    
    if (exam1Max !== 20) {
      baseCategories.push({ name: 'اختبار ٢', المتوسط: students.reduce((a, s) => a + s.exam2, 0) / students.length });
    }
    return baseCategories;
  })();

  // Attendance data
  const attendanceData = students.map(s => {
    const att = s.attendance || DEFAULT_ATTENDANCE;
    return {
      name: s.name.split(' ')[0],
      حضور: att.present.filter(p => p).length,
      غياب: att.absent.filter(a => a).length,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-soft border-b border-border/50 py-4">
        <div className="container flex items-center justify-between">
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowRight className="w-4 h-4 ml-2" />
            العودة
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            تحليل نتائج {gradeLabels[grade as Grade]}
          </h1>
          <div className="w-24"></div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-card rounded-xl p-4 shadow-card text-center">
            <p className="text-sm text-muted-foreground">عدد الطالبات</p>
            <p className="text-2xl font-bold text-primary">{students.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card text-center">
            <p className="text-sm text-muted-foreground">مجموع الدرجات</p>
            <p className="text-2xl font-bold text-grade-four">{totalSum.toFixed(2)}</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card text-center">
            <p className="text-sm text-muted-foreground">متوسط الدرجات</p>
            <p className="text-2xl font-bold text-grade-five">{average.toFixed(2)}</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card text-center">
            <p className="text-sm text-muted-foreground">نسبة التحصيل</p>
            <p className="text-2xl font-bold text-success">{achievementPercentage.toFixed(2)}%</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card text-center">
            <p className="text-sm text-muted-foreground">أعلى درجة</p>
            <p className="text-2xl font-bold text-success">{maxScore}</p>
          </div>
          <div className="bg-card rounded-xl p-4 shadow-card text-center">
            <p className="text-sm text-muted-foreground">أدنى درجة</p>
            <p className="text-2xl font-bold text-destructive">{minScore}</p>
          </div>
        </div>

        {/* Grade Distribution Table */}
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-bold text-foreground mb-4">توزيع التقديرات</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 px-4 text-right">التقدير</th>
                  <th className="py-2 px-4 text-center">العدد</th>
                  <th className="py-2 px-4 text-center">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(gradeDistribution).map(([level, count], i) => (
                  <tr key={level} className="border-b border-border/50">
                    <td className="py-2 px-4 font-medium" style={{ color: COLORS[i] }}>{level}</td>
                    <td className="py-2 px-4 text-center">{count}</td>
                    <td className="py-2 px-4 text-center">{((count / students.length) * 100).toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart - Grade Distribution */}
          <div className="bg-card rounded-xl p-6 shadow-card">
            <h2 className="text-lg font-bold text-foreground mb-4">نسبة التقديرات</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Attendance Chart */}
          <div className="bg-card rounded-xl p-6 shadow-card">
            <h2 className="text-lg font-bold text-foreground mb-4">الحضور والغياب</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 4]} />
                <Tooltip />
                <Legend />
                <Bar dataKey="حضور" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="غياب" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Students Details Table */}
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-bold text-foreground mb-4">تفاصيل درجات الطالبات</h2>
          <div ref={tableRef} className="overflow-x-auto bg-white p-4 rounded-lg">
            <div className="text-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">
                تفاصيل درجات طالبات {gradeLabels[grade as Grade]}
              </h3>
              {localStorage.getItem('subject') && (
                <p className="text-gray-700 mt-2">المادة: {localStorage.getItem('subject')}</p>
              )}
              {localStorage.getItem('teacherName') && (
                <p className="text-gray-700">المعلمة: {localStorage.getItem('teacherName')}</p>
              )}
            </div>
            <table className="w-full text-sm" style={{ direction: 'rtl' }}>
              <thead>
                <tr className="border-b-2 border-gray-300 bg-gray-100">
                  <th className="py-3 px-4 text-right text-gray-800">#</th>
                  <th className="py-3 px-4 text-right text-gray-800">الاسم</th>
                  <th className="py-3 px-4 text-center text-gray-800">المهام الأدائية</th>
                  {performanceTasksMax === 10 && (
                    <th className="py-3 px-4 text-center text-gray-800">المشاركة</th>
                  )}
                  <th className="py-3 px-4 text-center text-gray-800">الأنشطة</th>
                  <th className="py-3 px-4 text-center text-gray-800">الواجبات</th>
                  <th className="py-3 px-4 text-center text-gray-800">اختبار ١</th>
                  {exam1Max !== 20 && (
                    <th className="py-3 px-4 text-center text-gray-800">اختبار ٢</th>
                  )}
                  <th className="py-3 px-4 text-center text-gray-800">المجموع</th>
                  <th className="py-3 px-4 text-center text-gray-800">التقدير</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const total = calculateTotal(student, performanceTasksMax, exam1Max, exam2Max, finalTotalMax);
                  const gradeLevel = getGradeLevel(total, finalTotalMax);
                  const colorIndex = ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف'].indexOf(gradeLevel);
                  return (
                    <tr key={student.id} className="border-b border-gray-200">
                      <td className="py-2 px-4 text-gray-800">{index + 1}</td>
                      <td className="py-2 px-4 font-medium text-gray-800">{student.name}</td>
                      <td className="py-2 px-4 text-center text-gray-800">{student.performanceTasks}</td>
                      {performanceTasksMax === 10 && (
                        <td className="py-2 px-4 text-center text-gray-800">{student.participation}</td>
                      )}
                      <td className="py-2 px-4 text-center text-gray-800">{student.book}</td>
                      <td className="py-2 px-4 text-center text-gray-800">{student.homework}</td>
                      <td className="py-2 px-4 text-center text-gray-800">{student.exam1}</td>
                      {exam1Max !== 20 && (
                        <td className="py-2 px-4 text-center text-gray-800">{student.exam2}</td>
                      )}
                      <td className="py-2 px-4 text-center font-bold text-gray-800">{total}</td>
                      <td className="py-2 px-4 text-center font-bold" style={{ color: COLORS[colorIndex] }}>{gradeLevel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center">
            <Button onClick={() => exportToExcel(students)} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
              <FileSpreadsheet className="w-4 h-4 ml-2" />
              حفظ Excel
            </Button>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground border-t border-border/50 bg-card/50">
        <p>نظام متابعة حضور وتقييم الطالبات © {new Date().getFullYear()}</p>
        <p className="mt-1 font-medium text-foreground/70">الحقوق محفوظة للدكتورة نوير الحربي</p>
      </footer>
    </div>
  );
};

export default GradeAnalysis;
