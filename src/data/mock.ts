import alex from "@/assets/creator-alex.jpg";
import priya from "@/assets/creator-priya.jpg";
import rahul from "@/assets/creator-rahul.jpg";
import sneha from "@/assets/creator-sneha.jpg";
import neha from "@/assets/creator-neha.jpg";
import arjun from "@/assets/creator-arjun.jpg";

export type Character = {
  id: string;
  characterName: string;
  creatorName: string;
  title: string;
  category: string;
  tags: string[];
  description: string;
  about: string;
  photo: string;
  online: boolean;
  followers: string;
  conversations: string;
  rating: number;
  chatCount: string;
  popularQuestions: string[];
  socials: { label: string; handle: string }[];
  trending: number;
  newest: number;
};

export const categories = [
  "All",
  "Fitness",
  "Business",
  "Career",
  "Education",
  "Health",
  "Marketing",
  "Technology",
  "Lifestyle",
  "Entrepreneurship",
];

export const characters: Character[] = [
  {
    id: "rahul-sharma",
    characterName: "Rahul AI",
    creatorName: "Rahul Sharma",
    title: "Entrepreneur & Investor",
    category: "Entrepreneurship",
    tags: ["Business", "Startups", "Investing", "Leadership"],
    description:
      "Ask me about startups, business, investing, productivity and entrepreneurship.",
    about:
      "I'm Rahul Sharma, founder, investor and entrepreneur. I've built multiple companies over the last decade and now back early-stage founders. My AI character shares the frameworks I use for validating ideas, raising capital, hiring early teams and staying productive without burning out.",
    photo: rahul,
    online: true,
    followers: "24.8K",
    conversations: "1.2K",
    rating: 4.9,
    chatCount: "12k chatting",
    popularQuestions: [
      "How do I start a startup?",
      "What are the best books for entrepreneurs?",
      "How can I improve my productivity?",
      "How should I validate a business idea?",
    ],
    socials: [
      { label: "YouTube", handle: "@rahulbuilds" },
      { label: "LinkedIn", handle: "in/rahulsharma" },
      { label: "Instagram", handle: "@rahul.builds" },
      { label: "X (Twitter)", handle: "@rahulsharma" },
    ],
    trending: 98,
    newest: 3,
  },
  {
    id: "alex-carter",
    characterName: "Alex AI",
    creatorName: "Alex Carter",
    title: "Fitness Coach",
    category: "Fitness",
    tags: ["Training", "Nutrition", "Habits"],
    description:
      "Get workout plans, form checks and realistic nutrition advice that fits your week.",
    about:
      "I'm Alex Carter, a strength and conditioning coach. My AI character helps you build a training plan you can actually stick to, whether you train at home or in a full gym.",
    photo: alex,
    online: true,
    followers: "18.2K",
    conversations: "3.1K",
    rating: 4.8,
    chatCount: "2.4k chatting",
    popularQuestions: [
      "Build me a 4-day training split",
      "How much protein do I actually need?",
      "How do I stay consistent when travelling?",
      "Is cardio killing my gains?",
    ],
    socials: [
      { label: "YouTube", handle: "@coachalex" },
      { label: "Instagram", handle: "@alex.carter" },
      { label: "LinkedIn", handle: "in/alexcarter" },
      { label: "X (Twitter)", handle: "@coachalex" },
    ],
    trending: 94,
    newest: 5,
  },
  {
    id: "priya-mehta",
    characterName: "Priya AI",
    creatorName: "Priya Mehta",
    title: "Marketing Expert",
    category: "Marketing",
    tags: ["Brand", "Content", "Growth"],
    description:
      "Marketing strategy, positioning and content systems for small teams and solo founders.",
    about:
      "I'm Priya Mehta and I've led brand and growth for consumer companies for eight years. My AI character walks you through positioning, channel choice and content calendars.",
    photo: priya,
    online: true,
    followers: "31.5K",
    conversations: "2.7K",
    rating: 4.9,
    chatCount: "3.9k chatting",
    popularQuestions: [
      "How do I position a new product?",
      "What content should I post this month?",
      "How do I grow without a paid budget?",
      "How do I write a landing page that converts?",
    ],
    socials: [
      { label: "YouTube", handle: "@priyamarketing" },
      { label: "Instagram", handle: "@priya.mehta" },
      { label: "LinkedIn", handle: "in/priyamehta" },
      { label: "X (Twitter)", handle: "@priyamehta" },
    ],
    trending: 96,
    newest: 8,
  },
  {
    id: "sneha-kapoor",
    characterName: "Dr. Sneha AI",
    creatorName: "Dr. Sneha Kapoor",
    title: "Health & Wellness",
    category: "Health",
    tags: ["Nutrition", "Sleep", "Wellbeing"],
    description:
      "Ask about nutrition, sleep, stress and building a healthier daily routine.",
    about:
      "I'm Dr. Sneha Kapoor, a physician focused on preventive health. My AI character shares general wellbeing guidance — never a diagnosis, and always with a nudge to see a real clinician when it matters.",
    photo: sneha,
    online: false,
    followers: "42.1K",
    conversations: "5.4K",
    rating: 4.9,
    chatCount: "5.1k chatting",
    popularQuestions: [
      "How do I fix my sleep schedule?",
      "What does a balanced plate look like?",
      "How do I manage everyday stress?",
      "Which health checks should I do yearly?",
    ],
    socials: [
      { label: "YouTube", handle: "@drsneha" },
      { label: "Instagram", handle: "@dr.sneha.kapoor" },
      { label: "LinkedIn", handle: "in/snehakapoor" },
      { label: "X (Twitter)", handle: "@drsnehak" },
    ],
    trending: 91,
    newest: 12,
  },
  {
    id: "neha-verma",
    characterName: "Neha AI",
    creatorName: "Neha Verma",
    title: "Education Expert",
    category: "Education",
    tags: ["Study", "Exams", "Learning"],
    description:
      "Study strategies, exam preparation and learning plans that respect your schedule.",
    about:
      "I'm Neha Verma, an educator with a decade of classroom and online teaching. My AI character helps students build study systems that stick.",
    photo: neha,
    online: true,
    followers: "12.9K",
    conversations: "980",
    rating: 4.7,
    chatCount: "1.1k chatting",
    popularQuestions: [
      "How do I plan a 3-month exam prep?",
      "What's the best way to memorise?",
      "How do I stop procrastinating?",
      "How do I take better notes?",
    ],
    socials: [
      { label: "YouTube", handle: "@nehalearns" },
      { label: "Instagram", handle: "@neha.verma" },
      { label: "LinkedIn", handle: "in/nehaverma" },
      { label: "X (Twitter)", handle: "@nehaverma" },
    ],
    trending: 84,
    newest: 1,
  },
  {
    id: "arjun-desai",
    characterName: "Arjun AI",
    creatorName: "Arjun Desai",
    title: "Career Coach",
    category: "Career",
    tags: ["Interviews", "Resume", "Switching"],
    description:
      "Career advice, resume reviews, interview prep and negotiating your next offer.",
    about:
      "I'm Arjun Desai and I've coached hundreds of professionals through career switches. My AI character gives direct, practical feedback on your resume and interview answers.",
    photo: arjun,
    online: true,
    followers: "9.4K",
    conversations: "1.6K",
    rating: 4.8,
    chatCount: "870 chatting",
    popularQuestions: [
      "Review my resume structure",
      "How do I answer 'tell me about yourself'?",
      "Should I switch industries?",
      "How do I negotiate salary?",
    ],
    socials: [
      { label: "YouTube", handle: "@arjuncareers" },
      { label: "Instagram", handle: "@arjun.desai" },
      { label: "LinkedIn", handle: "in/arjundesai" },
      { label: "X (Twitter)", handle: "@arjundesai" },
    ],
    trending: 88,
    newest: 2,
  },
];

