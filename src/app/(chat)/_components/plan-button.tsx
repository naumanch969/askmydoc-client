import React from 'react'
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { cn } from '@/lib/utils';


const PlanButton = () => {

    const components: { title: string; href: string; description: string }[] = [
        {
            title: "FLashAI Plus",
            href: "/docs/primitives/alert-dialog",
            description: "Our smart model.",
        },
        {
            title: "FlashAI Standard",
            href: "/docs/primitives/hover-card",
            description:
                "Best for most users.",
        },
    ]

    return (
        <div>

            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger>FlashAI</NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <ul className="grid w-[300px] gap-1 p-2">
                                {components.map((component) => (
                                    <ListItem key={component.title} title={component.title} href={component.href}  >
                                        {component.description}
                                    </ListItem>
                                ))}
                            </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>

        </div>
    )
}

export default PlanButton


const ListItem = React.forwardRef<
    React.ElementRef<"a">,
    React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <a
                    ref={ref}
                    className={cn("block hover:bg-muted space-y-1 rounded-md p-2 leading-none no-underline outline-none transition-colors", className)}
                    {...props}
                >
                    <div className="text-sm font-medium leading-none">{title}</div>
                    <p className="line-clamp-2 text-xs leading-snug text-muted-foreground">{children}</p>
                </a>
            </NavigationMenuLink>
        </li>
    )
})