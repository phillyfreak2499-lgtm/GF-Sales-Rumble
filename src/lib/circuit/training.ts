import { emptyStatuses, scorecard } from "./engine";
import type { Score, Scorecard } from "./types";
import { EXTRA_WEEKLY } from "./academy-extra";

export type TrainingSlide = {
  title: string;
  body: string;
  points?: string[];
};

export type TrainingQuestion = {
  prompt: string;
  choices: string[];
  answer: number;
  why: string;
};

export type TrainingModule = {
  id: string;
  weekNumber: number | null;
  title: string;
  kicker: string;
  opener: string;
  slides: TrainingSlide[];
  questions: TrainingQuestion[];
  passAt: number;
};

export type TrainingRecord = {
  fighterId: string;
  weekNumber: number;
  moduleId: string;
  passed: boolean;
  awarded: boolean;
  correct: number;
  total: number;
  attemptedAt: string;
};

export type QuizGrade = {
  moduleId: string;
  weekNumber: number | null;
  correct: number;
  total: number;
  passed: boolean;
  passAt: number;
  awarded: boolean;
  alreadyAwarded: boolean;
  mark: Array<{ index: number; pick: number; answer: number; ok: boolean; why: string }>;
};

const WEEKLY_CORE: TrainingModule[] = [
  {
    id: "week-1",
    weekNumber: 1,
    title: "Product Knowledge",
    kicker: "Week 1 · the workhorse",
    opener:
      "Before you can sell the system, you have to know what is in the bag. Strengthener. Maintainer. Relaxer. Know the difference, or do not step through the ropes.",
    slides: [
      {
        title: "Why product knowledge wins",
        body: "The highest-performing specialists always know the most about what they sell. Seventeen styles. One 3-Step System. Know the difference and you can show features, advantages, and benefits without guessing.",
        points: [
          "Know the differences and functions of each support",
          "Product knowledge is essential to selling",
          "The more you know, the more you can showcase FAB",
        ],
      },
      {
        title: "The 3-Step System",
        body: "Every support falls into one of three jobs. Worn together as a system, they help improve poor biomechanics that often cause foot, knee, hip, and back pain.",
        points: [
          "Strengthener — exercises and realigns. The workhorse / core of the line.",
          "Maintainer — keeps the alignment the Strengthener built, including in tighter shoes.",
          "Relaxer — a rest period. Thin enough for almost any shoe. No excuse not to wear it.",
        ],
      },
      {
        title: "Strengtheners",
        body: "Designed to place the foot in the ideal position. Stronger features, longer adjustment, and a real metatarsal rise — a mound that sits just behind the ball of the foot.",
        points: [
          "Styles: Max, Honeycomb, Classic, Slimline Strengthener, Diamond, Hug",
          "Classic is the most popular. Diamond is more flexible — better for flatter or sensitive feet.",
          "Max is the most firm. Not for very stiff or very flat feet.",
          "Honeycomb is more rigid than Classic or Diamond. Not available in narrow.",
        ],
      },
      {
        title: "Maintainers and Relaxers",
        body: "If the feet lose their ideal position every time they change shoes, the system takes longer to work. Maintainers hold the line. Relaxers let the feet rest without going unsupported.",
        points: [
          "Maintainers: Flex, Mid Flex, Miracle Flex, Ultra, TSS, Deluxe, Slimline Maintainer",
          "Lower arch, little or no metatarsal rise, flat heel platform and/or a heel cup",
          "Relaxers: Relaxer Flex, Skinny, Slimline Relaxer — worn last every day",
          "Relaxers have little to no adjustment period. The “you have no excuse not to wear it” pair.",
        ],
      },
      {
        title: "Features that do the work",
        body: "Clients do not buy a polymer shape. They buy what the feature does for the body.",
        points: [
          "Heel cup gathers the fat pad, absorbs shock, and can help align ankle → knee → hip → back. Deep cups are not for running.",
          "Metatarsal rise sits behind the ball, takes pressure off the toes and heel, and supports the plantar fascia.",
          "GeT is the patented S-shaped Slimline system. Heel platform (flat, no cup) gives mobility and works in open-heel shoes.",
          "The inner longitudinal arch is unique to each person. That is why a trained fitter matters.",
        ],
      },
      {
        title: "Fit: Brannock is a starting point",
        body: "Measure both feet. Compare heel-to-ball (arch length) with heel-to-toe. Then confirm on the foot. A print comparison — with and without — lets the client see the work.",
        points: [
          "Too long → extreme pressure in the ball of the foot",
          "Too short → extreme pressure in the center of the arch",
          "Correct fit forms to the foot with no gaps",
          "Never diagnose or prescribe when you show the Ideal Foot chart",
        ],
      },
    ],
    questions: [
      {
        prompt: "The 3-Step System is one of each of which three categories?",
        choices: [
          "Strengthener, Maintainer, Relaxer",
          "Classic, Flex, Skinny",
          "Brooks, OS1st, Med Massager",
          "Heel cup, metatarsal rise, heel platform",
        ],
        answer: 0,
        why: "Seventeen styles. Three jobs. Strengthener, Maintainer, Relaxer.",
      },
      {
        prompt: "Which step is the workhorse — the core of the product line?",
        choices: ["Maintainer", "Relaxer", "Strengthener", "Youth Sportflex"],
        answer: 2,
        why: "Strengtheners put the foot in the ideal position. They are the workhorse.",
      },
      {
        prompt: "Where does a metatarsal rise sit?",
        choices: [
          "Under the heel cup",
          "Just behind the ball of the foot",
          "Along the outer longitudinal arch only",
          "On top of the toes",
        ],
        answer: 1,
        why: "The rise is a mound that fits just behind the metatarsal heads — the ball.",
      },
      {
        prompt: "A support that is too long usually feels like…",
        choices: [
          "Nothing. Length does not matter.",
          "Extreme pressure in the center of the arch",
          "Extreme pressure in the ball of the foot",
          "The heel slipping out",
        ],
        answer: 2,
        why: "Too long = ball pressure. Too short = arch pressure.",
      },
      {
        prompt: "The Brannock Device is…",
        choices: [
          "The final word on size. Do not check the foot.",
          "A starting point. Confirm the fit on the foot.",
          "Only for Brooks shoes, never supports",
          "Used instead of a Harris Mat print",
        ],
        answer: 1,
        why: "Brannock gets you close. The foot on the support decides.",
      },
      {
        prompt: "A deep heel cup is generally a poor choice for…",
        choices: [
          "Someone with back pain who needs alignment",
          "Running or impact sports",
          "A client who wants more stability",
          "Gathering the fat pad under the heel",
        ],
        answer: 1,
        why: "Deep cups control motion. That is the opposite of what a runner needs.",
      },
      {
        prompt: "When are Relaxers typically worn in the 3-Step System?",
        choices: [
          "First thing in the morning, before the Strengthener",
          "Only on rest days",
          "Last every day — slippers, sandals, dress shoes",
          "Never. They are a youth-only product.",
        ],
        answer: 2,
        why: "Relaxers are the rest period at the end of the day, and they fit almost anything.",
      },
      {
        prompt: "Which Strengthener is the most popular, and which is more flexible for flatter or sensitive feet?",
        choices: [
          "Max is most popular. Honeycomb is more flexible.",
          "Classic is most popular. Diamond is more flexible.",
          "Hug is most popular. Slimline is more flexible.",
          "Honeycomb is most popular. Classic is more flexible.",
        ],
        answer: 1,
        why: "Classic is the workhorse seller. Diamond’s polymer and diamond structure give more side-to-side flex.",
      },
    ],
    passAt: 6,
  },
  {
    id: "week-2",
    weekNumber: 2,
    title: "Non-Tangible Value",
    kicker: "Week 2 · Rolex, not Walmart",
    opener:
      "Same category of product. Wildly different price. The question for the locker: what gives a client permission to invest two thousand dollars instead of twenty? It is not only the polymer. It is everything around it.",
    slides: [
      {
        title: "Price vs. value, same category",
        body: "A client only moves forward when value outweighs price in their mind. People already pay more for the same category when the experience says they should.",
        points: [
          "Walmart watch $20–40 vs Rolex steel $8,000–11,000+",
          "Walmart purse $15–35 vs Louis Vuitton $2,000–3,000+",
          "Walmart insoles $10–20 vs Good Feet $525 a support, $2,000+ a full system",
        ],
      },
      {
        title: "What non-tangible value is",
        body: "Everything the client sees, feels, experiences, and remembers that is NOT the physical product — and that multiplies or destroys the perceived value of that product.",
        points: [
          "It reinforces the tangible: supports, shoes, socks, Med Massager",
          "It is 100% controllable. No budget. No inventory.",
          "It is how we deliver a remarkable experience, every client, every time.",
        ],
      },
      {
        title: "The six controllable pillars",
        body: "Miss one and the $2,000 story starts to sound like $20.",
        points: [
          "1. Cart & product handling — highest leverage on perceived value",
          "2. Specialist appearance & presence — first 30–60 seconds",
          "3. Store environment — the first 10 seconds set the price",
          "4. Assessment, test walk & flow — smooth = expert",
          "5. Language & ownership — confidence protects the price",
          "6. Follow-up quality — turns a sale into a relationship",
        ],
      },
      {
        title: "Treat the cart like a Rolex",
        body: "Careless handling makes a $525 support feel like a $20 insole. A messy cart looks like a discount bin and invites the price objection.",
        points: [
          "Pristine, organized cart and fitting station. Always.",
          "Present every support, shoe, sock, and Med Massager deliberately",
          "Never toss supports. Never leave packaging scattered.",
          "The Rolex test: would a walk-in expect $2,000 — or $20?",
        ],
      },
      {
        title: "Language, flow, follow-up",
        body: "Never use discounting or uncertain language. Speak as the expert who owns the outcome. Follow-up should feel caring, not scripted.",
        points: [
          "Protect the Lifetime / Satisfaction Guarantee with full ownership",
          "Do not rush the demo. It should not feel retail.",
          "Standards do not drop on high-traffic or short-staffed days",
          "A personal check-in is how one sale becomes reviews and referrals",
        ],
      },
    ],
    questions: [
      {
        prompt: "Non-tangible value is…",
        choices: [
          "The polymer and the shoe, listed on the invoice",
          "Everything the client experiences that is not the physical product",
          "A coupon or a discount that lowers the price",
          "Only the Lifetime Guarantee paperwork",
        ],
        answer: 1,
        why: "If it is not the product itself and it changes how valuable the product feels — that is non-tangible.",
      },
      {
        prompt: "On the Blue Track comparison, a full Good Feet system sits around…",
        choices: ["$10–20", "$525 total", "$525 a support / $2,000+ a system", "The same as Walmart insoles"],
        answer: 2,
        why: "That is the number the experience has to earn. Walmart is $10–20.",
      },
      {
        prompt: "Which pillar has the highest leverage on perceived value in the module?",
        choices: [
          "Follow-up quality",
          "Cart and product handling",
          "The bathroom checklist",
          "How loud the music is",
        ],
        answer: 1,
        why: "A Rolex-level cart multiplies the product. A discount-bin cart kills it.",
      },
      {
        prompt: "The first 10 seconds in the store mostly set…",
        choices: [
          "The close script you will use",
          "Whether they like Brooks or Architek",
          "The price they expect to pay",
          "How many reviews they will leave",
        ],
        answer: 2,
        why: "Environment sets the price before you speak. Walmart-level first impression, Walmart-level permission.",
      },
      {
        prompt: "A client says the investment is high. The non-tangible move is…",
        choices: [
          "Offer 20% off so the math is easier",
          "Apologize for the price and remove items silently",
          "Lean on the experience you just delivered — cart, expertise, follow-up — without discounting",
          "Walk them to the door",
        ],
        answer: 2,
        why: "Discount language tells them it was never worth it. The experience is the proof.",
      },
      {
        prompt: "What does a messy cart communicate?",
        choices: [
          "We are busy, so we must be good",
          "This is ordinary / discount-bin energy",
          "The supports are more affordable",
          "Nothing. Clients do not notice the cart.",
        ],
        answer: 1,
        why: "Careless handling makes a $525 support feel like a $20 insole.",
      },
      {
        prompt: "Which language belongs in a premium store?",
        choices: [
          "I can probably do something on the price.",
          "This is part of the same solution. It is what it takes to keep you out of pain.",
          "The add-on is optional if you want it.",
          "Let me check if we have a coupon.",
        ],
        answer: 1,
        why: "Ownership language protects the price. Discount and “add-on” language give it away.",
      },
    ],
    passAt: 5,
  },
  {
    id: "week-3",
    weekNumber: 3,
    title: "The WHY WHY WHY Close",
    kicker: "Week 3 · value stays standing",
    opener:
      "The first close did not land. Most people start stripping the card. both sides of the equation shrink, and nobody pins. The YYY close is how you customize without looking like a salesperson.",
    slides: [
      {
        title: "The buying equation",
        body: "A client buys when perceived value is greater than perceived price. Everything you present adds to both. Your job is to build enough specific, personalized value that Value > Price feels obvious.",
        points: [
          "Tie every item to their pain, lifestyle, family, and goals",
          "Value is built in the demo — not at the end when the number appears",
          "They should feel helped, not sold",
        ],
      },
      {
        title: "The stepping-down trap",
        body: "“What if we take out the Med Massager? Okay, drop the 4th support…” You hope to land on a magic number. You remove price and the value they already saw. The gap never flips. Trust erodes.",
        points: [
          "You look like a salesperson — the #1 client fear",
          "Price and value shrink together",
          "The client walks thinking you were negotiating, not solving",
        ],
      },
      {
        title: "WHY #1 — Why are you here?",
        body: "Before you change anything, reconnect them to their own reason for walking in. Pain. How long. Family. Work. What they already tried.",
        points: [
          "Disarms defensiveness. You are listening, not pushing.",
          "Reminds both of you what success looks like",
          "Often reduces resistance enough that no step-down is needed",
        ],
      },
      {
        title: "WHY #2 — Why I showed you this",
        body: "Never remove an item without first explaining why it was in the original recommendation. Otherwise they think: “If I never needed it, why did you show it?” Answer in their head: salesperson.",
        points: [
          "Protects your credibility and professionalism",
          "Example: “I showed you the Med Massager because it helps circulation. You came in for knee pain. The supports do the heavy lifting.”",
        ],
      },
      {
        title: "WHY #3 — Why you will be okay",
        body: "This is where the math flips. Lower the perceived importance of the removed item. Keep the core huge. Price drops more than value.",
        points: [
          "“The supports are doing 95–99% of the work for the issue you described.”",
          "Reassure the customized solution still delivers the relief",
          "They can always add the complement later",
        ],
      },
      {
        title: "A partial solution is an incomplete solution",
        body: "From Complete Solution: we do not present a product and then upsell. We present one solution and name each component’s job. Nobody takes half a prescription.",
        points: [
          "Say “solution component,” never “add-on,” “extra,” or “upsell”",
          "Brooks carries the correction into the shoes they wear most",
          "OS1st protects comfort every hour. Med Massager extends recovery at home.",
        ],
      },
    ],
    questions: [
      {
        prompt: "A client buys when…",
        choices: [
          "Perceived price is higher than perceived value",
          "Perceived value is greater than perceived price",
          "You have removed enough items",
          "You offered a discount",
        ],
        answer: 1,
        why: "Value > Price. That is the whole sport.",
      },
      {
        prompt: "Why does traditional stepping-down fail?",
        choices: [
          "It raises the price",
          "It removes price and the value they already saw, so the gap never flips",
          "It makes the supports stronger",
          "Clients prefer a bigger package no matter what",
        ],
        answer: 1,
        why: "Both sides of the equation shrink. You still have Price ≥ Value — and you look like a salesperson.",
      },
      {
        prompt: "WHY #1 is…",
        choices: [
          "Explain why you showed the Med Massager",
          "Reconnect them to why they came in",
          "Tell them they will be okay without the item",
          "Ask if they want to think about it",
        ],
        answer: 1,
        why: "Re-anchor on their pain, family, work, and time. Then decide if anything needs to move.",
      },
      {
        prompt: "You should never remove an item until you have…",
        choices: [
          "Offered 10% off",
          "Explained why you showed it (WHY #2)",
          "Called a manager",
          "Taken the Med Massager off the cart silently",
        ],
        answer: 1,
        why: "WHY #2 protects credibility. Silent removal screams “I was just selling.”",
      },
      {
        prompt: "WHY #3 tells the client the supports are doing roughly…",
        choices: ["Half the work", "60% of the work", "75% of the work", "95–99% of the work"],
        answer: 3,
        why: "That is how value stays high while price drops. The core still does the job.",
      },
      {
        prompt: "Which phrase belongs in a complete-solution presentation?",
        choices: [
          "This is just an add-on if you want it.",
          "Let me upsell you the socks.",
          "This is a solution component. It is part of the same system.",
          "The extra is optional.",
        ],
        answer: 2,
        why: "“Add-on / extra / upsell” tells them the real product already happened. “Solution component” keeps one system.",
      },
      {
        prompt: "After a clean YYY, what should be true in the client’s mind?",
        choices: [
          "Price dropped and value dropped with it",
          "Price dropped, value stayed high, so Value > Price",
          "Nothing changed",
          "They feel you stripped the package",
        ],
        answer: 1,
        why: "That is the whole point of the three Whys. Customize without destroying value.",
      },
    ],
    passAt: 5,
  },
  {
    id: "week-4",
    weekNumber: 4,
    title: "Inquiries into Opportunities",
    kicker: "Week 4 · get them seated",
    opener:
      "Somebody walks in asking for a dress shoe we do not stock. That is not a no. That is a bell. Control the process, not every word. Get them in a chair. Let the questions do the selling.",
    slides: [
      {
        title: "Control the process, not the conversation",
        body: "You do not need to dominate every word. You need to steer toward seated, informed, and an imprint. Take it one step at a time.",
        points: [
          "Steer to topics that help both of you. “What are you looking for in a dress shoe?”",
          "Stay quiet when they give you gold. “My feet kill me by lunch” is not a moment to interrupt.",
          "Whoever asks the questions controls the conversation.",
        ],
      },
      {
        title: "The sale is made in the questions",
        body: "Get them talking more than you. They will talk themselves toward supports if you let them.",
        points: [
          "Open: “What problems do you have with your current shoes?”",
          "Listen: “So it sounds like your feet hurt a lot?”",
          "Guide: “Can we sit down and figure out what might work?”",
          "Goal: they reveal the need. You connect it to the system.",
        ],
      },
      {
        title: "Do not say no. Get them seated.",
        body: "Instead of “We don’t have dress shoes,” try “We focus on comfort solutions that might fit what you need.” First job is the chair. Then questions. Then an imprint. Do not rush the sale.",
        points: [
          "“I’d love to help. What are you hoping to find in a dress shoe?”",
          "“Something I can wear to work without my feet hurting.” → sit them down",
          "Passion has to be genuine. Believe it or they will not.",
        ],
      },
      {
        title: "Pitfalls",
        body: "Four ways this match gets dropped on the floor.",
        points: [
          "Saying “no” too fast — kills the conversation. Pivot to what we can do.",
          "Pushing too hard — let questions get them there",
          "Missing the gold — “My arches ache” is the opening, not small talk",
          "Talking too much — the client should speak more than you",
        ],
      },
      {
        title: "The floor script",
        body: "Customer: “Do you carry dress shoes?” You: “I’d love to help you with that. What are you hoping to find in a dress shoe?” They came for a shoe. They stay for the reason their feet hurt.",
      },
    ],
    questions: [
      {
        prompt: "When a guest asks for something we do not stock, the first job is…",
        choices: [
          "Say we do not have it and offer a rain check",
          "Control the process — questions, then a seat",
          "Hand them a brochure and walk away",
          "Start the close on a full system immediately",
        ],
        answer: 1,
        why: "Process, not a no. Get them talking, then get them seated.",
      },
      {
        prompt: "A client says “My feet kill me by lunchtime.” You should…",
        choices: [
          "Jump in with the 3-Step System speech",
          "Stay quiet and let them keep talking — that is gold",
          "Change the subject to Brooks",
          "Tell them that is normal",
        ],
        answer: 1,
        why: "Stay quiet on gold. They are handing you the reason they will buy.",
      },
      {
        prompt: "Instead of “We don’t have dress shoes,” say…",
        choices: [
          "No, sorry.",
          "We focus on comfort solutions that might fit what you need.",
          "Try the mall.",
          "We only sell inserts.",
        ],
        answer: 1,
        why: "Never lead with no. Pivot to what we can do.",
      },
      {
        prompt: "Who controls the conversation?",
        choices: [
          "Whoever talks the most",
          "Whoever asks the questions",
          "The person standing up",
          "Whoever quotes price first",
        ],
        answer: 1,
        why: "Questions steer. Speeches do not.",
      },
      {
        prompt: "The first small win on an inquiry is…",
        choices: [
          "Getting a credit card",
          "Getting them seated",
          "Getting a 5-star review",
          "Getting them to hold a support",
        ],
        answer: 1,
        why: "Start small. Chair, then questions, then imprint. Do not rush the sale.",
      },
      {
        prompt: "Passion works when it is…",
        choices: [
          "Loud, even if you do not believe it",
          "A script you recite the same way every time",
          "Genuine belief, tied to their specific need",
          "Saved for the close only",
        ],
        answer: 2,
        why: "If people like you they listen. If they trust you they buy. Fake energy does not build trust.",
      },
      {
        prompt: "Which is a pitfall?",
        choices: [
          "Asking what they want in a dress shoe",
          "Saying no too fast and killing the conversation",
          "Letting them talk about their day in those shoes",
          "Suggesting you sit down after they mention pain",
        ],
        answer: 1,
        why: "A fast no is the most common way to drop an opportunity on the floor.",
      },
    ],
    passAt: 5,
  },
];

