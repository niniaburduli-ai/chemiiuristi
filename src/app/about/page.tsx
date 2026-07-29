import type { Metadata } from 'next'
import { getAboutPage } from '@/lib/cms'
import { getLocale } from '@/lib/i18n/locale'
import { getDict } from '@/lib/i18n/dictionaries'
import Image from 'next/image'
import { AnimateIn } from '@/components/site/AnimateIn'
import { PageHero } from '@/components/site/PageHero'
import { buildMetadata } from '@/lib/seo'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const isEn = locale === 'en'
  return buildMetadata({
    title: isEn ? 'About Us' : 'ჩვენ შესახებ',
    description: isEn
      ? 'Chemi Iuristi — a modern AI legal platform making legal consultation, contract review, and contract generation accessible to everyone.'
      : 'ჩემი იურისტი — თანამედროვე AI იურიდიული პლატფორმა, რომელიც იურიდიულ კონსულტაციას, ხელშეკრულების შემოწმებას და გენერირებას ხელმისაწვდომს ხდის ყველასთვის.',
    path: '/about',
    locale,
    bilingual: true,
  })
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split('\n\n').map((p, i) => (
        <p key={i} className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line mb-4 last:mb-0">
          {p}
        </p>
      ))}
    </>
  )
}

export default async function AboutPage() {
  const locale = await getLocale()
  const cms = await getAboutPage(locale)
  const dict = getDict(locale)
  const d = dict.about

  const title = cms?.title || d.title
  const intro = cms?.intro || d.intro
  const historyTitle = cms?.historyTitle || d.historyTitle
  const historyBody = cms?.historyBody || d.historyBody
  const missionTitle = cms?.missionTitle || d.missionTitle
  const mission = cms?.mission || d.mission
  const team = [...(cms?.team ?? [])].sort((a, b) => a.order - b.order)

  const sections = [
    { id: 'intro', title, body: intro, multi: true },
    { id: 'history', title: historyTitle, body: historyBody, multi: true },
    { id: 'mission', title: missionTitle, body: mission, multi: false },
  ]

  return (
    <div>
      <PageHero title={dict.home.heroTitle} subtitle={d.heroSubtitle} />

      <section className="bg-background overflow-hidden">
        <div className="container mx-auto px-4 py-14 space-y-12">
          {sections.map((s, idx) => (
            <AnimateIn key={s.id} delay={idx * 100}>
              <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">{s.title}</h2>
                  <div className="h-1 w-12 bg-gradient-to-r from-primary to-gold mt-3 rounded-full" />
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 md:p-7">
                  {s.multi ? (
                    <Paragraphs text={s.body} />
                  ) : (
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{s.body}</p>
                  )}
                </div>
              </div>
            </AnimateIn>
          ))}

          {team.length > 0 && (
            <AnimateIn delay={300}>
              <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">{d.teamTitle}</h2>
                  <div className="h-1 w-12 bg-gradient-to-r from-primary to-gold mt-3 rounded-full" />
                </div>
                <div className="bg-card border border-border rounded-2xl p-6 md:p-7">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                    {team.map((member, idx) => (
                      <AnimateIn key={String(member._id)} delay={idx * 80}>
                        <div className="flex flex-col items-center text-center gap-3">
                          {member.imageUrl ? (
                            <Image
                              src={member.imageUrl}
                              alt={member.name}
                              width={80}
                              height={80}
                              className="w-20 h-20 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <span className="text-2xl font-bold text-gold">
                                {member.name[0] ?? '?'}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-foreground">{member.name}</p>
                            <p className="text-sm text-muted-foreground">{member.role}</p>
                          </div>
                        </div>
                      </AnimateIn>
                    ))}
                  </div>
                </div>
              </div>
            </AnimateIn>
          )}
        </div>
      </section>
    </div>
  )
}
