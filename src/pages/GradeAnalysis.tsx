// Grade Analysis Page - Export to Word with charts
import { useParams, useNavigate } from 'react-router-dom';
import { useRef } from 'react';
import { useStudents } from '@/hooks/useStudents';
import { Grade, gradeLabels, AttendanceRecord } from '@/types/student';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileSpreadsheet, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, HeadingLevel, AlignmentType, WidthType, ImageRun } from 'docx';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
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
  if (maxTotal === 60) {
    if (total >= 54) return 'ممتاز';
    if (total >= 48) return 'جيد جداً';
    if (total >= 36) return 'جيد';
    if (total >= 30) return 'مقبول';
    return 'ضعيف';
  } else {
    if (total >= 90) return 'ممتاز';
    if (total >= 80) return 'جيد جداً';
    if (total >= 60) return 'جيد';
    if (total >= 50) return 'مقبول';
    return 'ضعيف';
  }
};

const getGradeLevelDescription = (level: string) => {
  const descriptions: Record<string, string> = {
    'ممتاز': 'إتقان عالٍ',
    'جيد جداً': 'إتقان مرتفع',
    'جيد': 'إتقان متوسط',
    'مقبول': 'إتقان أساسي',
    'ضعيف': 'يحتاج دعمًا علاجيًا',
  };
  return descriptions[level] || '';
};