export const WEEKLY_MODULES: TrainingModule[] = [...WEEKLY_CORE, ...EXTRA_WEEKLY];

export const LOCKER_GAMES: TrainingModule[] = [
  {
    id: "complete-solution",
    weekNumber: null,
    title: "Complete Solution",
    kicker: "Locker game · no bonus point",
    opener:
      "A partial solution is an incomplete solution. Nobody takes half a prescription. This is film study on language — how we talk about Brooks, OS1st, Med Massager, and Architek as one system.",
    slides: [
      {
        title: "Language creates the hierarchy",
        body: "“Add-on. Accessory. Extra. Upsell.” Those words tell the client there is a real product… and then some optional stuff hanging off it. The hierarchy is baked in before you make the case.",
        points: [
          "New language: solution component. Part of the system.",
          "Explain each component’s job in the client’s outcome — not its place in the ticket.",
        ],
      },
      {
        title: "Each component has a job",
        body: "We do not present a product and then upsell. We present one complete solution.",
        points: [
          "Brooks — carries the correction into the shoes they wear most",
          "OS1st — protects comfort and consistency every hour",
          "Med Massager — extends recovery beyond the fitting, at home",
          "Architek — the shoe designed to work with the supports",
        ],
      },
      {
        title: "When they push back",
        body: "Match the right solution. Never “step down.” Reconnect to the goal. Explain the component’s job. Keep the core strong.",
      },
    ],
    questions: [
      {
        prompt: "Which words belong in the presentation?",
        choices: [
          "Add-on and upsell",
          "Extra if you want it",
          "Solution component / part of the system",
          "Optional accessory",
        ],
        answer: 2,
        why: "The old words make everything after the supports feel optional.",
      },
      {
        prompt: "Brooks Ghost / Adrenaline, in this frame, is there to…",
        choices: [
          "Replace the supports",
          "Carry the correction into the shoes they wear most",
          "Be a discount if they say no to supports",
          "Only be mentioned after they pay",
        ],
        answer: 1,
        why: "Supports do their job when the footwear works with them. That is how the solution travels all day.",
      },
      {
        prompt: "Med Massager’s job in the complete solution is…",
        choices: [
          "To inflate the ticket",
          "To extend recovery beyond the fitting so the work keeps paying off at home",
          "To replace a Strengthener",
          "Only for athletes",
        ],
        answer: 1,
        why: "Name the job, not the line item.",
      },
      {
        prompt: "“Nobody takes half a prescription” means…",
        choices: [
          "Always force the biggest ticket",
          "A partial solution is an incomplete solution",
          "Never customize",
          "Shoes do not matter",
        ],
        answer: 1,
        why: "Unsupported sixteen hours a day is not a solved problem. It is a partial one.",
      },
      {
        prompt: "If the investment is higher than expected, first…",
        choices: [
          "Remove the Med Massager",
          "Reconnect to the goal that brought them in",
          "Apologize for the price",
          "Hand them a coupon",
        ],
        answer: 1,
        why: "Reconnect. Then explain the job. Then keep the core strong. Same muscle as YYY.",
      },
    ],
    passAt: 4,
  },
  {
    id: "inquiry-floor",
    weekNumber: null,
    title: "The Floor Bell",
    kicker: "Locker game · live scenarios",
    opener:
      "The door opens. They asked for something we do not carry. You have ten seconds. Pick the line that keeps them in the building.",
    slides: [
      {
        title: "How to play",
        body: "Each question is a live floor moment. Pick the line the floor wants to hear from the desk. One step at a time. Chair before close.",
      },
    ],
    questions: [
      {
        prompt: "“Do you carry dress shoes?”",
        choices: [
          "No, we don’t. Sorry.",
          "I’d love to help. What are you hoping to find in a dress shoe?",
          "We only do arch supports. Want a pair?",
          "Have you tried Nordstrom?",
        ],
        answer: 1,
        why: "Stay open. Ask what they want. Steer toward comfort and a chair.",
      },
      {
        prompt: "“Something I can wear to work without my feet hurting.”",
        choices: [
          "Got it. Let’s sit down and figure out what’s causing that. How do your feet feel by the end of the day?",
          "We have a sale on Brooks.",
          "Pain is normal if you stand all day.",
          "Let me show you the most expensive pair first.",
        ],
        answer: 0,
        why: "You kept it positive, asked a question, and moved them toward a seat.",
      },
      {
        prompt: "“I just wanted shoes, not inserts.”",
        choices: [
          "Then I can’t help you.",
          "Inserts are better than shoes.",
          "I hear you. Can we sit for a second and talk about what’s going on with your shoes now?",
          "Everyone says that and then they buy.",
        ],
        answer: 2,
        why: "Respect the hesitation. Small step. Another question.",
      },
      {
        prompt: "They mention their arches ache and keep talking. You…",
        choices: [
          "Cut in with the 3-Step pitch",
          "Stay quiet and let them finish — that is gold",
          "Walk to the register",
          "Change the subject so they do not get upset",
        ],
        answer: 1,
        why: "Whoever talks is giving you the sale. Do not interrupt gold.",
      },
      {
        prompt: "Best next question after they sit?",
        choices: [
          "So are you paying cash or card?",
          "What’s the toughest part about wearing those shoes all day?",
          "Do you want the cheap ones or the good ones?",
          "Have you been to Walmart already?",
        ],
        answer: 1,
        why: "Open question. They convince themselves.",
      },
      {
        prompt: "The client should speak…",
        choices: [
          "Less than you — you are the expert",
          "About the same",
          "More than you",
          "Only when you ask for a card",
        ],
        answer: 2,
        why: "Ask, then listen. The customer should speak more than you.",
      },
    ],
    passAt: 5,
  },
];

