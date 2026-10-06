import { useMemo, useState } from "react";
import { Search, BookOpen, FileText, Clock, ArrowLeft } from "lucide-react";

import { Screen, SectionHead } from "@/components/Screen";
import { EmptyState } from "@/components/EmptyState";
import { cn } from "@/lib/utils";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface KnowledgeItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: "pdf" | "article" | "guide";
  author?: string;
  readTime?: number;
  tags?: string[];
  content?: string[];
}

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "guides", label: "Guides" },
  { id: "articles", label: "Articles" },
  { id: "pdfs", label: "PDFs" },
  { id: "recovery", label: "Recovery" },
  { id: "islamic", label: "Islamic" },
  { id: "health", label: "Health" },
] as const;

const CATEGORY_ORDER = ["guides", "articles", "pdfs", "recovery", "islamic", "health"];

const KNOWLEDGE_BASE: KnowledgeItem[] = [
  // ── Guides ─────────────────────────────────────────────────────────────
  {
    id: "guide-1",
    title: "Starting Your Streak: The First 7 Days",
    description:
      "A practical guide for the critical first week — morning routines, trigger identification, and how to build momentum.",
    category: "guides",
    type: "guide",
    author: "Fursan",
    readTime: 8,
    tags: ["beginner", "streak", "routine"],
    content: [
      "Day 1 sets the tone. Choose a fixed wake-up time, remove triggers from sight (social apps off your home screen, late-night browsing blocked), and tell one trusted person you are starting.",
      "Days 2–3 are the hardest: dopamine cravings spike while your routine has not yet settled. Keep a notepad of urges with their time and trigger; the act of logging creates a pause between impulse and action.",
      "Day 4 usually breaks. Your body expects the old pattern at the same clock time. When that time arrives, stand up, move somewhere else, and do thirty press-ups. Physical movement interrupts the rumination loop better than willpower.",
      "Days 5–7 are where you cement the new identity. You are not 'trying to quit' — you are someone who does not indulge. Update your phone reminders, blocklists, and even your wallpaper to reflect the new identity.",
      "Evening check: write one sentence — 'Today I kept my streak because …'. Completing this loop makes tomorrow's version easier, because you now have evidence rather than wishful thinking.",
    ],
  },
  {
    id: "guide-2",
    title: "Understanding Triggers: The HALT Method",
    description:
      "Recognise Hunger, Anger, Loneliness and Tiredness as the four states that precede a relapse, and what to do in each.",
    category: "guides",
    type: "guide",
    author: "Fursan",
    readTime: 12,
    tags: ["triggers", "psychology"],
    content: [
      "HALT is a four-question screen to run before any strong craving. Most relapses begin not from lust but from one of these four neglected needs being unattended for hours.",
      "H — Hungry. Low blood sugar mimics craving: both are urgent, physical, and focused. Eat a proper meal or a protein-rich snack first, then reassess. Half the time the urge passes on its own.",
      "A — Angry. Suppressed frustration is fuel. Anger needs a channel: a hard walk, a cold shower, or writing out the grievance on paper without sending it. Do not reason with anger; move through it.",
      "L — Lonely. This is the strongest trigger. Isolation removes accountability. Message a friend, join the Vanguard channels, or sit in a public space. Presence in the world dissolves the craving.",
      "T — Tired. Fatigue degrades prefrontal control — your executive brake literally loses power. A twenty-minute power nap or an early night beats a second cup of coffee.",
      "Practice: each time you feel an urge, say the letters out loud and check each one. When you name the real driver, the urge loses half its authority.",
    ],
  },
  {
    id: "guide-3",
    title: "Managing Urges: The 15-Minute Rule",
    description:
      "An urge is a wave, not a command. Distraction techniques and grounding exercises for the next fifteen minutes.",
    category: "recovery",
    type: "guide",
    author: "Fursan",
    readTime: 5,
    tags: ["urges", "coping"],
    content: [
      "An urge is a physiological wave: it rises, peaks, and falls — usually within 10 to 20 minutes if you do not feed it. The entire strategy is to outwait the wave.",
      "Step 1: Delay by fifteen minutes. Set a timer and tell yourself you may act after it rings, not before. Ninety percent of urges have passed by then.",
      "Step 2: Urge surfing. Sit still, close your eyes, and track where you feel the craving in your body. Watch it swell like a wave and watch it recede. You are the sky; the urge is weather.",
      "Step 3: Grounding if the wave does not break. Name five things you can see, four you can feel, three you can hear, two you can smell, one you can taste. This returns processing to the present moment.",
      "Step 4: Distract for real. Scroll social media is not distraction — it is priming. Do something requiring hands and eyes: cook, clean, text a friend, walk the dog, play a game.",
      "Repeat this protocol every day and rewire the habit loop: your brain learns the cue no longer leads to the act.",
    ],
  },
  {
    id: "guide-4",
    title: "Rebuilding After a Relapse",
    description:
      "Why a single slip does not erase your streak, and how to restart without shame using the evidence-based lapse-and-relapse model.",
    category: "recovery",
    type: "guide",
    author: "Fursan",
    readTime: 7,
    tags: ["relapse", "shame", "restart"],
    content: [
      "Distinguish a lapse from a relapse. A lapse is one incident; a relapse is abandoning the effort. One slip does not erase the progress you made — your skills, awareness, and resilience are still yours.",
      "Avoid the abstinence-violation effect: the belief that because you broke one rule, everything is forfeit. That thinking is what turns a stumble into a binge.",
      "The post-slip window is dangerous — shame makes you want to hide, and hiding removes accountability. Instead, log what happened the same day: context, trigger, emotions, and the time.",
      "Run a blameless autopsy, not a self-trial. Not 'what is wrong with me' but 'what specific situation set me up?' Change the situation next time rather than 'trying harder'.",
      "Restart immediately — that night if possible. Reset your streak in the app and send one honest message to a trusted person. Small honest restarts compound into lasting change.",
    ],
  },
  {
    id: "guide-5",
    title: "Building a Routine That Lasts",
    description:
      "How to structure your day around anchors that make discipline automatic — sleep, movement, connection and purpose.",
    category: "guides",
    type: "guide",
    author: "Fursan",
    readTime: 9,
    tags: ["routine", "habits", "discipline"],
    content: [
      "Discipline is a design problem, not a character test. Build a day with fixed anchors so choices are automated instead of negotiated with yourself at 11 p.m.",
      "Anchor 1 — Morning. Fix your wake-up and first thirty minutes: water, movement, no screen. The early hour is when willpower is highest; use it on the habit, not the scroll.",
      "Anchor 2 — Midday movement. Thirty minutes of walking or exercise daily. Exercise reduces craving intensity by regulating dopamine and lowering baseline arousal.",
      "Anchor 3 — Evening shutdown. A phone curfew one hour before bed; charges outside the bedroom. Sleep is the single highest-leverage recovery intervention available.",
      "Anchor 4 — Weekly review. Each Sunday, glance at your tracker, spot the weak hours, and pre-decide the guard for next week. Planning ahead beats recovering after.",
      "Anchor 5 — Purpose. Write one sentence on why you are doing this and read it daily. Discipline grounded in a reason survives the days when it feels pointless.",
    ],
  },
  {
    id: "guide-6",
    title: "Lowering the Gaze in a Digital Age",
    description:
      "Practical boundaries for screens, social media and advertising — how to protect your attention when the entire internet is designed to grab it.",
    category: "islamic",
    type: "guide",
    author: "Fursan",
    readTime: 6,
    tags: ["gaze", "digital", "boundaries"],
    content: [
      "Lowering the gaze is not only physical; it is architectural. You design your feeds so the trigger never reaches you — that is tawbah in digital form.",
      "Home screen discipline: remove social apps from the first two pages, delete app icons you cannot resist, log in via a browser instead of an app (extra friction saves you), and disable non-human notifications.",
      "Content hygiene: unfollow or mute any account that triggers comparison or craving, no matter how harmless it seems. Curate aggressively; half the time you are not following content, it is following you.",
      "Advertising is weaponised. Use an ad blocker on mobile and desktop, avoid free 'entertainment' sites that rely on invasive ads, and remember that every image is chosen by an algorithm to extract attention.",
      "The Islamic anchor: lower the gaze (Surah An-Nur 24:30–31) is paired with guarding the heart. When your eyes are protected, your heart becomes harder to wound — and that inner firmness is the real victory.",
    ],
  },
  {
    id: "guide-7",
    title: "Tawakkul and Action: An Islamic Framework for Recovery",
    description:
      "How to balance trust in Allah with practical effort — using the Islamic concepts of tawakkul, sabr and muhaasabah to sustain long-term change.",
    category: "islamic",
    type: "guide",
    author: "Fursan",
    readTime: 10,
    tags: ["tawakkul", "sabr", "framework"],
    content: [
      "Tawakkul (trust in Allah) is not passivity; it is action followed by reliance. The Prophet (peace be upon him) tied his camel first, then trusted Allah. Start with the practical steps, then make du'a for steadfastness.",
      "Sabr is endurance with meaning. It is not silence in pain — it is persisting in what is right when the alternative is easier. Every day you choose the harder good, you train sabr for the next craving.",
      "Muhaasabah (self-audit) is nightly. Before sleep, review: where did I succeed today, where did I cut corners, and what will I adjust tomorrow? The Prophet taught that the strong believer audits himself like a business.",
      "Dua is a weapon, not a formality. Use short, repeated supplications at the exact moments you are weakest — upon waking, when you feel the urge, and before bed. Consistency beats eloquence.",
      "Shame and pride: both are traps. Shame distances you from Allah and pushes you back into hiding; pride blinds you to your own weaknesses. Hold to humble dependence — the one that draws you closer.",
    ],
  },

  // ── Articles ───────────────────────────────────────────────────────────
  {
    id: "article-1",
    title: "The Neuroscience of Addiction",
    description:
      "What dopamine and the reward pathway actually do, and why willpower alone is not the missing ingredient.",
    category: "articles",
    type: "article",
    author: "Fursan",
    readTime: 15,
    tags: ["neuroscience", "dopamine"],
    content: [
      "Dopamine is not 'pleasure' — it is craving and learning. It signals expected reward and strengthens the neural pathways that led to it. Each indulgence trains your brain to crave that path harder next time.",
      "The reward pathway (ventral striatum) responds to novelty. Unlimited choice — endless scrolling, countless images — delivers variable rewards, the same schedule that makes gambling addictive.",
      "Prefrontal cortex is your brake and your planner. It is also the slowest and most energy-hungry part of the brain. It works fine in the morning and collapses late at night, which is why willpower is worst at the worst time.",
      "Withdrawal is not drama; it is a hyper-reactive system that has adapted to excess. Until receptors normalise, your brain treats the absence of the stimulus as a threat — hence anxiety, irritability, and insomnia.",
      "What actually works: sleep, exercise, sunlight exposure, social connection, and reduced stimulation. These heal the system. Willpower alone fights a chemical adversary; the lifestyle supports win it.",
    ],
  },
  {
    id: "article-2",
    title: "Building a Support System That Works",
    description:
      "How to find accountability, use the Vanguard channels, and shape an environment that makes the right thing easier.",
    category: "articles",
    type: "article",
    author: "Fursan",
    readTime: 10,
    tags: ["community", "accountability"],
    content: [
      "Addiction thrives in secrecy. The moment you are willing to name your struggle to another person, its power drops sharply. This is why shame-free community is the single most underrated tool in recovery.",
      "Use the Vanguard channels deliberately. Post in SOS when you are in the moment — not for advice, but for connection. Someone replying in two minutes can be the difference between a lapse and a win.",
      "Build a private support circle: one accountability partner you text daily, and one person you can call at 11 p.m. Write their names in your phone's favourites under a normal-sounding label so the access is frictionless.",
      "Environment design: make the default option the healthy one. Sleep in the same room as a charging phone, keep exercise gear visible, unsubscribe from triggering feeds, and curate your following list.",
      "Give as much as you take. Sharing what worked today makes you remember it tomorrow — and helping someone else reinforces your own resolve.",
    ],
  },
  {
    id: "article-3",
    title: "Sleep, Stress, and Relapse",
    description:
      "The hidden connection between poor sleep, chronic stress and relapse — plus a sleep hygiene checklist.",
    category: "health",
    type: "article",
    author: "Fursan",
    readTime: 12,
    tags: ["sleep", "stress", "health"],
    content: [
      "Sleep loss is a near-deterministic relapse predictor: after one night of poor sleep, prefrontal control drops by roughly 60 percent, and cravings increase measurably the next evening.",
      "Chronic stress keeps your threat system on, flooding you with cortisol. Cortisol directly amplifies cue reactivity — reminders of the habit feel more urgent, more rewarding, more irresistible.",
      "The fix is not 'sleep more' but remove the two biggest sleep saboteurs: light and arousal. No screens in bed (blue light suppresses melatonin), and a 30-minute wind-down buffer where the only input is calm.",
      "Sleep hygiene checklist: fixed wake time (including weekends), bedroom cool and dark, phone charging outside the room, caffeine cut off by 2 p.m., 10-minute journal to offload worries before bed.",
      "If you wake at 3 a.m. unable to return to sleep: do not reach for your phone. Get up, sit in dim light, and breathe slowly until drowsy. Fighting it creates performance anxiety that keeps you awake.",
    ],
  },
  {
    id: "article-4",
    title: "CBT and ACT for Problematic Pornography Use",
    description:
      "A 2025 meta-analysis confirms CBT and ACT are the best-evidenced psychotherapies for PPU.",
    category: "articles",
    type: "article",
    author: "López-Pinar et al., J Behav Addict 2025",
    readTime: 14,
    tags: ["cbt", "act", "research", "meta-analysis"],
    content: [
      "CBT (Cognitive Behavioural Therapy) works by identifying the thought chains that precede relapse: boredom → browsing → escalation → indulgence. Once you can spot the chain at its first link, you can interrupt it.",
      "Core CBT tools: stimulus control (remove the trigger entirely), coping imagery (visualise successfully navigating a high-risk situation), and relapse-prevention planning (pre-write the response to your known weak moments).",
      "ACT (Acceptance and Commitment Therapy) takes the opposite route: rather than fighting urges, you learn to make room for them while acting on your values. The urge is weather; your values are the direction you sail.",
      "Both approaches produce the same outcome: reduced PPU symptoms and improved sexual and psychological functioning. Choice between them depends on whether you prefer to change your relationship with thoughts (ACT) or change the thoughts themselves (CBT).",
      "What matters more than the modality is consistency of practice — daily, not just when you are struggling. Skills that are only pulled out during crises rarely stick.",
    ],
  },
  {
    id: "article-5",
    title: "Treatment Approaches for Problematic Pornography Use: Systematic Review",
    description:
      "Roza et al. (2024) reviewed 28 studies and found CBT-based interventions produce large effect sizes for reducing PPU and sexual compulsivity.",
    category: "articles",
    type: "article",
    author: "Roza et al., Arch Sex Behav 2024",
    readTime: 13,
    tags: ["cbt", "research", "systematic-review"],
    content: [
      "The 2024 systematic review synthesised 28 studies on PPU treatment. CBT-based interventions consistently produced large effect sizes for both reducing use and reducing compulsive symptoms.",
      "Key finding: interventions that combine individual therapy with skills practice, relapse-prevention planning, and partner or peer involvement outperform single-component approaches.",
      "Add-on benefits: mindfulness-based approaches and motivation-enhancing conversations increased retention and reduced shame, which are the two factors most likely to derail progress.",
      "Comorbidity matters: PPU commonly co-occurs with anxiety, depression, and ADHD. The most effective treatment addresses the comorbidity — often unmasking that the 'addiction' is a coping strategy for an untreated condition.",
      "Practical translation: if self-help is all you can access right now, build your own CBT structure — identify triggers, pre-write responses, schedule review sessions, and seek a support person. You do not need a clinic to apply evidence-based methods.",
    ],
  },
  {
    id: "article-6",
    title: "How to Overcome Porn Addiction in Islam",
    description:
      "A structured fatwa-based guide covering repentance (tawbah), taqwa, practical habit-replacement and nightly self-evaluation.",
    category: "islamic",
    type: "article",
    author: "About Islam",
    readTime: 11,
    tags: ["islamic", "tawbah", "practical"],
    content: [
      "Tawbah (repentance) has three conditions: stop the act, feel genuine remorse, and resolve not to return. True repentance also requires fixing what was damaged where possible; for a sin between you and Allah, sincere regret and resolution suffice.",
      "Taqwa is self-monitoring — living as if you are aware you are always observed by Allah. When you genuinely internalise this, the urge is met with a question before you answer it: 'Is this what the Watchful One would be pleased with?'",
      "The practical ladder: fast voluntarily (the Prophet recommended fasting as a shield), lower the gaze by curating your digital space, make wudu when an urge strikes — water is a physical reset that breaks the trance, and keep company with righteous people.",
      "Nightly muhaasabah: before sleep, review your day. Every night you audit yourself, you build the habit of self-awareness that catches you before the sin rather than after.",
      "Despair is not an option. Shaytan's two tricks are hope (you will do it again anyway) and despair (Allah will not forgive you). Both are lies. Turn, again, again, again — that is the pattern of the believer.",
    ],
  },
  {
    id: "article-7",
    title: "Overcoming Addictions Through Faith: Ibn Al-Qayyim’s Rehabilitation Program",
    description:
      "Yaqeen Institute summarises classical Islamic psychology for addiction — the three stages of the nafs and how taqwa breaks the craving cycle.",
    category: "islamic",
    type: "article",
    author: "Yaqeen Institute",
    readTime: 12,
    tags: ["islamic", "nafs", "taqwa", "yaqeen"],
    content: [
      "Ibn Al-Qayyim describes three stages of the nafs: the commanding self (ammarah) which urges evil, the self-reproaching self (lawwamah) which feels remorse, and the tranquilised self (mutma'innah) at peace with its Lord. Addiction thrives in the first stage.",
      "The rehabilitation method has three phases. Phase one: suppress the symptom with shields — fasting, guarding the gaze, avoiding triggers, keeping good company. Phase two: understand the disease by examining its roots and replacing it with healthier outlets. Phase three: nourish the heart with remembrance until it finds real contentment.",
      "Craving in this framework is a void: the heart, created to love the Divine, will cling to the nearest substitute. The cure is filling it, not merely starving it. This is why the Prophet paired prohibition with positive replacement.",
      "Practical programme: five daily prayers as the spine of the day, voluntary night prayer for inner strength, daily dhikr as a counterweight to obsession, and serving others to shift focus from the self.",
      "Relapse in this light is a slip in one's spiritual state, not a failure of character. The fix is not self-flagellation but returning — the gates of mercy are described as opening wider for the one who keeps coming back.",
    ],
  },

  // ── PDFs ───────────────────────────────────────────────────────────────
  {
    id: "pdf-1",
    title: "The Fursan Recovery Workbook",
    description:
      "A 30-day workbook with daily reflections, a trigger log, gratitude practice and progress tracking.",
    category: "pdfs",
    type: "pdf",
    author: "Fursan",
    readTime: 30,
    tags: ["workbook", "printable"],
    content: [
      "Day structure for each of the 30 days: one trigger you expect, one coping plan for it, one value reminder, one gratitude entry, and an evening rating of your day 1–10 with the reason.",
      "Trigger log: record time, location, emotion before the urge, and what you did. Patterns emerge within two weeks — the same hour, the same app, the same feeling — and patterns are what you redesign.",
      "Gratitude practice: three specific things each night. This retrains the attention system away from what is being denied toward what is being gained.",
      "Milestone pages: mark every 7-day, 30-day, and 90-day checkpoint with what you have learned about yourself, not just what you have achieved.",
    ],
  },
  {
    id: "pdf-2",
    title: "Islamic Perspective on Recovery",
    description:
      "Quranic verses, hadith and scholarly framing for overcoming addiction from an Islamic standpoint.",
    category: "pdfs",
    type: "pdf",
    author: "Fursan",
    readTime: 20,
    tags: ["islamic", "quran", "hadith"],
    content: [
      "Foundations: key verses on guarding the lower half (An-Nur 24:30–31), on not destroying oneself, and on Allah's mercy exceeding wrath. Each verse is paired with its practical reading.",
      "Hadith on prevention and cure: the Prophet's guidance on lowering the gaze, fasting as a shield, guarding one's tongue and honour, and the principle that every disease has a cure.",
      "Scholarly framing: how classical scholars understood compulsive behaviour and the distinction between desire and enslavement to desire. Addiction is not a verdict on your faith; it is a battle you fight with Allah's help.",
      "Daily programme from the Sunnah: morning and evening adhkar, the five prayers as anchors, voluntary fasts, and the night prayer — each positioned as a recovery tool, not only a ritual.",
    ],
  },

  // ── Recovery resources (embedded summaries) ────────────────────────────
  {
    id: "resource-1",
    title: "SMART Recovery 4-Point Program",
    description:
      "Free, evidence-based mutual-support meetings grounded in CBT and REBT. Covers motivation, urge management, thoughts and lifestyle balance.",
    category: "recovery",
    type: "guide",
    author: "SMART Recovery International",
    readTime: 8,
    tags: ["cbt", "meetings", "peer-support"],
    content: [
      "Point 1 — Building and Maintaining Motivation: explore the costs and benefits of your behaviour, use importance/confidence rulers to clarify ambivalence, and visualise a future self you want to become.",
      "Point 2 — Coping with Urges: urge management, 'urge surfing', delayed gratification, and the ABC tool — activating event, beliefs, and consequences — to see how your thinking drives your feeling.",
      "Point 3 — Managing Thoughts, Feelings and Emotions: dispute unhelpful beliefs, replace 'shoulds' with preferences, and use rational emotion-responses rather than shame.",
      "Point 4 — Lifestyle Balance: build a life worth protecting — sleep, nutrition, exercise, work, and relationships — because a balanced life reduces reliance on any single coping mechanism.",
    ],
  },
  {
    id: "resource-2",
    title: "SMART Recovery Toolbox",
    description:
      "Worksheets and exercises including the ABC Exercise, Cost-Benefit Analysis, Urge Log, and Disputing Unhelpful Beliefs.",
    category: "recovery",
    type: "guide",
    author: "SMART Recovery",
    readTime: 10,
    tags: ["tools", "worksheets", "cbt"],
    content: [
      "Cost-benefit analysis: list every short-term gain and long-term cost of the behaviour, and every short-term resistance and long-term benefit of change. Read it when motivation dips.",
      "ABC exercise: record the Activating event, your beliefs about it, and the Consequences (emotional, behavioural). Then dispute the irrational beliefs and observe how consequences shift.",
      "Urge log: timestamp each urge, rate intensity 1–10, note duration, and record what got you through it. Review weekly to spot peaks and effective strategies.",
      "Disputing unhelpful beliefs: write down the belief, the evidence for it, the evidence against it, and a balanced alternative. Practice weekly until the balanced view feels more natural.",
    ],
  },
  {
    id: "resource-3",
    title: "Your Brain on Porn",
    description:
      "Gary Wilson's book summarising the neuroscience of internet pornography and the reboot movement. Includes training materials for professionals.",
    category: "articles",
    type: "article",
    author: "Gary Wilson",
    readTime: 16,
    tags: ["neuroscience", "reboot", "book"],
    content: [
      "Core claim: internet pornography delivers novel, infinite, high-speed reward in a way evolution never prepared the brain for, producing habituation and escalated tolerance — the same pattern seen in substance dependence.",
      "The 90-day reboot: a structured period of sexual rest allowing the reward system to normalise. Users report restored sensitivity, improved motivation, reduced anxiety, and better mood by day 30–60.",
      "Withdrawal is real and time-limited: irritability, flat mood, and strong cravings typically peak in the first two weeks and subside. Knowing this is the difference between quitting and staying off.",
      "Escalation trap: the more you consume, the more extreme the content you need for the same response. Stopping early — when habits are young — is the single biggest predictor of a clean recovery.",
      "Tools offered: a personal progress tracker, educational videos for yourself and your partner, and evidence summaries for clinicians. The same materials apply to porn-free living at any age.",
    ],
  },
  {
    id: "resource-4",
    title: "The Willpower Instinct",
    description:
      "Stanford psychologist Kelly McGonigal's science-based program for strengthening self-control.",
    category: "articles",
    type: "article",
    author: "Kelly McGonigal, PhD",
    readTime: 14,
    tags: ["willpower", "self-control", "book"],
    content: [
      "Willpower is a muscle with three functions: 'I won't' (resisting temptation), 'I will' (doing what matters), and 'I want' (remembering your goal). Most relapses happen when 'I want' goes quiet.",
      "The two-self model: a present self seeking immediate relief and a future self seeking long-term wellbeing. Self-control is negotiation between them, not war. Bargain with yourself like you would with a friend.",
      "The white bear effect: suppressing thoughts backfires. Trying not to think about something makes it more prominent. Accept the thought, then choose your action.",
      "Compassion beats criticism: self-criticism after a slip raises stress, and stress raises craving. Self-compassion preserves your sense of control and keeps you on track.",
      "Practical exercises from the book: mindful breathing to strengthen the 'I want' self, implementation intentions ('if-then' plans), sleep and exercise as willpower fuel, and reframing temptation as disgust or neutrality.",
    ],
  },
  {
    id: "resource-5",
    title: "Iman Cave: Overcoming Addictions",
    description:
      "Video series with Dr. Omar Husain discussing how pornography addiction affects faith, relationships and self-control from an Islamic psychological perspective.",
    category: "islamic",
    type: "guide",
    author: "Yaqeen Institute",
    readTime: 20,
    tags: ["video", "islamic", "yaqeen", "imancave"],
    content: [
      "Series premise: addiction is not a modern weakness but a recurring human struggle addressed by both psychology and revelation. Understanding it as both a spiritual and psychological condition removes shame and doubles your tools.",
      "Core themes: how pornography rewires desire and erodes faith (iman) over time, the psychological roots of compulsive behaviour, and practical steps grounded in the Islamic tradition.",
      "Practical toolkit: the same shields found across the tradition — fasting, lowering the gaze, guarding the home screen, consistent prayer, and honest companionship — presented with modern psychological support.",
      "Stories and interviews: real accounts from men in recovery, showing that progress is non-linear, relapse is survivable, and returning is always rewarded.",
    ],
  },
  {
    id: "resource-5b",
    title: "Advice to Muslims on the Means of Attaining Chastity",
    description:
      "Classic and contemporary guidance on protecting one's chastity through prayer, fasting, dhikr, and keeping good company.",
    category: "islamic",
    type: "article",
    author: "IslamWeb",
    readTime: 9,
    tags: ["chastity", "taqwa", "practical"],
    content: [
      "The core advice: make the obligatory prayers your first priority, because the Prophet promised that they ward off evil — neglecting them leaves the heart exposed.",
      "Fasting as a shield: make it voluntary and consistent, even a few days a week. It weakens desire physically and trains restraint psychologically.",
      "Guard your heart's diet: reduce idle conversation, avoid gatherings and media that normalise sin, and keep the company of people who remind you of your purpose.",
      "Increase good deeds and dhikr: a heart busy in remembrance has less room for obsession. The Prophet's guidance to fill your days with beneficial activity is the fastest way to crowd out temptation.",
      "Seek knowledgeable help if you are stuck: shame keeps you isolated; a trusted scholar or counsellor can give tailored, compassionate guidance.",
    ],
  },
  {
    id: "resource-6",
    title: "NetPsychology: 30-Day Evidence-Based Action Plan",
    description:
      "A structured, shame-free 30-day plan for porn addiction recovery grounded in CBT, ACT and behavioural activation.",
    category: "recovery",
    type: "guide",
    author: "NetPsychology",
    readTime: 18,
    tags: ["cbt", "act", "30-day-plan"],
    content: [
      "Week 1 — Reset: stop the behaviour completely, clean your digital environment, remove access points, and prepare a written list of triggers and responses. Do not negotiate with the urge; change the environment.",
      "Week 2 — Understand: begin the daily trigger log. Identify the pattern (boredom, stress, loneliness, fatigue) rather than fighting the symptom alone.",
      "Week 3 — Rebuild: install replacement behaviours — exercise, social contact, skill-building — so the empty space left by the habit is filled constructively rather than with rumination.",
      "Week 4 — Consolidate: write your own relapse-prevention plan using everything you learned. Review what worked, what did not, and pre-commit to your response for the next high-risk situation.",
      "Shame is explicitly excluded from this framework: shame is treated as an obstacle to recovery, not a tool for it. Mistakes become data for adjustment, not evidence of failure.",
    ],
  },

  // ── Health ─────────────────────────────────────────────────────────────
  {
    id: "health-1",
    title: "Exercise and Mental Health: A Meta-Analysis",
    description:
      "A 2023 systematic review confirms regular exercise significantly reduces symptoms of depression and anxiety — key relapse drivers.",
    category: "health",
    type: "article",
    author: "Schuch et al., J Psychiatr Res 2023",
    readTime: 12,
    tags: ["exercise", "mental-health", "research"],
    content: [
      "The meta-analysis found exercise produces medium-to-large reductions in depressive symptoms, with the largest effects for people starting at higher baseline severity — precisely the group that needs it most.",
      "Exercise reduces anxiety through several mechanisms: physiological arousal regulation, improved sleep, mastery experiences, and social interaction when done in groups.",
      "Dose matters less than consistency: any regular activity — walking, cycling, swimming, weight training — shows benefit. The best programme is the one you will actually do consistently.",
      "Why it matters for recovery: relapse is often triggered by low mood, anxiety, and boredom. Exercise attacks all three, which is why it is one of the strongest protective factors for abstinence.",
      "Practical start: ten minutes a day is a valid dose. Build from there. The first two weeks are about establishing the habit, not intensity.",
    ],
  },
  {
    id: "health-2",
    title: "Sleep Hygiene and Self-Control",
    description:
      "Walker (2017) and others show sleep deprivation degrades prefrontal cortex function, directly reducing willpower and increasing impulsive behaviour.",
    category: "health",
    type: "article",
    author: "Matthew Walker, Why We Sleep",
    readTime: 10,
    tags: ["sleep", "prefrontal", "willpower"],
    content: [
      "Sleep loss severs the connection between the rational brain and the emotional brain. The emotional centre becomes more reactive while the rational brake loses power — you become emotionally volatile and impulsive.",
      "Sleep is when the brain consolidates the day's learning — including the lessons of self-control. Poor sleep means you relearn the same mistakes every day.",
      "Consequences for recovery: a night of poor sleep predicts a weaker day of self-control, which is why protecting sleep is not a luxury but a recovery requirement.",
      "Sleep hygiene essentials: consistent schedule, cool and dark room, phone out of the bedroom, morning daylight within an hour of waking, and a wind-down that is screen-free.",
      "One-night fix is impossible: the sleep system needs repeated good nights to recover. Treat each night as a deposit into an account you are withdrawing from the next day.",
    ],
  },
  {
    id: "health-3",
    title: "The First Step to Overcoming Addiction: An Islamic Guide",
    description:
      "Guide to nafs-stage psychology, repentance, habit replacement, and practical taqwa-based boundaries for digital age triggers.",
    category: "islamic",
    type: "article",
    author: "IslamOnline",
    readTime: 11,
    tags: ["islamic", "nafs", "tawbah", "practical"],
    content: [
      "The first step is honest admission — to yourself and to Allah. Concealment is what feeds the habit; naming it removes its power.",
      "Nafs-stage psychology: recognise you are currently in the ammarah (commanding) stage, move toward lawwamah (self-reproaching) through nightly audit, and aim for mutma'innah (tranquillised) through sustained remembrance.",
      "Tawbah is immediate and always open: stop now, feel regret, resolve never to return. There is no waiting for a 'better time'; the next best moment is this moment.",
      "Replace the habit, do not just remove it: the Prophet taught that when one desire is removed, replace it with a beneficial one. Channel the same energy into prayer, fasting, study, exercise, or service.",
      "Boundaries for the digital age: curate your feeds, block triggering sites, remove apps from easy reach, and charge your phone outside your room. Design your environment so taqwa is the easy path.",
    ],
  },
];

