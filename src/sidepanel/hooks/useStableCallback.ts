import { useCallback, useRef } from "react";

/**
 * 返回一个稳定的函数引用，始终调用最新的回调。
 * 适用于需要稳定 callback props 的场景，避免子组件不必要地重渲染。
 */
export function useStableCallback<T extends (...args: never[]) => unknown>(
  callback: T | undefined
): T {
  const ref = useRef(callback);
  ref.current = callback;

  return useCallback((...args: Parameters<T>) => {
    return ref.current?.(...args);
  }, []) as T;
}
