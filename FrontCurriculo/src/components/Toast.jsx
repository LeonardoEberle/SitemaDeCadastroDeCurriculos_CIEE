export default function Toast({ msg, tipo }) {
  if (!msg) return null;
  return (
    <div className={`toast ${tipo || 'info'}`}>
      <span>{msg}</span>
    </div>
  );
}
