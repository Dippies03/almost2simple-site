// 1) Paste your Apps Script Web App URL here:
const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyybKXch_-ufU2mZ6KJES948WC7tkQYQkBuilmdA0SGhF5I4QhwVx2r1XJJisTtLzDV/exec";

// Helpers
const $ = (id) => document.getElementById(id);
const escapeHtml = (s) =>
  String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function formatPrice(v) {
  if (v === null || typeof v === "undefined" || v === "") return "";
  // if it's numeric, format as R
  if (typeof v === "number") return `From R${v.toLocaleString("en-ZA")}`;
  const str = String(v).trim();
  if (/^\d+(\.\d+)?$/.test(str)) return `From R${Number(str).toLocaleString("en-ZA")}`;
  return `From ${str}`;
}

function setMeta(title, desc) {
  if (title) document.title = title;

  const descTag = document.querySelector('meta[name="description"]');
  if (descTag && desc) descTag.setAttribute("content", desc);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogTitle && title) ogTitle.setAttribute("content", title);
  if (ogDesc && desc) ogDesc.setAttribute("content", desc);
}

function setThemeColor(hex) {
  if (!hex) return;
  document.documentElement.style.setProperty("--primary", hex);
}

function waLink(whatsappNumber, prefill) {
  const n = String(whatsappNumber || "").replace(/\D/g, "");
  const msg = encodeURIComponent(prefill || "Hi! I'm interested in an easy-to-manage website.");
  return `https://wa.me/${n}?text=${msg}`;
}

async function main() {
  $("year").textContent = new Date().getFullYear();

  if (!SHEET_API_URL || SHEET_API_URL.includes("ignore")) {
    alert("You need to paste your Apps Script Web App URL into script.js (SHEET_API_URL).");
    return;
  }

  let data;
  try {
    const res = await fetch(SHEET_API_URL, { cache: "no-store" });
    data = await res.json();
  } catch (e) {
    console.error(e);
    alert("Could not load data from Google Sheet. Check your Web App URL + permissions.");
    return;
  }

  const s = data.settings || {};
  const services = Array.isArray(data.services) ? data.services : [];
  const faq = Array.isArray(data.faq) ? data.faq : [];

  // Brand / SEO
  $("businessName").textContent = s.business_name || "Almost2Simple";
  $("businessNameFooter").textContent = s.business_name || "Almost2Simple";
  $("tagline").textContent = s.tagline || "";
  $("h1").textContent = s.tagline || "Easy-to-manage websites for Western Cape small businesses";
  $("location").textContent = s.location || "Western Cape";
  $("emailText").textContent = s.email || "—";
  setThemeColor(s.primary_color);
  setMeta(s.meta_title || s.business_name || "Almost2Simple", s.meta_description || "");

  // WhatsApp button
  const wa = waLink(s.whatsapp, `Hi! I’m interested in an easy-to-manage website. Business:`);
  const waBtn = $("whatsappBtn");
  waBtn.href = wa;
  waBtn.target = "_blank";

  // Services list (demo section)
  const servicesEl = $("services");
  servicesEl.innerHTML = services.map(item => {
    const name = escapeHtml(item.name);
    const desc = escapeHtml(item.description);
    const price = escapeHtml(formatPrice(item.from_price));
    return `
      <div class="item">
        <div class="item__top">
          <div class="item__title">${name}</div>
          <div class="item__meta">${price}</div>
        </div>
        <div class="item__desc">${desc}</div>
      </div>
    `;
  }).join("") || `<div class="muted">No services found yet.</div>`;

  // Pricing cards (reuse services)
  const pricingGrid = $("pricingGrid");
  pricingGrid.innerHTML = services.map(item => {
    const name = escapeHtml(item.name);
    const desc = escapeHtml(item.description);
    const price = escapeHtml(formatPrice(item.from_price));
    return `
      <div class="card">
        <h3>${name}</h3>
        <p class="muted">${desc}</p>
        <div style="margin-top:10px;font-weight:800">${price}</div>
        <div style="margin-top:14px">
          <a class="btn btn--primary" href="${wa}" target="_blank" rel="noopener">WhatsApp to start</a>
        </div>
      </div>
    `;
  }).join("") || `<div class="muted">Add services in the Google Sheet.</div>`;

  // FAQ
  const faqEl = $("faq");
  faqEl.innerHTML = faq.map(item => {
    const q = escapeHtml(item.question);
    const a = escapeHtml(item.answer);
    return `
      <details>
        <summary>${q}</summary>
        <p>${a}</p>
      </details>
    `;
  }).join("") || `<div class="muted">No FAQs found yet.</div>`;

  // Basic LocalBusiness schema (service-area-ish)
  const schema = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": s.business_name || "Almost2Simple",
    "areaServed": "Western Cape, South Africa",
    "address": {
      "@type": "PostalAddress",
      "addressRegion": "Western Cape",
      "addressCountry": "ZA"
    },
    "email": s.email || undefined,
    "url": window.location.href
  };

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

main();

