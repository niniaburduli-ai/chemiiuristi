/**
 * Static document templates — pure string interpolation, zero AI calls.
 * Legal-basis citations are hardcoded per template (verified against the live
 * text at matsne.gov.ge on 2026-07-08; the 6 templates added 2026-07-23 were
 * cross-checked against matsne.gov.ge and the TSU Civil Code Commentary
 * (gccc.tsu.ge) — see the design spec for sourcing).
 * Structure (preamble, force-majeure/dispute clauses, requisites block) is
 * modeled on real Georgian market contracts, not just statute text — see spec.
 */

export const TEMPLATE_TYPES = [
  "rental-agreement",
  "employment-contract",
  "power-of-attorney",
  "termination-notice",
  "service-agreement",
  "claim-letter",
  "debt-claim",
  "child-travel-consent",
  "invoice",
  "acceptance-act",
] as const;

export type TemplateType = (typeof TEMPLATE_TYPES)[number];

type TemplateDef = { body: string; legalBasis: string };

const RENTAL_BODY = `ბინის ქირავნობის ხელშეკრულება

ქ. **[CITY]**                                                                    **[DOC_DATE]**

ერთის მხრივ, **[LANDLORD]** (პ/ნ **[LANDLORD_ID]**, მისამართი: [LANDLORD_ADDRESS], ტელ: [LANDLORD_PHONE]) (შემდგომში — „გამქირავებელი“) და მეორეს მხრივ, **[TENANT]** (პ/ნ **[TENANT_ID]**, მისამართი: [TENANT_ADDRESS], ტელ: [TENANT_PHONE]) (შემდგომში — „დამქირავებელი“, ერთობლივად — „მხარეები“), ვდებთ წინამდებარე ხელშეკრულებას შემდეგზე:

**1. ხელშეკრულების საგანი**
გამქირავებელი გადასცემს დამქირავებელს სარგებლობაში საცხოვრებელ ფართს მისამართზე: **[PROPERTY_ADDRESS]** (შემდგომში — „ფართი“), ხოლო დამქირავებელი იღებს ვალდებულებას გადაუხადოს ქირა წინამდებარე ხელშეკრულებით დადგენილი წესით.

**2. ხელშეკრულების ვადა**
ხელშეკრულება ძალაშია **[DURATION]**-ის განმავლობაში, **[DOC_DATE]**-დან.

**3. ქირა და გადახდის წესი**
3.1. ყოველთვიური ქირა შეადგენს **[RENT]**-ს.
3.2. გადახდის მეთოდი: **[PAYMENT_METHOD]**. საბანკო ანგარიში: **[BANK_ACCOUNT]**.
3.3. ქირა გადაიხდება ყოველი საანგარიშო პერიოდის დასრულებისას, თუ მხარეები სხვაგვარად არ შეთანხმდებიან.
3.4. დამქირავებელს შეიძლება დაეკისროს ვალდებულების უზრუნველყოფის თანხის (დეპოზიტის) წარდგენა, რომელიც არ აღემატება ერთი თვის ქირის სამმაგ ოდენობას; წინასწარ გადახდილ თანხას ერიცხება კანონით დადგენილი პროცენტი და უბრუნდება დამქირავებელს ხელშეკრულების დასრულებისას.

**4. მხარეთა უფლება-მოვალეობები**
4.1. გამქირავებელი გადასცემს ფართს გამართულ, დანიშნულებისამებრ გამოსაყენებელ მდგომარეობაში.
4.2. დამქირავებელი იყენებს ფართს დანიშნულებისამებრ და ზრუნავს მის შენარჩუნებაზე.
4.3. ხელშეკრულების შეწყვეტისას დამქირავებელი აბრუნებს ფართს იმ მდგომარეობაში, რომელშიც მიიღო, ნორმალური ცვეთის გათვალისწინებით.

**5. ხელშეკრულების ვადამდე შეწყვეტა**
5.1. თუ დამქირავებელი არ იხდის ქირას ზედიზედ სამი თვის განმავლობაში, გამქირავებელს უფლება აქვს მოშალოს ხელშეკრულება ვადამდე.
5.2. განუსაზღვრელი ვადის შემთხვევაში, ნებისმიერ მხარეს შეუძლია მოშალოს ხელშეკრულება წერილობითი შეტყობინებით, სამთვიანი ვადის დაცვით, თუ მხარეები სხვა ვადაზე არ შეთანხმდნენ.
5.3. ხელშეკრულების შეწყვეტა ფორმდება წერილობით.

**6. ფორს-მაჟორი**
მხარეები თავისუფლდებიან პასუხისმგებლობისგან, თუ ვალდებულების შეუსრულებლობა გამოწვეულია დაუძლეველი ძალის გარემოებით (სტიქიური უბედურება, ომი, ეპიდემია და სხვა), რომლის თავიდან აცილება მხარეთა გონივრულ კონტროლს აღემატება.

**7. დავების გადაწყვეტა**
ხელშეკრულებასთან დაკავშირებული დავები წყდება მოლაპარაკების გზით, ხოლო შეთანხმების მიუღწევლობისას — საქართველოს კანონმდებლობით დადგენილი წესით, სასამართლოში.

**8. დასკვნითი დებულებები**
ხელშეკრულება შედგენილია 2 ეგზემპლარად, თითოეული მხარისთვის თანაბარი იურიდიული ძალით.

**მხარეთა რეკვიზიტები**
გამქირავებელი: **[LANDLORD]**, პ/ნ [LANDLORD_ID], მის: [LANDLORD_ADDRESS], ტელ: [LANDLORD_PHONE]     ხელმოწერა: ____________
დამქირავებელი: **[TENANT]**, პ/ნ [TENANT_ID], მის: [TENANT_ADDRESS], ტელ: [TENANT_PHONE]     ხელმოწერა: ____________`;

