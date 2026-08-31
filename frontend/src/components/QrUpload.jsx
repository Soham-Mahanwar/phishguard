import { useRef, useState } from "react";

function authHeaders() {
  try {
    const token = localStorage.getItem("phishguard_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export default function QrUpload({ onResult }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  async function uploadFile(file) {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const resp = await fetch("/api/check-qr", {
        method: "POST",
        headers: { ...authHeaders() },
        body: formData,
      });
      if (!resp.ok) {
        const detail = await resp.json().catch(() => ({}));
        throw new Error(detail.detail || `Request failed (${resp.status})`);
      }
      const data = await resp.json();
      onResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  return (
    <div className="rounded-xl border border-navy-700 bg-navy-800/50 p-5">
      <h3 className="text-sm font-semibold text-slate-300 mb-3">Scan a QR Code</h3>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
          dragActive ? "border-blue-500 bg-blue-500/10" : "border-navy-600 hover:border-navy-500"
        }`}
      >
        <p className="text-slate-400 text-sm">
          {loading ? "Decoding & checking..." : "Drag & drop a QR code image, or click to upload"}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => uploadFile(e.target.files?.[0])}
        />
      </div>
      {error && (
        <div className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 px-3 py-2 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
