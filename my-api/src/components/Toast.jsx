 export default function Toast({ notice }) {
    if (!notice) return null;
    return <div className={`toast toast-${notice.type}`} role="status">{notice.text}</div>;
}
