"use client";

import { useLayoutEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { COLORWAYS } from "@/lib/colorways";
import { MEN_JEANS, SIZES, WOMEN_JEANS, sizeFromJeans } from "@/lib/sizes";

const INQUIRIES = ["a belt", "sizing help", "a custom piece", "wholesale", "press & collabs", "an order I placed"] as const;
type Inquiry = (typeof INQUIRIES)[number];
const METHODS = ["Instagram", "email", "phone"] as const;
type Method = (typeof METHODS)[number];
const CONTACT_EMAIL = "contact@kwlstudio.shop";

const PLACEHOLDER: Record<Method, string> = { Instagram: "@yourhandle", email: "you@email.com", phone: "your number" };

type Field = "name" | "contact" | "company" | "order";

/** Measures text so each blank is exactly as wide as what's in it. */
function useFitWidth(text: string) {
  const ref = useRef<HTMLSpanElement>(null);
  const [w, setW] = useState<number>();
  useLayoutEffect(() => {
    if (ref.current) setW(Math.ceil(ref.current.getBoundingClientRect().width) + 2);
  }, [text]);
  const measure = (
    <span ref={ref} className="mlMeasure" aria-hidden="true">
      {text || " "}
    </span>
  );
  return { w, measure };
}

function Blank({
  id,
  label,
  value,
  placeholder,
  onChange,
  bad,
  type = "text",
  inputMode,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  bad?: boolean;
  type?: string;
  inputMode?: "text" | "email" | "tel";
  autoComplete?: string;
}) {
  const { w, measure } = useFitWidth(value || placeholder);
  return (
    <span className="mlWrap">
      {measure}
      <input
        id={id}
        name={id}
        className={`mlBlank${bad ? " bad" : ""}`}
        aria-label={label}
        aria-invalid={bad || undefined}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        style={{ width: w }}
        onChange={(e) => onChange(e.target.value)}
      />
    </span>
  );
}

function Pick({
  id,
  label,
  value,
  onChange,
  children,
  display,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  display: string;
}) {
  const { w, measure } = useFitWidth(display + " ▾");
  return (
    <span className="mlWrap">
      {measure}
      <select
        id={id}
        name={id}
        className="mlBlank mlSelect"
        aria-label={label}
        value={value}
        style={{ width: w }}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
    </span>
  );
}

const jeanLabel = (v: string) => (v.startsWith("M ") ? `men's ${v.slice(2)}` : `women's ${v.slice(2)}`);

export function ContactForm() {
  const [name, setName] = useState("");
  const [inquiry, setInquiry] = useState<Inquiry>("a belt");
  const [colorway, setColorway] = useState(COLORWAYS[0].id);
  const [size, setSize] = useState<string>("M");
  const [jean, setJean] = useState("M 32");
  const [company, setCompany] = useState("");
  const [order, setOrder] = useState("");
  const [method, setMethod] = useState<Method>("Instagram");
  const [contact, setContact] = useState("");
  const [notes, setNotes] = useState("");
  const [bad, setBad] = useState<Field | null>(null);
  const [msg, setMsg] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const cw = COLORWAYS.find((c) => c.id === colorway) ?? COLORWAYS[0];
  const cwLabel = `${cw.id} ${cw.name.toLowerCase()}`;
  const suggested = sizeFromJeans(jean);
  const showBelt = inquiry === "a belt" || inquiry === "sizing help";
  const showCompany = inquiry === "wholesale" || inquiry === "press & collabs";
  const showOrder = inquiry === "an order I placed";

  function normContact(): string | null {
    const v = contact.trim();
    if (method === "Instagram") {
      const h = v.replace(/^@+/, "");
      return /^[A-Za-z0-9._]{1,30}$/.test(h) ? `@${h}` : null;
    }
    if (method === "email") return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? v : null;
    return v.replace(/\D/g, "").length >= 10 ? v : null;
  }

  function fail(field: Field, text: string) {
    setBad(field);
    setMsg(text);
    document.getElementById(field)?.focus();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return fail("name", "ADD YOUR NAME");
    if (showCompany && !company.trim()) return fail("company", "ADD YOUR COMPANY");
    if (showOrder && !order.trim()) return fail("order", "ADD YOUR ORDER NUMBER");
    const c = normContact();
    if (!c) {
      return fail(
        "contact",
        method === "email" ? "ADD A VALID EMAIL" : method === "phone" ? "ADD A NUMBER WITH AT LEAST 10 DIGITS" : "ADD YOUR INSTAGRAM HANDLE",
      );
    }
    setBad(null);
    setMsg("");
    setStatus("sending");
    const data: Record<string, string> = {
      "form-name": "contact",
      "bot-field": "",
      subject: `KWL Studio · ${inquiry} from ${name.trim()}`,
      name: name.trim(),
      inquiry,
      colorway: showBelt ? `${cw.id} ${cw.name}` : "",
      size: inquiry === "a belt" ? size : "",
      jean_size: showBelt ? jeanLabel(jean) : "",
      suggested_size: inquiry === "sizing help" && suggested ? suggested : "",
      company: showCompany ? company.trim() : "",
      order_number: showOrder ? order.trim() : "",
      contact_method: method,
      contact: c,
      notes: notes.trim(),
    };
    if (method === "email") data.email = c;
    try {
      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data).toString(),
      });
      if (!res.ok) throw new Error(String(res.status));
      setContact(c);
      setStatus("done");
    } catch {
      setStatus("error");
      setMsg(`THAT DIDN'T SEND. TRY AGAIN OR EMAIL ${CONTACT_EMAIL.toUpperCase()}.`);
    }
  }

  if (status === "done") {
    return (
      <div className="ml" aria-live="polite">
        <p className="mlText">
          Got it, {name.trim()}. We&apos;ll get back to you at {contact}.
        </p>
        <button
          type="button"
          className="mlAgain"
          onClick={() => {
            setStatus("idle");
            setNotes("");
          }}
        >
          SEND ANOTHER
        </button>
      </div>
    );
  }

  const clearBad = (f: Field) => () => bad === f && (setBad(null), setMsg(""));

  return (
    <form className="ml" onSubmit={onSubmit} noValidate name="contact">
      <p className="mlText">
        My name is{" "}
        <Blank id="name" label="Your name" value={name} placeholder="your name" autoComplete="name" bad={bad === "name"} onChange={(v) => { setName(v); clearBad("name")(); }} />{" "}
        and I&apos;d like to talk about{" "}
        <Pick id="inquiry" label="What it's about" value={inquiry} display={inquiry} onChange={(v) => setInquiry(v as Inquiry)}>
          {INQUIRIES.map((q) => (
            <option key={q} value={q}>
              {q}
            </option>
          ))}
        </Pick>
        .{" "}
        {inquiry === "a belt" && (
          <>
            I&apos;m interested in the belt in{" "}
            <ColorwayPick value={colorway} display={cwLabel} onChange={setColorway} />, in size{" "}
            <Pick id="size" label="Belt size" value={size} display={size} onChange={setSize}>
              {SIZES.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
              <option value="not sure">not sure</option>
            </Pick>
            . My jean size is <JeanPick value={jean} onChange={setJean} />.{" "}
          </>
        )}
        {inquiry === "sizing help" && (
          <>
            I&apos;m looking at <ColorwayPick value={colorway} display={cwLabel} onChange={setColorway} /> and my
            jean size is <JeanPick value={jean} onChange={setJean} />.{" "}
            {suggested && <span className="mlHint">That&apos;s usually a {suggested}. </span>}
          </>
        )}
        {showCompany && (
          <>
            I&apos;m with{" "}
            <Blank id="company" label="Company name" value={company} placeholder="company name" autoComplete="organization" bad={bad === "company"} onChange={(v) => { setCompany(v); clearBad("company")(); }} />
            .{" "}
          </>
        )}
        {showOrder && (
          <>
            My order number is{" "}
            <Blank id="order" label="Order number" value={order} placeholder="order #" bad={bad === "order"} onChange={(v) => { setOrder(v); clearBad("order")(); }} />
            .{" "}
          </>
        )}
        You can reach me on{" "}
        <Pick id="method" label="How to reach you" value={method} display={method} onChange={(v) => { setMethod(v as Method); clearBad("contact")(); }}>
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Pick>{" "}
        at{" "}
        <Blank
          id="contact"
          label={method === "Instagram" ? "Your Instagram handle" : method === "email" ? "Your email" : "Your phone number"}
          value={contact}
          placeholder={PLACEHOLDER[method]}
          type={method === "email" ? "email" : method === "phone" ? "tel" : "text"}
          inputMode={method === "email" ? "email" : method === "phone" ? "tel" : "text"}
          autoComplete={method === "email" ? "email" : method === "phone" ? "tel" : "off"}
          bad={bad === "contact"}
          onChange={(v) => { setContact(v); clearBad("contact")(); }}
        />
        . One more thing:{" "}
        <Blank id="notes" label="Anything else (optional)" value={notes} placeholder="optional notes" onChange={setNotes} />.
      </p>
      <input type="text" name="bot-field" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="mlFoot">
        <button type="submit" className="mlSend" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send it →"}
        </button>
        <span className="mlMsg" aria-live="polite">
          {msg}
        </span>
      </div>
      <p className="mlFallback">
        Prefer email? Reach KWL Studio at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL.toUpperCase()}</a>
      </p>
    </form>
  );
}

function ColorwayPick({ value, display, onChange }: { value: string; display: string; onChange: (v: string) => void }) {
  return (
    <Pick id="colorway" label="Colorway" value={value} display={display} onChange={onChange}>
      {COLORWAYS.map((c) => (
        <option key={c.id} value={c.id}>
          {c.id} {c.name.toLowerCase()}
        </option>
      ))}
    </Pick>
  );
}

function JeanPick({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Pick id="jean_size" label="Jean size" value={value} display={jeanLabel(value)} onChange={onChange}>
      <optgroup label="Men">
        {MEN_JEANS.map((j) => (
          <option key={j} value={`M ${j}`}>
            men&apos;s {j}
          </option>
        ))}
      </optgroup>
      <optgroup label="Women">
        {WOMEN_JEANS.map((j) => (
          <option key={j} value={`W ${j}`}>
            women&apos;s {j}
          </option>
        ))}
      </optgroup>
    </Pick>
  );
}
