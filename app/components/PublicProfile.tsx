"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, ShieldCheck } from "lucide-react";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  type DriverProfile,
} from "../lib/supabase";

type LoadState = "loading" | "ready" | "missing";

const sampleProfile: DriverProfile = {
  public_slug: "daniel-reyes",
  display_name: "Daniel Reyes",
  avatar_url: null,
  transfer_number: "646 123 4567",
  phone_number: "",
  show_phone: false,
  is_public: true,
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "TN";
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = value;
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

function readDemoProfile(slug: string) {
  const raw = window.localStorage.getItem("taxinum.demo.profile");
  if (!raw) {
    return { ...sampleProfile, public_slug: slug || sampleProfile.public_slug };
  }

  try {
    return { ...sampleProfile, ...JSON.parse(raw) } as DriverProfile;
  } catch {
    return { ...sampleProfile, public_slug: slug || sampleProfile.public_slug };
  }
}

function whatsappUrl(phoneNumber: string, driverName: string) {
  const digits = phoneNumber.replace(/\D/g, "");
  const internationalNumber = digits.length === 10 ? `52${digits}` : digits;
  const message = `Hola ${driverName}, te envio la captura de transferencia exitosa.`;

  if (!internationalNumber) {
    return null;
  }

  return `https://wa.me/${internationalNumber}?text=${encodeURIComponent(message)}`;
}

export default function PublicProfile({ slug }: { slug: string }) {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      Promise.resolve().then(() => {
        const demoProfile = readDemoProfile(slug);
        setProfile(demoProfile.is_public ? demoProfile : null);
        setLoadState(demoProfile.is_public ? "ready" : "missing");
      });
      return;
    }

    supabase
      .from("driver_public_profiles")
      .select(
        "public_slug,display_name,avatar_url,transfer_number,phone_number,show_phone,is_public,updated_at",
      )
      .eq("public_slug", slug)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          setLoadState("missing");
          return;
        }

        setProfile(data as DriverProfile);
        setLoadState("ready");
      });
  }, [slug]);

  async function handleCopy() {
    if (!profile?.transfer_number) {
      return;
    }

    await copyText(profile.transfer_number);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (loadState === "loading") {
    return (
      <main className="public-page">
        <section className="public-card enter-up">
          <div className="public-avatar skeleton" />
          <div className="loading-line wide" />
          <div className="loading-line" />
        </section>
      </main>
    );
  }

  if (!profile || loadState === "missing") {
    return (
      <main className="public-page">
        <section className="public-card enter-up">
          <div className="brand-mark">TN</div>
          <h1>Perfil no disponible</h1>
          <p className="public-note">
            El taxista pudo pausar su perfil o borrar sus datos de transferencia.
          </p>
          <Link className="preview-link" href="/">
            Ir a TaxiNum
          </Link>
        </section>
      </main>
    );
  }

  const transferReceiptUrl =
    profile.show_phone && profile.phone_number
      ? whatsappUrl(profile.phone_number, profile.display_name)
      : null;

  return (
    <main className="public-page">
      <section className="public-card enter-up">
        <div className="public-top">
          <div className="brand-mark small">TN</div>
          <span className="verified-pill">
            <ShieldCheck size={16} />
            Perfil TaxiNum
          </span>
        </div>

        <div className="public-avatar">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" src={profile.avatar_url} />
          ) : (
            <span>{initials(profile.display_name)}</span>
          )}
        </div>

        <p className="eyebrow">Taxista</p>
        <h1>{profile.display_name}</h1>

        <div className="transfer-box">
          <span>Numero para transferencia</span>
          <strong>{profile.transfer_number || "No disponible"}</strong>
        </div>

        <button
          className="primary-button copy-main"
          disabled={!profile.transfer_number}
          onClick={handleCopy}
          type="button"
        >
          {copied ? <Check size={20} /> : <Copy size={20} />}
          {copied ? "Numero copiado" : "Copiar numero"}
        </button>

        {transferReceiptUrl ? (
          <a
            className="secondary-button phone-link"
            href={transferReceiptUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <MessageCircle size={18} />
            Enviar captura de transferencia exitosa
          </a>
        ) : null}

        <p className="public-note">
          TaxiNum solo muestra el dato capturado por el taxista. Confirma la
          transferencia en tu banca antes de terminar el viaje.
        </p>

        {!isSupabaseConfigured ? (
          <p className="setup-note">Vista demo local</p>
        ) : null}
      </section>
    </main>
  );
}
