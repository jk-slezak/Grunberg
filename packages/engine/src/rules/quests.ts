import { event } from "../events";
import { unchanged, withQuests, type Handlers } from "./core";

export const questRules = {
  START_QUEST: (state, { payload: quest }) => {
    const { activeQuests, completedQuests, availableQuests } = state.quests;
    if (activeQuests.some((q) => q.id === quest.id) || completedQuests.includes(quest.id)) {
      return unchanged(state);
    }
    return {
      state: withQuests(state, {
        activeQuests: [...activeQuests, { ...quest, status: "active" }],
        availableQuests: availableQuests.filter((id) => id !== quest.id),
      }),
      events: [event("QUEST_STARTED", { questId: quest.id })],
    };
  },

  UPDATE_QUEST: (state, { payload: { questId, updates } }) => {
    const { activeQuests } = state.quests;
    if (!activeQuests.some((q) => q.id === questId)) return unchanged(state);
    return {
      state: withQuests(state, {
        activeQuests: activeQuests.map((q) => (q.id === questId ? { ...q, ...updates } : q)),
      }),
      events: [],
    };
  },

  COMPLETE_QUEST: (state, { payload: questId }) => {
    const { activeQuests, completedQuests } = state.quests;
    const quest = activeQuests.find((q) => q.id === questId);
    if (!quest) return unchanged(state);
    return {
      state: withQuests(state, {
        activeQuests: activeQuests.filter((q) => q.id !== questId),
        completedQuests: [...completedQuests, questId],
      }),
      events: [event("QUEST_COMPLETED", { questId, rewards: { ...quest.rewards } })],
    };
  },

  FAIL_QUEST: (state, { payload: questId }) => {
    const { activeQuests, failedQuests } = state.quests;
    if (!activeQuests.some((q) => q.id === questId)) return unchanged(state);
    return {
      state: withQuests(state, {
        activeQuests: activeQuests.filter((q) => q.id !== questId),
        failedQuests: [...failedQuests, questId],
      }),
      events: [event("QUEST_FAILED", { questId })],
    };
  },
} satisfies Pick<Handlers, "START_QUEST" | "UPDATE_QUEST" | "COMPLETE_QUEST" | "FAIL_QUEST">;
