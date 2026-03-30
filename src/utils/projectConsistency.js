import { getProjectContract } from "../config/constants.js";

function getExtension(path) {
  const lastDot = path.lastIndexOf(".");
  return lastDot === -1 ? "" : path.slice(lastDot);
}

function containsForbiddenPattern(content, contract) {
  return (contract.forbiddenPatterns || []).find((item) => item.pattern.test(content));
}

function buildPageAssetMap(files) {
  return Object.entries(files)
    .filter(([path]) => path.endsWith(".html"))
    .map(([path, content]) => ({
      path,
      styles: [...content.matchAll(/href="([^"]+\.css)"/g)].map((match) => match[1]),
      scripts: [...content.matchAll(/src="([^"]+\.js)"/g)].map((match) => match[1]),
    }));
}

export function validateGeneratedFile(path, content, blueprint) {
  const contract = getProjectContract(blueprint.projectType);
  const issues = [];
  const extension = getExtension(path);

  if (contract.allowedExtensions?.length && extension && !contract.allowedExtensions.includes(extension)) {
    issues.push({
      msg: "Type Contract",
      status: "fail",
      detail: `Extension ${extension} is not allowed for ${blueprint.projectType}`,
    });
  }

  const forbidden = containsForbiddenPattern(content, contract);
  if (forbidden) {
    issues.push({
      msg: "Stack Discipline",
      status: "fail",
      detail: `Detected forbidden technology for ${blueprint.projectType}: ${forbidden.label}`,
    });
  }

  if (blueprint.projectType === "website" && path.endsWith(".html")) {
    const sharedAssets = contract.requiredSharedAssets || [];
    const missingAssets = sharedAssets.filter((asset) => !content.includes(asset));
    if (missingAssets.length > 0) {
      issues.push({
        msg: "Shared Assets",
        status: "warn",
        detail: `Missing shared website assets: ${missingAssets.join(", ")}`,
      });
    }
  }

  if (path === "README.md" && forbidden) {
    issues.push({
      msg: "Docs Accuracy",
      status: "fail",
      detail: `README references forbidden stack content: ${forbidden.label}`,
    });
  }

  return issues;
}

export function validateProjectConsistency(files, blueprint) {
  const contract = getProjectContract(blueprint.projectType);
  const errors = [];
  const filePaths = Object.keys(files);

  for (const requiredPath of contract.requiredPaths || []) {
    if (!filePaths.includes(requiredPath)) {
      errors.push(`Missing required file for ${blueprint.projectType}: ${requiredPath}`);
    }
  }

  for (const [path, content] of Object.entries(files)) {
    const issues = validateGeneratedFile(path, content, blueprint).filter((item) => item.status === "fail");
    for (const issue of issues) {
      errors.push(`${path}: ${issue.detail}`);
    }
  }

  if (blueprint.projectType === "website") {
    const pageAssets = buildPageAssetMap(files);
    if (pageAssets.length > 1) {
      const baselineStyles = JSON.stringify(pageAssets[0].styles);
      const baselineScripts = JSON.stringify(pageAssets[0].scripts);
      for (const page of pageAssets.slice(1)) {
        if (JSON.stringify(page.styles) !== baselineStyles) {
          errors.push(`${page.path}: stylesheets differ from the shared website asset contract`);
        }
        if (JSON.stringify(page.scripts) !== baselineScripts) {
          errors.push(`${page.path}: script references differ from the shared website asset contract`);
        }
      }
    }
  }

  return errors;
}
