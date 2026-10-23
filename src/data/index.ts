import { parse } from "yaml";
import n from "./nabor.yaml?raw";
import t from "./treninky.yaml?raw";
import u from "./uspechy.yaml?raw";
import v from "./vysledky.yaml?raw";
import k from "./kontakt.yaml?raw";
import o from "./odkazy.yaml?raw";
import y from "./videa.yaml?raw";
export const nabor = parse(n) as {
  active: boolean;
  heading: string;
  text: string;
  when: string;
  where: string;
};
export const treninky = parse(t) as { group: string; note: string; days: string[]; time: string }[];
export const uspechy = parse(u) as {
  year: number;
  competition: string;
  place: number;
  name: string;
  category: string;
  title?: string;
}[];
export const vysledky = parse(v) as { year: number; file: string }[];
export const kontakt = parse(k) as {
  name: string;
  role: string;
  phone: string;
  email: string;
  organization: string;
  address: string;
  directions: string;
  ico: string;
  map: string;
};
export const odkazy = parse(o) as { title: string; url: string }[];
export const date = (value: Date) => new Intl.DateTimeFormat("cs-CZ").format(value);
export const videa = parse(y) as { id: string; title: string }[];
