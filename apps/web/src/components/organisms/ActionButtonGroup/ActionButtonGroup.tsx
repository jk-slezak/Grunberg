import type { ReactNode } from "react";
import { useHotkeys } from "../../../hooks/useHotkeys";
import { ActionButton } from "../../molecules/ActionButton";
import styles from "./ActionButtonGroup.module.css";

export interface ActionButtonData {
  id: number | string;
  label: string;
  icon: ReactNode;
  hotKey: string;
  onClick?: () => void;
  isActive?: boolean;
}

export interface ActionButtonGroupProps {
  buttons: ActionButtonData[];
}

export const ActionButtonGroup = ({ buttons }: ActionButtonGroupProps) => {
  useHotkeys(buttons.map((b) => ({ key: b.hotKey, onPress: b.onClick })));

  return (
    <div className={styles["action-button-group"]}>
      {buttons.map((button) => (
        <ActionButton
          key={button.id}
          label={button.label}
          icon={button.icon}
          hotKey={button.hotKey}
          onClick={button.onClick}
          isActive={button.isActive}
        />
      ))}
    </div>
  );
};
