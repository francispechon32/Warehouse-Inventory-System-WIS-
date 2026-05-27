import { useState, useEffect, useRef } from "react";
import TDTLogoImg from "./assets/Untitled_design.svg";

/* ─── Animated grid background ─── */
function GridBackground() {
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 0 }}>
      {/* Dark steel-blue base */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, #0a0e1a 0%, #0d1526 50%, #111827 100%)",
      }} />
      {/* Subtle grid lines */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `
          linear-gradient(rgba(232,124,39,0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(232,124,39,0.06) 1px, transparent 1px)
        `,
        backgroundSize: "48px 48px",
        animation: "gridDrift 20s linear infinite",
      }} />
      {/* Orange glow orb — left */}
      <div style={{
        position: "absolute", width: 500, height: 500,
        left: "-100px", top: "20%",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(232,124,39,0.12) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />
      {/* Blue glow orb — right */}
      <div style={{
        position: "absolute", width: 400, height: 400,
        right: "-80px", bottom: "10%",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />
      {/* Scanline effect */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        pointerEvents: "none",
      }} />
    </div>
  );
}

/* ─── TDT Logo SVG text ─── */
function TDTLogo({ size = 1 }) {
  return (
    <img
      src={TDTLogoImg}
      alt="TDT PowerSteel Logo"
      style={{ width: 240 * size, height: "auto", display: "block" }}
    />
  );
}

/* ─── Left panel — warehouse imagery + brand ─── */
function LeftPanel() {
  return (
    <div style={{
      flex: "1 1 55%",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "48px 52px",
      minHeight: "100vh",
    }}>
      {/* Dark overlay on warehouse photo */}
      <div style={{
        position: "absolute", inset: 0,
        background: `
          linear-gradient(
            110deg,
            rgba(9,13,26,0.82) 0%,
            rgba(9,13,26,0.65) 50%,
            rgba(9,13,26,0.88) 100%
          )
        `,
        zIndex: 1,
      }} />
      {/* Steel distributor/supplier imagery */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url("https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=1200&q=80")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        filter: "saturate(0.55) brightness(0.55)",
      }} />

      {/* Content over overlay */}
      <div style={{ position: "relative", zIndex: 2 }}>
        <TDTLogo size={1.8} />
      </div>

      <div style={{ position: "relative", zIndex: 2, textAlign: "left" }}>
        <div style={{
          width: 64, height: 3,
          background: "linear-gradient(90deg, #e87c27, transparent)",
          marginBottom: 24,
        }} />
        <h2 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 52,
          fontWeight: 700,
          color: "#fff",
          lineHeight: 1.15,
          margin: "0 0 16px",
          letterSpacing: "-0.5px",
        }}>
          Steel<br />
          <span style={{ color: "#e87c27" }}>Distribution</span><br />
          & Supply
        </h2>
        <p style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 15,
          color: "rgba(255,255,255,0.5)",
          fontWeight: 400,
          letterSpacing: "0.3px",
          lineHeight: 1.6,
          maxWidth: 320,
        }}>
          Manage your steel supply chain, track incoming orders,<br />
          and monitor stock levels — all in one place.
        </p>

        {/* Stats row */}
        <div style={{ display: "flex", gap: 32, marginTop: 40 }}>
          {[["16+", "SKUs Tracked"], ["₱13M+", "Stock Value"], ["Trusted", "Distributor"]].map(([val, label]) => (
            <div key={label}>
              <div style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: 20,
                fontWeight: 700,
                color: "#e87c27",
              }}>{val}</div>
              <div style={{
                fontFamily: "'Rajdhani', sans-serif",
                fontSize: 11,
                color: "rgba(255,255,255,0.4)",
                letterSpacing: "1px",
                textTransform: "uppercase",
                marginTop: 2,
              }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Floating input ─── */
function FloatingInput({ label, type = "text", value, onChange, autoComplete, icon, rightSlot }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{
        display: "block",
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 11, fontWeight: 700,
        color: focused ? "#e87c27" : "rgba(255,255,255,0.4)",
        letterSpacing: "0.08em", textTransform: "uppercase",
        marginBottom: 4,
        transition: "color 0.2s",
      }}>
        {label}
      </label>
      <div style={{
        position: "relative",
        border: `1.5px solid ${focused ? "#e87c27" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 10,
        background: focused ? "rgba(232,124,39,0.04)" : "rgba(255,255,255,0.03)",
        transition: "border-color 0.2s, background 0.2s, box-shadow 0.2s",
        boxShadow: focused ? "0 0 0 3px rgba(232,124,39,0.12)" : "none",
      }}>
        {/* Left icon */}
        <span style={{
          position: "absolute", left: 14, top: "50%",
          transform: "translateY(-50%)",
          color: focused ? "#e87c27" : "rgba(255,255,255,0.3)",
          transition: "color 0.2s",
          display: "flex", alignItems: "center",
          pointerEvents: "none",
        }}>
          {icon}
        </span>

        <input
          type={type}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder=""
          style={{
            width: "100%",
            padding: `13px 14px 13px 44px`,
            paddingRight: rightSlot ? 44 : 14,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "#f3f4f6",
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 15,
            fontWeight: 500,
            boxSizing: "border-box",
          }}
        />

        {rightSlot && (
          <span style={{
            position: "absolute", right: 14, top: "50%",
            transform: "translateY(-50%)",
          }}>
            {rightSlot}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Divider ─── */
function OrDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
      <span style={{
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 12, fontWeight: 600,
        color: "rgba(255,255,255,0.25)",
        letterSpacing: "2px",
        textTransform: "uppercase",
      }}>or</span>
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
    </div>
  );
}

/* ─── Google button ─── */
function GoogleButton({ onClick, label }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "13px 16px",
        background: hovered ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.04)",
        border: "1.5px solid rgba(255,255,255,0.12)",
        borderRadius: 10,
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 14, fontWeight: 600,
        color: "rgba(255,255,255,0.75)",
        transition: "background 0.2s, border-color 0.2s",
        letterSpacing: "0.3px",
      }}
    >
      <svg width={18} height={18} viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
      {label}
    </button>
  );
}

/* ─── Primary action button ─── */
function PrimaryButton({ children, onClick, loading }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "14px 20px",
        background: loading
          ? "#8b4e16"
          : hovered
            ? "linear-gradient(135deg, #f09040 0%, #e87c27 100%)"
            : "linear-gradient(135deg, #e87c27 0%, #c96b1c 100%)",
        border: "none",
        borderRadius: 10,
        cursor: loading ? "not-allowed" : "pointer",
        color: "#fff",
        fontFamily: "'Orbitron', sans-serif",
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        transition: "all 0.2s",
        boxShadow: hovered && !loading
          ? "0 8px 24px rgba(232,124,39,0.35)"
          : "0 4px 12px rgba(232,124,39,0.2)",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        transform: hovered && !loading ? "translateY(-1px)" : "none",
      }}
    >
      {loading ? (
        <>
          <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
          Processing...
        </>
      ) : children}
    </button>
  );
}

/* ─── Icons ─── */
function IconUser({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function IconMail({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>;
}
function IconLock({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
}
function IconEye({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
}
function IconEyeOff({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}

/* ─── Password field with toggle ─── */
function PasswordInput({ label, value, onChange, autoComplete }) {
  const [show, setShow] = useState(false);
  return (
    <FloatingInput
      label={label}
      type={show ? "text" : "password"}
      value={value}
      onChange={onChange}
      autoComplete={autoComplete}
      icon={<IconLock size={16} />}
      rightSlot={
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "rgba(255,255,255,0.3)", padding: 4,
            display: "flex", alignItems: "center",
            transition: "color 0.2s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#e87c27"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
        >
          {show ? <IconEyeOff size={16} /> : <IconEye size={16} />}
        </button>
      }
    />
  );
}

/* ─── Toast notification ─── */
function Toast({ message, type }) {
  if (!message) return null;
  return (
    <div style={{
      padding: "10px 16px",
      borderRadius: 8,
      background: type === "error" ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
      border: `1px solid ${type === "error" ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
      color: type === "error" ? "#fca5a5" : "#86efac",
      fontFamily: "'Rajdhani', sans-serif",
      fontSize: 13,
      fontWeight: 500,
      marginBottom: 16,
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span>{type === "error" ? "⚠" : "✓"}</span>
      {message}
    </div>
  );
}

/* ─── Login Form ─── */
function LoginForm({ onSwitch, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleLogin = () => {
    if (!email || !password) {
      setToast({ msg: "Please fill in all fields.", type: "error" });
      return;
    }
    setToast(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess?.(email);
    }, 1600);
  };

  return (
    <div style={{ animation: "slideIn 0.35s ease" }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 32, fontWeight: 700,
          color: "#f9fafb", margin: "0 0 6px",
          letterSpacing: "-0.3px",
        }}>
          Welcome back
        </h1>
        <p style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 14, color: "rgba(255,255,255,0.4)",
          fontWeight: 400, letterSpacing: "0.2px",
        }}>
          Sign in to your TDT IMS account
        </p>
      </div>

      <Toast message={toast?.msg} type={toast?.type} />

      <FloatingInput
        label="Email / Username"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="email"
        icon={<IconMail size={16} />}
      />
      <PasswordInput
        label="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="current-password"
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <label style={{
          display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 13, color: "rgba(255,255,255,0.45)", fontWeight: 500,
        }}>
          <div
            onClick={() => setRemember(r => !r)}
            style={{
              width: 16, height: 16, borderRadius: 4,
              border: `1.5px solid ${remember ? "#e87c27" : "rgba(255,255,255,0.2)"}`,
              background: remember ? "#e87c27" : "transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
          >
            {remember && <svg width={10} height={10} viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>}
          </div>
          Remember me
        </label>
        <button
          type="button"
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'Rajdhani', sans-serif",
            fontSize: 13, color: "#e87c27", fontWeight: 600,
            letterSpacing: "0.2px",
          }}
        >
          Forgot password?
        </button>
      </div>

      <PrimaryButton onClick={handleLogin} loading={loading}>
        Sign In →
      </PrimaryButton>

      <OrDivider />

      <GoogleButton onClick={() => {}} label="Continue with Google" />

      <p style={{
        textAlign: "center", marginTop: 24,
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500,
      }}>
        Don't have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#e87c27", fontFamily: "'Rajdhani', sans-serif",
            fontSize: 13, fontWeight: 700, letterSpacing: "0.2px",
          }}
        >
          Create account
        </button>
      </p>
    </div>
  );
}

