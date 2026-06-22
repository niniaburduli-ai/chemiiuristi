import Link from "next/link"
import { MessageSquare, FileText, FolderOpen, ArrowRight, Check } from "lucide-react"

const SERVICES = [
  {
    id: "ai-assistant",
    icon: MessageSquare,
    title: "AI იურისტი",
    subtitle: "დასვი კითხვა",
    description:
      "მიიღეთ მყისიერი პასუხები თქვენს იურიდიულ კითხვებზე ხელოვნური ინტელექტის დახმარებით, 24/7 რეჟიმში. ჩვენი AI გაწვრთნილია საქართველოს კანონმდებლობაზე და გაწვდით ზუსტ, წყაროებით გამყარებულ პასუხებს მარტივად გასაგებ ენაზე.",
    features: [
      "მყისიერი პასუხები საქართველოს კანონმდებლობის საფუძველზე",
      "ოფიციალური სამართლებრივი წყაროების ციტირება",
      "ხელმისაწვდომია 24/7, წინასწარი ჩაწერის გარეშე",
      "საუბრის სრული ისტორიის შენახვა",
      "დამატებითი კითხვების დასმის მხარდაჭერა",
    ],
    cta: "დასვი კითხვა",
    href: "/chat",
    comingSoon: false,
  },
  {
    id: "templates",
    icon: FileText,
    title: "შაბლონები",
    subtitle: "შექმენი შაბლონი",
    description:
      "შექმენით იურიდიული დოკუმენტები სწრაფად და მარტივად, მარტივი კითხვარის შევსებით. სისტემა ავტომატურად ამზადებს მზად გამოსაყენებელ დოკუმენტს.",
    features: [
      "შრომითი და მომსახურების ხელშეკრულებები",
      "ქირავნობის და იჯარის შეთანხმებები",
      "მინდობილობის დოკუმენტები",
      "ნაბიჯ-ნაბიჯ კითხვარი",
      "PDF ფორმატში ჩამოტვირთვა",
    ],
    cta: "Create Document",
    href: "/templates",
    comingSoon: true,
  },
  {
    id: "smart-analysis",
    icon: FolderOpen,
    title: "დოკუმენტები",
    subtitle: "შეამოწმე დოკუმენტი",
    description:
      "ატვირთეთ ნებისმიერი დოკუმენტი და სისტემა ავტომატურად აღმოაჩენს რისკებსა და საეჭვო პუნქტებს. მიიღეთ ზუსტი ინფორმაცია სანამ ხელს მოაწერთ დოკუმენტს.",
    features: [
      "პუნქტების დონეზე რისკების ამოცნობა",
      "მარტივად გასაგები რისკების ახსნა",
      "უჩვეულო ან არათანაბარი პირობების მონიშვნა",
      "PDF, DOCX და TXT მხარდაჭერა",
      "შედეგი 30 წამზე ნაკლებ დროში",
    ],
    cta: "ფაილის შემოწმება",
    href: "/docs",
    comingSoon: true,
  },
]

export default function ServicesPage() {
  return (
    <div className="container mx-auto px-4 py-14 max-w-5xl">
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[#1a1a2e] tracking-tight">სერვისები</h1>
        <p className="text-lg text-gray-500 mt-2 max-w-2xl">
          სამი ინსტრუმენტი, რომელიც კანონს მარტივ ენაზე გიყვება — კონსულტაცია, შაბლონები და ანალიზი.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {SERVICES.map((s) => {
          const Icon = s.icon
          const card = (
            <div
              className={[
                "rounded-2xl border p-8 flex flex-col sm:flex-row gap-8 transition-all",
                s.comingSoon
                  ? "bg-[#f7f7ff] border-[#e0e0ff] opacity-70"
                  : "bg-white border-[#e0e0ff] hover:shadow-lg hover:-translate-y-0.5 group",
              ].join(" ")}
            >
              {/* Icon column */}
              <div className="shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-[#ededff] flex items-center justify-center">
                  <Icon className={["h-8 w-8", s.comingSoon ? "text-[#a5b4fc]" : "text-[#6366f1]"].join(" ")} />
                </div>
              </div>

              {/* Content column */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h2 className={["text-2xl font-bold leading-snug", s.comingSoon ? "text-[#6b7280]" : "text-[#1a1a2e]"].join(" ")}>
                      {s.title}
                    </h2>
                    <p className={["text-sm font-semibold mt-0.5", s.comingSoon ? "text-[#a5b4fc]" : "text-[#6366f1]"].join(" ")}>
                      {s.subtitle}
                    </p>
                  </div>
                  {s.comingSoon && (
                    <span className="text-[10px] font-semibold tracking-widest uppercase text-gray-400 border border-gray-200 rounded-full px-3 py-1 shrink-0">
                      მალე
                    </span>
                  )}
                </div>

                <p className="text-gray-500 mt-3 leading-relaxed">{s.description}</p>

                <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className={["h-4 w-4 shrink-0 mt-0.5", s.comingSoon ? "text-[#a5b4fc]" : "text-[#6366f1]"].join(" ")} />
                      {f}
                    </li>
                  ))}
                </ul>

                {!s.comingSoon && (
                  <div className="mt-6">
                    <Link
                      href={s.href}
                      className="inline-flex items-center gap-2 bg-[#4338ca] hover:bg-[#3730a3] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                    >
                      {s.cta}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )

          return <div key={s.id}>{card}</div>
        })}
      </div>
    </div>
  )
}