export const getCharacter = (id: string) =>
  characters.find((c) => c.id === id) ?? characters[0];

export const platformStats = [
  { value: "10K+", label: "Creators" },
  { value: "1M+", label: "Conversations" },
  { value: "100+", label: "Categories" },
  { value: "24/7", label: "Always available" },
];

export const howItWorks = [
  {
    step: "01",
    title: "Choose a character",
    body: "Find an expert or creator you already trust.",
  },
  {
    step: "02",
    title: "Chat or talk",
    body: "Ask questions through text or browser-based voice.",
  },
  {
    step: "03",
    title: "Go deeper",
    body: "When you need the real person, connect with the creator.",
  },
];

export const sampleConversation = [
  {
    role: "user" as const,
    text: "What are the best books for entrepreneurs?",
    time: "10:22 AM",
  },
  {
    role: "ai" as const,
    text: "Here are a few books I frequently recommend — each one solves a different problem you'll hit early on:\n\n1. Zero to One — Peter Thiel — for thinking about what makes a business genuinely new.\n2. The Lean Startup — Eric Ries — for validating before you build.\n3. Atomic Habits — James Clear — because founder output is mostly a habits problem.\n4. Good to Great — Jim Collins — for when you start hiring beyond the first five people.\n\nIf you tell me which stage you're at, I'll narrow it down to one.",
    time: "10:22 AM",
  },
];

