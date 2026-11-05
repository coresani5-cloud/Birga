export type Sfx = "pop" | "ding" | "click" | "whoosh" | "none";

export type ListItem = { emoji?: string; text: string };

export type Scene =
  // Katta emoji + matn (emoji "pop" bo'lib chiqadi)
  | { type: "emoji"; emoji: string; text?: string; sfx?: Sfx }
  // Katta sarlavha + ixtiyoriy kichik matn
  | { type: "title"; text: string; sub?: string; emoji?: string; sfx?: Sfx }
  // So'z harfma-harf yoziladi (klaviatura ovozi bilan)
  | { type: "typing"; text: string; sub?: string; emoji?: string; sfx?: Sfx }
  // 0 dan `to` gacha sanaydi, progress chiziq bilan, oxirida "ding"
  | { type: "counter"; to: number; suffix?: string; text?: string; emoji?: string; sfx?: Sfx }
  // Ro'yxat: elementlar ketma-ket chiqadi
  | { type: "list"; title?: string; items: ListItem[]; sfx?: Sfx }
  // Ikki narsani solishtirish: chap -> o'ng
  | { type: "compare"; left: ListItem; right: ListItem; text?: string; sfx?: Sfx };

export type VideoConfig = {
  width?: number;
  height?: number;
  fps?: number;
  background?: string;
  color?: string;
  accent?: string;
  /** public/ ichidagi audio fayl nomi, yo'q bo'lsa null */
  audio?: string | null;
  durationInSeconds?: number | null;
  /** Har bir sahna boshlanish soniyasi. null bo'lsa teng bo'linadi. */
  sceneStarts?: number[] | null;
  fallbackSceneSeconds?: number;
  sfxVolume?: number;
  scenes: Scene[];
};