const EMPLOYMENT_BODY = `შრომის ხელშეკრულება

ქ. **[CITY]**                                                                    **[DOC_DATE]**

ერთის მხრივ, **[EMPLOYER]** (ს/ნ **[EMPLOYER_ID]**, მისამართი: [EMPLOYER_ADDRESS]) (შემდგომში — „დამსაქმებელი“) და მეორეს მხრივ, **[EMPLOYEE]** (პ/ნ **[EMPLOYEE_ID]**, მისამართი: [EMPLOYEE_ADDRESS]) (შემდგომში — „დასაქმებული“, ერთობლივად — „მხარეები“), ვდებთ წინამდებარე ხელშეკრულებას შემდეგზე:

**1. ხელშეკრულების საგანი**
დამსაქმებელი დასაქმებულს იღებს **[POSITION]**-ის პოზიციაზე **[START_DATE]**-დან, ხოლო დასაქმებული თანხმობას აცხადებს შეასრულოს დაკისრებული სამუშაო წინამდებარე ხელშეკრულებით დადგენილი პირობების შესაბამისად.

**2. ხელშეკრულების ვადა**
ხელშეკრულება დადებულია განუსაზღვრელი ვადით, თუ მხარეები წერილობით სხვაგვარად არ შეთანხმდებიან.

**3. სამუშაო დრო და დასვენება**
სამუშაო დრო და დასვენების პერიოდები განისაზღვრება საქართველოს შრომის კოდექსისა და დამსაქმებლის შინაგანაწესის შესაბამისად (არსებობის შემთხვევაში).

**4. ანაზღაურება**
4.1. თანამდებობრივი სარგო შეადგენს **[SALARY]**-ს თვეში.
4.2. გადახდის მეთოდი: **[SALARY_PAYMENT_METHOD]**. საბანკო ანგარიში: **[BANK_ACCOUNT]**.
4.3. ზეგანაკვეთური სამუშაო ანაზღაურდება კანონმდებლობის შესაბამისად.

**5. მხარეთა უფლება-მოვალეობები**
5.1. დამსაქმებელი ვალდებულია დროულად გადაუხადოს დასაქმებულს ხელფასი და უზრუნველყოს უსაფრთხო სამუშაო გარემო.
5.2. დასაქმებული ვალდებულია ჯეროვნად და კეთილსინდისიერად შეასრულოს დაკისრებული მოვალეობები.
5.3. დასაქმებულს ეძლევა კანონმდებლობით გათვალისწინებული ანაზღაურებადი და ანაზღაურების გარეშე შვებულება.

**6. ხელშეკრულების შეწყვეტა**
ხელშეკრულების შეწყვეტა ხდება საქართველოს შრომის კოდექსის 47-ე და 48-ე მუხლებით დადგენილი საფუძვლებითა და წესით, წინასწარი წერილობითი შეტყობინებით. საბოლოო ანგარიშსწორება ხდება შეწყვეტიდან არაუგვიანეს 7 კალენდარული დღისა.

**7. დავების გადაწყვეტა**
შრომითი დავები წყდება მხარეთა მოლაპარაკებით, ხოლო შეთანხმების მიუღწევლობისას — სასამართლოში, საქართველოს კანონმდებლობით დადგენილი წესით.

**8. დასკვნითი დებულებები**
ხელშეკრულება შედგენილია 2 ეგზემპლარად, თანაბარი იურიდიული ძალით.

**მხარეთა რეკვიზიტები**
დამსაქმებელი: **[EMPLOYER]**, ს/ნ [EMPLOYER_ID], მის: [EMPLOYER_ADDRESS]     ხელმოწერა: ____________
დასაქმებული: **[EMPLOYEE]**, პ/ნ [EMPLOYEE_ID], მის: [EMPLOYEE_ADDRESS]     ხელმოწერა: ____________`;

