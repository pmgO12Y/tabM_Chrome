export {};

declare global {
  interface Window {
    __sidepanelBoot?: {
      ready?: () => void;
      fatal?: (message: string) => void;
    };
    __playwrightApi?: {
      getSnapshot: () => Promise<import("../types").TabStoreSnapshot>;
      dispatchCommand: (command: import("../types").TabCommand) => Promise<void>;
      waitForInteractive: () => Promise<void>;
      closeSidepanel: () => void;
    };
  }
}
