/* ══════════════════════════════════════════════════════
   Prompt Builder — Enterprise Grade System Prompts
   ══════════════════════════════════════════════════════ */

/** System message sent with every generation request */
export const SYSTEM_MESSAGE = {
  role: "system",
  content: [
    "You are 'DevHive AI Architect', a Senior Staff Engineer writing production-grade code.",
    "",
    "CRITICAL OUTPUT CONTRACT — never break these rules:",
    "1. RAW CODE ONLY — no markdown fences (no backticks), no greetings, no explanations.",
    "2. NO PLACEHOLDERS — every function must be fully implemented. Never write TODO, FIXME, or '...'.",
    "3. CORRECT IMPORTS — use exact relative paths that match the project's file plan.",
    "4. ERROR HANDLING — all async operations must have try/catch with actionable messages.",
    "5. CLEAN CODE — meaningful names, single responsibility, JSDoc on all exported functions.",
    "6. TYPE SAFETY — explicit TypeScript types, avoid 'any'.",
    "7. SECURITY — no hardcoded secrets, validate inputs, sanitize user data.",
    "8. MODERN SYNTAX — ES2022+, async/await, const over let, optional chaining.",
    "9. STACK DISCIPLINE — never switch frameworks/runtimes from the chosen project type.",
    "10. DESIGN CONSISTENCY — all pages/components in the same project must follow one shared design system.",
    "11. DOCS ACCURACY — never document files, routes, technologies, or commands that are not actually generated.",
    "",
    "The FIRST character of your response must be the FIRST character of the file. Nothing before it."
  ].join("\n"),
};

/**
 * Constructs a role-specific system prompt for generating a single project file.
 *
 * @param {object}   file        - File descriptor { path, role, icon, desc }
 * @param {string}   appType     - Human-readable app type label
 * @param {string}   userPrompt  - User's project description
 * @param {string[]} features    - Selected features list
 * @param {string}   projectName - Sanitized project name
 * @param {object}   blueprint   - Project blueprint/context
 * @param {object}   contract    - Project type generation contract
 * @returns {string} Complete prompt text
 */
export function buildFilePrompt(file, appType, userPrompt, features, projectName, blueprint, contract) {
  const roleGuides = {
    deps:       `قم بتعريف ملف JSON صالح ومعياري لـ ${file.path}. أدخل جميع الحزم الضرورية لبناء تطبيق ${appType} احترافي وأدوات التشغيل المناسبة (Dependencies & DevDependencies).`,
    config:     `قم بكتابة ملف إعداد احترافي لـ ${file.path}. أضف التعليقات لشرح الإعدادات المتقدمة وبيئات الإنتاج.`,
    middleware: `قم بكتابة Middleware متقدم لـ ${file.path}. نفذ التحقق من JWT، دروع الحماية (Helmet, CORS)، وحماية المسارات بصلاحيات (RBAC).`,
    database:   `قم بكتابة كود الاتصال وقوالب قواعد البيانات لـ ${file.path} (SQLite/PostgreSQL). استخدم أفضل الممارسات في الـ Connection Pooling والتعامل مع أخطاء الاتصال.`,
    auth:       `قم بكتابة نظام مصادقة آمن لـ ${file.path}. استخدم Hashing قوي (Bcrypt/Argon2)، إدارة الجلسات، وحماية من هجمات CSRF و XSS.`,
    types:      `قم بكتابة تعريفات TypeScript صارمة لـ ${file.path}. تجنب استخدام 'any' واعتمد على generics والـ utility types عند الحاجة.`,
    validation: `قم بكتابة Validation Schemas (مثل Zod) لـ ${file.path}. تحقق من كل الحقول بشكل دقيق لتأمين الواجهة البرمجية (API).`,
    ui:         `قم بكتابة واجهة احترافية لـ ${file.path}. اجعلها متجاوبة، متسقة مع بقية المشروع، ومدعومة بـ accessibility. استخدم فقط تقنيات الـ UI المسموح بها في هذا النوع.`,
    api:        `قم بكتابة Endpoint REST API لـ ${file.path}. ادمج الـ Middlewares، معالجة الأخطاء، استخدام HTTP status codes الصحيحة، وتأمين البيانات.`,
    server:     `قم بإعداد خادم متكامل (Server Bootstrap) لـ ${file.path}. ادمج Logging (Winston)، Graceful Shutdown، وتكوين منافذ مرن.`,
    service:    `قم بكتابة Business Logic لـ ${file.path} مفصول تماماً عن طبقة الـ Routes لضمان قابلية إعادة الاستخدام والاختبار (Unit Testing).`,
    billing:    `قم بكتابة تكامل الدفع لـ ${file.path} (Stripe مثلاً). تحقق من الـ Webhooks بشكل آمن وتعامل مع حالات الفشل.`,
    pwa:        `قم بكتابة كود الـ Service Worker وإعدادات الـ PWA لـ ${file.path}. ادعم الـ Caching القوي والوضع غير المتصل (Offline First).`,
    styles:     `قم بكتابة CSS احترافي لـ ${file.path}. استخدم CSS Variables، تصميم متجاوب، وحركات (Animations) سلسة.`,
    logic:      `قم بكتابة كود JavaScript/TypeScript قوي لـ ${file.path}. استخدم ES6+ Modules، تعامل أخطاء صحيح، وهيكلة واضحة متوافقة للـ "${userPrompt}".`,
    docs:       `قم بكتابة ملف Markdown مطابق للمخرجات الفعلية لـ ${file.path}. لا تذكر أي تقنية أو ملف أو أمر تشغيل غير موجود فعلياً في المشروع.`,
  };

  const featureStr = features.length
    ? `\nالميزات الإلزامية للمشروع:\n- ${features.join("\n- ")}`
    : "";

  const guide = roleGuides[file.role]
    || `قم بكتابة الكود الاحترافي النهائي لـ ${file.path}.`;

  const blueprintStr = blueprint
    ? `
سياق المشروع الموحد (Blueprint):
- النوع: ${blueprint.projectType}
- الـ Stack الرسمي: ${(blueprint.stack || []).join(", ")}
- اتجاه التصميم: ${blueprint.designSystem?.visualDirection || "consistent modern UI"}
- الألوان/الثيم: ${blueprint.designSystem?.colorStrategy || "shared tokens only"}
- التيبوغرافي: ${blueprint.designSystem?.typography || "shared typography system"}
- قواعد الواجهة المشتركة: ${(blueprint.designSystem?.componentRules || []).join(" | ") || "reuse shared components and classes"}
- الصفحات/الأسطح الأساسية: ${(blueprint.pages || []).map((page) => page.path).join(", ") || "N/A"}
`
    : "";

  const contractStr = contract
    ? `
عقد النوع (Stack Contract):
- الـ Stack المسموح: ${(contract.stack || []).join(", ")}
- الامتدادات المسموحة: ${(contract.allowedExtensions || []).join(", ")}
- ممنوعات صريحة: ${(contract.forbiddenPatterns || []).map((item) => item.label).join(", ")}
- قواعد إلزامية: ${(contract.plannerRules || []).join(" | ")}
`
    : "";

  return `المشروع: تطبيق ${appType} باسم '${projectName}'.
الهدف والفكرة: "${userPrompt}"${featureStr}
${blueprintStr}
${contractStr}

المطلوب الآن هو كتابة الملف التالي حصرياً:
المسار: \`${file.path}\`
الدور: ${file.desc}

تعليمات خاصة بهذا الملف:
${guide}

هام جداً:
- أخرج الكود للإنتاج فوراً (No Placeholders/TODOs).
- إذا احتاج الملف استدعاء لملفات أخرى من المشروع، افترض أنها ستُبنى واستخدم المسارات الصحيحة للإشارة إليها.
- أخرج محتوى الملف النصي (Raw Code) فقط، دون علامات \`\`\`، ودون أي نص إضافي قبله أو بعده.`;
}