const POWER_OF_ATTORNEY_BODY = `მინდობილობა

ქ. **[CITY]**                                                                    **[DOC_DATE]**

მე, **[PRINCIPAL]** (პ/ნ **[PRINCIPAL_ID]**, რეგისტრირებული მისამართზე: [PRINCIPAL_ADDRESS]) (შემდგომში — „მინდობელი“), ვანიჭებ **[AGENT]**-ს (პ/ნ **[AGENT_ID]**, რეგისტრირებული მისამართზე: [AGENT_ADDRESS]) (შემდგომში — „მინდობილი პირი“) წარმომადგენლობით უფლებამოსილებას შემდეგი მოქმედებების განსახორციელებლად:

**მინდობის ფარგლები:**
[SCOPE]

მინდობილი პირი ვალდებულია იმოქმედოს მინდობელის ინტერესების შესაბამისად, ამ მინდობილობის ფარგლების გადაცილების გარეშე.

**უფლებამოსილების შეწყვეტა:** უფლებამოსილება წყდება მისი ვადის გასვლით (თუ ვადა განისაზღვრა), მინდობილი პირის უარით, მინდობელის მიერ გაუქმებით, მინდობელის გარდაცვალებით ან დავალების შესრულებით. თუ ვადა არ არის მითითებული, მინდობილობა მოქმედებს გაუქმებამდე. უფლებამოსილების გაუქმებისას მინდობილი პირი ვალდებულია დაუბრუნოს მინდობელს მინდობილობის საბუთი.

**შენიშვნა:** კანონმდებლობით განსაზღვრულ შემთხვევებში (მაგ. უძრავი ქონების განკარგვა, სასამართლო წარმომადგენლობა) მინდობილობა საჭიროებს სანოტარო დამოწმებას.

მინდობელი: **[PRINCIPAL]**     ხელმოწერა: ____________`;

const TERMINATION_NOTICE_BODY = `შეტყობინება შრომითი ხელშეკრულების შეწყვეტის შესახებ

ქ. **[CITY]**                                                                    **[DOC_DATE]**

დამსაქმებელი: **[EMPLOYER]**
დასაქმებული: **[EMPLOYEE]**, პ/ნ **[EMPLOYEE_ID]**, მისამართი: [EMPLOYEE_ADDRESS]

წინამდებარე შეტყობინებით გაცნობებთ, რომ თქვენთან დადებული შრომითი ხელშეკრულება წყდება საქართველოს შრომის კოდექსის 47-ე მუხლის შესაბამისად, შემდეგი საფუძვლით:

**შეწყვეტის საფუძველი:** [REASON]

**შრომითი ურთიერთობის ბოლო დღე:** **[LAST_DAY]**

შეტყობინება გამოგზავნილია საქართველოს შრომის კოდექსის 48-ე მუხლით დადგენილი წინასწარი გაფრთხილების ვადის დაცვით. კანონით გათვალისწინებულ შემთხვევებში დასაქმებულს ეკუთვნის შესაბამისი კომპენსაცია.

საბოლოო ანგარიშსწორება განხორციელდება შრომითი ურთიერთობის შეწყვეტიდან არაუგვიანეს 7 კალენდარული დღისა (შრომის კოდექსის 44-ე მუხლი).

დასაქმებულს უფლება აქვს, კანონმდებლობით დადგენილი წესით მოითხოვოს შეწყვეტის საფუძვლის წერილობითი დასაბუთება და გაასაჩივროს გადაწყვეტილება სასამართლოში.

დამსაქმებელი: **[EMPLOYER]**     ხელმოწერა: ____________`;

