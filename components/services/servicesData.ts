export interface ServiceItem {
  title: string;
  detail?: string;
  description?: string;
}

export interface ServiceClusterData {
  index: string;
  title: string;
  summary: string;
  accent: string;
  items: ServiceItem[];
}

export const SERVICE_CLUSTERS: ServiceClusterData[] = [
  {
    index: "01",
    title: "Design & Identity",
    summary: "Where the brand becomes an interface.",
    accent: "#8a5cff",
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
    index: "02",
    title: "Structure & Navigation",
    summary: "Systems that scale without losing clarity.",
    accent: "#2b4bff",
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
    index: "03",
    title: "Commerce & Accounts",
    summary: "From browse to buy, without friction.",
    accent: "#ff5a1f",
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
    index: "04",
    title: "Engineering & Infrastructure",
    summary: "The part nobody sees — running perfectly.",
    accent: "#c8ff4d",
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
];
