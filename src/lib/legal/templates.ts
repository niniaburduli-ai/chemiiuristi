/**
 * Static document templates — pure string interpolation, zero AI calls.
 * Legal-basis citations are hardcoded per template (verified against the live
 * text at matsne.gov.ge on 2026-07-08; the 6 templates added 2026-07-23 were
 * cross-checked against matsne.gov.ge and the TSU Civil Code Commentary
 * (gccc.tsu.ge) — see the design spec for sourcing).
 * Structure (preamble, force-majeure/dispute clauses, requisites block) is
 * modeled on real Georgian market contracts, not just statute text — see spec.
 */

import type { Locale } from "@/lib/i18n/config";

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

type TemplateDef = { body: string; bodyEn: string; legalBasis: string; legalBasisEn: string };

const RENTAL_BODY = `ბინის ქირავნობის ხელშეკრულება

ქ. **[CITY]**                                                                    **[DOC_DATE]**

ერთის მხრივ, **[LANDLORD]** ([LANDLORD_ID_LINE]მისამართი: [LANDLORD_ADDRESS], ტელ: [LANDLORD_PHONE], **საბანკო ანგარიში:** [BANK_ACCOUNT]) (შემდგომში — „გამქირავებელი“) და მეორეს მხრივ, **[TENANT]** ([TENANT_ID_LINE]მისამართი: [TENANT_ADDRESS], ტელ: [TENANT_PHONE]) (შემდგომში — „დამქირავებელი“, ერთობლივად — „მხარეები“), ვდებთ წინამდებარე ხელშეკრულებას შემდეგზე:

**1. ხელშეკრულების საგანი**
გამქირავებელი გადასცემს დამქირავებელს სარგებლობაში საცხოვრებელ ფართს მისამართზე: **[PROPERTY_ADDRESS]** (შემდგომში — „ფართი“), ხოლო დამქირავებელი იღებს ვალდებულებას გადაუხადოს ქირა წინამდებარე ხელშეკრულებით დადგენილი წესით.

**2. ხელშეკრულების ვადა**
ხელშეკრულება ძალაშია **[LEASE_START_DATE]**-დან **[LEASE_END_DATE]**-მდე.

**3. ქირა და გადახდის წესი**
3.1. ყოველთვიური ქირა შეადგენს **[RENT]**-ს.[CURRENCY_CLAUSE]
3.2. გადახდის მეთოდი: **[PAYMENT_METHOD]**.
3.3. ქირა გადაიხდება **[RENT_DUE_DATE]**, თუ მხარეები სხვაგვარად არ შეთანხმდებიან.
3.4. [DEPOSIT_CLAUSE]
3.5. კომუნალური გადასახადების ანაზღაურებას ახორციელებს: **[UTILITIES_RESPONSIBILITY]**.

**4. მხარეთა უფლება-მოვალეობები**
4.1. გამქირავებელი გადასცემს ფართს გამართულ, საცხოვრებლად გამოსაყენებელ მდგომარეობაში.
4.2. დამქირავებელი იყენებს ფართს საცხოვრებლად და ზრუნავს მის შენარჩუნებაზე.
4.3. ხელშეკრულების შეწყვეტისას დამქირავებელი აბრუნებს ფართს იმ მდგომარეობაში, რომელშიც მიიღო, ნორმალური ცვეთის (ჩვეულებრივი, დროთა განმავლობაში წარმოშობილი გაცვეთის) გათვალისწინებით.

**5. ხელშეკრულების ვადამდე შეწყვეტა**
5.1. თუ დამქირავებელი არ იხდის ქირას ზედიზედ სამი თვის განმავლობაში, გამქირავებელს უფლება აქვს მოშალოს ხელშეკრულება ვადამდე.
5.2. თუ მუხლი 2-ით განსაზღვრული ვადა ამოიწურება, მხარეები ახალ წერილობით შეთანხმებას არ დებენ და დამქირავებელი აგრძელებს ფართით სარგებლობას გამქირავებლის წინააღმდეგობის გარეშე, ხელშეკრულება ითვლება გაგრძელებულად განუსაზღვრელი ვადით; ამ შემთხვევაში ნებისმიერ მხარეს შეუძლია მოშალოს ხელშეკრულება წერილობითი შეტყობინებით, სამთვიანი ვადის დაცვით, თუ მხარეები სხვა ვადაზე არ შეთანხმდნენ.
5.3. დამქირავებელს ასევე უფლება აქვს ვადამდე შეწყვიტოს ხელშეკრულება არანაკლებ ერთი თვით ადრე გაგზავნილი წერილობითი შეტყობინებით.
5.4. ხელშეკრულების შეწყვეტა ფორმდება წერილობით.

**6. ფორს-მაჟორი**
მხარეები თავისუფლდებიან პასუხისმგებლობისგან, თუ ვალდებულების შეუსრულებლობა გამოწვეულია დაუძლეველი ძალის გარემოებით (სტიქიური უბედურება, ომი, ეპიდემია და სხვა), რომლის თავიდან აცილება მხარეთა გონივრულ კონტროლს აღემატება.

**7. დავების გადაწყვეტა**
ხელშეკრულებასთან დაკავშირებული დავები წყდება მოლაპარაკების გზით, ხოლო შეთანხმების მიუღწევლობისას — საქართველოს კანონმდებლობით დადგენილი წესით, სასამართლოში.

**8. დასკვნითი დებულებები**
ხელშეკრულება შედგენილია 2 ეგზემპლარად, თითოეული მხარისთვის თანაბარი იურიდიული ძალით.

**მხარეთა რეკვიზიტები**
გამქირავებელი: **[LANDLORD]**, [LANDLORD_ID_LINE]მის: [LANDLORD_ADDRESS], ტელ: [LANDLORD_PHONE], საბანკო ანგარიში: [BANK_ACCOUNT]     ხელმოწერა: ____________
დამქირავებელი: **[TENANT]**, [TENANT_ID_LINE]მის: [TENANT_ADDRESS], ტელ: [TENANT_PHONE]     ხელმოწერა: ____________`;

const RENTAL_BODY_EN = `RESIDENTIAL LEASE AGREEMENT

City of **[CITY]**                                                                    **[DOC_DATE]**

Between, on the one part, **[LANDLORD]** ([LANDLORD_ID_LINE]address: [LANDLORD_ADDRESS], tel: [LANDLORD_PHONE], **Bank account:** [BANK_ACCOUNT]) (hereinafter — the "Landlord"), and, on the other part, **[TENANT]** ([TENANT_ID_LINE]address: [TENANT_ADDRESS], tel: [TENANT_PHONE]) (hereinafter — the "Tenant"; together — the "Parties"), have entered into this Agreement as follows:

**1. Subject Matter of the Agreement**
The Landlord shall grant the Tenant use of the residential premises located at: **[PROPERTY_ADDRESS]** (hereinafter — the "Premises"), and the Tenant undertakes to pay rent in the manner set out in this Agreement.

**2. Term of the Agreement**
This Agreement shall remain in force from **[LEASE_START_DATE]** until **[LEASE_END_DATE]**.

**3. Rent and Payment Terms**
3.1. The monthly rent shall be **[RENT]**.[CURRENCY_CLAUSE]
3.2. Payment method: **[PAYMENT_METHOD]**.
3.3. Rent shall be paid by **[RENT_DUE_DATE]**, unless the Parties agree otherwise.
3.4. [DEPOSIT_CLAUSE]
3.5. Utility bills shall be paid by: **[UTILITIES_RESPONSIBILITY]**.

**4. Rights and Obligations of the Parties**
4.1. The Landlord shall deliver the Premises in proper condition, fit for residential use.
4.2. The Tenant shall use the Premises for residential purposes and take due care to preserve them.
4.3. Upon termination of the Agreement, the Tenant shall return the Premises in the condition in which they were received, ordinary wear and tear (normal deterioration occurring over time through ordinary use) excepted.

**5. Early Termination of the Agreement**
5.1. If the Tenant fails to pay rent for three consecutive months, the Landlord shall be entitled to terminate the Agreement early.
5.2. If the term specified in Article 2 expires, the Parties do not enter into a new written agreement, and the Tenant continues to use the Premises without objection from the Landlord, the Agreement shall be deemed continued for an indefinite term; in that case, either Party may terminate it by written notice, subject to a three-month notice period, unless the Parties agree on a different period.
5.3. The Tenant may also terminate the Agreement early by giving the Landlord written notice at least one month in advance.
5.4. Termination of the Agreement shall be made in writing.

**6. Force Majeure**
The Parties shall be released from liability where failure to perform an obligation results from circumstances of insurmountable force (natural disaster, war, epidemic, and the like) that are beyond the Parties' reasonable control and could not have been avoided.

**7. Dispute Resolution**
Disputes arising out of this Agreement shall be resolved through negotiation and, failing agreement, in court, in accordance with the procedure established by the legislation of Georgia.

**8. Final Provisions**
This Agreement is executed in 2 (two) counterparts, each having equal legal force for each Party.

**Details of the Parties**
Landlord: **[LANDLORD]**, [LANDLORD_ID_LINE]address: [LANDLORD_ADDRESS], tel: [LANDLORD_PHONE], bank account: [BANK_ACCOUNT]     Signature: ____________
Tenant: **[TENANT]**, [TENANT_ID_LINE]address: [TENANT_ADDRESS], tel: [TENANT_PHONE]     Signature: ____________`;

