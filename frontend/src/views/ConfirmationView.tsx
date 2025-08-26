import React from 'react';

interface ConfirmationViewProps {
    placeInQueue: number;
    waitTime?: number; // legacy raw queue.wait_time (unused if better data)
    initialEstimatedWait?: number; // snapshot from Join step to prevent shifting/doubling
    partySize?: number;
    lineNumber?: number;
    perLineSingle?: number[];
    perSpan?: Record<number, number>;
    onNewSignup?: () => void; // reset to new signup flow
}

const ConfirmationView: React.FC<ConfirmationViewProps> = ({ placeInQueue, waitTime, initialEstimatedWait, partySize = 1, lineNumber, perLineSingle, perSpan, onNewSignup }) => {
    // Priority: preserved initial estimate (authoritative for this user), else recompute like join view did, else fallback waitTime
    let detailedWait: number | undefined = initialEstimatedWait;
    if (detailedWait === undefined) {
        if (partySize === 1) {
            if (lineNumber !== undefined && perLineSingle && perLineSingle[lineNumber] !== undefined) {
                detailedWait = perLineSingle[lineNumber];
            } else if (perLineSingle && perLineSingle.length) {
                detailedWait = Math.min(...perLineSingle);
            }
        } else if (partySize > 1 && perSpan && perSpan[partySize] !== undefined) {
            detailedWait = perSpan[partySize];
        }
    }
    if (detailedWait === undefined) detailedWait = waitTime ?? 0;
    const arrivalTime = new Date(Date.now() + detailedWait * 60000).toLocaleTimeString();

    return (
        <div className="conf-wrapper">
            <div className="conf-panel">
                <h2 className="conf-title">You're in the Queue!</h2>
                <div className="conf-grid">
                    <div className="conf-item">
                        <span className="conf-label">Place</span>
                        <span className="conf-value conf-accent">{placeInQueue}</span>
                    </div>
                    <div className="conf-item">
                        <span className="conf-label">Party Size</span>
                        <span className="conf-value">{partySize}</span>
                    </div>
                    {lineNumber !== undefined && (
                        <div className="conf-item">
                            <span className="conf-label">Line</span>
                            <span className="conf-value">{lineNumber + 1}</span>
                        </div>
                    )}
                    <div className="conf-item wide">
                        <span className="conf-label">Estimated Wait</span>
                        <span className="conf-value">{detailedWait} min{detailedWait === 1 ? '' : 's'}</span>
                    </div>
                    <div className="conf-item wide">
                        <span className="conf-label">Approx. Time</span>
                        <span className="conf-value">{arrivalTime}</span>
                    </div>
                </div>
                {partySize > 1 && perSpan && (
                    <div className="conf-note">Spanning party estimate derived from optimal contiguous block availability.</div>
                )}
                <div className="conf-actions">
                    {onNewSignup && (
                        <button type="button" className="conf-new" onClick={onNewSignup}>NEW SIGN UP</button>
                    )}
                </div>
            </div>
            <style>{`
                .conf-wrapper { max-width:520px; margin:1.75rem auto; padding:0 1rem; font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif; }
                .conf-panel { background:#fff; border:1px solid #e2e6ea; border-radius:14px; padding:1.4rem 1.5rem 1.65rem; box-shadow:0 4px 14px -2px rgba(0,0,0,.07), 0 10px 28px -6px rgba(0,0,0,.05); }
                .conf-title { margin:0 0 1.1rem; font-size:1.55rem; font-weight:600; letter-spacing:.5px; color:#1d2b36; text-align:center; }
                .conf-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:.9rem .9rem; margin-bottom:.75rem; }
                .conf-item { background:linear-gradient(#f9fbfc,#f1f5f8); border:1px solid #d5dde2; padding:.65rem .7rem .7rem; border-radius:10px; position:relative; box-shadow:0 2px 6px -2px rgba(0,0,0,.06); }
                .conf-item.wide { grid-column:span 2; }
                @media (max-width:460px){ .conf-item.wide { grid-column:span 1; } }
                .conf-label { display:block; font-size:.63rem; text-transform:uppercase; letter-spacing:.09em; font-weight:600; color:#4f5e68; margin-bottom:.25rem; }
                .conf-value { font-size:1.05rem; font-weight:600; color:#1f2f38; letter-spacing:.5px; }
                .conf-accent { color:#1976d2; }
                .conf-note { font-size:.65rem; color:#5c6b74; margin-top:.35rem; text-align:center; line-height:1.3; }
                .conf-actions { margin-top:1.1rem; display:flex; justify-content:center; }
                .conf-new { background:#0d5cab; color:#fff; border:1px solid #0d5cab; font-weight:600; letter-spacing:.5px; padding:.75rem 1.25rem; border-radius:10px; cursor:pointer; box-shadow:0 4px 12px -2px rgba(13,92,171,.4); transition: background .22s, transform .18s, box-shadow .25s; }
                .conf-new:hover { background:#0b5299; }
                .conf-new:active { transform:translateY(1px); box-shadow:0 3px 9px -2px rgba(13,92,171,.55); }
            `}</style>
        </div>
    );
};

export default ConfirmationView;
