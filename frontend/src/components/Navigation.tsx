import React from "react";
import { LucideIcon, Users, Library, Film, LogOut, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuLink,
    navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
interface Route {
    path: string;
    label: string;
    icon: LucideIcon;
    isDynamic?: boolean;
}

const routes: Route[] = [
    { path: "/", label: "Contacts", icon: Users },
    // { path: "/new-user", label: "New Contact", icon: UserPlus },
    { path: "/new-video", label: "New Video", icon: Film },
    { path: "/videos", label: "Videos", icon: Library },
    { path: "/logout", label: "Logout", icon: LogOut },
];

const Navigation = React.memo(() => {
    const [location, navigate] = useLocation();

    const currentRoutes = useMemo(() => {
        const updatedRoutes = [...routes];
        const userMatch = location.match(/^\/users\/([^/]+)/);
        const videoMatch = location.match(/^\/videos\/([^/]+)/);

        if (userMatch) {
            const userId = userMatch[1];
            const userIndex = updatedRoutes.findIndex(route => route.path === "/");
            if (userIndex !== -1) {
                updatedRoutes.splice(userIndex + 1, 0, {
                    path: `/users/${userId}`,
                    label: `${userId.substring(0, 10)}...`,
                    icon: ArrowRight,
                    isDynamic: true
                });
            }
        }

        if (videoMatch) {
            const videoId = videoMatch[1];
            const videoIndex = updatedRoutes.findIndex(route => route.path === "/videos");
            if (videoIndex !== -1) {
                updatedRoutes.splice(videoIndex + 1, 0, {
                    path: `/videos/${videoId}`,
                    label: `${videoId.substring(0, 10)}...`,
                    icon: ArrowRight,
                    isDynamic: true
                });
            }
        }

        return updatedRoutes;
    }, [location]);

    return (
        <NavigationMenu
            orientation="vertical"
            className={
                "flex flex-col justify-start border-r h-full overflow-hidden whitespace-nowrap group transition-[max-width] duration-300 ease-in-out max-w-[60px] hover:max-w-[200px]"
            }>
            <NavigationMenuList className="flex flex-col items-start flex-grow p-2 space-y-1">
                <NavigationMenuItem className="flex-grow w-full mt-6 mb-4 ml-4 text-2xl font-bold">
                    🐴
                </NavigationMenuItem>
                {currentRoutes.map((route) => (
                    <NavigationMenuItem className="w-full"
                        key={route.path}>
                        <NavigationMenuLink
                            className={cn(
                                navigationMenuTriggerStyle(),
                                "flex w-full flex-grow justify-start cursor-pointer",
                                route.path === "/logout" ? "text-muted-foreground" : "",
                                route.isDynamic ? "ml-2" : "",
                                (route.path === '/' ? location === '/' : location.startsWith(route.path)) ? "bg-accent text-accent-foreground" : ""
                            )}
                            onClick={() => navigate(route.path)}>
                            <route.icon className="w-4 h-4 mr-2" />
                            {/* group-hover:opacity-100 group-hover:static  */}
                            <span className="w-full overflow-hidden transition-opacity duration-300 ease-in-out absolute z-[-1] transition-transform delay-300 opacity-0 group-hover:opacity-100 group-hover:static group-hover:z-auto">
                                {route.label}
                            </span>
                        </NavigationMenuLink>
                    </NavigationMenuItem>
                ))}
            </NavigationMenuList>
        </NavigationMenu>
    );
});

Navigation.displayName = 'Navigation';

export default Navigation;