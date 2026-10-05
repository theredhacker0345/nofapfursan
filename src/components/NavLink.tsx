import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type ClassValue = string | ((props: { isActive: boolean; isPending: boolean }) => string);

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: ClassValue;
  activeClassName?: string;
  pendingClassName?: string;
}

/** Thin wrapper so callers can use a `className` function like Radix/Router. */
const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, ...props }, ref) => (
    <RouterNavLink
      ref={ref}
      to={to}
      className={({ isActive, isPending }) => {
        const base = typeof className === "function" ? className({ isActive, isPending }) : className;
        return cn(base, isActive && activeClassName, isPending && pendingClassName);
      }}
      {...props}
    />
  ),
);

NavLink.displayName = "NavLink";

export { NavLink };