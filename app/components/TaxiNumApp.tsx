"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import {
  Camera,
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileDown,
  LogOut,
  QrCode,
  ShieldCheck,
  Smartphone,
  Trash2,
} from "lucide-react";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
  type DriverProfile,
} from "../lib/supabase";

type AppUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  isDemo: boolean;
};

type SaveState = "idle" | "saving" | "saved" | "error";

const demoUser: AppUser = {
  id: "demo-taxinum",
  email: "taxista@demo.com",
  name: "Daniel Reyes",
  avatarUrl: null,
  isDemo: true,
};

const fallbackProfile: DriverProfile = {
  public_slug: "daniel-reyes",
  display_name: "Daniel Reyes",
  avatar_url: null,
  transfer_number: "646 123 4567",
  phone_number: "",
  show_phone: false,
  is_public: true,
  terms_accepted_at: null,
};

const profileFields =
  "id,user_id,public_slug,display_name,avatar_url,transfer_number,phone_number,show_phone,is_public,terms_accepted_at,updated_at";

function normalizeSlug(value: string) {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return slug || `taxista-${Math.floor(1000 + Math.random() * 9000)}`;
}

function profileSlug(name: string, userId: string) {
  return normalizeSlug(`${name}-${userId.slice(0, 8)}`);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "TN";
}

function cleanTransferNumber(value: string) {
  return value.replace(/[^\dA-Za-z\s-]/g, "").replace(/\s+/g, " ").trim();
}

function readStoredProfile() {
  if (typeof window === "undefined") {
    return fallbackProfile;
  }

  const raw = window.localStorage.getItem("taxinum.demo.profile");
  if (!raw) {
    return fallbackProfile;
  }

  try {
    return { ...fallbackProfile, ...JSON.parse(raw) } as DriverProfile;
  } catch {
    return fallbackProfile;
  }
}

