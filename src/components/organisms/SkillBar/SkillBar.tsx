import { useEffect, useState } from "react";
import { SkillButton } from "../../molecules/SkillButton";
import styles from "./SkillBar.module.css";
import { hotkeyService } from "../../../services/HotkeyService";

export interface Skill {
  id: number | string;
  name: string;
  hotKey: string;
  icon: React.ReactNode;
  cooldown?: number;
  onClick?: () => void;
}

export interface SkillBarProps {
  skills: Skill[];
}

export const SkillBar = ({ skills }: SkillBarProps) => {
  const [activeSkill, setActiveSkill] = useState<string | null>(null);

  useEffect(() => {
    const hotkeyActions = skills.map((skill) => ({
      key: skill.hotKey,
      callback: () => skill.onClick?.(),
    }));

    hotkeyService.register(hotkeyActions);

    const unsubscribeKeyDown = hotkeyService.onKeyDown((key) => {
      const skill = skills.find((s) => s.hotKey.toLowerCase() === key);
      if (skill) {
        setActiveSkill(skill.hotKey);
      }
    });

    const unsubscribeKeyUp = hotkeyService.onKeyUp(() => {
      setActiveSkill(null);
    });

    return () => {
      const keysToUnregister = skills.map((skill) => skill.hotKey);
      hotkeyService.unregister(keysToUnregister);
      unsubscribeKeyDown();
      unsubscribeKeyUp();
    };
  }, [skills]);

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
            isActive={activeSkill === skill.hotKey}
          />
        ))}
      </div>
    </div>
  );
};
