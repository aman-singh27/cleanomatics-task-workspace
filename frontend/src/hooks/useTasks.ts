import { useCallback, useEffect, useRef, useState } from "react";
import { taskApi } from "../api/tasks";
import type { Task, TaskInput } from "../lib/tasks";
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const pendingLoad = useRef(false);
  const load = useCallback(async () => {
    const id = ++requestId.current;
    pendingLoad.current = true;
    setLoading(true);
    setError("");
    try {
      const result = await taskApi.list();
      if (id === requestId.current) setTasks(result);
    } catch (cause) {
      if (id === requestId.current)
        setError(
          cause instanceof Error ? cause.message : "Something went wrong.",
        );
    } finally {
      if (id === requestId.current) {
        pendingLoad.current = false;
        setLoading(false);
      }
    }
  }, []);
  useEffect(() => {
    void load();
    return () => {
      requestId.current++;
    };
  }, [load]);
  const save = async (data: TaskInput, id?: string) => {
    const result = id
      ? await taskApi.update(id, data)
      : await taskApi.create(data);
    const refresh = pendingLoad.current;
    requestId.current++;
    pendingLoad.current = false;
    setLoading(false);
    setError("");
    setTasks((current) =>
      id
        ? current.map((task) => (task.id === id ? result : task))
        : [result, ...current],
    );
    if (refresh) await load();
    return result;
  };
  const remove = async (id: string) => {
    await taskApi.remove(id);
    const refresh = pendingLoad.current;
    requestId.current++;
    pendingLoad.current = false;
    setLoading(false);
    setError("");
    setTasks((current) => current.filter((task) => task.id !== id));
    if (refresh) await load();
  };
  return { tasks, loading, error, load, save, remove };
}
export function useDebounce<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
