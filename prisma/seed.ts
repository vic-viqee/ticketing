import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const ORGANIZER_EMAIL = "organizer@demo.dev";
const ORGANIZER_PASSWORD = process.env.DEMO_ORGANIZER_PASSWORD ?? "organizer123";

type TierInput = {
  name: string;
  price: number;
  quantity: number;
  sold: number;
};

type EventInput = {
  slug: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  image: string;
  tiers: TierInput[];
};

const DEMO_EVENTS: EventInput[] = [
  {
    slug: "nairobi-jazz-blues-night",
    title: "Nairobi Jazz & Blues Night",
    description:
      "An intimate evening of live jazz and blues with Kenya's finest musicians, set against the historic Kenya National Theatre.",
    date: "2026-10-17T19:00:00+03:00",
    time: "7:00 PM",
    venue: "Kenya National Theatre, Nairobi",
    category: "Music",
    image: "/images/demo/music-jazz.jpg",
    tiers: [
      { name: "General Admission", price: 1500, quantity: 300, sold: 187 },
      { name: "VIP Table", price: 3500, quantity: 100, sold: 64 },
    ],
  },
  {
    slug: "sauti-za-pwani-beach-festival",
    title: "Sauti za Pwani Beach Festival",
    description:
      "Two days of coastal rhythms, Afro-pop and electronic sets on the sand. Bring sunscreen and good vibes.",
    date: "2026-11-07T15:00:00+03:00",
    time: "3:00 PM",
    venue: "Diani Beach, Kwale",
    category: "Music",
    image: "/images/demo/music-festival.jpg",
    tiers: [
      { name: "One Day Pass", price: 2500, quantity: 500, sold: 412 },
      { name: "Weekend Pass", price: 4500, quantity: 300, sold: 256 },
    ],
  },
  {
    slug: "laugh-kamau-comedy-night",
    title: "Laugh Kamau Comedy Night",
    description:
      "An all-star lineup of Nairobi's funniest comedians, headlined by Kamau & The Crew. Expect zero filter and plenty of roasted personalities.",
    date: "2026-10-03T20:00:00+03:00",
    time: "8:00 PM",
    venue: "Kenya National Theatre, Nairobi",
    category: "Comedy",
    image: "/images/demo/comedy-standup.jpg",
    tiers: [
      { name: "General Admission", price: 1200, quantity: 300, sold: 198 },
      { name: "VIP Front Row", price: 2500, quantity: 80, sold: 55 },
    ],
  },
  {
    slug: "open-mic-spoken-word",
    title: "Open Mic & Spoken Word",
    description:
      "Poetry, storytelling and raw performances from the city's buzziest wordsmiths. Open mic slots available at the door.",
    date: "2026-11-21T19:30:00+03:00",
    time: "7:30 PM",
    venue: "The Alchemist Bar, Westlands",
    category: "Comedy",
    image: "/images/demo/comedy-mic.jpg",
    tiers: [{ name: "Entry", price: 800, quantity: 150, sold: 96 }],
  },
  {
    slug: "nairobi-city-marathon-10k",
    title: "Nairobi City Marathon 10K",
    description:
      "Run through the heart of Nairobi on a flat, fast 10K course starting and finishing at Uhuru Gardens. Finishers get a medal and T-shirt.",
    date: "2026-10-11T06:30:00+03:00",
    time: "6:30 AM",
    venue: "Uhuru Gardens, Nairobi",
    category: "Sports",
    image: "/images/demo/sports-marathon.jpg",
    tiers: [
      { name: "10K Runners", price: 1500, quantity: 600, sold: 434 },
      { name: "Fun Run", price: 1000, quantity: 400, sold: 311 },
    ],
  },
  {
    slug: "nairobi-hoops-3v3",
    title: "Nairobi Hoops 3x3 Tournament",
    description:
      "Fast-paced half-court 3x3 basketball with cash prizes and loads of bragging rights on the line. All levels welcome.",
    date: "2026-11-14T10:00:00+03:00",
    time: "10:00 AM",
    venue: "Nyayo Stadium Courts, Nairobi",
    category: "Sports",
    image: "/images/demo/sports-basketball.jpg",
    tiers: [
      { name: "Team Entry (5 players)", price: 2500, quantity: 120, sold: 74 },
      { name: "Spectator", price: 500, quantity: 300, sold: 111 },
    ],
  },
  {
    slug: "nairobi-modern-art-biennale",
    title: "Nairobi Modern Art Biennale",
    description:
      "Curated works from East Africa's boldest contemporary artists spanning painting, sculpture and mixed media.",
    date: "2026-10-24T11:00:00+03:00",
    time: "11:00 AM",
    venue: "Nairobi National Museum, Museum Hill",
    category: "Arts",
    image: "/images/demo/arts-gallery.jpg",
    tiers: [
      { name: "Adult Entry", price: 1000, quantity: 250, sold: 132 },
      { name: "Student Entry", price: 500, quantity: 150, sold: 89 },
    ],
  },
  {
    slug: "creative-design-craft-expo",
    title: "Creative Design & Craft Expo",
    description:
      "Meet 80+ designers, makers and studios showing everything from furniture to fashion, plus hands-on workshops all day.",
    date: "2026-11-28T10:00:00+03:00",
    time: "10:00 AM",
    venue: "Sarit Centre Expo Hall, Westlands",
    category: "Arts",
    image: "/images/demo/arts-design.jpg",
    tiers: [
      { name: "Expo Entry", price: 600, quantity: 400, sold: 223 },
      { name: "Workshop Pass", price: 1500, quantity: 120, sold: 61 },
    ],
  },
  {
    slug: "devcon-kenya-2026",
    title: "DevCon Kenya 2026",
    description:
      "Kenya's biggest developer conference: two tracks on web, mobile and cloud, with talks, breakout labs and an evening hack night.",
    date: "2026-10-31T09:00:00+03:00",
    time: "9:00 AM",
    venue: "KICC, Nairobi",
    category: "Tech",
    image: "/images/demo/tech-conference.jpg",
    tiers: [
      { name: "Standard Ticket", price: 5000, quantity: 400, sold: 356 },
      { name: "Student Ticket", price: 2500, quantity: 200, sold: 143 },
    ],
  },
  {
    slug: "women-in-tech-summit",
    title: "Women in Tech Summit",
    description:
      "A day of keynotes, mentorship circles and networking with women leading Kenya's tech scene. Scholarships available for students.",
    date: "2026-11-26T08:30:00+03:00",
    time: "8:30 AM",
    venue: "Strathmore University Auditorium, Nairobi",
    category: "Tech",
    image: "/images/demo/tech-women.jpg",
    tiers: [
      { name: "General Pass", price: 2000, quantity: 250, sold: 178 },
      { name: "Student Pass", price: 1000, quantity: 150, sold: 102 },
    ],
  },
  {
    slug: "nairobi-business-leaders-forum",
    title: "Nairobi Business Leaders Forum",
    description:
      "Boardroom-level conversations on the economy, investment and doing business in East Africa, with keynote addresses from industry captains.",
    date: "2026-10-15T14:00:00+03:00",
    time: "2:00 PM",
    venue: "KICC, Nairobi",
    category: "Business",
    image: "/images/demo/business-networking.jpg",
    tiers: [
      { name: "Delegate", price: 8000, quantity: 200, sold: 132 },
      { name: "SME Pass", price: 3500, quantity: 150, sold: 87 },
    ],
  },
  {
    slug: "startup-founders-breakfast",
    title: "Startup Founders Breakfast",
    description:
      "A power breakfast for founders and funders — short pitches, honest talks on fundraising and a lot of networking over coffee.",
    date: "2026-11-05T08:00:00+03:00",
    time: "8:00 AM",
    venue: "iHub, Ngong Road",
    category: "Business",
    image: "/images/demo/business-startup.jpg",
    tiers: [
      { name: "Founder", price: 3000, quantity: 100, sold: 68 },
      { name: "Guest", price: 1500, quantity: 60, sold: 41 },
    ],
  },
  {
    slug: "kenya-food-wine-festival",
    title: "Kenya Food & Wine Festival",
    description:
      "Sample dishes from top Nairobi restaurants, meet chefs for live demos and pair plates with wine tastings from across the continent.",
    date: "2026-10-25T12:00:00+03:00",
    time: "12:00 PM",
    venue: "Uhuru Gardens, Nairobi",
    category: "Food",
    image: "/images/demo/food-festival.jpg",
    tiers: [
      { name: "Entry + Tastings", price: 1800, quantity: 500, sold: 402 },
      { name: "VIP Tasting Lounge", price: 4000, quantity: 100, sold: 63 },
    ],
  },
  {
    slug: "street-food-safari",
    title: "Street Food Safari",
    description:
      "A curated tasting trail through Nairobi's best street-food stalls — from smokies and mutura to nyama choma and coastal bites.",
    date: "2026-11-15T11:00:00+03:00",
    time: "11:00 AM",
    venue: "Junction Mall Open Grounds, Ngong Road",
    category: "Food",
    image: "/images/demo/food-street.jpg",
    tiers: [{ name: "Food Voucher + Entry", price: 1000, quantity: 350, sold: 214 }],
  },
  {
    slug: "nairobi-carnival-funfair",
    title: "Nairobi Carnival Funfair",
    description:
      "Rides, games, live bands and food stalls for the whole family. Unlimited wristband rides from noon to 8 PM.",
    date: "2026-09-27T10:00:00+03:00",
    time: "10:00 AM",
    venue: "Jamhuri Park, Nairobi",
    category: "Other",
    image: "/images/demo/other-carnival.jpg",
    tiers: [
      { name: "Family Day Pass", price: 500, quantity: 800, sold: 543 },
      { name: "Unlimited Rides", price: 1500, quantity: 400, sold: 276 },
    ],
  },
  {
    slug: "nairobi-fashion-week",
    title: "Nairobi Fashion Week",
    description:
      "Runway shows from East Africa's freshest designers, street-style corners and a pop-up retail village. Front-row seats up for grabs.",
    date: "2026-10-09T18:00:00+03:00",
    time: "6:00 PM",
    venue: "Villa Rosa Kempinski, Westlands",
    category: "Other",
    image: "/images/demo/other-fashion.jpg",
    tiers: [
      { name: "Runway Show", price: 3000, quantity: 250, sold: 190 },
      { name: "Backstage VIP", price: 7500, quantity: 60, sold: 38 },
    ],
  },
];

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? "admin123";

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin User",
        role: "ADMIN",
        passwordHash,
        approved: true,
      },
    });
    console.log("Seeded admin user:", adminEmail, "/", adminPassword);
  } else {
    console.log("Admin user already exists");
  }
}