function storeDemoProfile(profile: DriverProfile) {
  window.localStorage.setItem("taxinum.demo.profile", JSON.stringify(profile));
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
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

export default function TaxiNumApp() {
  const [acceptedLegal, setAcceptedLegal] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem("taxinum.legal.accepted") === "true",
  );
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<DriverProfile>(fallbackProfile);
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const publicUrl = useMemo(() => {
    if (typeof window === "undefined") {
      return `/t/${profile.public_slug}`;
    }

    return `${window.location.origin}/t/${profile.public_slug}`;
  }, [profile.public_slug]);

  const canPublish = profile.is_public && Boolean(profile.transfer_number.trim());

  const loadProfile = useCallback(
    async (currentUser: AppUser) => {
      if (!supabase || currentUser.isDemo) {
        const storedProfile = readStoredProfile();
        setProfile({
          ...storedProfile,
          display_name: storedProfile.display_name || currentUser.name,
          avatar_url: storedProfile.avatar_url || currentUser.avatarUrl,
        });
        return;
      }

      const { data, error } = await supabase
        .from("drivers")
        .select(profileFields)
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (error) {
        setMessage(`No pude cargar el perfil: ${error.message}`);
        setSaveState("error");
        return;
      }

      if (data) {
        setProfile(data as DriverProfile);
        return;
      }

      const newProfile: DriverProfile = {
        public_slug: profileSlug(currentUser.name, currentUser.id),
        display_name: currentUser.name,
        avatar_url: currentUser.avatarUrl,
        transfer_number: "",
        phone_number: "",
        show_phone: false,
        is_public: true,
        terms_accepted_at: new Date().toISOString(),
      };

      const { data: created, error: createError } = await supabase
        .from("drivers")
        .insert({
          ...newProfile,
          user_id: currentUser.id,
        })
        .select(profileFields)
        .single();

      if (createError) {
        setMessage(`No pude crear el perfil: ${createError.message}`);
        setSaveState("error");
        setProfile(newProfile);
        return;
      }

      setProfile(created as DriverProfile);
    },
    [supabase],
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) {
        return;
      }

      const sessionUser = data.session?.user;
      if (!sessionUser) {
        setAuthLoading(false);
        return;
      }

      const currentUser: AppUser = {
        id: sessionUser.id,
        email: sessionUser.email ?? "",
        name:
          sessionUser.user_metadata?.full_name ??
          sessionUser.user_metadata?.name ??
          sessionUser.email?.split("@")[0] ??
          "Taxista",
        avatarUrl:
          sessionUser.user_metadata?.avatar_url ??
          sessionUser.user_metadata?.picture ??
          null,
        isDemo: false,
      };

      setUser(currentUser);
      loadProfile(currentUser).finally(() => setAuthLoading(false));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user;
      if (!sessionUser) {
        setUser(null);
        setAuthLoading(false);
        return;
      }

      const currentUser: AppUser = {
        id: sessionUser.id,
        email: sessionUser.email ?? "",
        name:
          sessionUser.user_metadata?.full_name ??
          sessionUser.user_metadata?.name ??
          sessionUser.email?.split("@")[0] ??
          "Taxista",
        avatarUrl:
          sessionUser.user_metadata?.avatar_url ??
          sessionUser.user_metadata?.picture ??
          null,
        isDemo: false,
      };

      setUser(currentUser);
      void loadProfile(currentUser);
      setAuthLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadProfile, supabase]);

  useEffect(() => {
    QRCode.toDataURL(publicUrl, {
      width: 960,
      margin: 2,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(""));
  }, [publicUrl]);

  async function handleGoogleLogin() {
    if (!acceptedLegal) {
      setMessage("Primero acepta los términos y el aviso de privacidad.");
      return;
    }

    window.localStorage.setItem("taxinum.legal.accepted", "true");

    if (!supabase) {
      setUser(demoUser);
      await loadProfile(demoUser);
      setMessage("Modo demo activo. Conecta Supabase para usar Google real.");
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage("No se pudo abrir Google. Revisa la configuracion de Supabase.");
      setSaveState("error");
    }
  }

  async function handleSignOut() {
    if (supabase && !user?.isDemo) {
      await supabase.auth.signOut();
    }

    setUser(null);
    setMessage("");
    setSaveState("idle");
  }

  async function handleAvatarChange(file: File | undefined) {
    if (!file || !user) {
      return;
    }

    setSaveState("saving");

    if (!supabase || user.isDemo) {
      const dataUrl = await fileToDataUrl(file);
      const nextProfile = { ...profile, avatar_url: dataUrl };
      setProfile(nextProfile);
      storeDemoProfile(nextProfile);
      setSaveState("saved");
      setMessage("Foto actualizada.");
      return;
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/${Date.now()}.${extension}`;
    const { error } = await supabase.storage
      .from("driver-avatars")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      setSaveState("error");
      setMessage("No pude subir la foto. Revisa el bucket driver-avatars.");
      return;
    }

    const { data } = supabase.storage.from("driver-avatars").getPublicUrl(path);
    const nextProfile = { ...profile, avatar_url: data.publicUrl };
    setProfile(nextProfile);
    await saveProfile(nextProfile, "Foto actualizada.");
  }

  async function saveProfile(nextProfile = profile, successMessage = "Perfil guardado.") {
    if (!user) {
      return;
    }

    setSaveState("saving");
    const cleanProfile = {
      ...nextProfile,
      display_name: nextProfile.display_name.trim() || "Taxista",
      public_slug: nextProfile.id
        ? nextProfile.public_slug
        : profileSlug(nextProfile.display_name, user.id),
      transfer_number: cleanTransferNumber(nextProfile.transfer_number),
      phone_number: nextProfile.phone_number.trim(),
      show_phone: Boolean(nextProfile.phone_number.trim() && nextProfile.show_phone),
      terms_accepted_at: nextProfile.terms_accepted_at ?? new Date().toISOString(),
    };

    if (!supabase || user.isDemo) {
      setProfile(cleanProfile);
      storeDemoProfile(cleanProfile);
      setSaveState("saved");
      setMessage(successMessage);
      return;
    }

    const payload = {
      user_id: user.id,
      public_slug: cleanProfile.public_slug,
      display_name: cleanProfile.display_name,
      avatar_url: cleanProfile.avatar_url,
      transfer_number: cleanProfile.transfer_number,
      phone_number: cleanProfile.phone_number,
      show_phone: cleanProfile.show_phone,
      is_public: cleanProfile.is_public,
      terms_accepted_at: cleanProfile.terms_accepted_at,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("drivers")
      .upsert(payload, {
        onConflict: "user_id",
      })
      .select(profileFields)
      .single();

    if (error) {
      setSaveState("error");
      setMessage(`No pude guardar: ${error.message}`);
      return;
    }

    setProfile(data as DriverProfile);
    setSaveState("saved");
    setMessage(successMessage);
  }

  async function handleCopyUrl() {
    await copyText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadPng() {
    if (!qrDataUrl) {
      return;
    }

    const link = document.createElement("a");
    link.href = qrDataUrl;
    link.download = `taxinum-${profile.public_slug}.png`;
    link.click();
  }

  function downloadPdf() {
    if (!qrDataUrl) {
      return;
    }

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();

    pdf.setFillColor("#F8FAFC");
    pdf.rect(0, 0, pageWidth, 842, "F");
    pdf.setFillColor("#111827");
    pdf.roundedRect(44, 44, pageWidth - 88, 754, 18, 18, "F");
    pdf.setFillColor("#10B981");
    pdf.roundedRect(70, 70, pageWidth - 140, 58, 16, 16, "F");
    pdf.setTextColor("#FFFFFF");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(28);
    pdf.text("TaxiNum", 94, 107);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text("Escanea. Copia. Transfiere.", pageWidth - 234, 105);

    pdf.setFillColor("#FFFFFF");
    pdf.roundedRect(112, 168, pageWidth - 224, 356, 18, 18, "F");
    pdf.addImage(qrDataUrl, "PNG", 152, 194, pageWidth - 304, pageWidth - 304);

    pdf.setTextColor("#FFFFFF");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(26);
    pdf.text(profile.display_name || "Taxista", pageWidth / 2, 596, {
      align: "center",
    });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(15);
    pdf.text("Escanea este codigo para ver y copiar el numero de transferencia.", pageWidth / 2, 630, {
      align: "center",
      maxWidth: pageWidth - 130,
    });

    pdf.setTextColor("#FACC15");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(publicUrl, pageWidth / 2, 690, {
      align: "center",
      maxWidth: pageWidth - 130,
    });

    pdf.save(`taxinum-${profile.public_slug}.pdf`);
  }

  function updateProfile<K extends keyof DriverProfile>(
    key: K,
    value: DriverProfile[K],
  ) {
    setProfile((current) => {
      const next = { ...current, [key]: value };
      if (key === "display_name" && !current.id && user) {
        next.public_slug = profileSlug(String(value), user.id);
      }
      return next;
    });
    setSaveState("idle");
  }

  if (authLoading) {
    return (
      <main className="app-loading">
        <div className="brand-mark">TN</div>
        <p>Preparando TaxiNum...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="auth-page">
        <section className="auth-panel enter-up">
          <div className="brand-row">
            <div className="brand-mark">TN</div>
            <div>
              <p className="eyebrow">TaxiNum</p>
              <h1>Tu numero de cobro, listo para escanear.</h1>
            </div>
          </div>

          <div className="auth-preview" aria-hidden="true">
            <div className="preview-phone">
              <div className="preview-avatar">JR</div>
              <div className="preview-line wide" />
              <div className="preview-line short" />
              <div className="preview-number">646 123 4567</div>
              <div className="preview-copy">Copiar numero</div>
            </div>
            <div className="qr-chip">
              <QrCode size={22} />
              QR publico
            </div>
          </div>

          <div className="legal-box">
            <Link className="legal-link" href="/legal">
              <ShieldCheck size={18} />
              Leer terminos y privacidad
            </Link>
            <label className="legal-check">
              <input
                checked={acceptedLegal}
                onChange={(event) => {
                  setAcceptedLegal(event.target.checked);
                  if (event.target.checked) {
                    window.localStorage.setItem("taxinum.legal.accepted", "true");
                  }
                }}
                type="checkbox"
              />
              <span>
                Acepto los terminos y el aviso de privacidad. Entiendo que mi
                numero de transferencia sera visible para quien escanee mi QR.
              </span>
            </label>
          </div>

          <button
            className="primary-button google-button"
            disabled={!acceptedLegal}
            onClick={handleGoogleLogin}
            type="button"
          >
            <span className="google-dot">G</span>
            Continuar con Google
          </button>

          {!isSupabaseConfigured ? (
            <p className="setup-note">
              Vista demo activa hasta configurar Supabase.
            </p>
          ) : null}
          {message ? <p className="form-message">{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="brand-row compact">
          <div className="brand-mark">TN</div>
          <div>
            <p className="eyebrow">TaxiNum</p>
            <h1>Panel del taxista</h1>
          </div>
        </div>
        <button className="icon-button" onClick={handleSignOut} type="button" title="Salir">
          <LogOut size={20} />
        </button>
      </header>

      <section className="dashboard-grid">
        <form
          className="profile-panel enter-up"
          onSubmit={(event) => {
            event.preventDefault();
            void saveProfile();
          }}
        >
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Perfil publico</p>
              <h2>Datos que vera el cliente</h2>
            </div>
            <span className={canPublish ? "status-pill live" : "status-pill"}>
              {canPublish ? "Activo" : "Incompleto"}
            </span>
          </div>

          <div className="avatar-row">
            <button
              className="avatar-button"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="" src={profile.avatar_url} />
              ) : (
                <span>{initials(profile.display_name)}</span>
              )}
              <span className="avatar-action">
                <Camera size={16} />
              </span>
            </button>
            <div>
              <button
                className="text-button"
                onClick={() => fileInputRef.current?.click()}
                type="button"
              >
                Cambiar foto
              </button>
              <button
                className="text-button muted"
                onClick={() => updateProfile("avatar_url", null)}
                type="button"
              >
                <Trash2 size={15} />
                Quitar
              </button>
            </div>
            <input
              accept="image/*"
              hidden
              onChange={(event) => void handleAvatarChange(event.target.files?.[0])}
              ref={fileInputRef}
              type="file"
            />
          </div>

          <label className="field">
            <span>Nombre publico</span>
            <input
              onChange={(event) => updateProfile("display_name", event.target.value)}
              placeholder="Ej. Juan Ramirez"
              value={profile.display_name}
            />
          </label>

          <label className="field">
            <span>Numero de cuenta, CLABE o transferencia</span>
            <input
              inputMode="text"
              onChange={(event) =>
                updateProfile("transfer_number", event.target.value)
              }
              placeholder="Ej. 012 345 678901234567"
              value={profile.transfer_number}
            />
          </label>

          <label className="field">
            <span>Telefono opcional</span>
            <input
              inputMode="tel"
              onChange={(event) => updateProfile("phone_number", event.target.value)}
              placeholder="Solo si quieres mostrarlo"
              value={profile.phone_number}
            />
          </label>

          <div className="switch-row">
            <div>
              <strong>Mostrar telefono</strong>
              <span>El cliente lo vera solo si esta activado.</span>
            </div>
            <button
              aria-pressed={profile.show_phone}
              className={profile.show_phone ? "switch is-on" : "switch"}
              onClick={() => updateProfile("show_phone", !profile.show_phone)}
              type="button"
            >
              {profile.show_phone ? <Eye size={17} /> : <EyeOff size={17} />}
            </button>
          </div>

          <div className="switch-row">
            <div>
              <strong>Perfil publico</strong>
              <span>Puedes pausarlo sin borrar tus datos.</span>
            </div>
            <button
              aria-pressed={profile.is_public}
              className={profile.is_public ? "switch is-on" : "switch"}
              onClick={() => updateProfile("is_public", !profile.is_public)}
              type="button"
            >
              {profile.is_public ? <Eye size={17} /> : <EyeOff size={17} />}
            </button>
          </div>

          <button className="primary-button" disabled={saveState === "saving"} type="submit">
            {saveState === "saving" ? "Guardando..." : "Guardar perfil"}
          </button>
          {message ? (
            <p className={saveState === "error" ? "form-message error" : "form-message"}>
              {message}
            </p>
          ) : null}
        </form>

        <section className="qr-panel enter-up delay">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Codigo QR</p>
              <h2>Listo para celular o impresion</h2>
            </div>
            <Smartphone size={22} />
          </div>

          <div className="qr-frame">
            {qrDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Codigo QR publico de TaxiNum" src={qrDataUrl} />
            ) : (
              <QrCode size={92} />
            )}
          </div>

          <div className="public-url-box">
            <span>{publicUrl}</span>
            <button onClick={handleCopyUrl} type="button">
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>

          <div className="download-grid">
            <button className="secondary-button" onClick={downloadPng} type="button">
              <Download size={18} />
              PNG
            </button>
            <button className="secondary-button" onClick={downloadPdf} type="button">
              <FileDown size={18} />
              PDF
            </button>
          </div>

          <Link className="preview-link" href={`/t/${profile.public_slug}`}>
            Ver pagina publica
          </Link>
        </section>
      </section>
    </main>
  );
}
