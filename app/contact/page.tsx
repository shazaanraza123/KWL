import type { Metadata } from "next";
import Link from "next/link";
import { ContactForm } from "@/components/ContactForm";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Contact · KWL STUDIO",
  description: "Talk to KWL Studio.",
};

export default function ContactPage() {
  return (
    <main className="contact">
      <Link href="/" className="back">
        ← BACK
      </Link>
      <h1 className="mlHead">Talk to KWL Studio.</h1>
      <ContactForm />
    </main>
  );
}
