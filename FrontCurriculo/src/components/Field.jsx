export default function Field({ label, erro, children }) {
  return (
    <label className={`field ${erro ? 'err' : ''}`}>
      <span className="lbl">{label}</span>
      {children}
      {erro && <span className="erro">{erro}</span>}
    </label>
  );
}
