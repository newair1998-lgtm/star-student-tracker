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
  eduDept: string;
  schoolName: string;
  applyDate: string;
  conclusion: string;
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
  eduDept: '',
  schoolName: '',
  applyDate: '',
  conclusion: 'يوصى بالاستمرار في الأسلوب أو البرنامج المطبق.\nيمكن تعميم التجربة على موضوعات مشابهة.\nيستفاد من النتائج في دعم الممارسات التعليمية الفاعلة.',
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

  const [bulkNames, setBulkNames] = useState('');
  const [bulkPre, setBulkPre] = useState('');
  const [bulkPost, setBulkPost] = useState('');

  const addBulkNames = () => {
    const names = bulkNames
      .split('\n')
      .map(n => n.trim().replace(/^[\d\s.\-\)]+/, '').trim())
      .filter(Boolean);
    if (!names.length) {
      toast({ title: 'لا توجد أسماء', description: 'الصق أسماء الطلاب أولاً', variant: 'destructive' });
      return;
    }
    setRows(prev => [
      ...prev,
      ...names.map(name => ({ id: crypto.randomUUID(), name, pre: '' as const, post: '' as const })),
    ]);
    setBulkNames('');
    toast({ title: 'تمت الإضافة', description: `تمت إضافة ${names.length} طالب/ـة` });
  };

  const normalizeDigits = (s: string) =>
    s.replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
     .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
     .replace(/٫|،/g, m => (m === '٫' ? '.' : ','));

  const parseNum = (v: string): number | null => {
    const n = Number(normalizeDigits(v).replace(/[^\d.\-]/g, ''));
    return isNaN(n) ? null : n;
  };

  const applyBulkScores = (kind: 'pre' | 'post', text: string) => {
    const values = normalizeDigits(text)
      .split(/[\n,\t\s]+/)
      .map(v => v.trim())
      .filter(v => v !== '');
    if (!values.length) {
      toast({ title: 'لا توجد درجات', description: 'الصق الدرجات أولاً', variant: 'destructive' });
      return;
    }
    setRows(prev => {
      const next = [...prev];
      let vi = 0;
      for (let i = 0; i < next.length && vi < values.length; i++) {
        if (!next[i].name.trim()) continue;
        const num = parseNum(values[vi]);
        if (num !== null) next[i] = { ...next[i], [kind]: num } as DiagRow;
        vi++;
      }
      return next;
    });
    if (kind === 'pre') setBulkPre(''); else setBulkPost('');
    toast({ title: 'تم التطبيق', description: `تم إدخال ${values.length} درجة` });
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
              <Label>اسم الاختبار / عنوان المهارة</Label>
              <Input value={settings.testName} onChange={e => setSettings({ ...settings, testName: e.target.value })} />
            </div>
            <div>
              <Label>المرحلة / الصف / الفصل</Label>
              <Input value={settings.grade} onChange={e => setSettings({ ...settings, grade: e.target.value })} placeholder="مثال: الثالث متوسط / ج" />
            </div>
            <div>
              <Label>الإدارة العامة للتعليم بـ</Label>
              <Input value={settings.eduDept} onChange={e => setSettings({ ...settings, eduDept: e.target.value })} />
            </div>
            <div>
              <Label>اسم المدرسة</Label>
              <Input value={settings.schoolName} onChange={e => setSettings({ ...settings, schoolName: e.target.value })} />
            </div>
            <div>
              <Label>تاريخ التطبيق</Label>
              <Input value={settings.applyDate} onChange={e => setSettings({ ...settings, applyDate: e.target.value })} placeholder="2025-11-14" />
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
            <div className="md:col-span-3">
              <Label>الاستنتاج (سطر لكل بند)</Label>
              <textarea
                className="w-full border rounded-md p-2 min-h-[80px] bg-background"
                value={settings.conclusion}
                onChange={e => setSettings({ ...settings, conclusion: e.target.value })}
              />
            </div>
          </div>
        </Card>

        {/* Bulk add panel */}
        <Card className="p-5 print:hidden">
          <h2 className="text-xl font-bold mb-4">الإضافة الجماعية</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>الصق أسماء الطلاب (سطر لكل اسم)</Label>
              <textarea
                className="w-full border rounded-md p-2 min-h-[120px] bg-background mt-1"
                value={bulkNames}
                onChange={e => setBulkNames(e.target.value)}
                placeholder="فاطمة أحمد&#10;نورة محمد&#10;سارة علي"
                dir="rtl"
              />
              <Button onClick={addBulkNames} size="sm" className="mt-2 w-full gap-1">
                <Plus className="w-4 h-4" /> إضافة الأسماء
              </Button>
            </div>
            <div>
              <Label>الصق درجات الاختبار القبلي (بنفس ترتيب الأسماء)</Label>
              <textarea
                className="w-full border rounded-md p-2 min-h-[120px] bg-background mt-1"
                value={bulkPre}
                onChange={e => setBulkPre(e.target.value)}
                placeholder="درجة في كل سطر أو مفصولة بفاصلة"
                dir="ltr"
              />
              <Button onClick={() => applyBulkScores('pre', bulkPre)} size="sm" variant="outline" className="mt-2 w-full">
                تطبيق درجات القبلي
              </Button>
            </div>
            <div>
              <Label>الصق درجات الاختبار البعدي (بنفس ترتيب الأسماء)</Label>
              <textarea
                className="w-full border rounded-md p-2 min-h-[120px] bg-background mt-1"
                value={bulkPost}
                onChange={e => setBulkPost(e.target.value)}
                placeholder="درجة في كل سطر أو مفصولة بفاصلة"
                dir="ltr"
              />
              <Button onClick={() => applyBulkScores('post', bulkPost)} size="sm" variant="outline" className="mt-2 w-full">
                تطبيق درجات البعدي
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            ملاحظة: تُطبَّق الدرجات على الطلاب بنفس الترتيب الموجود في الجدول أدناه. أضف الأسماء أولاً ثم الصق الدرجات.
          </p>
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
                          <Input inputMode="decimal" value={row.pre}
                            onChange={e => {
                              const v = e.target.value;
                              if (v === '') return updateRow(row.id, { pre: '' });
                              const n = parseNum(v);
                              if (n !== null) updateRow(row.id, { pre: n });
                            }} />
                        </td>
                        <td className="p-2">
                          <Input inputMode="decimal" value={row.post}
                            onChange={e => {
                              const v = e.target.value;
                              if (v === '') return updateRow(row.id, { post: '' });
                              const n = parseNum(v);
                              if (n !== null) updateRow(row.id, { post: n });
                            }} />
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

        {/* Analysis - matches official report image */}
        {analysis.total > 0 && (
          <div className="analysis-print bg-white text-black mx-auto" style={{ maxWidth: 900, fontFamily: 'Tajawal, Cairo, sans-serif' }}>
            {/* Top header */}
            <div className="flex items-stretch justify-between gap-3 p-3 border-b-2" style={{ borderColor: '#3a6b3a' }}>
              <div className="border rounded p-2 text-[10px] text-center text-gray-500 flex items-center justify-center" style={{ width: 90, minHeight: 60, borderColor: '#3a6b3a' }}>
                سيظهر شعار المدرسة هنا
              </div>
              <div className="flex-1 text-center">
                <div className="font-bold text-lg">الإدارة العامة للتعليم بـ {settings.eduDept || '............'}</div>
                <div className="text-sm">{settings.schoolName || 'اسم المدرسة سيظهر هنا'}</div>
              </div>
              <img src="/images/ministry-logo.jpeg" alt="وزارة التعليم" style={{ height: 64 }} />
            </div>

            {/* Title bar */}
            <div className="text-white text-center font-bold py-2 my-3 rounded" style={{ background: '#3a6b3a' }}>
              نتائج الاختبارات القبلية والبعدية
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-4 gap-2 px-3 mb-3 text-sm">
              <div className="border rounded p-2 text-center" style={{ borderColor: '#cfd8cf' }}>
                <div className="text-xs text-gray-500">📘 المادة</div>
                <div className="font-bold">{settings.subject || '—'}</div>
              </div>
              <div className="border rounded p-2 text-center" style={{ borderColor: '#cfd8cf' }}>
                <div className="text-xs text-gray-500">📅 تاريخ التطبيق</div>
                <div className="font-bold">{settings.applyDate || '—'}</div>
              </div>
              <div className="border rounded p-2 text-center" style={{ borderColor: '#cfd8cf' }}>
                <div className="text-xs text-gray-500">🏫 الصف / الفصل</div>
                <div className="font-bold">{settings.grade || '—'}</div>
              </div>
              <div className="border rounded p-2 text-center" style={{ borderColor: '#cfd8cf' }}>
                <div className="text-xs text-gray-500">🎯 الدرجة العظمى</div>
                <div className="font-bold">{settings.maxScore}</div>
              </div>
              <div className="col-span-4 border rounded p-2" style={{ borderColor: '#cfd8cf' }}>
                <div className="text-xs text-gray-500">عنوان المهارة / البرنامج / الدرس</div>
                <div className="font-bold">{settings.testName || '—'}</div>
              </div>
            </div>

            {/* Warning */}
            {analysis.pre.count !== analysis.post.count && (
              <div className="mx-3 mb-3 text-center text-sm font-bold p-2 rounded" style={{ background: '#fde8e8', color: '#b91c1c' }}>
                تنبيه: عدد درجات الاختبار القبلي ({analysis.pre.count}) لا يساوي عدد درجات الاختبار البعدي ({analysis.post.count}). تم احتساب المؤشرات على أول {Math.min(analysis.pre.count, analysis.post.count)} درجة متطابقة فقط.
              </div>
            )}

            {/* Stat tiles */}
            <div className="grid grid-cols-5 gap-2 px-3 mb-3">
              {[
                { label: 'عدد الطلاب', val: analysis.total, unit: 'طالب' },
                { label: 'متوسط القبلي', val: fmt(analysis.pre.avg), unit: 'درجة' },
                { label: 'متوسط البعدي', val: fmt(analysis.post.avg), unit: 'درجة' },
                { label: 'مقدار التحسن', val: fmt(analysis.post.avg - analysis.pre.avg), unit: 'درجة' },
                { label: 'نسبة التحسن', val: fmt(analysis.improvement), unit: '%' },
              ].map((t, i) => (
                <div key={i} className="border rounded p-2 text-center" style={{ borderColor: '#cfd8cf', background: '#f6faf6' }}>
                  <div className="text-xs">{t.label}</div>
                  <div className="text-2xl font-bold" style={{ color: '#3a6b3a' }}>{t.val}</div>
                  <div className="text-[10px] text-gray-500">{t.unit}</div>
                </div>
              ))}
            </div>

            {/* Bars + Distribution */}
            <div className="grid grid-cols-2 gap-3 px-3 mb-3">
              <div className="border rounded p-3" style={{ borderColor: '#cfd8cf' }}>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs text-gray-500">بالدرجة العظمى</div>
                  <div className="font-bold">📊 مقارنة المتوسطات</div>
                </div>
                {[
                  { label: 'القبلي', val: analysis.pre.avg, color: '#7fb069' },
                  { label: 'البعدي', val: analysis.post.avg, color: '#3a6b3a' },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2 text-sm">
                    <div className="w-12 text-left font-bold">{b.label}</div>
                    <div className="flex-1 h-5 rounded-full" style={{ background: '#e8f0e8' }}>
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, (b.val / settings.maxScore) * 100)}%`, background: b.color }} />
                    </div>
                    <div className="w-10 text-right font-bold">{fmt(b.val)}</div>
                  </div>
                ))}
                <div className="text-[10px] text-gray-500 text-center mt-1">يعرض طول الشريط مستوى المتوسط مقارنة بالدرجة العظمى</div>
              </div>
              <div className="border rounded p-3" style={{ borderColor: '#cfd8cf' }}>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs text-gray-500">تحسن / ثبات / انخفاض</div>
                  <div className="font-bold">📈 توزيع الطلاب</div>
                </div>
                {[
                  { label: 'متحسنون', val: analysis.improved, color: '#7fb069' },
                  { label: 'ثابتون', val: analysis.same, color: '#9ca3af' },
                  { label: 'انخفضوا', val: analysis.regressed, color: '#e0a060' },
                ].map((b, i) => {
                  const pct = analysis.total ? (b.val / analysis.total) * 100 : 0;
                  return (
                    <div key={i} className="flex items-center gap-2 mb-2 text-sm">
                      <div className="w-12 text-left font-bold">{Math.round(pct)}%</div>
                      <div className="flex-1 h-5 rounded-full" style={{ background: '#f1f4f1' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: b.color }} />
                      </div>
                      <div className="w-16 text-right">{b.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary + Statistical notes */}
            <div className="grid grid-cols-2 gap-3 px-3 mb-3">
              <div className="border rounded p-3" style={{ borderColor: '#cfd8cf' }}>
                <div className="font-bold mb-2 text-right">📝 ملخص النتيجة</div>
                <ul className="text-sm space-y-1 list-disc pr-5">
                  <li>أظهرت النتائج تحسّناً {analysis.improvement > 0 ? 'مرتفعاً' : 'محدوداً'} بين الاختبار القبلي والاختبار البعدي.</li>
                  <li>{analysis.improvement > 0 ? 'ارتفع' : 'انخفض'} متوسط الأداء بعد التطبيق بصورة واضحة.</li>
                  <li>تشير البيانات إلى أثر {analysis.improvement > 0 ? 'إيجابي' : 'محدود'} ملحوظ على مستوى الطلاب.</li>
                </ul>
              </div>
              <div className="border rounded p-3" style={{ borderColor: '#cfd8cf' }}>
                <div className="font-bold mb-2 text-right">🔍 الملاحظات الإحصائية</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="border rounded p-2" style={{ borderColor: '#e5e7eb' }}>أعلى قبلي / بعدي: <b>{analysis.pre.max} / {analysis.post.max}</b></div>
                  <div className="border rounded p-2" style={{ borderColor: '#e5e7eb' }}>أقل قبلي / بعدي: <b>{analysis.pre.min} / {analysis.post.min}</b></div>
                  <div className="border rounded p-2" style={{ borderColor: '#e5e7eb' }}>المتحسنون: <b>{analysis.improved}</b></div>
                  <div className="border rounded p-2" style={{ borderColor: '#e5e7eb' }}>لم يتغيروا: <b>{analysis.same}</b></div>
                  <div className="border rounded p-2" style={{ borderColor: '#e5e7eb' }}>انخفضوا: <b>{analysis.regressed}</b></div>
                  <div className="border rounded p-2" style={{ borderColor: '#e5e7eb' }}>عدد الطلاب: <b>{analysis.total}</b> محسوبة من {analysis.total}</div>
                </div>
              </div>
            </div>

            {/* Conclusion */}
            <div className="px-3 mb-3">
              <div className="border rounded p-3" style={{ borderColor: '#cfd8cf' }}>
                <div className="font-bold mb-2 text-right">💡 الاستنتاج</div>
                <ul className="text-sm space-y-1 list-disc pr-5">
                  {settings.conclusion.split('\n').map(s => s.trim()).filter(Boolean).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer signatures */}
            <div className="grid grid-cols-3 gap-3 px-3 pt-4 mt-4 border-t text-sm text-center" style={{ borderColor: '#3a6b3a' }}>
              <div>
                <div className="font-bold mb-2">اسم المعلم</div>
                <div>{settings.teacher || '—'}</div>
                <div className="text-xs text-gray-500 mt-1">التوقيع: ............</div>
              </div>
              <div>
                <div className="font-bold mb-2">الختم المدرسي</div>
                <div className="mx-auto rounded-full border-2 border-dashed" style={{ width: 60, height: 60, borderColor: '#9ca3af' }} />
              </div>
              <div>
                <div className="font-bold mb-2">مدير المدرسة</div>
                <div>{settings.principal || '—'}</div>
                <div className="text-xs text-gray-500 mt-1">التوقيع: ............</div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Print CSS for analysis */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .analysis-print, .analysis-print * { visibility: visible; }
          .analysis-print { position: absolute; left: 0; top: 0; width: 100%; }
          @page { size: A4; margin: 8mm; }
        }
      `}</style>

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
