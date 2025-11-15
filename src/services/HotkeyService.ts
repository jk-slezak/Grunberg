type HotkeyCallback = () => void;
type Listener = (key: string) => void;

export interface HotkeyAction {
  key: string;
  callback: HotkeyCallback;
}

class HotkeyService {
  private hotkeys: Map<string, HotkeyCallback> = new Map();
  private keyDownListeners: Set<Listener> = new Set();
  private keyUpListeners: Set<Listener> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", this.handleKeyDown);
      window.addEventListener("keyup", this.handleKeyUp);
    }
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    const action = this.hotkeys.get(key);

    if (action) {
      event.preventDefault();
      action();
      this.keyDownListeners.forEach((listener) => listener(key));
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    // We notify listeners even if the key is not a registered hotkey,
    // to handle cases where the active state needs to be cleared.
    this.keyUpListeners.forEach((listener) => listener(key));
  };

  register(actions: HotkeyAction[]) {
    actions.forEach((action) => {
      this.hotkeys.set(action.key.toLowerCase(), action.callback);
    });
  }

  unregister(keys: string[]) {
    keys.forEach((key) => {
      this.hotkeys.delete(key.toLowerCase());
    });
  }

  onKeyDown(listener: Listener): () => void {
    this.keyDownListeners.add(listener);
    return () => this.keyDownListeners.delete(listener);
  }

  onKeyUp(listener: Listener): () => void {
    this.keyUpListeners.add(listener);
    return () => this.keyUpListeners.delete(listener);
  }
}

export const hotkeyService = new HotkeyService();