const EMPLOYMENT_BODY = `შრომის ხელშეკრულება

ქ. **[CITY]**                                                                    **[DOC_DATE]**

ერთის მხრივ, **[EMPLOYER]** ([EMPLOYER_ID_LINE]მისამართი: [EMPLOYER_ADDRESS]) (შემდგომში — „დამსაქმებელი“) და მეორეს მხრივ, **[EMPLOYEE]** (პ/ნ **[EMPLOYEE_ID]**, მისამართი: [EMPLOYEE_ADDRESS], საბანკო ანგარიში: [BANK_ACCOUNT]) (შემდგომში — „დასაქმებული“, ერთობლივად — „მხარეები“), ვდებთ წინამდებარე ხელშეკრულებას შემდეგზე:

**1. ხელშეკრულების საგანი**
დამსაქმებელი დასაქმებულს იღებს **[POSITION]**-ის პოზიციაზე **[START_DATE]**-დან, ხოლო დასაქმებული თანხმობას აცხადებს შეასრულოს დაკისრებული სამუშაო წინამდებარე ხელშეკრულებით დადგენილი პირობების შესაბამისად. დასაქმებულის კონკრეტული ფუნქციები და მოვალეობები განისაზღვრება დამსაქმებლის მიერ დამტკიცებული თანამდებობრივი ინსტრუქციით ან წერილობითი დავალებებით, წინამდებარე ხელშეკრულების ფარგლებში.[PROBATION_CLAUSE]

**2. ხელშეკრულების ვადა**
[EMPLOYMENT_TERM_CLAUSE]

**3. სამუშაო დრო და დასვენება**
სამუშაო დრო: **[WORKING_HOURS]**. დასვენების პერიოდები განისაზღვრება საქართველოს შრომის კოდექსისა და დამსაქმებლის შინაგანაწესის შესაბამისად (არსებობის შემთხვევაში).

**4. ანაზღაურება**
4.1. თანამდებობრივი სარგო შეადგენს **[SALARY]**-ს თვეში.[CURRENCY_CLAUSE]
4.2. გადახდის მეთოდი: **[SALARY_PAYMENT_METHOD]**.
4.3. ზეგანაკვეთური სამუშაო ანაზღაურდება კანონმდებლობის შესაბამისად.

**5. მხარეთა უფლება-მოვალეობები**
5.1. დამსაქმებელი ვალდებულია დროულად გადაუხადოს დასაქმებულს ხელფასი და უზრუნველყოს უსაფრთხო სამუშაო გარემო.
5.2. დასაქმებული ვალდებულია ჯეროვნად და კეთილსინდისიერად შეასრულოს დაკისრებული მოვალეობები.
5.3. დასაქმებულს ეძლევა კანონმდებლობით გათვალისწინებული ანაზღაურებადი და ანაზღაურების გარეშე შვებულება.

**6. ხელშეკრულების შეწყვეტა**
ხელშეკრულების შეწყვეტა ხდება საქართველოს შრომის კოდექსის 47-ე და 48-ე მუხლებით დადგენილი საფუძვლებითა და წესით, წინასწარი წერილობითი შეტყობინებით. ეს საფუძვლები, სხვა კანონისმიერ შემთხვევებთან ერთად, მოიცავს მხარეთა შეთანხმებას, დასაქმებულის ინიციატივას, დამსაქმებლის ეკონომიკურ, ტექნოლოგიურ ან ორგანიზაციულ გარემოებებს და დასაქმებულის მიერ ხელშეკრულებით ან შინაგანაწესით გათვალისწინებული ვალდებულების არსებით დარღვევას. საბოლოო ანგარიშსწორება ხდება შეწყვეტიდან არაუგვიანეს 7 კალენდარული დღისა.

**7. დავების გადაწყვეტა**
შრომითი დავები წყდება მხარეთა მოლაპარაკებით, ხოლო შეთანხმების მიუღწევლობისას — სასამართლოში, საქართველოს კანონმდებლობით დადგენილი წესით.

**8. დასკვნითი დებულებები**
ხელშეკრულება შედგენილია 2 ეგზემპლარად, თანაბარი იურიდიული ძალით.

**მხარეთა რეკვიზიტები**
დამსაქმებელი: **[EMPLOYER]**, [EMPLOYER_ID_LINE]მის: [EMPLOYER_ADDRESS]     ხელმოწერა: ____________
დასაქმებული: **[EMPLOYEE]**, პ/ნ [EMPLOYEE_ID], მის: [EMPLOYEE_ADDRESS], საბანკო ანგარიში: [BANK_ACCOUNT]     ხელმოწერა: ____________`;

const EMPLOYMENT_BODY_EN = `EMPLOYMENT AGREEMENT

City of **[CITY]**                                                                    **[DOC_DATE]**

Between, on the one part, **[EMPLOYER]** ([EMPLOYER_ID_LINE]address: [EMPLOYER_ADDRESS]) (hereinafter — the "Employer"), and, on the other part, **[EMPLOYEE]** (personal no. **[EMPLOYEE_ID]**, address: [EMPLOYEE_ADDRESS], bank account: [BANK_ACCOUNT]) (hereinafter — the "Employee"; together — the "Parties"), have entered into this Agreement as follows:

**1. Subject Matter of the Agreement**
The Employer engages the Employee in the position of **[POSITION]** as of **[START_DATE]**, and the Employee agrees to perform the assigned work in accordance with the terms set out in this Agreement. The Employee's specific functions and duties shall be determined by the job description approved by the Employer or by written assignments, within the scope of this Agreement.[PROBATION_CLAUSE]

**2. Term of the Agreement**
[EMPLOYMENT_TERM_CLAUSE]

**3. Working Time and Rest**
Working hours: **[WORKING_HOURS]**. Rest periods shall be determined in accordance with the Labour Code of Georgia and the Employer's internal regulations (where such exist).

**4. Remuneration**
4.1. The base salary shall be **[SALARY]** per month.[CURRENCY_CLAUSE]
4.2. Payment method: **[SALARY_PAYMENT_METHOD]**.
4.3. Overtime work shall be compensated in accordance with the legislation.

**5. Rights and Obligations of the Parties**
5.1. The Employer shall pay the Employee's salary in a timely manner and provide a safe working environment.
5.2. The Employee shall perform the assigned duties properly and in good faith.
5.3. The Employee shall be entitled to paid and unpaid leave as provided by the legislation.

**6. Termination of the Agreement**
This Agreement shall be terminated on the grounds and in the manner established by Articles 47 and 48 of the Labour Code of Georgia, upon prior written notice. These grounds, among other statutory cases, include mutual agreement of the Parties, the Employee's own initiative, the Employer's economic, technological, or organizational circumstances, and a material breach by the Employee of an obligation under this Agreement or the internal regulations. Final settlement shall be made no later than 7 calendar days after termination.

**7. Dispute Resolution**
Labour disputes shall be resolved through negotiation between the Parties and, failing agreement, in court, in accordance with the procedure established by the legislation of Georgia.

**8. Final Provisions**
This Agreement is executed in 2 (two) counterparts, having equal legal force.

**Details of the Parties**
Employer: **[EMPLOYER]**, [EMPLOYER_ID_LINE]address: [EMPLOYER_ADDRESS]     Signature: ____________
Employee: **[EMPLOYEE]**, personal no. [EMPLOYEE_ID], address: [EMPLOYEE_ADDRESS], bank account: [BANK_ACCOUNT]     Signature: ____________`;

const POWER_OF_ATTORNEY_BODY = `მინდობილობა

ქ. **[CITY]**                                                                    **[DOC_DATE]**

მე, **[PRINCIPAL]** ([PRINCIPAL_ID_LINE]რეგისტრირებული მისამართზე: [PRINCIPAL_ADDRESS]) (შემდგომში — „მინდობელი“), ვანიჭებ **[AGENT]**-ს ([AGENT_ID_LINE]რეგისტრირებული მისამართზე: [AGENT_ADDRESS]) (შემდგომში — „მინდობილი პირი“) წარმომადგენლობით უფლებამოსილებას შემდეგი მოქმედებების განსახორციელებლად:

**მინდობის ფარგლები:**
[SCOPE]

**მინდობილობის მოქმედების ვადა:** [VALIDITY_CLAUSE]

**გადანდობის უფლება:** [SUBSTITUTION_CLAUSE]

**მნიშვნელოვანი გაფრთხილება:** კანონმდებლობით განსაზღვრულ შემთხვევებში (მათ შორის, უძრავი ქონების განკარგვა ან რეგისტრაცია, სასამართლო წარმომადგენლობა) მინდობილობის იურიდიული ძალისთვის აუცილებელია სანოტარო დამოწმება — წინააღმდეგ შემთხვევაში მასზე დაფუძნებული გარიგება შესაძლოა ბათილად იქნას ცნობილი. მინდობელი ვალდებულია წინასწარ დარწმუნდეს, სჭირდება თუ არა კონკრეტულ შემთხვევას ასეთი დამოწმება.

მინდობილი პირი ვალდებულია იმოქმედოს მინდობელის ინტერესების შესაბამისად, ამ მინდობილობის ფარგლების გადაცილების გარეშე.

**უფლებამოსილების შეწყვეტა:** უფლებამოსილება წყდება მისი ვადის გასვლით (თუ ვადა განისაზღვრა), მინდობილი პირის უარით, მინდობელის მიერ გაუქმებით, მინდობელის გარდაცვალებით ან დავალების შესრულებით. თუ ვადა არ არის მითითებული, მინდობილობა მოქმედებს გაუქმებამდე. უფლებამოსილების გაუქმებისას მინდობილი პირი ვალდებულია დაუბრუნოს მინდობელს მინდობილობის საბუთი დაუყოვნებლივ, არაუგვიანეს 5 კალენდარული დღისა.

მინდობელი: **[PRINCIPAL]**     ხელმოწერა: ____________

**სანოტარო დამოწმება (საჭიროების შემთხვევაში):**
ნოტარიუსი: ____________     ხელმოწერა/ბეჭედი: ____________     თარიღი: ____________`;

