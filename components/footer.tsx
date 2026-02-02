"use client"

import Link from "next/link"
import { Github, Linkedin, Mail } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="flex w-full border-t py-6 md:py-0">
      <div className="flex-1 flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row px-6 md:px-10">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          &copy; {currentYear} Bruno Piercamilli. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-4">
          <Link href="https://github.com/BrunoPierca" target="_blank" rel="noopener noreferrer">
            <Github className="h-5 w-5" />
            <span className="sr-only">GitHub</span>
          </Link>
          <Link href="https://linkedin.com/in/bruno-piercamilli" target="_blank" rel="noopener noreferrer">
            <Linkedin className="h-5 w-5" />
            <span className="sr-only">LinkedIn</span>
          </Link>
          <Link href="mailto:piercamillibruno@gmail.com">
            <Mail className="h-5 w-5" />
            <span className="sr-only">Email</span>
          </Link>
        </div>
      </div>
    </footer>
  )
}