const SERVICE_AGREEMENT_BODY = `მომსახურების გაწევის ხელშეკრულება

ქ. **[CITY]**                                                                    **[DOC_DATE]**

ერთის მხრივ, **[EXECUTOR]** (პ/ნ **[EXECUTOR_ID]**, მისამართი: [EXECUTOR_ADDRESS], ტელ: [EXECUTOR_PHONE]) (შემდგომში — „შემსრულებელი“) და მეორეს მხრივ, **[CLIENT]** (პ/ნ **[CLIENT_ID]**, მისამართი: [CLIENT_ADDRESS], ტელ: [CLIENT_PHONE]) (შემდგომში — „დამკვეთი“, ერთობლივად — „მხარეები“), ვდებთ წინამდებარე ხელშეკრულებას შემდეგზე:

**1. ხელშეკრულების საგანი**
შემსრულებელი იღებს ვალდებულებას, დამკვეთის დავალებით გაუწიოს შემდეგი მომსახურება: **[SERVICE_DESCRIPTION]**, ხოლო დამკვეთი იღებს ვალდებულებას მიღებული მომსახურება გადაუხადოს წინამდებარე ხელშეკრულებით დადგენილი წესით.

**2. მომსახურების ვადა**
მომსახურება უნდა გაეწიოს შემდეგ ვადაში: **[DEADLINE]**.

**3. საფასური და ანგარიშსწორება**
3.1. მომსახურების საფასური შეადგენს **[PRICE]**-ს.
3.2. გადახდის მეთოდი: **[PAYMENT_METHOD]**. საბანკო ანგარიში: **[BANK_ACCOUNT]**.
3.3. მხარეთა შეთანხმებით შესაძლებელია ავანსის ან ეტაპობრივი ანგარიშსწორების გამოყენება.

**4. მხარეთა უფლება-მოვალეობები**
4.1. შემსრულებელი ვალდებულია მომსახურება გასწიოს ჯეროვნად, კეთილსინდისიერად და შეთანხმებული ხარისხის დაცვით.
4.2. დამკვეთი ვალდებულია შემსრულებელს დროულად მიაწოდოს მომსახურების გასაწევად საჭირო ინფორმაცია და ხელი არ შეუშალოს მის შესრულებაში.
4.3. თუ მომსახურების შედეგი გულისხმობს კონკრეტული სამუშაოს/პროდუქტის გადაცემას, მხარეები ხელს აწერენ მიღება-ჩაბარების აქტს.

**5. პასუხისმგებლობა**
მხარე, რომელიც არღვევს ხელშეკრულებით ნაკისრ ვალდებულებას, ვალდებულია აანაზღაუროს მეორე მხარისთვის ამით მიყენებული ზიანი საქართველოს კანონმდებლობით დადგენილი წესით.

**6. ხელშეკრულების შეწყვეტა**
ნებისმიერ მხარეს შეუძლია ხელშეკრულების შეწყვეტა მოითხოვოს მეორე მხარისთვის გონივრული ვადით ადრე გაგზავნილი წერილობითი შეტყობინებით, უკვე გაწეული მომსახურების ანაზღაურების პირობით.

**7. ფორს-მაჟორი**
მხარეები თავისუფლდებიან პასუხისმგებლობისგან, თუ ვალდებულების შეუსრულებლობა გამოწვეულია დაუძლეველი ძალის გარემოებით, რომლის თავიდან აცილება მხარეთა გონივრულ კონტროლს აღემატება.

**8. დავების გადაწყვეტა**
ხელშეკრულებასთან დაკავშირებული დავები წყდება მოლაპარაკების გზით, ხოლო შეთანხმების მიუღწევლობისას — სასამართლოში, საქართველოს კანონმდებლობით დადგენილი წესით.

**9. დასკვნითი დებულებები**
ხელშეკრულება შედგენილია 2 ეგზემპლარად, თითოეული მხარისთვის თანაბარი იურიდიული ძალით.

**მხარეთა რეკვიზიტები**
შემსრულებელი: **[EXECUTOR]**, პ/ნ [EXECUTOR_ID], მის: [EXECUTOR_ADDRESS], ტელ: [EXECUTOR_PHONE]     ხელმოწერა: ____________
დამკვეთი: **[CLIENT]**, პ/ნ [CLIENT_ID], მის: [CLIENT_ADDRESS], ტელ: [CLIENT_PHONE]     ხელმოწერა: ____________`;

const CLAIM_LETTER_BODY = `წერილი-პრეტენზია

ქ. **[CITY]**                                                                    **[DOC_DATE]**

ადრესატი: **[RECIPIENT_NAME]**, მისამართი: [RECIPIENT_ADDRESS]
გამომგზავნი: **[SENDER_NAME]**, პ/ნ [SENDER_ID], მისამართი: [SENDER_ADDRESS], ტელ: [SENDER_PHONE]

**1. ფაქტობრივი გარემოებები**
[GROUNDS]

**2. მოთხოვნა**
ზემოაღნიშნულიდან გამომდინარე, გთხოვთ: **[DEMAND]**.
მოთხოვნილი თანხა (ასეთის არსებობისას): **[AMOUNT]**. გადახდის მეთოდი: [PAYMENT_METHOD]. საბანკო ანგარიში: [BANK_ACCOUNT].

**3. შესრულების ვადა**
გთხოვთ, აღნიშნული მოთხოვნა დააკმაყოფილოთ არაუგვიანეს: **[DEADLINE]**.

**4. შედეგები დაუკმაყოფილებლობის შემთხვევაში**
თუ მითითებულ ვადაში მოთხოვნა არ დაკმაყოფილდება, ვიტოვებ უფლებას, მივმართო სასამართლოს საქართველოს კანონმდებლობით დადგენილი წესით, მათ შორის მოვითხოვო მიყენებული ზიანის, საურავისა და სასამართლო ხარჯების ანაზღაურება.

გამომგზავნი: **[SENDER_NAME]**     ხელმოწერა: ____________`;

