import type { Locale } from "@/lib/i18n/config";

export type FieldType = "text" | "textarea" | "date" | "partyId";
export type QuestionField = {
  key: string;
  label: string;
  labelEn: string;
  type: FieldType;
  required?: boolean;
  /** Only for type "partyId": the two answer keys the toggle switches between. */
  personalKey?: string;
  idCodeKey?: string;
};

/** Builds a "partyId" field: a single toggle (personal number vs. identification
 * code) that shows one input at a time, so a party that can be either an
 * individual or a legal entity doesn't need two always-visible fields. */
function partyIdField(role: string, label: string, labelEn: string): QuestionField {
  return {
    key: `${role}Id`,
    label,
    labelEn,
    type: "partyId",
    personalKey: `${role}PersonalNumber`,
    idCodeKey: `${role}IdCode`,
  };
}

export const COMMON_FIELDS: QuestionField[] = [
  { key: "city", label: "ქალაქი", labelEn: "City", type: "text", required: true },
  { key: "docDate", label: "დოკუმენტის თარიღი", labelEn: "Document date", type: "date", required: true },
];

export const QUESTION_SCHEMAS: Record<string, QuestionField[]> = {
  complaint: [
    { key: "yourName", label: "შენი სახელი და გვარი", labelEn: "Your full name", type: "text", required: true },
    partyIdField("your", "შენი პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Your personal number or identification code"),
    { key: "yourAddress", label: "შენი მისამართი", labelEn: "Your address", type: "text", required: true },
    { key: "respondent", label: "ვის ეხება საჩივარი", labelEn: "Who the complaint concerns", type: "text", required: true },
    { key: "amount", label: "თანხა/ზიანი (ასეთის არსებობისას)", labelEn: "Amount/damages (if any)", type: "text" },
    { key: "paymentMethod", label: "გადახდის მეთოდი (ნაღდი/საბანკო გადარიცხვა) — თანხის მოთხოვნისას", labelEn: "Payment method (cash/bank transfer) — if requesting payment", type: "text" },
    { key: "bankAccount", label: "საბანკო ანგარიშის № (თუ გადარიცხვას ითხოვ)", labelEn: "Bank account No. (if requesting a transfer)", type: "text" },
    { key: "incidentDate", label: "მოვლენის თარიღი", labelEn: "Date of incident", type: "date" },
  ],
  "rental-agreement": [
    { key: "landlord", label: "გამქირავებელი (სახელი, გვარი)", labelEn: "Landlord (full name)", type: "text", required: true },
    partyIdField("landlord", "გამქირავებლის პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Landlord's personal number or identification code"),
    { key: "landlordAddress", label: "გამქირავებლის მისამართი", labelEn: "Landlord's address", type: "text", required: true },
    { key: "landlordPhone", label: "გამქირავებლის ტელეფონი", labelEn: "Landlord's phone number", type: "text" },
    { key: "bankAccount", label: "საბანკო ანგარიშის № (თუ გადარიცხვაა)", labelEn: "Bank account No. (if by transfer)", type: "text" },
    { key: "tenant", label: "დამქირავებელი (სახელი, გვარი)", labelEn: "Tenant (full name)", type: "text", required: true },
    partyIdField("tenant", "დამქირავებლის პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Tenant's personal number or identification code"),
    { key: "tenantAddress", label: "დამქირავებლის მისამართი", labelEn: "Tenant's address", type: "text", required: true },
    { key: "tenantPhone", label: "დამქირავებლის ტელეფონი", labelEn: "Tenant's phone number", type: "text" },
    { key: "address", label: "ბინის მისამართი", labelEn: "Property address", type: "text", required: true },
    { key: "rent", label: "ქირის ოდენობა", labelEn: "Rent amount", type: "text", required: true },
    { key: "rentDueDate", label: "ქირის გადახდის რიცხვი (მაგ. ყოველი თვის 5 რიცხვამდე)", labelEn: "Rent payment due date (e.g. by the 5th of each month)", type: "text", required: true },
    { key: "paymentMethod", label: "ქირის გადახდის მეთოდი (ნაღდი/საბანკო გადარიცხვა)", labelEn: "Rent payment method (cash/bank transfer)", type: "text", required: true },
    { key: "depositAmount", label: "დეპოზიტის ოდენობა (არასავალდებულო)", labelEn: "Security deposit amount (optional)", type: "text" },
    { key: "utilitiesResponsibility", label: "კომუნალური გადასახადების გადამხდელი მხარე", labelEn: "Party responsible for utility bills", type: "text" },
    { key: "leaseStartDate", label: "ქირავნობის დაწყების თარიღი", labelEn: "Lease start date", type: "date", required: true },
    { key: "leaseEndDate", label: "ქირავნობის დასრულების თარიღი", labelEn: "Lease end date", type: "date", required: true },
  ],
  "employment-contract": [
    { key: "employer", label: "დამსაქმებელი", labelEn: "Employer", type: "text", required: true },
    partyIdField("employer", "დამსაქმებლის პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Employer's personal number or identification code"),
    { key: "employerAddress", label: "დამსაქმებლის მისამართი", labelEn: "Employer's address", type: "text", required: true },
    { key: "employee", label: "თანამშრომელი", labelEn: "Employee", type: "text", required: true },
    { key: "employeeId", label: "თანამშრომლის პირადი ნომერი (P/N)", labelEn: "Employee's personal number (P/N)", type: "text", required: true },
    { key: "employeeAddress", label: "თანამშრომლის მისამართი", labelEn: "Employee's address", type: "text", required: true },
    { key: "bankAccount", label: "თანამშრომლის საბანკო ანგარიშის № (თუ გადარიცხვაა)", labelEn: "Employee's bank account No. (if by transfer)", type: "text" },
    { key: "position", label: "პოზიცია", labelEn: "Position", type: "text", required: true },
    { key: "workingHours", label: "სამუშაო დრო / გრაფიკი (მაგ. კვირაში 40 საათი, 09:00-18:00)", labelEn: "Working hours / schedule (e.g. 40 hours per week, 09:00-18:00)", type: "text", required: true },
    { key: "probationPeriod", label: "გამოსაცდელი ვადა (არასავალდებულო)", labelEn: "Probation period (optional)", type: "text" },
    { key: "salary", label: "ხელფასი", labelEn: "Salary", type: "text", required: true },
    { key: "salaryPaymentMethod", label: "ხელფასის გადახდის მეთოდი (ნაღდი/საბანკო გადარიცხვა)", labelEn: "Salary payment method (cash/bank transfer)", type: "text", required: true },
    { key: "startDate", label: "დაწყების თარიღი", labelEn: "Start date", type: "date", required: true },
    { key: "endDate", label: "დასრულების თარიღი (ცარიელი, თუ ვადა განუსაზღვრელია)", labelEn: "End date (leave blank if indefinite)", type: "date" },
  ],
  "power-of-attorney": [
    { key: "principal", label: "მინდობელი", labelEn: "Principal", type: "text", required: true },
    partyIdField("principal", "მინდობელის პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Principal's personal number or identification code"),
    { key: "principalAddress", label: "მინდობელის მისამართი", labelEn: "Principal's address", type: "text", required: true },
    { key: "agent", label: "მინდობილი პირი", labelEn: "Agent (attorney-in-fact)", type: "text", required: true },
    partyIdField("agent", "მინდობილი პირის პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Agent's personal number or identification code"),
    { key: "agentAddress", label: "მინდობილი პირის მისამართი", labelEn: "Agent's address", type: "text", required: true },
    { key: "scope", label: "მინდობის ფარგლები", labelEn: "Scope of authority", type: "textarea", required: true },
  ],
  "demand-letter": [
    { key: "yourName", label: "შენი სახელი და გვარი", labelEn: "Your full name", type: "text", required: true },
    { key: "yourAddress", label: "შენი მისამართი", labelEn: "Your address", type: "text", required: true },
    { key: "recipient", label: "ადრესატი", labelEn: "Recipient", type: "text", required: true },
    { key: "amount", label: "მოთხოვნილი თანხა", labelEn: "Amount claimed", type: "text" },
    { key: "paymentMethod", label: "გადახდის სასურველი მეთოდი (ნაღდი/საბანკო გადარიცხვა)", labelEn: "Preferred payment method (cash/bank transfer)", type: "text" },
    { key: "bankAccount", label: "საბანკო ანგარიშის № (თუ გადარიცხვას ითხოვ)", labelEn: "Bank account No. (if requesting a transfer)", type: "text" },
    { key: "reason", label: "მოთხოვნის საფუძველი", labelEn: "Grounds for the demand", type: "textarea", required: true },
    { key: "deadline", label: "ვადა", labelEn: "Deadline", type: "text", required: true },
  ],
  "termination-notice": [
    { key: "employer", label: "დამსაქმებელი", labelEn: "Employer", type: "text", required: true },
    { key: "employee", label: "თანამშრომელი", labelEn: "Employee", type: "text", required: true },
    partyIdField("employee", "თანამშრომლის პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Employee's personal number or identification code"),
    { key: "employeeAddress", label: "თანამშრომლის მისამართი", labelEn: "Employee's address", type: "text", required: true },
    { key: "reason", label: "საფუძველი", labelEn: "Grounds", type: "text", required: true },
    { key: "lastDay", label: "ბოლო სამუშაო დღე", labelEn: "Last working day", type: "date", required: true },
    { key: "compensationAmount", label: "კომპენსაციის ოდენობა (კანონით გათვალისწინების შემთხვევაში)", labelEn: "Compensation amount (if provided by law)", type: "text" },
  ],
  "service-agreement": [
    { key: "executor", label: "შემსრულებელი (სახელი, გვარი / დასახელება)", labelEn: "Contractor (full name / entity name)", type: "text", required: true },
    partyIdField("executor", "შემსრულებლის პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Contractor's personal number or identification code"),
    { key: "executorAddress", label: "შემსრულებლის მისამართი", labelEn: "Contractor's address", type: "text", required: true },
    { key: "executorPhone", label: "შემსრულებლის ტელეფონი", labelEn: "Contractor's phone number", type: "text" },
    { key: "client", label: "დამკვეთი (სახელი, გვარი / დასახელება)", labelEn: "Client (full name / entity name)", type: "text", required: true },
    partyIdField("client", "დამკვეთის პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Client's personal number or identification code"),
    { key: "clientAddress", label: "დამკვეთის მისამართი", labelEn: "Client's address", type: "text", required: true },
    { key: "clientPhone", label: "დამკვეთის ტელეფონი", labelEn: "Client's phone number", type: "text" },
    { key: "serviceDescription", label: "მომსახურების აღწერა", labelEn: "Description of services", type: "textarea", required: true },
    { key: "deadline", label: "მომსახურების ვადა/ვადები", labelEn: "Service deadline(s)", type: "text", required: true },
    { key: "price", label: "საფასური", labelEn: "Fee", type: "text", required: true },
    { key: "paymentMethod", label: "გადახდის მეთოდი (ნაღდი/საბანკო გადარიცხვა)", labelEn: "Payment method (cash/bank transfer)", type: "text", required: true },
    { key: "bankAccount", label: "საბანკო ანგარიშის № (თუ გადარიცხვაა)", labelEn: "Bank account No. (if by transfer)", type: "text" },
  ],
  "claim-letter": [
    { key: "senderName", label: "გამომგზავნის სახელი და გვარი", labelEn: "Sender's full name", type: "text", required: true },
    partyIdField("sender", "გამომგზავნის პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Sender's personal number or identification code"),
    { key: "senderAddress", label: "გამომგზავნის მისამართი", labelEn: "Sender's address", type: "text", required: true },
    { key: "senderPhone", label: "გამომგზავნის ტელეფონი", labelEn: "Sender's phone number", type: "text" },
    { key: "recipientName", label: "ადრესატი (ვის ეგზავნება პრეტენზია)", labelEn: "Recipient (who the claim is addressed to)", type: "text", required: true },
    { key: "recipientAddress", label: "ადრესატის მისამართი", labelEn: "Recipient's address", type: "text" },
    { key: "grounds", label: "პრეტენზიის ფაქტობრივი საფუძველი", labelEn: "Factual grounds for the claim", type: "textarea", required: true },
    { key: "demand", label: "კონკრეტული მოთხოვნა", labelEn: "Specific demand", type: "textarea", required: true },
    { key: "amount", label: "მოთხოვნილი თანხა (ასეთის არსებობისას)", labelEn: "Amount claimed (if any)", type: "text" },
    { key: "paymentMethod", label: "გადახდის მეთოდი (ნაღდი/საბანკო გადარიცხვა)", labelEn: "Payment method (cash/bank transfer)", type: "text" },
    { key: "bankAccount", label: "საბანკო ანგარიშის № (თუ გადარიცხვას ითხოვ)", labelEn: "Bank account No. (if requesting a transfer)", type: "text" },
    { key: "deadline", label: "პასუხის/შესრულების ვადა", labelEn: "Deadline for response/compliance", type: "text", required: true },
  ],
  "debt-claim": [
    { key: "creditorName", label: "კრედიტორის სახელი და გვარი", labelEn: "Creditor's full name", type: "text", required: true },
    partyIdField("creditor", "კრედიტორის პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Creditor's personal number or identification code"),
    { key: "creditorAddress", label: "კრედიტორის მისამართი", labelEn: "Creditor's address", type: "text", required: true },
    { key: "creditorPhone", label: "კრედიტორის ტელეფონი", labelEn: "Creditor's phone number", type: "text" },
    { key: "debtorName", label: "მოვალის სახელი და გვარი", labelEn: "Debtor's full name", type: "text", required: true },
    { key: "debtorAddress", label: "მოვალის მისამართი", labelEn: "Debtor's address", type: "text", required: true },
    { key: "debtBasis", label: "დავალიანების საფუძველი (სესხის ხელშეკრულება, ხელწერილი, თარიღი და სხვ.)", labelEn: "Basis of the debt (loan agreement, promissory note, date, etc.)", type: "textarea", required: true },
    { key: "principalAmount", label: "ძირითადი თანხა", labelEn: "Principal amount", type: "text", required: true },
    { key: "interestAmount", label: "დარიცხული პროცენტი/პირგასამტეხლო (ასეთის არსებობისას)", labelEn: "Accrued interest/penalty (if any)", type: "text" },
    { key: "totalAmount", label: "სულ გადასახდელი თანხა", labelEn: "Total amount due", type: "text", required: true },
    { key: "originalDueDate", label: "დაბრუნების თავდაპირველი ვადა", labelEn: "Original due date for repayment", type: "date" },
    { key: "newDeadline", label: "ახალი ვადა დაფარვისთვის", labelEn: "New deadline for repayment", type: "text", required: true },
    { key: "paymentMethod", label: "გადახდის მეთოდი (ნაღდი/საბანკო გადარიცხვა)", labelEn: "Payment method (cash/bank transfer)", type: "text", required: true },
    { key: "bankAccount", label: "საბანკო ანგარიშის №", labelEn: "Bank account No.", type: "text" },
  ],
  "child-travel-consent": [
    { key: "parentName", label: "თანხმობის გამცემი მშობლის/კანონიერი წარმომადგენლის სახელი და გვარი", labelEn: "Full name of the consenting parent/legal guardian", type: "text", required: true },
    partyIdField("parent", "მშობლის პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Parent's personal number or identification code"),
    { key: "parentAddress", label: "მშობლის მისამართი", labelEn: "Parent's address", type: "text", required: true },
    { key: "parentPhone", label: "მშობლის ტელეფონი", labelEn: "Parent's phone number", type: "text" },
    { key: "childName", label: "არასრულწლოვნის სახელი და გვარი", labelEn: "Minor's full name", type: "text", required: true },
    { key: "childDob", label: "არასრულწლოვნის დაბადების თარიღი", labelEn: "Minor's date of birth", type: "date", required: true },
    { key: "childDocument", label: "არასრულწლოვნის პირადობის/პასპორტის № ", labelEn: "Minor's ID/passport No.", type: "text", required: true },
    { key: "escort", label: "თანმხლები პირი (სახელი, გვარი, პ/ნ) ან „დამოუკიდებლად“", labelEn: "Accompanying person (full name, personal No.) or \"traveling alone\"", type: "text", required: true },
    { key: "destination", label: "დანიშნულების ქვეყანა/ქვეყნები", labelEn: "Destination country/countries", type: "text", required: true },
    { key: "travelPeriod", label: "მოგზაურობის პერიოდი", labelEn: "Travel period", type: "text", required: true },
    { key: "otherParentStatus", label: "მეორე მშობლის თანხმობის სტატუსი (თანხმობა ცალკე მოცემულია / მშობელი გარდაცვლილია ან მშობლის უფლება შეზღუდულია / ერთადერთი კანონიერი წარმომადგენელია და სხვ.)", labelEn: "Status of the other parent's consent (given separately / parent deceased or parental rights restricted / sole legal guardian, etc.)", type: "textarea", required: true },
  ],
  invoice: [
    { key: "invoiceNumber", label: "ინვოისის №", labelEn: "Invoice No.", type: "text", required: true },
    { key: "seller", label: "გამომწერი (გამყიდველი/მომსახურების მიმწოდებელი)", labelEn: "Issuer (seller/service provider)", type: "text", required: true },
    partyIdField("seller", "გამომწერის პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Issuer's personal number or identification code"),
    { key: "sellerAddress", label: "გამომწერის მისამართი", labelEn: "Issuer's address", type: "text" },
    { key: "bankAccount", label: "საბანკო ანგარიშის №", labelEn: "Bank account No.", type: "text" },
    { key: "buyer", label: "მიმღები (გადამხდელი)", labelEn: "Recipient (payer)", type: "text", required: true },
    partyIdField("buyer", "მიმღების პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Recipient's personal number or identification code"),
    { key: "buyerAddress", label: "მიმღების მისამართი", labelEn: "Recipient's address", type: "text" },
    { key: "items", label: "საქონელი/მომსახურება", labelEn: "Goods/services", type: "textarea", required: true },
    { key: "totalAmount", label: "სულ გადასახდელი თანხა", labelEn: "Total amount due", type: "text", required: true },
    { key: "dueDate", label: "გადახდის ვადა", labelEn: "Payment due date", type: "date", required: true },
    { key: "paymentMethod", label: "გადახდის მეთოდი (ნაღდი/საბანკო გადარიცხვა)", labelEn: "Payment method (cash/bank transfer)", type: "text", required: true },
  ],
  "acceptance-act": [
    { key: "actNumber", label: "აქტის №", labelEn: "Act No.", type: "text" },
    { key: "provider", label: "მიმცემი მხარე (შემსრულებელი/მიმწოდებელი)", labelEn: "Transferring party (contractor/supplier)", type: "text", required: true },
    partyIdField("provider", "მიმცემის პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Transferring party's personal number or identification code"),
    { key: "providerAddress", label: "მიმცემის მისამართი", labelEn: "Transferring party's address", type: "text" },
    { key: "receiver", label: "მიმღები მხარე (დამკვეთი)", labelEn: "Receiving party (client)", type: "text", required: true },
    partyIdField("receiver", "მიმღები მხარის პირადი ნომერი ან საიდენტიფიკაციო კოდი", "Receiving party's personal number or identification code"),
    { key: "receiverAddress", label: "მიმღების მისამართი", labelEn: "Receiving party's address", type: "text" },
    { key: "contractRef", label: "საბაზისო ხელშეკრულების რეკვიზიტები (№, თარიღი)", labelEn: "Underlying contract details (No., date)", type: "text" },
    { key: "subjectDescription", label: "ჩაბარებული საქონლის/სამუშაოს/მომსახურების აღწერა", labelEn: "Description of goods/work/services delivered", type: "textarea", required: true },
    { key: "amount", label: "ღირებულება", labelEn: "Value", type: "text" },
    { key: "objections", label: "მხარეთა შენიშვნები/პრეტენზიები (ასეთის არარსებობისას — „არ არსებობს“)", labelEn: "Parties' remarks/objections (enter \"none\" if there are none)", type: "textarea", required: true },
  ],
};

export function fieldLabel(f: QuestionField, locale: Locale): string {
  return locale === "en" ? f.labelEn : f.label;
}
