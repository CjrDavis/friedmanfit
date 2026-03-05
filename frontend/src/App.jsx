import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function FriedmanFitPlanner() {
  const [step, setStep] = useState(1);
  const [macros, setMacros] = useState({ protein: "", carbs: "", fat: "" });
  const [consumed, setConsumed] = useState({ protein: "", carbs: "", fat: "" });
  const [mealCount, setMealCount] = useState(2);
  const [foods, setFoods] = useState("");
  const [loading, setLoading] = useState(false);
  const [combos, setCombos] = useState(null);
  const [error, setError] = useState("");
  const [activeCombo, setActiveCombo] = useState(0);

  const remaining = {
    protein: Math.max(0, (parseFloat(macros.protein) || 0) - (parseFloat(consumed.protein) || 0)),
    carbs: Math.max(0, (parseFloat(macros.carbs) || 0) - (parseFloat(consumed.carbs) || 0)),
    fat: Math.max(0, (parseFloat(macros.fat) || 0) - (parseFloat(consumed.fat) || 0)),
  };

  async function generateMeals() {
    setLoading(true);
    setError("");
    setCombos(null);
    try {
      const res = await fetch(`${API_URL}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remaining, mealCount, foods }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      setCombos(data.combos);
      setActiveCombo(0);
      setStep(3);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const macroBar = (label, val, max, color) => {
    const pct = Math.min(100, max > 0 ? (val / max) * 100 : 0);
    return (
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#aaa", marginBottom: 3, fontFamily: "monospace", letterSpacing: 1 }}>
          <span>{label}</span>
          <span style={{ color }}>{val}g <span style={{ color: "#555" }}>/ {max}g</span></span>
        </div>
        <div style={{ height: 4, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.5s ease" }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#080808", color: "#fff", fontFamily: "'Barlow Condensed', Impact, sans-serif", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #E8FF00; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ width: "100%", maxWidth: 560, padding: "32px 24px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ background: "#E8FF00", color: "#000", fontWeight: 800, fontSize: 13, letterSpacing: 2, padding: "4px 10px" }}>FRIEDMAN.FIT</div>
        <div style={{ color: "#444", fontSize: 12, letterSpacing: 3, textTransform: "uppercase", fontFamily: "Barlow, sans-serif" }}>Macro Meal Builder</div>
      </div>

      <div style={{ width: "100%", maxWidth: 560, padding: "24px 24px 60px" }}>

        {step === 1 && (
          <div>
            <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, marginBottom: 6, letterSpacing: -1 }}>
              WHAT ARE<br /><span style={{ color: "#E8FF00" }}>YOUR MACROS?</span>
            </h1>
            <p style={{ color: "#666", fontSize: 14, fontFamily: "Barlow, sans-serif", marginBottom: 32 }}>Enter your daily targets, then what you've hit so far.</p>

            {[{ label: "Daily Targets", state: macros, setter: setMacros, accent: "#E8FF00" }, { label: "Already Consumed", state: consumed, setter: setConsumed, accent: "#333" }].map(({ label, state, setter, accent }) => (
              <div key={label} style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: accent === "#E8FF00" ? "#E8FF00" : "#aaa", marginBottom: 14, textTransform: "uppercase" }}>{label}</div>
                {[["protein", "Protein"], ["carbs", "Carbs"], ["fat", "Fat"]].map(([key, name]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ width: 80, fontSize: 13, color: "#888", fontFamily: "Barlow, sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>{name}</div>
                    <input type="number" value={state[key]} onChange={e => setter(s => ({ ...s, [key]: e.target.value }))} placeholder="0"
                      style={{ flex: 1, background: "#111", border: "1px solid #222", borderBottom: `2px solid ${accent}`, color: "#fff", fontSize: 22, fontWeight: 700, padding: "10px 14px", fontFamily: "'Barlow Condensed', sans-serif" }} />
                    <div style={{ marginLeft: 8, color: "#555", fontSize: 13, fontFamily: "Barlow, sans-serif" }}>g</div>
                  </div>
                ))}
              </div>
            ))}

            {(macros.protein || macros.carbs || macros.fat) && (
              <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", padding: "16px 20px", marginBottom: 28 }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#666", marginBottom: 14, textTransform: "uppercase" }}>Remaining to Hit</div>
                {macroBar("PROTEIN", remaining.protein, parseFloat(macros.protein) || 0, "#E8FF00")}
                {macroBar("CARBS", remaining.carbs, parseFloat(macros.carbs) || 0, "#00E5FF")}
                {macroBar("FAT", remaining.fat, parseFloat(macros.fat) || 0, "#FF6B35")}
              </div>
            )}

            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#aaa", marginBottom: 14, textTransform: "uppercase" }}>Meals Remaining</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[1, 2, 3].map(n => (
                  <button key={n} onClick={() => setMealCount(n)} style={{ flex: 1, padding: "14px 0", background: mealCount === n ? "#E8FF00" : "#111", color: mealCount === n ? "#000" : "#666", border: `1px solid ${mealCount === n ? "#E8FF00" : "#222"}`, fontSize: 20, fontWeight: 800, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: 2 }}>
                    {n} {n === 1 ? "MEAL" : "MEALS"}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!macros.protein && !macros.carbs && !macros.fat}
              style={{ width: "100%", padding: "18px", background: "#E8FF00", color: "#000", border: "none", fontSize: 18, fontWeight: 800, letterSpacing: 3, cursor: "pointer", textTransform: "uppercase", opacity: (!macros.protein && !macros.carbs && !macros.fat) ? 0.3 : 1 }}>
              NEXT → SELECT FOODS
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#555", fontSize: 12, letterSpacing: 2, cursor: "pointer", marginBottom: 24, fontFamily: "Barlow, sans-serif", textTransform: "uppercase" }}>← BACK</button>
            <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, marginBottom: 6 }}>WHAT FOODS<br /><span style={{ color: "#E8FF00" }}>DO YOU HAVE?</span></h1>
            <p style={{ color: "#666", fontSize: 14, fontFamily: "Barlow, sans-serif", marginBottom: 24 }}>e.g. "NY strip steak, jasmine rice, Greek yogurt, broccoli, Legion whey, berries"</p>

            <div style={{ background: "#0f0f0f", border: "1px solid #1a1a1a", padding: "14px 18px", marginBottom: 24, display: "flex", gap: 24 }}>
              {[["P", remaining.protein, "#E8FF00"], ["C", remaining.carbs, "#00E5FF"], ["F", remaining.fat, "#FF6B35"]].map(([l, v, c]) => (
                <div key={l}><div style={{ fontSize: 10, color: "#555", letterSpacing: 2, fontFamily: "Barlow, sans-serif" }}>{l}</div><div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}<span style={{ fontSize: 12, color: "#444" }}>g</span></div></div>
              ))}
              <div style={{ marginLeft: "auto", textAlign: "right" }}><div style={{ fontSize: 10, color: "#555", letterSpacing: 2, fontFamily: "Barlow, sans-serif" }}>MEALS</div><div style={{ fontSize: 24, fontWeight: 800, color: "#fff" }}>{mealCount}</div></div>
            </div>

            <textarea value={foods} onChange={e => setFoods(e.target.value)} placeholder="Type your available foods here..." rows={6}
              style={{ width: "100%", background: "#0f0f0f", border: "1px solid #222", borderBottom: "2px solid #E8FF00", color: "#fff", fontSize: 16, padding: "16px", fontFamily: "Barlow, sans-serif", lineHeight: 1.6, resize: "none", marginBottom: 24 }} />

            <button onClick={generateMeals} disabled={!foods.trim() || loading}
              style={{ width: "100%", padding: "18px", background: loading ? "#222" : "#E8FF00", color: loading ? "#666" : "#000", border: "none", fontSize: 18, fontWeight: 800, letterSpacing: 3, cursor: loading ? "not-allowed" : "pointer", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {loading ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◌</span> BUILDING YOUR MEALS...</> : "BUILD MY MEALS →"}
            </button>
            {error && <div style={{ color: "#ff4444", marginTop: 12, fontFamily: "Barlow, sans-serif", fontSize: 14 }}>{error}</div>}
          </div>
        )}

        {step === 3 && combos && (
          <div>
            <button onClick={() => setStep(2)} style={{ background: "none", border: "none", color: "#555", fontSize: 12, letterSpacing: 2, cursor: "pointer", marginBottom: 24, fontFamily: "Barlow, sans-serif", textTransform: "uppercase" }}>← REBUILD</button>
            <h1 style={{ fontSize: 42, fontWeight: 800, lineHeight: 1, marginBottom: 6 }}>YOUR MEAL<br /><span style={{ color: "#E8FF00" }}>OPTIONS</span></h1>
            <p style={{ color: "#666", fontSize: 14, fontFamily: "Barlow, sans-serif", marginBottom: 24 }}>3 combos built to hit your remaining macros.</p>

            <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
              {combos.map((_, i) => (
                <button key={i} onClick={() => setActiveCombo(i)}
                  style={{ flex: 1, padding: "12px 8px", background: activeCombo === i ? "#E8FF00" : "#111", color: activeCombo === i ? "#000" : "#666", border: `1px solid ${activeCombo === i ? "#E8FF00" : "#222"}`, fontSize: 13, fontWeight: 800, letterSpacing: 1, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase" }}>
                  OPT {String.fromCharCode(65 + i)}
                </button>
              ))}
            </div>

            {combos[activeCombo] && (
              <div>
                <div style={{ fontSize: 13, color: "#E8FF00", letterSpacing: 2, marginBottom: 20, textTransform: "uppercase", fontFamily: "Barlow, sans-serif" }}>{combos[activeCombo].label}</div>
                {combos[activeCombo].meals?.map((meal, mi) => (
                  <div key={mi} style={{ background: "#0d0d0d", border: "1px solid #1c1c1c", borderLeft: "3px solid #E8FF00", padding: "20px", marginBottom: 16 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 2, marginBottom: 16, color: "#E8FF00" }}>{meal.name}</div>
                    {meal.foods?.map((food, fi) => (
                      <div key={fi} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid #151515" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "Barlow, sans-serif", marginBottom: 2 }}>{food.item}</div>
                          <div style={{ fontSize: 12, color: "#555", fontFamily: "Barlow, sans-serif" }}>{food.amount}</div>
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 12, fontFamily: "monospace" }}>
                          <span style={{ color: "#E8FF00" }}>{food.p}p</span>
                          <span style={{ color: "#00E5FF" }}>{food.c}c</span>
                          <span style={{ color: "#FF6B35" }}>{food.f}f</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, paddingTop: 4 }}>
                      <div style={{ fontSize: 11, color: "#555", fontFamily: "Barlow, sans-serif", letterSpacing: 1, textTransform: "uppercase", marginRight: 8, alignSelf: "center" }}>MEAL TOTAL</div>
                      <span style={{ color: "#E8FF00", fontWeight: 700, fontFamily: "monospace" }}>{meal.totals?.p}p</span>
                      <span style={{ color: "#00E5FF", fontWeight: 700, fontFamily: "monospace" }}>{meal.totals?.c}c</span>
                      <span style={{ color: "#FF6B35", fontWeight: 700, fontFamily: "monospace" }}>{meal.totals?.f}f</span>
                    </div>
                  </div>
                ))}
                <div style={{ background: "#E8FF00", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#000", letterSpacing: 2, textTransform: "uppercase" }}>COMBO TOTAL</div>
                  <div style={{ display: "flex", gap: 20 }}>
                    {[["P", combos[activeCombo].grandTotals?.p, remaining.protein], ["C", combos[activeCombo].grandTotals?.c, remaining.carbs], ["F", combos[activeCombo].grandTotals?.f, remaining.fat]].map(([l, got, target]) => (
                      <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#000" }}>{got}<span style={{ fontSize: 11 }}>g</span></div>
                        <div style={{ fontSize: 10, color: "#000", opacity: 0.5, letterSpacing: 1 }}>{l} / {target}g</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button onClick={() => { setCombos(null); setStep(1); setFoods(""); setMacros({ protein: "", carbs: "", fat: "" }); setConsumed({ protein: "", carbs: "", fat: "" }); }}
              style={{ width: "100%", marginTop: 24, padding: "16px", background: "none", color: "#555", border: "1px solid #222", fontSize: 14, fontWeight: 600, letterSpacing: 3, cursor: "pointer", fontFamily: "'Barlow Condensed', sans-serif", textTransform: "uppercase" }}>
              START OVER
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
