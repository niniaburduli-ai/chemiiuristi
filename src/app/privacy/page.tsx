import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "კონფიდენციალურობის პოლიტიკა | ჩემი იურისტი",
  description: "ჩემი იურისტის კონფიდენციალურობის პოლიტიკა",
};

export default function PrivacyPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-bold mb-8">კონფიდენციალურობის პოლიტიკა</h1>

      <div className="space-y-6 text-sm leading-relaxed text-foreground/90">
        <p>
          მომხმარებლის მონაცემები გამოიყენება მხოლოდ სერვისის მიწოდების, სისტემის
          გაუმჯობესებისა და სამართლებრივი ანალიზის მიზნით.
        </p>

        <p>
          მონაცემები არ გადაეცემა მესამე პირებს კომერციული მიზნებით, გარდა სერვისის
          ფუნქციონირებისთვის აუცილებელი ტექნიკური პროვაიდერებისა.
        </p>

        <p>
          მომხმარებელს უფლება აქვს მოითხოვოს საკუთარ მონაცემებზე წვდომა, მათი
          ცვლილება ან წაშლა მოქმედი კანონმდებლობის შესაბამისად.
        </p>
      </div>
    </main>
  );
}
