import { Chat } from "../../organisms/Chat";
import { SkillBar } from "../../organisms/SkillBar";
import { ActionButtonGroup } from "../../organisms/ActionButtonGroup";
import { Minimap } from "../../organisms/Minimap";
import { GameHeader } from "../../organisms/GameHeader";
import { PlayerStats } from "../../organisms/PlayerStats";
import styles from "./GameLayout.module.css";
import {
  GiBackpack,
  GiChart,
  GiScrollQuill,
  GiShield,
  GiSparkles,
  GiSwordsPower,
  GiTreasureMap,
  GiWindSlap,
} from "react-icons/gi";
import type { Skill } from "../../organisms/SkillBar/SkillBar";
import type { GameState } from "@grunberg/engine";
import type { ChatMessage } from "../../../chat/types";
import { locationName, toPlayerStats } from "../../../game/hud";

const ACTION_BUTTONS = [
  { id: 1, label: "Questy", icon: <GiScrollQuill />, hotKey: "Q" },
  { id: 2, label: "Mapa", icon: <GiTreasureMap />, hotKey: "M" },
  { id: 3, label: "Statystyki", icon: <GiChart />, hotKey: "C" },
  { id: 4, label: "Ekwipunek", icon: <GiBackpack />, hotKey: "I" },
];

const SKILLS: Skill[] = [
  { id: 1, name: "Atak", hotKey: "1", icon: <GiSwordsPower />, cooldown: 0 },
  { id: 2, name: "Obrona", hotKey: "2", icon: <GiShield />, cooldown: 0 },
  { id: 3, name: "Magia", hotKey: "3", icon: <GiSparkles />, cooldown: 3 },
  { id: 4, name: "Unik", hotKey: "4", icon: <GiWindSlap />, cooldown: 0 },
];

export interface GameLayoutProps {
  state: GameState;
  messages: ChatMessage[];
  onCommand: (text: string) => void;
}

export const GameLayout = ({ state, messages, onCommand }: GameLayoutProps) => {
  const playerStats = toPlayerStats(state);
  return (
    <div className={styles["game-layout"]}>
      <header className={styles["game-layout__header"]}>
        <GameHeader level={state.characterStatus?.level} location={locationName(state.position)} />
      </header>

      <main className={styles["game-layout__chat"]}>
        <Chat messages={messages} onSendMessage={onCommand} />
      </main>

      <aside className={styles["game-layout__minimap"]}>
        <Minimap floor={state.currentFloor} position={state.position} />
      </aside>

      <aside className={styles["game-layout__hud"]}>
        {playerStats && <PlayerStats {...playerStats} />}
      </aside>

      <section className={styles["game-layout__skills"]}>
        <SkillBar skills={SKILLS} />
      </section>

      <nav className={styles["game-layout__navigation"]}>
        <ActionButtonGroup buttons={ACTION_BUTTONS} />
      </nav>
    </div>
  );
};
