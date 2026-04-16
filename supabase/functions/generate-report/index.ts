import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { analysisData } = await req.json();
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `أنتِ مساعدة تعليمية متخصصة في كتابة التقارير المدرسية باللغة العربية.
بناءً على بيانات تحليل النتائج التالية، قومي بتعبئة نموذج تقرير عن تحليل نتائج الاختبارات.

بيانات التحليل:
- الصف: ${analysisData.gradeName}
- المادة: ${analysisData.subject}
- المعلمة: ${analysisData.teacherName}
- الفصل الدراسي: ${analysisData.semester}
- العام الدراسي: ${analysisData.academicYear}
- عدد الطالبات: ${analysisData.studentCount}
- المتوسط: ${analysisData.average}
- نسبة التحصيل: ${analysisData.achievementPercentage}%
- أعلى درجة: ${analysisData.maxScore}
- أدنى درجة: ${analysisData.minScore}
- الانحراف المعياري: ${analysisData.standardDeviation}
- توزيع التقديرات: ممتاز: ${analysisData.gradeDistribution['ممتاز']}, جيد جداً: ${analysisData.gradeDistribution['جيد جداً']}, جيد: ${analysisData.gradeDistribution['جيد']}, مقبول: ${analysisData.gradeDistribution['مقبول']}, ضعيف: ${analysisData.gradeDistribution['ضعيف']}
- إتقان عالٍ (>90%): ${analysisData.highMastery} طالبة
- إتقان متوسط (70-90%): ${analysisData.mediumMastery} طالبة
- إتقان منخفض (<70%): ${analysisData.lowMastery} طالبة

أجب بصيغة JSON فقط بدون أي نص إضافي بالشكل التالي:
{
  "title": "عنوان التقرير",
  "generalObjective": "الهدف العام",
  "detailedObjective": "الهدف التفصيلي",
  "targetGroup": "الفئة المستهدفة",
  "targetCount": "عدد المستهدف",
  "actualAchieved": "المحقق الفعلي",
  "executionTime": "زمن التنفيذ",
  "executionCount": "عدد مرات التنفيذ",
  "executionPlace": "مكان التنفيذ",
  "achievementIndicator": "مؤشر الإنجاز",
  "findings": ["نتيجة 1", "نتيجة 2", "نتيجة 3", "نتيجة 4"],
  "statistics": "نص الإحصاءات",
  "recommendations": ["توصية 1", "توصية 2", "توصية 3", "توصية 4"]
}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "أنتِ مساعدة تعليمية. أجيبي دائماً بصيغة JSON فقط بدون markdown أو backticks." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";
    
    // Clean up potential markdown formatting
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const reportData = JSON.parse(content);

    return new Response(JSON.stringify(reportData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
