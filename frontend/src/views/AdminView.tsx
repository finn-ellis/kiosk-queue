import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { removeFromQueue, getNext, checkAdminPassword } from '../api/api';
import { User } from '../api/api';
import { useQueue } from '../context/QueueContext';
// import './AdminView.css';

const AdminView: React.FC = () => {
    // Pull waitDetail so we can know TOTAL configured lines, not just those currently occupied
    const { queue: adminQueue, connectAdmin, waitDetail } = useQueue();
    const [error, setError] = useState<string | null>(null);
    const [password, setPassword] = useState<string | null>(null);

    useEffect(() => {
        if (!password) {
            const timer = setTimeout(() => {
                const pass = prompt("Enter admin password");
                if (pass) {
                    setPassword(pass);
                } else {
                    setError("Password is required to view this page.");
                }
            }, 500); // 500ms delay

            return () => clearTimeout(timer);
        } else {
            connectAdmin(password);

            const checkPassword = async () => {
                try {
                    await checkAdminPassword(password);
                    setError(null);
                } catch (error) {
                    console.error(error);
                    setError('Failed to fetch queue. Incorrect password?');
                }
            };
            checkPassword();
        }
    }, [password, connectAdmin]);

    const handleRemove = useCallback(async (userId: number) => {
        if (!password) return;
        try {
            await removeFromQueue(password, userId);
        } catch (error) {
            console.error(error);
            alert('Failed to remove user.');
        }
    }, [password]);

    const handleNext = useCallback(async (lineNumber: number) => {
        if (!password) return;
        try {
            await getNext(password, lineNumber);
        } catch (error) {
            console.error(error);
            alert('Failed to advance queue.');
        }
    }, [password]);

    // Stable display line count: never shrink once a higher count known.
    const [displayLineCount, setDisplayLineCount] = useState<number>(2);
    useEffect(() => {
        // From waitDetail authoritative count
        if (waitDetail?.per_line_single?.length) {
            setDisplayLineCount(prev => Math.max(prev, waitDetail.per_line_single.length));
        }
        // From observed queue line numbers (add 1 because zero-indexed). Ensures we expand if higher index appears.
        if (adminQueue.length) {
            const inferred = Math.max(...adminQueue.map(u => (u.line_number ?? 0))) + 1;
            setDisplayLineCount(prev => Math.max(prev, inferred));
        }
    }, [waitDetail, adminQueue]);

    // Build dynamic Next buttons: if a multi-line party (party_size>1) is at depth 1, show only one button for its starting line
    const nextButtons = useMemo(() => {
        const depthOneStarters: Record<number, User> = {};
        for (const u of adminQueue) {
            if (u.place_in_queue === 1) {
                depthOneStarters[u.line_number ?? 0] = u;
            }
        }
        const buttons: React.JSX.Element[] = [];
    for (let line = 0; line < displayLineCount; line++) {
            const starter = depthOneStarters[line];
            if (starter && starter.party_size > 1) {
                const span = Math.min(starter.party_size, displayLineCount - line);
                // Skip if this line is within a span already handled
                let alreadyHandled = false;
                for (let prev = 0; prev < line; prev++) {
                    const prevStarter = depthOneStarters[prev];
                    if (prevStarter && prevStarter.party_size > 1) {
                        const prevEnd = prev + prevStarter.party_size - 1;
                        if (prev <= line && line <= prevEnd) {
                            alreadyHandled = true;
                            break;
                        }
                    }
                }
                if (alreadyHandled) continue;
                const startIdx = line;
                buttons.push(
                    <button key={`next-span-${startIdx}`} onClick={() => handleNext(startIdx)} style={{ marginRight: 8 }}>
                        Next Lines {startIdx + 1}-{startIdx + span}
                    </button>
                );
                line += span - 1; // jump past span
            } else {
                const idx = line;
                buttons.push(
                    <button key={`next-line-${idx}`} onClick={() => handleNext(idx)} style={{ marginRight: 8 }}>
                        Next Line {idx + 1}
                    </button>
                );
            }
        }
        return buttons;
    }, [adminQueue, displayLineCount, handleNext]);


    // Construct table rows strictly by depth so parties at deeper depths never appear earlier.
    const tableRows = useMemo(() => {
        // Gather users grouped by depth (place_in_queue)
        const users = adminQueue.slice().sort((a, b) => a.place_in_queue - b.place_in_queue || (a.line_number ?? 0) - (b.line_number ?? 0));
        if (!users.length) return [] as React.JSX.Element[];
        const maxDepth = users[users.length - 1].place_in_queue;
        // Map for quick lookup by (depth, startLine)
        const depthLineMap = new Map<string, User>();
        users.forEach(u => {
            depthLineMap.set(`${u.place_in_queue}:${u.line_number ?? 0}`, u);
        });
        const rows: React.JSX.Element[] = [];
        for (let depth = 1; depth <= maxDepth; depth++) {
            const cells: React.JSX.Element[] = [];
            let col = 0;
            while (col < displayLineCount) {
                // Check if a user starts at this column with this depth
                const key = `${depth}:${col}`;
                const user = depthLineMap.get(key);
                if (user) {
                    const span = Math.min(user.party_size, displayLineCount - col);
                    cells.push(
                        <td key={`u-${user.id}`} colSpan={span} className="party">
                            <div className="party-cell">
                                <strong>{user.name}</strong> (#{user.place_in_queue}) PS:{user.party_size} Ln:{(user.line_number ?? 0) + 1} <br />
                                <small>{user.phone_number}</small>
                                <div className="actions">
                                    <button onClick={() => handleRemove(user.id)}>Remove</button>
                                </div>
                            </div>
                        </td>
                    );
                    col += span; // Skip spanned columns
                } else {
                    // Check if this column is covered by a spanning party starting earlier at this depth
                    let covered = false;
                    for (let start = col - 1; start >= 0; start--) {
                        const maybe = depthLineMap.get(`${depth}:${start}`);
                        if (maybe) {
                            const end = (maybe.line_number ?? 0) + maybe.party_size - 1;
                            if (end >= col) {
                                covered = true; // It's within a spanning cell already rendered
                            }
                            break;
                        }
                    }
                    if (!covered) {
                        cells.push(<td key={`e-${depth}-${col}`} className="empty" />);
                    }
                    col += 1;
                }
            }
            rows.push(<tr key={`row-depth-${depth}`}>{cells}</tr>);
        }
        return rows;
    }, [adminQueue, displayLineCount, handleRemove]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="admin-container">
            <h2 className="admin-title">Admin - Queue Management</h2>
            <p className="admin-sub">Columns represent lines. A party may span multiple adjacent columns equal to its party size if space available at that depth.</p>
            <div className="admin-controls">
                {nextButtons}
            </div>
            <div className="admin-table-wrapper">
                <table className="admin-table">
                    <thead>
                        <tr>
                            {Array.from({ length: displayLineCount }).map((_, i) => (
                                <th key={i}>Line {i + 1}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {tableRows}
                    </tbody>
                </table>
            </div>
            <style>{`
                .admin-container { max-width:980px; margin:1.25rem auto 2.5rem; padding:1.25rem 1.5rem 1.75rem; background:#ffffff; border:1px solid #e2e6ea; border-radius:14px; box-shadow:0 4px 14px -2px rgba(0,0,0,.08), 0 10px 28px -6px rgba(0,0,0,.06); font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,sans-serif; }
                .admin-title { margin:0 0 .35rem; font-size:1.6rem; font-weight:600; letter-spacing:.5px; color:#1d2b36; }
                .admin-sub { margin:.15rem 0 1.15rem; font-size:.8rem; line-height:1.4; color:#54636e; }
                .admin-controls { display:flex; flex-wrap:wrap; gap:.55rem; margin-bottom:1rem; }
                .admin-controls button { background:#1976d2; color:#fff; border:1px solid #1976d2; border-radius:9px; padding:.55rem .85rem; font-size:.75rem; font-weight:600; letter-spacing:.5px; cursor:pointer; box-shadow:0 3px 10px -2px rgba(25,118,210,.45); transition: background .22s, transform .18s, box-shadow .25s; }
                .admin-controls button:hover { background:#1669be; }
                .admin-controls button:active { transform:translateY(1px); box-shadow:0 2px 7px -1px rgba(25,118,210,.6); }
                .admin-table-wrapper { overflow-x:auto; border-radius:12px; border:1px solid #d6dde2; background:linear-gradient(#f9fbfc,#f3f6f8); padding:.5rem .65rem .9rem; }
                .admin-table { border-collapse:separate; border-spacing:0; width:100%; font-size:.78rem; }
                .admin-table thead th { position:sticky; top:0; background:#eef4f8; backdrop-filter:blur(4px); z-index:2; font-weight:600; letter-spacing:.06em; font-size:.7rem; color:#3b4a55; padding:.55rem .4rem; text-align:center; border-bottom:2px solid #c8d2d9; }
                .admin-table td, .admin-table th { border:1px solid #d1dae0; }
                .admin-table td { padding:.35rem .4rem; background:#fff; }
                .admin-table td.party { background:linear-gradient(#f0f8ff,#e1f1ff); position:relative; }
                .admin-table td.empty { background:#fafbfc; min-height:32px; height:32px; }
                .party-cell { display:flex; flex-direction:column; gap:2px; line-height:1.15; }
                .party-cell strong { font-size:.82rem; font-weight:600; color:#1f2f38; }
                .party-cell small { font-size:.65rem; color:#5b6a75; }
                .party-cell .actions { margin-top:.25rem; display:flex; gap:.4rem; }
                .party-cell .actions button { background:#d93025; border:1px solid #d93025; color:#fff; padding:.3rem .55rem; border-radius:6px; font-size:.6rem; font-weight:600; letter-spacing:.5px; box-shadow:0 2px 6px -1px rgba(217,48,37,.45); }
                .party-cell .actions button:hover { background:#c6281f; }
                .party-cell .actions button:active { transform:translateY(1px); }
                .admin-table tr:first-of-type td { border-top:1px solid #d1dae0; }
                .admin-table th:first-child { border-top-left-radius:10px; }
                .admin-table th:last-child { border-top-right-radius:10px; }
                .admin-table tr:last-child td:first-child { border-bottom-left-radius:10px; }
                .admin-table tr:last-child td:last-child { border-bottom-right-radius:10px; }
                @media (max-width:1050px){ .admin-container { margin:1rem .75rem 2rem; padding:1rem 1.1rem 1.4rem; } .admin-title { font-size:1.35rem; } }
            `}</style>
        </div>
    );
};

export default AdminView;
