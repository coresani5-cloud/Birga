#!/usr/bin/env node
// words.json dagi so'zlarga qarab emoji "cue"larini avtomatik tanlaydi.
// Bu zaxira usul: Claude odatda transkriptni o'qib, cues'ni o'zi yozadi (aniqroq).
// Foydalanish: node scripts/auto-cues.mjs words.json cues.json
import { readFileSync, writeFileSync } from "node:fs";

// [o'zak, emoji, faqat_to'liq_so'z?]  — o'zbek / rus / ingliz
const DICT = [
  ["pul", "💰"], ["dollar", "💵"], ["so'm", "💵"], ["boy", "🤑"], ["деньг", "💰"], ["money", "💰"],
  ["vaqt", "⏰"], ["soat", "⏰"], ["daqiqa", "⏱️"], ["время", "⏰"], ["time", "⏰"],
  ["sev", "❤️"], ["yurak", "❤️"], ["muhabbat", "❤️"], ["люб", "❤️"], ["love", "❤️"],
  ["o'yla", "🤔"], ["fikr", "🤔"], ["nega", "🤔"], ["дума", "🤔"], ["think", "🤔"],
  ["g'oya", "💡"], ["idea", "💡"], ["иде", "💡"],
  ["kul", "😂"], ["hazil", "😂"], ["смеш", "😂"], ["funny", "😂"],
  ["yig'l", "😢"], ["xafa", "😔"], ["qayg'u", "😢"], ["sad", "😢"],
  ["ishla", "💼"], ["ish", "💼", true], ["ishim", "💼"], ["работ", "💼"], ["work", "💼"], ["biznes", "📊"],
  ["telefon", "📱"], ["phone", "📱"], ["video", "🎬"], ["montaj", "🎬"], ["kino", "🎬"],
  ["instagram", "📸"], ["rasm", "📸"], ["foto", "📸"], ["youtube", "▶️"], ["telegram", "✈️"],
  ["ovqat", "🍽️"], ["yeg", "🍽️"], ["choy", "🍵"], ["qahva", "☕"], ["coffee", "☕"], ["osh", "🍛", true],
  ["uy", "🏠", true], ["uyda", "🏠"], ["uyim", "🏠"], ["дом", "🏠"], ["home", "🏠"],
  ["mashina", "🚗"], ["yo'l", "🛣️"], ["sayohat", "✈️"], ["samolyot", "✈️"],
  ["kitob", "📚"], ["o'qi", "📚"], ["o'rgan", "🧠"], ["bilim", "🧠"], ["maktab", "🏫"], ["universitet", "🎓"],
  ["dunyo", "🌍"], ["world", "🌍"], ["мир", "🌍", true],
  ["zo'r", "🔥"], ["ajoyib", "🤩"], ["super", "🔥"], ["круто", "🔥"], ["fire", "🔥"], ["amazing", "🤩"],
  ["g'alaba", "🏆"], ["muvaffaqiyat", "🏆"], ["yutuq", "🏆"], ["chempion", "🏆"], ["success", "🏆"],
  ["savol", "❓"], ["вопрос", "❓"], ["question", "❓"],
  ["yo'q", "❌", true], ["xato", "❌"], ["noto'g'ri", "❌"], ["нет", "❌", true], ["no", "❌", true],
  ["to'g'ri", "✅"], ["albatta", "✅"], ["да", "✅", true], ["yes", "✅", true],
  ["tez", "⚡"], ["tezda", "⚡"], ["быстр", "⚡"], ["fast", "⚡"],
  ["kuch", "💪"], ["kuchli", "💪"], ["sport", "🏋️"], ["sil", "💪"], ["strong", "💪"],
  ["uxla", "😴"], ["charcha", "😴"], ["tired", "😴"],
  ["qo'rq", "😱"], ["dahshat", "😱"], ["страш", "😱"], ["scary", "😱"],
  ["hayron", "😮"], ["voy", "😮", true], ["vau", "😮", true], ["wow", "😮", true],
  ["ko'r", "👀"], ["qara", "👀"], ["смотр", "👀"], ["look", "👀"], ["watch", "👀"],
  ["gapir", "🗣️"], ["ayt", "🗣️"], ["говор", "🗣️"], ["say", "🗣️", true],
  ["musiqa", "🎵"], ["qo'shiq", "🎤"], ["music", "🎵"],
  ["ai", "🤖", true], ["sun'iy", "🤖"], ["robot", "🤖"], ["neyro", "🤖"], ["chatgpt", "🤖"], ["claude", "🤖"],
  ["kompyuter", "💻"], ["noutbuk", "💻"], ["kod", "💻"], ["dastur", "💻"], ["computer", "💻"],
  ["o'sish", "📈"], ["o's", "📈"], ["foiz", "📈"], ["рост", "📈"], ["grow", "📈"],
  ["baxt", "😊"], ["xursand", "😊"], ["quvon", "😊"], ["happy", "😊"],
  ["salom", "👋"], ["assalom", "👋"], ["привет", "👋"], ["hello", "👋"], ["hi", "👋", true],
  ["rahmat", "🙏"], ["спасибо", "🙏"], ["thanks", "🙏"], ["thank", "🙏"],
  ["do'st", "🤝"], ["hamkor", "🤝"], ["друг", "🤝"], ["friend", "🤝"],
  ["oila", "👨‍👩‍👧"], ["bola", "👶"], ["farzand", "👶"], ["ona", "👩", true], ["onam", "👩"], ["ota", "👨", true], ["otam", "👨"],
  ["sovg'a", "🎁"], ["bayram", "🎉"], ["tabrik", "🎉"], ["подар", "🎁"], ["gift", "🎁"],
  ["maqsad", "🎯"], ["цель", "🎯"], ["goal", "🎯"],
  ["reja", "📝"], ["yoz", "✍️"], ["skript", "📝"], ["plan", "📝"],
  ["obuna", "🔔"], ["подпис", "🔔"], ["subscribe", "🔔"],
  ["layk", "👍"], ["like", "👍"], ["izoh", "💬"], ["комментар", "💬"], ["comment", "💬"],
  ["sir", "🤫", true], ["sirni", "🤫"], ["секрет", "🤫"], ["secret", "🤫"],
  ["qiyin", "😩"], ["muammo", "⚠️"], ["проблем", "⚠️"], ["problem", "⚠️"],
  ["oson", "😌"], ["легко", "😌"], ["easy", "😌"],
  ["birinchi", "1️⃣"], ["ikkinchi", "2️⃣"], ["uchinchi", "3️⃣"],
  ["quyosh", "☀️"], ["yomg'ir", "🌧️"], ["qor", "❄️", true], ["issiq", "🥵"], ["sovuq", "🥶"],
  ["start", "🚀"], ["boshla", "🚀"], ["ракет", "🚀"], ["launch", "🚀"],
];

const norm = (w) =>
  w.toLowerCase().replace(/[’ʻʼ‘`]/g, "'").replace(/^[^\p{L}\d']+|[^\p{L}\d']+$/gu, "");

const [src, out, gapArg] = process.argv.slice(2);
const MIN_GAP = Number(gapArg ?? 1.6); // ikki emoji orasidagi eng kam soniya
const words = JSON.parse(readFileSync(src, "utf8"));
const cues = [];
let last = -Infinity;
for (const w of words) {
  const n = norm(w.word);
  if (!n) continue;
  const hit = DICT.find(([stem, , exact]) => (exact ? n === stem : n.startsWith(stem)));
  if (!hit || w.start - last < MIN_GAP) continue;
  cues.push({ at: w.start, emoji: hit[1], word: w.word });
  last = w.start;
}
writeFileSync(out, JSON.stringify(cues, null, 1));
console.log(`${cues.length} ta emoji cue -> ${out}`);