const POWER_OF_ATTORNEY_BODY_EN = `POWER OF ATTORNEY

City of **[CITY]**                                                                    **[DOC_DATE]**

I, **[PRINCIPAL]** ([PRINCIPAL_ID_LINE]registered at: [PRINCIPAL_ADDRESS]) (hereinafter — the "Principal"), hereby grant **[AGENT]** ([AGENT_ID_LINE]registered at: [AGENT_ADDRESS]) (hereinafter — the "Agent") authority to represent me in performing the following actions:

**Scope of Authority:**
[SCOPE]

**Validity Period:** [VALIDITY_CLAUSE]

**Right of Substitution:** [SUBSTITUTION_CLAUSE]

**Important warning:** In cases specified by law (including disposal or registration of immovable property, representation before a court), notarial certification is required for this power of attorney to have legal effect — otherwise, a transaction based on it may be declared invalid. The Principal must confirm in advance whether such certification is required for the specific case at hand.

The Agent shall act in accordance with the Principal's interests and shall not exceed the scope of this power of attorney.

**Termination of Authority:** The authority granted hereunder shall terminate upon expiry of its term (where a term is specified), renunciation by the Agent, revocation by the Principal, the Principal's death, or completion of the assigned task. If no term is specified, this power of attorney shall remain in effect until revoked. Upon revocation of authority, the Agent shall return the instrument of this power of attorney to the Principal immediately, no later than 5 calendar days thereafter.

Principal: **[PRINCIPAL]**     Signature: ____________

**Notarial certification (where required):**
Notary: ____________     Signature/Seal: ____________     Date: ____________`;

const TERMINATION_NOTICE_BODY = `შეტყობინება შრომითი ხელშეკრულების შეწყვეტის შესახებ

ქ. **[CITY]**                                                                    **[DOC_DATE]**

დამსაქმებელი: **[EMPLOYER]**
დასაქმებული: **[EMPLOYEE]**, პ/ნ [EMPLOYEE_ID], მისამართი: [EMPLOYEE_ADDRESS]

წინამდებარე შეტყობინებით გაცნობებთ, რომ თქვენთან დადებული შრომითი ხელშეკრულება წყდება საქართველოს შრომის კოდექსის 47-ე მუხლის შესაბამისად, შემდეგი საფუძვლით:

**შეწყვეტის საფუძველი:** [REASON]

**შეტყობინების ჩაბარების თარიღი:** [NOTICE_DATE]

**შრომითი ურთიერთობის ბოლო დღე:** **[LAST_DAY]**

შეტყობინება გამოგზავნილია საქართველოს შრომის კოდექსის 48-ე მუხლით დადგენილი წინასწარი გაფრთხილების ვადის დაცვით. კანონით გათვალისწინებულ შემთხვევებში დასაქმებულს ეკუთვნის შესაბამისი კომპენსაცია (ოდენობა: **[COMPENSATION_AMOUNT]**, ასეთის მითითების შემთხვევაში).

**გამოუყენებელი შვებულების დღეების რაოდენობა (ასანაზღაურებელი):** [UNUSED_LEAVE_DAYS]

საბოლოო ანგარიშსწორება განხორციელდება არაუგვიანეს **[SETTLEMENT_DEADLINE]**-ისა (შრომითი ურთიერთობის შეწყვეტიდან არაუგვიანეს 7 კალენდარული დღისა, შრომის კოდექსის 44-ე მუხლის შესაბამისად).

დასაქმებულს უფლება აქვს, კანონმდებლობით დადგენილი წესით მოითხოვოს შეწყვეტის საფუძვლის წერილობითი დასაბუთება და გაასაჩივროს გადაწყვეტილება სასამართლოში.

დამსაქმებელი: **[EMPLOYER]**     ხელმოწერა: ____________`;

const TERMINATION_NOTICE_BODY_EN = `NOTICE OF TERMINATION OF EMPLOYMENT AGREEMENT

City of **[CITY]**                                                                    **[DOC_DATE]**

Employer: **[EMPLOYER]**
Employee: **[EMPLOYEE]**, personal no. [EMPLOYEE_ID], address: [EMPLOYEE_ADDRESS]

We hereby notify you that the employment agreement concluded with you is terminated pursuant to Article 47 of the Labour Code of Georgia, on the following grounds:

**Grounds for termination:** [REASON]

**Notice delivery date:** [NOTICE_DATE]

**Last day of the employment relationship:** **[LAST_DAY]**

This notice has been given in compliance with the advance notice period established by Article 48 of the Labour Code of Georgia. Where provided by law, the Employee shall be entitled to corresponding compensation (amount: **[COMPENSATION_AMOUNT]**, where specified).

**Unused vacation days to be compensated:** [UNUSED_LEAVE_DAYS]

Final settlement shall be made no later than **[SETTLEMENT_DEADLINE]** (no later than 7 calendar days after termination of the employment relationship, in accordance with Article 44 of the Labour Code).

The Employee is entitled, in the manner established by law, to request written justification of the grounds for termination and to appeal the decision in court.

Employer: **[EMPLOYER]**     Signature: ____________`;

const SERVICE_AGREEMENT_BODY = `მომსახურების გაწევის ხელშეკრულება

ქ. **[CITY]**                                                                    **[DOC_DATE]**

ერთის მხრივ, **[EXECUTOR]** ([EXECUTOR_ID_LINE]მისამართი: [EXECUTOR_ADDRESS], ტელ: [EXECUTOR_PHONE]) (შემდგომში — „შემსრულებელი“) და მეორეს მხრივ, **[CLIENT]** ([CLIENT_ID_LINE]მისამართი: [CLIENT_ADDRESS], ტელ: [CLIENT_PHONE]) (შემდგომში — „დამკვეთი“, ერთობლივად — „მხარეები“), ვდებთ წინამდებარე ხელშეკრულებას შემდეგზე:

**1. ხელშეკრულების საგანი**
შემსრულებელი იღებს ვალდებულებას, დამკვეთის დავალებით გაუწიოს შემდეგი მომსახურება: **[SERVICE_DESCRIPTION]**, ხოლო დამკვეთი იღებს ვალდებულებას მიღებული მომსახურება გადაუხადოს წინამდებარე ხელშეკრულებით დადგენილი წესით.

**2. მომსახურების ვადა**
მომსახურება გაეწევა **[SERVICE_START_DATE]**-დან **[SERVICE_END_DATE]**-მდე.
დამატებითი ვადები/ეტაპები: [DEADLINE]

**3. საფასური და ანგარიშსწორება**
3.1. მომსახურების საფასური შეადგენს **[PRICE]**-ს.[CURRENCY_CLAUSE]
3.2. გადახდის მეთოდი: **[PAYMENT_METHOD]**. საბანკო ანგარიში: **[BANK_ACCOUNT]**.
3.3. მხარეთა შეთანხმებით შესაძლებელია ავანსის ან ეტაპობრივი ანგარიშსწორების გამოყენება.
3.4. თუ მხარეები ეტაპობრივ ან სხვაგვარ გადახდის გრაფიკზე არ შეთანხმდებიან, დამკვეთი ვალდებულია საფასური სრულად გადაიხადოს მომსახურების დასრულებისა და შესაბამისი მოთხოვნის მიღებიდან არაუგვიანეს 5 სამუშაო დღისა.

**4. მხარეთა უფლება-მოვალეობები**
4.1. შემსრულებელი ვალდებულია მომსახურება გასწიოს ჯეროვნად, კეთილსინდისიერად და შეთანხმებული ხარისხის დაცვით.
4.2. დამკვეთი ვალდებულია შემსრულებელს დროულად მიაწოდოს მომსახურების გასაწევად საჭირო ინფორმაცია და ხელი არ შეუშალოს მის შესრულებაში.
4.3. თუ მომსახურების შედეგი გულისხმობს კონკრეტული სამუშაოს/პროდუქტის გადაცემას, მხარეები ხელს აწერენ მიღება-ჩაბარების აქტს.

**5. პასუხისმგებლობა**
მხარე, რომელიც არღვევს ხელშეკრულებით ნაკისრ ვალდებულებას, ვალდებულია აანაზღაუროს მეორე მხარისთვის ამით მიყენებული ზიანი საქართველოს კანონმდებლობით დადგენილი წესით.

**6. ხელშეკრულების შეწყვეტა**
ნებისმიერ მხარეს შეუძლია ხელშეკრულების შეწყვეტა მოითხოვოს მეორე მხარისთვის არანაკლებ **[NOTICE_PERIOD_DAYS]** სამუშაო დღით ადრე გაგზავნილი წერილობითი შეტყობინებით, უკვე გაწეული მომსახურების ანაზღაურების პირობით.

**7. ფორს-მაჟორი**
მხარეები თავისუფლდებიან პასუხისმგებლობისგან, თუ ვალდებულების შეუსრულებლობა გამოწვეულია დაუძლეველი ძალის გარემოებით, რომლის თავიდან აცილება მხარეთა გონივრულ კონტროლს აღემატება.

**8. დავების გადაწყვეტა**
ხელშეკრულებასთან დაკავშირებული დავები წყდება მოლაპარაკების გზით, ხოლო შეთანხმების მიუღწევლობისას — სასამართლოში, საქართველოს კანონმდებლობით დადგენილი წესით.

**9. დასკვნითი დებულებები**
ხელშეკრულება შედგენილია 2 ეგზემპლარად, თითოეული მხარისთვის თანაბარი იურიდიული ძალით.

**მხარეთა რეკვიზიტები**
შემსრულებელი: **[EXECUTOR]**, [EXECUTOR_ID_LINE]მის: [EXECUTOR_ADDRESS], ტელ: [EXECUTOR_PHONE]     ხელმოწერა: ____________
დამკვეთი: **[CLIENT]**, [CLIENT_ID_LINE]მის: [CLIENT_ADDRESS], ტელ: [CLIENT_PHONE]     ხელმოწერა: ____________`;

