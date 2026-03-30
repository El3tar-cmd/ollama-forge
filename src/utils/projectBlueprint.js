import { FILE_PLANS, getProjectContract } from "../config/constants.js";

const ALLOWED_ROLES = new Set([
  "deps", "config", "middleware", "database", "auth", "types", "validation",
  "ui", "api", "server", "service", "billing", "pwa", "styles", "logic", "docs",
]);

function uniqueFiles(files) {
  const seen = new Set();
  return files.filter((file) => {
    if (!file?.path || seen.has(file.path)) return false;
    seen.add(file.path);
    return true;
  });
}

function inferPages(files) {
  return files
    .filter((file) =>
      file.role === "ui" &&
      (file.path.endsWith(".html") || /page\.(tsx|jsx)$/.test(file.path) || /pages?\//.test(file.path))
    )
    .map((file) => ({ path: file.path, purpose: file.desc || "Page" }));
}

function defaultDesignSystem(appType) {
  const defaults = {
    nextjs: {
      visualDirection: "Modern product UI with one shared app shell",
      colorStrategy: "Use shared tokens and a consistent accent palette",
      typography: "Use one type scale across layouts and components",
      layoutPattern: "App router layouts with shared sections",
      componentRules: ["Reuse shared UI primitives", "Keep marketing and app shells visually related"],
    },
    "react-node": {
      visualDirection: "Single React design language across all client pages",
      colorStrategy: "Shared tokens with one accent family",
      typography: "One typography scale for all client screens",
      layoutPattern: "Shared client layout and sections",
      componentRules: ["Reuse layout/components", "Keep dashboard/forms stylistically aligned"],
    },
    api: {
      visualDirection: "No UI surface",
      colorStrategy: "N/A",
      typography: "N/A",
      layoutPattern: "Backend modules only",
      componentRules: ["No frontend files", "Document routes and services only"],
    },
    saas: {
      visualDirection: "Modern SaaS shell with unified marketing and dashboard design",
      colorStrategy: "Shared tokens between marketing and product areas",
      typography: "One consistent type system",
      layoutPattern: "Shared root shell plus marketing/dashboard layouts",
      componentRules: ["Reuse shared sections and cards", "Keep billing/auth/dashboard coherent"],
    },
    website: {
      visualDirection: "Static multi-page website with one cohesive visual identity",
      colorStrategy: "Shared CSS variables and reusable utility classes",
      typography: "One font system and spacing scale across all pages",
      layoutPattern: "Shared header/footer/navigation and repeated section rhythm",
      componentRules: ["All pages must load the same shared CSS files", "All pages must use the same JS entry points where relevant"],
    },
    pwa: {
      visualDirection: "Mobile-first app UI with one shared shell",
      colorStrategy: "Shared tokens tuned for app surfaces",
      typography: "Consistent app typography scale",
      layoutPattern: "Shared layout/navigation and reusable offline-first components",
      componentRules: ["Reuse app shell/components", "Keep install/offline UX aligned with the main UI"],
    },
  };

  return defaults[appType] || defaults.website;
}

export function normalizePlannerOutput(rawOutput, appType) {
  const baseFiles = FILE_PLANS[appType] || [];
  const contract = getProjectContract(appType);
  const rawFiles = Array.isArray(rawOutput) ? rawOutput : rawOutput?.files;
  const mergedFiles = uniqueFiles([
    ...baseFiles,
    ...((Array.isArray(rawFiles) ? rawFiles : []).map((file) => ({
      path: file?.path,
      role: ALLOWED_ROLES.has(file?.role) ? file.role : "logic",
      desc: file?.desc || "Generated file",
      icon: file?.icon || "📄",
    }))),
  ]);

  return {
    projectType: appType,
    stack: Array.isArray(rawOutput?.stack) && rawOutput.stack.length ? rawOutput.stack : contract.stack,
    designSystem: {
      ...defaultDesignSystem(appType),
      ...(rawOutput?.designSystem || {}),
      componentRules: Array.isArray(rawOutput?.designSystem?.componentRules) && rawOutput.designSystem.componentRules.length
        ? rawOutput.designSystem.componentRules
        : defaultDesignSystem(appType).componentRules,
    },
    pages: Array.isArray(rawOutput?.pages) && rawOutput.pages.length ? rawOutput.pages : inferPages(mergedFiles),
    sharedModules: Array.isArray(rawOutput?.sharedModules) ? rawOutput.sharedModules : [],
    files: mergedFiles,
  };
}
