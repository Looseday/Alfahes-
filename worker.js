export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "GET") {
      return Response.json({
        project: "الفاحص الإداري",
        status: "working",
        message: "الخادم يعمل بنجاح"
      });
    }

    if (request.method !== "POST" || url.pathname !== "/analyze") {
      return Response.json(
        { error: "الطلب غير مدعوم" },
        { status: 404 }
      );
    }

    try {
      if (!env.OPENAI_API_KEY) {
        return Response.json(
          { error: "مفتاح الخدمة غير مهيأ" },
          { status: 503 }
        );
      }

      const data = await request.json();
      const problem = data.problem;

      if (
        typeof problem !== "string" ||
        !problem.trim() ||
        problem.length > 3000
      ) {
        return Response.json(
          { error: "أدخل وصف المشكلة بما لا يتجاوز 3000 حرف" },
          { status: 400 }
        );
      }

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            max_tokens: 500,
            messages: [
              {
                role: "system",
                content: `أنت محرك الفاحص الإداري.
مهمتك تشخيص المشكلات الإدارية بمنهج علمي.
لا تقدم توصيات قبل جمع الأدلة.
لا تفترض أن الأعراض هي الأسباب الجذرية.
اسأل ثلاثة أسئلة تشخيصية دقيقة
ومرتبطة بالمشكلة التي يصفها المستخدم.
اجعل الأسئلة واضحة وباللغة العربية.
لا تصدر حكمًا نهائيًا من المعلومات الأولية.`
              },
              {
                role: "user",
                content: problem.trim()
              }
            ]
          })
        }
      );

      if (!response.ok) {
        return Response.json(
          { error: "تعذر الاتصال بخدمة الذكاء الاصطناعي" },
          { status: 502 }
        );
      }

      const result = await response.json();

      return Response.json({
        success: true,
        questions: result.choices[0].message.content
      });

    } catch (error) {
      return Response.json(
        { error: "حدث خطأ أثناء معالجة الطلب" },
        { status: 500 }
      );
    }
  }
};