const SERVICE_AGREEMENT_BODY_EN = `SERVICE AGREEMENT

City of **[CITY]**                                                                    **[DOC_DATE]**

Between, on the one part, **[EXECUTOR]** ([EXECUTOR_ID_LINE]address: [EXECUTOR_ADDRESS], tel: [EXECUTOR_PHONE]) (hereinafter — the "Contractor"), and, on the other part, **[CLIENT]** ([CLIENT_ID_LINE]address: [CLIENT_ADDRESS], tel: [CLIENT_PHONE]) (hereinafter — the "Client"; together — the "Parties"), have entered into this Agreement as follows:

**1. Subject Matter of the Agreement**
The Contractor undertakes to provide the following services at the Client's request: **[SERVICE_DESCRIPTION]**, and the Client undertakes to pay for the services rendered in the manner set out in this Agreement.

**2. Term for Provision of Services**
The services shall be rendered from **[SERVICE_START_DATE]** until **[SERVICE_END_DATE]**.
Additional deadlines/milestones: [DEADLINE]

**3. Fee and Settlement**
3.1. The fee for the services shall be **[PRICE]**.[CURRENCY_CLAUSE]
3.2. Payment method: **[PAYMENT_METHOD]**. Bank account: **[BANK_ACCOUNT]**.
3.3. By agreement of the Parties, an advance payment or staged settlement may be used.
3.4. If the Parties do not agree on a staged or other payment schedule, the Client shall pay the fee in full no later than 5 business days after the services are completed and the corresponding request is received.

**4. Rights and Obligations of the Parties**
4.1. The Contractor shall render the services properly, in good faith, and to the agreed standard of quality.
4.2. The Client shall provide the Contractor with the information necessary to render the services in a timely manner and shall not obstruct performance.
4.3. Where the result of the services entails the delivery of a specific work product, the Parties shall sign an acceptance act.

**5. Liability**
A Party that breaches an obligation under this Agreement shall compensate the other Party for damage thereby caused, in the manner established by the legislation of Georgia.

**6. Termination of the Agreement**
Either Party may request termination of the Agreement by sending the other Party written notice at least **[NOTICE_PERIOD_DAYS]** business days in advance, subject to payment for services already rendered.

**7. Force Majeure**
The Parties shall be released from liability where failure to perform an obligation results from circumstances of insurmountable force that are beyond the Parties' reasonable control and could not have been avoided.

**8. Dispute Resolution**
Disputes arising out of this Agreement shall be resolved through negotiation and, failing agreement, in court, in accordance with the procedure established by the legislation of Georgia.

**9. Final Provisions**
This Agreement is executed in 2 (two) counterparts, each having equal legal force for each Party.

**Details of the Parties**
Contractor: **[EXECUTOR]**, [EXECUTOR_ID_LINE]address: [EXECUTOR_ADDRESS], tel: [EXECUTOR_PHONE]     Signature: ____________
Client: **[CLIENT]**, [CLIENT_ID_LINE]address: [CLIENT_ADDRESS], tel: [CLIENT_PHONE]     Signature: ____________`;

const CLAIM_LETTER_BODY = `წერილი-პრეტენზია

ქ. **[CITY]**                                                                    **[DOC_DATE]**

ადრესატი: **[RECIPIENT_NAME]**, მისამართი: [RECIPIENT_ADDRESS]
გამომგზავნი: **[SENDER_NAME]**, [SENDER_ID_LINE]მისამართი: [SENDER_ADDRESS], ტელ: [SENDER_PHONE]

**1. ფაქტობრივი გარემოებები**
[GROUNDS]

**2. მოთხოვნა**
ზემოაღნიშნულიდან გამომდინარე, გთხოვთ: **[DEMAND]**.
მოთხოვნილი თანხა (ასეთის არსებობისას): **[AMOUNT]**.[CURRENCY_CLAUSE] გადახდის მეთოდი: [PAYMENT_METHOD]. საბანკო ანგარიში: [BANK_ACCOUNT].

**3. შესრულების ვადა**
გთხოვთ, აღნიშნული მოთხოვნა დააკმაყოფილოთ არაუგვიანეს: **[DEADLINE]**.

**4. შედეგები დაუკმაყოფილებლობის შემთხვევაში**
თუ მითითებულ ვადაში მოთხოვნა არ დაკმაყოფილდება, ვიტოვებ უფლებას, მივმართო სასამართლოს საქართველოს კანონმდებლობით დადგენილი წესით, მათ შორის მოვითხოვო მიყენებული ზიანის, საურავისა და სასამართლო ხარჯების ანაზღაურება.

გამომგზავნი: **[SENDER_NAME]**     ხელმოწერა: ____________`;

const CLAIM_LETTER_BODY_EN = `LETTER OF CLAIM

City of **[CITY]**                                                                    **[DOC_DATE]**

To: **[RECIPIENT_NAME]**, address: [RECIPIENT_ADDRESS]
From: **[SENDER_NAME]**, [SENDER_ID_LINE]address: [SENDER_ADDRESS], tel: [SENDER_PHONE]

**1. Factual Background**
[GROUNDS]

**2. Demand**
In light of the foregoing, I request that you: **[DEMAND]**.
Amount claimed (if any): **[AMOUNT]**.[CURRENCY_CLAUSE] Payment method: [PAYMENT_METHOD]. Bank account: [BANK_ACCOUNT].

**3. Deadline for Compliance**
Please satisfy the above demand no later than: **[DEADLINE]**.

**4. Consequences of Non-Compliance**
If this demand is not satisfied within the stated deadline, I reserve the right to apply to court in accordance with the procedure established by the legislation of Georgia, including to claim compensation for the damage caused, penalties, and court costs.

Sender: **[SENDER_NAME]**     Signature: ____________`;

const DEBT_CLAIM_BODY = `მოთხოვნა (პრეტენზია) დავალიანების დაფარვის შესახებ

ქ. **[CITY]**                                                                    **[DOC_DATE]**

კრედიტორი: **[CREDITOR_NAME]**, [CREDITOR_ID_LINE]მისამართი: [CREDITOR_ADDRESS], ტელ: [CREDITOR_PHONE]
მოვალე: **[DEBTOR_NAME]**, მისამართი: [DEBTOR_ADDRESS]

**1. დავალიანების საფუძველი**
[DEBT_BASIS]

**2. დავალიანების ოდენობა**
ძირითადი თანხა: **[PRINCIPAL_AMOUNT]**[CURRENCY_CLAUSE]
დარიცხული პროცენტი/საურავი: **[INTEREST_AMOUNT]** (დარიცხვის საფუძველი და განაკვეთი: იხ. ზემოთ, დავალიანების საფუძველში მითითებული პირობები, ან კანონმდებლობით დადგენილი წესი)
სულ გადასახდელი: **[TOTAL_AMOUNT]**
დაბრუნების თავდაპირველი ვადა: **[ORIGINAL_DUE_DATE]**

**3. მოთხოვნა**
გთხოვთ, დაფაროთ ზემოაღნიშნული დავალიანება სრულად, არაუგვიანეს: **[NEW_DEADLINE]**.
გადახდის მეთოდი: **[PAYMENT_METHOD]**. საბანკო ანგარიში: **[BANK_ACCOUNT]**.

**4. შედეგები დაუკმაყოფილებლობის შემთხვევაში**
თუ მითითებულ ვადაში დავალიანება არ დაიფარება, კრედიტორი უფლებამოსილია მიმართოს სასამართლოს ზემოთ მითითებული სრული თანხის — **[TOTAL_AMOUNT]** (მათ შორის დარიცხული პროცენტი/საურავი: **[INTEREST_AMOUNT]**) — და სასამართლო ხარჯების გადახდევინების მოთხოვნით, მათ შორის გამარტივებული (ბრძანების გამოცემის) წარმოების წესით, საქართველოს სამოქალაქო საპროცესო კოდექსით დადგენილი წესით. პრაქტიკულად ეს ნიშნავს, რომ ვადის გადაცილების შემდეგ მოვალის ვალდებულება არ იზღუდება ძირითადი თანხით — მას ემატება ზემოთ მითითებული პროცენტი/საურავი და სასამართლო/აღსრულების ხარჯები.

კრედიტორი: **[CREDITOR_NAME]**     ხელმოწერა: ____________`;

const DEBT_CLAIM_BODY_EN = `DEMAND (CLAIM) FOR REPAYMENT OF DEBT

City of **[CITY]**                                                                    **[DOC_DATE]**

Creditor: **[CREDITOR_NAME]**, [CREDITOR_ID_LINE]address: [CREDITOR_ADDRESS], tel: [CREDITOR_PHONE]
Debtor: **[DEBTOR_NAME]**, address: [DEBTOR_ADDRESS]

**1. Basis of the Debt**
[DEBT_BASIS]

**2. Amount of the Debt**
Principal amount: **[PRINCIPAL_AMOUNT]**[CURRENCY_CLAUSE]
Accrued interest/penalty: **[INTEREST_AMOUNT]** (basis and rate: see the terms stated above, under the basis of the debt, or as established by the legislation)
Total amount due: **[TOTAL_AMOUNT]**
Original due date for repayment: **[ORIGINAL_DUE_DATE]**

**3. Demand**
Please repay the above debt in full, no later than: **[NEW_DEADLINE]**.
Payment method: **[PAYMENT_METHOD]**. Bank account: **[BANK_ACCOUNT]**.

**4. Consequences of Non-Compliance**
If the debt is not repaid within the stated deadline, the Creditor shall be entitled to apply to court for the full amount stated above — **[TOTAL_AMOUNT]** (including accrued interest/penalty: **[INTEREST_AMOUNT]**) — plus court costs, including through simplified (order-for-payment) proceedings, in accordance with the procedure established by the Civil Procedure Code of Georgia. In practice, this means that after the deadline passes, the Debtor's liability is not limited to the principal amount — the interest/penalty stated above, plus court and enforcement costs, are added to it.

Creditor: **[CREDITOR_NAME]**     Signature: ____________`;

