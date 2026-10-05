import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { Screen } from "@/components/Screen";

export default function NotFound() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = "Not found · Fursan";
    return () => {
      document.title = "Fursan";
    };
  }, []);

  return (
    <Screen title="Not in the record" subtitle="Error 404" back>
      <p className="text-body text-ink-muted">
        Nothing lives at this address. It may have moved, or the link may be mistyped.
      </p>
      <p className="mt-4 break-all rounded-md border border-border bg-surface-2 px-4 py-3 font-data text-meta text-ink-muted">
        {pathname}
      </p>
    </Screen>
  );
}