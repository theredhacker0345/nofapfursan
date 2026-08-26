import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      // Keep toasts clear of the fixed bottom navigation bar
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-bg group-[.toaster]:text-ink group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-ink-muted",
          actionButton: "group-[.toast]:bg-ink group-[.toast]:text-bg",
          cancelButton: "group-[.toast]:bg-surface-2 group-[.toast]:text-ink-muted",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
