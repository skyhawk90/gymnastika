# Sportovní gymnastika Chrudim

Statický web Astro s redakčním systémem Sveltia CMS. Všechny stránky a optimalizované fotografie vznikají při sestavení. Web nepotřebuje databázi ani vlastní aplikační server.

## Spuštění a ověření

Použijte Node.js 24 a již připravené závislosti:

```sh
npm run dev
npm run build
npx astro check
npm run preview
```

Pokud omezené prostředí nepovoluje zápis konfigurace telemetrie mimo projekt, spusťte příkazy s `ASTRO_TELEMETRY_DISABLED=1`.

Výstup najdete v `dist/`. Schválený návrh zůstává v `prototype/index.html`.

## Redakční systém

Otevřete `/admin/`. Sveltia se načítá z CDN, takže redakce potřebuje internet. Konfigurace je v `public/admin/config.yml`. Repozitář je `skyhawk90/gymnastika`, větev `main`. Přihlášení přes GitHub obsluhuje Worker `sveltia-cms-auth` na `https://sveltia-cms-auth.musil-matej.workers.dev` (nastavený v `backend.base_url`) spolu s GitHub OAuth aplikací; povolené domény jsou v jeho proměnné `ALLOWED_DOMAINS`. GitHub účet redaktorky musí mít právo zápisu do repozitáře. Přihlašovací tajemství nepatří do tohoto veřejného souboru.

Pro místní zkoušku otevřete administraci v Chromium při spuštěném `npm run dev`, zvolte Sveltia **Work with Local Repository** a vyberte kořen tohoto repozitáře. Uložení zapíše místní soubory. Změny poté commitněte a odešlete na GitHub. Produkční úpravy ukládá CMS jako commity do GitHubu; Cloudflare následně spustí nové sestavení.

Článek v režimu „Koncept“ se nezobrazuje ani nevytváří veřejnou stránku. Fotografie vybírejte ve formuláři článku nebo alba; CMS je ukládá vedle příslušného Markdown souboru. Vždy vyplňte popis fotografie. Datum alba slouží k řazení. Přepínač „Zobrazovat nábor“ skryje náborovou kartu na úvodu i v kontaktu.

## Kde je obsah

- `src/content/clanky/<slug>/index.md`: články, datum, shrnutí, případně titulní fotografie ve stejné složce.
- `src/content/galerie/<slug>/index.md`: alba a fotografie s popisy, uložené ve stejné složce.
- `src/content/stranky/historie.md`, `osobnosti.md`: úplné historické texty z původního webu.
- `src/data/nabor.yaml`: aktivace a údaje náboru.
- `src/data/treninky.yaml`: skupiny, dny a časy.
- `src/data/uspechy.yaml`: samostatný řádek pro každé umístění včetně historických výsledků.
- `src/data/vysledky.yaml`: odkazy na výsledkové listiny, dokumenty se ukládají do `public/vysledky/`.
- `src/data/kontakt.yaml`: kontaktní osoba, telefon, e-mail, adresa a mapa.
- `src/data/odkazy.yaml`: související organizace.
- `src/layouts/`, `src/components/`, `src/pages/`, `src/styles/global.css`: rozvržení, stránky a vzhled.

Kořenové seznamy YAML používají ve formulářích CMS `root: true`. Pro načítání YAML slouží parser již obsažený v instalaci Astro.

## Cloudflare Pages

Propojte GitHub repozitář s Cloudflare Pages. Produkční větev: `main`, příkaz sestavení: `npm run build`, výstupní složka: `dist`, kořen projektu: kořen repozitáře. Nastavte Node.js 24. Připojte doménu `www.gymnastika.chrudim.cz`. Sitemap se vytváří automaticky; kanonická doména je nastavena v `astro.config.mjs`. Běžný push i uložení v CMS vyvolají nové nasazení.

## Podklady k doplnění

Výsledkové soubory PDF (2025–2020) a DOC (2019–1996) zatím nejsou dodané; odkazy jsou připravené. Alba 2025, 2024 a 2021 obsahují zástupné snímky z roku 2026 a mají tuto skutečnost uvedenou v popisu. Jejich data jsou pouze klíče pro řazení, nikoliv tvrzení o dni fotografování. Tři titulní fotografie článků jsou ilustrační. E-mail `simona@chrudim.cz` a odkaz na mapu pocházejí ze schváleného prototypu, protože textový export e-mail skrývá. Historické texty zachovávají dobové formulace a jména.
