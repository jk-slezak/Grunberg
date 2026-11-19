export type QuestComponentType = 
  | "defeat_enemy" 
  | "reach_location" 
  | "collect_item" 
  | "talk_to_npc";

export type QuestStatus = "available" | "active" | "completed" | "failed";

export type QuestType = "main" | "side" | "exploration" | "daily";

export interface QuestComponent {
  id: string;
  type: QuestComponentType;
  targetId: string;
  count: number;
  currentProgress: number;
  description: string;
}

export interface DefeatEnemyComponent extends QuestComponent {
  type: "defeat_enemy";
  enemyType: string;
}

export interface ReachLocationComponent extends QuestComponent {
  type: "reach_location";
  floor: number;
  locationId: string;
}

export interface CollectItemComponent extends QuestComponent {
  type: "collect_item";
  itemId: string;
}

export interface TalkToNpcComponent extends QuestComponent {
  type: "talk_to_npc";
  npcId: string;
}

export interface QuestRewards {
  exp: number;
  gold: number;
  items?: string[];
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  status: QuestStatus;
  components: QuestComponent[];
  rewards: QuestRewards;
  nextQuestIds?: string[];
  requirements?: string[];
}

export interface QuestProgress {
  activeQuests: Quest[];
  completedQuests: string[];
  availableQuests: string[];
  failedQuests: string[];
}

