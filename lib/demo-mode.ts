import { cn } from "@/lib/utils";

const DEMO_SENSITIVE_TEXT_CLASSNAME =
  "select-none blur-[6px] transition-[filter] duration-200";
const DEMO_SENSITIVE_IMAGE_CLASSNAME =
  "select-none blur-md saturate-0 transition-[filter] duration-200";

export function getDemoSensitiveTextClassName(
  enabled: boolean,
  className?: string,
) {
  return cn(className, enabled && DEMO_SENSITIVE_TEXT_CLASSNAME);
}

export function getDemoSensitiveImageClassName(
  enabled: boolean,
  className?: string,
) {
  return cn(className, enabled && DEMO_SENSITIVE_IMAGE_CLASSNAME);
}
