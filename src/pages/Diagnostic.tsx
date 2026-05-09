import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Trash2, Printer, FileText, BarChart3 } from 'lucide-react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface DiagRow {
  id: string;
  name: string;
  pre: number | '';
  post: number | '';
}

interface DiagSettings {
  subject: string;
  testName: string;
  stage: string;
  grade: string;
  teacher: string;
  principal: string;
  preDate: string;
  postDate: string;
  maxScore: number;
  masteryPercent: number; // % considered mastered
  preGoal: string;
  postGoal: string;
  improvedSkills: string;
  needsSupportSkills: string;
}

const STORAGE_KEY = 'diagnosticTest_v1';

const defaultSettings: DiagSettings = {
  subject: '',
  testName: '',
  stage: '',
  grade: '',
  teacher: 'نوير مسري الحربي',
  principal: 'نايفة الحربي',
  preDate: '',
  postDate: '',
  maxScore: 20,
  masteryPercent: 60,
  preGoal: 'تشخيص مستوى الطلاب قبل التدريس',
  postGoal: 'قياس مدى تحقق نواتج التعلم',
  improvedSkills: '',
  needsSupportSkills: '',
};

const Diagnostic = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const reportRef = useRef<HTMLDivElement>(null);

  const [settings, setSettings] = useState<DiagSettings>(defaultSettings);
  const [rows, setRows] = useState<DiagRow[]>([]);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.settings) setSettings({ ...defaultSettings, ...data.settings });
        if (data.rows) setRows(data.rows);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, rows }));
  }, [settings, rows]);

  const addRow = () => {
    setRows(prev => [...prev, { id: crypto.randomUUID(), name: '', pre: '', post: '' }]);
  };

  const addBulk = (count: number) => {
    setRows(prev => [
      ...prev,
      ...Array.from({ length: count }, () => ({ id: crypto.randomUUID(), name: '', pre: '' as const, post: '' as const })),
    ]);
  };

  const updateRow = (id: string, patch: Partial<DiagRow>) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const clearAll = () => {
    if (confirm('سيتم مسح جميع البيانات. هل أنت متأكدة؟')) {
      setRows([]);
      setSettings(defaultSettings);
    }
  };

  const analysis = useMemo(() => {
    const max = settings.maxScore || 20;
    const masteryThreshold = (settings.masteryPercent / 100) * max;
    const valid = rows.filter(r => r.name.trim());
    const preScores = valid.map(r => Number(r.pre) || 0).filter((_, i) => valid[i].pre !== '');
    const postScores = valid.map(r => Number(r.post) || 0).filter((_, i) => valid[i].post !== '');

    const calc = (arr: number[]) => {
      if (!arr.length) return { avg: 0, max: 0, min: 0, mastery: 0, count: 0, high: 0, mid: 0, low: 0, masteryCount: 0, pct: 0 };
      const sum = arr.reduce((a, b) => a + b, 0);
      const avg = sum / arr.length;
      const masteryCount = arr.filter(s => s >= masteryThreshold).length;
      const high = arr.filter(s => s / max >= 0.8).length;
      const mid = arr.filter(s => s / max >= 0.5 && s / max < 0.8).length;
      const low = arr.filter(s => s / max < 0.5).length;
      return {
        avg,
        max: Math.max(...arr),
        min: Math.min(...arr),
        count: arr.length,
        masteryCount,
        mastery: (masteryCount / arr.length) * 100,
        high,
        mid,
        low,
        pct: (avg / max) * 100,
      };
    };

    const pre = calc(preScores);
    const post = calc(postScores);
    const improvement = post.pct - pre.pct;
    const gain = post.pct && pre.pct ? ((post.pct - pre.pct) / Math.max(1, 100 - pre.pct)) * 100 : 0;

    const studentDetails = valid.map(r => {
      const p = Number(r.pre);
      const q = Number(r.post);
      const change = (r.post !== '' && r.pre !== '') ? q - p : null;
      const status = change === null ? '—' : change > 0 ? 'تحسّن' : change === 0 ? 'ثبات' : 'تراجع';
      return { name: r.name, pre: r.pre, post: r.post, change, status };
    });

    const improved = studentDetails.filter(s => s.change !== null && s.change > 0).length;
    const same = studentDetails.filter(s => s.change === 0).length;
    const regressed = studentDetails.filter(s => s.change !== null && s.change < 0).length;

    return { pre, post, improvement, gain, studentDetails, improved, same, regressed, total: valid.length };
  }, [rows, settings.maxScore, settings.masteryPercent]);

  const fmt = (n: number, d = 1) => (isFinite(n) ? n.toFixed(d) : '0');

  const handlePrintReport = () => {
    setShowReport(true);
    setTimeout(() => window.print(), 300);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <div className="print:hidden">
        <Header />
      </div>

      <main className="container py-6 space-y-6 print:p-0">
        <div className="print:hidden flex items-center justify-between gap-2 flex-wrap">
          <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
            <ArrowRight className="w-4 h-4" />
            الرجوع للرئيسية
          </Button>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => window.print()} className="gap-2">
              <Printer className="w-4 h-4" />
              طباعة التحليل
            </Button>
            <Button onClick={handlePrintReport} className="gap-2">
              <FileText className="w-4 h-4" />
              تقرير التشخيصي
            </Button>
            <Button variant="destructive" onClick={clearAll} className="gap-2">
              <Trash2 className="w-4 h-4" />
              مسح الكل
            </Button>
          </div>
        </div>

        {/* Settings */}
        <Card className="p-5 print:hidden">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            إعدادات الاختبار
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>المادة</Label>
              <Input value={settings.subject} onChange={e => setSettings({ ...settings, subject: e.target.value })} placeholder="مثال: الدراسات الاجتماعية" />
            </div>
            <div>
              <Label>اسم الاختبار</Label>
              <Input value={settings.testName} onChange={e => setSettings({ ...settings, testName: e.target.value })} />
            </div>
            <div>
              <Label>المرحلة / الصف</Label>
              <Input value={settings.grade} onChange={e => setSettings({ ...settings, grade: e.target.value })} placeholder="مثال: ابتدائي - رابع" />
            </div>
            <div>
              <Label>اسم المعلمة</Label>
              <Input value={settings.teacher} onChange={e => setSettings({ ...settings, teacher: e.target.value })} />
            </div>
            <div>
              <Label>مديرة المدرسة</Label>
              <Input value={settings.principal} onChange={e => setSettings({ ...settings, principal: e.target.value })} />
            </div>
            <div>
              <Label>درجة الاختبار (الكاملة)</Label>
              <Input type="number" value={settings.maxScore} onChange={e => setSettings({ ...settings, maxScore: Number(e.target.value) || 0 })} />
            </div>
            <div>
              <Label>تاريخ الاختبار القبلي</Label>
              <Input value={settings.preDate} onChange={e => setSettings({ ...settings, preDate: e.target.value })} placeholder="١٤٤٧/٧/٢٩" />
            </div>
            <div>
              <Label>تاريخ الاختبار البعدي</Label>
              <Input value={settings.postDate} onChange={e => setSettings({ ...settings, postDate: e.target.value })} placeholder="١٤٤٧/٧/٢٤" />
            </div>
            <div>
              <Label>نسبة الإتقان %</Label>
              <Input type="number" value={settings.masteryPercent} onChange={e => setSettings({ ...settings, masteryPercent: Number(e.target.value) || 0 })} />
            </div>
            <div className="md:col-span-3">
              <Label>الهدف من الاختبار القبلي</Label>
              <Input value={settings.preGoal} onChange={e => setSettings({ ...settings, preGoal: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <Label>الهدف من الاختبار البعدي</Label>
              <Input value={settings.postGoal} onChange={e => setSettings({ ...settings, postGoal: e.target.value })} />
            </div>
            <div className="md:col-span-3">
              <Label>المهارات التي تحسنت بشكل واضح (سطر لكل مهارة)</Label>
              <textarea
                className="w-full border rounded-md p-2 min-h-[80px] bg-background"
                value={settings.improvedSkills}
                onChange={e => setSettings({ ...settings, improvedSkills: e.target.value })}
              />
            </div>
            <div className="md:col-span-3">
              <Label>المهارات التي ما زالت تحتاج إلى دعم (سطر لكل مهارة)</Label>
              <textarea
                className="w-full border rounded-md p-2 min-h-[80px] bg-background"
                value={settings.needsSupportSkills}
                onChange={e => setSettings({ ...settings, needsSupportSkills: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Students table */}
        <Card className="p-5 print:hidden">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="text-xl font-bold">بيانات الطلاب ({rows.length})</h2>
            <div className="flex gap-2">
              <Button onClick={addRow} variant="outline" size="sm" className="gap-1">
                <Plus className="w-4 h-4" /> إضافة طالب
              </Button>
              <Button onClick={() => addBulk(10)} variant="outline" size="sm">+10</Button>
              <Button onClick={() => addBulk(20)} variant="outline" size="sm">+20</Button>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">لا توجد بيانات بعد — أضف طلاباً</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 w-12">#</th>
                    <th className="p-2 text-right">اسم الطالب</th>
                    <th className="p-2 w-32">القبلي</th>
                    <th className="p-2 w-32">البعدي</th>
                    <th className="p-2 w-24">التغيير</th>
                    <th className="p-2 w-24">الحالة</th>
                    <th className="p-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => {
                    const change = row.post !== '' && row.pre !== '' ? Number(row.post) - Number(row.pre) : null;
                    const status = change === null ? '—' : change > 0 ? 'تحسّن' : change === 0 ? 'ثبات' : 'تراجع';
                    const color = change === null ? '' : change > 0 ? 'text-green-600' : change === 0 ? 'text-amber-600' : 'text-red-600';
                    return (
                      <tr key={row.id} className="border-b">
                        <td className="p-2 text-center">{idx + 1}</td>
                        <td className="p-2">
                          <Input value={row.name} onChange={e => updateRow(row.id, { name: e.target.value })} />
                        </td>
                        <td className="p-2">
                          <Input type="number" min={0} max={settings.maxScore} value={row.pre}
                            onChange={e => updateRow(row.id, { pre: e.target.value === '' ? '' : Number(e.target.value) })} />
                        </td>
                        <td className="p-2">
                          <Input type="number" min={0} max={settings.maxScore} value={row.post}
                            onChange={e => updateRow(row.id, { post: e.target.value === '' ? '' : Number(e.target.value) })} />
                        </td>
                        <td className={`p-2 text-center font-bold ${color}`}>{change === null ? '—' : change > 0 ? `+${change}` : change}</td>
                        <td className={`p-2 text-center ${color}`}>{status}</td>
                        <td className="p-2">
                          <Button variant="ghost" size="iconSm" onClick={() => removeRow(row.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Analysis */}
        {analysis.total > 0 && (
          <div className="print-area space-y-4">
            <Card className="p-5">
              <h2 className="text-xl font-bold mb-4 text-center">تحليل النتائج</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4 bg-blue-50/50">
                  <h3 className="font-bold mb-3 text-blue-900">الاختبار القبلي</h3>
                  <ul className="space-y-1 text-sm">
                    <li>عدد الطلاب: <b>{analysis.pre.count}</b></li>
                    <li>متوسط الدرجات: <b>{fmt(analysis.pre.avg)}</b> من {settings.maxScore}</li>
                    <li>أعلى درجة: <b>{analysis.pre.max}</b></li>
                    <li>أقل درجة: <b>{analysis.pre.min}</b></li>
                    <li>نسبة الإتقان: <b>{fmt(analysis.pre.mastery)}%</b> ({analysis.pre.masteryCount} طالب/ـة)</li>
                    <li>المستوى المرتفع: <b>{analysis.pre.high}</b> | المتوسط: <b>{analysis.pre.mid}</b> | المنخفض: <b>{analysis.pre.low}</b></li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4 bg-green-50/50">
                  <h3 className="font-bold mb-3 text-green-900">الاختبار البعدي</h3>
                  <ul className="space-y-1 text-sm">
                    <li>عدد الطلاب: <b>{analysis.post.count}</b></li>
                    <li>متوسط الدرجات: <b>{fmt(analysis.post.avg)}</b> من {settings.maxScore}</li>
                    <li>أعلى درجة: <b>{analysis.post.max}</b></li>
                    <li>أقل درجة: <b>{analysis.post.min}</b></li>
                    <li>نسبة الإتقان: <b>{fmt(analysis.post.mastery)}%</b> ({analysis.post.masteryCount} طالب/ـة)</li>
                    <li>المستوى المرتفع: <b>{analysis.post.high}</b> | المتوسط: <b>{analysis.post.mid}</b> | المنخفض: <b>{analysis.post.low}</b></li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/30 text-center">
                <p className="text-lg font-bold">
                  تحسّن مستوى أداء الطلاب من <span className="text-primary">{fmt(analysis.pre.pct)}%</span> إلى <span className="text-primary">{fmt(analysis.post.pct)}%</span>
                </p>
                <p className="text-sm mt-1">
                  بفارق <b>{fmt(analysis.improvement)}</b> نقطة مئوية — نسبة الكسب: <b>{fmt(analysis.gain)}%</b>
                </p>
                <p className="text-sm mt-1">
                  تحسّن: <b className="text-green-600">{analysis.improved}</b> | ثبات: <b className="text-amber-600">{analysis.same}</b> | تراجع: <b className="text-red-600">{analysis.regressed}</b>
                </p>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Official Report (printable) */}
      {showReport && analysis.total > 0 && (
        <DiagnosticReport
          ref={reportRef}
          settings={settings}
          analysis={analysis}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
};

// ============== Official Report ==============

interface ReportProps {
  settings: DiagSettings;
  analysis: ReturnType<typeof Object> & any;
  onClose: () => void;
}

const DiagnosticReport = React.forwardRef<HTMLDivElement, ReportProps>(({ settings, analysis, onClose }, ref) => {
  const fmt = (n: number, d = 1) => (isFinite(n) ? n.toFixed(d) : '0');
  const improvedList = settings.improvedSkills.split('\n').map(s => s.trim()).filter(Boolean);
  const supportList = settings.needsSupportSkills.split('\n').map(s => s.trim()).filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-auto print:bg-white print:relative print:inset-auto print:overflow-visible" dir="rtl">
      <div className="container py-6 print:p-0">
        <div className="flex justify-end gap-2 mb-4 print:hidden">
          <Button variant="outline" onClick={onClose}>إغلاق</Button>
          <Button onClick={() => window.print()} className="gap-2">
            <Printer className="w-4 h-4" />
            طباعة التقرير
          </Button>
        </div>

        <div ref={ref} className="diagnostic-report bg-white text-black mx-auto" style={{ maxWidth: '800px' }}>
          {/* PAGE 1 */}
          <div className="report-page p-8" style={{ fontFamily: 'Tajawal, Cairo, sans-serif' }}>
            {/* Header */}
            <div className="rounded-t-2xl text-white p-4 flex items-center justify-between" style={{ background: '#1F4F4F' }}>
              <div className="text-right text-sm">
                <div>الإدارة العامة للتعليم بمنطقة مكة</div>
                <div>مكتب تعليم الجموم - {settings.grade || 'ابتدائية الجموم الثالثة'}</div>
              </div>
              <img src="/images/ministry-logo.jpeg" alt="وزارة التعليم" style={{ height: '60px' }} />
            </div>

            <div className="py-3 text-white text-center font-bold mb-5" style={{ background: '#1F4F4F' }}>
              استمارة تحليل الاختبار التشخيصي ( قبلي - بعدي )
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm mb-4">
              <div>اسم المعلمة: <b>{settings.teacher}</b></div>
              <div>تاريخ الاختبار القبلي: <b>{settings.preDate || '—'}</b></div>
              <div>المادة: <b>{settings.subject || '—'}</b></div>
              <div>تاريخ الاختبار البعدي: <b>{settings.postDate || '—'}</b></div>
              <div>المرحلة / الصف: <b>{settings.grade || '—'}</b></div>
              <div>عدد الطلاب المستهدفين: <b>{analysis.total} طالب/ـة</b></div>
            </div>

            <table className="w-full border-collapse text-sm mb-4">
              <thead>
                <tr style={{ background: '#1F4F4F', color: 'white' }}>
                  <th className="border p-2">الهدف من الاختبار القبلي<br/><span className="text-xs font-normal">(تشخيص مستوى الطلاب قبل التدريس)</span></th>
                  <th className="border p-2">الهدف من الاختبار البعدي<br/><span className="text-xs font-normal">(قياس مدى تحقق نواتج التعلم)</span></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3 align-top">{settings.preGoal}</td>
                  <td className="border p-3 align-top">{settings.postGoal}</td>
                </tr>
              </tbody>
            </table>

            {/* Pre */}
            <table className="w-full border-collapse text-sm mb-3">
              <thead>
                <tr style={{ background: '#1F4F4F', color: 'white' }}>
                  <th colSpan={2} className="border p-2">تحليل نتائج الاختبار القبلي</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border p-2 w-1/2">متوسط درجات الطلاب</td><td className="border p-2">{fmt(analysis.pre.avg)} من {settings.maxScore}</td></tr>
                <tr><td className="border p-2">أعلى درجة</td><td className="border p-2">{analysis.pre.max}</td></tr>
                <tr><td className="border p-2">أقل درجة</td><td className="border p-2">{analysis.pre.min}</td></tr>
                <tr><td className="border p-2">نسبة الإتقان<br/><span className="text-xs">نسبة الطلاب الذين حققوا المستوى الأدنى للإتقان</span></td><td className="border p-2">{fmt(analysis.pre.mastery)}%</td></tr>
                <tr style={{ background: '#E8F0F0' }}><td colSpan={2} className="border p-2 font-bold text-center">توزيع الطلاب حسب المستوى</td></tr>
                <tr><td className="border p-2">مرتفع</td><td className="border p-2">{analysis.pre.high}</td></tr>
                <tr><td className="border p-2">متوسط</td><td className="border p-2">{analysis.pre.mid}</td></tr>
                <tr><td className="border p-2">منخفض</td><td className="border p-2">{analysis.pre.low}</td></tr>
                <tr><td className="border p-2">أبرز نقاط القوة لدى الطلاب</td><td className="border p-2">&nbsp;</td></tr>
                <tr><td className="border p-2">أبرز نقاط الضعف لدى الطلاب</td><td className="border p-2">&nbsp;</td></tr>
              </tbody>
            </table>

            {/* Post */}
            <table className="w-full border-collapse text-sm mb-3">
              <thead>
                <tr style={{ background: '#1F4F4F', color: 'white' }}>
                  <th colSpan={2} className="border p-2">تحليل نتائج الاختبار البعدي</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="border p-2 w-1/2">متوسط الدرجات بعد التدريس</td><td className="border p-2">{fmt(analysis.post.avg)} من {settings.maxScore}</td></tr>
                <tr><td className="border p-2">أعلى درجة</td><td className="border p-2">{analysis.post.max}</td></tr>
                <tr><td className="border p-2">أقل درجة</td><td className="border p-2">{analysis.post.min}</td></tr>
                <tr><td className="border p-2">نسبة الإتقان</td><td className="border p-2">{fmt(analysis.post.mastery)}%</td></tr>
                <tr><td className="border p-2">تحسن مستوى أداء الطلاب</td><td className="border p-2">من {fmt(analysis.pre.pct)}% إلى {fmt(analysis.post.pct)}%</td></tr>
              </tbody>
            </table>

            <div className="rounded-lg text-white p-3 flex items-center justify-between text-sm mt-4" style={{ background: '#1F4F4F' }}>
              <div>إعداد وتصميم المعلمة: <b>{settings.teacher}</b></div>
              <div>مديرة المدرسة: <b>{settings.principal}</b></div>
            </div>
          </div>

          {/* PAGE 2 */}
          <div className="report-page p-8 page-break" style={{ fontFamily: 'Tajawal, Cairo, sans-serif' }}>
            <div className="rounded-t-2xl text-white p-4 flex items-center justify-between" style={{ background: '#1F4F4F' }}>
              <div className="text-right text-sm">
                <div>الإدارة العامة للتعليم بمنطقة مكة</div>
                <div>مكتب تعليم الجموم - {settings.grade || 'ابتدائية ومتوسطة الزلال'}</div>
              </div>
              <img src="/images/ministry-logo.jpeg" alt="وزارة التعليم" style={{ height: '60px' }} />
            </div>

            <div className="py-3 text-white text-center font-bold mb-5" style={{ background: '#1F4F4F' }}>
              استمارة تحليل الاختبار التشخيصي ( قبلي - بعدي )
            </div>

            <table className="w-full border-collapse text-sm mb-4">
              <thead>
                <tr style={{ background: '#1F4F4F', color: 'white' }}>
                  <th className="border p-2">المهارات التي تحسنت بشكل واضح</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3 align-top" style={{ minHeight: '120px', height: '120px' }}>
                    <ul className="list-disc pr-5 space-y-1">
                      {improvedList.length ? improvedList.map((s, i) => <li key={i}>{s}</li>) : <><li>&nbsp;</li><li>&nbsp;</li><li>&nbsp;</li></>}
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>

            <table className="w-full border-collapse text-sm mb-4">
              <thead>
                <tr style={{ background: '#1F4F4F', color: 'white' }}>
                  <th className="border p-2">المهارات التي ما زالت تحتاج إلى دعم</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border p-3 align-top" style={{ minHeight: '120px', height: '120px' }}>
                    <ul className="list-disc pr-5 space-y-1">
                      {supportList.length ? supportList.map((s, i) => <li key={i}>{s}</li>) : <><li>&nbsp;</li><li>&nbsp;</li><li>&nbsp;</li></>}
                    </ul>
                  </td>
                </tr>
              </tbody>
            </table>

            <h3 className="font-bold mb-2" style={{ color: '#1F4F4F' }}>توصيات مديرة المدرسة</h3>
            <ul className="list-disc pr-5 space-y-1 text-sm leading-7">
              <li>إعداد خطط علاجية بناءً على نتائج الاختبار التشخيصي.</li>
              <li>مراعاة الفروق الفردية وتنويع استراتيجيات التدريس.</li>
              <li>متابعة تقدم الطلاب باستخدام أساليب تقييم متنوعة.</li>
              <li>دعم الطلاب الضعفاء وإثراء المتفوقين.</li>
              <li>تطوير الأداء التدريسي بناءً على نتائج الاختبار البعدي.</li>
              <li>ضرورة الاستفادة من نتائج الاختبار التشخيصي في بناء خطط علاجية فردية وجماعية تستهدف نقاط الضعف لدى الطلاب.</li>
              <li>التأكيد على تنويع استراتيجيات التدريس بما يتناسب مع الفروق الفردية بين الطلاب، والتركيز على التعلم النشط.</li>
              <li>متابعة تقدم الطلاب بشكل مستمر من خلال أدوات تقييم متنوعة، وعدم الاكتفاء بالاختبارات التحريرية فقط.</li>
              <li>دعم الطلاب ذوي التحصيل المنخفض ببرامج علاجية مكثفة، مع إشراك أولياء الأمور في متابعة مستوى أبنائهم.</li>
              <li>تعزيز مهارات الطلاب المتفوقين من خلال تقديم أنشطة إثرائية وتحديات تعليمية مناسبة.</li>
              <li>الاستفادة من نتائج الاختبار البعدي في تقويم فاعلية أساليب التدريس المستخدمة، والعمل على تطويرها باستمرار.</li>
              <li>ضرورة التواصل الفعال وتبادل الخبرات للاستفادة من أفضل الممارسات التعليمية.</li>
              <li>أهمية الالتزام بخطط المتابعة والتقويم المستمر لضمان تحقيق نواتج التعلم المستهدفة.</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .diagnostic-report, .diagnostic-report * { visibility: visible; }
          .diagnostic-report { position: absolute; left: 0; top: 0; width: 100%; }
          .page-break { page-break-before: always; }
          @page { size: A4; margin: 10mm; }
        }
      `}</style>
    </div>
  );
});
DiagnosticReport.displayName = 'DiagnosticReport';

export default Diagnostic;
