import { cn } from '@/lib/utils'
import Link from 'next/link'
import React from 'react'

interface LogoProps {
    containerClassName?: string;
}


const Logo: React.FC<LogoProps> = ({ containerClassName }) => {

    return (
        <Link href="/" className={cn("", containerClassName)}>
            <h3 className="text-3xl text-foreground font-[monospace] font-medium ">FlashAI</h3>
        </Link>
    )
}

export default Logo;
