"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

/** Password input with a leading lock icon and a show/hide toggle, styled to
 * match the store's `.field` inputs. Mirrors the yemame-pos auth pattern. */
export function PasswordField({
  value,
  onChange,
  placeholder = "••••••••",
  autoComplete = "current-password",
  disabled,
  autoFocus,
  id = "password",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink/35" />
      <input
        id={id}
        name={id}
        type={show ? "text" : "password"}
        className="field pl-10 pr-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        disabled={disabled}
        autoFocus={autoFocus}
        required
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/40 transition-colors hover:text-ink/70"
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}
