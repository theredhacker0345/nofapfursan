import { useMemo, useState, useRef, useEffect } from "react";
import { Search, BookOpen, FileText, Clock, ArrowLeft, Check, X } from "lucide-react";

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
      "Day 1 sets the tone. Choose a fixed wake-up time, remove triggers from sight (social apps off your home screen, late-night browsing blocked), and tell one trusted person you are starting. The first decision is the hardest — make it easy by preparing the night before.",
      "Days 2–3 are the hardest: dopamine cravings spike while your routine has not yet settled. Keep a notepad of urges with their time and trigger; the act of logging creates a pause between impulse and action. This is the single most effective tool in the first 72 hours.",
      "Day 4 usually breaks. Your body expects the old pattern at the same clock time. When that time arrives, stand up, move somewhere else, and do thirty press-ups. Physical movement interrupts the rumination loop better than willpower ever will.",
      "Days 5–7 are where you cement the new identity. You are not 'trying to quit' — you are someone who does not indulge. Update your phone reminders, blocklists, and even your wallpaper to reflect the new identity. Identity change is what makes discipline automatic.",
      "Evening check: write one sentence — 'Today I kept my streak because …'. Completing this loop makes tomorrow's version easier, because you now have evidence rather than wishful thinking. Evidence builds confidence; confidence builds streaks.",
      "The first week is about survival, not perfection. If you slip, log it immediately and restart that same night. A single slip does not erase the progress — the skills you practiced are still yours.",
      "Prepare your environment before Day 1: delete browsing history, install site blockers, charge your phone outside the bedroom, and set a consistent sleep schedule. Environment design beats motivation every time.",
      "Tell one person you trust about your streak. Accountability is not shame — it is a safety net. The person does not need to judge; they just need to know.",
      "Track your streak visibly. A calendar with a big X for each day is powerful because it creates a visual chain — and breaking the chain feels worse than keeping it intact.",
      "Celebrate small wins. Day 1, Day 3, Day 7 — each milestone deserves recognition. Positive reinforcement rewires the brain faster than punishment ever will.",
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
      "HALT is a four-question screen to run before any strong craving. Most relapses begin not from lust but from one of these four neglected needs being unattended for hours. The craving is a symptom; the unmet need is the cause.",
      "H — Hungry. Low blood sugar mimics craving: both are urgent, physical, and focused. Eat a proper meal or a protein-rich snack first, then reassess. Half the time the urge passes on its own once blood sugar stabilises.",
      "A — Angry. Suppressed frustration is fuel. Anger needs a channel: a hard walk, a cold shower, or writing out the grievance on paper without sending it. Do not reason with anger; move through it. Physical movement discharges the stress hormones.",
      "L — Lonely. This is the strongest trigger. Isolation removes accountability. Message a friend, join the Vanguard channels, or sit in a public space. Presence in the world dissolves the craving — loneliness thrives in silence.",
      "T — Tired. Fatigue degrades prefrontal control — your executive brake literally loses power. A twenty-minute power nap or an early night beats a second cup of coffee. Sleep is the single highest-leverage recovery intervention available.",
      "Practice: each time you feel an urge, say the letters out loud and check each one. When you name the real driver, the urge loses half its authority. Naming it is the first step to managing it.",
      "Keep a HALT journal for two weeks. Record each urge with the HALT state that preceded it. Patterns will emerge — the same hour, the same feeling, the same situation. Patterns are what you redesign.",
      "The HALT method is not about suppressing the urge — it is about understanding it. Every urge has a message. Listen to the message, then choose a different response.",
      "Combine HALT with the 15-minute rule: when you identify the trigger, delay action by fifteen minutes. Use that time to address the HALT state — eat if hungry, move if angry, connect if lonely, rest if tired.",
      "Over time, the HALT check becomes automatic. You will catch yourself before the craving escalates. That is the goal — not never feeling the urge, but always having a better response ready.",
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
      "An urge is a physiological wave: it rises, peaks, and falls — usually within 10 to 20 minutes if you do not feed it. The entire strategy is to outwait the wave. You do not need to defeat the urge; you just need to survive it.",
      "Step 1: Delay by fifteen minutes. Set a timer and tell yourself you may act after it rings, not before. Ninety percent of urges have passed by then. The timer gives you a concrete endpoint to focus on.",
      "Step 2: Urge surfing. Sit still, close your eyes, and track where you feel the craving in your body. Watch it swell like a wave and watch it recede. You are the sky; the urge is weather. The sky does not fight the weather — it just exists alongside it.",
      "Step 3: Grounding if the wave does not break. Name five things you can see, four you can feel, three you can hear, two you can smell, one you can taste. This returns processing to the present moment and away from the craving.",
      "Step 4: Distract for real. Scroll social media is not distraction — it is priming. Do something requiring hands and eyes: cook, clean, text a friend, walk the dog, play a game. The distraction must be active, not passive.",
      "Repeat this protocol every day and rewire the habit loop: your brain learns the cue no longer leads to the act. The neural pathway weakens through non-use and strengthens through alternative responses.",
      "Track your success rate. Each time you use the 15-minute rule and the urge passes, log it. After two weeks, you will see a pattern: the urges are shorter, less intense, and further apart.",
      "Remember: the urge is not you. It is a sensation in your body, amplified by your thoughts. You can observe it without obeying it. That observation is the beginning of freedom.",
      "If you do slip, do not use it as proof that the method does not work. Use it as data. What triggered the slip? What was the HALT state? What would you do differently next time? Every slip is a learning opportunity.",
      "The 15-minute rule is not a permanent solution — it is a training tool. As your streaks grow longer, the urges become weaker and less frequent. The goal is to reach a point where the rule is no longer needed.",
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
      "Distinguish a lapse from a relapse. A lapse is one incident; a relapse is abandoning the effort. One slip does not erase the progress you made — your skills, awareness, and resilience are still yours. The streak counter is a tool, not a measure of your worth.",
      "Avoid the abstinence-violation effect: the belief that because you broke one rule, everything is forfeit. That thinking is what turns a stumble into a binge. The first act after a lapse determines whether it becomes a relapse.",
      "The post-slip window is dangerous — shame makes you want to hide, and hiding removes accountability. Instead, log what happened the same day: context, trigger, emotions, and the time. Write it down before the shame distorts the memory.",
      "Run a blameless autopsy, not a self-trial. Not 'what is wrong with me' but 'what specific situation set me up?' Change the situation next time rather than 'trying harder'. Situation changes are more reliable than willpower.",
      "Restart immediately — that night if possible. Reset your streak in the app and send one honest message to a trusted person. Small honest restarts compound into lasting change. Delaying the restart gives shame time to grow.",
      "Review your streak history. Look at the longest streak you have ever had. You have done this before — you can do it again. The data proves you are capable of more than one slip.",
      "Identify the top three relapse triggers from your log. For each trigger, write a specific prevention plan: what you will do differently when that trigger appears. Prevention is better than recovery.",
      "Forgive yourself. This is not a platitude — it is a strategy. Self-compassion reduces cortisol, which reduces craving. Shame increases cortisol, which increases craving. The cycle is broken by compassion, not criticism.",
      "Tell someone you trust about the lapse. Secrecy is what feeds shame. Sharing it with a safe person removes its power and often brings unexpected support.",
      "Remember: relapse is not failure. It is feedback. The question is not 'why did I slip?' but 'what can I learn from this slip?' The answer to the second question is what builds lasting change.",
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
      "Discipline is a design problem, not a character test. Build a day with fixed anchors so choices are automated instead of negotiated with yourself at 11 p.m. The goal is to make the right thing the easy thing.",
      "Anchor 1 — Morning. Fix your wake-up and first thirty minutes: water, movement, no screen. The early hour is when willpower is highest; use it on the habit, not the scroll. A morning routine sets the tone for the entire day.",
      "Anchor 2 — Midday movement. Thirty minutes of walking or exercise daily. Exercise reduces craving intensity by regulating dopamine and lowering baseline arousal. It is not optional — it is a recovery tool.",
      "Anchor 3 — Evening shutdown. A phone curfew one hour before bed; charges outside the bedroom. Sleep is the single highest-leverage recovery intervention available. Poor sleep is the single strongest relapse predictor.",
      "Anchor 4 — Weekly review. Each Sunday, glance at your tracker, spot the weak hours, and pre-decide the guard for next week. Planning ahead beats recovering after. The review takes ten minutes and prevents hours of struggle.",
      "Anchor 5 — Purpose. Write one sentence on why you are doing this and read it daily. Discipline grounded in a reason survives the days when it feels pointless. The reason is your anchor when motivation fades.",
      "Stack habits: attach a new habit to an existing one. After brushing teeth, write in the journal. After morning prayer, review the day's plan. Habit stacking reduces the cognitive load of remembering.",
      "Start small. One anchor per week, not five. Master the morning routine before adding the evening shutdown. Small wins compound into large changes over time.",
      "Track your anchors. A simple checkmark for each completed anchor builds a visual record of consistency. Consistency is more important than intensity — a small habit done daily beats a big habit done sporadically.",
      "Review and adjust monthly. What worked? What did not? What needs to change? The routine is a living system, not a rigid contract. Flexibility within structure is the key to long-term adherence.",
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
      "Lowering the gaze is not only physical; it is architectural. You design your feeds so the trigger never reaches you — that is tawbah in digital form. The goal is not willpower; it is environment design.",
      "Home screen discipline: remove social apps from the first two pages, delete app icons you cannot resist, log in via a browser instead of an app (extra friction saves you), and disable non-human notifications. Every friction point is a prevention point.",
      "Content hygiene: unfollow or mute any account that triggers comparison or craving, no matter how harmless it seems. Curate aggressively; half the time you are not following content, it is following you. Your feed is your environment.",
      "Advertising is weaponised. Use an ad blocker on mobile and desktop, avoid free 'entertainment' sites that rely on invasive ads, and remember that every image is chosen by an algorithm to extract attention. You are not the customer — you are the product.",
      "The Islamic anchor: lower the gaze (Surah An-Nur 24:30–31) is paired with guarding the heart. When your eyes are protected, your heart becomes harder to wound — and that inner firmness is the real victory. The external boundary protects the internal state.",
      "Set screen time limits. Use the built-in screen time tools on your phone to cap social media at 30 minutes per day. When the limit hits, the phone reminds you — and that reminder is a moment to choose differently.",
      "Create phone-free zones: the bedroom, the prayer space, the dining table. These zones are sacred spaces where the digital world does not enter. Protect them fiercely.",
      "Replace scrolling with reading. Keep a physical book or the Fursan library app on your home screen. When the urge to scroll hits, open the library instead. The content is designed to help you, not to extract from you.",
      "The goal is not to never look at a screen — it is to look intentionally. Every screen interaction should have a purpose. If you cannot name the purpose, put the phone down.",
      "Lowering the gaze is a practice, not a achievement. Some days you will succeed; some days you will not. The practice continues regardless. Consistency, not perfection, is what builds the habit.",
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
      "Tawakkul (trust in Allah) is not passivity; it is action followed by reliance. The Prophet (peace be upon him) tied his camel first, then trusted Allah. Start with the practical steps, then make du'a for steadfastness. Action and trust are not opposites — they are partners.",
      "Sabr is endurance with meaning. It is not silence in pain — it is persisting in what is right when the alternative is easier. Every day you choose the harder good, you train sabr for the next craving. Sabr is a muscle that grows with use.",
      "Muhaasabah (self-audit) is nightly. Before sleep, review: where did I succeed today, where did I cut corners, and what will I adjust tomorrow? The Prophet taught that the strong believer audits himself like a business. The audit is not for judgment — it is for improvement.",
      "Dua is a weapon, not a formality. Use short, repeated supplications at the exact moments you are weakest — upon waking, when you feel the urge, and before bed. Consistency beats eloquence. The same words repeated daily become a shield.",
      "Shame and pride: both are traps. Shame distances you from Allah and pushes you back into hiding; pride blinds you to your own weaknesses. Hold to humble dependence — the one that draws you closer. Humility is the foundation of tawakkul.",
      "The three stages of the nafs: ammarah (commanding self) urges evil; lawwamah (self-reproaching self) feels remorse; mutma'innah (tranquillised self) is at peace. Recovery moves you from ammarah toward mutma'innah. Each day is a step on that journey.",
      "Make wudu when an urge strikes — water is a physical reset that breaks the trance. The ritual of purification is not just physical; it is a psychological boundary that says 'this moment is sacred, I choose differently'.",
      "Fasting is a shield. The Prophet recommended fasting as a shield against desire. Even voluntary fasting on Mondays and Thursdays weakens the grip of craving and strengthens the spirit. Fasting is not about hunger — it is about mastery.",
      "Keep good company. The Prophet said, 'A person is upon the religion of their close friend.' Surround yourself with people who remind you of your purpose. Isolation is the enemy of recovery; community is its foundation.",
      "Despair is not an option. Shaytan's two tricks are hope (you will do it again anyway) and despair (Allah will not forgive you). Both are lies. Turn, again, again, again — that is the pattern of the believer. The gate of tawbah is always open.",
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
      "Dopamine is not 'pleasure' — it is craving and learning. It signals expected reward and strengthens the neural pathways that led to it. Each indulgence trains your brain to crave that path harder next time. The pathway is not a reward circuit; it is a motivation circuit.",
      "The reward pathway (ventral striatum) responds to novelty. Unlimited choice — endless scrolling, countless images — delivers variable rewards, the same schedule that makes gambling addictive. The brain does not get 'used to' the stimulus; it gets sensitised to it.",
      "Prefrontal cortex is your brake and your planner. It is also the slowest and most energy-hungry part of the brain. It works fine in the morning and collapses late at night, which is why willpower is worst at the worst time. Protect your prefrontal cortex with sleep.",
      "Withdrawal is not drama; it is a hyper-reactive system that has adapted to excess. Until receptors normalise, your brain treats the absence of the stimulus as a threat — hence anxiety, irritability, and insomnia. The withdrawal timeline is predictable and temporary.",
      "What actually works: sleep, exercise, sunlight exposure, social connection, and reduced stimulation. These heal the system. Willpower alone fights a chemical adversary; the lifestyle supports win it. The lifestyle is the foundation; willpower is the roof.",
      "Dopamine fasting is not about never experiencing pleasure — it is about reducing the baseline stimulation so that normal pleasures feel pleasurable again. A week of reduced stimulation can reset the reward system significantly.",
      "The brain's plasticity means it can heal. Neurogenesis occurs throughout life, especially during sleep and exercise. Every day of abstinence allows the receptors to upregulate, making normal life feel more rewarding again.",
      "Cravings are not commands — they are conditioned responses. Each time you resist a craving, you weaken the conditioned response and strengthen the prefrontal control. The neural pathway is being rewired with every act of resistance.",
      "The reward prediction error theory explains why novelty is addictive: the brain releases dopamine not when it receives a reward, but when the reward is better than expected. Endless scrolling provides infinite novelty, which means infinite dopamine spikes.",
      "Recovery is not about never feeling craving — it is about changing your relationship with craving. You observe it, you name it, you wait it out, and you choose a different response. That choice is the rewiring.",
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
      "Addiction thrives in secrecy. The moment you are willing to name your struggle to another person, its power drops sharply. This is why shame-free community is the single most underrated tool in recovery. Secrecy is the soil in which addiction grows.",
      "Use the Vanguard channels deliberately. Post in SOS when you are in the moment — not for advice, but for connection. Someone replying in two minutes can be the difference between a lapse and a win. The channel is not a chat room — it is a lifeline.",
      "Build a private support circle: one accountability partner you text daily, and one person you can call at 11 p.m. Write their names in your phone's favourites under a normal-sounding label so the access is frictionless. Friction is the enemy of reaching out.",
      "Environment design: make the default option the healthy one. Sleep in the same room as a charging phone, keep exercise gear visible, unsubscribe from triggering feeds, and curate your following list. Your environment makes the choice for you — design it wisely.",
      "Give as much as you take. Sharing what worked today makes you remember it tomorrow — and helping someone else reinforces your own resolve. Teaching is the deepest form of learning. When you help someone else, you strengthen your own commitment.",
      "The accountability partner should be someone you trust and who trusts you. The relationship is not about judgment — it is about mutual support. Both of you are working on the same thing.",
      "Set a daily check-in time. Same time every day. The check-in can be a single message: 'Day X, streak Y, feeling Z.' The consistency of the check-in builds the habit of self-awareness.",
      "Join a community beyond the app. A local support group, an online forum, a religious community — any group where you can share your journey. The broader the support network, the more resilient you become.",
      "Be honest about your struggles. The moment you hide a slip, you lose the support that could have prevented a relapse. Honesty is not weakness — it is the strategy that works.",
      "Celebrate other people's streaks. Their success is not a threat to yours — it is proof that what you are doing is possible. Community is built on mutual celebration, not competition.",
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
      "Sleep loss is a near-deterministic relapse predictor: after one night of poor sleep, prefrontal control drops by roughly 60 percent, and cravings increase measurably the next evening. Sleep is not a luxury — it is a recovery requirement.",
      "Chronic stress keeps your threat system on, flooding you with cortisol. Cortisol directly amplifies cue reactivity — reminders of the habit feel more urgent, more rewarding, more irresistible. Stress management is relapse prevention.",
      "The fix is not 'sleep more' but remove the two biggest sleep saboteurs: light and arousal. No screens in bed (blue light suppresses melatonin), and a 30-minute wind-down buffer where the only input is calm. The wind-down is non-negotiable.",
      "Sleep hygiene checklist: fixed wake time (including weekends), bedroom cool and dark, phone charging outside the room, caffeine cut off by 2 p.m., 10-minute journal to offload worries before bed. Each item on this list is evidence-based.",
      "If you wake at 3 a.m. unable to return to sleep: do not reach for your phone. Get up, sit in dim light, and breathe slowly until drowsy. Fighting it creates performance anxiety that keeps you awake. Acceptance is the first step back to sleep.",
      "Naps are powerful but dangerous. A 20-minute nap restores alertness without affecting nighttime sleep. A 90-minute nap completes a full sleep cycle and can replace a night's sleep. Anything in between leaves you groggy and more vulnerable to craving.",
      "Exercise improves sleep quality, but timing matters. Morning exercise deepens sleep; evening exercise can delay sleep onset. Find the timing that works for your body and stick to it.",
      "Caffeine has a half-life of 5–6 hours. A coffee at 2 p.m. is still 50% active at 8 p.m. Cut caffeine after noon and observe the difference in your sleep within a week.",
      "The bedroom is for sleep and intimacy only. No work, no scrolling, no worrying. The brain learns to associate the bedroom with sleep — break that association and sleep becomes harder.",
      "If insomnia persists for more than two weeks, seek professional help. Chronic insomnia is a medical condition, not a character flaw. A sleep specialist can identify the underlying cause and provide effective treatment.",
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
      "CBT (Cognitive Behavioural Therapy) works by identifying the thought chains that precede relapse: boredom → browsing → escalation → indulgence. Once you can spot the chain at its first link, you can interrupt it. The chain is the target; the indulgence is the symptom.",
      "Core CBT tools: stimulus control (remove the trigger entirely), coping imagery (visualise successfully navigating a high-risk situation), and relapse-prevention planning (pre-write the response to your known weak moments). Preparation is prevention.",
      "ACT (Acceptance and Commitment Therapy) takes the opposite route: rather than fighting urges, you learn to make room for them while acting on your values. The urge is weather; your values are the direction you sail. You do not need to calm the sea to sail.",
      "Both approaches produce the same outcome: reduced PPU symptoms and improved sexual and psychological functioning. Choice between them depends on whether you prefer to change your relationship with thoughts (ACT) or change the thoughts themselves (CBT).",
      "What matters more than the modality is consistency of practice — daily, not just when you are struggling. Skills that are only pulled out during crises rarely stick. Practice when you are calm so the skill is available when you are not.",
      "The thought record is the core CBT tool. Write down the triggering situation, the automatic thought, the emotion, and the alternative thought. Over time, the alternative thought becomes automatic — that is the rewiring.",
      "Values clarification is the core ACT tool. Write down your top five values and how your behaviour aligns with them. When the craving hits, ask: 'Does this action move me toward or away from my values?' The answer is usually obvious.",
      "Comorbidity matters: PPU commonly co-occurs with anxiety, depression, and ADHD. The most effective treatment addresses the comorbidity — often unmasking that the 'addiction' is a coping strategy for an untreated condition.",
      "Self-help CBT is possible with the right structure: identify triggers, pre-write responses, schedule review sessions, and seek a support person. You do not need a clinic to apply evidence-based methods — you need a system.",
      "The relapse-prevention plan is written before the crisis. It lists your top three triggers, your planned response for each, and your emergency contacts. When the crisis hits, you do not need to think — you just need to follow the plan.",
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
      "The 2024 systematic review synthesised 28 studies on PPU treatment. CBT-based interventions consistently produced large effect sizes for both reducing use and reducing compulsive symptoms. The evidence is clear and consistent.",
      "Key finding: interventions that combine individual therapy with skills practice, relapse-prevention planning, and partner or peer involvement outperform single-component approaches. The combination is the active ingredient.",
      "Add-on benefits: mindfulness-based approaches and motivation-enhancing conversations increased retention and reduced shame, which are the two factors most likely to derail progress. Shame reduction is a treatment target, not a side effect.",
      "Comorbidity matters: PPU commonly co-occurs with anxiety, depression, and ADHD. The most effective treatment addresses the comorbidity — often unmasking that the 'addiction' is a coping strategy for an untreated condition.",
      "Practical translation: if self-help is all you can access right now, build your own CBT structure — identify triggers, pre-write responses, schedule review sessions, and seek a support person. You do not need a clinic to apply evidence-based methods.",
      "The effect size matters: large effect sizes mean the treatment works for most people, not just a minority. CBT is not experimental — it is the standard of care for PPU.",
      "Follow-up studies show that gains are maintained at 6 and 12 months when the skills are practiced regularly. The skills are the treatment — the therapist is just the guide.",
      "Group therapy is as effective as individual therapy for PPU, with the added benefit of peer support and reduced isolation. The group is not a substitute for individual work — it is a complement.",
      "Online CBT programmes are effective when they include the core components: psychoeducation, self-monitoring, cognitive restructuring, behavioural experiments, and relapse prevention. The format does not matter; the components do.",
      "The review confirms what clinicians have long observed: the key to recovery is not abstinence alone — it is building a life where abstinence is the natural choice. The life comes first; the abstinence follows.",
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
      "Tawbah (repentance) has three conditions: stop the act, feel genuine remorse, and resolve not to return. True repentance also requires fixing what was damaged where possible; for a sin between you and Allah, sincere regret and resolution suffice. The gate of tawbah is never closed.",
      "Taqwa is self-monitoring — living as if you are aware you are always observed by Allah. When you genuinely internalise this, the urge is met with a question before you answer it: 'Is this what the Watchful One would be pleased with?' Taqwa is not fear — it is awareness.",
      "The practical ladder: fast voluntarily (the Prophet recommended fasting as a shield), lower the gaze by curating your digital space, make wudu when an urge strikes — water is a physical reset that breaks the trance, and keep company with righteous people. Each step builds on the previous one.",
      "Nightly muhaasabah: before sleep, review your day. Every night you audit yourself, you build the habit of self-awareness that catches you before the sin rather than after. The audit is not for judgment — it is for course correction.",
      "Despair is not an option. Shaytan's two tricks are hope (you will do it again anyway) and despair (Allah will not forgive you). Both are lies. Turn, again, again, again — that is the pattern of the believer. The door of mercy is always open.",
      "The Prophet's guidance on lowering the gaze is not optional — it is a command with a promise. 'Tell the believing men to lower their gaze' (An-Nur 24:30) is paired with 'tell the believing women to lower their gaze' (24:31). Both are equally responsible.",
      "Fasting is a shield. The Prophet said, 'Fasting is a shield.' Every voluntary fast weakens the grip of desire and strengthens the spirit. Fasting is not about hunger — it is about mastery over the self.",
      "The daily programme from the Sunnah: morning and evening adhkar, the five prayers as anchors, voluntary fasts, and the night prayer — each positioned as a recovery tool, not only a ritual. The ritual is the container; the recovery is the content.",
      "Seek knowledgeable help if you are stuck: shame keeps you isolated; a trusted scholar or counsellor can give tailored, compassionate guidance. Asking for help is not weakness — it is wisdom.",
      "The three stages of tawbah: regret the past, resolve for the future, and act in the present. Without action, regret is just guilt. Without resolve, action is just effort. Together, they are transformation.",
    ],
  },
  {
    id: "article-7",
    title: "Overcoming Addictions Through Faith: Ibn Al-Qayyim's Rehabilitation Program",
    description:
      "Yaqeen Institute summarises classical Islamic psychology for addiction — the three stages of the nafs and how taqwa breaks the craving cycle.",
    category: "islamic",
    type: "article",
    author: "Yaqeen Institute",
    readTime: 12,
    tags: ["islamic", "nafs", "taqwa", "yaqeen"],
    content: [
      "Ibn Al-Qayyim describes three stages of the nafs: the commanding self (ammarah) which urges evil, the self-reproaching self (lawwamah) which feels remorse, and the tranquilised self (mutma'innah) at peace with its Lord. Addiction thrives in the first stage. Recovery moves you toward the third.",
      "The rehabilitation method has three phases. Phase one: suppress the symptom with shields — fasting, guarding the gaze, avoiding triggers, keeping good company. Phase two: understand the disease by examining its roots and replacing it with healthier outlets. Phase three: nourish the heart with remembrance until it finds real contentment.",
      "Craving in this framework is a void: the heart, created to love the Divine, will cling to the nearest substitute. The cure is filling it, not merely starving it. This is why the Prophet paired prohibition with positive replacement. The replacement is the key.",
      "Practical programme: five daily prayers as the spine of the day, voluntary night prayer for inner strength, daily dhikr as a counterweight to obsession, and serving others to shift focus from the self. Each practice addresses a different dimension of the craving.",
      "Relapse in this light is a slip in one's spiritual state, not a failure of character. The fix is not self-flagellation but returning — the gates of mercy are described as opening wider for the one who keeps coming back. The return is the victory.",
      "The nafs commands you to indulge; the lawwamah questions the indulgence; the mutma'innah is content with what Allah provides. Each stage is a choice. You are always in one stage or another — the goal is to spend more time in mutma'innah.",
      "Dhikr is the quickest path to contentment. When the heart is busy in remembrance, it has less room for obsession. The Prophet's guidance to fill your days with beneficial activity is the fastest way to crowd out temptation.",
      "Shame and pride are both traps. Shame distances you from Allah and pushes you back into hiding; pride blinds you to your own weaknesses. Hold to humble dependence — the one that draws you closer. Humility is the foundation of tawakkul.",
      "The three conditions of tawbah: stop the act, feel genuine remorse, and resolve not to return. True repentance also requires fixing what was damaged where possible. For a sin between you and Allah, sincere regret and resolution suffice.",
      "Despair is Shaytan's greatest weapon. He tells you that you are too far gone, that Allah will not forgive you, that you will never change. All of it is a lie. The gate of tawbah is always open — turn, again, again, again. That is the pattern of the believer.",
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
      "Day structure for each of the 30 days: one trigger you expect, one coping plan for it, one value reminder, one gratitude entry, and an evening rating of your day 1–10 with the reason. The structure creates a rhythm that builds self-awareness.",
      "Trigger log: record time, location, emotion before the urge, and what you did. Patterns emerge within two weeks — the same hour, the same app, the same feeling — and patterns are what you redesign. The log is not for judgment — it is for insight.",
      "Gratitude practice: three specific things each night. This retrains the attention system away from what is being denied toward what is being gained. Gratitude is not denial — it is balance. The brain naturally focuses on threats; gratitude redirects that focus.",
      "Milestone pages: mark every 7-day, 30-day, and 90-day checkpoint with what you have learned about yourself, not just what you have achieved. The learning is the real achievement — the streak is just the evidence.",
      "The 30-day programme is designed to build habits, not just track them. Each day introduces a new tool: Day 1 is the HALT method, Day 8 is urge surfing, Day 15 is the support circle, Day 22 is the relapse-prevention plan. By Day 30, you have a complete toolkit.",
      "The evening rating (1–10) is the most important entry. It trains you to evaluate your day honestly, without distortion. Over 30 days, the ratings tell a story — and the story is your progress.",
      "The trigger log is not about avoiding triggers — it is about understanding them. Every trigger has a message. The log helps you decode that message and respond differently.",
      "The value reminder connects your daily actions to your deeper purpose. When the urge hits, the value reminder is the anchor that holds you steady. Write it large and read it every morning.",
      "The gratitude entry is not about being happy — it is about being present. Gratitude shifts your attention from what you lack to what you have. That shift changes everything.",
      "The workbook is a companion, not a curriculum. Use it however works for you. Some days you will fill every entry; other days you will write one sentence. Both are valid. The point is the practice, not the perfection.",
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
      "Foundations: key verses on guarding the lower half (An-Nur 24:30–31), on not destroying oneself, and on Allah's mercy exceeding wrath. Each verse is paired with its practical reading. The verse is the text; the reading is the application.",
      "Hadith on prevention and cure: the Prophet's guidance on lowering the gaze, fasting as a shield, guarding one's tongue and honour, and the principle that every disease has a cure. The hadith is the practice; the cure is the result.",
      "Scholarly framing: how classical scholars understood compulsive behaviour and the distinction between desire and enslavement to desire. Addiction is not a verdict on your faith; it is a battle you fight with Allah's help. The battle is the test; the help is the promise.",
      "Daily programme from the Sunnah: morning and evening adhkar, the five prayers as anchors, voluntary fasts, and the night prayer — each positioned as a recovery tool, not only a ritual. The ritual is the form; the recovery is the substance.",
      "The Quran's approach to desire is not suppression — it is channeling. Every desire is a potential good if directed correctly. The goal is not to eliminate desire but to direct it toward what pleases Allah.",
      "The concept of tawbah is central to the Islamic approach. Tawbah is not a one-time event — it is a continuous return. Every moment is a new opportunity to choose differently. The gate of tawbah is never closed.",
      "The hadith on every disease having a cure applies to addiction as much as to any physical illness. The cure may be prayer, fasting, community, or professional help — the point is to seek it actively.",
      "The Quran's description of the human soul (nafs) provides a framework for understanding addiction: the commanding self (ammarah) urges evil; the self-reproaching self (lawwamah) feels remorse; the tranquilised self (mutma'innah) is at peace. Recovery is the journey from ammarah to mutma'innah.",
      "Scholarly consensus holds that addiction is a disease, not a sin. The disease requires treatment; the treatment requires compassion. Self-compassion is not optional — it is part of the cure.",
      "The Islamic approach is holistic: it addresses the physical (fasting, sleep), the mental (dhikr, reflection), the social (community, accountability), and the spiritual (prayer, tawbah). No single dimension is sufficient — all are needed.",
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
      "Point 1 — Building and Maintaining Motivation: explore the costs and benefits of your behaviour, use importance/confidence rulers to clarify ambivalence, and visualise a future self you want to become. Motivation is not a feeling — it is a decision you make repeatedly.",
      "Point 2 — Coping with Urges: urge management, 'urge surfing', delayed gratification, and the ABC tool — activating event, beliefs, and consequences — to see how your thinking drives your feeling. The ABC tool reveals that it is not the event but your interpretation of it that drives the feeling.",
      "Point 3 — Managing Thoughts, Feelings and Emotions: dispute unhelpful beliefs, replace 'shoulds' with preferences, and use rational emotion-responses rather than shame. Shame is the enemy of recovery; rational thinking is the ally.",
      "Point 4 — Lifestyle Balance: build a life worth protecting — sleep, nutrition, exercise, work, and relationships — because a balanced life reduces reliance on any single coping mechanism. The balanced life is the best relapse prevention.",
      "The 4-point program is not a linear sequence — it is a cycle. You move between points as needed. Some days you need motivation; other days you need coping skills. The program adapts to your needs.",
      "SMART meetings are available online and in-person worldwide. The peer support is a powerful complement to self-help. Hearing others' experiences normalises your own and provides practical strategies.",
      "The ABC exercise is the core tool: record the Activating event, your beliefs about it, and the Consequences (emotional, behavioural). Then dispute the irrational beliefs and observe how consequences shift. The shift is the change.",
      "Cost-benefit analysis: list every short-term gain and long-term cost of the behaviour, and every short-term resistance and long-term benefit of change. Read it when motivation dips. The list is your compass.",
      "The urge log: timestamp each urge, rate intensity 1–10, note duration, and record what got you through it. Review weekly to spot peaks and effective strategies. The log is your data.",
      "Disputing unhelpful beliefs: write down the belief, the evidence for it, the evidence against it, and a balanced alternative. Practice weekly until the balanced view feels more natural. The practice is the change.",
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
      "Cost-benefit analysis: list every short-term gain and long-term cost of the behaviour, and every short-term resistance and long-term benefit of change. Read it when motivation dips. The analysis is not a one-time exercise — it is a living document.",
      "ABC exercise: record the Activating event, your beliefs about it, and the Consequences (emotional, behavioural). Then dispute the irrational beliefs and observe how consequences shift. The exercise reveals the hidden logic of your behaviour.",
      "Urge log: timestamp each urge, rate intensity 1–10, note duration, and record what got you through it. Review weekly to spot peaks and effective strategies. The log is your evidence.",
      "Disputing unhelpful beliefs: write down the belief, the evidence for it, the evidence against it, and a balanced alternative. Practice weekly until the balanced view feels more natural. The practice rewires the brain.",
      "The toolbox is not a curriculum — it is a collection of tools. Use the tools that work for you. Some tools will resonate; others will not. That is fine. The goal is to build a personal toolkit, not to follow a prescribed list.",
      "The worksheets are most effective when used consistently, not just during crises. Regular use builds the habit of self-reflection, which is the foundation of lasting change.",
      "Combine the tools with professional support if possible. A therapist can help you apply the tools more effectively and address underlying issues that self-help alone may not resolve.",
      "The toolbox approach recognises that different people need different tools. There is no single 'right' way to recover — there is only the way that works for you. Experiment, adapt, and find your path.",
      "The cost-benefit analysis is particularly useful when motivation is low. Reading the list of long-term costs reminds you why you started. The list is your anchor.",
      "The urge log is particularly useful when urges are frequent. Tracking them reveals patterns that you can then address. The log is your map.",
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
      "Core claim: internet pornography delivers novel, infinite, high-speed reward in a way evolution never prepared the brain for, producing habituation and escalated tolerance — the same pattern seen in substance dependence. The brain adapts to the stimulus by reducing its response.",
      "The 90-day reboot: a structured period of sexual rest allowing the reward system to normalise. Users report restored sensitivity, improved motivation, reduced anxiety, and better mood by day 30–60. The reboot is not about morality — it is about neurochemistry.",
      "Withdrawal is real and time-limited: irritability, flat mood, and strong cravings typically peak in the first two weeks and subside. Knowing this is the difference between quitting and staying off. The withdrawal is temporary; the recovery is permanent.",
      "Escalation trap: the more you consume, the more extreme the content you need for the same response. Stopping early — when habits are young — is the single biggest predictor of a clean recovery. Early intervention is the most effective intervention.",
      "Tools offered: a personal progress tracker, educational videos for yourself and your partner, and evidence summaries for clinicians. The same materials apply to porn-free living at any age. The tools are practical and evidence-based.",
      "The reboot is not about never viewing pornography again — it is about breaking the cycle of compulsive use. The goal is a healthy relationship with sexuality, not abstinence forever.",
      "The brain's plasticity means it can heal. Neurogenesis occurs throughout life, especially during sleep and exercise. Every day of abstinence allows the receptors to upregulate, making normal life feel more rewarding again.",
      "The 90-day timeline is not arbitrary — it corresponds to the brain's neuroplasticity cycle. Studies suggest it takes approximately 90 days for dopamine receptors to normalise after prolonged overstimulation.",
      "The reboot is not a cure-all — it is a starting point. After the reboot, you need to build a life that does not require the reboot. The life is the cure; the reboot is the preparation.",
      "Support groups and online communities provide accountability and shared experience. The reboot is easier with support. Isolation makes it harder. Community is the multiplier.",
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
      "Willpower is a muscle with three functions: 'I won't' (resisting temptation), 'I will' (doing what matters), and 'I want' (remembering your goal). Most relapses happen when 'I want' goes quiet. Reconnect with your goal and the willpower returns.",
      "The two-self model: a present self seeking immediate relief and a future self seeking long-term wellbeing. Self-control is negotiation between them, not war. Bargain with yourself like you would with a friend. The present self needs to be convinced, not commanded.",
      "The white bear effect: suppressing thoughts backfires. Trying not to think about something makes it more prominent. Accept the thought, then choose your action. The thought is not the problem — the response to the thought is.",
      "Compassion beats criticism: self-criticism after a slip raises stress, and stress raises craving. Self-compassion preserves your sense of control and keeps you on track. The voice you use with yourself matters.",
      "Practical exercises from the book: mindful breathing to strengthen the 'I want' self, implementation intentions ('if-then' plans), sleep and exercise as willpower fuel, and reframing temptation as disgust or neutrality. Each exercise is evidence-based.",
      "Implementation intentions: 'If I feel the urge at 10 p.m., then I will call my accountability partner.' The plan removes the decision from the moment of crisis. The decision is made in advance, when willpower is high.",
      "Sleep and exercise are willpower fuel. Without them, willpower depletes faster. With them, willpower lasts longer. The fuel is not optional — it is foundational.",
      "Reframing temptation: instead of 'I can't have that', try 'I don't have that'. The first is deprivation; the second is choice. Choice feels empowering; deprivation feels punishing.",
      "Mindful breathing: when the urge hits, pause and take five slow breaths. The pause creates space between the urge and the action. In that space, you can choose differently.",
      "The willpower instinct is not about never failing — it is about failing differently each time. Each failure teaches you something new about your triggers, your weaknesses, and your strengths. The learning is the progress.",
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
      "Series premise: addiction is not a modern weakness but a recurring human struggle addressed by both psychology and revelation. Understanding it as both a spiritual and psychological condition removes shame and doubles your tools. The dual framework is the strength.",
      "Core themes: how pornography rewires desire and erodes faith (iman) over time, the psychological roots of compulsive behaviour, and practical steps grounded in the Islamic tradition. The themes are interconnected — addressing one helps the others.",
      "Practical toolkit: the same shields found across the tradition — fasting, lowering the gaze, guarding the home screen, consistent prayer, and honest companionship — presented with modern psychological support. The tools are timeless; the presentation is contemporary.",
      "Stories and interviews: real accounts from men in recovery, showing that progress is non-linear, relapse is survivable, and returning is always rewarded. The stories are not inspiration — they are evidence that recovery is possible.",
      "The Islamic psychological perspective recognises that addiction is not a sin — it is a struggle. The struggle is the test; the effort is the worship. The outcome is in Allah's hands; the effort is in yours.",
      "The series addresses the specific challenges men face: societal pressure, sexual entitlement, and the normalization of pornography. Each challenge is met with a specific Islamic response.",
      "The concept of 'guard your private parts' (An-Nur 24:30) is not just about physical acts — it is about guarding the eyes, the mind, and the heart. The guard is comprehensive.",
      "The series emphasizes that recovery is not about perfection — it is about progress. Every step forward, no matter how small, is a victory. The victory is not the destination — it is the direction.",
      "The Islamic framework provides meaning: the struggle is not pointless — it is a form of jihad (striving in the path of Allah). The striving is the worship; the result is a bonus.",
      "The series is a companion, not a replacement for professional help. If the addiction is severe, seek professional support alongside the Islamic guidance. The two approaches are complementary, not competing.",
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
      "The core advice: make the obligatory prayers your first priority, because the Prophet promised that they ward off evil — neglecting them leaves the heart exposed. The prayer is the foundation; the chastity is the result.",
      "Fasting as a shield: make it voluntary and consistent, even a few days a week. It weakens desire physically and trains restraint psychologically. The fast is not about hunger — it is about mastery.",
      "Guard your heart's diet: reduce idle conversation, avoid gatherings and media that normalise sin, and keep the company of people who remind you of your purpose. The heart is fed by what it consumes — choose wisely.",
      "Increase good deeds and dhikr: a heart busy in remembrance has less room for obsession. The Prophet's guidance to fill your days with beneficial activity is the fastest way to crowd out temptation. The activity is the antidote.",
      "Seek knowledgeable help if you are stuck: shame keeps you isolated; a trusted scholar or counsellor can give tailored, compassionate guidance. The help is not a sign of weakness — it is a sign of wisdom.",
      "The concept of 'lower your gaze' is not optional — it is a command with a promise. The promise is that those who guard their gaze will be rewarded. The command is for your protection, not your punishment.",
      "The company you keep shapes your behaviour. Good company encourages good deeds; bad company encourages bad deeds. Choose your company as carefully as you choose your food.",
      "Dhikr is the quickest path to contentment. When the heart is busy in remembrance, it has less room for obsession. The remembrance is the medicine; the contentment is the cure.",
      "The advice is not about never feeling desire — it is about directing desire correctly. Desire is not the enemy; uncontrolled desire is. The goal is mastery, not elimination.",
      "The path to chastity is the path to taqwa. Every step toward chastity is a step toward God-consciousness. The two are inseparable.",
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
      "Week 1 — Reset: stop the behaviour completely, clean your digital environment, remove access points, and prepare a written list of triggers and responses. Do not negotiate with the urge; change the environment. The environment is the first line of defence.",
      "Week 2 — Understand: begin the daily trigger log. Identify the pattern (boredom, stress, loneliness, fatigue) rather than fighting the symptom alone. Understanding is the foundation of change.",
      "Week 3 — Rebuild: install replacement behaviours — exercise, social contact, skill-building — so the empty space left by the habit is filled constructively rather than with rumination. The replacement is the key.",
      "Week 4 — Consolidate: write your own relapse-prevention plan using everything you learned. Review what worked, what did not, and pre-commit to your response for the next high-risk situation. The plan is your insurance.",
      "Shame is explicitly excluded from this framework: shame is treated as an obstacle to recovery, not a tool for it. Mistakes become data for adjustment, not evidence of failure. The framework is compassionate and practical.",
      "The 30-day plan is not a cure — it is a starting point. After 30 days, you need to maintain the habits you built and continue refining your approach. The plan is the foundation; the maintenance is the structure.",
      "The trigger log is the most important tool in Week 2. It reveals patterns that you cannot see in the moment. The patterns are the targets for change.",
      "The replacement behaviours in Week 3 must be enjoyable or at least tolerable. If the replacement is miserable, you will not sustain it. Choose activities that fill the void without creating new problems.",
      "The relapse-prevention plan in Week 4 should be specific: 'If I feel the urge at 11 p.m., I will call my accountability partner and go for a walk.' The specificity makes the plan actionable.",
      "The 30-day plan works best with support. Share your plan with a trusted person and ask them to check in with you daily. The support is the multiplier.",
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
      "The meta-analysis found exercise produces medium-to-large reductions in depressive symptoms, with the largest effects for people starting at higher baseline severity — precisely the group that needs it most. The effect is not trivial — it is clinically meaningful.",
      "Exercise reduces anxiety through several mechanisms: physiological arousal regulation, improved sleep, mastery experiences, and social interaction when done in groups. The mechanisms are multiple — exercise works on many fronts simultaneously.",
      "Dose matters less than consistency: any regular activity — walking, cycling, swimming, weight training — shows benefit. The best programme is the one you will actually do consistently. Consistency beats intensity.",
      "Why it matters for recovery: relapse is often triggered by low mood, anxiety, and boredom. Exercise attacks all three, which is why it is one of the strongest protective factors for abstinence. Exercise is not optional — it is essential.",
      "Practical start: ten minutes a day is a valid dose. Build from there. The first two weeks are about establishing the habit, not intensity. The habit is the foundation; the intensity is the upgrade.",
      "The meta-analysis included studies with various exercise types: aerobic, resistance, yoga, and mixed modalities. All showed benefit. The type matters less than the regularity.",
      "Exercise improves sleep quality, which in turn improves mood and reduces craving. The sleep-exercise-mood connection is a positive feedback loop — exercise starts the loop.",
      "Social exercise (group classes, team sports, walking with a friend) adds the benefit of social connection, which is itself a protective factor against relapse. The social dimension is the multiplier.",
      "Exercise releases endorphins, which are natural mood elevators. The endorphin release is not the goal — it is a side effect of the real goal: building a healthier body and mind.",
      "The meta-analysis confirms what clinicians have long observed: exercise is one of the most effective adjunctive treatments for depression and anxiety. It is not a replacement for professional help — it is a complement.",
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
      "Sleep loss severs the connection between the rational brain and the emotional brain. The emotional centre becomes more reactive while the rational brake loses power — you become emotionally volatile and impulsive. The impulsive action is the relapse.",
      "Sleep is when the brain consolidates the day's learning — including the lessons of self-control. Poor sleep means you relearn the same mistakes every day. The sleep is the consolidation; the learning is the retention.",
      "Consequences for recovery: a night of poor sleep predicts a weaker day of self-control, which is why protecting sleep is not a luxury but a recovery requirement. The sleep is the foundation; the self-control is the superstructure.",
      "Sleep hygiene essentials: consistent schedule, cool and dark room, phone out of the bedroom, morning daylight within an hour of waking, and a wind-down that is screen-free. Each item is evidence-based and practical.",
      "One-night fix is impossible: the sleep system needs repeated good nights to recover. Treat each night as a deposit into an account you are withdrawing from the next day. The account is your sleep debt; the deposit is your sleep.",
      "The prefrontal cortex is the last brain region to mature and the first to degrade with sleep loss. It is responsible for planning, decision-making, and impulse control — exactly the functions you need for recovery.",
      "Caffeine has a half-life of 5–6 hours. A coffee at 2 p.m. is still 50% active at 8 p.m. Cut caffeine after noon and observe the difference in your sleep within a week. The caffeine is the saboteur.",
      "Alcohol may help you fall asleep but it fragments sleep architecture. You sleep more lightly and wake more often. The alcohol is the disruptor.",
      "The bedroom is for sleep and intimacy only. No work, no scrolling, no worrying. The brain learns to associate the bedroom with sleep — break that association and sleep becomes harder.",
      "If insomnia persists for more than two weeks, seek professional help. Chronic insomnia is a medical condition, not a character flaw. A sleep specialist can identify the underlying cause and provide effective treatment.",
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
      "The first step is honest admission — to yourself and to Allah. Concealment is what feeds the habit; naming it removes its power. The admission is the beginning; the naming is the liberation.",
      "Nafs-stage psychology: recognise you are currently in the ammarah (commanding) stage, move toward lawwamah (self-reproaching) through nightly audit, and aim for mutma'innah (tranquillised) through sustained remembrance. The stages are not fixed — you move between them.",
      "Tawbah is immediate and always open: stop now, feel regret, resolve never to return. There is no waiting for a 'better time'; the next best moment is this moment. The moment is now; the tawbah is now.",
      "Replace the habit, do not just remove it: the Prophet taught that when one desire is removed, replace it with a beneficial one. Channel the same energy into prayer, fasting, study, exercise, or service. The replacement is the key.",
      "Boundaries for the digital age: curate your feeds, block triggering sites, remove apps from easy reach, and charge your phone outside your room. Design your environment so taqwa is the easy path. The environment is the context; the taqwa is the content.",
      "The concept of taqwa is often translated as 'God-consciousness' or 'mindfulness of Allah'. It is the awareness that Allah is watching, which motivates righteous behaviour. The awareness is the guard; the behaviour is the result.",
      "The daily programme from the Sunnah: morning and evening adhkar, the five prayers as anchors, voluntary fasts, and the night prayer — each positioned as a recovery tool, not only a ritual. The ritual is the form; the recovery is the substance.",
      "Despair is not an option. Shaytan's two tricks are hope (you will do it again anyway) and despair (Allah will not forgive you). Both are lies. Turn, again, again, again — that is the pattern of the believer. The pattern is the victory.",
      "The company you keep shapes your behaviour. Good company encourages good deeds; bad company encourages bad deeds. Choose your company as carefully as you choose your food. The company is the context; the behaviour is the content.",
      "The path to chastity is the path to taqwa. Every step toward chastity is a step toward God-consciousness. The two are inseparable. The inseparability is the strength.",
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
  const articleRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
  }, [selected]);

  const handleReaderScroll = () => {
    if (!articleRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = articleRef.current;
    const p = scrollHeight > clientHeight ? scrollTop / (scrollHeight - clientHeight) : 0;
    setProgress(p);
  };

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
      <Screen
        title="Library"
        back
        noScrollbar
        mainRef={articleRef}
        onMainScroll={handleReaderScroll}
      >
        {progress > 0 && (
          <div className="sticky top-0 z-10 h-0.5 w-full bg-surface-2">
            <div
              className="h-full bg-accent transition-all duration-150"
              style={{ width: `${Math.min(100, Math.round(progress * 100))}%` }}
            />
          </div>
        )}

        <article className="py-6">
          <span
            className={cn(
              "inline-block rounded-full border px-2.5 py-1 text-label uppercase",
              TYPE_STYLE[selected.type],
            )}
          >
            {selected.type}
          </span>

          <h1 className="mt-4 text-display-xl font-semibold text-ink leading-tight">
            {selected.title}
          </h1>
          <p className="mt-3 text-body text-ink-muted leading-relaxed">
            {selected.description}
          </p>

          <dl className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-border py-4 font-data text-meta text-ink-muted">
            {selected.author && (
              <div className="inline-flex items-center gap-1.5">
                <dt className="sr-only">Author</dt>
                <dd>{selected.author}</dd>
              </div>
            )}
            {selected.readTime ? (
              <div className="inline-flex items-center gap-1.5">
                <dt className="sr-only">Reading time</dt>
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                <dd>{selected.readTime} min read</dd>
              </div>
            ) : null}
          </dl>

          {(selected.tags ?? []).length > 0 && (
            <ul className="mt-5 flex flex-wrap gap-1.5">
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
            <div className="mt-8 space-y-5 border-t border-border pt-6">
              {selected.content.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-body leading-relaxed text-ink"
                  style={{ lineHeight: "1.7" }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}

          <div className="mt-10 flex items-center justify-between border-t border-border pt-6">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="inline-flex h-11 items-center gap-2 rounded-md px-4 text-label uppercase text-ink-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to library
            </button>
            <span className="font-data text-meta text-ink-faint">
              {selected.content?.length ?? 0} paragraph
              {(selected.content?.length ?? 0) === 1 ? "" : "s"}
            </span>
          </div>
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
            className="h-12 w-full rounded-md border border-border bg-surface pl-9 pr-9 text-body text-ink placeholder:text-ink-faint"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-faint transition-colors hover:bg-surface-2 hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="no-scrollbar -mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-2">
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
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-bg to-transparent" />
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
          <section key={cat} className="mt-6">
            <SectionHead>{CATEGORIES.find((c) => c.id === cat)?.label ?? cat}</SectionHead>
            <ul className="surface-group">
              {items.map((item) => {
                const Icon = TYPE_ICON[item.type];
                return (
                  <li key={item.id}>
                    <button type="button" onClick={() => setSelected(item)} className="row group">
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
                        <span className="block text-body-s font-medium leading-snug text-ink group-hover:text-accent transition-colors">
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
                      <Check className="h-4 w-4 shrink-0 text-ink-faint opacity-0 transition-opacity group-hover:opacity-100" aria-hidden="true" />
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
            Relay status
          </h3>
          <p className="text-body-s text-ink-muted">
            Your messages may be delayed while relays reconnect. Manage your relay list at{" "}
            <a href="/settings/relay" className="text-ink underline hover:text-accent">Settings → Relay settings</a>.
          </p>
        </div>
      )}
    </Screen>
  );
}