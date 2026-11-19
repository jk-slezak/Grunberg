import { Chat } from "../../organisms/Chat";
import { SkillBar } from "../../organisms/SkillBar";
import { ActionButtonGroup } from "../../organisms/ActionButtonGroup";
import { Minimap } from "../../organisms/Minimap";
import { GameHeader } from "../../organisms/GameHeader";
import { PlayerStats } from "../../organisms/PlayerStats";
import styles from "./GameLayout.module.css";
import {
  GiSwordsPower,
  GiShield,
  GiSparkles,
  GiWindSlap,
} from "react-icons/gi";
import {
  GiScrollQuill,
  GiTreasureMap,
  GiChart,
  GiBackpack,
} from "react-icons/gi";
import type { Skill } from "../../organisms/SkillBar/SkillBar";

export const GameLayout = () => {
  const actionButtons = [
    { id: 1, label: "Questy", icon: <GiScrollQuill />, hotKey: "Q" },
    { id: 2, label: "Mapa", icon: <GiTreasureMap />, hotKey: "M" },
    { id: 3, label: "Statystyki", icon: <GiChart />, hotKey: "C" },
    { id: 4, label: "Ekwipunek", icon: <GiBackpack />, hotKey: "I" },
  ];

  const skills: Skill[] = [
    { id: 1, name: "Atak", hotKey: "1", icon: <GiSwordsPower />, cooldown: 0 },
    { id: 2, name: "Obrona", hotKey: "2", icon: <GiShield />, cooldown: 0 },
    { id: 3, name: "Magia", hotKey: "3", icon: <GiSparkles />, cooldown: 3 },
    { id: 4, name: "Unik", hotKey: "4", icon: <GiWindSlap />, cooldown: 0 },
  ];

  return (
    <div className={styles["game-layout"]}>
      <header className={styles["game-layout__header"]}>
        <GameHeader />
      </header>

      <main className={styles["game-layout__chat"]}>
        <Chat />
      </main>

      <aside className={styles["game-layout__minimap"]}>
        <Minimap />
      </aside>

      <aside className={styles["game-layout__hud"]}>
        <PlayerStats />
      </aside>

      <section className={styles["game-layout__skills"]}>
        <SkillBar skills={skills} />
      </section>

      <nav className={styles["game-layout__navigation"]}>
        <ActionButtonGroup buttons={actionButtons} />
      </nav>
    </div>
  );
};
