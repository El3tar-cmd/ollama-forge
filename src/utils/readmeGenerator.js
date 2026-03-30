import { getProjectContract } from "../config/constants.js";

function getRunCommands(projectType, files) {
  const hasPackageJson = Boolean(files["package.json"]);
  if (projectType === "website") {
    return [
      "افتح ملفات HTML مباشرة في المتصفح أو عبر أي static server.",
      "يمكنك نشر المشروع على أي استضافة static.",
    ];
  }

  if (!hasPackageJson) {
    return ["راجع بنية الملفات المولدة لتحديد أوامر التشغيل المناسبة."];
  }

  const commandsByType = {
    nextjs: ["npm install", "npm run dev", "npm run build", "npm run start"],
    "react-node": ["npm install", "npm run dev", "npm run build"],
    api: ["npm install", "npm run dev", "npm run build"],
    saas: ["npm install", "npm run dev", "npm run build", "npm run start"],
    pwa: ["npm install", "npm run dev", "npm run build", "npm run preview"],
  };

  return commandsByType[projectType] || ["npm install", "npm run dev"];
}

function groupFiles(files) {
  return Object.keys(files).sort().map((path) => `- \`${path}\``).join("\n");
}

export function generateProjectReadme({ projectName, prompt, features, blueprint, files }) {
  const contract = getProjectContract(blueprint.projectType);
  const commands = getRunCommands(blueprint.projectType, files);
  const pages = (blueprint.pages || []).map((page) => `- \`${page.path}\`${page.purpose ? `: ${page.purpose}` : ""}`).join("\n");
  const sharedModules = (blueprint.sharedModules || []).length
    ? blueprint.sharedModules.map((item) => `- ${item}`).join("\n")
    : "- لا توجد وحدات مشتركة إضافية محددة في المخطط.";

  return `# ${projectName}

${prompt}

## النوع والـ Stack

- النوع: ${blueprint.projectType}
- الـ Stack الرسمي: ${(contract.stack || []).join(", ")}
- الميزات المطلوبة: ${(features || []).join(", ") || "بدون ميزات إضافية"}

## التصميم والمعمارية

- الاتجاه البصري: ${blueprint.designSystem?.visualDirection || "تصميم موحد"}
- استراتيجية الألوان: ${blueprint.designSystem?.colorStrategy || "Shared tokens"}
- التيبوغرافي: ${blueprint.designSystem?.typography || "نظام موحد"}
- نمط التخطيط: ${blueprint.designSystem?.layoutPattern || "Shared layout"}

## الصفحات أو الأسطح الأساسية

${pages || "- لا توجد صفحات موثقة في المخطط."}

## الوحدات المشتركة

${sharedModules}

## الملفات المولدة

${groupFiles(files)}

## التشغيل

${commands.map((command) => `\`${command}\``).join("\n\n")}

## ملاحظات

- هذا التوثيق مشتق من المخطط والملفات المولدة فعلياً.
- لا تعتمد على أي تقنيات أو مسارات غير المذكورة أعلاه.
`;
}
