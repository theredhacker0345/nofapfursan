/**
 * Islamic Motivation Messages for NoFap Fursan
 * 
 * Curated collection of Quranic verses, Hadith, and Islamic wisdom
 * focused on patience (Sabr), discipline, and self-control.
 */

export interface MotivationalMessage {
    text: string;
    source?: string;
    type: 'quran' | 'hadith' | 'wisdom' | 'dua';
}

export const ISLAMIC_MOTIVATIONS: MotivationalMessage[] = [
    // Quranic Verses on Sabr (Patience)
    {
        text: "Indeed, Allah is with the patient.",
        source: "Quran 2:153",
        type: 'quran'
    },
    {
        text: "And seek help through patience and prayer. Indeed, Allah is with the patient.",
        source: "Quran 2:45",
        type: 'quran'
    },
    {
        text: "Indeed, the patient will be given their reward without account.",
        source: "Quran 39:10",
        type: 'quran'
    },
    {
        text: "O you who believe! Seek help through patience and prayer.",
        source: "Quran 2:153",
        type: 'quran'
    },
    {
        text: "So be patient. Indeed, the promise of Allah is truth.",
        source: "Quran 30:60",
        type: 'quran'
    },
    {
        text: "Tell the believing men to lower their gaze and guard their private parts.",
        source: "Quran 24:30",
        type: 'quran'
    },
    {
        text: "And whoever fears Allah - He will make for him a way out.",
        source: "Quran 65:2",
        type: 'quran'
    },
    {
        text: "Indeed, Allah does not change the condition of a people until they change what is in themselves.",
        source: "Quran 13:11",
        type: 'quran'
    },

    // Hadith on Self-Control and Discipline
    {
        text: "The strong man is not the one who can overpower others. The strong man is the one who controls himself when he is angry.",
        source: "Bukhari & Muslim",
        type: 'hadith'
    },
    {
        text: "Take advantage of five before five: your youth before your old age, your health before your sickness, your wealth before your poverty, your free time before your work, and your life before your death.",
        source: "Hadith - Ibn Abbas",
        type: 'hadith'
    },
    {
        text: "Whoever guards his tongue and his private parts, I guarantee him Paradise.",
        source: "Bukhari",
        type: 'hadith'
    },
    {
        text: "The best of you are those who are best in character.",
        source: "Bukhari",
        type: 'hadith'
    },
    {
        text: "Modesty is a branch of faith.",
        source: "Bukhari & Muslim",
        type: 'hadith'
    },
    {
        text: "Every son of Adam has his portion of Zina (unlawful relations) decreed for him. The Zina of the eyes is looking, the Zina of the ears is listening...",
        source: "Bukhari & Muslim",
        type: 'hadith'
    },
    {
        text: "Leave that which makes you doubt for that which does not make you doubt.",
        source: "Tirmidhi",
        type: 'hadith'
    },
    {
        text: "Part of the perfection of one's Islam is his leaving that which does not concern him.",
        source: "Tirmidhi",
        type: 'hadith'
    },

    // Islamic Wisdom
    {
        text: "The patience you keep today becomes your strength tomorrow.",
        type: 'wisdom'
    },
    {
        text: "The one who conquers his desires is stronger than the one who conquers cities.",
        type: 'wisdom'
    },
    {
        text: "Lower your gaze, protect your heart. The eyes are the gateway to the soul.",
        type: 'wisdom'
    },
    {
        text: "If today is difficult, remember: the night is darkest just before dawn.",
        type: 'wisdom'
    },
    {
        text: "A moment of weakness lasts a moment. The regret lasts a lifetime. Choose wisely.",
        type: 'wisdom'
    },
    {
        text: "A strong person does not run from a hard day. Stand firm.",
        type: 'wisdom'
    },
    {
        text: "Your body is a trust from Allah. Guard it like the most precious gift.",
        type: 'wisdom'
    },
    {
        text: "The path of Fursan is not easy, but it is the path of honor. ⚔️",
        type: 'wisdom'
    },

    // Du'as (Supplications)
    {
        text: "O Allah, purify my heart and guard my chastity.",
        source: "Prophetic Du'a",
        type: 'dua'
    },
    {
        text: "O Allah, I seek refuge in You from the evil of my hearing, my sight, my tongue, my heart, and my desires.",
        source: "Abu Dawud",
        type: 'dua'
    },
    {
        text: "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا - Our Lord, pour upon us patience.",
        source: "Quran 2:250",
        type: 'dua'
    }
];

// Legacy export for backwards compatibility
export const MOTIVATIONAL_MESSAGES = ISLAMIC_MOTIVATIONS.map(m =>
    m.source ? `${m.text}\n— ${m.source}` : m.text
);

export const getRandomMotivation = (): MotivationalMessage => {
    return ISLAMIC_MOTIVATIONS[Math.floor(Math.random() * ISLAMIC_MOTIVATIONS.length)];
};

export const getRandomMotivationByType = (type: MotivationalMessage['type']): MotivationalMessage | null => {
    const filtered = ISLAMIC_MOTIVATIONS.filter(m => m.type === type);
    if (filtered.length === 0) return null;
    return filtered[Math.floor(Math.random() * filtered.length)];
};

// Get formatted message with source
export const getFormattedMotivation = (): string => {
    const motivation = getRandomMotivation();
    if (motivation.source) {
        return `"${motivation.text}"\n— ${motivation.source}`;
    }
    return motivation.text;
};