const CHILD_TRAVEL_CONSENT_BODY = `თანხმობა არასრულწლოვნის საზღვარგარეთ გაყვანაზე

ქ. **[CITY]**                                                                    **[DOC_DATE]**

მე, **[PARENT_NAME]** (პ/ნ [PARENT_ID], მისამართი: [PARENT_ADDRESS], ტელ: [PARENT_PHONE]), არასრულწლოვნის მშობელი/კანონიერი წარმომადგენელი, ვაცხადებ ჩემს თანხმობას, რომ ჩემმა არასრულწლოვანმა შვილმა — **[CHILD_NAME]** (დაბადების თარიღი: **[CHILD_DOB]**, პასპორტის № **[CHILD_DOCUMENT]**) — გავიდეს საქართველოს ფარგლებს გარეთ.

**დანიშნულების ქვეყანა/ქვეყნები:** [DESTINATION]
**გამგზავრების თარიღი:** [TRAVEL_START_DATE]
**დაბრუნების თარიღი:** [TRAVEL_END_DATE]
**თანმხლები პირი:** [ESCORT]
**მეორე მშობლის თანხმობის სტატუსი:** [OTHER_PARENT_STATUS]

წინამდებარე თანხმობა გაცემულია „საქართველოს მოქალაქეების საქართველოდან გასვლისა და საქართველოში შემოსვლის წესების შესახებ“ საქართველოს კანონის მე-8 მუხლის შესაბამისად, რომლის თანახმად, 18 წლამდე ასაკის პირის საზღვარგარეთ გასვლისას საჭიროა კანონიერი წარმომადგენლის თანხმობა, ხოლო მეორე მშობლის თანხმობის არარსებობის შემთხვევაში საკმარისია ერთი კანონიერი წარმომადგენლის ნოტარიულად დამოწმებული თანხმობა, რომელშიც მითითებული უნდა იყოს დანიშნულების ქვეყანა და მოგზაურობის პერიოდი.

**შენიშვნა:** საზღვრის კვეთისას ეს დოკუმენტი, როგორც წესი, საჭიროებს ნოტარიულ დამოწმებას; საზღვარგარეთ გამოსაყენებლად შესაძლოა დამატებით საჭირო გახდეს აპოსტილი ან თარგმანი მიმღები ქვეყნის მოთხოვნების შესაბამისად.

მშობელი/კანონიერი წარმომადგენელი: **[PARENT_NAME]**     ხელმოწერა: ____________

**სანოტარო დამოწმება:**
ნოტარიუსი: ____________     ხელმოწერა/ბეჭედი: ____________     თარიღი: ____________`;

const CHILD_TRAVEL_CONSENT_BODY_EN = `CONSENT TO A MINOR'S TRAVEL ABROAD

City of **[CITY]**                                                                    **[DOC_DATE]**

I, **[PARENT_NAME]** (personal no. [PARENT_ID], address: [PARENT_ADDRESS], tel: [PARENT_PHONE]), parent/legal guardian of the minor, hereby declare my consent that my minor child — **[CHILD_NAME]** (date of birth: **[CHILD_DOB]**, passport No. **[CHILD_DOCUMENT]**) — may travel outside the territory of Georgia.

**Destination country/countries:** [DESTINATION]
**Departure date:** [TRAVEL_START_DATE]
**Return date:** [TRAVEL_END_DATE]
**Accompanying person:** [ESCORT]
**Status of the other parent's consent:** [OTHER_PARENT_STATUS]

This consent is given pursuant to Article 8 of the Law of Georgia "On the Rules for the Exit of Georgian Citizens from Georgia and Entry into Georgia," under which the consent of a legal guardian is required for a person under 18 years of age to travel abroad, and, in the absence of the other parent's consent, the notarized consent of a single legal guardian shall suffice, provided that it states the destination country and the travel period.

**Note:** For purposes of crossing the border, this document generally requires notarial certification; use abroad may additionally require an apostille or translation, depending on the requirements of the receiving country.

Parent/legal guardian: **[PARENT_NAME]**     Signature: ____________

**Notarial certification:**
Notary: ____________     Signature/Seal: ____________     Date: ____________`;

const INVOICE_BODY = `ინვოისი № **[INVOICE_NUMBER]**

ქ. **[CITY]**                                                                    **[DOC_DATE]**

**გამყიდველი / მომსახურების გამწევი:** [SELLER], [SELLER_ID_LINE]მისამართი: [SELLER_ADDRESS]
**საბანკო ანგარიში:** [BANK_ACCOUNT]
**მყიდველი / მომსახურების მიმღები:** [BUYER], [BUYER_ID_LINE]მისამართი: [BUYER_ADDRESS]

**საქონლის/მომსახურების ჩამონათვალი:**
[ITEMS]

**სულ გადასახდელი თანხა:** **[TOTAL_AMOUNT]**[CURRENCY_CLAUSE]
**გადახდის ვადა:** **[DUE_DATE]**
**გადახდის მეთოდი:** [PAYMENT_METHOD]

წინამდებარე დოკუმენტი წარმოადგენს გადახდის მოთხოვნას ზემოაღნიშნული საქონლის/მომსახურების მისაწოდებლად ან უკვე მიწოდებულის საფასურის დასაფარად და არ ჩაითვლება საგადასახადო კანონმდებლობით გათვალისწინებულ ანგარიშ-ფაქტურად RS.ge-ს მონაცემთა ერთიან ცხრილში რეგისტრაციის გაგებით.

გამყიდველი: **[SELLER]**     ხელმოწერა/ბეჭედი: ____________`;

const INVOICE_BODY_EN = `INVOICE No. **[INVOICE_NUMBER]**

City of **[CITY]**                                                                    **[DOC_DATE]**

**Seller / Service Provider:** [SELLER], [SELLER_ID_LINE]address: [SELLER_ADDRESS]
**Bank account:** [BANK_ACCOUNT]
**Buyer / Service Recipient:** [BUYER], [BUYER_ID_LINE]address: [BUYER_ADDRESS]

**List of goods/services:**
[ITEMS]

**Total amount due:** **[TOTAL_AMOUNT]**[CURRENCY_CLAUSE]
**Payment due date:** **[DUE_DATE]**
**Payment method:** [PAYMENT_METHOD]

This document constitutes a request for payment for the above goods/services to be supplied, or already supplied, and shall not be regarded as a tax invoice within the meaning of registration in RS.ge's unified data table under the tax legislation.

Seller: **[SELLER]**     Signature/Seal: ____________`;

const ACCEPTANCE_ACT_BODY = `მიღება-ჩაბარების აქტი № **[ACT_NUMBER]**

ქ. **[CITY]**                                                                    **[DOC_DATE]**

**მიმცემი მხარე:** [PROVIDER], [PROVIDER_ID_LINE]მისამართი: [PROVIDER_ADDRESS]
**მიმღები მხარე:** [RECEIVER], [RECEIVER_ID_LINE]მისამართი: [RECEIVER_ADDRESS]

**ძირითადი ხელშეკრულება:** [CONTRACT_REF]

წინამდებარე აქტი ადასტურებს, რომ მიმცემმა მხარემ ჩააბარა, ხოლო მიმღებმა მხარემ მიიღო შემდეგი საქონელი/სამუშაო/მომსახურება:

[SUBJECT_DESCRIPTION]

**ღირებულება:** [AMOUNT][CURRENCY_CLAUSE]
**საბანკო ანგარიში (IBAN):** [BANK_ACCOUNT]

**მხარეთა შენიშვნები/პრეტენზიები:** [OBJECTIONS]

მხარეები ადასტურებენ, რომ ზემოაღნიშნული საქონელი/სამუშაო/მომსახურება გადაცემულია (შესრულებულია) შეთანხმებული მოცულობით და ხარისხით. აქტზე ხელმოწერის მომენტიდან შესაბამისი ვალდებულება ითვლება შესრულებულად იმ ნაწილში, რომელშიც არ არის დაფიქსირებული პრეტენზია.

წინამდებარე აქტის ხელმოწერა არ ართმევს მიმღებ მხარეს უფლებას, მოითხოვოს ისეთი ნაკლის აღმოფხვრა ან ზიანის ანაზღაურება, რომელიც ვერ იქნებოდა შემჩნეული ჩვეულებრივი დათვალიერებით მიღება-ჩაბარების მომენტში (ფარული ნაკლი) და გამოვლინდა მოგვიანებით, კანონმდებლობით დადგენილი ვადებისა და წესის შესაბამისად.

მიმცემი: **[PROVIDER]**     ხელმოწერა: ____________
მიმღები: **[RECEIVER]**     ხელმოწერა: ____________`;

const ACCEPTANCE_ACT_BODY_EN = `ACCEPTANCE ACT No. **[ACT_NUMBER]**

City of **[CITY]**                                                                    **[DOC_DATE]**

**Transferring party:** [PROVIDER], [PROVIDER_ID_LINE]address: [PROVIDER_ADDRESS]
**Receiving party:** [RECEIVER], [RECEIVER_ID_LINE]address: [RECEIVER_ADDRESS]

**Underlying contract:** [CONTRACT_REF]

This act confirms that the transferring party has delivered, and the receiving party has accepted, the following goods/work/services:

[SUBJECT_DESCRIPTION]

**Value:** [AMOUNT][CURRENCY_CLAUSE]
**Bank account (IBAN):** [BANK_ACCOUNT]

**Parties' remarks/objections:** [OBJECTIONS]

The Parties confirm that the above goods/work/services have been transferred (performed) in the agreed volume and quality. As of the moment of signing this act, the corresponding obligation shall be deemed performed to the extent no objection has been recorded.

Signing this act does not deprive the receiving party of the right to demand remedy of a defect, or compensation for damage, that could not have been discovered upon ordinary inspection at the time of transfer (a latent defect) and comes to light later, in accordance with the time limits and procedure established by the legislation.

Transferring party: **[PROVIDER]**     Signature: ____________
Receiving party: **[RECEIVER]**     Signature: ____________`;