const DEBT_CLAIM_BODY = `მოთხოვნა (პრეტენზია) დავალიანების დაფარვის შესახებ

ქ. **[CITY]**                                                                    **[DOC_DATE]**

კრედიტორი: **[CREDITOR_NAME]**, პ/ნ [CREDITOR_ID], მისამართი: [CREDITOR_ADDRESS], ტელ: [CREDITOR_PHONE]
მოვალე: **[DEBTOR_NAME]**, მისამართი: [DEBTOR_ADDRESS]

**1. დავალიანების საფუძველი**
[DEBT_BASIS]

**2. დავალიანების ოდენობა**
ძირითადი თანხა: **[PRINCIPAL_AMOUNT]**
დარიცხული პროცენტი/საურავი: **[INTEREST_AMOUNT]**
სულ გადასახდელი: **[TOTAL_AMOUNT]**
დაბრუნების თავდაპირველი ვადა: **[ORIGINAL_DUE_DATE]**

**3. მოთხოვნა**
გთხოვთ, დაფაროთ ზემოაღნიშნული დავალიანება სრულად, არაუგვიანეს: **[NEW_DEADLINE]**.
გადახდის მეთოდი: **[PAYMENT_METHOD]**. საბანკო ანგარიში: **[BANK_ACCOUNT]**.

**4. შედეგები დაუკმაყოფილებლობის შემთხვევაში**
თუ მითითებულ ვადაში დავალიანება არ დაიფარება, კრედიტორი უფლებამოსილია მიმართოს სასამართლოს დავალიანების, დარიცხული პროცენტისა და პირგასამტეხლოს (ასეთის არსებობისას), აგრეთვე სასამართლო ხარჯების გადახდევინების მოთხოვნით, მათ შორის — გამარტივებული (ბრძანების გამოცემის) წარმოების წესით, საქართველოს სამოქალაქო საპროცესო კოდექსით დადგენილი წესით.

კრედიტორი: **[CREDITOR_NAME]**     ხელმოწერა: ____________`;

const CHILD_TRAVEL_CONSENT_BODY = `თანხმობა არასრულწლოვნის საზღვარგარეთ გაყვანაზე

ქ. **[CITY]**                                                                    **[DOC_DATE]**

მე, **[PARENT_NAME]** (პ/ნ **[PARENT_ID]**, მისამართი: [PARENT_ADDRESS], ტელ: [PARENT_PHONE]), არასრულწლოვნის მშობელი/კანონიერი წარმომადგენელი, ვაცხადებ ჩემს თანხმობას, რომ ჩემმა არასრულწლოვანმა შვილმა — **[CHILD_NAME]** (დაბადების თარიღი: **[CHILD_DOB]**, პირადობის/პასპორტის № **[CHILD_DOCUMENT]**) — გავიდეს საქართველოს ფარგლებს გარეთ.

**დანიშნულების ქვეყანა/ქვეყნები:** [DESTINATION]
**მოგზაურობის პერიოდი:** [TRAVEL_PERIOD]
**თანმხლები პირი:** [ESCORT]

წინამდებარე თანხმობა გაცემულია „საქართველოს მოქალაქეების საქართველოდან გასვლისა და საქართველოში შემოსვლის წესების შესახებ“ საქართველოს კანონის მე-8 მუხლის შესაბამისად, რომლის თანახმად, 18 წლამდე ასაკის პირის საზღვარგარეთ გასვლისას საჭიროა კანონიერი წარმომადგენლის თანხმობა, ხოლო მეორე მშობლის თანხმობის არარსებობის შემთხვევაში საკმარისია ერთი კანონიერი წარმომადგენლის ნოტარიულად დამოწმებული თანხმობა, რომელშიც მითითებული უნდა იყოს დანიშნულების ქვეყანა და მოგზაურობის პერიოდი.

**შენიშვნა:** საზღვრის კვეთისას ეს დოკუმენტი, როგორც წესი, საჭიროებს ნოტარიულ დამოწმებას; საზღვარგარეთ გამოსაყენებლად შესაძლოა დამატებით საჭირო გახდეს აპოსტილი ან თარგმანი მიმღები ქვეყნის მოთხოვნების შესაბამისად.

მშობელი/კანონიერი წარმომადგენელი: **[PARENT_NAME]**     ხელმოწერა: ____________`;