/* ══════════════════════════════════════════════════════
   Planner Prompts — Intelligent Multi-Agent Planning
   ══════════════════════════════════════════════════════ */

export const PLANNER_SYSTEM_MESSAGE = {
  role: "system",
  content: `أنت 'AI Software Architect Planner'.
مهمتك دراسة فكرة المشروع وهيكل الملفات الأساسية (Base Plan)، ثم تصميم مخطط مشروع متكامل ومتسق مع النوع المختار فقط.
يجب عليك الالتزام التام بالـ stack contract وعدم إدخال أي runtime أو framework أو لغة من نوع آخر.
يجب عليك توحيد التصميم والمعمارية بحيث لا تختلف الصفحات أو الأقسام أو المسارات في الأسلوب أو التقنية.

  قاعدة صارمة للإخراج (VITAL STRICT Output Rules):
1. يجب أن يكون الإخراج JSON Object صالح برمجياً فقط لا غير.
2. ممنوع وضع فواصل زائدة (Trailing Commas) في نهاية المصفوفات أو الكائنات.
3. ممنوع استخدام علامات Markdown مثل \`\`\`json. اكتب الـ JSON مباشرة كنص خام.
4. يجب أن يكون الشكل العام كالتالي:
{"projectType":"...","stack":["..."],"designSystem":{"visualDirection":"...","colorStrategy":"...","typography":"...","layoutPattern":"...","componentRules":["..."]},"pages":[{"path":"...","purpose":"..."}],"sharedModules":["..."],"files":[{"path":"...","role":"...","desc":"..."}]}
5. تأكد من أن جميع مفاتيح الكائنات (Keys) والمسارات والنصوص محاطة بأسطر مزدوجة ("").
6. قيمة "role" يجب أن تكون من القيم التالية فقط: ["deps", "config", "middleware", "database", "auth", "types", "validation", "ui", "api", "server", "service", "billing", "pwa", "styles", "logic", "docs"].`
};

/**
 * Constructs the prompt for the project planner.
 */