export const suggestedQuestions = [
  "How do I validate my idea?",
  "How do I find a co-founder?",
  "What should my first hire be?",
];

export const recentChats = [
  { id: "rahul-sharma", name: "Rahul Sharma", snippet: "What are the best books...", time: "10:24 AM" },
  { id: "sneha-kapoor", name: "Dr. Sneha Kapoor", snippet: "Nutrition plan for weight loss", time: "Yesterday" },
  { id: "priya-mehta", name: "Priya Mehta", snippet: "Marketing strategy tips", time: "Yesterday" },
  { id: "alex-carter", name: "Alex Carter", snippet: "Workout plan for beginners", time: "2 days ago" },
];

export const dashboardStats = [
  { value: "1,248", label: "Total Conversations", change: "+12%" },
  { value: "320", label: "Voice Sessions", change: "+18%" },
  { value: "87", label: "Returning Users", change: "+5%" },
  { value: "₹24,500", label: "Estimated Earnings", change: "+9%" },
];

export const recentActivity = [
  { title: "New conversation from Priya S.", body: "\"Can you suggest a good startup idea?\"", time: "2m ago" },
  { title: "Voice call from Arjun K.", body: "Talked for 12 minutes", time: "15m ago" },
  { title: "New follower", body: "Neha Verma started following your character", time: "1h ago" },
  { title: "Knowledge source updated", body: "podcast-transcripts.pdf reprocessed", time: "3h ago" },
];

export const analyticsSeries = [
  { label: "Mon", chats: 62, voice: 18 },
  { label: "Tue", chats: 78, voice: 24 },
  { label: "Wed", chats: 54, voice: 15 },
  { label: "Thu", chats: 96, voice: 31 },
  { label: "Fri", chats: 112, voice: 40 },
  { label: "Sat", chats: 88, voice: 27 },
  { label: "Sun", chats: 71, voice: 21 },
];

export const conversationLog = [
  { user: "Priya S.", topic: "Startup idea validation", type: "Chat", messages: 18, time: "2m ago" },
  { user: "Arjun K.", topic: "Fundraising basics", type: "Voice", messages: 12, time: "15m ago" },
  { user: "Meera R.", topic: "Hiring the first engineer", type: "Chat", messages: 24, time: "1h ago" },
  { user: "Dev P.", topic: "Productivity routine", type: "Chat", messages: 9, time: "3h ago" },
  { user: "Sana M.", topic: "Pitch deck feedback", type: "Voice", messages: 15, time: "Yesterday" },
];

export const knowledgeSources = [
  { name: "podcast-transcripts.pdf", type: "PDF", size: "4.2 MB", status: "Processed", updated: "3h ago" },
  { name: "rahulsharma.com/blog", type: "Website", size: "42 pages", status: "Processed", updated: "1d ago" },
  { name: "YouTube — Founder Diaries", type: "YouTube", size: "31 videos", status: "Processing", updated: "1d ago" },
  { name: "Investor FAQ", type: "FAQ", size: "24 entries", status: "Processed", updated: "4d ago" },
];

export const earnings = [
  { month: "September", amount: "₹24,500", sessions: 412, status: "Pending" },
  { month: "August", amount: "₹21,900", sessions: 388, status: "Paid" },
  { month: "July", amount: "₹18,300", sessions: 301, status: "Paid" },
  { month: "June", amount: "₹15,750", sessions: 264, status: "Paid" },
];

export const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    blurb: "Try the platform and meet a few characters.",
    features: ["5 chat messages/day", "Basic character access", "Standard voice", "Community support"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$19",
    blurb: "For people who use their favourite experts daily.",
    features: [
      "Unlimited chats",
      "Premium character access",
      "High-quality voice",
      "Priority support",
      "Analytics dashboard",
    ],
    cta: "Start Pro",
    highlighted: true,
  },
  {
    name: "Business",
    price: "$49",
    blurb: "For creators and teams running their own characters.",
    features: [
      "Everything in Pro",
      "Creator workspace",
      "Custom character creation",
      "Advanced analytics",
      "Dedicated support",
    ],
    cta: "Start Business",
    highlighted: false,
  },
];

export const onboardingSteps = [
  "Basic Information",
  "Create Character",
  "Add Knowledge",
  "Set Rules",
  "Review & Publish",
];
