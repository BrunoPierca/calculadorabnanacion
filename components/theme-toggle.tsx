"use client"

import { useState, useEffect } from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSubTrigger,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Avoid hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="outline" size="icon" className="h-8 w-8">
                <Monitor className="h-4 w-4" />
                <span className="sr-only">Toggle theme</span>
            </Button>
        )
    }

    const getIcon = () => {
        switch (resolvedTheme) {
            case "light":
                return <Sun className="h-4 w-4" />
            case "dark":
                return <Moon className="h-4 w-4" />
            default:
                return <Monitor className="h-4 w-4" />
        }
    }

    return (
        <div className="px-4">
            <DropdownMenu>
                <DropdownMenuTrigger asChild className="">
                    <Button variant="outline" size="icon" className="h-8 w-8">
                        {getIcon()}
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                        <DropdownMenuRadioItem value="light">
                            <Sun className="h-4 w-4" />
                            <span>Light</span>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="dark">
                            <Moon className="h-4 w-4" />
                            <span>Dark</span>
                        </DropdownMenuRadioItem>
                        <DropdownMenuRadioItem value="system">
                            <Monitor className="h-4 w-4" />
                            <span>System</span>
                        </DropdownMenuRadioItem>
                    </DropdownMenuRadioGroup>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>

    )
}
