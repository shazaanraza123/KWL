"use client";

import { useState, type FormEvent } from "react";
import type { Colorway } from "@/lib/colorways";
import { SIZES, type Size } from "@/lib/sizes";
import { subscribe } from "@/lib/klaviyo";
import { SizeGuide } from "./SizeGuide";

type Props = {
  colorway: Colorway;
};

type Status = "idle" | "sending" | "error" | "done";

export function Signup({ colorway }: Props) {
  const [email, setEmail] = useState("");
  const [size, setSize] = useState<Size | "">("");
  const [status, setStatus] = useState<Status>("idle");
  const [msg, setMsg] = useState("");
  const [guide, setGuide] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setStatus("error");
      setMsg("ENTER A VALID EMAIL");
      return;
    }
    setMsg("");
    setStatus("sending");
    const result = await subscribe({ email, colorway, size });
    if (result.ok) {
      setStatus("done");
      return;
    }
    setStatus("error");
    setMsg(result.error === "network" ? "NO CONNECTION. TRY AGAIN." : "SOMETHING WENT WRONG. TRY AGAIN.");
  }

  if (status === "done") {
    return (
      <div className="done" aria-live="polite">
        <span>YOU&apos;RE ON THE LIST.</span>
        <span className="k">DROP 001 / TBA</span>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <label className={`field${status === "error" ? " err" : ""}`}>
        <span className="sr-only">Email</span>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="EMAIL"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status === "error") {
              setStatus("idle");
              setMsg("");
            }
          }}
        />
      </label>
      <div className="sizes" role="group" aria-label="Size, optional">
        {SIZES.map((z) => (
          <button
            key={z}
            type="button"
            aria-pressed={size === z}
            onClick={() => setSize(size === z ? "" : z)}
          >
            {z}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="guideBtn"
        aria-expanded={guide}
        aria-controls="size-guide"
        onClick={() => setGuide((g) => !g)}
      >
        SIZE GUIDE
      </button>
      {guide && <SizeGuide onClose={() => setGuide(false)} onPick={setSize} />}
      <button type="submit" className="send" disabled={status === "sending"}>
        {status === "sending" ? "SENDING…" : "NOTIFY ME →"}
      </button>
      <div className="msg" aria-live="polite">
        {msg}
      </div>
      <p className="fine">
        Your email is only used for drop alerts. Size and colorway are optional and help us decide how many to make.
      </p>
    </form>
  );
}