const TEMPLATES: Record<TemplateType, TemplateDef> = {
  "rental-agreement": {
    body: RENTAL_BODY,
    bodyEn: RENTAL_BODY_EN,
    legalBasis:
      "საქართველოს სამოქალაქო კოდექსი:\n- მუხლი 531\n- მუხლი 552\n- მუხლი 553\n- მუხლი 558\n- მუხლი 559\n- მუხლი 561\n- მუხლი 563\n- მუხლი 564",
    legalBasisEn:
      "Civil Code of Georgia:\n- Article 531\n- Article 552\n- Article 553\n- Article 558\n- Article 559\n- Article 561\n- Article 563\n- Article 564",
  },
  "employment-contract": {
    body: EMPLOYMENT_BODY,
    bodyEn: EMPLOYMENT_BODY_EN,
    legalBasis:
      "საქართველოს ორგანული კანონი „საქართველოს შრომის კოდექსი“:\n- მუხლი 14\n- მუხლი 44\n- მუხლი 47\n- მუხლი 48",
    legalBasisEn:
      "Organic Law of Georgia \"Labour Code of Georgia\":\n- Article 14\n- Article 44\n- Article 47\n- Article 48",
  },
  "power-of-attorney": {
    body: POWER_OF_ATTORNEY_BODY,
    bodyEn: POWER_OF_ATTORNEY_BODY_EN,
    legalBasis:
      "საქართველოს სამოქალაქო კოდექსი:\n- მუხლი 107\n- მუხლი 108\n- მუხლი 109\n- მუხლი 110",
    legalBasisEn:
      "Civil Code of Georgia:\n- Article 107\n- Article 108\n- Article 109\n- Article 110",
  },
  "termination-notice": {
    body: TERMINATION_NOTICE_BODY,
    bodyEn: TERMINATION_NOTICE_BODY_EN,
    legalBasis:
      "საქართველოს ორგანული კანონი „საქართველოს შრომის კოდექსი“:\n- მუხლი 44\n- მუხლი 47\n- მუხლი 48",
    legalBasisEn:
      "Organic Law of Georgia \"Labour Code of Georgia\":\n- Article 44\n- Article 47\n- Article 48",
  },
  "service-agreement": {
    body: SERVICE_AGREEMENT_BODY,
    bodyEn: SERVICE_AGREEMENT_BODY_EN,
    legalBasis:
      "საქართველოს სამოქალაქო კოდექსი:\n- მუხლი 361 (ვალდებულების ჯეროვანი შესრულება)\n- მუხლი 394 (ზიანის ანაზღაურება ვალდებულების დარღვევისთვის)\n- მუხლი 629 და შემდგომი მუხლები (ნარდობის/მომსახურების ხელშეკრულების ზოგადი წესები)",
    legalBasisEn:
      "Civil Code of Georgia:\n- Article 361 (proper performance of an obligation)\n- Article 394 (compensation for damage caused by breach of an obligation)\n- Article 629 et seq. (general rules on service/work contracts)",
  },
  "claim-letter": {
    body: CLAIM_LETTER_BODY,
    bodyEn: CLAIM_LETTER_BODY_EN,
    legalBasis:
      "საქართველოს სამოქალაქო კოდექსი:\n- მუხლი 361 (ვალდებულების ჯეროვანი შესრულება)\n- მუხლი 394 (ზიანის ანაზღაურება ვალდებულების დარღვევისთვის)",
    legalBasisEn:
      "Civil Code of Georgia:\n- Article 361 (proper performance of an obligation)\n- Article 394 (compensation for damage caused by breach of an obligation)",
  },
  "debt-claim": {
    body: DEBT_CLAIM_BODY,
    bodyEn: DEBT_CLAIM_BODY_EN,
    legalBasis:
      "საქართველოს სამოქალაქო კოდექსი:\n- მუხლი 623-628 (სესხის ხელშეკრულება)\n- მუხლი 394 (ზიანის ანაზღაურება ვალდებულების დარღვევისთვის)\nსაქართველოს სამოქალაქო საპროცესო კოდექსი — ბრძანების გამოცემის (გამარტივებული) წარმოება ფულადი მოთხოვნისთვის.",
    legalBasisEn:
      "Civil Code of Georgia:\n- Articles 623-628 (loan agreement)\n- Article 394 (compensation for damage caused by breach of an obligation)\nCivil Procedure Code of Georgia — order-for-payment (simplified) proceedings for monetary claims.",
  },
  "child-travel-consent": {
    body: CHILD_TRAVEL_CONSENT_BODY,
    bodyEn: CHILD_TRAVEL_CONSENT_BODY_EN,
    legalBasis:
      "საქართველოს კანონი „საქართველოს მოქალაქეების საქართველოდან გასვლისა და საქართველოში შემოსვლის წესების შესახებ“:\n- მუხლი 8",
    legalBasisEn:
      "Law of Georgia \"On the Rules for the Exit of Georgian Citizens from Georgia and Entry into Georgia\":\n- Article 8",
  },
  invoice: {
    body: INVOICE_BODY,
    bodyEn: INVOICE_BODY_EN,
    legalBasis:
      "საქართველოს სამოქალაქო კოდექსი:\n- მუხლი 361 (ვალდებულების ჯეროვანი შესრულება)\n- მუხლი 477 (ნასყიდობის ფასის გადახდის ვალდებულება, ანალოგიით — მომსახურების საფასურზეც)\n\nშენიშვნა: ეს არის კომერციული ინვოისი (გადახდის მოთხოვნა), არა საგადასახადო კანონმდებლობით რეგულირებული ანგარიშ-ფაქტურა.",
    legalBasisEn:
      "Civil Code of Georgia:\n- Article 361 (proper performance of an obligation)\n- Article 477 (obligation to pay the purchase price, applied by analogy to service fees)\n\nNote: This is a commercial invoice (payment request), not a tax invoice regulated by tax legislation.",
  },
  "acceptance-act": {
    body: ACCEPTANCE_ACT_BODY,
    bodyEn: ACCEPTANCE_ACT_BODY_EN,
    legalBasis:
      "საქართველოს სამოქალაქო კოდექსი:\n- მუხლი 629 (ნარდობის/მომსახურების ხელშეკრულება)\n- მუხლი 646 (შესრულებულის მიღება-ჩაბარება)",
    legalBasisEn:
      "Civil Code of Georgia:\n- Article 629 (service/work contract)\n- Article 646 (acceptance of performance)",
  },
};

/**
 * Maps each template's form-field keys (from QUESTION_SCHEMAS /
 * COMMON_FIELDS in document-fields.ts) to the [PLACEHOLDER] tokens used in
 * that template's body text.
 */
const FIELD_MAP: Record<TemplateType, Record<string, string>> = {
  "rental-agreement": {
    landlord: "LANDLORD", landlordAddress: "LANDLORD_ADDRESS", landlordPhone: "LANDLORD_PHONE", bankAccount: "BANK_ACCOUNT",
    tenant: "TENANT", tenantAddress: "TENANT_ADDRESS", tenantPhone: "TENANT_PHONE",
    address: "PROPERTY_ADDRESS", rent: "RENT", rentDueDate: "RENT_DUE_DATE", paymentMethod: "PAYMENT_METHOD",
    utilitiesResponsibility: "UTILITIES_RESPONSIBILITY", leaseStartDate: "LEASE_START_DATE", leaseEndDate: "LEASE_END_DATE",
    city: "CITY", docDate: "DOC_DATE",
  },
  "employment-contract": {
    employer: "EMPLOYER", employerAddress: "EMPLOYER_ADDRESS",
    employee: "EMPLOYEE", employeeId: "EMPLOYEE_ID", employeeAddress: "EMPLOYEE_ADDRESS", bankAccount: "BANK_ACCOUNT",
    position: "POSITION", workingHours: "WORKING_HOURS", salary: "SALARY", salaryPaymentMethod: "SALARY_PAYMENT_METHOD",
    startDate: "START_DATE", endDate: "END_DATE",
    city: "CITY", docDate: "DOC_DATE",
  },
  "power-of-attorney": {
    principal: "PRINCIPAL", principalAddress: "PRINCIPAL_ADDRESS",
    agent: "AGENT", agentAddress: "AGENT_ADDRESS", scope: "SCOPE",
    city: "CITY", docDate: "DOC_DATE",
  },
  "termination-notice": {
    employer: "EMPLOYER", employee: "EMPLOYEE", employeeId: "EMPLOYEE_ID", employeeAddress: "EMPLOYEE_ADDRESS",
    noticeDate: "NOTICE_DATE", reason: "REASON", lastDay: "LAST_DAY", unusedLeaveDays: "UNUSED_LEAVE_DAYS",
    compensationAmount: "COMPENSATION_AMOUNT",
    city: "CITY", docDate: "DOC_DATE",
  },
  "service-agreement": {
    executor: "EXECUTOR", executorAddress: "EXECUTOR_ADDRESS", executorPhone: "EXECUTOR_PHONE",
    client: "CLIENT", clientAddress: "CLIENT_ADDRESS", clientPhone: "CLIENT_PHONE",
    serviceDescription: "SERVICE_DESCRIPTION", serviceStartDate: "SERVICE_START_DATE", serviceEndDate: "SERVICE_END_DATE",
    deadline: "DEADLINE", price: "PRICE",
    paymentMethod: "PAYMENT_METHOD", bankAccount: "BANK_ACCOUNT",
    city: "CITY", docDate: "DOC_DATE",
  },
  "claim-letter": {
    senderName: "SENDER_NAME", senderAddress: "SENDER_ADDRESS", senderPhone: "SENDER_PHONE",
    recipientName: "RECIPIENT_NAME", recipientAddress: "RECIPIENT_ADDRESS",
    grounds: "GROUNDS", demand: "DEMAND", amount: "AMOUNT",
    paymentMethod: "PAYMENT_METHOD", bankAccount: "BANK_ACCOUNT", deadline: "DEADLINE",
    city: "CITY", docDate: "DOC_DATE",
  },
  "debt-claim": {
    creditorName: "CREDITOR_NAME", creditorAddress: "CREDITOR_ADDRESS", creditorPhone: "CREDITOR_PHONE",
    debtorName: "DEBTOR_NAME", debtorAddress: "DEBTOR_ADDRESS",
    debtBasis: "DEBT_BASIS", principalAmount: "PRINCIPAL_AMOUNT", interestAmount: "INTEREST_AMOUNT",
    totalAmount: "TOTAL_AMOUNT", originalDueDate: "ORIGINAL_DUE_DATE", newDeadline: "NEW_DEADLINE",
    paymentMethod: "PAYMENT_METHOD", bankAccount: "BANK_ACCOUNT",
    city: "CITY", docDate: "DOC_DATE",
  },
  "child-travel-consent": {
    parentName: "PARENT_NAME", parentId: "PARENT_ID", parentAddress: "PARENT_ADDRESS", parentPhone: "PARENT_PHONE",
    childName: "CHILD_NAME", childDob: "CHILD_DOB", childDocument: "CHILD_DOCUMENT",
    escort: "ESCORT", destination: "DESTINATION", travelStartDate: "TRAVEL_START_DATE", travelEndDate: "TRAVEL_END_DATE",
    otherParentStatus: "OTHER_PARENT_STATUS",
    city: "CITY", docDate: "DOC_DATE",
  },
  invoice: {
    invoiceNumber: "INVOICE_NUMBER", seller: "SELLER", sellerAddress: "SELLER_ADDRESS",
    buyer: "BUYER", buyerAddress: "BUYER_ADDRESS", items: "ITEMS", totalAmount: "TOTAL_AMOUNT",
    dueDate: "DUE_DATE", paymentMethod: "PAYMENT_METHOD", bankAccount: "BANK_ACCOUNT",
    city: "CITY", docDate: "DOC_DATE",
  },
  "acceptance-act": {
    actNumber: "ACT_NUMBER", provider: "PROVIDER", providerAddress: "PROVIDER_ADDRESS",
    receiver: "RECEIVER", receiverAddress: "RECEIVER_ADDRESS",
    contractRef: "CONTRACT_REF", subjectDescription: "SUBJECT_DESCRIPTION", amount: "AMOUNT",
    bankAccount: "BANK_ACCOUNT", objections: "OBJECTIONS",
    city: "CITY", docDate: "DOC_DATE",
  },
};

