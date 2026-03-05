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
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#888", marginBottom: 4, fontFamily: "monospace", letterSpacing: 1 }}>
          <span>{label}</span>
          <span style={{ color }}>{val}g <span style={{ color: "#444" }}>/ {max}g</span></span>
        </div>
        <div style={{ height: 3, background: "#1a1a1a", borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 2, transition: "width 0.5s ease" }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "'Bebas Neue', Impact, sans-serif", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Barlow:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #CC2222; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.3s ease forwards; }
        button:hover { opacity: 0.88; }
      `}</style>

      <div style={{ width: "100%", borderBottom: "1px solid #1a1a1a", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: 560 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: 1, fontStyle: "italic", color: "#fff" }}>FRIEDMAN</span>
          <span style={{ fontWeight: 800, fontSize: 22, letterSpacing: 1, fontStyle: "italic", color: "#CC2222" }}>FIT</span>
        </div>
        <div style={{ color: "#444", fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontFamily: "Barlow, sans-serif" }}>Macro Meal Builder</div>
      </div>

      <div style={{ width: "100%", maxWidth: 560, padding: "32px 24px 80px" }} className="fade-in">

        {step === 1 && (
          <div>
            <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 0.95, marginBottom: 8, letterSpacing: -1, fontStyle: "italic" }}>
              WHAT ARE<br /><span style={{ color: "#CC2222" }}>YOUR MACROS?</span>
            </h1>
            <p style={{ color: "#555", fontSize: 14, fontFamily: "Barlow, sans-serif", marginBottom: 36 }}>Enter your daily targets, then what you've already hit.</p>

            {[{ label: "Daily Targets", state: macros, setter: setMacros, accent: "#CC2222" }, { label: "Already Consumed", state: consumed, setter: setConsumed, accent: "#333" }].map(({ label, state, setter, accent }) => (
              <div key={label} style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: accent === "#CC2222" ? "#CC2222" : "#555", marginBottom: 16, textTransform: "uppercase", fontFamily: "Barlow, sans-serif" }}>{label}</div>
                {[["protein", "Protein"], ["carbs", "Carbs"], ["fat", "Fat"]].map(([key, name]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", marginBottom: 12 }}>
                    <div style={{ width: 80, fontSize: 12, color: "#666", fontFamily: "Barlow, sans-serif", letterSpacing: 1, textTransform: "uppercase" }}>{name}</div>
                    <input type="number" value={state[key]} onChange={e => setter(s => ({ ...s, [key]: e.target.value }))} placeholder="0"
                      style={{ flex: 1, background: "#111", border: "none", borderBottom: `2px solid ${accent === "#CC2222" ? "#CC2222" : "#222"}`, color: "#fff", fontSize: 24, fontWeight: 700, padding: "10px 14px", fontFamily: "'Bebas Neue', sans-serif", outline: "none" }} />
                    <div style={{ marginLeft: 10, color: "#444", fontSize: 13, fontFamily: "Barlow, sans-serif" }}>g</div>
                  </div>
                ))}
              </div>
            ))}

            {(macros.protein || macros.carbs || macros.fat) && (
              <div style={{ background: "#111", borderLeft: "3px solid #CC2222", padding: "18px 20px", marginBottom: 32 }}>
                <div style={{ fontSize: 11, letterSpacing: 3, color: "#555", marginBottom: 16, textTransform: "uppercase", fontFamily: "Barlow, sans-serif" }}>Remaining to Hit</div>
                {macroBar("PROTEIN", remaining.protein, parseFloat(macros.protein) || 0, "#CC2222")}
                {macroBar("CARBS", remaining.carbs, parseFloat(macros.carbs) || 0, "#fff")}
                {macroBar("FAT", remaining.fat, parseFloat(macros.fat) || 0, "#888")}
              </div>
            )}

            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "#555", marginBottom: 16, textTransform: "uppercase", fontFamily: "Barlow, sans-serif" }}>Meals Remaining</div>
              <div style={{ display: "flex", gap: 10 }}>
                {[1, 2, 3].map(n => (
                  <button key={n} onClick={() => setMealCount(n)} style={{ flex: 1, padding: "14px 0", background: mealCount === n ? "#CC2222" : "#111", color: mealCount === n ? "#fff" : "#555", border: `1px solid ${mealCount === n ? "#CC2222" : "#1e1e1e"}`, fontSize: 18, fontWeight: 800, cursor: "pointer", fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2, fontStyle: "italic", transition: "all 0.15s" }}>
                    {n} {n === 1 ? "MEAL" : "MEALS"}
                  </button>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(2)} disabled={!macros.protein && !macros.carbs && !macros.fat}
              style={{ width: "100%", padding: "18px", background: "#CC2222", color: "#fff", border: "none", fontSize: 18, fontWeight: 800, letterSpacing: 3, cursor: "pointer", textTransform: "uppercase", fontStyle: "italic", opacity: (!macros.protein && !macros.carbs && !macros.fat) ? 0.3 : 1 }}>
              NEXT → SELECT FOODS
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#444", fontSize: 12, letterSpacing: 2, cursor: "pointer", marginBottom: 28, fontFamily: "Barlow, sans-serif", textTransform: "uppercase" }}>← BACK</button>
            <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 0.95, marginBottom: 8, fontStyle: "italic" }}>WHAT FOODS<br /><span style={{ color: "#CC2222" }}>DO YOU HAVE?</span></h1>
            <p style={{ color: "#555", fontSize: 14, fontFamily: "Barlow, sans-serif", marginBottom: 28 }}>e.g. "NY strip steak, jasmine rice, Greek yogurt, broccoli, Legion whey, berries"</p>

            <div style={{ background: "#111", borderLeft: "3px solid #CC2222", padding: "16px 20px", marginBottom: 28, display: "flex", gap: 28 }}>
              {[["P", remaining.protein, "#CC2222"], ["C", remaining.carbs, "#fff"], ["F", remaining.fat, "#888"]].map(([l, v, c]) => (
                <div key={l}><div style={{ fontSize: 10, color: "#444", letterSpacing: 2, fontFamily: "Barlow, sans-serif" }}>{l}</div><div style={{ fontSize: 26, fontWeight: 800, color: c, fontStyle: "italic" }}>{v}<span style={{ fontSize: 12, color: "#333" }}>g</span></div></div>
              ))}
              <div style={{ marginLeft: "auto", textAlign: "right" }}><div style={{ fontSize: 10, color: "#444", letterSpacing: 2, fontFamily: "Barlow, sans-serif" }}>MEALS</div><div style={{ fontSize: 26, fontWeight: 800, color: "#fff", fontStyle: "italic" }}>{mealCount}</div></div>
            </div>

            <textarea value={foods} onChange={e => setFoods(e.target.value)} placeholder="Type your available foods here..." rows={6}
              style={{ width: "100%", background: "#111", border: "none", borderBottom: "2px solid #CC2222", color: "#fff", fontSize: 16, padding: "16px", fontFamily: "Barlow, sans-serif", lineHeight: 1.6, resize: "none", marginBottom: 28, outline: "none" }} />

            <button onClick={generateMeals} disabled={!foods.trim() || loading}
              style={{ width: "100%", padding: "18px", background: loading ? "#1a1a1a" : "#CC2222", color: loading ? "#555" : "#fff", border: "none", fontSize: 18, fontWeight: 800, letterSpacing: 3, cursor: loading ? "not-allowed" : "pointer", textTransform: "uppercase", fontStyle: "italic", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {loading ? <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>◌</span> BUILDING YOUR MEALS...</> : "BUILD MY MEALS →"}
            </button>
            {error && <div style={{ color: "#ff4444", marginTop: 12, fontFamily: "Barlow, sans-serif", fontSize: 14 }}>{error}</div>}
          </div>
        )}

        {step === 3 && combos && (
          <div>
            <button onClick={() => setStep(2)} style={{ background: "none", border: "none", color: "#444", fontSize: 12, letterSpacing: 2, cursor: "pointer", marginBottom: 28, fontFamily: "Barlow, sans-serif", textTransform: "uppercase" }}>← REBUILD</button>
            <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 0.95, marginBottom: 8, fontStyle: "italic" }}>YOUR MEAL<br /><span style={{ color: "#CC2222" }}>OPTIONS</span></h1>
            <p style={{ color: "#555", fontSize: 14, fontFamily: "Barlow, sans-serif", marginBottom: 28 }}>3 combos built to hit your remaining macros.</p>

            <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
              {combos.map((_, i) => (
                <button key={i} onClick={() => setActiveCombo(i)}
                  style={{ flex: 1, padding: "12px 8px", background: activeCombo === i ? "#CC2222" : "#111", color: activeCombo === i ? "#fff" : "#555", border: `1px solid ${activeCombo === i ? "#CC2222" : "#1e1e1e"}`, fontSize: 14, fontWeight: 800, letterSpacing: 1, cursor: "pointer", fontFamily: "'Bebas Neue', sans-serif", textTransform: "uppercase", fontStyle: "italic", transition: "all 0.15s" }}>
                  OPT {String.fromCharCode(65 + i)}
                </button>
              ))}
            </div>

            {combos[activeCombo] && (
              <div>
                <div style={{ fontSize: 12, color: "#CC2222", letterSpacing: 2, marginBottom: 20, textTransform: "uppercase", fontFamily: "Barlow, sans-serif" }}>{combos[activeCombo].label}</div>
                {combos[activeCombo].meals?.map((meal, mi) => (
                  <div key={mi} style={{ background: "#0f0f0f", borderLeft: "3px solid #CC2222", padding: "20px", marginBottom: 16 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2, marginBottom: 16, color: "#fff", fontStyle: "italic" }}>{meal.name}</div>
                    {meal.foods?.map((food, fi) => (
                      <div key={fi} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid #151515" }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: "Barlow, sans-serif", marginBottom: 2, color: "#eee" }}>{food.item}</div>
                          <div style={{ fontSize: 12, color: "#444", fontFamily: "Barlow, sans-serif" }}>{food.amount}</div>
                        </div>
                        <div style={{ display: "flex", gap: 12, fontSize: 12, fontFamily: "monospace" }}>
                          <span style={{ color: "#CC2222" }}>{food.p}p</span>
                          <span style={{ color: "#fff" }}>{food.c}c</span>
                          <span style={{ color: "#888" }}>{food.f}f</span>
                        </div>
                      </div>
                    ))}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: 16, paddingTop: 4 }}>
                      <div style={{ fontSize: 11, color: "#444", fontFamily: "Barlow, sans-serif", letterSpacing: 1, textTransform: "uppercase", marginRight: 8, alignSelf: "center" }}>MEAL TOTAL</div>
                      <span style={{ color: "#CC2222", fontWeight: 700, fontFamily: "monospace" }}>{meal.totals?.p}p</span>
                      <span style={{ color: "#fff", fontWeight: 700, fontFamily: "monospace" }}>{meal.totals?.c}c</span>
                      <span style={{ color: "#888", fontWeight: 700, fontFamily: "monospace" }}>{meal.totals?.f}f</span>
                    </div>
                  </div>
                ))}
                <div style={{ background: "#CC2222", padding: "18px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: 2, textTransform: "uppercase", fontStyle: "italic" }}>COMBO TOTAL</div>
                  <div style={{ display: "flex", gap: 20 }}>
                    {[["P", combos[activeCombo].grandTotals?.p, remaining.protein], ["C", combos[activeCombo].grandTotals?.c, remaining.carbs], ["F", combos[activeCombo].grandTotals?.f, remaining.fat]].map(([l, got, target]) => (
                      <div key={l} style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", fontStyle: "italic" }}>{got}<span style={{ fontSize: 11 }}>g</span></div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 1 }}>{l} / {target}g</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <button onClick={() => { setCombos(null); setStep(1); setFoods(""); setMacros({ protein: "", carbs: "", fat: "" }); setConsumed({ protein: "", carbs: "", fat: "" }); }}
              style={{ width: "100%", marginTop: 24, padding: "16px", background: "none", color: "#444", border: "1px solid #1e1e1e", fontSize: 14, fontWeight: 600, letterSpacing: 3, cursor: "pointer", fontFamily: "'Bebas Neue', sans-serif", textTransform: "uppercase", fontStyle: "italic" }}>
              START OVER
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
