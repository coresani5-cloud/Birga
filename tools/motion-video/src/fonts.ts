import { loadFont } from "@remotion/fonts";
import l500 from "@fontsource/montserrat/files/montserrat-latin-500-normal.woff2";
import l700 from "@fontsource/montserrat/files/montserrat-latin-700-normal.woff2";
import l800 from "@fontsource/montserrat/files/montserrat-latin-800-normal.woff2";
import e500 from "@fontsource/montserrat/files/montserrat-latin-ext-500-normal.woff2";
import e700 from "@fontsource/montserrat/files/montserrat-latin-ext-700-normal.woff2";
import e800 from "@fontsource/montserrat/files/montserrat-latin-ext-800-normal.woff2";
import c500 from "@fontsource/montserrat/files/montserrat-cyrillic-500-normal.woff2";
import c700 from "@fontsource/montserrat/files/montserrat-cyrillic-700-normal.woff2";
import c800 from "@fontsource/montserrat/files/montserrat-cyrillic-800-normal.woff2";

// Shrift loyiha ichida — internetsiz ham ishlaydi.
export const fontFamily = "Montserrat";

const files: [string, string][] = [
  ["500", l500], ["700", l700], ["800", l800],
  ["500", e500], ["700", e700], ["800", e800],
  ["500", c500], ["700", c700], ["800", c800],
];
for (const [weight, url] of files) {
  loadFont({ family: fontFamily, url, weight, format: "woff2" });
}
