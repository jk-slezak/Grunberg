import type { GameState } from "../types/gameState";

const SAVE_KEY = "grunberg_save";
const SAVE_VERSION = "1.0.0";

export interface SaveData {
  version: string;
  state: GameState;
  timestamp: number;
}

export class SaveService {
  static saveToLocalStorage(state: GameState): boolean {
    try {
      const saveData: SaveData = {
        version: SAVE_VERSION,
        state: {
          ...state,
          metadata: {
            ...state.metadata,
            lastSaved: Date.now(),
          },
        },
        timestamp: Date.now(),
      };

      const serialized = JSON.stringify(saveData);
      localStorage.setItem(SAVE_KEY, serialized);
      return true;
    } catch (error) {
      console.error("Failed to save game:", error);
      return false;
    }
  }

  static loadFromLocalStorage(): GameState | null {
    try {
      const serialized = localStorage.getItem(SAVE_KEY);
      if (!serialized) {
        return null;
      }

      const saveData: SaveData = JSON.parse(serialized);

      if (saveData.version !== SAVE_VERSION) {
        console.warn(
          `Save version mismatch: expected ${SAVE_VERSION}, got ${saveData.version}`
        );
      }

      return saveData.state;
    } catch (error) {
      console.error("Failed to load game:", error);
      return null;
    }
  }

  static hasSaveData(): boolean {
    return localStorage.getItem(SAVE_KEY) !== null;
  }

  static getSaveTimestamp(): number | null {
    try {
      const serialized = localStorage.getItem(SAVE_KEY);
      if (!serialized) {
        return null;
      }

      const saveData: SaveData = JSON.parse(serialized);
      return saveData.timestamp;
    } catch (error) {
      console.error("Failed to get save timestamp:", error);
      return null;
    }
  }

  static deleteSave(): boolean {
    try {
      localStorage.removeItem(SAVE_KEY);
      return true;
    } catch (error) {
      console.error("Failed to delete save:", error);
      return false;
    }
  }

  static exportSave(state: GameState): void {
    try {
      const saveData: SaveData = {
        version: SAVE_VERSION,
        state: {
          ...state,
          metadata: {
            ...state.metadata,
            lastSaved: Date.now(),
          },
        },
        timestamp: Date.now(),
      };

      const serialized = JSON.stringify(saveData, null, 2);
      const blob = new Blob([serialized], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const characterName = state.character?.name || "unknown";
      const timestamp = new Date().toISOString().split("T")[0];
      const filename = `grunberg_save_${characterName}_${timestamp}.json`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export save:", error);
      throw new Error("Failed to export save file");
    }
  }

  static async importSave(file: File): Promise<GameState> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          const saveData: SaveData = JSON.parse(content);

          if (!saveData.version || !saveData.state) {
            throw new Error("Invalid save file format");
          }

          if (saveData.version !== SAVE_VERSION) {
            console.warn(
              `Save version mismatch: expected ${SAVE_VERSION}, got ${saveData.version}`
            );
          }

          if (!this.validateSaveData(saveData.state)) {
            throw new Error("Save file validation failed");
          }

          resolve(saveData.state);
        } catch (error) {
          console.error("Failed to parse save file:", error);
          reject(new Error("Failed to parse save file"));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read save file"));
      };

      reader.readAsText(file);
    });
  }

  private static validateSaveData(state: GameState): boolean {
    return (
      typeof state === "object" &&
      state !== null &&
      "metadata" in state &&
      "inventory" in state &&
      "quests" in state
    );
  }
}

