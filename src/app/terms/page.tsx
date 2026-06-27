import type { Metadata } from "next"
import { PageHero } from "@/components/site/PageHero"

export const metadata: Metadata = {
  title: "მომსახურების პირობები | ჩემი იურისტი",
  description: "ჩემი იურისტის მომსახურების პირობები",
}

export default function TermsPage() {
  return (
    <div>
      <PageHero title="მომსახურების პირობები" />
      <section className="container mx-auto max-w-3xl px-4 py-12">
        <div className="bg-card border border-border rounded-2xl p-8 md:p-10 animate-fade-up delay-150 space-y-6 text-sm leading-relaxed text-foreground/90">
          <p>
            „ჩემი იურისტი&rdquo; წარმოადგენს ხელოვნურ ინტელექტზე დაფუძნებულ საინფორმაციო
            პლატფორმას, რომელიც აწვდის მომხმარებელს კანონმდებლობაზე დაფუძნებულ
            გენერირებულ პასუხებს, იურიდიულ ანალიზს და დოკუმენტების შაბლონებს.
          </p>
          <p>
            პლატფორმა არ წარმოადგენს ადვოკატურ ბიუროს, იურიდიულ წარმომადგენელს ან
            სახელმწიფო ორგანოს და არ ახორციელებს ოფიციალურ სამართლებრივ მომსახურებას.
          </p>
          <p>
            სერვისის გამოყენება შესაძლებელია მხოლოდ წინამდებარე პირობების მიღების
            საფუძველზე. პლატფორმას შეუძლია დააწესოს სერვისის გამოყენების ტექნიკური ან
            რაოდენობრივი ლიმიტები.
          </p>
        </div>
      </section>
    </div>
  )
}
