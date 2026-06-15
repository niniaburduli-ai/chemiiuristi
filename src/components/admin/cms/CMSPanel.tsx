"use client"
import { useState } from "react"
import { CMSSidebar, type CMSSection } from "./CMSSidebar"
import { SiteConfigForm } from "./SiteConfigForm"
import { NavMenuForm } from "./NavMenuForm"
import { HomePageForm } from "./HomePageForm"
import { AboutPageForm } from "./AboutPageForm"
import { FAQForm } from "./FAQForm"
import { BlogPanel } from "./BlogPanel"
import { FooterForm } from "./FooterForm"
import { LegalNoticesForm } from "./LegalNoticesForm"

export function CMSPanel() {
  const [section, setSection] = useState<CMSSection>("site-config")

  return (
    <div className="flex min-h-[600px] gap-0 rounded-lg border">
      <CMSSidebar active={section} onSelect={setSection} />
      <div className="flex-1 overflow-auto p-6">
        {section === "site-config" && <SiteConfigForm />}
        {section === "nav" && <NavMenuForm />}
        {section === "homepage" && <HomePageForm />}
        {section === "about" && <AboutPageForm />}
        {section === "faq" && <FAQForm />}
        {section === "blog" && <BlogPanel />}
        {section === "footer" && <FooterForm />}
        {section === "legal" && <LegalNoticesForm />}
      </div>
    </div>
  )
}
