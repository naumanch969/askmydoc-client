import { cn } from '@/lib/utils';
import Link from 'next/link';
import React from 'react';

interface LogoProps {
    containerClassName?: string;
    disabled?: boolean;
}

const Logo: React.FC<LogoProps> = ({ containerClassName, disabled = false }) => {
    const content = (
        <h3 className="text-3xl text-foreground font-[monospace] font-medium" title={disabled ? "Logo (disabled)" : "Go to home"} >
            FlashAI
        </h3>
    );

    return disabled ? (
        <span
            className={cn("cursor-default select-none", containerClassName)}
            role="presentation"
        >
            {content}
        </span>
    ) : (
        <Link
            href="/"
            className={cn("hover:opacity-90 transition-opacity", containerClassName)}
        >
            {content}
        </Link>
    );
};

export default Logo;
