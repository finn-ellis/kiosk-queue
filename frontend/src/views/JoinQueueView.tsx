import React, { useState, useMemo, useEffect, useRef } from 'react';
import { joinQueue } from '../api/api';
import { useQueue } from '../context/QueueContext';

interface JoinQueueViewProps {
    onJoinSuccess: (data: { place_in_queue: number, wait_time: number, line_number: number, party_size: number, initial_estimated_wait?: number }) => void;
    lineNumber?: number;
    preselectedPartySize?: number;
    onBack?: () => void;
}

const JoinQueueView: React.FC<JoinQueueViewProps> = ({ onJoinSuccess, lineNumber, preselectedPartySize = 1, onBack }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [partySize, setPartySize] = useState(preselectedPartySize);
    const [error, setError] = useState('');
    const { waitDetail, queue } = useQueue();

    // Update party size when preselected value changes
    useEffect(() => {
        setPartySize(preselectedPartySize);
    }, [preselectedPartySize]);

    // Base estimated wait in minutes (recomputed when queue/waitDetail changes)
    const baseEstimatedWait = useMemo(() => {
        if (!waitDetail) return undefined;
        if (partySize === 1) {
            // Reconstruct earliest free depth per line from current queue to detect holes
            if (queue && queue.length) {
                const lineCount = waitDetail.per_line_single.length || 2;
                const occ: Record<number, Set<number>> = {};
                for (let i = 0; i < lineCount; i++) occ[i] = new Set();
                queue.forEach(u => {
                    if (u.line_number === undefined || u.place_in_queue === undefined || u.party_size === undefined) return;
                    for (let ln = u.line_number; ln < u.line_number + (u.party_size || 1); ln++) {
                        if (ln in occ) occ[ln].add(u.place_in_queue);
                    }
                });
                const earliestFree: number[] = [];
                for (let ln = 0; ln < lineCount; ln++) {
                    let d = 1;
                    while (occ[ln].has(d)) d++;
                    earliestFree.push(d);
                }
                // Translate earliest free depth -> minutes using proportion of provided per_line_single estimate (which corresponds to earliestFree for that line)
                // If a line has a hole at depth 1 its per_line_single already accounts for that; so just use per_line_single.
                if (lineNumber !== undefined && waitDetail.per_line_single[lineNumber] !== undefined) {
                    return waitDetail.per_line_single[lineNumber];
                }
                if (waitDetail.per_line_single.length) {
                    return Math.min(...waitDetail.per_line_single);
                }
            } else {
                if (lineNumber !== undefined && waitDetail.per_line_single[lineNumber] !== undefined) {
                    return waitDetail.per_line_single[lineNumber];
                }
                if (waitDetail.per_line_single.length) {
                    return Math.min(...waitDetail.per_line_single);
                }
            }
            return undefined;
        }
        return waitDetail.per_span[partySize];
    }, [waitDetail, partySize, lineNumber, queue]);

    // Live countdown state derived from base estimate
    const [displayWait, setDisplayWait] = useState<number | undefined>(baseEstimatedWait);
    const baseRef = useRef<number | undefined>(baseEstimatedWait);
    const startRef = useRef<number | null>(null);

    // When base estimate changes (due to queue update or party size change) reset countdown
    useEffect(() => {
        if (baseEstimatedWait === undefined) {
            setDisplayWait(undefined);
            baseRef.current = undefined;
            startRef.current = null;
            return;
        }
        baseRef.current = baseEstimatedWait;
        startRef.current = Date.now();
        setDisplayWait(baseEstimatedWait);
    }, [baseEstimatedWait]);

    // Interval to decrement displayed wait every 30s based on elapsed time
    useEffect(() => {
        if (baseRef.current === undefined) return;
        const tick = () => {
            if (baseRef.current === undefined || startRef.current === null) return;
            const elapsedMs = Date.now() - startRef.current;
            const elapsedMinutes = Math.floor(elapsedMs / 60000); // whole minutes elapsed
            const remaining = baseRef.current - elapsedMinutes;
            setDisplayWait(remaining > 0 ? remaining : 0);
        };
        const id = setInterval(tick, 30000); // update every 30s
        // Also run an initial small timeout to show first decrement near minute boundary
        const sync = setTimeout(tick, 5000);
        return () => { clearInterval(id); clearTimeout(sync); };
    }, [baseEstimatedWait]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            setError('Name is required');
            return;
        }
        try {
            const data = await joinQueue(name, email, partySize, lineNumber);
            onJoinSuccess({ ...data, party_size: partySize, line_number: data.line_number, initial_estimated_wait: baseEstimatedWait });
        } catch (err) {
            setError('Failed to join queue. Please try again.');
            console.error(err);
        }
    };

    return (
        <div className="jq-container">
            {onBack && (
                <button type="button" className="jq-back-btn" onClick={onBack}>
                    ← Back to Player Count
                </button>
            )}
            <h2 className="jq-title">Join the Queue</h2>
            {preselectedPartySize && (
                <div className="jq-party-display">
                    Selected Players: <strong>{preselectedPartySize}</strong>
                </div>
            )}
            {error && <p className="jq-error" role="alert">{error}</p>}
            <form onSubmit={handleSubmit} className="jq-form">
                <div className="jq-field">
                    <label className="jq-label">Name<span className="jq-required">*</span></label>
                    <input className="jq-input" type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" />
                </div>
                <div className="jq-field">
                    <label className="jq-label">Email <span className="jq-optional">(optional)</span></label>
                    <input className="jq-input" type="tel" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="###-###-####" />
                </div>
                {!preselectedPartySize && (
                    <div className="jq-field">
                        <label className="jq-label">Party Size</label>
                        <div className="jq-party-buttons" role="radiogroup" aria-label="Party Size">
                            {[1, 2].map(size => {
                                const selected = partySize === size;
                                return (
                                    <button
                                        key={size}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        onClick={() => setPartySize(size)}
                                        className={`jq-party-btn ${selected ? 'selected' : ''}`}
                                    >
                                        {size}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
                <div className="jq-estimate">
                    {displayWait !== undefined ? (
                        <span>Estimated Wait: <strong>{displayWait}</strong> min{displayWait === 1 ? '' : 's'} {partySize === 1 && lineNumber === undefined && waitDetail?.per_line_single?.length ? '(best line)' : ''}</span>
                    ) : (
                        <span className="jq-fade">Estimating wait time...</span>
                    )}
                </div>
                <button type="submit" className="jq-submit">Reserve</button>
            </form>
            <style>{`
                .jq-container { max-width:420px; margin:1.5rem auto; padding:1.5rem 1.75rem; background:#fff; border:1px solid #e2e6ea; border-radius:12px; box-shadow:0 4px 12px -2px rgba(0,0,0,0.08); font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif; position:relative; }
                .jq-back-btn { position:absolute; top:1rem; left:1rem; background:none; border:1px solid #c9d2d9; padding:0.5rem 0.75rem; border-radius:6px; cursor:pointer; font-size:0.85rem; color:#43525c; transition:all 0.2s; }
                .jq-back-btn:hover { border-color:#1976d2; color:#1976d2; }
                .jq-party-display { text-align:center; margin-bottom:1rem; padding:0.75rem; background:#f8f9fa; border-radius:8px; font-size:0.9rem; color:#43525c; }
                .jq-title { margin:0 0 0.75rem; font-size:1.5rem; font-weight:600; letter-spacing:.5px; color:#1d2b36; text-align:center; }
                .jq-error { background:#ffe5e5; border:1px solid #ffb3b3; padding:.5rem .75rem; border-radius:6px; font-size:.85rem; color:#b00020; }
                .jq-form { display:flex; flex-direction:column; gap:1rem; }
                .jq-field { display:flex; flex-direction:column; gap:.35rem; }
                .jq-label { font-size:.8rem; text-transform:uppercase; letter-spacing:.08em; font-weight:600; color:#43525c; }
                .jq-required { color:#d93025; margin-left:.15rem; }
                .jq-optional { font-weight:400; font-size:.7rem; color:#6c7a80; }
                .jq-input { padding:.65rem .75rem; border:1px solid #c9d2d9; border-radius:8px; font-size:.95rem; transition:border-color .18s, box-shadow .18s; }
                .jq-input:focus { outline:none; border-color:#1976d2; box-shadow:0 0 0 3px rgba(25,118,210,.25); }
                .jq-party-buttons { display:flex; gap:.6rem; }
                .jq-party-btn { flex:1; padding:.75rem 0; font-size:1rem; border:1px solid #b6c2cc; background:linear-gradient(#fdfdfd,#f3f6f8); color:#2c3a43; border-radius:10px; cursor:pointer; font-weight:500; letter-spacing:.5px; position:relative; transition: all .22s ease; }
                .jq-party-btn:hover { border-color:#1976d2; color:#1976d2; }
                .jq-party-btn.selected { background:#1976d2; color:#fff; border-color:#1976d2; font-weight:600; box-shadow:0 3px 10px -2px rgba(25,118,210,.45); }
                .jq-party-btn.selected::after { content:""; position:absolute; inset:0; border-radius:10px; box-shadow:0 0 0 2px #1976d2, 0 0 0 6px rgba(25,118,210,.25); pointer-events:none; }
                .jq-estimate { margin-top:.5rem; font-size:.85rem; color:#2f3d45; min-height:1.1rem; }
                .jq-fade { opacity:.65; }
                .jq-submit { margin-top:.5rem; padding:.85rem 1.2rem; background:#0d5cab; color:#fff; border:none; border-radius:10px; font-size:1rem; font-weight:600; letter-spacing:.5px; cursor:pointer; box-shadow:0 4px 12px -2px rgba(13,92,171,.4); transition: background .22s, transform .18s, box-shadow .25s; }
                .jq-submit:hover { background:#0b5299; }
                .jq-submit:active { transform:translateY(1px); box-shadow:0 3px 9px -2px rgba(13,92,171,.55); }
                @media (max-width:520px){ .jq-container { margin:1rem .75rem; padding:1.25rem 1.1rem; } }
            `}</style>
        </div>
    );
};

export default JoinQueueView;
