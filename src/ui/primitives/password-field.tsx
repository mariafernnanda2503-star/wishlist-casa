"use client";

import { useState, type ComponentPropsWithRef } from "react";

import { EyeIcon, EyeOffIcon } from "@/ui/icons";

import { Field } from "./field";

type PasswordFieldProps = Omit<ComponentPropsWithRef<"input">, "id" | "type"> & {
  label: string;
};

export function PasswordField({ label, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Field
      {...props}
      label={label}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          // Sem foco por Tab: o campo em si já é o alvo, e um segundo parada de
          // tabulação entre senha e botão atrapalha mais do que ajuda.
          tabIndex={-1}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="hover:text-ink -m-1 cursor-pointer p-1 transition-colors duration-100"
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}
