// All user-facing copy for the English site. ro.ts mirrors this shape
// (it's typed against `Dictionary`), so a missing translation fails the build.
// Project and service entries are in the same order as PROJECT_META /
// SERVICE_CLUSTER_META in their data files.
export const en = {
  meta: {
    title: "LINKHAUS — Web Design & Development Studio in Romania",
    description:
      "LINKHAUS designs and builds custom, high-performance websites — from brand-led landing pages and 3D web experiences to e-commerce and full-stack platforms. Based in Romania, working worldwide.",
  },
  nav: {
    links: [
      { label: "Work", href: "#work" },
      { label: "Services", href: "#services" },
      { label: "Contact", href: "#contact" },
    ],
    cta: "Let’s talk",
    toggleMenu: "Toggle menu",
    language: "Language",
  },
  cursor: {
    project: ["View", "Project"],
    explore: ["Drag", "Explore"],
  },
  projects: {
    label: "Selected Work",
    panelLabel: "Project",
    items: [
      {
        title: "Utopia",
        description:
          "Website for Utopia Fried Chicken, a bold red-and-yellow fast-food brand. A full menu with category filters (burgers, wings, buckets, deals) and a store locator, designed mobile-first.",
        tags: ["WEB", "BRAND"],
      },
      {
        title: "eCandidat",
        description:
          "Full-stack recruitment platform for eCandidat, built with Next.js, React and Node.js. Candidates build one profile and jobs come to them; companies post roles and get smart-matched candidates instead of mass applications.",
        tags: ["WEB", "PRODUCT"],
      },
      {
        title: "Cuib d'Arte",
        description:
          "Concept website for Cuib d'Arte, an art bar where art meets drinks and stories. It has a hand-crafted paper-and-typewriter look, an events feed, table reservations and a bilingual RO/EN interface.",
        tags: ["WEB", "CONCEPT"],
      },
      {
        title: "Nocturne",
        description:
          "Concept website for Nocturne Cocktail Club. A \"what do you feel like tonight?\" flavour picker recommends cocktails, alongside cinematic motion, 3D product shots and table reservations.",
        tags: ["WEB", "CONCEPT"],
      },
    ],
  },
  services: {
    label: "Our Services",
    title: "Websites that turn you into the obvious choice.",
    subtitle:
      "Every project is designed to outperform the competition. From first impression to checkout, design to infrastructure.",
    livePreview: "Live preview",
    tablistSuffix: "services",
    catalogName: "Web design & development services",
    clusters: [
      {
        title: "Design & Identity",
        items: [
          {
            title: "Landing page design",
            detail: "Built around your brand — not a template.",
            description:
              "Every layout starts from your product and positioning, not a pre-built theme — typography, spacing, and pacing are tuned until the page reads as unmistakably yours.",
          },
          {
            title: "Visual storytelling & motion design",
            detail: "Scroll choreography, micro-interactions, brand animation.",
            description:
              "Motion is treated as a storytelling tool, not decoration — scroll-linked reveals, hover states, and transitions that guide attention and reinforce what the brand stands for.",
          },
          {
            title: "3D & WebGL experiences",
            detail: "Immersive scenes and real-time graphics, not just static pages.",
            description:
              "Custom real-time scenes built with Three.js and shader work — product showcases, spatial navigation, and generative backdrops that make a site feel like software, not a document.",
          },
        ],
      },
      {
        title: "Structure & Navigation",
        items: [
          {
            title: "Multi-page architecture",
            detail: "Product displays, catalogs, nested navigation.",
            description:
              "Information architecture planned before a single screen is designed — clear hierarchies for catalogs, category pages, and nested content that stay easy to navigate as they grow.",
          },
          {
            title: "Responsive systems",
            detail: "Built to hold up across every screen.",
            description:
              "Layouts built on fluid grids and real breakpoints, not device-specific patches — every component is tested from small phones to ultra-wide monitors.",
          },
        ],
      },
      {
        title: "Commerce & Accounts",
        items: [
          {
            title: "Cart & checkout configuration",
            detail: "Stripe, Shopify, custom flows.",
            description:
              "End-to-end purchase flows wired up on Stripe, Shopify, or a fully custom stack — cart logic, tax and shipping rules, and a checkout tuned to reduce drop-off.",
          },
          {
            title: "Authentication & account systems",
            detail: "Login, gated content, memberships.",
            description:
              "Secure sign-up and login flows, session handling, and role-based access for gated content or membership tiers — built to feel effortless for the user and solid underneath.",
          },
        ],
      },
      {
        title: "Engineering & Infrastructure",
        items: [
          {
            title: "Backend development & API integrations",
            description:
              "Custom server-side logic and integrations with the tools you already run — payment processors, CRMs, analytics, and third-party APIs wired together cleanly.",
          },
          {
            title: "Database design & content modeling",
            description:
              "Schemas and content models designed for how the site will actually grow — structured so new content types and features slot in without a rebuild.",
          },
          {
            title: "Performance, SEO & accessibility tuning",
            description:
              "Core Web Vitals, semantic markup, and accessibility audits treated as part of the build, not an afterthought — a site that ranks well and works for everyone.",
          },
          {
            title: "Post-launch support & iteration",
            description:
              "Launch is the start, not the finish — ongoing monitoring, fixes, and iteration as real usage data comes in.",
          },
        ],
      },
    ] as { title: string; items: { title: string; detail?: string; description?: string }[] }[],
  },
  contact: {
    eyebrow: "Get In Touch",
    titleLines: ["Let's build", "something", "unforgettable."],
    subtitle: "Have a project in mind? Email us or give us a call.",
    availability: "Available for select projects",
  },
  footer: {
    metaLines: ["CREATIVE DEVELOPMENT STUDIO", "BASED IN ROMANIA / WORKING WORLDWIDE"],
    navLabel: "Footer",
    backToTop: "BACK TO TOP",
  },
  notFound: {
    eyebrow: "Error 404",
    body: "This room of the house doesn't exist. The page may have moved, or the link is broken.",
    backHome: "Back to home",
  },
};

export type Dictionary = typeof en;
