import { apiFetch } from "../api/client";

/**
 * Generate initial story content
 */
export async function generateContent(type, themeId, age, length, difficulty, language = "en") {
  try {
    const response = await apiFetch("/api/v1/therapy/ai/generate-content/", {
      method: "POST",
      body: {
        content_type: type,
        theme: themeId,
        age,
        length,
        difficulty,
        language
      }
    });

    return response?.content || response;
  } catch (error) {
    console.error("Error generating content:", error);
    return null;
  }
}

/**
 * Continue story based on user choice
 */
export async function continueStory(context, choice, agent, turnsLeft, language = "en") {
  try {
    const response = await apiFetch("/api/v1/therapy/ai/continue-story/", {
      method: "POST",
      body: {
        context,
        choice,
        agent,
        turns_left: turnsLeft,
        language
      }
    });

    return response?.narrative || response;
  } catch (error) {
    console.error("Error continuing story:", error);
    return null;
  }
}