/* ─── Sign Up Form ─── */
function SignUpForm({ onSwitch, onLoginSuccess }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSignUp = () => {
    if (!name || !email || !password || !confirm) {
      setToast({ msg: "Please fill in all required fields.", type: "error" });
      return;
    }
    if (password !== confirm) {
      setToast({ msg: "Passwords do not match.", type: "error" });
      return;
    }
    setToast(null);
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setToast({ msg: "Account created! Please sign in.", type: "success" });
      setTimeout(() => onSwitch?.(), 1800);
    }, 1600);
  };

  /* Password strength */
  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4
    : 3;
  const strengthColors = ["transparent", "#ef4444", "#f59e0b", "#22c55e", "#16a34a"];
  const strengthLabels = ["", "Weak", "Fair", "Strong", "Very strong"];

  return (
    <div style={{ animation: "slideIn 0.35s ease" }}>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 32, fontWeight: 700,
          color: "#f9fafb", margin: "0 0 6px",
          letterSpacing: "-0.3px",
        }}>
          Create account
        </h1>
        <p style={{
          fontFamily: "'Rajdhani', sans-serif",
          fontSize: 14, color: "rgba(255,255,255,0.4)",
          fontWeight: 400, letterSpacing: "0.2px",
        }}>
          Request access to TDT Inventory System
        </p>
      </div>

      <Toast message={toast?.msg} type={toast?.type} />

      <FloatingInput
        label="Full Name"
        value={name}
        onChange={e => setName(e.target.value)}
        autoComplete="name"
        icon={<IconUser size={16} />}
      />
      <FloatingInput
        label="Email Address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        autoComplete="email"
        icon={<IconMail size={16} />}
      />

      <PasswordInput
        label="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        autoComplete="new-password"
      />

      {/* Password strength */}
      {password.length > 0 && (
        <div style={{ marginTop: -14, marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 2,
                background: i <= strength ? strengthColors[strength] : "rgba(255,255,255,0.08)",
                transition: "background 0.3s",
              }} />
            ))}
          </div>
          <p style={{
            fontSize: 11, fontFamily: "'Rajdhani', sans-serif",
            color: strengthColors[strength], fontWeight: 600,
            textAlign: "right", margin: 0,
          }}>{strengthLabels[strength]}</p>
        </div>
      )}

      <PasswordInput
        label="Confirm Password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        autoComplete="new-password"
      />

      <div style={{ marginBottom: 24 }} />

      <PrimaryButton onClick={handleSignUp} loading={loading}>
        Create Account →
      </PrimaryButton>

      <OrDivider />

      <GoogleButton onClick={() => {}} label="Sign up with Google" />

      <p style={{
        textAlign: "center", marginTop: 24,
        fontFamily: "'Rajdhani', sans-serif",
        fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500,
      }}>
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitch}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: "#e87c27", fontFamily: "'Rajdhani', sans-serif",
            fontSize: 13, fontWeight: 700, letterSpacing: "0.2px",
          }}
        >
          Sign in
        </button>
      </p>
    </div>
  );
}

