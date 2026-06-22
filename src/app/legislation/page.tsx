"use client";

import { useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Doc = { id: string; title: string; description: string; tag: string; url: string };

const mockDocs: Doc[] = [
  {
    id: "1",
    title: "შრომის კოდექსი",
    description: "არეგულირებს დასაქმებულისა და დამსაქმებლის ურთიერთობას, მათ შორის: განთავისუფლებას, შვებულებას, ხელფასს, ზეგანაკვეთურ სამუშაოს, დეკრეტს, კონტრაქტებს, კომპენსაციას, სამუშაო დროს და სხვა შრომით საკითხებს.",
    tag: "შრომა",
    url: "https://matsne.gov.ge/ka/document/view/1155567?utm_source=&publication=28",
  },
  {
    id: "2",
    title: "სამოქალაქო კოდექსი",
    description: "მოიცავს ხელშეკრულებებს, ქირავნობას, სესხს, ვალდებულებებს, მემკვიდრეობას, საოჯახო სამართალს, საკუთრების უფლებას, იპოთეკას, ზიანის ანაზღაურებას და სხვა სამოქალაქო ურთიერთობებს.",
    tag: "სამოქალაქო",
    url: "https://www.matsne.gov.ge/ka/document/view/31702?publication=138",
  },
  {
    id: "3",
    title: "ადმინისტრაციულ სამართალდარღვევათა კოდექსი",
    description: "მოიცავს ადმინისტრაციულ დარღვევებსა და პასუხისმგებლობას, მათ შორის: ჯარიმებს, საგზაო დარღვევებს, საპატრულო სამართალდარღვევებს და სხვა ადმინისტრაციულ საკითხებს.",
    tag: "ადმინისტრაციული",
    url: "https://matsne.gov.ge/ka/document/view/28216?publication=623",
  },
  {
    id: "4",
    title: "კანონი მომხმარებელთა უფლებების დაცვის შესახებ",
    description: "არეგულირებს მომხმარებლის უფლებებს პროდუქტის ან მომსახურების შეძენისას, მათ შორის: ონლაინ შეძენას, ნივთის დაბრუნებას, გარანტიას, დაზიანებულ პროდუქტს, შეცდომაში შეყვანას და მომსახურების ხარისხს.",
    tag: "მომხმარებელი",
    url: "https://matsne.gov.ge/ka/document/view/5420598?publication=3",
  },
  {
    id: "5",
    title: "საგადასახადო კოდექსი",
    description: "არეგულირებს საგადასახადო საკითხებს, მათ შორის: ინდმეწარმეს, მცირე ბიზნესს, გადასახადებს, დღგ-ს, დეკლარაციებს, ჯარიმებსა და სხვა ფინანსურ ვალდებულებებს.",
    tag: "გადასახადი",
    url: "https://matsne.gov.ge/ka/document/view/1043717?publication=244",
  },
  {
    id: "6",
    title: "პერსონალური მონაცემების დაცვა",
    description: "არეგულირებს პერსონალური მონაცემების დამუშავებასა და დაცვას, მათ შორის: ვიდეოკამერებს, პირადი ინფორმაციის გავრცელებას, კონფიდენციალურობას და მონაცემთა უსაფრთხოებას.",
    tag: "კონფიდენციალობა",
    url: "https://matsne.gov.ge/ka/document/view/1043717?publication=244",
  },
  {
    id: "7",
    title: "საქართველოს კონსტიტუცია",
    description: "მოიცავს სახელმწიფოს მოწყობის, ადამიანის უფლებების, თავისუფლებების, საკუთრების უფლების, სიტყვის თავისუფლების, თანასწორობისა და მოქალაქის კონსტიტუციური უფლებების ძირითად პრინციპებს.",
    tag: "კონსტიტუცია",
    url: "https://matsne.gov.ge/ka/document/view/30346?publication=36",
  },
  {
    id: "8",
    title: "კანონი ფულის გათეთრებისა და ტერორიზმის დაფინანსების აღმკვეთი ღონისძიებების შესახებ",
    description: "არეგულირებს ფულის გათეთრებისა და ტერორიზმის დაფინანსების წინააღმდეგ მიმართულ წესებს, ფინანსური მონიტორინგის ვალდებულებებს, საეჭვო ტრანზაქციების კონტროლს, იდენტიფიკაციასა და ფინანსური უსაფრთხოების მოთხოვნებს.",
    tag: "ფინანსები",
    url: "https://matsne.gov.ge/ka/document/view/4690334?publication=14",
  },
];

const categories = ["ყველა", "შრომა", "სამოქალაქო", "ადმინისტრაციული", "მომხმარებელი", "გადასახადი", "კონფიდენციალობა", "კონსტიტუცია", "ფინანსები"];

export default function LegislationPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("ყველა");

  const filtered = mockDocs.filter((d) => {
    const matchCat = cat === "ყველა" || d.tag === cat;
    const matchQ =
      !q ||
      d.title.toLowerCase().includes(q.toLowerCase()) ||
      d.description.toLowerCase().includes(q.toLowerCase()) ||
      d.tag.toLowerCase().includes(q.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">კანონმდებლობა</h1>
        <p className="text-muted-foreground mt-1">
          საქართველოს კოდექსები და მუხლები — მოძებნე, რომელიც გჭირდება.
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ძებნა: მუხლის ნომერი, კოდექსი, საკითხი..."
          className="pl-9"
        />
      </div>

      <Tabs value={cat} onValueChange={setCat} className="mb-6">
        <TabsList className="flex flex-wrap h-auto">
          {categories.map((c) => (
            <TabsTrigger key={c} value={c}>
              {c}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={cat} className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((d) => (
              <a
                key={d.id}
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 bg-[#f7f7ff] border border-[#e0e0ff] rounded-2xl px-6 py-7 hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="shrink-0 w-12 h-12 rounded-full bg-[#ededff] flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-[#6366f1]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#3730a3] leading-snug">{d.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{d.description}</p>
                  <Badge variant="secondary" className="mt-3 text-xs">
                    {d.tag}
                  </Badge>
                </div>
              </a>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-muted-foreground py-12">
              ვერ მოიძებნა შედეგი.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
