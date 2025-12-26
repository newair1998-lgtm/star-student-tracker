import { useParams, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { Grade, gradeLabels, AttendanceRecord } from '@/types/student';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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

const GradeAnalysis = () => {
  const { grade } = useParams<{ grade: Grade }>();
  const navigate = useNavigate();
  const { getStudentsByGrade, loading } = useStudents();
  const tableRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const STUDENTS_PER_PAGE = 25;

  const exportToPDF = async () => {
    if (!tableRef.current) return;
    
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Create a temporary container for PDF generation
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.background = 'white';
      document.body.appendChild(tempContainer);

      const subject = localStorage.getItem('subject');
      const teacherName = localStorage.getItem('teacherName');
      
      // Split students into pages of 25
      const totalPages = Math.ceil(students.length / STUDENTS_PER_PAGE);
      
      for (let page = 0; page < totalPages; page++) {
        const startIndex = page * STUDENTS_PER_PAGE;
        const endIndex = Math.min(startIndex + STUDENTS_PER_PAGE, students.length);
        const pageStudents = students.slice(startIndex, endIndex);
        
        // Create page content
        const pageDiv = document.createElement('div');
        pageDiv.style.padding = '20px';
        pageDiv.style.background = 'white';
        pageDiv.innerHTML = `
          <div style="text-align: center; margin-bottom: 16px;">
            <h3 style="font-weight: bold; font-size: 18px; color: #1f2937;">
              تفاصيل درجات طالبات ${gradeLabels[grade as Grade]}
            </h3>
            ${subject ? `<p style="color: #374151; margin-top: 8px;">المادة: ${subject}</p>` : ''}
            ${teacherName ? `<p style="color: #374151;">المعلمة: ${teacherName}</p>` : ''}
            <p style="color: #6b7280; font-size: 12px; margin-top: 4px;">صفحة ${page + 1} من ${totalPages}</p>
          </div>
          <table style="width: 100%; font-size: 14px; border-collapse: collapse; direction: rtl;">
            <thead>
              <tr style="border-bottom: 2px solid #d1d5db; background-color: #f3f4f6;">
                <th style="padding: 12px 8px; text-align: right; color: #1f2937;">#</th>
                <th style="padding: 12px 8px; text-align: right; color: #1f2937;">الاسم</th>
                <th style="padding: 12px 8px; text-align: center; color: #1f2937;">المهام الأدائية</th>
                <th style="padding: 12px 8px; text-align: center; color: #1f2937;">المشاركة</th>
                <th style="padding: 12px 8px; text-align: center; color: #1f2937;">الأنشطة</th>
                <th style="padding: 12px 8px; text-align: center; color: #1f2937;">الواجبات</th>
                <th style="padding: 12px 8px; text-align: center; color: #1f2937;">اختبار ١</th>
                <th style="padding: 12px 8px; text-align: center; color: #1f2937;">اختبار ٢</th>
                <th style="padding: 12px 8px; text-align: center; color: #1f2937;">المجموع</th>
                <th style="padding: 12px 8px; text-align: center; color: #1f2937;">التقدير</th>
              </tr>
            </thead>
            <tbody>
              ${pageStudents.map((student, idx) => {
                const total = calculateTotal(student);
                const gradeLevel = getGradeLevel(total);
                const colorIndex = ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف'].indexOf(gradeLevel);
                const color = COLORS[colorIndex];
                return `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 8px; color: #1f2937;">${startIndex + idx + 1}</td>
                    <td style="padding: 8px; font-weight: 500; color: #1f2937;">${student.name}</td>
                    <td style="padding: 8px; text-align: center; color: #1f2937;">${student.performanceTasks}</td>
                    <td style="padding: 8px; text-align: center; color: #1f2937;">${student.participation}</td>
                    <td style="padding: 8px; text-align: center; color: #1f2937;">${student.book}</td>
                    <td style="padding: 8px; text-align: center; color: #1f2937;">${student.homework}</td>
                    <td style="padding: 8px; text-align: center; color: #1f2937;">${student.exam1}</td>
                    <td style="padding: 8px; text-align: center; color: #1f2937;">${student.exam2}</td>
                    <td style="padding: 8px; text-align: center; font-weight: bold; color: #1f2937;">${total}</td>
                    <td style="padding: 8px; text-align: center; font-weight: bold; color: ${color};">${gradeLevel}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
        
        if (page < totalPages - 1) {
          pageDiv.style.pageBreakAfter = 'always';
        }
        
        tempContainer.appendChild(pageDiv);
      }
      
      const opt = {
        margin: 10,
        filename: `تفاصيل_درجات_${gradeLabels[grade as Grade]}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
        },
        jsPDF: { 
          unit: 'mm' as const, 
          format: 'a4' as const, 
          orientation: 'landscape' as const,
        },
        pagebreak: { mode: ['css', 'legacy'] as const }
      };
      
      await html2pdf().set(opt).from(tempContainer).save();
      
      // Clean up
      document.body.removeChild(tempContainer);
      
      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم حفظ الملف بصيغة PDF',
      });
    } catch (error) {
      toast({
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء حفظ الملف',
        variant: 'destructive',
      });
    }
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

  // Calculate statistics
  const calculateTotal = (student: typeof students[0]) => {
    return student.performanceTasks + student.participation + student.book + student.homework + student.exam1 + student.exam2;
  };

  const totals = students.map(calculateTotal);
  const totalSum = totals.reduce((a, b) => a + b, 0);
  const average = totalSum / students.length;
  const maxScore = Math.max(...totals);
  const minScore = Math.min(...totals);
  const achievementPercentage = (average / 100) * 100;

  // Grade distribution
  const getGradeLevel = (total: number) => {
    if (total >= 90) return 'ممتاز';
    if (total >= 80) return 'جيد جداً';
    if (total >= 70) return 'جيد';
    if (total >= 60) return 'مقبول';
    return 'ضعيف';
  };

  const gradeDistribution = {
    'ممتاز': totals.filter(t => t >= 90).length,
    'جيد جداً': totals.filter(t => t >= 80 && t < 90).length,
    'جيد': totals.filter(t => t >= 70 && t < 80).length,
    'مقبول': totals.filter(t => t >= 60 && t < 70).length,
    'ضعيف': totals.filter(t => t < 60).length,
  };

  const pieData = Object.entries(gradeDistribution).map(([name, value]) => ({ name, value }));
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#F97316', '#EF4444'];

  // Student scores for bar chart
  const studentScoresData = students.map((s, i) => ({
    name: s.name.split(' ')[0],
    الدرجة: calculateTotal(s),
  }));

  // Category breakdown
  const categoryData = [
    { name: 'المهام الأدائية', المتوسط: students.reduce((a, s) => a + s.performanceTasks, 0) / students.length },
    { name: 'المشاركة', المتوسط: students.reduce((a, s) => a + s.participation, 0) / students.length },
    { name: 'الأنشطة', المتوسط: students.reduce((a, s) => a + s.book, 0) / students.length },
    { name: 'الواجبات', المتوسط: students.reduce((a, s) => a + s.homework, 0) / students.length },
    { name: 'اختبار ١', المتوسط: students.reduce((a, s) => a + s.exam1, 0) / students.length },
    { name: 'اختبار ٢', المتوسط: students.reduce((a, s) => a + s.exam2, 0) / students.length },
  ];

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

        {/* Charts Row 1 */}
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

          {/* Bar Chart - Student Scores */}
          <div className="bg-card rounded-xl p-6 shadow-card">
            <h2 className="text-lg font-bold text-foreground mb-4">درجات الطالبات</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={studentScoresData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="الدرجة" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Category Breakdown */}
          <div className="bg-card rounded-xl p-6 shadow-card">
            <h2 className="text-lg font-bold text-foreground mb-4">متوسط الدرجات حسب الفئة</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="المتوسط" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
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

        {/* Line Chart - Score Trend */}
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-bold text-foreground mb-4">منحنى الدرجات</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={studentScoresData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="الدرجة" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
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
                  <th className="py-3 px-4 text-center text-gray-800">المشاركة</th>
                  <th className="py-3 px-4 text-center text-gray-800">الأنشطة</th>
                  <th className="py-3 px-4 text-center text-gray-800">الواجبات</th>
                  <th className="py-3 px-4 text-center text-gray-800">اختبار ١</th>
                  <th className="py-3 px-4 text-center text-gray-800">اختبار ٢</th>
                  <th className="py-3 px-4 text-center text-gray-800">المجموع</th>
                  <th className="py-3 px-4 text-center text-gray-800">التقدير</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const total = calculateTotal(student);
                  const gradeLevel = getGradeLevel(total);
                  const colorIndex = ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'ضعيف'].indexOf(gradeLevel);
                  return (
                    <tr key={student.id} className="border-b border-gray-200">
                      <td className="py-2 px-4 text-gray-800">{index + 1}</td>
                      <td className="py-2 px-4 font-medium text-gray-800">{student.name}</td>
                      <td className="py-2 px-4 text-center text-gray-800">{student.performanceTasks}</td>
                      <td className="py-2 px-4 text-center text-gray-800">{student.participation}</td>
                      <td className="py-2 px-4 text-center text-gray-800">{student.book}</td>
                      <td className="py-2 px-4 text-center text-gray-800">{student.homework}</td>
                      <td className="py-2 px-4 text-center text-gray-800">{student.exam1}</td>
                      <td className="py-2 px-4 text-center text-gray-800">{student.exam2}</td>
                      <td className="py-2 px-4 text-center font-bold text-gray-800">{total}</td>
                      <td className="py-2 px-4 text-center font-bold" style={{ color: COLORS[colorIndex] }}>{gradeLevel}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center">
            <Button onClick={exportToPDF} className="bg-primary hover:bg-primary/90">
              <FileDown className="w-4 h-4 ml-2" />
              حفظ PDF
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
