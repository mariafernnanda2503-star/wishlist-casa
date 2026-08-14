import { type ComponentPropsWithRef } from "react";

import { cn } from "@/shared/lib/cn";

import { fieldClassName } from "./input";

export function Select({ className, ...props }: ComponentPropsWithRef<"select">) {
  return <select className={cn(fieldClassName, className)} {...props} />;
}