const INVOICE_BODY = `ინვოისი № **[INVOICE_NUMBER]**

ქ. **[CITY]**                                                                    **[DOC_DATE]**

**გამომწერი:** [SELLER], პ/ნ [SELLER_ID], მისამართი: [SELLER_ADDRESS]
**მიმღები (გადამხდელი):** [BUYER], მისამართი: [BUYER_ADDRESS]

**საქონლის/მომსახურების ჩამონათვალი:**
[ITEMS]

**სულ გადასახდელი თანხა:** **[TOTAL_AMOUNT]**
**გადახდის ვადა:** **[DUE_DATE]**
**გადახდის მეთოდი:** [PAYMENT_METHOD]. **საბანკო ანგარიში:** [BANK_ACCOUNT]

წინამდებარე დოკუმენტი წარმოადგენს გადახდის მოთხოვნას ზემოაღნიშნული საქონლის/მომსახურების მისაწოდებლად ან უკვე მიწოდებულის საფასურის დასაფარად და არ ჩაითვლება საგადასახადო კანონმდებლობით გათვალისწინებულ ანგარიშ-ფაქტურად RS.ge-ს მონაცემთა ერთიან ცხრილში რეგისტრაციის გაგებით.

გამომწერი: **[SELLER]**     ხელმოწერა/ბეჭედი: ____________`;

const ACCEPTANCE_ACT_BODY = `მიღება-ჩაბარების აქტი № **[ACT_NUMBER]**

ქ. **[CITY]**                                                                    **[DOC_DATE]**

**მიმცემი მხარე:** [PROVIDER], პ/ნ [PROVIDER_ID], მისამართი: [PROVIDER_ADDRESS]
**მიმღები მხარე:** [RECEIVER], პ/ნ [RECEIVER_ID], მისამართი: [RECEIVER_ADDRESS]

**საბაზისო ხელშეკრულება:** [CONTRACT_REF]

წინამდებარე აქტი ადასტურებს, რომ მიმცემმა მხარემ ჩააბარა, ხოლო მიმღებმა მხარემ მიიღო შემდეგი საქონელი/სამუშაო/მომსახურება:

[SUBJECT_DESCRIPTION]

**ღირებულება:** [AMOUNT]

**მხარეთა შენიშვნები/პრეტენზიები:** [OBJECTIONS]

მხარეები ადასტურებენ, რომ ზემოაღნიშნული საქონელი/სამუშაო/მომსახურება გადაცემულია (შესრულებულია) შეთანხმებული მოცულობით და ხარისხით. აქტზე ხელმოწერის მომენტიდან შესაბამისი ვალდებულება ითვლება შესრულებულად იმ ნაწილში, რომელშიც არ არის დაფიქსირებული პრეტენზია.

მიმცემი: **[PROVIDER]**     ხელმოწერა: ____________
მიმღები: **[RECEIVER]**     ხელმოწერა: ____________`;

const TEMPLATES: Record<TemplateType, TemplateDef> = {
  "rental-agreement": {
    body: RENTAL_BODY,
    legalBasis:
      "საქართველოს სამოქალაქო კოდექსი:\n- მუხლი 531\n- მუხლი 552\n- მუხლი 553\n- მუხლი 558\n- მუხლი 559\n- მუხლი 561\n- მუხლი 563\n- მუხლი 564",
  },
  "employment-contract": {
    body: EMPLOYMENT_BODY,
    legalBasis:
      "საქართველოს ორგანული კანონი „საქართველოს შრომის კოდექსი“:\n- მუხლი 14\n- მუხლი 44\n- მუხლი 47\n- მუხლი 48",
  },
  "power-of-attorney": {
    body: POWER_OF_ATTORNEY_BODY,
    legalBasis:
      "საქართველოს სამოქალაქო კოდექსი:\n- მუხლი 107\n- მუხლი 108\n- მუხლი 109\n- მუხლი 110",
  },
  "termination-notice": {
    body: TERMINATION_NOTICE_BODY,
    legalBasis:
      "საქართველოს ორგანული კანონი „საქართველოს შრომის კოდექსი“:\n- მუხლი 44\n- მუხლი 47\n- მუხლი 48",
  },
  "service-agreement": {
    body: SERVICE_AGREEMENT_BODY,
    legalBasis:
      "საქართველოს სამოქალაქო კოდექსი:\n- მუხლი 361 (ვალდებულების ჯეროვანი შესრულება)\n- მუხლი 394 (ზიანის ანაზღაურება ვალდებულების დარღვევისთვის)\n- მუხლი 629 და შემდგომი მუხლები (ნარდობის/მომსახურების ხელშეკრულების ზოგადი წესები)",
  },
  "claim-letter": {
    body: CLAIM_LETTER_BODY,
    legalBasis:
      "საქართველოს სამოქალაქო კოდექსი:\n- მუხლი 361 (ვალდებულების ჯეროვანი შესრულება)\n- მუხლი 394 (ზიანის ანაზღაურება ვალდებულების დარღვევისთვის)",
  },
  "debt-claim": {
    body: DEBT_CLAIM_BODY,
    legalBasis:
      "საქართველოს სამოქალაქო კოდექსი:\n- მუხლი 623-628 (სესხის ხელშეკრულება)\n- მუხლი 394 (ზიანის ანაზღაურება ვალდებულების დარღვევისთვის)\nსაქართველოს სამოქალაქო საპროცესო კოდექსი — ბრძანების გამოცემის (გამარტივებული) წარმოება ფულადი მოთხოვნისთვის.",
  },
  "child-travel-consent": {
    body: CHILD_TRAVEL_CONSENT_BODY,
    legalBasis:
      "საქართველოს კანონი „საქართველოს მოქალაქეების საქართველოდან გასვლისა და საქართველოში შემოსვლის წესების შესახებ“:\n- მუხლი 8",
  },
  invoice: {
    body: INVOICE_BODY,
    legalBasis:
      "საქართველოს სამოქალაქო კოდექსი:\n- მუხლი 361 (ვალდებულების ჯეროვანი შესრულება)\n- მუხლი 477 (ნასყიდობის ფასის გადახდის ვალდებულება, ანალოგიით — მომსახურების საფასურზეც)\n\nშენიშვნა: ეს არის კომერციული ინვოისი (გადახდის მოთხოვნა), არა საგადასახადო კანონმდებლობით რეგულირებული ანგარიშ-ფაქტურა.",
  },
  "acceptance-act": {
    body: ACCEPTANCE_ACT_BODY,
    legalBasis:
      "საქართველოს სამოქალაქო კოდექსი:\n- მუხლი 629 (ნარდობის/მომსახურების ხელშეკრულება)\n- მუხლი 646 (შესრულებულის მიღება-ჩაბარება)",
  },
};

