import type { Dictionary } from "./en";

export const ro: Dictionary = {
  meta: {
    title: "LINKHAUS — Studio de Web Design și Dezvoltare Web din România",
    description:
      "LINKHAUS proiectează și dezvoltă site-uri personalizate, de înaltă performanță — de la landing page-uri construite în jurul brandului și experiențe web 3D, până la magazine online și platforme full-stack. Din România, pentru clienți din întreaga lume.",
  },
  nav: {
    links: [
      { label: "Proiecte", href: "#work" },
      { label: "Servicii", href: "#services" },
      { label: "Contact", href: "#contact" },
    ],
    cta: "Hai să vorbim",
    toggleMenu: "Deschide meniul",
    language: "Limbă",
  },
  cursor: {
    project: ["Vezi", "Proiectul"],
    explore: ["Trage", "Explorează"],
  },
  projects: {
    label: "Proiecte selectate",
    panelLabel: "Proiect",
    items: [
      {
        title: "Utopia",
        description:
          "Site pentru Utopia Fried Chicken, un brand de fast-food îndrăzneț, în roșu și galben. Meniu complet cu filtre pe categorii (burgeri, aripioare, bucket-uri, oferte) și localizator de restaurante, gândit mobile-first.",
        tags: ["WEB", "BRAND"],
      },
      {
        title: "eCandidat",
        description:
          "Platformă de recrutare full-stack pentru eCandidat, construită cu Next.js, React și Node.js. Candidații își fac un singur profil, iar joburile vin la ei; companiile publică posturi și primesc candidați potriviți automat, în loc de aplicări în masă.",
        tags: ["WEB", "PRODUS"],
      },
      {
        title: "Cuib d'Arte",
        description:
          "Concept de site pentru Cuib d'Arte, un art bar unde arta se întâlnește cu băuturile și poveștile. Are un aspect lucrat manual, de hârtie și mașină de scris, un flux de evenimente, rezervări de mese și o interfață bilingvă RO/EN.",
        tags: ["WEB", "CONCEPT"],
      },
      {
        title: "Nocturne",
        description:
          "Concept de site pentru Nocturne Cocktail Club. Un selector de arome „ce ai chef în seara asta?” recomandă cocktailuri, alături de animații cinematice, randări 3D de produs și rezervări de mese.",
        tags: ["WEB", "CONCEPT"],
      },
    ],
  },
  services: {
    label: "Serviciile noastre",
    title: "Site-uri care te transformă în alegerea evidentă.",
    subtitle:
      "Fiecare proiect e gândit să depășească concurența. De la prima impresie la checkout, de la design la infrastructură.",
    livePreview: "Previzualizare live",
    tablistSuffix: "– servicii",
    catalogName: "Servicii de web design și dezvoltare web",
    clusters: [
      {
        title: "Design & Identitate",
        items: [
          {
            title: "Design de landing page",
            detail: "Construit în jurul brandului tău — nu pe un șablon.",
            description:
              "Fiecare layout pornește de la produsul și poziționarea ta, nu de la o temă gata făcută — tipografia, spațierea și ritmul sunt ajustate până când pagina nu poate fi decât a ta.",
          },
          {
            title: "Storytelling vizual & motion design",
            detail: "Coregrafie la scroll, micro-interacțiuni, animație de brand.",
            description:
              "Mișcarea e folosită ca instrument narativ, nu ca decor — apariții legate de scroll, stări la hover și tranziții care ghidează atenția și întăresc ceea ce reprezintă brandul.",
          },
          {
            title: "Experiențe 3D & WebGL",
            detail: "Scene imersive și grafică în timp real, nu doar pagini statice.",
            description:
              "Scene personalizate în timp real, construite cu Three.js și shadere — prezentări de produs, navigare spațială și fundaluri generative care fac un site să pară software, nu un document.",
          },
        ],
      },
      {
        title: "Structură & Navigare",
        items: [
          {
            title: "Arhitectură multi-pagină",
            detail: "Prezentări de produs, cataloage, navigare pe mai multe niveluri.",
            description:
              "Arhitectura informației e planificată înainte de primul ecran — ierarhii clare pentru cataloage, pagini de categorie și conținut pe mai multe niveluri, ușor de navigat pe măsură ce cresc.",
          },
          {
            title: "Sisteme responsive",
            detail: "Construite să arate bine pe orice ecran.",
            description:
              "Layout-uri pe grile fluide și breakpoint-uri reale, nu peticite pentru fiecare dispozitiv — fiecare componentă e testată de la telefoane mici la monitoare ultra-wide.",
          },
        ],
      },
      {
        title: "Comerț & Conturi",
        items: [
          {
            title: "Configurare coș & checkout",
            detail: "Stripe, Shopify, fluxuri personalizate.",
            description:
              "Fluxuri de cumpărare complete pe Stripe, Shopify sau o soluție complet personalizată — logica coșului, reguli de taxe și livrare și un checkout optimizat ca să reducă abandonul.",
          },
          {
            title: "Autentificare & sisteme de conturi",
            detail: "Login, conținut restricționat, abonamente.",
            description:
              "Înregistrare și autentificare securizate, gestionarea sesiunilor și acces pe roluri pentru conținut restricționat sau niveluri de abonament — simple pentru utilizator și solide în spate.",
          },
        ],
      },
      {
        title: "Inginerie & Infrastructură",
        items: [
          {
            title: "Dezvoltare backend & integrări API",
            description:
              "Logică server-side personalizată și integrări cu instrumentele pe care le folosești deja — procesatori de plăți, CRM-uri, analytics și API-uri externe, conectate curat.",
          },
          {
            title: "Design de baze de date & modelarea conținutului",
            description:
              "Scheme și modele de conținut gândite pentru felul în care site-ul va crește de fapt — structurate astfel încât tipuri noi de conținut și funcționalități să se adauge fără o reconstrucție.",
          },
          {
            title: "Optimizare de performanță, SEO & accesibilitate",
            description:
              "Core Web Vitals, markup semantic și audituri de accesibilitate tratate ca parte din dezvoltare, nu ca un gând de după — un site care se poziționează bine și funcționează pentru toată lumea.",
          },
          {
            title: "Suport & iterații după lansare",
            description:
              "Lansarea e începutul, nu finalul — monitorizare continuă, remedieri și iterații pe măsură ce apar date reale de utilizare.",
          },
        ],
      },
    ],
  },
  contact: {
    eyebrow: "Contactează-ne",
    titleLines: ["Hai să creăm", "ceva", "de neuitat."],
    subtitle: "Ai un proiect în minte? Scrie-ne un email sau sună-ne.",
    availability: "Disponibili pentru proiecte selectate",
  },
  footer: {
    metaLines: ["STUDIO DE DEZVOLTARE CREATIVĂ", "DIN ROMÂNIA / LUCRĂM CU CLIENȚI DIN TOATĂ LUMEA"],
    navLabel: "Subsol",
    backToTop: "ÎNAPOI SUS",
  },
  notFound: {
    eyebrow: "Eroare 404",
    body: "Camera asta a casei nu există. Pagina poate fi mutată sau linkul e greșit.",
    backHome: "Înapoi acasă",
  },
};
