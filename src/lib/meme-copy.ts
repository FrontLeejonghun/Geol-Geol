import type { Locale, OutcomeTier, MemeCopy } from "@/types/stock";

/**
 * Meme copy pool — kept in its own module so edge runtime routes
 * (`/api/og`, `/api/share-image/instagram`) can import it without dragging in
 * the Yahoo Finance/Node-only dependency tree from `@/lib/calculation`.
 */
export const MEME_COPY_POOL: Record<Locale, Record<OutcomeTier, MemeCopy[]>> = {
  ko: {
    catastrophe: [
      { headline: "와... 안 사길 잘했다", subline: "큰일날 뻔 😰" },
      { headline: "다행이다 진짜", subline: "나 그때 왜 샀으면 어쩔뻔" },
      { headline: "휴... 살뻔", subline: "손이 떨려서 못 산 게 천만다행" },
      { headline: "어휴 아찔하네", subline: "그때 샀으면 폭망이었다" },
      { headline: "그때 안 사서 다행", subline: "통장이 텅장 될 뻔 💸" },
    ],
    loss: [
      { headline: "에휴... 손해 봤겠네", subline: "그래도 안 사서 다행이야" },
      { headline: "적금이 나았겠다", subline: "은행이자라도 받지..." },
      { headline: "아슬아슬했네", subline: "안 사서 천만다행" },
      { headline: "살짝 손해네", subline: "뭐 크게 잃을 뻔한건 아니야" },
      { headline: "음... 별로였구나", subline: "안 산 내가 똑똒지 ㅋ" },
    ],
    flat: [
      { headline: "뭐야 이게...", subline: "시간만 버릴 뻔했네 😐" },
      { headline: "움직이긴 하냐?", subline: "차라리 예금을 들걸" },
      { headline: "그냥 그렇네", subline: "샀어도 차이 없었겠다" },
      { headline: "별 차이 없잖아", subline: "사나 마나였구나" },
      { headline: "ㅋㅋ 의미없네", subline: "뭔가 했는데 아무것도 아닌" },
    ],
    gain: [
      { headline: "그때 살껄...", subline: "지금쯤 부자였을텐데 💰" },
      { headline: "아... 왜 안 샀지", subline: "후회막급이다 진짜" },
      { headline: "살걸 ㅠㅠ", subline: "그때 왜 망설였을까" },
      { headline: "멍청했다 나", subline: "돈 벌 기회를 놓쳤어" },
      { headline: "아 진짜 후회된다", subline: "왜 그때 살까 말까 했을까" },
    ],
    jackpot: [
      { headline: "그때 살껄!!!", subline: "대박났을텐데... 아 진짜 😭" },
      { headline: "ㅠㅠㅠㅠㅠ", subline: "나만 빼고 다 부자네" },
      { headline: "인생 달라질 뻔", subline: "왜... 왜 안 샀냐고... 🥺" },
      { headline: "어... 이게 뭐야", subline: "직장 관뒀을 수도 있었는데" },
      { headline: "으아아아", subline: "부자될 기회 놓쳤다 ㅠㅠㅠ" },
      { headline: "미친... 살걸", subline: "지금 전세 뺐을텐데 💔" },
    ],
  },
  en: {
    catastrophe: [
      { headline: "Phew, glad I passed", subline: "Bullet dodged! 😰" },
      { headline: "Thank God I didn't", subline: "Would've been a disaster" },
      { headline: "Whew! Close call", subline: "My hesitation saved me" },
      { headline: "Yikes, avoided that", subline: "Could've been ugly" },
      { headline: "Lucky I was broke", subline: "Best investment I never made" },
    ],
    loss: [
      { headline: "Could've been worse", subline: "Still glad I skipped it" },
      { headline: "Meh, no big deal", subline: "At least it's not my money" },
      { headline: "Dodged a small one", subline: "Good thing I passed" },
      { headline: "Savings won anyway", subline: "Bank interest beats this" },
      { headline: "Close enough", subline: "Wasn't meant to be" },
    ],
    flat: [
      { headline: "Whatever...", subline: "Nothing happened anyway 😐" },
      { headline: "Meh, who cares", subline: "Savings account = same thing" },
      { headline: "So... yeah", subline: "This is boring" },
      { headline: "All that hype for this?", subline: "Time would've been wasted" },
      { headline: "Is it even moving?", subline: "Might as well have done nothing" },
    ],
    gain: [
      { headline: "Should've bought...", subline: "I'd be rich by now 💰" },
      { headline: "Ugh, why didn't I?", subline: "My wallet is crying" },
      { headline: "Missed out bad", subline: "This one hurts" },
      { headline: "Regret intensifies", subline: "Why did I hesitate..." },
      { headline: "Dang it", subline: "The one that got away" },
    ],
    jackpot: [
      { headline: "SHOULD'VE BOUGHT!!!", subline: "Would be a millionaire!!! 😭" },
      { headline: "NOOOOO", subline: "Everyone's rich except me" },
      { headline: "Life changing money", subline: "Why... just why... 🥺" },
      { headline: "I CAN'T BELIEVE IT", subline: "Could've quit my job" },
      { headline: "PAIN. JUST PAIN.", subline: "This keeps me up at night 💔" },
      { headline: "BRB, crying", subline: "We don't talk about this" },
    ],
  },
};

export function selectMemeCopy(
  locale: Locale,
  outcomeTier: OutcomeTier
): MemeCopy {
  const copies = MEME_COPY_POOL[locale][outcomeTier];
  const randomIndex = Math.floor(Math.random() * copies.length);
  return copies[randomIndex] ?? copies[0]!;
}

export function getAllMemeCopies(
  locale: Locale,
  outcomeTier: OutcomeTier
): MemeCopy[] {
  return MEME_COPY_POOL[locale][outcomeTier];
}
