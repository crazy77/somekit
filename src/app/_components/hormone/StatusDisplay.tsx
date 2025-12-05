"use client";

import { useAtom } from "jotai";
import { statusMessageAtom } from "~/stores/hormone";

export function StatusDisplay() {
  const [status] = useAtom(statusMessageAtom);

  if (!status.type) return null;

  const bgClass =
    status.type === "loading"
      ? "bg-[#fff3cd] text-[#856404]"
      : status.type === "success"
        ? "bg-[#d4edda] text-[#155724]"
        : "bg-[#f8d7da] text-[#721c24]";

  return <div className={`my-5 rounded-xl p-5 text-base ${bgClass}`}>{status.text}</div>;
}
