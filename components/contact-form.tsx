"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, Check, Copy, MessageCircle } from "lucide-react";
import { site } from "@/content/site";
import { label, t, type Locale } from "@/lib/i18n";

export function ContactForm({ locale }: { locale: Locale }) {
  const [reviewUrl, setReviewUrl] = useState("");
  const [subject, setSubject] = useState("general");
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("subject");
    if (requested && ["general", "programs", "volunteer", "partnership", "donation"].includes(requested)) setSubject(requested);
  }, []);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (String(data.get("website") || "")) return;
    const message = [
      "Hello ODONG Foundation,",
      "Name: " + data.get("name"), "Email: " + data.get("email"),
      "WhatsApp: " + data.get("phone"), "Subject: " + data.get("subject"), "", String(data.get("message") || ""),
    ].join("\n");
    const url = "https://wa.me/" + site.whatsapp + "?text=" + encodeURIComponent(message);
    setReviewUrl(url);
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return <form className="contact-form" onSubmit={submit}>
    <h2>{t(locale, "contact.form.title")}</h2>
    <p className="form-intro">{label(locale, "Tell us what you have in mind. You’ll review and send your message in WhatsApp.", "Ceritakan ide Anda. Tinjau dan kirim pesan Anda melalui WhatsApp.")}</p>
    <div className="form-row"><label htmlFor="name">{t(locale, "contact.form.name")}<input id="name" name="name" autoComplete="name" required maxLength={100} /></label>
    <label htmlFor="email">{t(locale, "contact.form.email")}<input id="email" name="email" autoComplete="email" type="email" required maxLength={150} /></label></div>
    <div className="form-row"><label htmlFor="phone">{t(locale, "contact.form.phone")}<input id="phone" name="phone" autoComplete="tel" type="tel" required pattern="[+0-9 ()-]{8,25}" placeholder="+62" title={t(locale, "contact.form.phone.hint")} /></label>
    <label htmlFor="subject">{t(locale, "contact.form.subject")}<select id="subject" name="subject" value={subject} onChange={(event) => setSubject(event.target.value)}>
      {["general", "programs", "volunteer", "partnership", "donation"].map((option) => <option key={option} value={option}>{t(locale, "contact.form.subject." + option)}</option>)}
    </select></label></div>
    <label htmlFor="message">{t(locale, "contact.form.message")}<textarea id="message" name="message" rows={5} required minLength={10} maxLength={3000} /></label>
    <div className="honeypot" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <button type="submit" className="button button-primary"><MessageCircle size={18} />{t(locale, "contact.form.send")}<ArrowUpRight size={17} /></button>
    {reviewUrl && <p role="status" className="form-status"><a href={reviewUrl} target="_blank" rel="noopener noreferrer">{label(locale, "Open WhatsApp to review and send your message", "Buka WhatsApp untuk meninjau dan mengirim pesan")}</a></p>}
  </form>;
}

export function BankAccounts({ locale }: { locale: Locale }) {
  const [copied, setCopied] = useState("");
  const [error, setError] = useState(false);
  async function copy(number: string) {
    try { await navigator.clipboard.writeText(number); setCopied(number); setError(false); }
    catch { setError(true); }
  }
  return <div className="bank-accounts">{site.accounts.map((account) => <div className="bank-card" key={account.number}>
    <div className="bank-heading"><h3>{account.bank}</h3><span>{account.branch}</span></div>
    <div className="account-number"><span>{account.number}</span><button type="button" onClick={() => copy(account.number)} aria-label={label(locale, "Copy account number for ", "Salin nomor rekening ") + account.bank}>{copied === account.number ? <Check size={19} /> : <Copy size={19} />}</button></div>
    <p>{site.legalName}</p>
  </div>)}<p className="copy-status" role="status">{error ? label(locale, "Please select and copy the account number above.", "Silakan pilih dan salin nomor rekening di atas.") : copied ? label(locale, "Account number copied.", "Nomor rekening disalin.") : ""}</p></div>;
}