async function seedDemoData() {
  let organizer = await prisma.user.findUnique({
    where: { email: ORGANIZER_EMAIL },
  });

  if (!organizer) {
    const passwordHash = await bcrypt.hash(ORGANIZER_PASSWORD, 12);
    organizer = await prisma.user.create({
      data: {
        email: ORGANIZER_EMAIL,
        name: "Demo Organizer",
        role: "ORGANIZER",
        passwordHash,
        approved: true,
      },
    });
  }

  for (const event of DEMO_EVENTS) {
    const data = {
      title: event.title,
      description: event.description,
      date: new Date(event.date),
      time: event.time,
      venue: event.venue,
      category: event.category,
      image: event.image,
      organizerId: organizer.id,
    };

    const record = await prisma.event.upsert({
      where: { slug: event.slug },
      update: data,
      create: { ...data, slug: event.slug },
    });

    await prisma.ticketTier.deleteMany({ where: { eventId: record.id } });
    await prisma.ticketTier.createMany({
      data: event.tiers.map((tier) => ({
        eventId: record.id,
        name: tier.name,
        price: tier.price,
        quantity: tier.quantity,
        sold: tier.sold,
      })),
    });
  }

  console.log(
    `Seeded demo organizer: ${ORGANIZER_EMAIL} / ${ORGANIZER_PASSWORD}`
  );
  console.log(`Seeded ${DEMO_EVENTS.length} demo events with ticket tiers`);
}

async function main() {
  await seedAdmin();
  await seedDemoData();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });