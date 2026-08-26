import React from 'react';
import { cn } from '@/lib/utils';

interface FursanLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    size?: number | string;
    variant?: 'star' | 'crescent';
    withGlow?: boolean;
}

/**
 * FursanLogo - Islamic Knightly Protocol Logo
 * Renders the official project logo.
 */
export function FursanLogo({
    size = 48,
    variant = 'star',
    className = '',
    withGlow = true,
    style,
    ...props
}: FursanLogoProps) {
    const glowClass = withGlow ? '' : '';

    return (
        <img
            src="/logo.png"
            alt="Fursan Logo"
            width={size}
            height={size}
            className={cn(glowClass, className, "object-contain")}
            style={{ width: size, height: size, ...style }}
            {...props}
        />
    );
}

export default FursanLogo;
