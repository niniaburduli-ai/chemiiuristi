import type { GuideItem } from "@/types/cms"

/**
 * Shown until the admin publishes real guide content in the DB (Guides
 * collection), so /guides is never empty on a fresh install — same role as
 * DEFAULT_FAQ in lib/cms.ts. These articles are the ones originally
 * shipped; content verified against matsne.gov.ge (see each item's `sources`).
 */
export const DEFAULT_GUIDES: GuideItem[] = [
  {
    _id: "guide-1",
    slug: "mankanis-jarimis-gasachivreba",
    title: "მანქანის ჯარიმის გასაჩივრება — რა ნაბიჯებია საჭირო",
    titleEn: "Appealing a Traffic Fine in Georgia — What Steps Are Needed",
    description:
      "როგორ გავასაჩივროთ საგზაო მოძრაობის წესების დარღვევისთვის დაკისრებული ჯარიმა საქართველოში — ვადები, საჭირო დოკუმენტები და პროცედურის ზოგადი მიმოხილვა.",
    descriptionEn:
      "How to appeal a traffic fine in Georgia — deadlines, required documents, and a general overview of the procedure.",
    keywords: ["მანქანის ჯარიმის გასაჩივრება", "ჯარიმის გასაჩივრება", "საგზაო ჯარიმა", "მანქანის ჯარიმები"],
    keywordsEn: ["traffic fine appeal", "appeal a fine Georgia", "traffic fines", "Georgian traffic law"],
    intro:
      "საგზაო მოძრაობის წესების დარღვევისთვის დაკისრებული ჯარიმის მიღების შემდეგ მძღოლს აქვს უფლება, გაასაჩივროს იგი, თუ მიაჩნია, რომ ჯარიმა უსაფუძვლოდ ან შეცდომით არის დაკისრებული. ქვემოთ მოცემულია პროცესის ზოგადი სტრუქტურა.",
    introEn:
      "After receiving a fine for a traffic violation, a driver has the right to appeal it if they believe the fine was imposed without grounds or by mistake. Below is a general outline of the process.",
    sections: [
      {
        title: "როდის ღირს გასაჩივრება",
        titleEn: "When appealing is worth it",
        paragraphs: [
          "გასაჩივრება აზრი აქვს, როცა არსებობს კონკრეტული საფუძველი — მაგალითად, ავტომობილი იმ დროს სხვის მფლობელობაში იყო, საგზაო ნიშანი არ იყო ხილული ან გამართული, დაფიქსირების ტექნიკამ შეცდომა დაუშვა, ან დარღვევის ფაქტი საერთოდ არ დამდგარა.",
          "მხოლოდ თანხის სიდიდე ან უკმაყოფილება დარღვევის მიმართ საკმარისი საფუძველი არაა — საჩივარს სჭირდება კონკრეტული არგუმენტი და, სასურველია, მტკიცებულება.",
        ],
        paragraphsEn: [
          "An appeal makes sense when there is a concrete ground — for example, the car was in someone else's possession at the time, a road sign was missing or not visible, the recording equipment made an error, or the violation simply didn't occur.",
          "The size of the fine or general dissatisfaction with the violation isn't enough on its own — an appeal needs a specific argument and, ideally, evidence.",
        ],
      },
      {
        title: "რა დოკუმენტები დაგჭირდება",
        titleEn: "What documents you'll need",
        paragraphs: ["საჩივრის მომზადებისას, როგორც წესი, სჭირდება:"],
        paragraphsEn: ["Preparing an appeal usually requires:"],
        list: [
          "თავად ჯარიმის ქვითარი ან შეტყობინება (ნომერი, თარიღი, ორგანო, რომელმაც გამოსცა);",
          "პირადობის დამადასტურებელი დოკუმენტი და, საჭიროების შემთხვევაში, მართვის მოწმობა;",
          "ნებისმიერი მტკიცებულება საკუთარი პოზიციის დასადასტურებლად — ფოტო, ვიდეო, მოწმის ჩვენება, სატრანსპორტო საშუალების ჩანაწერები;",
          "თუ ავტომობილს სხვა პირი მართავდა — შესაბამისი განმარტება ან დამადასტურებელი დოკუმენტი.",
        ],
        listEn: [
          "The fine notice/receipt itself (number, date, the issuing authority);",
          "An identity document and, where relevant, a driving license;",
          "Any evidence supporting your position — photos, video, witness statements, vehicle records;",
          "If someone else was driving — a supporting explanation or document.",
        ],
      },
      {
        title: "ვადები",
        titleEn: "Deadlines",
        paragraphs: [
          "საქართველოს ადმინისტრაციულ სამართალდარღვევათა კოდექსის მე-273 მუხლის მიხედვით, ადმინისტრაციული სამართალდარღვევის საქმეზე მიღებული დადგენილება (მათ შორის, ჯარიმა) საერთო წესით საჩივრდება მისი ჩაბარებიდან 10 დღის ვადაში. ცალკეული სამართალდარღვევის სახეობებისთვის (მაგალითად, ტექნიკური საშუალებით დაფიქსირებული დარღვევები) შესაძლოა მოქმედებდეს განსხვავებული, გახანგრძლივებული ვადა — ამიტომ კონკრეტულ შემთხვევაში ვადის ზუსტად დათვლა თავად დადგენილებაში მითითებული ინფორმაციის მიხედვით ან იურისტთან კონსულტაციით ღირს.",
          "ვადის გაშვების შემთხვევაში საჩივრის განხილვაზე უარი შეიძლება ეთქვას, თუმცა საპატიო მიზეზის არსებობისას შესაძლებელია ვადის აღდგენის მოთხოვნა საჩივრის განმხილველი ორგანოს წინაშე.",
        ],
        paragraphsEn: [
          "Under Article 273 of the Code of Administrative Offences of Georgia, a decision on an administrative violation (including a fine) is, as a general rule, appealable within 10 days of its delivery. Certain categories of violations (for example, ones recorded by automated camera equipment) may carry a different, longer deadline — so it's worth confirming the exact deadline from the decision notice itself or with a lawyer for your specific case.",
          "Missing the deadline can mean the appeal is refused review, though if there was a justified reason for the delay, you can request that the deadline be reinstated by the body handling the appeal.",
        ],
      },
      {
        title: "სად და როგორ შეიტანება საჩივარი",
        titleEn: "Where and how to file the appeal",
        paragraphs: [
          "საჩივარი, ჩვეულებრივ, შეიტანება ჯარიმის გამომცემი ორგანოს ან შესაბამისი სააგენტოს მისამართით, ხოლო უარის შემთხვევაში — შესაძლებელია სასამართლო წესით გასაჩივრება. საჩივარში მკაფიოდ უნდა იყოს ჩამოყალიბებული მოთხოვნა და მისი საფუძველი, თანდართული მტკიცებულებებით.",
        ],
        paragraphsEn: [
          "The appeal is usually filed with the authority that issued the fine or the relevant agency; if refused, it can then be appealed in court. The appeal should clearly state the request and its grounds, with supporting evidence attached.",
        ],
      },
    ],
    sources: [
      {
        label: "საქართველოს ადმინისტრაციულ სამართალდარღვევათა კოდექსი — მუხლი 273 (გასაჩივრების ვადა)",
        labelEn: "Code of Administrative Offences of Georgia — Article 273 (appeal deadline)",
        url: "https://matsne.gov.ge/ka/document/view/28216",
      },
    ],
    order: 0,
    status: "published",
  },
  {
    _id: "guide-2",
    slug: "binis-qiravnobis-khelshekruleba",
    title: "ბინის ქირავნობის ხელშეკრულება — რა უნდა იწეროდეს",
    titleEn: "Apartment Rental Agreement — What It Should Include",
    description:
      "რა პირობები აუცილებლად უნდა შედიოდეს ბინის ქირავნობის ხელშეკრულებაში — მეიჯარისა და მოიჯარის უფლება-მოვალეობები, დეპოზიტი, ვადა და ხშირი შეცდომები.",
    descriptionEn:
      "What terms an apartment rental agreement in Georgia must include — landlord and tenant rights and duties, deposit, term, and common mistakes.",
    keywords: ["ბინის ქირავნობის ხელშეკრულება", "ბინის გაქირავება", "ქირავნობის ხელშეკრულება", "ხელშეკრულების შედგენა"],
    keywordsEn: ["apartment rental contract", "renting in Georgia", "lease agreement Georgia", "contract drafting"],
    intro:
      "ბინის ქირავნობის ხელშეკრულება არეგულირებს ურთიერთობას მეიჯარესა (ბინის მესაკუთრე) და მოიჯარეს (მდგირავი) შორის. ზეპირი შეთანხმება იურიდიულად ბევრად უფრო რთულია დასამტკიცებელი, ამიტომ წერილობითი ხელშეკრულება იცავს ორივე მხარეს.",
    introEn:
      "An apartment rental agreement governs the relationship between the landlord (the property owner) and the tenant. An oral agreement is much harder to prove legally, so a written contract protects both sides.",
    sections: [
      {
        title: "სავალდებულო პუნქტები",
        titleEn: "Mandatory clauses",
        paragraphs: ["ხელშეკრულებაში მკაფიოდ უნდა იყოს განსაზღვრული:"],
        paragraphsEn: ["The contract should clearly specify:"],
        list: [
          "მხარეები — მეიჯარისა და მოიჯარის სრული მონაცემები;",
          "ქონების ზუსტი მისამართი და მდგომარეობა (სასურველია ინვენტარიზაციის ან ფოტოების დართვით);",
          "ქირის ოდენობა, გადახდის ვადა და ხერხი;",
          "ხელშეკრულების ვადა და გაგრძელების/შეწყვეტის პირობები;",
          "დეპოზიტის ოდენობა და მისი დაბრუნების პირობები;",
          "მხარეთა პასუხისმგებლობა ქონების დაზიანების შემთხვევაში;",
          "კომუნალური გადასახადების გადამხდელი მხარე.",
        ],
        listEn: [
          "The parties — full details of both landlord and tenant;",
          "The property's exact address and condition (ideally with an inventory or photos attached);",
          "The rent amount, payment deadline, and payment method;",
          "The contract's term and the conditions for renewal/termination;",
          "The deposit amount and the conditions for returning it;",
          "Each party's liability if the property is damaged;",
          "Which party pays utility bills.",
        ],
      },
      {
        title: "დეპოზიტი",
        titleEn: "Deposit",
        paragraphs: [
          "დეპოზიტი, ჩვეულებრივ, უზრუნველყოფს ზიანის ან დავალიანების დაფარვას ხელშეკრულების დასრულებისას. ხელშეკრულებაში მკაფიოდ უნდა ეწეროს, რა პირობებში რჩება დეპოზიტი მთლიანად მოიჯარეს, ხოლო როდის შეიძლება მისი დაკავება — ეს ყველაზე ხშირი დავის საგანია ორივე მხარეს შორის.",
        ],
        paragraphsEn: [
          "A deposit normally secures against damage or unpaid debt at the end of the contract. The contract should clearly state when the deposit is returned in full to the tenant, and when it may be withheld — this is the most common source of disputes between the two sides.",
        ],
      },
      {
        title: "ვადამდე შეწყვეტა",
        titleEn: "Early termination",
        paragraphs: [
          "ხელშეკრულებამ უნდა გაითვალისწინოს, რა შემთხვევაში შეუძლია რომელიმე მხარეს ვადამდე შეწყვეტა (მაგ. წინასწარი შეტყობინებით) და რა შედეგები მოჰყვება ამას — მათ შორის, აქვს თუ არა მეორე მხარეს კომპენსაციის მოთხოვნის უფლება.",
        ],
        paragraphsEn: [
          "The contract should address when either party may terminate early (e.g. with advance notice) and what follows from that — including whether the other party is entitled to claim compensation.",
        ],
      },
      {
        title: "ხშირი შეცდომა",
        titleEn: "A common mistake",
        paragraphs: [
          "ყველაზე ხშირი პრობლემა — ბუნდოვანი ან ზეპირი შეთანხმებები დეპოზიტსა და კომუნალურ გადასახადებზე. კონკრეტული, წერილობითი პირობები მნიშვნელოვნად ამცირებს დავის რისკს მომავალში.",
        ],
        paragraphsEn: [
          "The most common problem is vague or purely oral agreements about the deposit and utility bills. Specific, written terms significantly reduce the risk of a dispute later.",
        ],
      },
    ],
    sources: [
      {
        label: "საქართველოს სამოქალაქო კოდექსი — მუხლი 531 (ქირავნობის ხელშეკრულების ცნება)",
        labelEn: "Civil Code of Georgia — Article 531 (definition of a lease contract)",
        url: "https://matsne.gov.ge/ka/document/view/31702",
      },
    ],
    order: 1,
    status: "published",
  },
  {
    _id: "guide-3",
    slug: "shromiti-khelshekrulebis-pirobebi",
    title: "შრომითი ხელშეკრულების პირობები — რა უფლებები გაქვთ დასაქმებულს",
    titleEn: "Employment Contract Terms — Your Rights as an Employee",
    description:
      "შრომითი ხელშეკრულების სავალდებულო პირობები, გამოსაცდელი ვადა და დასაქმებულის ძირითადი უფლებები საქართველოში.",
    descriptionEn:
      "Mandatory employment contract terms, the probation period, and an employee's core rights under Georgian labor law.",
    keywords: ["შრომითი ხელშეკრულება", "შრომითი ხელშეკრულების პირობები", "დასაქმებულის უფლებები", "სამუშაო ხელშეკრულება"],
    keywordsEn: ["employment contract", "employment contract terms", "employee rights Georgia", "labor contract"],
    intro:
      "შრომითი ხელშეკრულება განსაზღვრავს დამსაქმებელსა და დასაქმებულს შორის ურთიერთობის ძირითად პირობებს. მისი გულდასმით წაკითხვა ხელმოწერამდე იცავს დასაქმებულს არაერთი შემდგომი გაუგებრობისგან.",
    introEn:
      "An employment contract sets out the core terms of the relationship between employer and employee. Reading it carefully before signing protects an employee from a number of misunderstandings later.",
    sections: [
      {
        title: "რა უნდა ეწეროს ხელშეკრულებაში",
        titleEn: "What the contract should include",
        paragraphs: ["საქართველოს შრომის კოდექსის მე-14 მუხლის მიხედვით, შრომითი ხელშეკრულების არსებით პირობებში, ჩვეულებრივ, შედის:"],
        paragraphsEn: ["Under Article 14 of the Labor Code of Georgia, the essential terms of an employment contract normally include:"],
        list: [
          "თანამდებობას და სამუშაოს აღწერას;",
          "ხელფასის ოდენობას, გადახდის პერიოდულობასა და ხერხს;",
          "სამუშაო დროის ხანგრძლივობასა და გრაფიკს;",
          "შვებულების პირობებს;",
          "ხელშეკრულების ვადას — განსაზღვრული თუ განუსაზღვრელი;",
          "შეწყვეტის პირობებსა და შეტყობინების ვადას.",
        ],
        listEn: [
          "The position and a description of the work;",
          "The salary amount, payment frequency, and method;",
          "Working hours and schedule;",
          "Leave entitlements;",
          "The contract's term — fixed or indefinite;",
          "Termination conditions and the notice period.",
        ],
      },
      {
        title: "გამოსაცდელი ვადა",
        titleEn: "Probation period",
        paragraphs: [
          "საქართველოს შრომის კოდექსის მე-17 მუხლის მიხედვით, შესასრულებელ სამუშაოსთან პირის შესაბამისობის დასადგენად მხარეთა შეთანხმებით შესაძლებელია დაწესდეს გამოსაცდელი ვადა არაუმეტეს 6 თვისა, და კონკრეტულ დასაქმებულთან ეს შესაძლებელია მხოლოდ ერთხელ. გამოსაცდელი ვადის ხანგრძლივობა და პირობები აუცილებლად უნდა იყოს მითითებული თავად ხელშეკრულებაში — არა მხოლოდ ზეპირად შეთანხმებული.",
        ],
        paragraphsEn: [
          "Under Article 17 of the Labor Code of Georgia, to establish whether a person is suited to the work, the parties may agree on a probation period of no more than 6 months, and it can be set only once with a given employee. The probation period's length and terms must be stated in the contract itself — not merely agreed orally.",
        ],
      },
      {
        title: "ძირითადი უფლებები",
        titleEn: "Core rights",
        paragraphs: [
          "დასაქმებულს, ზოგადად, აქვს უფლება იცოდეს ხელშეკრულების ყველა პირობა წერილობით, მიიღოს შეთანხმებული ანაზღაურება დათქმულ ვადაში, ისარგებლოს კანონით გათვალისწინებული შვებულებით და დაცული იყოს დისკრიმინაციული ან უსაფუძვლო გათავისუფლებისგან — ეს გარანტიები მოცემულია შრომის კოდექსის 47-ე და 48-ე მუხლებში.",
        ],
        paragraphsEn: [
          "An employee generally has the right to know all contract terms in writing, to receive the agreed pay on time, to take the leave provided by law, and to be protected from discriminatory or unjustified dismissal — these guarantees are set out in Articles 47 and 48 of the Labor Code.",
        ],
      },
      {
        title: "რას მიაქციოთ ყურადღება ხელმოწერამდე",
        titleEn: "What to check before signing",
        paragraphs: [
          "თუ რომელიმე პირობა ბუნდოვანია ან ზეპირად „დაპირებულია“ წერილობითი ხელშეკრულების გარეშე — ეს სწორედ ის წერტილია, სადაც ღირს დაზუსტება ხელმოწერამდე, არა შემდეგ.",
        ],
        paragraphsEn: [
          "If any term is vague, or was only \"promised\" verbally without being written into the contract — that's exactly the point where it's worth clarifying before signing, not after.",
        ],
      },
    ],
    sources: [
      {
        label: "საქართველოს ორგანული კანონი — შრომის კოდექსი, მუხლები 14, 17, 47-48",
        labelEn: "Organic Law of Georgia — Labor Code, Articles 14, 17, 47-48",
        url: "https://matsne.gov.ge/ka/document/view/1155567",
      },
    ],
    order: 2,
    status: "published",
  },
  {
    _id: "guide-4",
    slug: "gankortsineba-saqartveloshi",
    title: "განქორწინება საქართველოში — პროცედურის ზოგადი მიმოხილვა",
    titleEn: "Divorce in Georgia — General Overview of the Procedure",
    description:
      "როგორ მიმდინარეობს განქორწინების პროცესი საქართველოში — შეთანხმებული და სადავო განქორწინება, საჭირო დოკუმენტები და ქონების საკითხი.",
    descriptionEn:
      "How the divorce process works in Georgia — uncontested and contested divorce, required documents, and the property question.",
    keywords: ["განქორწინება საქართველოში", "განქორწინების პროცედურა", "განქორწინება", "ქონების გაყოფა"],
    keywordsEn: ["divorce in Georgia", "divorce procedure Georgia", "divorce", "property division divorce"],
    intro:
      "განქორწინების პროცედურა საქართველოში განსხვავდება იმის მიხედვით, თანხმდებიან თუ არა მეუღლეები განქორწინებასა და მასთან დაკავშირებულ საკითხებზე (შვილების მეურვეობა, ქონება, ალიმენტი).",
    introEn:
      "The divorce procedure in Georgia differs depending on whether the spouses agree on the divorce and the related issues (child custody, property, child support).",
    sections: [
      {
        title: "შეთანხმებული განქორწინება",
        titleEn: "Uncontested divorce",
        paragraphs: [
          "თუ ორივე მეუღლე თანახმაა განქორწინებაზე და არ ჰყავთ არასრულწლოვანი შვილი (ან მასთან დაკავშირებით უკვე შეთანხმებულნი არიან), პროცედურა, ჩვეულებრივ, გამარტივებულია და შესაძლებელია საჯარო რეესტრში/სამოქალაქო აქტების სააგენტოში მიმართვით, სასამართლოს ჩართვის გარეშე.",
        ],
        paragraphsEn: [
          "If both spouses agree to the divorce and have no minor children (or have already agreed on matters concerning them), the procedure is usually simplified and can be handled through the Civil Registry Agency (House of Justice), without involving a court.",
        ],
      },
      {
        title: "სადავო განქორწინება",
        titleEn: "Contested divorce",
        paragraphs: [
          "თუ მხარეები არ თანხმდებიან განქორწინებაზე ან თანმხლებ საკითხებზე (შვილების საცხოვრებელი ადგილი, ალიმენტი, ქონების გაყოფა), საკითხს წყვეტს სასამართლო. ამ შემთხვევაში პროცესი, ჩვეულებრივ, უფრო ხანგრძლივია და მოითხოვს მტკიცებულებების წარდგენას.",
        ],
        paragraphsEn: [
          "If the parties don't agree on the divorce itself or on related matters (where the children will live, child support, property division), the matter is decided by a court. In this case the process is usually longer and requires presenting evidence.",
        ],
      },
      {
        title: "ქონების გაყოფა",
        titleEn: "Property division",
        paragraphs: [
          "ქორწინების პერიოდში შეძენილი ქონება, ზოგადად, ითვლება ერთობლივ საკუთრებად, გარდა კონკრეტული გამონაკლისებისა (მაგ. მემკვიდრეობით ან ჩუქებით მიღებული ქონება). გაყოფის კონკრეტული წილები დამოკიდებულია საქმის გარემოებებზე.",
        ],
        paragraphsEn: [
          "Property acquired during the marriage is generally treated as joint property, with specific exceptions (e.g. property received by inheritance or gift). The exact division shares depend on the circumstances of the case.",
        ],
      },
      {
        title: "შვილების საკითხი",
        titleEn: "Children",
        paragraphs: [
          "როცა არასრულწლოვანი შვილები არიან ჩართული, სასამართლო ინდივიდუალურად აფასებს, რომელ მშობელთან უნდა დარჩეს ბავშვი საცხოვრებლად და როგორ განისაზღვროს მეორე მშობლის ურთიერთობის უფლება და ალიმენტის ვალდებულება — ბავშვის ინტერესებიდან გამომდინარე.",
        ],
        paragraphsEn: [
          "Where minor children are involved, the court individually assesses which parent the child should live with, and how to set the other parent's contact rights and child-support obligation — based on the child's best interests.",
        ],
      },
    ],
    sources: [
      {
        label: "საქართველოს სამოქალაქო კოდექსი (საოჯახო სამართლის წიგნი)",
        labelEn: "Civil Code of Georgia (Family Law book)",
        url: "https://matsne.gov.ge/ka/document/view/31702",
      },
      {
        label: "განქორწინება საქართველოში — პროცედურის მიმოხილვა (Legal.ge)",
        labelEn: "Divorce in Georgia — procedure overview (Legal.ge)",
        url: "https://legal.ge/ka/news/ganqorwineba-saqartveloshi-procedura-vadebi-advokati-ka",
      },
    ],
    order: 3,
    status: "published",
  },
  {
    _id: "guide-5",
    slug: "memkvidreobis-migheba",
    title: "მემკვიდრეობის მიღება — რა ნაბიჯებია საჭირო",
    titleEn: "Accepting an Inheritance — What Steps Are Needed",
    description:
      "მემკვიდრეობის მიღების ზოგადი პროცედურა საქართველოში — ვადა, საჭირო დოკუმენტები და კანონისმიერი მემკვიდრეობის რიგითობა.",
    descriptionEn:
      "The general procedure for accepting an inheritance in Georgia — the deadline, required documents, and the order of intestate succession.",
    keywords: ["მემკვიდრეობის მიღება", "მემკვიდრეობა საქართველოში", "მემკვიდრეობის რიგითობა", "ანდერძი"],
    keywordsEn: ["accepting inheritance Georgia", "inheritance in Georgia", "order of succession", "will Georgia"],
    intro:
      "მემკვიდრეობის მიღება შესაძლებელია ანდერძის საფუძველზე ან კანონისმიერი წესით, თუ ანდერძი არ არსებობს. პროცედურას აქვს კონკრეტული ვადა და ფორმალური მოთხოვნები.",
    introEn:
      "An inheritance can be accepted on the basis of a will, or by law if no will exists. The procedure has a specific deadline and formal requirements.",
    sections: [
      {
        title: "ანდერძით და კანონისმიერი მემკვიდრეობა",
        titleEn: "Testate and intestate succession",
        paragraphs: [
          "თუ გარდაცვლილს დარჩა მოქმედი ანდერძი, ქონება ნაწილდება მასში მითითებული პირობების მიხედვით. ანდერძის არარსებობის შემთხვევაში მემკვიდრეობა ნაწილდება კანონით დადგენილი რიგითობით — უახლოეს ნათესავებზე პირველ რიგში.",
        ],
        paragraphsEn: [
          "If the deceased left a valid will, the property is distributed according to its terms. If there is no will, the estate is distributed in the order set by law — closest relatives first.",
        ],
      },
      {
        title: "მიღების ვადა",
        titleEn: "Acceptance deadline",
        paragraphs: [
          "მემკვიდრეობის მისაღებად კანონმდებლობა ადგენს კონკრეტულ ვადას გარდაცვალების მომენტიდან. ამ ვადის გაშვება შეიძლება გართულდეს — ზოგ შემთხვევაში შესაძლებელია მისი აღდგენა სასამართლოში, საპატიო მიზეზის არსებობისას, მაგრამ ეს არ არის გარანტირებული, ამიტომ ვადის დროული დაცვა მნიშვნელოვანია.",
        ],
        paragraphsEn: [
          "The law sets a specific deadline for accepting an inheritance, running from the date of death — commonly cited as 6 months. Missing it complicates matters: in some cases a court can reinstate the deadline where there was a justified reason, but this isn't guaranteed, so meeting the deadline on time matters.",
        ],
      },
      {
        title: "საჭირო დოკუმენტები",
        titleEn: "Required documents",
        paragraphs: ["ნოტარიუსთან ან შესაბამის ორგანოში მიმართვისას, ჩვეულებრივ, სჭირდება:"],
        paragraphsEn: ["Applying to a notary or the relevant body usually requires:"],
        list: [
          "გარდაცვალების მოწმობა;",
          "მემკვიდრის ვინაობის დამადასტურებელი დოკუმენტი და ნათესაური კავშირის დამადასტურებელი საბუთები;",
          "ანდერძის არსებობის შემთხვევაში — თავად ანდერძი;",
          "ქონების საკუთრების დამადასტურებელი დოკუმენტები.",
        ],
        listEn: [
          "The death certificate;",
          "The heir's identity document and documents proving the family relationship;",
          "If a will exists — the will itself;",
          "Documents proving ownership of the property.",
        ],
      },
      {
        title: "როცა რამდენიმე მემკვიდრეა",
        titleEn: "When there are several heirs",
        paragraphs: [
          "თუ მემკვიდრეები ვერ თანხმდებიან ქონების გაყოფაზე, საკითხი წყდება სასამართლოში. წინასწარი წერილობითი შეთანხმება მემკვიდრეთა შორის მნიშვნელოვნად ამცირებს დავის ალბათობას.",
        ],
        paragraphsEn: [
          "If the heirs cannot agree on dividing the property, the matter is resolved in court. A prior written agreement among the heirs significantly reduces the likelihood of a dispute.",
        ],
      },
    ],
    sources: [
      {
        label: "საქართველოს სამოქალაქო კოდექსი (მემკვიდრეობის სამართლის წიგნი)",
        labelEn: "Civil Code of Georgia (Succession Law book)",
        url: "https://matsne.gov.ge/ka/document/view/31702",
      },
      {
        label: "საქართველოს იურიდიული დახმარების სამსახური — მემკვიდრეობითი სამართალი",
        labelEn: "Legal Aid Service of Georgia — succession law",
        url: "https://www.legalaid.ge/ka/p/69/მემკვიდრეობითი-სამართალი",
      },
    ],
    order: 4,
    status: "published",
  },
  {
    _id: "guide-6",
    slug: "khelshekrulebis-batiloba",
    title: "ხელშეკრულების ბათილობა — როდის შეიძლება ხელშეკრულების გაბათილება",
    titleEn: "Void and Voidable Contracts — When a Contract Can Be Invalidated",
    description:
      "რა შემთხვევებში შეიძლება ჩაითვალოს ხელშეკრულება ბათილად ან საჩივრდებოდეს გაბათილება — ძირითადი საფუძვლები მარტივ ენაზე.",
    descriptionEn:
      "When a contract can be considered void, or its invalidation contested — the main grounds explained simply.",
    keywords: ["ხელშეკრულების ბათილობა", "ხელშეკრულების გაბათილება", "ხელშეკრულების ანალიზი", "ბათილი გარიგება"],
    keywordsEn: ["void contract", "voidable contract Georgia", "contract analysis", "void transaction"],
    intro:
      "ყველა ხელშეკრულება არ არის ავტომატურად სავალდებულო ძალის მქონე — გარკვეულ პირობებში ხელშეკრულება შეიძლება იურიდიულად ბათილად ან სადავოდ ჩაითვალოს.",
    introEn:
      "Not every contract is automatically binding — under certain conditions a contract can be legally void, or contestable.",
    sections: [
      {
        title: "აბსოლუტურად ბათილი ხელშეკრულება",
        titleEn: "An absolutely void contract",
        paragraphs: [
          "საქართველოს სამოქალაქო კოდექსის 54-ე მუხლის მიხედვით, გარიგება ბათილია, თუ ის არღვევს კანონით დადგენილ წესს და მის აკრძალვებს, ან ეწინააღმდეგება საზოგადოებრივ წესრიგსა თუ ზნეობის ნორმებს. ასევე ბათილია გარიგება, დადებული ქმედუუნარო პირთან, ან რომლის შესრულებაც ფაქტობრივად შეუძლებელია. ასეთი ხელშეკრულება არ წარმოშობს სამართლებრივ შედეგებს დამატებითი მოქმედების გარეშეც.",
        ],
        paragraphsEn: [
          "Under Article 54 of the Civil Code of Georgia, a transaction is void if it violates a rule established by law and its prohibitions, or contradicts public order or norms of morality. A transaction is also void if it was concluded with a person lacking legal capacity, or if performing it is factually impossible. Such a contract produces no legal effect even without any further action being taken.",
        ],
      },
      {
        title: "სადავო (შეიძლება გაბათილდეს) ხელშეკრულება",
        titleEn: "A contestable (voidable) contract",
        paragraphs: [
          "ზოგიერთი ხელშეკრულება ძალაშია, სანამ დაინტერესებული მხარე მას სასამართლოში არ გაასაჩივრებს — მაგალითად, თუ ხელშეკრულება დაიდო შეცდომის, მოტყუების, ზეწოლის ან საფრთხის ქვეშ. ასეთ შემთხვევაში გაბათილება ავტომატურად არ ხდება — საჭიროა შესაბამისი მოთხოვნის დაყენება.",
        ],
        paragraphsEn: [
          "Some contracts remain valid until the interested party challenges them in court — for example, if the contract was concluded under a mistake, fraud, duress, or threat. In such cases invalidation doesn't happen automatically — a corresponding claim needs to be filed.",
        ],
      },
      {
        title: "გაბათილების შედეგები",
        titleEn: "Consequences of invalidation",
        paragraphs: [
          "ხელშეკრულების ბათილად ცნობის შემდეგ მხარეები, ზოგადად, ვალდებულნი არიან დაუბრუნონ ერთმანეთს მიღებული სარგებელი — ანუ დაუბრუნდნენ ხელშეკრულებამდელ მდგომარეობას, თუ ეს ფაქტობრივად შესაძლებელია.",
        ],
        paragraphsEn: [
          "Once a contract is declared void, the parties are generally obliged to return to each other whatever benefit they received — that is, to return to the position before the contract, where this is factually possible.",
        ],
      },
      {
        title: "რას გააკეთოთ, თუ ეჭვი გეპარებათ",
        titleEn: "What to do if you have doubts",
        paragraphs: [
          "თუ ეჭვობთ, რომ უკვე ხელმოწერილი ან ხელმოსაწერი ხელშეკრულება შეიძლება იყოს ბათილი ან თქვენთვის არახელსაყრელი, კონკრეტული პუნქტების გაანალიზება მხოლოდ დოკუმენტის სრული ტექსტის ნახვის შემდეგ არის შესაძლებელი.",
        ],
        paragraphsEn: [
          "If you suspect that a contract you've already signed, or are about to sign, might be void or unfavorable to you, analyzing the specific clauses is only possible after reviewing the document's full text.",
        ],
      },
    ],
    sources: [
      {
        label: "საქართველოს სამოქალაქო კოდექსი — მუხლი 54 (ბათილი გარიგებანი)",
        labelEn: "Civil Code of Georgia — Article 54 (void transactions)",
        url: "https://matsne.gov.ge/ka/document/view/31702",
      },
    ],
    order: 5,
    status: "published",
  },
  {
    _id: "guide-7",
    slug: "biznesis-registracia-saqartveloshi",
    title: "ბიზნესის რეგისტრაცია საქართველოში — რა ნაბიჯებია საჭირო",
    titleEn: "Registering a Business in Georgia — What Steps Are Needed",
    description:
      "როგორ დარეგისტრირდეთ ინდივიდუალურ მეწარმედ ან შპს-დ საქართველოში — სად ხდება რეგისტრაცია, რა დოკუმენტებია საჭირო, რა ღირს და რა ხდება რეგისტრაციის შემდეგ საგადასახადო თვალსაზრისით.",
    descriptionEn:
      "How to register as an individual entrepreneur or LLC in Georgia — where registration happens, what documents are needed, what it costs, and what follows on the tax side after registration.",
    keywords: [
      "ბიზნესის რეგისტრაცია საქართველოში",
      "შპს-ს რეგისტრაცია",
      "ინდივიდუალური მეწარმის რეგისტრაცია",
      "საჯარო რეესტრი",
    ],
    keywordsEn: [
      "business registration Georgia",
      "register LLC Georgia",
      "individual entrepreneur registration",
      "public registry Georgia",
    ],
    intro:
      "ბიზნესის დაწყება საქართველოში სამართლებრივად იწყება სუბიექტის რეგისტრაციით მეწარმეთა და არასამეწარმეო (არაკომერციულ) იურიდიულ პირთა რეესტრში. პროცედურა შედარებით მარტივი და სწრაფია, თუმცა რამდენიმე არჩევანი — ორგანიზაციულ-სამართლებრივი ფორმა, რეგისტრაციის სისწრაფე და საგადასახადო სტატუსი — გავლენას ახდენს შემდგომ ვალდებულებებზე.",
    introEn:
      "Starting a business in Georgia legally begins with registering the entity in the register of entrepreneurs and non-commercial (non-profit) legal entities. The procedure is relatively simple and fast, though a few choices — legal form, registration speed, and tax status — affect the obligations that follow.",
    sections: [
      {
        title: "რომელი ორგანიზაციულ-სამართლებრივი ფორმა აირჩიოთ",
        titleEn: "Which legal form to choose",
        paragraphs: [
          "ყველაზე ხშირად გამოყენებული ორი ფორმაა ინდივიდუალური მეწარმე და შეზღუდული პასუხისმგებლობის საზოგადოება (შპს). ინდივიდუალური მეწარმე შეეფერება ერთპიროვნულ, მარტივი სტრუქტურის საქმიანობას — რეგისტრაცია და ადმინისტრირება უფრო მარტივია, მაგრამ პირი პასუხს აგებს ბიზნესის ვალდებულებებზე მთელი პირადი ქონებით.",
          "შპს, თავის მხრივ, გამოსადეგია რამდენიმე პარტნიორის ან უფრო დიდი მოცულობის საქმიანობისთვის — პარტნიორთა პასუხისმგებლობა შემოფარგლულია საზოგადოების კაპიტალით, თუმცა რეგისტრაცია და მართვა შედარებით მეტ ფორმალობას მოითხოვს (წესდება, პარტნიორთა შეთანხმება).",
        ],
        paragraphsEn: [
          "The two most commonly used forms are the individual entrepreneur and the limited liability company (LLC). An individual entrepreneur suits a one-person, simple-structure activity — registration and administration are simpler, but the person is liable for the business's obligations with their entire personal property.",
          "An LLC, in turn, suits several partners or a larger-scale activity — partners' liability is limited to the company's capital, though registration and management require relatively more formality (a charter, a partners' agreement).",
        ],
      },
      {
        title: "სად და როგორ ხდება რეგისტრაცია",
        titleEn: "Where and how registration happens",
        paragraphs: [
          "„მეწარმეთა შესახებ“ საქართველოს კანონის მე-4 მუხლის მიხედვით, მეწარმე სუბიექტის რეგისტრაციას ახორციელებს საჯარო რეესტრის ეროვნული სააგენტო (იუსტიციის სამინისტროს სისტემაში შემავალი სსიპ) — განცხადების შეტანა შესაძლებელია იუსტიციის სახლის ნებისმიერ ფილიალში ან ონლაინ.",
          "შპს-ს რეგისტრაციისას კანონის მე-5 მუხლის შესაბამისად საჭიროა ყველა პარტნიორის მიერ ხელმოწერილი სარეგისტრაციო განცხადება, რომელშიც მითითებულია საზოგადოების სახელწოდება და ორგანიზაციულ-სამართლებრივი ფორმა, იურიდიული მისამართი, პარტნიორთა მონაცემები და წილები (ჯამში 100%), მმართველობის სტრუქტურა და წარმომადგენლის მონაცემები. ინდივიდუალური მეწარმის რეგისტრაციისას კი, 54-ე მუხლის მიხედვით, საკმარისია განცხადება, პირადობის დამადასტურებელი დოკუმენტი და საქმიანობის მისამართის მითითება.",
          "ორივე შემთხვევაში სავალდებულოა კანონით განსაზღვრული იურიდიული მისამართის მითითება (მე-4 მუხლის მე-4 ნაწილი) — მასზე გაგზავნილი კორესპონდენცია ითვლება ჩაბარებულად, ამიტომ რეალურად ხელმისაწვდომი მისამართის მითითება მნიშვნელოვანია.",
        ],
        paragraphsEn: [
          "Under Article 4 of the Law of Georgia on Entrepreneurs, registration of an entrepreneurial subject is carried out by the National Agency of the Public Registry (a public legal entity under the Ministry of Justice) — the application can be filed at any House of Justice branch or online.",
          "For an LLC, Article 5 requires a registration statement signed by all partners, stating the company's name and legal form, its legal address, the partners' details and shares (totaling 100%), the management structure, and the representative's details. For an individual entrepreneur, Article 54 requires only an application, an identity document, and the address of the activity.",
          "In both cases, a legally defined address must be stated (Article 4(4)) — correspondence sent there is deemed delivered, so it matters that the address is one you actually have access to.",
        ],
      },
      {
        title: "ვადები და საფასური",
        titleEn: "Timeframes and fees",
        paragraphs: [
          "რეგისტრაცია, საჯარო რეესტრის ეროვნული სააგენტოს მიერ დადგენილი განაკვეთების მიხედვით, სტანდარტული წესით სრულდება 1 სამუშაო დღეში — შპს-სთვის საფასურია 200 ლარი, ინდივიდუალური მეწარმისთვის — 26 ლარი. დაჩქარებული (იმავე დღეს) რეგისტრაცია ღირს შესაბამისად 400 და 75 ლარი.",
          "ცვლილებების რეგისტრაცია (მაგალითად, დირექტორის ან წილის მონაცემების განახლება) იმავე განაკვეთებით ხორციელდება. საფასურის კონკრეტული ოდენობა და ვადები დროდადრო იცვლება, ამიტომ გადახდამდე ღირს გადამოწმება საჯარო რეესტრის ეროვნული სააგენტოს ოფიციალურ გვერდზე.",
        ],
        paragraphsEn: [
          "According to the fee schedule set by the National Agency of the Public Registry, standard registration is completed within 1 business day — the fee is 200 GEL for an LLC and 26 GEL for an individual entrepreneur. Expedited (same-day) registration costs 400 GEL and 75 GEL respectively.",
          "Registering changes (for example, updating director or shareholding data) follows the same fee structure. Exact fee amounts and timeframes change from time to time, so it's worth checking the National Agency of the Public Registry's official page before paying.",
        ],
      },
      {
        title: "საგადასახადო რეგისტრაცია რეგისტრაციის შემდეგ",
        titleEn: "Tax registration after incorporation",
        paragraphs: [
          "საჯარო რეესტრში რეგისტრაციის შემდეგ მონაცემები ავტომატურად გადაეცემა შემოსავლების სამსახურს (RS.GE), ცალკე განცხადება ამისთვის საჭირო არაა. დამატებითი, ცალკე მიმართვა სჭირდება მხოლოდ სპეციალური სტატუსების მოსაპოვებლად.",
          "ფიზიკური პირისთვის ხშირად აქტუალურია „მცირე ბიზნესის სტატუსი“ — საშემოსავლო გადასახადის 1%-იანი განაკვეთი წლიური 500 000 ლარამდე ბრუნვაზე (საგადასახადო კოდექსის 82-ე და 90-ე მუხლები); სტატუსის მისაღებად საჭიროა ცალკე ელექტრონული განცხადება RS.GE-ზე.",
          "დღგ-ის გადამხდელად რეგისტრაცია სავალდებულოა, თუ დღგ-ით დასაბეგრი ოპერაციების საერთო თანხა ნებისმიერ უწყვეტ 12 კალენდარულ თვეში აღემატება 100 000 ლარს — ამ შემთხვევაში საგადასახადო კოდექსის 157-ე მუხლის პირველი ნაწილის „ა“ ქვეპუნქტის მიხედვით, პირი ვალდებულია მიმართოს საგადასახადო ორგანოს ზღვრის გადაჭარბებიდან არაუგვიანეს 2 სამუშაო დღისა.",
        ],
        paragraphsEn: [
          "After registration with the Public Registry, the data is automatically forwarded to the Revenue Service (RS.GE) — no separate application is needed for that. A separate application is required only to obtain special statuses.",
          "For a physical person, \"small business status\" is often relevant — a 1% income tax rate on annual turnover up to 500,000 GEL (Tax Code, Articles 82 and 90); obtaining the status requires a separate electronic application on RS.GE.",
          "Registering as a VAT payer is mandatory if the total amount of VAT-taxable operations exceeds 100,000 GEL in any rolling 12 calendar months — in that case, under Article 157(1)(a) of the Tax Code, the person must apply to the tax authority no later than 2 business days after exceeding the threshold.",
        ],
      },
      {
        title: "რა ხდება რეგისტრაციის შემდეგ",
        titleEn: "What happens after registration",
        paragraphs: [
          "რეგისტრირებულ სუბიექტს შეუძლია გახსნას საბანკო ანგარიში ნებისმიერ ქართულ ბანკში — ეს, ჩვეულებრივ, საჭირო ხდება კონტრაქტების, ინვოისების და საგადასახადო ანგარიშსწორებისთვის.",
          "მეწარმეთა და არასამეწარმეო (არაკომერციულ) იურიდიულ პირთა რეესტრი საჯაროა — ნებისმიერს შეუძლია გადაამოწმოს კომპანიის სტატუსი, დირექტორის ვინაობა და მფლობელობის სტრუქტურა. ეს გამჭვირვალობა მნიშვნელოვანია პარტნიორებთან და კონტრაგენტებთან ურთიერთობისას.",
        ],
        paragraphsEn: [
          "A registered entity can open a bank account at any Georgian bank — this is normally needed for contracts, invoices, and tax settlements.",
          "The register of entrepreneurs and non-commercial legal entities is public — anyone can verify a company's status, the identity of its director, and its ownership structure. This transparency matters when dealing with partners and counterparties.",
        ],
      },
    ],
    sources: [
      {
        label: "საქართველოს კანონი „მეწარმეთა შესახებ“ — მუხლები 4, 5, 54 (რეგისტრაციის ორგანო, მისამართი, საჭირო დოკუმენტები)",
        labelEn: "Law of Georgia on Entrepreneurs — Articles 4, 5, 54 (registration authority, address, required documents)",
        url: "https://matsne.gov.ge/ka/document/view/28408",
      },
      {
        label: "საქართველოს საგადასახადო კოდექსი — მუხლები 82, 90 (მცირე ბიზნესის სტატუსი), 157 (დღგ-ის სავალდებულო რეგისტრაცია)",
        labelEn: "Tax Code of Georgia — Articles 82, 90 (small business status), 157 (mandatory VAT registration)",
        url: "https://matsne.gov.ge/ka/document/view/1043717",
      },
      {
        label: "საჯარო რეესტრის ეროვნული სააგენტო — მომსახურების საფასურები და ვადები",
        labelEn: "National Agency of Public Registry — service fees and timeframes",
        url: "https://napr.gov.ge/ka/page/fees-and-terms",
      },
    ],
    order: 6,
    status: "published",
  },
]