export const ALL_MODULES: TrainingModule[] = [...WEEKLY_MODULES, ...LOCKER_GAMES];

export function moduleById(id: string) {
  return ALL_MODULES.find((m) => m.id === id) ?? null;
}

export function weeklyModule(weekNumber: number) {
  return WEEKLY_MODULES.find((m) => m.weekNumber === weekNumber) ?? null;
}

export function gradeQuiz(moduleId: string, answers: number[]) {
  const mod = moduleById(moduleId);
  if (!mod) throw new Error("That film is not on the card.");
  const total = mod.questions.length;
  let correct = 0;
  const mark = mod.questions.map((q, i) => {
    const pick = answers[i];
    const ok = pick === q.answer;
    if (ok) correct += 1;
    return { index: i, pick: pick ?? -1, answer: q.answer, ok, why: q.why };
  });
  return {
    moduleId: mod.id,
    weekNumber: mod.weekNumber,
    correct,
    total,
    passed: correct >= mod.passAt,
    passAt: mod.passAt,
    mark,
  };
}

export function bonusForWeek(
  records: TrainingRecord[],
  fighterId: string,
  weekNumber: number,
): 0 | 1 {
  return records.some(
    (r) => r.fighterId === fighterId && r.weekNumber === weekNumber && r.awarded,
  )
    ? 1
    : 0;
}

