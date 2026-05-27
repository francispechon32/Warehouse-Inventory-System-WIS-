import "./modalDesign.css";

/** Shared modal shell + sections for settings, help, and alerts */

export const MODAL_THEME = {
  logout: { accent: "#e87c27", soft: "#fff7ed", icon: "⏻" },
  "user-management": { accent: "#e87c27", soft: "#fff7ed", icon: null },
  "stock-limits": { accent: "#e87c27", soft: "#fff7ed", icon: null },
  "user-guide": { accent: "#e87c27", soft: "#fff7ed", icon: null },
  faqs: { accent: "#e87c27", soft: "#fff7ed", icon: "?" },
  about: { accent: "#e87c27", soft: "#fff7ed", icon: null },
  contact: { accent: "#e87c27", soft: "#fff7ed", icon: "✉" },
  "low-stock": { accent: "#e87c27", soft: "#fff7ed", icon: "⚠" },
};

export function ModalBackdrop({ onClose, children }) {
  return (
    <div
      className="wis-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      {children}
    </div>
  );
}

export function ModalFrame({ maxWidth = 520, children, className = "" }) {
  return (
    <div
      className={`wis-modal-frame ${className}`.trim()}
      style={{ maxWidth }}
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      {children}
    </div>
  );
}

export function ModalAccentBar({ accent = "#e87c27" }) {
  return <div className="wis-modal-accent-bar" style={{ background: accent }} />;
}

export function ModalHeader({
  theme,
  title,
  subtitle,
  center = false,
  hideIcon = false,
  onClose,
}) {
  const t = theme || MODAL_THEME.contact;
  return (
    <header
      className={`wis-modal-header${center ? " wis-modal-header--center" : ""}`}
      style={{ background: "#ffffff" }}
    >
      <div className="wis-modal-header__main">
        {!hideIcon && t.icon && (
          <div
            className="wis-modal-header__icon"
            style={{ background: t.soft, color: t.accent, borderColor: `${t.accent}33` }}
          >
            <span aria-hidden>{t.icon}</span>
          </div>
        )}
        <div className="wis-modal-header__text">
          <h2 className="wis-modal-header__title">{title}</h2>
          {subtitle && <p className="wis-modal-header__subtitle">{subtitle}</p>}
        </div>
      </div>
      <button type="button" className="wis-modal-close" onClick={onClose} aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </header>
  );
}

export function ModalBody({ children, className = "", style }) {
  return <div className={`wis-modal-body ${className}`.trim()} style={style}>{children}</div>;
}

export function ModalFooter({ children, className = "", style }) {
  return <footer className={`wis-modal-footer ${className}`.trim()} style={style}>{children}</footer>;
}

export function ModalSurface({ children, className = "", style }) {
  return <div className={`wis-modal-surface ${className}`.trim()} style={style}>{children}</div>;
}

export function ModalCallout({ accent, children }) {
  return (
    <div className="wis-modal-callout" style={{ borderLeftColor: accent, background: `${accent}12` }}>
      {children}
    </div>
  );
}

export function ModalStatGrid({ stats }) {
  return (
    <div className="wis-modal-stat-grid">
      {stats.map((s) => (
        <div key={s.label} className="wis-modal-stat" style={{ borderTopColor: s.color || "#e87c27" }}>
          <div className="wis-modal-stat__num" style={{ color: s.color || "#111827" }}>{s.value}</div>
          <div className="wis-modal-stat__label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export function ModalSearch({ placeholder, value, onChange, id }) {
  return (
    <div className="wis-modal-search">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export function ModalBtn({ variant = "secondary", children, ...props }) {
  const cls = variant === "primary"
    ? "wis-modal-btn wis-modal-btn--primary"
    : variant === "danger"
      ? "wis-modal-btn wis-modal-btn--danger"
      : "wis-modal-btn wis-modal-btn--secondary";
  return <button type="button" className={cls} {...props}>{children}</button>;
}

export function ModalFaqItem({ index, question, answer, open, onToggle, accent }) {
  return (
    <div className={`wis-modal-faq${open ? " wis-modal-faq--open" : ""}`} style={{ "--faq-accent": accent }}>
      <button type="button" className="wis-modal-faq__trigger" onClick={onToggle}>
        <span className="wis-modal-faq__num">{index + 1}</span>
        <span className="wis-modal-faq__q">{question}</span>
        <span className={`wis-modal-faq__chev${open ? " is-open" : ""}`}>▼</span>
      </button>
      {open && <div className="wis-modal-faq__answer">{answer}</div>}
    </div>
  );
}

export function ModalContactCard({ label, value, icon }) {
  return (
    <div className="wis-modal-contact-card">
      <span className="wis-modal-contact-card__icon" aria-hidden>{icon}</span>
      <div>
        <p className="wis-modal-contact-card__label">{label}</p>
        <p className="wis-modal-contact-card__value">{value}</p>
      </div>
    </div>
  );
}

export function ModalGuideTab({ active, onClick, emoji, label }) {
  return (
    <button type="button" className={`wis-modal-guide-tab${active ? " is-active" : ""}`} onClick={onClick}>
      <span className="wis-modal-guide-tab__emoji">{emoji}</span>
      <span>{label}</span>
    </button>
  );
}

export function ModalGuidePanel({ title, children }) {
  return (
    <div className="wis-modal-guide-panel">
      <h3 className="wis-modal-guide-panel__title">{title}</h3>
      {children}
    </div>
  );
}