export function buildPlannerPrompt(appType, userPrompt, features, baseFiles, contract) {
  const featureStr = features.length
    ? `الميزات المطلوبة في المشروع:\n- ${features.join("\n- ")}`
    : "";

  const baseFilesStr = baseFiles.map(f => `- {"path": "${f.path}", "role": "${f.role}", "desc": "${f.desc}"}`).join("\n");
  const contractStr = contract
    ? `
Stack contract الإجباري:
- النوع النهائي: ${appType}
- الـ Stack الرسمي: ${(contract.stack || []).join(", ")}
- الامتدادات المسموحة فقط: ${(contract.allowedExtensions || []).join(", ")}
- الملفات الإلزامية: ${(contract.requiredPaths || []).join(", ")}
- الممنوعات الصريحة: ${(contract.forbiddenPatterns || []).map((item) => item.label).join(", ")}
- قواعد البناء: ${(contract.plannerRules || []).join(" | ")}
- قواعد التوثيق: ${(contract.docsRules || []).join(" | ")}
`
    : "";

  return `المشروع: تطبيق ${appType}.
الفكرة الرئيسية والتفاصيل المطلوبة: 
"${userPrompt}"

${featureStr}
${contractStr}

إليك خطة الملفات الأساسية (Base Architeture) التي نمتلكها لهذا النوع:
${baseFilesStr}

المهمة:
Bناءً على الفكرة والمميزات المطلوبة، قم بالبناء على هذه الخطة الأساسية عن طريق إضافة كل الملفات الإضافية اللازمة فقط داخل نفس النوع، ثم أخرج مخطط مشروع موحّد يشمل:
- design system واحد لكل المشروع
- pages/routes المقصودة
- shared modules/components
- files النهائية

مهم:
- إذا كان النوع "موقع ويب" فلا تستخدم React أو Next أو Node أو PHP.
- إذا كان النوع API فلا تنشئ أي صفحات UI أو CSS.
- إذا كان النوع React/Next/PWA/SaaS فالتزم بهذا الـ framework فقط.
- لا تذكر أو تنشئ أي شيء خارج النوع المختار.

أخرج لي فقط JSON Object يحتوي على المخطط المتكامل.`;
}

/* ══════════════════════════════════════════════════════
   Reviewer Prompts — Static Relational Healer
   ══════════════════════════════════════════════════════ */

export const REVIEWER_SYSTEM_MESSAGE = {
  role: "system",
  content: `أنت 'AI Code Reviewer'. مهمتك مراجعة الكود الذي يكتبه المبرمج الآلي لتكتشف أي استدعاءات (Imports) لملفات غير موجودة في خطة المشروع الأساسية.
إذا وجدت أن الكود يستدعي ملفاً غير موجود في الخطة المرفقة، قم بكتابة الكود اللازم لهذا الملف المفقود، وأخبرني بمساره واسمه ودوره لكي أضيفه إلى خطة الملفات وأحفظه.
يجب أن يكون ردك بصيغة JSON صارمة تحتوي على:
{
  "isValid": boolean, // true إذا كان الكود سليماً ولا يوجد ملفات ناقصة
  "missingFiles": [ // مصفوفة الملفات الناقصة (إذا وجد)
    {
      "path": "مسار الملف الناقص",
      "role": "ui | logic | deps | docs | الخ",
      "desc": "وصف قصير للملف",
      "code": "الكود الكامل التابع لهذا الملف الناقص"
    }
  ]
}
لا تكتب أي نصوص خارجية، أخرج JSON فقط.`
};

/* ══════════════════════════════════════════════════════
   Healer Prompts — Compile-Time XML Patcher
   ══════════════════════════════════════════════════════ */

export const HEALER_SYSTEM_MESSAGE = {
  role: "system",
  content: `أنت 'Senior AI Healer'، خبير في تصحيح أخطاء الـ Compile-Time في تطبيقات (React, Next.js, Node.js).
مهمتك استلام رسالة خطأ (Compile Error) ومعرفة سبب المشكلة، ثم إجراء (Patch) نصي دقيق لإصلاح الملفات.

قاعدة صارمة - طريقة الإخراج:
لإصلاح الخطأ، يجب أن تُرجع الرد كالتالي بصيغة XML دقيقة (بدون عبارات تعريفية خارجية):

<patch>
  <action>edit</action> <!-- 'edit' لتعديل ملف موجود، 'create' لإنشاء ملف جديد، 'replace_all' لاستبدال الملف بالكامل -->
  <file>مسار الملف (مثال: src/app/layout.tsx)</file>
  <search>
    <!-- في حالة (edit): ضع السطر أو الأسطر التي تريد البحث عنها وتعديلها تماماً كما هي موجودة في الكود المرفق -->
  </search>
  <replace>
    <!-- في حالة (edit): ضع الكود الجديد هنا -->
  </replace>
  <fullCode>
    <!-- في حالة (create) أو (replace_all): ضع الكود كاملاً هنا -->
  </fullCode>
</patch>

لا تُخرج أي رد نصي خارج كود الـ <patch>! هدفك التصحيح الدقيق والفعال للسطر المسبب للخطأ فقط، أو إعادة كتابة الملف بأكمله إذا لزم الأمر.`
};