/**
 * Maps each template's form-field keys (from QUESTION_SCHEMAS /
 * COMMON_FIELDS in document-fields.ts) to the [PLACEHOLDER] tokens used in
 * that template's body text.
 */
const FIELD_MAP: Record<TemplateType, Record<string, string>> = {
  "rental-agreement": {
    landlord: "LANDLORD", landlordId: "LANDLORD_ID", landlordAddress: "LANDLORD_ADDRESS", landlordPhone: "LANDLORD_PHONE",
    tenant: "TENANT", tenantId: "TENANT_ID", tenantAddress: "TENANT_ADDRESS", tenantPhone: "TENANT_PHONE",
    address: "PROPERTY_ADDRESS", rent: "RENT", paymentMethod: "PAYMENT_METHOD", bankAccount: "BANK_ACCOUNT", duration: "DURATION",
    city: "CITY", docDate: "DOC_DATE",
  },
  "employment-contract": {
    employer: "EMPLOYER", employerId: "EMPLOYER_ID", employerAddress: "EMPLOYER_ADDRESS",
    employee: "EMPLOYEE", employeeId: "EMPLOYEE_ID", employeeAddress: "EMPLOYEE_ADDRESS",
    position: "POSITION", salary: "SALARY", salaryPaymentMethod: "SALARY_PAYMENT_METHOD", bankAccount: "BANK_ACCOUNT", startDate: "START_DATE",
    city: "CITY", docDate: "DOC_DATE",
  },
  "power-of-attorney": {
    principal: "PRINCIPAL", idNumber: "PRINCIPAL_ID", principalAddress: "PRINCIPAL_ADDRESS",
    agent: "AGENT", agentId: "AGENT_ID", agentAddress: "AGENT_ADDRESS", scope: "SCOPE",
    city: "CITY", docDate: "DOC_DATE",
  },
  "termination-notice": {
    employer: "EMPLOYER", employee: "EMPLOYEE", employeeId: "EMPLOYEE_ID", employeeAddress: "EMPLOYEE_ADDRESS",
    reason: "REASON", lastDay: "LAST_DAY",
    city: "CITY", docDate: "DOC_DATE",
  },
  "service-agreement": {
    executor: "EXECUTOR", executorId: "EXECUTOR_ID", executorAddress: "EXECUTOR_ADDRESS", executorPhone: "EXECUTOR_PHONE",
    client: "CLIENT", clientId: "CLIENT_ID", clientAddress: "CLIENT_ADDRESS", clientPhone: "CLIENT_PHONE",
    serviceDescription: "SERVICE_DESCRIPTION", deadline: "DEADLINE", price: "PRICE",
    paymentMethod: "PAYMENT_METHOD", bankAccount: "BANK_ACCOUNT",
    city: "CITY", docDate: "DOC_DATE",
  },
  "claim-letter": {
    senderName: "SENDER_NAME", senderId: "SENDER_ID", senderAddress: "SENDER_ADDRESS", senderPhone: "SENDER_PHONE",
    recipientName: "RECIPIENT_NAME", recipientAddress: "RECIPIENT_ADDRESS",
    grounds: "GROUNDS", demand: "DEMAND", amount: "AMOUNT",
    paymentMethod: "PAYMENT_METHOD", bankAccount: "BANK_ACCOUNT", deadline: "DEADLINE",
    city: "CITY", docDate: "DOC_DATE",
  },
  "debt-claim": {
    creditorName: "CREDITOR_NAME", creditorId: "CREDITOR_ID", creditorAddress: "CREDITOR_ADDRESS", creditorPhone: "CREDITOR_PHONE",
    debtorName: "DEBTOR_NAME", debtorAddress: "DEBTOR_ADDRESS",
    debtBasis: "DEBT_BASIS", principalAmount: "PRINCIPAL_AMOUNT", interestAmount: "INTEREST_AMOUNT",
    totalAmount: "TOTAL_AMOUNT", originalDueDate: "ORIGINAL_DUE_DATE", newDeadline: "NEW_DEADLINE",
    paymentMethod: "PAYMENT_METHOD", bankAccount: "BANK_ACCOUNT",
    city: "CITY", docDate: "DOC_DATE",
  },
  "child-travel-consent": {
    parentName: "PARENT_NAME", parentId: "PARENT_ID", parentAddress: "PARENT_ADDRESS", parentPhone: "PARENT_PHONE",
    childName: "CHILD_NAME", childDob: "CHILD_DOB", childDocument: "CHILD_DOCUMENT",
    escort: "ESCORT", destination: "DESTINATION", travelPeriod: "TRAVEL_PERIOD",
    city: "CITY", docDate: "DOC_DATE",
  },
  invoice: {
    invoiceNumber: "INVOICE_NUMBER", seller: "SELLER", sellerId: "SELLER_ID", sellerAddress: "SELLER_ADDRESS",
    buyer: "BUYER", buyerAddress: "BUYER_ADDRESS", items: "ITEMS", totalAmount: "TOTAL_AMOUNT",
    dueDate: "DUE_DATE", paymentMethod: "PAYMENT_METHOD", bankAccount: "BANK_ACCOUNT",
    city: "CITY", docDate: "DOC_DATE",
  },
  "acceptance-act": {
    actNumber: "ACT_NUMBER", provider: "PROVIDER", providerId: "PROVIDER_ID", providerAddress: "PROVIDER_ADDRESS",
    receiver: "RECEIVER", receiverId: "RECEIVER_ID", receiverAddress: "RECEIVER_ADDRESS",
    contractRef: "CONTRACT_REF", subjectDescription: "SUBJECT_DESCRIPTION", amount: "AMOUNT", objections: "OBJECTIONS",
    city: "CITY", docDate: "DOC_DATE",
  },
};