const getGradeRanges = (maxTotal: number) => {
  if (maxTotal === 60) {
    return [
      { level: 'ممتاز', range: '54 – 60', description: 'إتقان عالٍ' },
      { level: 'جيد جداً', range: '48 – أقل من 54', description: 'إتقان مرتفع' },
      { level: 'جيد', range: '36 – أقل من 48', description: 'إتقان متوسط' },
      { level: 'مقبول', range: '30 – أقل من 36', description: 'إتقان أساسي' },
      { level: 'ضعيف', range: 'أقل من 30', description: 'يحتاج دعمًا علاجيًا' },
    ];
  } else {
    return [
      { level: 'ممتاز', range: '90 – 100', description: 'إتقان عالٍ' },
      { level: 'جيد جداً', range: '80 – أقل من 90', description: 'إتقان مرتفع' },
      { level: 'جيد', range: '60 – أقل من 80', description: 'إتقان متوسط' },
      { level: 'مقبول', range: '50 – أقل من 60', description: 'إتقان أساسي' },
      { level: 'ضعيف', range: 'أقل من 50', description: 'يحتاج دعمًا علاجيًا' },
    ];
  }
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
  const reportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const STUDENTS_PER_PAGE = 25;

  // Load settings from localStorage
  const performanceTasksMax = parseInt(localStorage.getItem(`performanceTasksMax_${grade}`) || '10');
  const exam1Max = parseInt(localStorage.getItem(`exam1Max_${grade}`) || '30');
  const exam2Max = parseInt(localStorage.getItem(`exam2Max_${grade}`) || '30');
  const finalTotalMax = parseInt(localStorage.getItem(`finalTotalMax_${grade}`) || '100');
  
  // Load metadata from localStorage
  const subject = localStorage.getItem('subject') || '';
  const teacherName = localStorage.getItem('teacherName') || '';
  const semester = localStorage.getItem('semester') || '';

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

  const exportFullReportToWord = async () => {
    if (!reportRef.current) {
      toast({
        title: 'خطأ',
        description: 'لم يتم العثور على التقرير',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'جاري التحضير',
      description: 'يتم التقاط التقرير وتحويله إلى Word...',
    });

    try {
      // Capture the entire report as an image
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // Convert canvas to base64
      const imageData = canvas.toDataURL('image/png');
      const base64Data = imageData.replace(/^data:image\/png;base64,/, '');

      // Create Word document with the image
      const doc = new Document({
        sections: [{
          properties: {
            page: { margin: { top: 500, right: 500, bottom: 500, left: 500 } }
          },
          children: [
            new Paragraph({
              children: [new TextRun({ text: `تقرير تحليل نتائج ${gradeLabels[grade as Grade]}`, bold: true, size: 36, font: "Arial" })],
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
              bidirectional: true,
              spacing: { after: 200 },
            }),
            ...(subject ? [new Paragraph({
              children: [new TextRun({ text: `المادة: ${subject}`, size: 24, font: "Arial" })],
              alignment: AlignmentType.CENTER,
              bidirectional: true,
            })] : []),
            ...(teacherName ? [new Paragraph({
              children: [new TextRun({ text: `المعلمة: ${teacherName}`, size: 24, font: "Arial" })],
              alignment: AlignmentType.CENTER,
              bidirectional: true,
            })] : []),
            ...(semester ? [new Paragraph({
              children: [new TextRun({ text: `الفصل الدراسي: ${semester}`, size: 24, font: "Arial" })],
              alignment: AlignmentType.CENTER,
              bidirectional: true,
              spacing: { after: 300 },
            })] : []),
            new Paragraph({
              children: [
                new ImageRun({
                  data: Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)),
                  transformation: {
                    width: 650,
                    height: Math.round((canvas.height / canvas.width) * 650),
                  },
                  type: 'png',
                }),
              ],
              alignment: AlignmentType.CENTER,
            }),
          ],
        }],
      });

      // Generate and save
      const blob = await Packer.toBlob(doc);
      saveAs(blob, `تقرير_تحليل_نتائج_${gradeLabels[grade as Grade]}.docx`);

      toast({
        title: 'تم الحفظ بنجاح',
        description: 'تم حفظ التقرير الكامل بصيغة Word مع الرسوم البيانية',
      });
    } catch (error) {
      console.error('Error exporting to Word:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تصدير التقرير',
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

  const totals = students.map(s => calculateTotal(s, performanceTasksMax, exam1Max, exam2Max, finalTotalMax));
  const totalSum = totals.reduce((a, b) => a + b, 0);
  const average = totalSum / students.length;
  const maxScore = Math.max(...totals);
  const minScore = Math.min(...totals);
  const achievementPercentage = (average / finalTotalMax) * 100;

  // Calculate Median (الوسيط)
  const sortedTotals = [...totals].sort((a, b) => a - b);
  const median = sortedTotals.length % 2 === 0
    ? (sortedTotals[sortedTotals.length / 2 - 1] + sortedTotals[sortedTotals.length / 2]) / 2
    : sortedTotals[Math.floor(sortedTotals.length / 2)];

  // Calculate Mode (المنوال)
  const frequencyMap: Record<number, number> = {};
  totals.forEach(t => {
    frequencyMap[t] = (frequencyMap[t] || 0) + 1;
  });
  const maxFrequency = Math.max(...Object.values(frequencyMap));
  const modes = Object.entries(frequencyMap)
    .filter(([_, freq]) => freq === maxFrequency)
    .map(([val, _]) => Number(val));
  const mode = modes.length === totals.length ? 'لا يوجد' : modes.join('، ');

  // Calculate Standard Deviation (الانحراف المعياري)
  const variance = totals.reduce((sum, t) => sum + Math.pow(t - average, 2), 0) / totals.length;
  const standardDeviation = Math.sqrt(variance);

  // Frequency Distribution by 10s (التوزيع التكراري)
  const frequencyDistribution = (() => {
    const ranges: { range: string; count: number; label: string }[] = [];
    const step = 10;
    for (let i = 0; i < finalTotalMax; i += step) {
      const end = Math.min(i + step - 1, finalTotalMax);
      const count = totals.filter(t => t >= i && t <= end).length;
      ranges.push({
        range: `${i}-${end}`,
        count,
        label: `من ${i} إلى ${end}`
      });
    }
    // Add final range if finalTotalMax is not divisible by step
    if (finalTotalMax % step !== 0) {
      const lastStart = Math.floor(finalTotalMax / step) * step;
      const count = totals.filter(t => t >= lastStart && t <= finalTotalMax).length;
      if (!ranges.find(r => r.range === `${lastStart}-${finalTotalMax}`)) {
        ranges.push({
          range: `${lastStart}-${finalTotalMax}`,
          count,
          label: `من ${lastStart} إلى ${finalTotalMax}`
        });
      }
    }
    return ranges;
  })();

  // Calculate grade distribution based on maxTotal
  const gradeDistribution = finalTotalMax === 60
    ? {
        'ممتاز': totals.filter(t => t >= 54).length,
        'جيد جداً': totals.filter(t => t >= 48 && t < 54).length,
        'جيد': totals.filter(t => t >= 36 && t < 48).length,
        'مقبول': totals.filter(t => t >= 30 && t < 36).length,
        'ضعيف': totals.filter(t => t < 30).length,
      }
    : {
        'ممتاز': totals.filter(t => t >= 90).length,
        'جيد جداً': totals.filter(t => t >= 80 && t < 90).length,
        'جيد': totals.filter(t => t >= 60 && t < 80).length,
        'مقبول': totals.filter(t => t >= 50 && t < 60).length,
        'ضعيف': totals.filter(t => t < 50).length,
      };

  const gradeRanges = getGradeRanges(finalTotalMax);

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
        <div className="container flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => navigate('/')}>
              <ArrowRight className="w-4 h-4 ml-2" />
              العودة
            </Button>
            <h1 className="text-xl font-bold text-foreground">
              تحليل نتائج {gradeLabels[grade as Grade]}
            </h1>
            <div className="w-24"></div>
          </div>
          
          {/* Metadata Display */}
          {(subject || teacherName || semester) && (
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm bg-primary/5 rounded-lg py-2 px-4">
              {subject && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">المادة:</span>
                  <span className="font-semibold text-foreground">{subject}</span>
                </div>
              )}
              {teacherName && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">المعلمة:</span>
                  <span className="font-semibold text-foreground">{teacherName}</span>
                </div>
              )}
              {semester && (
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">الفصل الدراسي:</span>
                  <span className="font-semibold text-foreground">{semester}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Report content for export - excludes student details table */}
        <div ref={reportRef} className="space-y-6">
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

        {/* Statistical Analysis */}
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-bold text-foreground mb-4">التحليل الإحصائي</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">المتوسط الحسابي</p>
              <p className="text-2xl font-bold text-primary">{average.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">قياس المستوى العام</p>
            </div>
            <div className="bg-grade-two/10 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">الوسيط</p>
              <p className="text-2xl font-bold text-grade-two">{median.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">الدرجة الأكثر تمركزًا</p>
            </div>
            <div className="bg-grade-four/10 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">المنوال</p>
              <p className="text-2xl font-bold text-grade-four">{mode}</p>
              <p className="text-xs text-muted-foreground mt-1">أكثر درجة تكرارًا</p>
            </div>
            <div className="bg-grade-five/10 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">الانحراف المعياري</p>
              <p className="text-2xl font-bold text-grade-five">{standardDeviation.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {standardDeviation < 10 ? 'الدرجات متقاربة' : standardDeviation < 20 ? 'تباين متوسط' : 'الدرجات متباعدة'}
              </p>
            </div>
          </div>
        </div>

        {/* Frequency Distribution */}
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-bold text-foreground mb-4">التوزيع التكراري للدرجات</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 px-4 text-right">الفئة</th>
                    <th className="py-2 px-4 text-center">التكرار</th>
                    <th className="py-2 px-4 text-center">النسبة</th>
                  </tr>
                </thead>
                <tbody>
                  {frequencyDistribution.map((item, i) => (
                    <tr key={item.range} className="border-b border-border/50">
                      <td className="py-2 px-4 font-medium">{item.label}</td>
                      <td className="py-2 px-4 text-center">{item.count}</td>
                      <td className="py-2 px-4 text-center">{((item.count / students.length) * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Bar Chart */}
            <div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={frequencyDistribution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value} طالبة`, 'العدد']}
                    labelFormatter={(label) => `الفئة: ${label}`}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="التكرار" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Mastery Level Analysis */}
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-bold text-foreground mb-4">تحليل مستوى الإتقان</h2>
          
          {/* Mastery Levels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-success/10 rounded-lg p-4 border-2 border-success/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-success"></div>
                <p className="font-bold text-success">إتقان عالٍ (≥ 85%)</p>
              </div>
              <p className="text-3xl font-bold text-success mb-1">
                {students.filter(s => (calculateTotal(s, performanceTasksMax, exam1Max, exam2Max, finalTotalMax) / finalTotalMax) * 100 >= 85).length}
              </p>
              <p className="text-sm text-muted-foreground">
                {((students.filter(s => (calculateTotal(s, performanceTasksMax, exam1Max, exam2Max, finalTotalMax) / finalTotalMax) * 100 >= 85).length / students.length) * 100).toFixed(1)}% من الطالبات
              </p>
            </div>
            <div className="bg-warning/10 rounded-lg p-4 border-2 border-warning/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <p className="font-bold text-warning">إتقان متوسط (70% - 85%)</p>
              </div>
              <p className="text-3xl font-bold text-warning mb-1">
                {students.filter(s => {
                  const pct = (calculateTotal(s, performanceTasksMax, exam1Max, exam2Max, finalTotalMax) / finalTotalMax) * 100;
                  return pct >= 70 && pct < 85;
                }).length}
              </p>
              <p className="text-sm text-muted-foreground">
                {((students.filter(s => {
                  const pct = (calculateTotal(s, performanceTasksMax, exam1Max, exam2Max, finalTotalMax) / finalTotalMax) * 100;
                  return pct >= 70 && pct < 85;
                }).length / students.length) * 100).toFixed(1)}% من الطالبات
              </p>
            </div>
            <div className="bg-destructive/10 rounded-lg p-4 border-2 border-destructive/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-destructive"></div>
                <p className="font-bold text-destructive">إتقان منخفض (&lt; 70%)</p>
              </div>
              <p className="text-3xl font-bold text-destructive mb-1">
                {students.filter(s => (calculateTotal(s, performanceTasksMax, exam1Max, exam2Max, finalTotalMax) / finalTotalMax) * 100 < 70).length}
              </p>
              <p className="text-sm text-muted-foreground">
                {((students.filter(s => (calculateTotal(s, performanceTasksMax, exam1Max, exam2Max, finalTotalMax) / finalTotalMax) * 100 < 70).length / students.length) * 100).toFixed(1)}% من الطالبات
              </p>
            </div>
          </div>

          {/* Student Classification */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrichment Plan */}
            <div className="bg-success/5 rounded-lg p-4 border border-success/20">
              <h3 className="font-bold text-success mb-3 flex items-center gap-2">
                <span className="bg-success text-white text-xs px-2 py-1 rounded">الخطة الإثرائية</span>
                طالبات تحتاج تحديات إضافية
              </h3>
              <div className="max-h-40 overflow-y-auto">
                {students
                  .filter(s => (calculateTotal(s, performanceTasksMax, exam1Max, exam2Max, finalTotalMax) / finalTotalMax) * 100 >= 85)
                  .map((s, i) => (
                    <div key={s.id} className="flex justify-between items-center py-1 border-b border-success/10 last:border-0">
                      <span className="text-sm">{i + 1}. {s.name}</span>
                      <span className="text-sm font-bold text-success">
                        {((calculateTotal(s, performanceTasksMax, exam1Max, exam2Max, finalTotalMax) / finalTotalMax) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                {students.filter(s => (calculateTotal(s, performanceTasksMax, exam1Max, exam2Max, finalTotalMax) / finalTotalMax) * 100 >= 85).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">لا توجد طالبات في هذه الفئة</p>
                )}
              </div>
            </div>

            {/* Remedial Plan */}
            <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
              <h3 className="font-bold text-destructive mb-3 flex items-center gap-2">
                <span className="bg-destructive text-white text-xs px-2 py-1 rounded">الخطة العلاجية</span>
                طالبات تحتاج دعم إضافي
              </h3>
              <div className="max-h-40 overflow-y-auto">
                {students
                  .filter(s => (calculateTotal(s, performanceTasksMax, exam1Max, exam2Max, finalTotalMax) / finalTotalMax) * 100 < 70)
                  .sort((a, b) => calculateTotal(a, performanceTasksMax, exam1Max, exam2Max, finalTotalMax) - calculateTotal(b, performanceTasksMax, exam1Max, exam2Max, finalTotalMax))
                  .map((s, i) => (
                    <div key={s.id} className="flex justify-between items-center py-1 border-b border-destructive/10 last:border-0">
                      <span className="text-sm">{i + 1}. {s.name}</span>
                      <span className="text-sm font-bold text-destructive">
                        {((calculateTotal(s, performanceTasksMax, exam1Max, exam2Max, finalTotalMax) / finalTotalMax) * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                {students.filter(s => (calculateTotal(s, performanceTasksMax, exam1Max, exam2Max, finalTotalMax) / finalTotalMax) * 100 < 70).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">لا توجد طالبات في هذه الفئة</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Grade Distribution Table */}
        <div className="bg-card rounded-xl p-6 shadow-card">
          <h2 className="text-lg font-bold text-foreground mb-4">توزيع التقديرات</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-2 px-4 text-right">المستوى</th>
                  <th className="py-2 px-4 text-center">نطاق الدرجات</th>
                  <th className="py-2 px-4 text-center">الوصف</th>
                  <th className="py-2 px-4 text-center">العدد</th>
                  <th className="py-2 px-4 text-center">النسبة</th>
                </tr>
              </thead>
              <tbody>
                {gradeRanges.map((item, i) => {
                  const count = gradeDistribution[item.level as keyof typeof gradeDistribution] || 0;
                  return (
                    <tr key={item.level} className="border-b border-border/50">
                      <td className="py-2 px-4 font-medium" style={{ color: COLORS[i] }}>{item.level}</td>
                      <td className="py-2 px-4 text-center">{item.range}</td>
                      <td className="py-2 px-4 text-center text-muted-foreground">{item.description}</td>
                      <td className="py-2 px-4 text-center">{count}</td>
                      <td className="py-2 px-4 text-center">{((count / students.length) * 100).toFixed(2)}%</td>
                    </tr>
                  );
                })}
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
        </div>
        {/* End of report content for export */}

        {/* Students Details Table - NOT included in Word export */}
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
          <div className="mt-4 flex justify-center gap-4">
            <Button onClick={() => exportToExcel(students)} variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
              <FileSpreadsheet className="w-4 h-4 ml-2" />
              حفظ Excel
            </Button>
            <Button onClick={() => exportFullReportToWord()} variant="outline" className="border-primary text-primary hover:bg-primary/10">
              <FileText className="w-4 h-4 ml-2" />
              حفظ التقرير Word
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
