/* ══════════════════════════════════════════════════════
   usePlanner — Dynamic Project Planner Orchestrator
   ══════════════════════════════════════════════════════ */

import { useCallback } from "react";
import { useForge } from "../context/useForge.js";
import { FILE_PLANS, getProjectContract } from "../config/constants.js";
import { chatCompletion } from "../services/providerRouter.js";
import { buildPlannerPrompt, PLANNER_SYSTEM_MESSAGE } from "../config/prompts.js";
import { getApiKey } from "../utils/apiKey.js";
import { normalizePlannerOutput } from "../utils/projectBlueprint.js";

/**
 * Orchestrates the intelligent planning phase before generation.
 * Asks the LLM to output a JSON array of required files.
 */
export function usePlanner() {
  const { state, dispatch, Actions, addStep, abortRef } = useForge();

  const runPlanner = useCallback(async () => {
    if (!state.prompt.trim() || !state.model || !state.connected || state.loading) return null;

    dispatch({ type: Actions.START_PLANNING });
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    const basePlan = FILE_PLANS[state.appType] || [];
    const appTypeLabel = state.appType;
    const contract = getProjectContract(state.appType);

    addStep("info", `تخطيط ذكي لـ ${appTypeLabel}`, "يتم تحليل الفكرة وبناء هيكل الملفات...");

    try {
      const prompt = buildPlannerPrompt(
        appTypeLabel, 
        state.prompt, 
        state.features, 
        basePlan,
        contract
      );

      const apiKey = getApiKey(state);
      const content = await chatCompletion(
        state.provider,
        [PLANNER_SYSTEM_MESSAGE, { role: "user", content: prompt }],
        state.model,
        { temperature: 0.1, top_p: 0.9 },
        signal,
        apiKey
      );

      // Robust JSON extraction (supports object or array output)
      const objectStart = content.indexOf("{");
      const objectEnd = content.lastIndexOf("}");
      const arrayStart = content.indexOf("[");
      const arrayEnd = content.lastIndexOf("]");
      const useObject = objectStart !== -1 && objectEnd !== -1 && (objectStart < arrayStart || arrayStart === -1);
      const jsonStart = useObject ? objectStart : arrayStart;
      const jsonEnd = useObject ? objectEnd : arrayEnd;
      
      if (jsonStart === -1 || jsonEnd === -1) {
        throw new Error("الموديل لم يقم بإرجاع JSON صالح.");
      }

      let jsonString = content.substring(jsonStart, jsonEnd + 1);
      
      // Basic sanitization for common LLM JSON errors:
      // 1. Remove trailing commas before ] or }
      jsonString = jsonString.replace(/,\s*([\]}])/g, "$1");
      // 2. Remove unescaped newlines inside strings (very basic fix)
      jsonString = jsonString.replace(/\n/g, "");

      let plannerOutput;
      try {
        plannerOutput = JSON.parse(jsonString);
      } catch {
        console.error("Raw Invalid JSON:", jsonString);
        throw new Error("فشل في قراءة مخرجات الذكاء الاصطناعي (Invalid JSON Format). حاول مرة أخرى أو استخدم موديل أقوى.");
      }

      const blueprint = normalizePlannerOutput(plannerOutput, state.appType);
      const dynamicPlan = blueprint.files;

      if (!Array.isArray(dynamicPlan) || dynamicPlan.length === 0) {
        throw new Error("خطة الملفات المرجعة فارغة أو غير صالحة.");
      }

      dispatch({ type: Actions.PLANNING_DONE, payload: { files: dynamicPlan, blueprint } });

      // Show the full plan in the steps timeline so user can review it
      addStep(
        "think",
        `✅ خطة ذكية — ${dynamicPlan.length} ملف`,
        dynamicPlan.map(f => `${f.icon ?? "📄"} ${f.path} (${f.role})`).join(" · ")
      );

      return blueprint;

    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Planner Error:", err);
        dispatch({ type: Actions.PLANNING_ERROR });
        addStep("error", "فشل التخطيط الذكي", err.message);
      }
      return null;
    }
  }, [state, dispatch, Actions, addStep, abortRef]);

  return { runPlanner };
}
