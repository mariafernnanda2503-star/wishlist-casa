"use client";

import { Toaster as SonnerToaster } from "sonner";

import { AlertIcon, CheckIcon, ChevronDownIcon, InfoIcon, XIcon } from "@/ui/icons";

export function Toaster() {
  return (
    <SonnerToaster
      className="app-toaster"
      theme="light"
      position="bottom-right"
      duration={3500}
      gap={8}
      visibleToasts={4}
      closeButton
      icons={{
        success: <CheckIcon />,
        info: <InfoIcon />,
        warning: <AlertIcon />,
        error: <XIcon />,
        close: <ChevronDownIcon className="size-3.5" />,
      }}
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: "Fechar notificação",
      }}
    />
  );
}
