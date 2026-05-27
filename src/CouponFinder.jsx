import { useState, useRef, useEffect } from "react";

const STORE_SUGGESTIONS = [
  "Amazon", "Walmart", "Target", "eBay", "Home Depot", "Lowe's",
  "Best Buy", "Costco", "Chewy", "Nike", "Adidas", "Newegg",
  "Micro Center", "Harbor Freight", "AutoZone", "O'Reilly Auto",
  "REI", "Cabela's", "Bass Pro", "Brownells", "MidwayUSA",
  "Overstock", "Wayfair", "IKEA", "Staples", "Office Depot",
  "PetSmart", "Petco", "GameStop", "Steam", "Hatchbox", "Polymaker",
  "Matterhackers", "3DJake", "Paramount+", "Hulu", "DoorDash",
  "Grubhub", "Uber Eats", "Instacart"
];

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;

function CouponCard({ coupon, index }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (coupon.code) {
      navigator.clipboard.writeText(coupon.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        background: "#1a1a1a",
        border: "1px solid #2a2a2a",
        borderRadius: "6px",
        padding: "16px",
        animation: `fadeSlide 0.3s ease forwards`,
        animationDelay: `${index * 0.08}s`,
        opacity: 0,
        transform: "translateY(8px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
            {coupon.discount && (
              <span style={{
                background: "#f5a623",
                color: "#0f0f0f",
                padding: "2px 8px",
                borderRadius: "3px",
                fontFamily: "'Courier New', monospace",
                fontWeight: "bold",
                fontSize: "12px",
                whiteSpace: "nowrap",
              }}>
                {coupon.discount}
              </span>
            )}
            {coupon.verified && (
              <span style={{
                color: "#4ade80",
                fontSize: "11px",
                fontFamily: "'Courier New', monospace",
                letterSpacing: "0.5px",
              }}>
                ✓ VERIFIED
              </span>
            )}
            {coupon.expiry && (
              <span style={{
                color: "#666",
                fontSize: "11px",
                fontFamily: "'Courier New', monospace",
              }}>
                exp: {coupon.expiry}
              </span>
            )}
          </div>
          <p style={{
            color: "#ccc",
            fontFamily: "'Courier New', monospace",
            fontSize: "13px",
            margin: 0,
            lineHeight: "1.4",
          }}>
            {coupon.description}
          </p>
        </div>
        {coupon.code ? (
          <button
            onClick={handleCopy}
            style={{
              background: copied ? "#4ade80" : "#2a2a2a",
              border: `1px solid ${copied ? "#4ade80" : "#f5a623"}`,
              color: copied ? "#0f0f0f" : "#f5a623",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              fontFamily: "'Courier New', monospace",
              fontSize: "13px",
              fontWeight: "bold",
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
              minWidth: "110px",
              letterSpacing: "0.5px",
            }}
          >
            {copied ? "COPIED ✓" : coupon.code}
          </button>
        ) : (
          <span style={{
            color: "#666",
            fontFamily: "'Courier New', monospace",
            fontSize: "11px",
            padding: "8px 12px",
            border: "1px dashed #333",
            borderRadius: "4px",
            whiteSpace: "nowrap",
          }}>
            AUTO-APPLY
          </span>
        )}
      </div>
      {coupon.source && (
        <div style={{
          marginTop: "8px",
          paddingTop: "8px",
          borderTop: "1px solid #222",
          color: "#555",
          fontFamily: "'Courier New', monospace",
          fontSize: "10px",
          letterSpacing: "0.5px",
        }}>
          src: {coupon.source}
        </div>
      )}
    </div>
  );
}

export default function CouponFinder() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const abortRef = useRef(null);

  const filteredSuggestions = query.length > 0
    ? STORE_SUGGESTIONS.filter(s => s.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
    : STORE_SUGGESTIONS.slice(0, 8);

  useEffect(() => {
    const handleClick = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target) &&
          inputRef.current && !inputRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const cancelSearch = () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setLoading(false);
    setError(null);
  };

  const searchCoupons = async (storeName) => {
    const searchQuery = storeName || query;
    if (!searchQuery.trim()) return;

    if (!API_KEY) {
      setError("No API key configured. Add VITE_ANTHROPIC_API_KEY to your .env file.");
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResults(null);
    setShowSuggestions(false);

    if (!searchHistory.includes(searchQuery.trim())) {
      setSearchHistory(prev => [searchQuery.trim(), ...prev].slice(0, 5));
    }

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{
            role: "user",
            content: `Find current, working coupon codes and deals for "${searchQuery}".

Return ONLY a JSON array (no markdown, no backticks, no explanation) of coupon objects. Each object should have:
- "code": the promo code string (or null if it's an auto-apply deal)
- "discount": short discount description like "20% OFF" or "$10 OFF" or "FREE SHIPPING"
- "description": what the deal is, 1 sentence max
- "verified": true if the source confirms it works, false otherwise
- "expiry": expiration date if known, or null
- "source": where you found it (site name only)

Return up to 10 results. Prioritize codes that are confirmed working. Do NOT include referral/affiliate signup bonuses. Only real coupon codes and deals. If you can't find any, return an empty array [].`
          }],
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData?.error?.message || `API error ${response.status}`);
      }

      const data = await response.json();

      const textContent = data.content
        ?.filter(item => item.type === "text")
        ?.map(item => item.text)
        ?.join("") || "";

      const cleaned = textContent.replace(/```json|```/g, "").trim();

      try {
        const parsed = JSON.parse(cleaned);
        setResults({
          store: searchQuery,
          coupons: Array.isArray(parsed) ? parsed : [],
          timestamp: new Date().toLocaleTimeString(),
        });
      } catch {
        if (cleaned.includes("[]") || textContent.toLowerCase().includes("no coupon") || textContent.toLowerCase().includes("couldn't find")) {
          setResults({ store: searchQuery, coupons: [], timestamp: new Date().toLocaleTimeString() });
        } else {
          setError("Couldn't parse results. Try again.");
        }
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message || "Search failed — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") searchCoupons();
    if (e.key === "Escape") setShowSuggestions(false);
  };

  return (
    <div style={{
      background: "#0f0f0f",
      minHeight: "100vh",
      color: "#e0e0e0",
      fontFamily: "'Courier New', monospace",
    }}>
      <style>{`
        @keyframes fadeSlide {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(400%); }
        }
        input::placeholder { color: #555; }
        button:hover { filter: brightness(1.1); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0f0f0f; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "40px 20px 60px" }}>
        {/* Header */}
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "4px" }}>
            <h1 style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "#f5a623",
              margin: 0,
              letterSpacing: "2px",
            }}>
              COUPON_FINDER
            </h1>
            <span style={{ color: "#333", fontSize: "12px" }}>v1.0</span>
          </div>
          <p style={{ color: "#555", fontSize: "12px", margin: 0, letterSpacing: "1px" }}>
            NO ADS • NO REFERRALS • NO BULLSHIT
          </p>
        </div>

        {/* Search */}
        <div style={{ position: "relative", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <div style={{ flex: 1, position: "relative" }}>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                placeholder="store name..."
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#1a1a1a",
                  border: "1px solid #333",
                  borderRadius: "4px",
                  color: "#e0e0e0",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "14px",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocusCapture={(e) => e.target.style.borderColor = "#f5a623"}
                onBlurCapture={(e) => e.target.style.borderColor = "#333"}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#1a1a1a",
                    border: "1px solid #333",
                    borderTop: "none",
                    borderRadius: "0 0 4px 4px",
                    zIndex: 10,
                    maxHeight: "240px",
                    overflowY: "auto",
                  }}
                >
                  {filteredSuggestions.map((s) => (
                    <div
                      key={s}
                      onClick={() => { setQuery(s); setShowSuggestions(false); searchCoupons(s); }}
                      style={{
                        padding: "10px 16px",
                        cursor: "pointer",
                        fontSize: "13px",
                        color: "#aaa",
                        borderBottom: "1px solid #222",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.target.style.background = "#222"; e.target.style.color = "#f5a623"; }}
                      onMouseLeave={(e) => { e.target.style.background = "transparent"; e.target.style.color = "#aaa"; }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => searchCoupons()}
              disabled={loading || !query.trim()}
              style={{
                padding: "12px 24px",
                background: loading ? "#333" : "#f5a623",
                color: "#0f0f0f",
                border: "none",
                borderRadius: "4px",
                cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Courier New', monospace",
                fontSize: "13px",
                fontWeight: "bold",
                letterSpacing: "1px",
                transition: "all 0.2s",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "..." : "FIND"}
            </button>
          </div>
        </div>

        {/* Recent searches */}
        {searchHistory.length > 0 && !loading && (
          <div style={{ marginBottom: "24px", display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ color: "#444", fontSize: "11px", letterSpacing: "1px" }}>RECENT:</span>
            {searchHistory.map((h) => (
              <button
                key={h}
                onClick={() => { setQuery(h); searchCoupons(h); }}
                style={{
                  background: "transparent",
                  border: "1px solid #2a2a2a",
                  color: "#666",
                  padding: "4px 10px",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontFamily: "'Courier New', monospace",
                  fontSize: "11px",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.target.style.borderColor = "#f5a623"; e.target.style.color = "#f5a623"; }}
                onMouseLeave={(e) => { e.target.style.borderColor = "#2a2a2a"; e.target.style.color = "#666"; }}
              >
                {h}
              </button>
            ))}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <div style={{
              position: "relative",
              width: "100%",
              height: "3px",
              background: "#1a1a1a",
              borderRadius: "2px",
              overflow: "hidden",
              marginBottom: "16px",
            }}>
              <div style={{
                position: "absolute",
                width: "40%",
                height: "100%",
                background: "linear-gradient(90deg, transparent, #f5a623, transparent)",
                animation: "scanline 1.2s ease-in-out infinite",
              }} />
            </div>
            <p style={{ color: "#555", fontSize: "12px", letterSpacing: "1px", marginBottom: "16px" }}>
              SCANNING FOR CODES...
            </p>
            <button
              onClick={cancelSearch}
              style={{
                background: "transparent",
                border: "1px solid #444",
                color: "#666",
                padding: "6px 20px",
                borderRadius: "3px",
                cursor: "pointer",
                fontFamily: "'Courier New', monospace",
                fontSize: "11px",
                letterSpacing: "1px",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.target.style.borderColor = "#ff6b6b"; e.target.style.color = "#ff6b6b"; }}
              onMouseLeave={(e) => { e.target.style.borderColor = "#444"; e.target.style.color = "#666"; }}
            >
              CANCEL
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "#1a1a1a",
            border: "1px solid #662222",
            borderRadius: "6px",
            padding: "16px",
            color: "#ff6b6b",
            fontSize: "13px",
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {results && (
          <div>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: "16px",
              paddingBottom: "8px",
              borderBottom: "1px solid #1a1a1a",
            }}>
              <div>
                <span style={{ color: "#f5a623", fontSize: "14px", fontWeight: "bold" }}>
                  {results.store.toUpperCase()}
                </span>
                <span style={{ color: "#444", fontSize: "12px", marginLeft: "8px" }}>
                  {results.coupons.length} {results.coupons.length === 1 ? "result" : "results"}
                </span>
              </div>
              <span style={{ color: "#333", fontSize: "10px" }}>
                {results.timestamp}
              </span>
            </div>

            {results.coupons.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {results.coupons.map((coupon, i) => (
                  <CouponCard key={i} coupon={coupon} index={i} />
                ))}
              </div>
            ) : (
              <div style={{
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "6px",
                padding: "32px",
                textAlign: "center",
              }}>
                <p style={{ color: "#666", fontSize: "13px", margin: "0 0 8px" }}>
                  No codes found for {results.store}.
                </p>
                <p style={{ color: "#444", fontSize: "11px", margin: 0 }}>
                  Try the full store name or check back later.
                </p>
              </div>
            )}

            <div style={{
              marginTop: "16px",
              padding: "12px",
              background: "#141414",
              borderRadius: "4px",
              fontSize: "10px",
              color: "#444",
              letterSpacing: "0.5px",
              lineHeight: "1.5",
            }}>
              TIP: Codes are pulled live from the web. Try at checkout —
              some stores auto-apply the best available discount. Stack with
              store loyalty programs for max savings.
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && !results && !error && searchHistory.length === 0 && (
          <div style={{ padding: "48px 0", textAlign: "center" }}>
            <p style={{ color: "#333", fontSize: "13px", marginBottom: "16px" }}>
              Type a store name and hit FIND.
            </p>
            <div style={{ display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
              {["Amazon", "Harbor Freight", "eBay", "Target"].map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuery(s); searchCoupons(s); }}
                  style={{
                    background: "transparent",
                    border: "1px solid #222",
                    color: "#555",
                    padding: "6px 14px",
                    borderRadius: "3px",
                    cursor: "pointer",
                    fontFamily: "'Courier New', monospace",
                    fontSize: "12px",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.target.style.borderColor = "#f5a623"; e.target.style.color = "#f5a623"; }}
                  onMouseLeave={(e) => { e.target.style.borderColor = "#222"; e.target.style.color = "#555"; }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
