export type PromoLine = {
  id: string;
  text: string;
};

/** Work-ok. Wrestling. Nothing you would not say in front of Karen. */
export const PROMO_LINES: PromoLine[] = [
  { id: "chair", text: "Bring a chair. You will need it." },
  { id: "scan", text: "Sit down. The scan already told on you." },
  { id: "green", text: "I packed five greens. Did you?" },
  { id: "aisle", text: "Save me a spot in the aisle." },
  { id: "follow", text: "Your follow-up cannot save you this week." },
  { id: "ticket", text: "That ticket is walking out with me." },
  { id: "bell", text: "Hear that bell? It is for you." },
  { id: "print", text: "I have the print. You have the excuse." },
  { id: "floor", text: "Hold my floor. I will be right back." },
  { id: "cart", text: "Your cart is loud. My card is louder." },
  { id: "why", text: "Ask me why I win. I already know yours." },
  { id: "see", text: "See you Friday. Bring a better week." },
];

export const PROMO_BY_ID = Object.fromEntries(PROMO_LINES.map((l) => [l.id, l])) as Record<
  string,
  PromoLine
>;
