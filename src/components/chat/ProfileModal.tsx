import { Pencil, Trash2, Upload, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { uploadFile } from "../../api";
import { PasswordField } from "../auth/PasswordField";
import { Avatar } from "../Avatar";

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { user, token, updateProfile, saveAvatar } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [photoKey, setPhotoKey] = useState(0);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  if (!user) {
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      await updateProfile({
        name,
        email,
        currentPassword,
        newPassword,
        avatarUrl,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatar(file: File | undefined) {
    if (!file || !token) {
      return;
    }
    setError("");
    setMenuOpen(false);
    setWaiting(true);
    const localUrl = URL.createObjectURL(file);
    const started = Date.now();

    try {
      const uploaded = await uploadFile(file, token, function () {
        return;
      });
      const wait = 550 - (Date.now() - started);
      if (wait > 0) {
        await new Promise(function (resolve) {
          window.setTimeout(resolve, wait);
        });
      }
      setAvatarUrl(uploaded.url);
      setPhotoKey(Date.now());
      await saveAvatar(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload photo.");
    } finally {
      setWaiting(false);
      URL.revokeObjectURL(localUrl);
    }
  }

  async function deletePhoto() {
    const previous = avatarUrl;
    setMenuOpen(false);
    setAvatarUrl("");
    setPhotoKey(Date.now());
    try {
      await saveAvatar("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove photo.");
      setAvatarUrl(previous);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="flex max-h-[min(40rem,calc(100vh-2rem))] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-line bg-surface/95 p-5 shadow-xl backdrop-blur-xl animate-pop-in"
        onClick={function (event) {
          event.stopPropagation();
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Your profile</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 hover:bg-hover">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="flex flex-col items-center gap-2 py-2">
            <div className="relative" ref={menuRef}>
              <div className="relative mx-auto w-fit">
                <div
                  key={photoKey}
                  className={waiting ? "opacity-40" : avatarUrl ? "animate-avatar-reveal" : ""}
                >
                  <Avatar name={name || user.name} imageUrl={waiting ? "" : avatarUrl} size={88} />
                </div>
                {waiting && (
                  <div className="absolute inset-0 grid place-items-center">
                    <span className="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="absolute right-0 bottom-0 rounded-full border border-line bg-white p-1.5 text-black shadow-sm transition hover:scale-110"
                  aria-label="Edit photo"
                >
                  <Pencil size={14} />
                </button>
              </div>
              {menuOpen && (
                <div className="mt-3 flex justify-center gap-2 animate-pop-in">
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-sm transition hover:bg-hover"
                  >
                    <Upload size={14} />
                    Upload
                  </button>
                  <button
                    type="button"
                    disabled={!avatarUrl || waiting}
                    onClick={deletePhoto}
                    className="flex items-center gap-1.5 rounded-full border border-line bg-card px-3 py-1.5 text-sm text-failed transition hover:bg-hover disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-quiet">
              {waiting ? "Getting your photo ready..." : "Photo updates everywhere as soon as you add it"}
            </p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files ? event.target.files[0] : undefined;
                void handleAvatar(file);
                event.target.value = "";
              }}
            />
          </div>

          <label className="block text-sm text-secondary">
            Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-ink outline-none transition focus:border-accent"
            />
          </label>
          <label className="block text-sm text-secondary">
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-ink outline-none transition focus:border-accent"
            />
          </label>
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Enter your current password to change it"
            autoComplete="current-password"
          />
          <PasswordField
            label="New password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Enter a new password"
            autoComplete="new-password"
            minLength={newPassword || currentPassword ? 6 : undefined}
          />

          {error && <p className="rounded-xl bg-failed/10 px-3 py-2 text-sm text-failed">{error}</p>}

          <button
            type="submit"
            disabled={saving || waiting}
            className="w-full rounded-xl bg-accent py-2.5 font-medium text-white transition hover:bg-accent-hover hover:scale-[1.01] disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
