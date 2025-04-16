import { defineRouting } from "next-intl/routing";
import { createNavigation } from "next-intl/navigation";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "fr"],
  // Used when no locale matches
  defaultLocale: "en",
  localePrefix: "always",
  // Will be merged with the defaults
  localeCookie: {
    // Custom cookie name
    name: "USER_LOCALE",
    // Expire in one day
    maxAge: 60 * 60 * 24,
  },
});

export type Locale = (typeof routing.locales)[number];

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
