import { useEffect, useState } from "react";
import { hotkeyService } from "../services/HotkeyService";

interface HotkeySkill {
  hotKey: string;
  onClick?: () => void;
}

export const useSkillHotkeys = (skills: HotkeySkill[]): string | null => {
  const [activeHotKey, setActiveHotKey] = useState<string | null>(null);

  useEffect(() => {
    hotkeyService.register(
      skills.map((skill) => ({ key: skill.hotKey, callback: () => skill.onClick?.() })),
    );
    const offKeyDown = hotkeyService.onKeyDown((key) => {
      const skill = skills.find((s) => s.hotKey.toLowerCase() === key);
      if (skill) setActiveHotKey(skill.hotKey);
    });
    const offKeyUp = hotkeyService.onKeyUp(() => setActiveHotKey(null));

    return () => {
      hotkeyService.unregister(skills.map((skill) => skill.hotKey));
      offKeyDown();
      offKeyUp();
    };
  }, [skills]);

  return activeHotKey;
};
