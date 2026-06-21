"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const inputClassName =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 pr-11 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500";

export function PasswordField({
  id,
  name,
  label,
  autoComplete,
  placeholder = "Şifre",
  required = true,
}: {
  id: string;
  name: string;
  label: string;
  autoComplete: string;
  placeholder?: string;
  required?: boolean;
}) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          name={name}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          placeholder={placeholder}
          className={inputClassName}
        />
        <button
          type="button"
          onClick={() => setIsVisible((value) => !value)}
          className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
          aria-label={isVisible ? "Şifreyi gizle" : "Şifreyi göster"}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Eye className="h-4 w-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
