// Reglas keyword→categoría. Categorías = las de EXPENSE_CATEGORIES/INCOME_CATEGORIES
// en src/lib/movements-api.ts. Orden: específicas antes que genéricas (primer match gana).
type Rule = { keywords: string[]; category: string };

const EXPENSE_RULES: Rule[] = [
  { category: "Suscripciones", keywords: ["NETFLIX", "SPOTIFY", "HBO", "DISNEY", "AMAZON PRIME", "PRIME VIDEO", "YOUTUBE", "ICLOUD", "APPLE.COM/BILL", "CHATGPT", "OPENAI", "GITHUB", "NOTION"] },
  { category: "Comida", keywords: ["MERCADONA", "LIDL", "CARREFOUR", "DIA ", "ALDI", "CONSUM", "EROSKI", "ALCAMPO", "HIPERCOR", "SUPERCOR"] },
  { category: "Comer fuera", keywords: ["GLOVO", "UBER EATS", "JUST EAT", "JUSTEAT", "TELEPIZZA", "DOMINOS", "MCDONALD", "BURGER KING", "GOIKO", "KFC", "RESTAURANTE"] },
  { category: "Café", keywords: ["STARBUCKS", "CAFE "] },
  { category: "Hogar", keywords: ["IBERDROLA", "ENDESA", "NATURGY", "GAS NATURAL", "CANAL ISABEL", " AGUA", "COMUNIDAD", "ALQUILER", "IKEA", "LEROY MERLIN"] },
  { category: "Coche", keywords: ["GASOLINA", "REPSOL", "CEPSA", "GALP", "PARKING", "ITV", "PEAJE", "AUTOPISTA", "TALLER"] },
  { category: "Transporte", keywords: ["RENFE", "METRO ", "EMT ", "ALSA", "UBER", "CABIFY", "BOLT", "FREENOW", "BICIMAD"] },
  { category: "Salud", keywords: ["FARMACIA", "CLINICA", "DENTISTA", "HOSPITAL", "SANITAS", "ADESLAS"] },
  { category: "Gimnasio", keywords: ["GIMNASIO", "GYM", "BASIC FIT", "BASICFIT", "MCFIT", "ALTAFIT"] },
  { category: "Deporte", keywords: ["DECATHLON", "NIKE", "ADIDAS"] },
  { category: "Ropa", keywords: ["ZARA", "H&M", "PRIMARK", "BERSHKA", "PULL", "MANGO", "UNIQLO", "SHEIN"] },
  { category: "Tecnología", keywords: ["AMAZON", "MEDIAMARKT", "MEDIA MARKT", "PCCOMPONENTES", "APPLE STORE", "ALIEXPRESS", "FNAC"] },
  { category: "Formación", keywords: ["UDEMY", "COURSERA", "DOMESTIKA", "PLATZI", "MATRICULA", "UNIVERSIDAD"] },
  { category: "Impuestos", keywords: ["HACIENDA", "AEAT", "IMPUESTO", "TRIBUTO", " IBI", "TGSS", "SEGURIDAD SOCIAL"] },
  { category: "Ocio", keywords: ["CINE", "CINESA", "YELMO", "TEATRO", "TICKETMASTER", "STEAM", "PLAYSTATION", "XBOX", "NINTENDO"] },
  { category: "Viaje", keywords: ["BOOKING", "AIRBNB", "RYANAIR", "IBERIA", "VUELING", "HOTEL", "EXPEDIA", "EDREAMS"] },
  { category: "Cuidado personal", keywords: ["PELUQUERIA", "BARBERIA", "SEPHORA", "PRIMOR", "DOUGLAS"] },
];

const INCOME_RULES: Rule[] = [
  { category: "Nómina", keywords: ["NOMINA", "NÓMINA", "PAYROLL"] },
  { category: "Salario", keywords: ["SALARIO"] },
  { category: "Ticket restaurante", keywords: ["TICKET RESTAURANTE", "TARJETA RESTAURANTE", "EDENRED", "SODEXO"] },
];

export function categorize(description: string, type: "income" | "expense"): string {
  const d = description.toUpperCase();
  const rules = type === "income" ? INCOME_RULES : EXPENSE_RULES;
  for (const rule of rules) {
    if (rule.keywords.some((k) => d.includes(k))) return rule.category;
  }
  return "Sin categoría";
}