/* ─── Main export ─── */
export default function LoginPage({ onLoginSuccess }) {
  const [mode, setMode] = useState("login"); // "login" | "signup"

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes gridDrift {
          0% { background-position: 0 0; }
          100% { background-position: 48px 48px; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes panelIn {
          from { opacity: 0; transform: translateY(24px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0e1a; }

        /* Scrollbar inside right panel */
        .right-scroll::-webkit-scrollbar { width: 4px; }
        .right-scroll::-webkit-scrollbar-track { background: transparent; }
        .right-scroll::-webkit-scrollbar-thumb { background: rgba(232,124,39,0.3); border-radius: 2px; }
      `}</style>

      <div style={{
        display: "flex",
        minHeight: "100vh",
        fontFamily: "'Rajdhani', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>
        <GridBackground />

        {/* Left panel — visible on wider screens */}
        <div style={{
          display: "flex", flex: "1 1 55%",
          position: "relative", zIndex: 1,
        }}>
          <LeftPanel />
        </div>

        {/* Right panel — auth form */}
        <div style={{
          flex: "0 0 480px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          zIndex: 1,
          padding: "40px 24px",
        }}>
          {/* Glassmorphism card */}
          <div style={{
            width: "100%",
            maxWidth: 420,
            background: "rgba(15,20,35,0.85)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: "40px 36px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(232,124,39,0.08) inset",
            animation: "panelIn 0.5s ease",
            maxHeight: "90vh",
            overflowY: "auto",
          }} className="right-scroll">

            {/* Top brand mark */}
            <div style={{ marginBottom: 36, display: "flex", justifyContent: "center" }}>
              <TDTLogo size={1.1} />
            </div>

            {/* Tab switcher */}
            <div style={{
              display: "flex",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 10,
              padding: 4,
              marginBottom: 20,
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              {[["login", "Sign In"], ["signup", "Sign Up"]].map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: 7,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontSize: 13, fontWeight: 700,
                    letterSpacing: "0.5px",
                    transition: "all 0.2s",
                    background: mode === m
                      ? "linear-gradient(135deg, #e87c27 0%, #c96b1c 100%)"
                      : "transparent",
                    color: mode === m ? "#fff" : "rgba(255,255,255,0.35)",
                    boxShadow: mode === m ? "0 2px 8px rgba(232,124,39,0.3)" : "none",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Forms */}
            {mode === "login"
              ? <LoginForm onSwitch={() => setMode("signup")} onLoginSuccess={onLoginSuccess} />
              : <SignUpForm onSwitch={() => setMode("login")} onLoginSuccess={onLoginSuccess} />
            }
          </div>
        </div>
      </div>
    </>
  );
}