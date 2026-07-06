import { useRef, useState } from "react";
import { GameShell, GameTopbar, GameAuth, useGameSounds } from "@freegamestore/games";

type SoundsApi = ReturnType<typeof useGameSounds>;

function AudioBridge({ apiRef }: { apiRef: React.MutableRefObject<SoundsApi | null> }) {
  const sounds = useGameSounds();
  apiRef.current = sounds;
  return null;
}

const DOTS: Record<number, [number, number][]> = {
  1: [[0.5, 0.5]],
  2: [[0.25, 0.25], [0.75, 0.75]],
  3: [[0.25, 0.25], [0.5, 0.5], [0.75, 0.75]],
  4: [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]],
  5: [[0.25, 0.25], [0.75, 0.25], [0.5, 0.5], [0.25, 0.75], [0.75, 0.75]],
  6: [
    [0.25, 0.2], [0.75, 0.2],
    [0.25, 0.5], [0.75, 0.5],
    [0.25, 0.8], [0.75, 0.8],
  ],
};

function Die({ value, rolling }: { value: number; rolling: boolean }) {
  const size = 84;
  return (
    <div
      style={{
        width: size,
        height: size,
        border: "1px solid var(--line-strong)",
        borderRadius: "0.85rem",
        background: "var(--paper)",
        position: "relative",
        transition: "transform 0.6s cubic-bezier(.2,.8,.4,1)",
        transform: rolling ? `rotate(${value * 60}deg) scale(0.92)` : "rotate(0)",
      }}
      aria-label={`${value}`}
    >
      {DOTS[value]!.map(([x, y], i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "var(--ink)",
            left: x * size - 6,
            top: y * size - 6,
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [count, setCount] = useState(2);
  const [values, setValues] = useState<number[]>([1, 1]);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const audioRef = useRef<SoundsApi | null>(null);

  function roll() {
    if (rolling) return;
    setRolling(true);
    audioRef.current?.playDrop();
    // Animate by re-rolling rapidly, then settling on a final value.
    let ticks = 0;
    const id = window.setInterval(() => {
      setValues(Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 6)));
      ticks++;
      if (ticks >= 8) {
        window.clearInterval(id);
        const final = Array.from({ length: count }, () => 1 + Math.floor(Math.random() * 6));
        setValues(final);
        const total = final.reduce((a, b) => a + b, 0);
        setHistory((prev) => [total, ...prev].slice(0, 10));
        setRolling(false);
        // "High" result: at or above 80% of the theoretical max (6 * count).
        if (total >= Math.ceil(count * 6 * 0.8)) {
          audioRef.current?.playScore();
        }
      }
    }, 60);
  }

  function setN(n: number) {
    setCount(n);
    setValues(Array.from({ length: n }, () => 1));
    setHistory([]);
  }

  const sum = values.reduce((a, b) => a + b, 0);

  return (
    <GameShell topbar={<GameTopbar title="Dice" score={sum} actions={<GameAuth />} rules={<div><h3 style={{fontWeight:700}}>Dice</h3><h4 style={{fontWeight:600}}>How to Play</h4><ul><li>Choose 1-6 dice</li><li>Tap Roll to throw</li></ul><h4 style={{fontWeight:600}}>Results</h4><ul><li>Shows each die value</li><li>Displays the total sum</li></ul></div>} />}>
      <AudioBridge apiRef={audioRef} />
      <div className="relative w-full h-full">
        <div style={{ maxWidth: "560px", margin: "0 auto", padding: "1.5rem 0", textAlign: "center" }}>
          <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
            Tap to roll. Pick how many dice (1-6).
          </p>

          <div style={{ display: "flex", gap: "0.4rem", justifyContent: "center", marginBottom: "1.75rem" }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setN(n)}
                disabled={rolling}
                style={{
                  padding: "0.4rem 0.7rem",
                  minHeight: "2.75rem",
                  minWidth: "2.75rem",
                  border: "1px solid var(--line)",
                  borderRadius: "0.5rem",
                  background: count === n ? "var(--accent)" : "transparent",
                  color: count === n ? "white" : "var(--ink)",
                  fontFamily: "inherit",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: rolling ? "wait" : "pointer",
                }}
              >
                {n}
              </button>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: "0.85rem",
              justifyContent: "center",
              flexWrap: "wrap",
              marginBottom: "1.75rem",
            }}
          >
            {values.map((v, i) => (
              <Die key={i} value={v} rolling={rolling}
          />
            ))}
          </div>

          <button
            type="button"
            onClick={roll}
            disabled={rolling}
            style={{
              background: "var(--accent)",
              color: "white",
              border: 0,
              padding: "0.85rem 2.5rem",
              borderRadius: "0.75rem",
              fontFamily: "inherit",
              fontWeight: 700,
              fontSize: "1rem",
              cursor: rolling ? "wait" : "pointer",
            }}
          >
            {rolling ? "Rolling…" : "Roll"}
          </button>

          <p
            style={{
              marginTop: "1.5rem",
              fontFamily: "Fraunces, serif",
              fontSize: "1.4rem",
              fontWeight: 700,
            }}
          >
            Sum: {sum}
          </p>

          {history.length > 0 && (
            <div style={{ marginTop: "2rem" }}>
              <p
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--muted)",
                  marginBottom: "0.5rem",
                }}
              >
                Recent rolls
              </p>
              <p
                style={{
                  color: "var(--muted)",
                  fontFamily: "ui-monospace, SF Mono, Menlo, monospace",
                  fontSize: "0.95rem",
                  letterSpacing: "0.15em",
                }}
              >
                {history.join(" · ")}
              </p>
            </div>
          )}
        </div>
      </div>
    </GameShell>
  );
}