const TYPE_STYLE: Record<KnowledgeItem["type"], string> = {
  pdf: "border-danger/40 text-danger",
  guide: "border-accent/40 text-accent",
  article: "border-border text-ink-muted",
};

const TYPE_ICON = { pdf: FileText, guide: BookOpen, article: FileText } as const;

export default function Library() {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<KnowledgeItem | null>(null);
  const { isOnline, isSyncing, pendingCount, droppedCount } = useNetworkStatus();

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return KNOWLEDGE_BASE.filter((item) => {
      if (category !== "all" && item.category !== category) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        (item.tags ?? []).some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [category, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, KnowledgeItem[]>();
    for (const item of results) {
      const list = map.get(item.category) ?? [];
      list.push(item);
      map.set(item.category, list);
    }
    return [...map.entries()].sort(
      ([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b),
    );
  }, [results]);

    /* ── Reader ─────────────────────────────────────────────────────────── */
    if (selected) {
      return (
        <Screen title="Library" back>
          <article className="card overflow-y-auto [-webkit-overflow-scrolling:touch] [touch-action:pan-y] [overscroll-behavior:contain] scrollbar-thin scrollbar-thumb-ink-muted scrollbar-track-transparent">
          <span
            className={cn(
              "inline-block rounded-full border px-2.5 py-1 text-label uppercase",
              TYPE_STYLE[selected.type],
            )}
          >
            {selected.type}
          </span>

          <h2 className="mt-3 text-display-l font-semibold text-ink">{selected.title}</h2>
          <p className="mt-2 text-body text-ink-muted">{selected.description}</p>

          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-y border-border py-3 font-data text-meta text-ink-muted">
            {selected.author && (
              <div>
                <dt className="sr-only">Author</dt>
                <dd>{selected.author}</dd>
              </div>
            )}
            {selected.readTime ? (
              <div className="inline-flex items-center gap-1.5">
                <dt className="sr-only">Reading time</dt>
                <Clock className="h-3 w-3" aria-hidden="true" />
                <dd>{selected.readTime} min</dd>
              </div>
            ) : null}
          </dl>

          {(selected.tags ?? []).length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {(selected.tags ?? []).map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-surface-2 px-2.5 py-1 font-data text-meta text-ink-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}

          {selected.content && selected.content.length > 0 && (
            <div className="mt-6 space-y-3 border-t border-border pt-4">
              {selected.content.map((paragraph, index) => (
                <p key={index} className="text-body leading-relaxed text-ink">
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setSelected(null)}
            className="mt-4 inline-flex h-11 items-center gap-2 px-1 text-label uppercase text-ink-muted transition-colors hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Back to library
          </button>
        </article>
      </Screen>
    );
  }

  /* ── Index ──────────────────────────────────────────────────────────── */
  return (
    <Screen title="Library" subtitle="Guides, articles and references">
      <div role="search">
        <label htmlFor="library-search" className="text-label uppercase text-ink-faint">
          Search
        </label>
        <div className="relative mt-2">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
            aria-hidden="true"
          />
          <input
            id="library-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Guides, articles, PDFs…"
            className="h-12 w-full rounded-md border border-border bg-surface pl-9 pr-3 text-body text-ink placeholder:text-ink-faint"
          />
        </div>
      </div>

      <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            aria-pressed={category === cat.id}
            className={cn(
              "inline-flex h-9 shrink-0 items-center rounded-full border px-3.5 text-meta font-medium transition-colors duration-fast",
              category === cat.id
                ? "border-ink bg-ink text-bg"
                : "border-border text-ink-muted hover:border-ink-faint hover:text-ink",
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="pt-8">
          <EmptyState
            icon={<BookOpen className="h-8 w-8" aria-hidden="true" />}
            title="Nothing matches that"
            description="Try a shorter search, or clear the filter to see everything."
          />
        </div>
      ) : (
        grouped.map(([cat, items]) => (
          <section key={cat}>
            <SectionHead>{CATEGORIES.find((c) => c.id === cat)?.label ?? cat}</SectionHead>
            <ul className="surface-group">
              {items.map((item) => {
                const Icon = TYPE_ICON[item.type];
                return (
                  <li key={item.id}>
                    <button type="button" onClick={() => setSelected(item)} className="row">
                      <span
                        className={cn(
                          "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border bg-transparent",
                          TYPE_STYLE[item.type],
                        )}
                        aria-hidden="true"
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-body-s font-medium leading-snug text-ink">
                          {item.title}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-meta text-ink-muted">
                          {item.description}
                        </span>
                        {item.readTime ? (
                          <span className="mt-1 inline-flex items-center gap-1 font-data text-meta text-ink-faint">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            {item.readTime} min read
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
      {isOnline || pendingCount > 0 || droppedCount > 0 && (
        <div className="mt-8 p-4 bg-surface/50 border border-border rounded-lg">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <span className={cn(
                "h-3.5 w-3.5 shrink-0",
                isOnline ? "text-success" : "text-warning",
              )}>
                {isOnline ? "✓" : "✗"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-label font-medium text-ink">
                {isOnline ? "Relays synced" : "Relays offline"}
              </p>
              {pendingCount > 0 && (
                <p className="text-body-s text-ink-muted mt-0.5">
                  {pendingCount} {pendingCount === 1 ? "message waiting" : "messages waiting"}
                </p>
              )}
              {droppedCount > 0 && (
                <p className="text-body-s text-ink-muted mt-0.5">
                  {droppedCount} messages dropped
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      {!(isOnline && pendingCount === 0 && droppedCount === 0) && (
        <div className="mt-8 p-4 bg-surface/50 border border-border rounded-lg">
          <h3 className="text-label font-semibold text-ink mb-2">
            How to find more relay networks
          </h3>
          <p className="text-body-s text-ink-muted">
            To add more relays, go to <a href="/settings/relay" className="text-ink underline hover:text-accent">Settings → Relay settings</a> and enter additional WebSocket URLs. Common public relays include:
          </p>
          <ul className="mt-2 text-body-s text-ink-muted space-y-1">
            <li>
              wss://nos.lol
            </li>
            <li>
              wss://relay.damus.io
            </li>
            <li>
              wss://relay.snort.social
            </li>
          </ul>
          <p className="mt-2 text-xs text-ink-muted">
            You can also use the Nostr NIP-11 discovery to find relays by visiting
            <a href="/#/vitals" className="text-ink underline hover:text-accent">
              your vitals page
            </a> and checking the relay status.
          </p>
        </div>
      )}
    </Screen>
  );
}