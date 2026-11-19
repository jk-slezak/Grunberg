import type { ReactNode } from "react";
import { useHotkeys } from "../../../hooks/useHotkeys";
import { SkillButton } from "../../molecules/SkillButton";
import styles from "./SkillBar.module.css";

export interface Skill {
  id: number | string;
  name: string;
  hotKey: string;
  icon: ReactNode;
  cooldown?: number;
  onClick?: () => void;
}

export interface SkillBarProps {
  skills: Skill[];
}

export const SkillBar = ({ skills }: SkillBarProps) => {
  const activeHotKey = useHotkeys(skills.map((s) => ({ key: s.hotKey, onPress: s.onClick })));

  return (
    <div className={styles["skill-bar"]}>
      <div className={styles["skill-bar__skills"]}>
        {skills.map((skill: Skill) => (
          <SkillButton
            key={skill.id}
            name={skill.name}
            icon={skill.icon}
            hotKey={skill.hotKey}
            cooldown={skill.cooldown}
            onClick={skill.onClick}
            isActive={activeHotKey === skill.hotKey}
          />
        ))}
      </div>
    </div>
  );
};