export function awardedBonus(
  records: TrainingRecord[] | undefined,
  fighterId: string,
  weekNumber: number,
): 0 | 1 {
  return bonusForWeek(records ?? [], fighterId, weekNumber);
}

export function weekBonusMap(records: TrainingRecord[] | undefined, weekNumber: number) {
  const map = new Map<string, number>();
  for (const r of records ?? []) {
    if (r.awarded && r.weekNumber === weekNumber) map.set(r.fighterId, 1);
  }
  return map;
}

export function modulesForWeek(weekNumber: number) {
  return WEEKLY_MODULES.filter((m) => m.weekNumber === weekNumber);
}

export function weekAcademyProgress(
  records: TrainingRecord[] | undefined,
  fighterId: string,
  weekNumber: number,
) {
  const mods = modulesForWeek(weekNumber);
  const passed = mods.filter((m) =>
    (records ?? []).some((r) => r.fighterId === fighterId && r.moduleId === m.id && r.passed),
  ).length;
  return { have: passed, need: mods.length, bonus: awardedBonus(records, fighterId, weekNumber) };
}

export function passedWeeks(records: TrainingRecord[], fighterId: string) {
  return [
    ...new Set(
      records
        .filter((r) => r.fighterId === fighterId && r.passed && r.weekNumber > 0)
        .map((r) => r.weekNumber),
    ),
  ];
}

export function recordFor(
  records: TrainingRecord[] | undefined,
  fighterId: string,
  moduleId: string,
) {
  return (records ?? []).find((r) => r.fighterId === fighterId && r.moduleId === moduleId) ?? null;
}

export function displayCard(
  fighterId: string,
  weekNumber: number,
  scores: Score[],
  academy: TrainingRecord[] | undefined,
  metricCount: number,
): (Scorecard & { posted: boolean }) | null {
  const s = scores.find((x) => x.fighterId === fighterId && x.weekNumber === weekNumber);
  const train = awardedBonus(academy, fighterId, weekNumber);
  if (!s && !train) return null;
  const card = scorecard(s?.statuses ?? emptyStatuses(metricCount), s?.reviews ?? 0, train);
  return { ...card, posted: Boolean(s) };
}