/**
 * Turns the invoice's freeform "one item per line" textarea input into a
 * tab-separated table block (header + rows), which `DocumentResultPanel` and
 * `export-document.ts` render as real table columns instead of running text.
 * Expected line format: "description; quantity; unit price" — quantity ×
 * unit price is auto-computed into a line total when both parse as numbers.
 */
function buildInvoiceItemsTable(raw: string): string {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return "—";

  const header = ["დასახელება", "რაოდენობა", "ერთ. ფასი", "ჯამი"].join("\t");
  const rows = lines.map((line) => {
    const [desc = "", qtyRaw = "", priceRaw = ""] = line.split(";").map((p) => p.trim());
    const qty = parseFloat(qtyRaw.replace(",", "."));
    const price = parseFloat(priceRaw.replace(",", "."));
    const total = Number.isFinite(qty) && Number.isFinite(price) ? (qty * price).toFixed(2) : "";
    return [desc, qtyRaw, priceRaw, total].join("\t");
  });
  return [header, ...rows].join("\n");
}

/** Replace every `[PLACEHOLDER]` token in `body` using `values` (keyed by placeholder name, not form key). Missing/blank values render as `—`. */
function fillTemplate(body: string, values: Record<string, string>): string {
  return body.replace(/\[([A-Z_]+)\]/g, (_match, key: string) => {
    const v = values[key]?.trim();
    return v ? v : "—";
  });
}

/**
 * Render a static template: map form answers (keyed by QUESTION_SCHEMAS
 * field key, e.g. "landlordPhone") to placeholder tokens, then interpolate.
 * Never calls any AI model.
 */
export function renderTemplate(
  type: TemplateType,
  answers: Record<string, string>
): { content: string; legalBasis: string } {
  const map = FIELD_MAP[type];
  const values: Record<string, string> = {};
  for (const [formKey, placeholder] of Object.entries(map)) {
    const raw = answers[formKey] ?? "";
    values[placeholder] = type === "invoice" && formKey === "items" ? buildInvoiceItemsTable(raw) : raw;
  }
  const def = TEMPLATES[type];
  return { content: fillTemplate(def.body, values), legalBasis: def.legalBasis };
}