/** Invoice currency options offered by the "currency" select field. Falls
 * back to ₾ (GEL) — the Georgian-first default — for any unset/unrecognized
 * value, e.g. a document generated before this field existed. */
const CURRENCY_OPTIONS = ["₾", "$", "€"];

function resolveCurrencySymbol(raw: string): string {
  return CURRENCY_OPTIONS.includes(raw) ? raw : "₾";
}

/** Appends the invoice's selected currency symbol to a plain amount string,
 * e.g. "500" + "$" -> "500 $". Returns "" for a blank amount so it still
 * renders through fillTemplate's generic "—" missing-value fallback. */
function formatAmountWithCurrency(amountRaw: string, currencySymbol: string): string {
  const amount = amountRaw.trim();
  return amount ? `${amount} ${currencySymbol}` : "";
}

/** Georgian law requires domestic settlements to be made in GEL. When the
 * user selects a foreign display currency (USD/EUR), the payment/fee clause
 * must state that actual settlement still happens in GEL at the National
 * Bank of Georgia's rate on the payment date. Returns "" for GEL (or an
 * unset/unrecognized value), and otherwise a sentence with a LEADING SPACE
 * so it can be appended directly onto the end of the preceding amount
 * sentence (same convention as buildProbationClause). */
function buildCurrencyEquivalenceClause(currencySymbol: string, locale: Locale): string {
  if (currencySymbol !== "$" && currencySymbol !== "€") return "";
  return locale === "en"
    ? " Settlement shall be made in the national currency of Georgia (GEL), at the official exchange rate of the National Bank of Georgia in effect on the date of payment."
    : " ანგარიშწორება განხორციელდება საქართველოს ეროვნული ვალუტით (ლარით), გადახდის დღეს არსებული საქართველოს ეროვნული ბანკის ოფიციალური გაცვლითი კურსის შესაბამისად.";
}

/**
 * Turns the invoice's freeform "one item per line" textarea input into a
 * tab-separated table block (header + rows), which `DocumentResultPanel` and
 * `export-document.ts` render as real table columns instead of running text.
 * Expected line format: "description; quantity; unit price" — quantity ×
 * unit price is auto-computed into a line total when both parse as numbers.
 * Unit price and line total are shown with the invoice's selected currency.
 */
function buildInvoiceItemsTable(raw: string, locale: Locale, currencySymbol: string): string {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return "—";

  const header = (
    locale === "en"
      ? ["Description", "Quantity", "Unit price", "Total"]
      : ["დასახელება", "რაოდენობა", "ერთ. ფასი", "ჯამი"]
  ).join("\t");
  const rows = lines.map((line) => {
    const [desc = "", qtyRaw = "", priceRaw = ""] = line.split(";").map((p) => p.trim());
    const qty = parseFloat(qtyRaw.replace(",", "."));
    const price = parseFloat(priceRaw.replace(",", "."));
    const priceDisplay = priceRaw ? `${priceRaw} ${currencySymbol}` : "";
    const total = Number.isFinite(qty) && Number.isFinite(price) ? `${(qty * price).toFixed(2)} ${currencySymbol}` : "";
    return [desc, qtyRaw, priceDisplay, total].join("\t");
  });
  return [header, ...rows].join("\n");
}

/** Formats a party's ID as a display fragment ending in ", " (e.g.
 * "პ/ნ **12345**, ") ready to be inserted right before an address label, or
 * "" when neither field is filled in — so the surrounding template text
 * never shows a dangling label or empty-value placeholder for an optional
 * ID. Bold markers are embedded directly since this string is injected into
 * already-rendered document content, not re-parsed as markdown source. */
function formatPartyIdLine(personalNumberRaw: string, idCodeRaw: string, locale: Locale): string {
  const personalNumber = personalNumberRaw.trim();
  const idCode = idCodeRaw.trim();
  const parts: string[] = [];
  if (personalNumber) parts.push(locale === "en" ? `personal no. **${personalNumber}**` : `პ/ნ **${personalNumber}**`);
  if (idCode) parts.push(locale === "en" ? `ID code **${idCode}**` : `ს/კ **${idCode}**`);
  if (parts.length === 0) return "";
  return `${parts.join(", ")}, `;
}

/** Builds the rental deposit clause. The statutory cap/interest/return-timing
 * rule always applies, so it's never omitted; if the user states a specific
 * deposit amount, that's stated first as a lead-in sentence. */
function buildDepositClause(amountRaw: string, locale: Locale): string {
  const amount = amountRaw.trim();
  const prefix = amount
    ? locale === "en"
      ? `The Tenant shall pay a security deposit in the amount of ${amount}. `
      : `დამქირავებელი იხდის უზრუნველყოფის თანხას (დეპოზიტს) ${amount}-ის ოდენობით. `
    : "";
  const base =
    locale === "en"
      ? "The Tenant may be required to provide a security deposit not exceeding three times the monthly rent; the statutory rate of interest shall accrue on the sum advanced, and it shall be returned to the Tenant no later than 10 calendar days after termination of the Agreement, less any amount for damage caused to the Premises or outstanding debt owed by the Tenant."
      : "დამქირავებელს შეიძლება დაეკისროს ვალდებულების უზრუნველყოფის თანხის (დეპოზიტის) წარდგენა, რომელიც არ აღემატება ერთი თვის ქირის სამმაგ ოდენობას; წინასწარ გადახდილ თანხას ერიცხება კანონით დადგენილი პროცენტი და ბრუნდება დამქირავებელს ხელშეკრულების დასრულებიდან არაუგვიანეს 10 კალენდარული დღისა, ფართისთვის მიყენებული ზიანის ან წარმოშობილი დავალიანების არსებობის შემთხვევაში — შესაბამისი თანხის გამოკლებით.";
  return prefix + base;
}

/** Builds the employment contract's term clause. Defaults to an indefinite
 * term (the statutory default) unless the user gave an end date, in which
 * case the fixed-term sentence is used instead — referencing [START_DATE]/
 * [END_DATE] as literal tokens, which the later fillTemplate pass resolves
 * from the already-collected raw answers. */
function buildEmploymentTermClause(hasEndDate: boolean, locale: Locale): string {
  if (!hasEndDate) {
    return locale === "en"
      ? "This Agreement is concluded for an indefinite term, unless the Parties agree otherwise in writing."
      : "ხელშეკრულება დადებულია განუსაზღვრელი ვადით, თუ მხარეები წერილობით სხვაგვარად არ შეთანხმდებიან.";
  }
  return locale === "en"
    ? "This Agreement is concluded for a fixed term, from **[START_DATE]** until **[END_DATE]**."
    : "ხელშეკრულება დადებულია განსაზღვრული ვადით, **[START_DATE]**-დან **[END_DATE]**-მდე.";
}

/** Builds the employment contract's probation-period sentence. Omitted
 * entirely unless the user states a period, ending in a leading space so it
 * can be appended directly onto the preceding sentence in clause 1. */
function buildProbationClause(periodRaw: string, locale: Locale): string {
  const period = periodRaw.trim();
  if (!period) return "";
  return locale === "en"
    ? ` The Employee shall be subject to a probation period of ${period}.`
    : ` დასაქმებულს განესაზღვრება გამოსაცდელი ვადა: ${period}.`;
}

