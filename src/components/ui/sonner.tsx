import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/context/ThemeContext";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Token-driven toasts that follow the *actual* Fursan theme.
 *
 * This previously called `useTheme` from `next-themes`, which is not wired to
 * Fursan's provider — so `theme` always fell back to "system" and every toast
 * rendered with the OS palette, which was wrong on all five dark themes.
 */
export function Toaster({ ...props }: ToasterProps) {
  const { currentTheme } = useTheme();

  return (
    <Sonner
      theme={currentTheme.scheme}
      className="toaster group"
      position="bottom-center"
      // Keep toasts clear of the fixed bottom navigation bar.
      offset={88}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border-border group-[.toaster]:bg-surface group-[.toaster]:text-ink group-[.toaster]:shadow-e3",
          title: "group-[.toast]:text-ink",
          description: "group-[.toast]:text-ink-muted",
          actionButton: "group-[.toast]:bg-ink group-[.toast]:text-bg",
          cancelButton: "group-[.toast]:border-border group-[.toast]:bg-surface-2 group-[.toast]:text-ink-muted",
          closeButton: "group-[.toast]:border-border group-[.toast]:bg-surface-2 group-[.toast]:text-ink-muted",
        },
      }}
      {...props}
    />
  );
}