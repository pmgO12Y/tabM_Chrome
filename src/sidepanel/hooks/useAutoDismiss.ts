import { useEffect } from "react";

/**
 * 在 value 离开 idle 状态后，经过 delayMs 毫秒自动重置回 idleValue。
 * setValue 应当在组件重渲染间稳定（如 useState 的 setter）。
 */
export function useAutoDismiss<T>(
  value: T,
  setValue: (value: T) => void,
  idleValue: T,
  delayMs = 2000
): void {
  useEffect(() => {
    if (value === idleValue) {
      return;
    }

    const timer = window.setTimeout(() => {
      setValue(idleValue);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [value, setValue, idleValue, delayMs]);
}
