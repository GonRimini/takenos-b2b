"use client"

import Hamburger from "hamburger-react"
import { useSidebar } from "@/components/ui/sidebar"

export function CustomTrigger() {
  const { isMobile, open, setOpen, openMobile, setOpenMobile } = useSidebar()

  const toggled = isMobile ? openMobile : open

  return (
    <Hamburger
      toggled={toggled}
      toggle={(next) => {
        if (isMobile) setOpenMobile(next)
        else setOpen(next)
      }}
      direction="right"
      size={20}
      color="#6d37d5"
    />
  )
}