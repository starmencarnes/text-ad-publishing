import { useEffect, useMemo, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";

const ALL_MARKETS = [
  "GVLtoday","CHStoday","COLAtoday","NOOGAtoday","ATXtoday","DALtoday","SATXtoday",
  "KCtoday","SEAtoday","PDXtoday","608today","BOStoday","CBUStoday","SJtoday",
  "SACtoday","SDtoday","865today","ORLtoday"
];

export default function Home() {
  const [selectedMarkets, setSelectedMarkets] = useState([]);
  const [clientQuery, setClientQuery] = useState("");
  const [clientOptions, setClientOptions] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ bold: true, italic: true, strike: true }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true, protocols: ["http","https","mailto"] }),
      Placeholder.configure({ placeholder: "Write the ad copy here…" }),
    ],
    content: "",
    editorProps: { attributes: { class: "editor" } },
  });

  const html = useMemo(() => editor?.getHTML() ?? "", [editor, editor?.state]);

  function toggle(cmd) {
    if (!editor) return;
    editor.chain().focus()[cmd]().run();
  }

  function applyLink() {
    if (!editor) return;
    if (!linkUrl) editor.chain().focus().unsetLink().run();
    else editor.chain().focus().setLink({ href: linkUrl }).run();
  }

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await fetch("/api/clients?q=" + encodeURIComponent(clientQuery || ""));
      const data = await res.json();
      if (alive) setClientOptions(data);
    })();
    return () => { alive = false; };
  }, [clientQuery]);

  const isValid =
    html.replace(/<p>\\s*<br\\/?><\\/p>/g, "").trim().length > 0 &&
    selectedMarkets.length > 0 &&
    selectedClient &&
    date;

  async function onSubmit() {
    if (!isValid) return;
    setSubmitting(true);
    try {
      const payload = {
        html,
        markets: selectedMarkets,
        client: selectedClient,
        date, // yyyy-mm-dd
      };
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify(payload),
      });
      const out = await res.json();
      alert("Submitted! (Echo):\\n" + JSON.stringify(out, null, 2));
      // reset
      editor?.commands.clearContent();
      setSelectedMarkets([]);
      setSelectedClient(null);
      setClientQuery("");
      setDate("");
      setLinkUrl("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.wrap}>
      <h1 style={{marginBottom:8}}>Writers Intake</h1>
      <p style={{marginTop:0, color:"#666"}}>Rich text + markets + client + date</p>

      <div style={styles.card}>
        <div style={styles.toolbar}>
          <button onClick={() => toggle("toggleBold")} style={styles.btn}><b>B</b></button>
          <button onClick={() => toggle("toggleItalic")} style={styles.btn}><i>I</i></button>
          <button onClick={() => toggle("toggleUnderline")} style={styles.btn}><span style={{textDecoration:"underline"}}>U</span></button>
          <button onClick={() => toggle("toggleStrike")} style={styles.btn}><span style={{textDecoration:"line-through"}}>S</span></button>
          <input
            placeholder="https://link…"
            value={linkUrl}
            onChange={e=>setLinkUrl(e.target.value)}
            style={{...styles.input, width:220}}
          />
          <button onClick={applyLink} style={styles.btn}>Apply link</button>
        </div>
        <div style={styles.editorShell}>
          <EditorContent editor={editor} />
        </div>
      </div>

      <div style={styles.grid}>
        <div style={styles.card}>
          <div style={styles.cardTitle}>Markets</div>
          <div style={{maxHeight:180, overflow:"auto", padding:"4px 0"}}>
            {ALL_MARKETS.map(m => {
              const checked = selectedMarkets.includes(m);
              return (
                <label key={m} style={{display:"flex", alignItems:"center", gap:8, fontSize:14, margin:"4px 0"}}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e)=>{
                      setSelectedMarkets(prev => e.target.checked ? [...prev, m] : prev.filter(x=>x!==m));
                    }}
                  />
                  {m}
                </label>
              );
            })}
          </div>
          {selectedMarkets.length>0 && (
            <div style={{marginTop:8, fontSize:12, color:"#666"}}>{selectedMarkets.length} selected</div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Client</div>
          <input
            placeholder="Search client…"
            value={clientQuery}
            onChange={(e)=>setClientQuery(e.target.value)}
            style={styles.input}
          />
          <div style={{maxHeight:180, overflow:"auto", border:"1px solid #eee", borderRadius:8}}>
            {clientOptions.length===0 ? (
              <div style={{padding:8, fontSize:13, color:"#888"}}>No matches</div>
            ) : clientOptions.map(c => (
              <button
                key={c.id}
                onClick={()=>{ setSelectedClient(c); setClientQuery(c.name); }}
                style={{
                  display:"block", width:"100%", textAlign:"left", padding:8, fontSize:14,
                  background: selectedClient?.id===c.id ? "#f5f5f5" : "transparent", border:"none", cursor:"pointer"
                }}
              >
                {c.name}
              </button>
            ))}
          </div>
          {selectedClient && (
            <div style={{marginTop:8, fontSize:12, color:"#666"}}>Selected: <b>{selectedClient.name}</b></div>
          )}
        </div>

        <div style={styles.card}>
          <div style={styles.cardTitle}>Publish Date</div>
          <input
            type="date"
            value={date}
            onChange={(e)=>setDate(e.target.value)}
            style={styles.input}
          />
          <div style={{marginTop:8, fontSize:12, color:"#666"}}>{date || "—"}</div>
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.cardTitle}>Preview</div>
        <div
          style={styles.preview}
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
          <button
            onClick={()=>{ navigator.clipboard.writeText(html); alert("HTML copied."); }}
            style={styles.btn}
            disabled={!html}
          >
            Copy HTML
          </button>
          <button onClick={onSubmit} style={styles.primaryBtn} disabled={!isValid || submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>

      <style>{`
        .editor {
          min-height: 180px;
          padding: 12px;
          outline: none;
        }
        .editor p { margin: 0 0 0.6rem 0; }
        .editor a { color: #0a66c2; text-decoration: underline; }
      `}</style>
    </div>
  );
}

const styles = {
  wrap: { maxWidth: 900, margin: "24px auto", padding: "0 16px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" },
  card: { border: "1px solid #eee", borderRadius: 12, padding: 16, margin: "12px 0", background:"#fff" },
  toolbar: { display:"flex", gap:8, flexWrap:"wrap", marginBottom:8 },
  btn: { border:"1px solid #ddd", padding:"6px 10px", borderRadius:8, background:"#fafafa", cursor:"pointer" },
  primaryBtn: { border:"1px solid #0a66c2", padding:"8px 14px", borderRadius:8, background:"#0a66c2", color:"#fff", cursor:"pointer" },
  input: { width:"100%", padding:"8px 10px", border:"1px solid #ddd", borderRadius:8 },
  editorShell: { border:"1px solid #eee", borderRadius:12, background:"#fff" },
  grid: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 },
  cardTitle: { fontWeight:600, marginBottom:8 },
  preview: { border:"1px solid #eee", borderRadius:12, padding:12, minHeight:60, background:"#fff" }
};
