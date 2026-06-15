import type { HomePageData } from "@/types/cms"

// Used by: route.ts (DB seed on first GET) + page.tsx (fallback when cms is null/draft)
export const HOME_SEED: Omit<HomePageData, "status"> = {
  sections: { hero: true, stats: true, features: true, pricing: true, cta: true },
  hero: {
    title: "ჩემი იურისტი",
    subtitle: "კანონი მარტივ ენაზე",
    ctaText: "",
    ctaHref: "",
    imageUrl: "",
    imagePubId: "",
  },
  serviceCards: [
    { _id: "sc-1", title: "AI იურისტი", subtitle: "დასვი კითხვა", href: "/chat", icon: "MessageSquare", comingSoon: false, visible: true, order: 0 },
    { _id: "sc-2", title: "შაბლონები", subtitle: "შექმენი შაბლონი", href: "/templates", icon: "FileText", comingSoon: true, visible: true, order: 1 },
    { _id: "sc-3", title: "დოკუმენტები", subtitle: "შეამოწმე დოკუმენტი", href: "/docs", icon: "FolderOpen", comingSoon: true, visible: true, order: 2 },
  ],
  statsHeading: "ჩვენი შედეგები ციფრებში",
  stats: [
    { _id: "st-1", label: "დასმული კითხვა", value: "0", icon: "MessageSquare", visible: true, order: 0 },
    { _id: "st-2", label: "დამუშავებული დოკუმენტი", value: "0", icon: "FileText", visible: true, order: 1 },
    { _id: "st-3", label: "გამოყენებული შაბლონი", value: "0", icon: "Layers", visible: true, order: 2 },
    { _id: "st-4", label: "რეგისტრირებული მომხმარებელი", value: "11", icon: "Users", visible: true, order: 3 },
  ],
  featuresHeading: "რატომ ჩემი იურისტი?",
  features: [
    { _id: "fe-1", title: "მარტივი გამოყენება", body: "დასვით კითხვა, გამოიყენეთ შაბლონები ან ატვირთეთ დოკუმენტი მარტივად. პლატფორმა შექმნილია ყველასთვის.", icon: "MousePointerClick", order: 0, visible: true },
    { _id: "fe-2", title: "სწრაფი პასუხები", body: "მიიღეთ თქვენთვის საჭირი ინფორმაცია წამებში.", icon: "Zap", order: 1, visible: true },
    { _id: "fe-3", title: "ერთ სივრცეში", body: "იურიდიული კონსულტაცია, დოკუმენტების შემოწმება და შაბლონები — ყველაფერი ერთ პლატფორმაზე.", icon: "Layers", order: 2, visible: true },
    { _id: "fe-4", title: "უსაფრთხო გარემო", body: "თქვენი კითხვები და დოკუმენტები მუშავდება კონფიდენციალურად და უსაფრთხოდ.", icon: "ShieldCheck", order: 3, visible: true },
    { _id: "fe-5", title: "24/7 ხელმისაწვდომობა", body: "მიიღეთ იურიდიული ინფორმაცია ნებისმიერ დროს, თქვენთვის მოსახერხებელ მომენტში.", icon: "Clock", order: 4, visible: true },
  ],
  pricingHeading: "აირჩიე თქვენზე მორგებული პაკეტი",
  plans: [
    {
      _id: "pl-1", name: "საბაზისო პაკეტი", price: "0", badge: "",
      ctaText: "დაიწყეთ უფასოდ", ctaHref: "/register", plan: "",
      highlighted: false, visible: true, order: 0,
      items: ["9 კონსულტაცია AI იურისტთან", "ოფიციალური წყაროების მითითება", "კითხვების ისტორიის ნახვა"],
    },
    {
      _id: "pl-2", name: "სტანდარტული პაკეტი", price: "19", badge: "ყველაზე პოპულარული",
      ctaText: "აირჩიეთ პაკეტი", ctaHref: "/register", plan: "standard",
      highlighted: true, visible: true, order: 1,
      items: ["29 კონსულტაცია AI იურისტთან", "19 შაბლონის გენერირება", "9 დოკუმენტის შემოწმება", "ოფიციალური წყაროების მითითება", "კითხვების ისტორიის ნახვა"],
    },
    {
      _id: "pl-3", name: "პრემიუმ (ბიზნეს) პაკეტი", price: "99", badge: "",
      ctaText: "აირჩიეთ პაკეტი", ctaHref: "/register", plan: "premium",
      highlighted: false, visible: true, order: 2,
      items: ["შეუზღუდავი კონსულტაცია AI იურისტთან", "შეუზღუდავი შაბლონის გენერირება", "99 დოკუმენტის/ხელშეკრულების შემოწმება", "ოფიციალური წყაროების მითითება", "კითხვების ისტორიის ნახვა", "გაფართოებული იურიდიული ანალიზი"],
    },
  ],
  ctaSection: {
    title: "მზად ხარ?",
    subtitle: "დაარეგისტრირდი წამში და მიიღე პირველი კონსულტაცია უფასოდ.",
    buttonText: "რეგისტრაცია",
    buttonHref: "/register",
  },
}