/** Builds the power of attorney's validity-period clause. If the principal
 * states a period (a duration or an end date, free text), it's quoted
 * directly; otherwise states explicitly that no period was set, matching the
 * template's separate termination clause ("valid until revoked"). */
function buildValidityClause(periodRaw: string, locale: Locale): string {
  const period = periodRaw.trim();
  if (period) {
    return locale === "en"
      ? `This power of attorney is valid: **${period}**.`
      : `მინდობილობის მოქმედების ვადაა: **${period}**.`;
  }
  return locale === "en"
    ? "No validity period has been specified; accordingly, this power of attorney remains valid until revoked."
    : "მინდობილობის მოქმედების ვადა არ არის განსაზღვრული — შესაბამისად, იგი მოქმედებს გაუქმებამდე.";
}

/** Builds the power of attorney's substitution clause. Defaults to "no
 * right of substitution" (the conservative default — under Georgian civil
 * law a representative generally may not delegate authority to a third
 * party absent express authorization), and only grants the right when the
 * principal explicitly checks the toggle. */
function buildSubstitutionClause(hasRight: boolean, locale: Locale): string {
  if (hasRight) {
    return locale === "en"
      ? "The Agent has the right to substitute (delegate) the authority granted under this power of attorney to a third person, except where directly restricted by law."
      : "მინდობილ პირს უფლება აქვს გადასცეს (გადაანდოს) ამ მინდობილობით მინიჭებული უფლებამოსილება მესამე პირს, გარდა კანონმდებლობით პირდაპირ გათვალისწინებული შემთხვევებისა.";
  }
  return locale === "en"
    ? "The Agent does not have the right to substitute (delegate) the authority granted under this power of attorney to a third person."
    : "მინდობილ პირს არ აქვს უფლება გადასცეს (გადაანდოს) ამ მინდობილობით მინიჭებული უფლებამოსილება მესამე პირს.";
}

/** Replaces each `[TOKEN]` in `body` with its computed value (plain string
 * substitution, not regex) — used for placeholders whose value is built in
 * code (e.g. an ID line, a conditional clause) rather than echoed from a
 * raw form answer, so an intentionally blank result doesn't fall through to
 * fillTemplate's generic "—" missing-value fallback. */
function injectComputed(body: string, replacements: Record<string, string>): string {
  let out = body;
  for (const [token, value] of Object.entries(replacements)) {
    out = out.split(`[${token}]`).join(value);
  }
  return out;
}

/** Add `days` calendar days to an ISO ("YYYY-MM-DD") date string, returning
 * an ISO date string. Returns "" if `iso` doesn't parse, so callers can fall
 * back to the standard "—" empty-value rendering. */
function addCalendarDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
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
  answers: Record<string, string>,
  locale: Locale = "ka"
): { content: string; legalBasis: string } {
  const map = FIELD_MAP[type];
  const values: Record<string, string> = {};
  for (const [formKey, placeholder] of Object.entries(map)) {
    values[placeholder] = answers[formKey] ?? "";
  }
  if (type === "termination-notice") {
    values.SETTLEMENT_DEADLINE = addCalendarDays(answers.lastDay ?? "", 7);
  }
  if (type === "invoice") {
    const currencySymbol = resolveCurrencySymbol((answers.currency ?? "").trim());
    values.ITEMS = buildInvoiceItemsTable(answers.items ?? "", locale, currencySymbol);
    values.TOTAL_AMOUNT = formatAmountWithCurrency(answers.totalAmount ?? "", currencySymbol);
  }
  if (type === "rental-agreement") {
    const currencySymbol = resolveCurrencySymbol((answers.currency ?? "").trim());
    values.RENT = formatAmountWithCurrency(answers.rent ?? "", currencySymbol);
  }
  if (type === "employment-contract") {
    const currencySymbol = resolveCurrencySymbol((answers.currency ?? "").trim());
    values.SALARY = formatAmountWithCurrency(answers.salary ?? "", currencySymbol);
  }
  if (type === "service-agreement") {
    const currencySymbol = resolveCurrencySymbol((answers.currency ?? "").trim());
    values.PRICE = formatAmountWithCurrency(answers.price ?? "", currencySymbol);
    values.NOTICE_PERIOD_DAYS = (answers.terminationNoticePeriod ?? "").trim() || "5";
  }
  if (type === "claim-letter") {
    const currencySymbol = resolveCurrencySymbol((answers.currency ?? "").trim());
    values.AMOUNT = formatAmountWithCurrency(answers.amount ?? "", currencySymbol);
  }
  if (type === "debt-claim") {
    const currencySymbol = resolveCurrencySymbol((answers.currency ?? "").trim());
    values.PRINCIPAL_AMOUNT = formatAmountWithCurrency(answers.principalAmount ?? "", currencySymbol);
  }
  if (type === "child-travel-consent") {
    values.ESCORT = (answers.escort ?? "").trim() || (locale === "en" ? "Traveling alone (unaccompanied)" : "დამოუკიდებლად (მოგზაურობს მარტო)");
  }
  if (type === "acceptance-act") {
    const currencySymbol = resolveCurrencySymbol((answers.currency ?? "").trim());
    values.AMOUNT = formatAmountWithCurrency(answers.amount ?? "", currencySymbol);
  }

  const computed: Record<string, string> = {};
  if (type === "invoice") {
    computed.SELLER_ID_LINE = formatPartyIdLine(answers.sellerPersonalNumber ?? "", answers.sellerIdCode ?? "", locale);
    computed.BUYER_ID_LINE = formatPartyIdLine(answers.buyerPersonalNumber ?? "", answers.buyerIdCode ?? "", locale);
    computed.CURRENCY_CLAUSE = buildCurrencyEquivalenceClause(resolveCurrencySymbol((answers.currency ?? "").trim()), locale);
  }
  if (type === "employment-contract") {
    computed.EMPLOYER_ID_LINE = formatPartyIdLine(answers.employerPersonalNumber ?? "", answers.employerIdCode ?? "", locale);
    computed.EMPLOYMENT_TERM_CLAUSE = buildEmploymentTermClause(!!(answers.endDate ?? "").trim(), locale);
    computed.PROBATION_CLAUSE = buildProbationClause(answers.probationPeriod ?? "", locale);
    computed.CURRENCY_CLAUSE = buildCurrencyEquivalenceClause(resolveCurrencySymbol((answers.currency ?? "").trim()), locale);
  }
  if (type === "service-agreement") {
    computed.EXECUTOR_ID_LINE = formatPartyIdLine(answers.executorPersonalNumber ?? "", answers.executorIdCode ?? "", locale);
    computed.CLIENT_ID_LINE = formatPartyIdLine(answers.clientPersonalNumber ?? "", answers.clientIdCode ?? "", locale);
    computed.CURRENCY_CLAUSE = buildCurrencyEquivalenceClause(resolveCurrencySymbol((answers.currency ?? "").trim()), locale);
  }
  if (type === "acceptance-act") {
    computed.PROVIDER_ID_LINE = formatPartyIdLine(answers.providerPersonalNumber ?? "", answers.providerIdCode ?? "", locale);
    computed.RECEIVER_ID_LINE = formatPartyIdLine(answers.receiverPersonalNumber ?? "", answers.receiverIdCode ?? "", locale);
    computed.CURRENCY_CLAUSE = buildCurrencyEquivalenceClause(resolveCurrencySymbol((answers.currency ?? "").trim()), locale);
  }
  if (type === "rental-agreement") {
    computed.LANDLORD_ID_LINE = formatPartyIdLine(answers.landlordPersonalNumber ?? "", answers.landlordIdCode ?? "", locale);
    computed.TENANT_ID_LINE = formatPartyIdLine(answers.tenantPersonalNumber ?? "", answers.tenantIdCode ?? "", locale);
    computed.DEPOSIT_CLAUSE = buildDepositClause(answers.depositAmount ?? "", locale);
    computed.CURRENCY_CLAUSE = buildCurrencyEquivalenceClause(resolveCurrencySymbol((answers.currency ?? "").trim()), locale);
  }
  if (type === "power-of-attorney") {
    computed.PRINCIPAL_ID_LINE = formatPartyIdLine(answers.principalPersonalNumber ?? "", answers.principalIdCode ?? "", locale);
    computed.AGENT_ID_LINE = formatPartyIdLine(answers.agentPersonalNumber ?? "", answers.agentIdCode ?? "", locale);
    computed.VALIDITY_CLAUSE = buildValidityClause(answers.validityPeriod ?? "", locale);
    computed.SUBSTITUTION_CLAUSE = buildSubstitutionClause(answers.substitutionRight === "true", locale);
  }
  if (type === "claim-letter") {
    computed.SENDER_ID_LINE = formatPartyIdLine(answers.senderPersonalNumber ?? "", answers.senderIdCode ?? "", locale);
    computed.CURRENCY_CLAUSE = buildCurrencyEquivalenceClause(resolveCurrencySymbol((answers.currency ?? "").trim()), locale);
  }
  if (type === "debt-claim") {
    computed.CREDITOR_ID_LINE = formatPartyIdLine(answers.creditorPersonalNumber ?? "", answers.creditorIdCode ?? "", locale);
    computed.CURRENCY_CLAUSE = buildCurrencyEquivalenceClause(resolveCurrencySymbol((answers.currency ?? "").trim()), locale);
  }

  const def = TEMPLATES[type];
  const rawBody = locale === "en" ? def.bodyEn : def.body;
  const chosenBody = injectComputed(rawBody, computed);
  const chosenLegalBasis = locale === "en" ? def.legalBasisEn : def.legalBasis;
  // A computed placeholder that resolves to "" (e.g. an omitted late-penalty
  // clause) can leave behind a blank paragraph; collapse it so removing an
  // optional clause never shows as an empty gap in the document.
  const content = fillTemplate(chosenBody, values).replace(/\n{3,}/g, "\n\n");
  return { content, legalBasis: chosenLegalBasis };
}
