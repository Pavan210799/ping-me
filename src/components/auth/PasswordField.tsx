import { Eye, EyeOff } from "lucide-react";
import { useState, type InputHTMLAttributes } from "react";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
};

export function PasswordField({ label, className = "", ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block text-sm text-secondary">
      {label}
      <span className="relative mt-1 block">
        <input
          {...props}
          type={visible ? "text" : "password"}
          className={`w-full rounded-xl border border-line bg-card px-3 py-2.5 pr-11 text-ink outline-none transition focus:border-accent hover:border-line-hover ${className}`}
        />
        <button
          type="button"
          onClick={() => setVisible((open) => !open)}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded-lg p-1.5 text-quiet transition hover:bg-hover hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
    </label>
  );
}
