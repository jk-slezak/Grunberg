import { useRef, useState, type ChangeEvent } from "react";

/**
 * Opens the browser's file picker for a save file and reports load errors to show to the player.
 * The same file can be picked again after an error (the input is reset each time).
 */
export const useSaveFilePicker = (onLoad: (file: File) => Promise<void>) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const open = () => inputRef.current?.click();

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    setError(null);
    try {
      await onLoad(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load save file");
    }
  };

  return { inputRef, open, onFileChange, error };
};
