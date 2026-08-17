import type { TrainingModule } from "./training";

/** Extra weekly films. Four lessons a week, sixteen on the card. */
export const EXTRA_WEEKLY: TrainingModule[] = [
  {
    id: "week-1-fit",
    weekNumber: 1,
    title: "Fit on the Foot",
    kicker: "Week 1 · film 2 of 4",
    opener:
      "Brannock is a starting point. The foot on the support is the finish. Too long and too short hurt in different places. Learn both so you do not guess.",
    slides: [
      {
        title: "Measure both. Then confirm.",
        body: "Heel-to-ball is arch length. Heel-to-toe is overall. Compare them. Then put the support on the foot and look.",
        points: [
          "Measure both feet. People are not even.",
          "Brannock gets you close. The foot decides.",
          "A print with and without lets them see the work.",
        ],
      },
      {
        title: "Too long vs too short",
        body: "Length is not a vibe. It is pressure. Wrong length is how a good support feels like a bad one.",
        points: [
          "Too long → extreme pressure in the ball of the foot",
          "Too short → extreme pressure in the center of the arch",
          "Correct fit forms to the foot with no gaps",
        ],
      },
      {
        title: "Show. Do not diagnose.",
        body: "The Ideal Foot chart is a teaching tool. You are a fitter, not a clinic.",
        points: [
          "Never diagnose or prescribe",
          "Name what you see on the print, not a condition",
          "Let them connect the print to how they feel",
        ],
      },
    ],
    questions: [
      {
        prompt: "The Brannock Device is…",
        choices: [
          "The final word. Do not check the foot.",
          "A starting point. Confirm the fit on the foot.",
          "Only for shoes, never supports.",
          "Used instead of a print.",
        ],
        answer: 1,
        why: "Brannock gets you close. The foot on the support decides.",
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
        prompt: "A support that is too short usually feels like…",
        choices: [
          "Pressure in the toes",
          "Extreme pressure in the center of the arch",
          "Nothing until week two",
          "A deeper heel cup",
        ],
        answer: 1,
        why: "Short support dumps pressure in the middle of the arch.",
      },
      {
        prompt: "When you show the Ideal Foot chart you should…",
        choices: [
          "Diagnose the condition they walked in with",
          "Prescribe a medical plan",
          "Teach what you see. Never diagnose or prescribe.",
          "Skip it if they look busy",
        ],
        answer: 2,
        why: "You are a fitter. The chart teaches. It does not diagnose.",
      },
      {
        prompt: "Why measure both feet?",
        choices: [
          "It looks professional even if they match",
          "People are not even. Fit the foot in front of you.",
          "Only the left foot matters",
          "Corporate requires two numbers on the ticket",
        ],
        answer: 1,
        why: "Two feet. Two measurements. Fit what is actually there.",
      },
    ],
    passAt: 4,
  },
  {
    id: "week-1-lineup",
    weekNumber: 1,
    title: "The Lineup",
    kicker: "Week 1 · film 3 of 4",
    opener:
      "Seventeen styles. Three jobs. If you cannot name which Strengthener is most popular and which one flexes, you are guessing on the foot.",
    slides: [
      {
        title: "Strengtheners",
        body: "They put the foot in the ideal position. Stronger features. A real metatarsal rise.",
        points: [
          "Classic is the most popular",
          "Diamond is more flexible — flatter or sensitive feet",
          "Max is the most firm. Not for very stiff or very flat feet",
          "Honeycomb is more rigid than Classic or Diamond. Not in narrow",
        ],
      },
      {
        title: "Maintainers",
        body: "They hold the alignment the Strengthener built, including in tighter shoes.",
        points: [
          "Lower arch, little or no metatarsal rise",
          "Flat heel platform and/or a heel cup",
          "Styles include Flex, Mid Flex, Miracle Flex, Ultra, TSS, Deluxe, Slimline",
        ],
      },
      {
        title: "Relaxers",
        body: "A rest period. Thin enough for almost any shoe. Worn last every day.",
        points: [
          "Little to no adjustment period",
          "Relaxer Flex, Skinny, Slimline Relaxer",
          "The “no excuse not to wear it” pair",
        ],
      },
    ],
    questions: [
      {
        prompt: "Which Strengthener is the most popular?",
        choices: ["Max", "Honeycomb", "Classic", "Hug"],
        answer: 2,
        why: "Classic is the workhorse seller.",
      },
      {
        prompt: "Which Strengthener is more flexible for flatter or sensitive feet?",
        choices: ["Max", "Diamond", "Honeycomb", "Hug"],
        answer: 1,
        why: "Diamond’s structure gives more side-to-side flex.",
      },
      {
        prompt: "Max is a poor first pick when the foot is…",
        choices: [
          "Very stiff or very flat",
          "A little tired after work",
          "Already in a Classic",
          "A child’s foot on Youth Sportflex",
        ],
        answer: 0,
        why: "Max is the most firm. Stiff or very flat feet usually need something else.",
      },
      {
        prompt: "Maintainers are there to…",
        choices: [
          "Replace the Strengthener on day one",
          "Hold the alignment the Strengthener built",
          "Be worn last every night",
          "Diagnose a heel spur",
        ],
        answer: 1,
        why: "If the foot loses position every time they change shoes, the system takes longer.",
      },
      {
        prompt: "When are Relaxers typically worn?",
        choices: [
          "First thing in the morning",
          "Only on rest days",
          "Last every day — slippers, sandals, dress shoes",
          "Never. They are youth-only.",
        ],
        answer: 2,
        why: "Relaxers are the rest period at the end of the day.",
      },
    ],
    passAt: 4,
  },
  {
    id: "week-1-features",
    weekNumber: 1,
    title: "What the Features Do",
    kicker: "Week 1 · film 4 of 4",
    opener:
      "Clients do not buy a polymer shape. They buy what the feature does for the body. Heel cup. Met rise. Heel platform. Name the job.",
    slides: [
      {
        title: "Heel cup",
        body: "Gathers the fat pad, absorbs shock, and can help align ankle → knee → hip → back.",
        points: [
          "Deep cups control motion",
          "Deep cups are not for running",
          "A cup is a tool, not a default",
        ],
      },
      {
        title: "Metatarsal rise",
        body: "A mound that sits just behind the ball of the foot. Takes pressure off the toes and heel and supports the plantar fascia.",
        points: ["Behind the metatarsal heads — not under the toes", "Too far forward feels like a pebble"],
      },
      {
        title: "GeT and the heel platform",
        body: "GeT is the patented S-shaped Slimline system. A flat heel platform (no cup) gives mobility and works in open-heel shoes.",
        points: [
          "Inner longitudinal arch is unique to each person",
          "That is why a trained fitter matters",
        ],
      },
    ],
    questions: [
      {
        prompt: "Where does a metatarsal rise sit?",
        choices: [
          "Under the heel cup",
          "Just behind the ball of the foot",
          "On top of the toes",
          "Along the outer arch only",
        ],
        answer: 1,
        why: "The rise is a mound just behind the metatarsal heads.",
      },
      {
        prompt: "A deep heel cup is generally a poor choice for…",
        choices: [
          "Someone who wants more stability",
          "Running or impact sports",
          "Gathering the fat pad",
          "A client with back pain who needs alignment",
        ],
        answer: 1,
        why: "Deep cups control motion. That is the opposite of what a runner needs.",
      },
      {
        prompt: "A heel platform (flat, no cup) is useful because…",
        choices: [
          "It diagnoses plantar fasciitis",
          "It gives mobility and works in open-heel shoes",
          "It replaces a Strengthener",
          "It is only for kids",
        ],
        answer: 1,
        why: "No cup. More mobility. Open-heel shoes can still get a system.",
      },
      {
        prompt: "Clients buy…",
        choices: [
          "The polymer shape",
          "What the feature does for the body",
          "The SKU number",
          "Whatever is on sale",
        ],
        answer: 1,
        why: "Name the job. The shape is how you deliver it.",
      },
      {
        prompt: "The inner longitudinal arch is…",
        choices: [
          "The same on every adult",
          "Unique to each person — that is why a fitter matters",
          "Only on the left foot",
          "Ignored if you have a Brannock",
        ],
        answer: 1,
        why: "One reason a trained fitter is the product.",
      },
    ],
    passAt: 4,
  },
  {
    id: "week-2-cart",
    weekNumber: 2,
    title: "The Cart Is the Price",
    kicker: "Week 2 · film 2 of 4",
    opener:
      "Highest leverage on perceived value is not the close. It is how you handle the cart. A messy cart makes a $525 support feel like a $20 insole.",
    slides: [
      {
        title: "The Rolex test",
        body: "Would a walk-in expect $2,000 — or $20 — from the way this cart looks right now?",
        points: [
          "Pristine. Organized. Always.",
          "Present every support, shoe, sock, and Med Massager on purpose",
          "Never toss supports. Never leave packaging scattered.",
        ],
      },
      {
        title: "Busy is not an excuse",
        body: "Standards do not drop on high-traffic or short-staffed days. That is when the cart does the most damage.",
        points: ["Reset between guests", "If you would not hand it to Karen, do not hand it to a guest"],
      },
      {
        title: "Handling is language",
        body: "Careless hands say discount. Deliberate hands say system.",
      },
    ],
    questions: [
      {
        prompt: "Which pillar has the highest leverage on perceived value?",
        choices: ["Follow-up quality", "Cart and product handling", "How loud the music is", "The bathroom checklist"],
        answer: 1,
        why: "A Rolex-level cart multiplies the product. A discount-bin cart kills it.",
      },
      {
        prompt: "What does a messy cart communicate?",
        choices: [
          "We are busy, so we must be good",
          "This is ordinary / discount-bin energy",
          "The supports are more affordable",
          "Nothing. Clients do not notice.",
        ],
        answer: 1,
        why: "Careless handling makes a $525 support feel like a $20 insole.",
      },
      {
        prompt: "On a slammed Saturday you…",
        choices: [
          "Let the cart slide. Speed first.",
          "Keep the same standard. Reset between guests.",
          "Hide the Med Massager so the cart looks smaller",
          "Stack packaging on the fitting stool",
        ],
        answer: 1,
        why: "Standards do not drop when the building is loud.",
      },
      {
        prompt: "Presenting a support means…",
        choices: [
          "Tossing it on the bench so they can see it",
          "Handing it over like it costs what it costs",
          "Leaving it in the box until they ask",
          "Showing three at once so they pick faster",
        ],
        answer: 1,
        why: "Deliberate hands say system.",
      },
      {
        prompt: "The Rolex test asks…",
        choices: [
          "Did they bring a Rolex?",
          "Would a walk-in expect $2,000 or $20 from this cart?",
          "Is the music expensive enough?",
          "Did you mention the guarantee yet?",
        ],
        answer: 1,
        why: "The cart sets the price before you speak.",
      },
    ],
    passAt: 4,
  },
  {
    id: "week-2-presence",
    weekNumber: 2,
    title: "The First Sixty Seconds",
    kicker: "Week 2 · film 3 of 4",
    opener:
      "The store sets the price in ten seconds. You set the rest in the first minute. Appearance, presence, and how you walk them in.",
    slides: [
      {
        title: "Ten seconds",
        body: "Smell, light, floor, first face. Walmart-level first impression, Walmart-level permission.",
      },
      {
        title: "Sixty seconds",
        body: "Specialist appearance and presence. You are part of the product. Stand like the ticket is worth it.",
        points: ["Greet like you expected them", "Do not hover the register", "Walk them toward a chair, not a wall of boxes"],
      },
      {
        title: "You cannot fake it later",
        body: "A perfect close does not undo a sloppy hello.",
      },
    ],
    questions: [
      {
        prompt: "The first 10 seconds in the store mostly set…",
        choices: [
          "The close script you will use",
          "Whether they like Brooks or Architek",
          "The price they expect to pay",
          "How many reviews they will leave",
        ],
        answer: 2,
        why: "Environment sets the price before you speak.",
      },
      {
        prompt: "In the first minute you should…",
        choices: [
          "Stay behind the register until they ask",
          "Greet them and walk them toward a chair",
          "Hand them a brochure and wait",
          "Ask how they want to pay",
        ],
        answer: 1,
        why: "Presence is a chair, not a counter.",
      },
      {
        prompt: "Specialist appearance is…",
        choices: [
          "Optional if you are good on the floor",
          "Part of the product. You are in the first sixty seconds.",
          "Only for the owner",
          "A corporate poster, not a standard",
        ],
        answer: 1,
        why: "They buy the person holding the support.",
      },
      {
        prompt: "A sloppy hello…",
        choices: [
          "Can be fixed with a discount",
          "Does not matter if the fit is right",
          "Is something a perfect close cannot fully undo",
          "Is fine if the cart is clean",
        ],
        answer: 2,
        why: "First minute writes the permission for the ticket.",
      },
      {
        prompt: "Walmart-level first impression usually earns…",
        choices: ["Rolex-level permission", "Walmart-level permission", "A guaranteed 5-star", "A faster close"],
        answer: 1,
        why: "The room tells them what this is allowed to cost.",
      },
    ],
    passAt: 4,
  },
  {
    id: "week-2-followup",
    weekNumber: 2,
    title: "Follow-Up Is the Second Sale",
    kicker: "Week 2 · film 4 of 4",
    opener:
      "Non-tangible value does not end at the door. A personal check-in is how one sale becomes reviews and referrals. Scripted follow-up feels like a survey.",
    slides: [
      {
        title: "Caring, not scripted",
        body: "Ask how the first week felt. Use their name. Mention the thing they told you on the floor.",
      },
      {
        title: "Protect the guarantee",
        body: "The Lifetime / Satisfaction Guarantee only sounds real if you own the outcome after they leave.",
        points: ["Do not hide from a sore first week", "Bring them back. Adjust. That is the product."],
      },
      {
        title: "This is controllable",
        body: "No budget. No inventory. 100% you.",
      },
    ],
    questions: [
      {
        prompt: "Follow-up should feel…",
        choices: ["Like a script", "Caring and specific", "Like a coupon", "Optional if they already paid"],
        answer: 1,
        why: "A personal check-in is how one sale becomes reviews.",
      },
      {
        prompt: "The guarantee is protected by…",
        choices: [
          "Fine print on the ticket",
          "Owning the outcome after they leave",
          "Never calling so they cannot complain",
          "A bigger discount next time",
        ],
        answer: 1,
        why: "If you disappear, the guarantee is a poster.",
      },
      {
        prompt: "A sore first week means…",
        choices: [
          "The sale failed. Hide.",
          "Bring them back and adjust. That is the product.",
          "Tell them to wait six months",
          "Switch them to Walmart insoles",
        ],
        answer: 1,
        why: "Adjustment is part of the system, not a refund conversation.",
      },
      {
        prompt: "Non-tangible follow-up costs…",
        choices: ["A marketing budget", "Nothing but your attention", "A free pair", "Corporate approval"],
        answer: 1,
        why: "It is 100% controllable. No inventory.",
      },
      {
        prompt: "Best follow-up mentions…",
        choices: [
          "This week’s sale flyer",
          "The specific thing they told you on the floor",
          "A survey link only",
          "Nothing. A text that says “checking in” is enough",
        ],
        answer: 1,
        why: "Specific is caring. Generic is a survey.",
      },
    ],
    passAt: 4,
  },
  {
    id: "week-3-first-why",
    weekNumber: 3,
    title: "Start With Why They Came In",
    kicker: "Week 3 · film 2 of 4",
    opener:
      "Not what they want. Why they walked through the door. The first Why is the one that keeps value standing when the first close does not land.",
    slides: [
      {
        title: "Why, not what",
        body: "“Dress shoes” is a what. “I cannot get through a shift without sitting down” is a why.",
      },
      {
        title: "Write it down",
        body: "If you cannot say their why back to them, you do not have it yet.",
        points: ["Ask once. Then shut up.", "Repeat it in their words, not yours."],
      },
      {
        title: "The why is the close",
        body: "When they stall, you do not cut the ticket first. You go back to the reason they came in.",
      },
    ],
    questions: [
      {
        prompt: "The first question is closer to…",
        choices: [
          "What size are you?",
          "Why did you come in today?",
          "Cash or card?",
          "Have you been to Walmart?",
        ],
        answer: 1,
        why: "Why they walked in is the whole match.",
      },
      {
        prompt: "“Dress shoes” is…",
        choices: ["A why", "A what. Dig for the reason under it.", "Enough to build a system", "A no"],
        answer: 1,
        why: "The product they named is not the pain that brought them.",
      },
      {
        prompt: "If you cannot say their why back…",
        choices: [
          "Guess and keep moving",
          "You do not have it yet. Ask again.",
          "Skip to the 3-Step",
          "Hand them a brochure",
        ],
        answer: 1,
        why: "Repeat it in their words.",
      },
      {
        prompt: "When the first close does not land, first…",
        choices: [
          "Strip the card",
          "Go back to why they came in",
          "Apologize for the price",
          "Walk them to the door",
        ],
        answer: 1,
        why: "YYY starts with the why still standing.",
      },
      {
        prompt: "After you ask why, you…",
        choices: ["Fill the silence with features", "Shut up and let them talk", "Show Max first", "Quote the system"],
        answer: 1,
        why: "Whoever talks is giving you the sale.",
      },
    ],
    passAt: 4,
  },
  {
    id: "week-3-customize",
    weekNumber: 3,
    title: "Customize Without Stripping",
    kicker: "Week 3 · film 3 of 4",
    opener:
      "The first close missed. Most people start taking things off the card. Both sides of the equation shrink. YYY lets you customize so they still feel they got the thing they came for.",
    slides: [
      {
        title: "Do not shrink both sides",
        body: "Cut the package and you also cut the reason. That is how nobody pins.",
      },
      {
        title: "Ask why three times",
        body: "Each Why finds what actually matters so you can change the mix without looking like a salesperson.",
        points: ["Why this? Why that? Why not the other?", "Then rebuild the card around the answers"],
      },
      {
        title: "They should feel whole",
        body: "If they feel you stripped the package, you lost even if they paid.",
      },
    ],
    questions: [
      {
        prompt: "After a missed close, the common mistake is…",
        choices: [
          "Asking another Why",
          "Stripping the card so the number drops",
          "Repeating their goal",
          "Sitting back down",
        ],
        answer: 1,
        why: "Both sides of the equation shrink. Nobody pins.",
      },
      {
        prompt: "YYY is how you…",
        choices: [
          "Force the original ticket",
          "Customize without looking like a salesperson",
          "Add a coupon",
          "End the visit faster",
        ],
        answer: 1,
        why: "Three Whys find what actually matters.",
      },
      {
        prompt: "A good customize still leaves them feeling…",
        choices: [
          "That they got a discount",
          "That they still got the thing they came for",
          "That you gave up",
          "That the system is optional",
        ],
        answer: 1,
        why: "If they feel stripped, you lost even if they paid.",
      },
      {
        prompt: "Each Why is there to…",
        choices: [
          "Wear them down",
          "Find what actually matters on the card",
          "Stall until a manager arrives",
          "Replace product knowledge",
        ],
        answer: 1,
        why: "Then you rebuild the mix around the answers.",
      },
      {
        prompt: "Cutting items first usually…",
        choices: [
          "Protects the value",
          "Cuts the reason they came in",
          "Makes the guarantee stronger",
          "Is required by the desk",
        ],
        answer: 1,
        why: "The why has to stay standing.",
      },
    ],
    passAt: 4,
  },
  {
    id: "week-3-listen",
    weekNumber: 3,
    title: "They Should Talk More",
    kicker: "Week 3 · film 4 of 4",
    opener:
      "Whoever asks the questions controls the conversation. The client should speak more than you. A fast no is the most common way to drop an opportunity on the floor.",
    slides: [
      {
        title: "Do not say no. Get them seated.",
        body: "“Do you carry dress shoes?” is not a no. It is a bell. “I’d love to help. What are you hoping to find?”",
      },
      {
        title: "Gold is when they talk",
        body: "“My feet kill me by lunch” is not a moment to interrupt with the 3-Step.",
      },
      {
        title: "One step at a time",
        body: "Chair. Then questions. Then a print. Do not rush the sale.",
      },
    ],
    questions: [
      {
        prompt: "“Do you carry dress shoes?” Best line:",
        choices: [
          "No, we don’t. Sorry.",
          "I’d love to help. What are you hoping to find in a dress shoe?",
          "We only do arch supports. Want a pair?",
          "Have you tried Nordstrom?",
        ],
        answer: 1,
        why: "Stay open. Ask what they want. Steer toward a chair.",
      },
      {
        prompt: "They mention their arches ache and keep talking. You…",
        choices: [
          "Cut in with the 3-Step pitch",
          "Stay quiet and let them finish — that is gold",
          "Walk to the register",
          "Change the subject",
        ],
        answer: 1,
        why: "Whoever talks is giving you the sale.",
      },
      {
        prompt: "The client should speak…",
        choices: ["Less than you", "About the same", "More than you", "Only when you ask for a card"],
        answer: 2,
        why: "Ask, then listen.",
      },
      {
        prompt: "A fast no usually…",
        choices: [
          "Saves time for real buyers",
          "Kills the conversation",
          "Shows product knowledge",
          "Protects the price",
        ],
        answer: 1,
        why: "That is the most common way to drop an opportunity on the floor.",
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
    ],
    passAt: 4,
  },
  {
    id: "week-4-components",
    weekNumber: 4,
    title: "Every Piece Has a Job",
    kicker: "Week 4 · film 2 of 4",
    opener:
      "We do not present a product and then upsell. We present one complete solution. Name the job of Brooks, OS1st, Med Massager, and Architek — not the line item.",
    slides: [
      {
        title: "One solution",
        body: "A partial solution is an incomplete solution. Nobody takes half a prescription.",
      },
      {
        title: "Name the job",
        body: "Each piece does one job. Say that job out loud before you name the price.",
        points: [
          "Brooks — carries the correction into the shoes they wear most",
          "OS1st — protects comfort and consistency every hour",
          "Med Massager — extends recovery beyond the fitting, at home",
          "Architek — the shoe designed to work with the supports",
        ],
      },
      {
        title: "When they push back",
        body: "Reconnect to the goal. Explain the component’s job. Keep the core strong. Never “step down.”",
      },
    ],
    questions: [
      {
        prompt: "Brooks Ghost / Adrenaline, in this frame, is there to…",
        choices: [
          "Replace the supports",
          "Carry the correction into the shoes they wear most",
          "Be a discount if they say no to supports",
          "Only be mentioned after they pay",
        ],
        answer: 1,
        why: "Supports do their job when the footwear works with them.",
      },
      {
        prompt: "Med Massager’s job is…",
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
        why: "Unsupported sixteen hours a day is not a solved problem.",
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
        why: "Reconnect. Then explain the job. Then keep the core strong.",
      },
      {
        prompt: "OS1st is in the solution to…",
        choices: [
          "Replace socks they already like",
          "Protect comfort and consistency every hour",
          "Be a free gift with purchase",
          "Only be sold to runners",
        ],
        answer: 1,
        why: "Every hour counts. Name that job.",
      },
    ],
    passAt: 4,
  },
  {
    id: "week-4-language",
    weekNumber: 4,
    title: "Words That Kill the Ticket",
    kicker: "Week 4 · film 3 of 4",
    opener:
      "Add-on. Accessory. Extra. Upsell. Those words tell the client there is a real product… and then some optional stuff hanging off it. Change the words or the hierarchy is already lost.",
    slides: [
      {
        title: "New language",
        body: "Solution component. Part of the system. Explain the job in their outcome — not the place on the ticket.",
      },
      {
        title: "Ownership language",
        body: "“This is part of the same solution. It is what it takes to keep you out of pain.” Not “the add-on is optional if you want it.”",
      },
      {
        title: "Discount language",
        body: "“I can probably do something on the price” tells them it was never worth it.",
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
        prompt: "Which language belongs in a premium store?",
        choices: [
          "I can probably do something on the price.",
          "This is part of the same solution. It is what it takes to keep you out of pain.",
          "The add-on is optional if you want it.",
          "Let me check if we have a coupon.",
        ],
        answer: 1,
        why: "Ownership language protects the price.",
      },
      {
        prompt: "A client says the investment is high. The non-tangible move is…",
        choices: [
          "Offer 20% off",
          "Apologize and remove items silently",
          "Lean on the experience you just delivered — without discounting",
          "Walk them to the door",
        ],
        answer: 2,
        why: "Discount language tells them it was never worth it.",
      },
      {
        prompt: "“Optional accessory” tells them…",
        choices: [
          "This is required for the outcome",
          "This is extra and they can skip it",
          "This is the Strengthener",
          "This is the guarantee",
        ],
        answer: 1,
        why: "The hierarchy is baked in before you make the case.",
      },
      {
        prompt: "Explain each component by…",
        choices: [
          "Its place on the ticket",
          "Its job in the client’s outcome",
          "How much margin it has",
          "Whether it is on sale",
        ],
        answer: 1,
        why: "Job first. Price second.",
      },
    ],
    passAt: 4,
  },
  {
    id: "week-4-chair",
    weekNumber: 4,
    title: "Get Them in the Chair",
    kicker: "Week 4 · film 4 of 4",
    opener:
      "Somebody walks in asking for a thing we do not stock. That is not a no. First job is the chair. Then questions. Then a print. Do not rush the sale.",
    slides: [
      {
        title: "Control the process, not every word",
        body: "Steer toward seated, informed, and an imprint. One step at a time.",
      },
      {
        title: "Pivot, do not no",
        body: "“We focus on comfort solutions that might fit what you need.” Then sit them down.",
      },
      {
        title: "Passion has to be genuine",
        body: "Believe it or they will not. A chair with a bored specialist is still a no.",
      },
    ],
    questions: [
      {
        prompt: "First job when they ask for something we do not carry…",
        choices: ["Say no clearly", "Get them in a chair", "Hand them a competitor’s name", "Show the most expensive pair"],
        answer: 1,
        why: "Chair before close.",
      },
      {
        prompt: "“I just wanted shoes, not inserts.” Best line:",
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
        prompt: "“Something I can wear to work without my feet hurting.” You…",
        choices: [
          "Got it. Let’s sit down and figure out what’s causing that.",
          "We have a sale on Brooks.",
          "Pain is normal if you stand all day.",
          "Let me show you the most expensive pair first.",
        ],
        answer: 0,
        why: "You kept it positive and moved them toward a seat.",
      },
      {
        prompt: "Whoever asks the questions…",
        choices: ["Is being rude", "Controls the conversation", "Talks too much", "Should be the client"],
        answer: 1,
        why: "Control the process, not every word.",
      },
      {
        prompt: "A chair with no belief behind it is…",
        choices: ["Still a win", "Still a no", "Enough for a review", "The complete solution"],
        answer: 1,
        why: "Passion has to be genuine.",
      },
    ],
    passAt: 4,
  },
];
