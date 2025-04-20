import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { Tooltip } from "react-tooltip";

export default function ChatHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [newPrompt, setNewPrompt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [regenerating, setRegenerating] = useState({});
  const router = useRouter();

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/openai/history");
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load history.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePromptSubmit(e) {
    e.preventDefault();
    if (!newPrompt.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:5000/openai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: newPrompt }),
      });

      const data = await res.json();
      const response = data.response;

      console.log(response);
      setHistory((prev) => [{ prompt: newPrompt, response }, ...prev]);
      setNewPrompt("");
    } catch (err) {
      console.error(err);
      setError("Failed to generate response.");
    } finally {
      setSubmitting(false);
    }
  }

  async function regenerateResponse(prompt, index) {
    setRegenerating((prev) => ({ ...prev, [index]: true }));
    try {
      const res = await fetch("http://localhost:5000/openai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const response = data.response;

      setHistory((prev) =>
        prev.map((item, i) => (i === index ? { ...item, response } : item))
      );
    } catch (err) {
      console.error(err);
      setError("Failed to regenerate response.");
    } finally {
      setRegenerating((prev) => ({ ...prev, [index]: false }));
    }
  }

  return (
    <div className="relative min-h-screen min-w-[200px] md:min-w-[800px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-6 px-4 sm:px-8 my-auto rounded-lg">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold tracking-tight">
            AI Personal Assistant
          </h1>
          <button
            onClick={() => router.push("/analytics")}
            className="text-sm font-medium bg-white/10 backdrop-blur px-4 py-2 rounded-lg hover:bg-white/20 transition"
          >
            📊 View Usage
          </button>
        </div>

        <div className="space-y-6 pb-32">
          {loading ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="flex flex-col space-y-3 animate-pulse">
                <div className="flex justify-end">
                  <div className="bg-blue-400/40 h-4 w-2/3 rounded-xl" />
                </div>
                <div className="flex justify-start">
                  <div className="bg-white/20 h-20 w-5/6 rounded-xl" />
                </div>
              </div>
            ))
          ) : error ? (
            <p className="text-red-400">{error}</p>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className="space-y-3">
                {/* User Prompt */}
                <div className="flex justify-end">
                  <div className="bg-blue-600 px-4 py-2 rounded-2xl max-w-[75%] shadow-md text-white">
                    {item.prompt}
                  </div>
                </div>

                {/* AI Response */}
                <div className="flex justify-start gap-2 items-start">
                  <div className="  bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl  shadow-md text-sm text-white whitespace-pre-wrap ">
                    {regenerating[idx] ? (
                      <div className="animate-pulse bg-white/20 h-20 w-full rounded-xl" />
                    ) : (
                      <ReactMarkdown>{item.response}</ReactMarkdown>
                    )}
                  </div>

                  <button
                    data-tooltip-id={`regen-tip-${idx}`}
                    className="text-sm opacity-70 hover:opacity-100 transition"
                    onClick={() => regenerateResponse(item.prompt, idx)}
                    disabled={regenerating[idx]}
                  >
                    🔄
                  </button>
                  <Tooltip
                    id={`regen-tip-${idx}`}
                    place="top"
                    content="Regenerate"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat Input (Sticky Bottom) */}
        <form
          onSubmit={handlePromptSubmit}
          className="fixed bottom-0 inset-x-0 bg-gray-800/80 backdrop-blur-lg border-t border-white/10 py-4 px-4 sm:px-8"
        >
          <div className="flex items-center gap-3 max-w-4xl mx-auto">
            <input
              value={newPrompt}
              onChange={(e) => setNewPrompt(e.target.value)}
              placeholder="Ask the AI anything..."
              className="flex-1 bg-white/10 text-white placeholder-white/60 px-4 py-3 rounded-xl focus:outline-none focus:ring focus:border-blue-400"
            />
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium transition"
            >
              {submitting ? "Sending..." : "Send"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
