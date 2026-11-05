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

// ---- Talk: odam gapirayotgan video + so'zlarga mos emoji ----

export type Word = { word: string; start: number; end: number };

export type CuePosition =
  | "auto" | "top" | "topLeft" | "topRight" | "left" | "right" | "center" | "bottomLeft" | "bottomRight";

export type Cue = {
  /** soniya: emoji qachon chiqadi (odatda so'z boshlanishi) */
  at: number;
  emoji: string;
  /** emoji ostidagi kichik yozuv (ixtiyoriy) */
  text?: string;
  /** qancha soniya turadi, standart 1.4 */
  duration?: number;
  position?: CuePosition;
  anim?: "pop" | "shake" | "burst";
  size?: number;
  sfx?: Sfx;
  /** qaysi so'z uchun (faqat ma'lumot uchun) */
  word?: string;
};

/** Videoning keraksiz joyini (masalan kamera burilishi) to'liq yopuvchi ekran. */
export type Cover = {
  start: number;
  end: number;
  emoji?: string;
  text?: string;
  sub?: string;
  /** fon ranglari (gradient) */
  colors?: [string, string];
  accent?: string;
  sfx?: Sfx;
};

export type TalkConfig = {
  width?: number;
  height?: number;
  fps?: number;
  /** public/ ichidagi video nomi */
  video?: string | null;
  durationInSeconds?: number | null;
  words?: Word[];
  cues: Cue[];
  covers?: Cover[];
  captions?: {
    enabled?: boolean;
    maxWords?: number;
    color?: string;
    highlight?: string;
    /** 0..1, ekrandagi vertikal joy (standart 0.74) */
    y?: number;
    scale?: number;
    uppercase?: boolean;
  };
  sfxVolume?: number;
};
