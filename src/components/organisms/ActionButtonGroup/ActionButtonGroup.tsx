import { ActionButton } from "../../molecules/ActionButton";
import styles from "./ActionButtonGroup.module.css";

export interface ActionButtonData {
  id: number | string;
  label: string;
  icon: React.ReactNode;
  hotKey: string;
  onClick?: () => void;
  isActive?: boolean;
}

export interface ActionButtonGroupProps {
  buttons: ActionButtonData[];
}

export const ActionButtonGroup = ({ buttons }: ActionButtonGroupProps) => {
  return (
    <div className={styles["action-button-group"]}>
      {buttons.map((button: ActionButtonData) => (
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
