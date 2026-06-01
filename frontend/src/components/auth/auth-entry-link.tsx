"use client";

import { useRouter } from "next/navigation";
import {
  type MouseEvent,
  type ReactNode,
  useCallback,
  useState,
} from "react";

import { AuthRedirectOverlay } from "@/components/auth/auth-redirect-overlay";
import { getOptionalClientUser } from "@/lib/auth/client-session";
import { getDestinationFromLoginHref } from "@/lib/auth/login-redirect";
import { createClient } from "@/lib/supabase/client";

type AuthEntryLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

export function AuthEntryLink({ href, className, children }: AuthEntryLinkProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  const destination = getDestinationFromLoginHref(href);

  const handleClick = useCallback(
    async (event: MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault();
      if (isChecking) {
        return;
      }

      setIsChecking(true);

      const supabase = createClient();
      const user = await getOptionalClientUser(supabase);

      if (user) {
        router.replace(destination);
        return;
      }

      setIsChecking(false);
      router.push(href);
    },
    [destination, href, isChecking, router],
  );

  return (
    <>
      {isChecking ? <AuthRedirectOverlay destination={destination} /> : null}
      <a
        href={href}
        className={className}
        onClick={handleClick}
        aria-busy={isChecking}
      >
        {children}
      </a>
    </>
  );
}
