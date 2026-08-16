import Image from "next/image";

import { cn } from "@/shared/lib/cn";

import logo from "../assets/logo.svg";

type BrandLogoProps = {
  className?: string;
  priority?: boolean;
};

/** Marca visual do app. O tamanho é definido pelo contexto via `className`. */
export function BrandLogo({ className, priority = false }: BrandLogoProps) {
  return (
    <Image
      src={logo}
      alt="Wishlist da Casa"
      priority={priority}
      draggable={false}
      className={cn("size-10 shrink-0 object-contain", className)}
    />
  );
}
