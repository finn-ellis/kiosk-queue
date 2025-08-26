import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { removeFromQueue, getNext, checkAdminPassword } from '../api/api';
import { User } from '../api/api';
import { useQueue } from '../context/QueueContext';

const AdminView: React.FC = () => {
    const { queue: adminQueue, connectAdmin } = useQueue();
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

    // Derive line count (columns) dynamically from queue (fallback to 2)
    const lineCount = useMemo(() => {
        if (!adminQueue.length) return 2; // sensible default
        return Math.max(...adminQueue.map(u => (u.line_number ?? 0))) + 1;
    }, [adminQueue]);

    // Build dynamic Next buttons: if a multi-line party (party_size>1) is at depth 1, show only one button for its starting line
    const nextButtons = useMemo(() => {
        const depthOneStarters: Record<number, User> = {};
        for (const u of adminQueue) {
            if (u.place_in_queue === 1) {
                depthOneStarters[u.line_number ?? 0] = u;
            }
        }
        const buttons: JSX.Element[] = [];
        for (let line = 0; line < lineCount; line++) {
            const starter = depthOneStarters[line];
            if (starter && starter.party_size > 1) {
                const span = Math.min(starter.party_size, lineCount - line);
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
    }, [adminQueue, lineCount, handleNext]);


    // Construct table rows strictly by depth so parties at deeper depths never appear earlier.
    const tableRows = useMemo(() => {
        // Gather users grouped by depth (place_in_queue)
        const users = adminQueue.slice().sort((a, b) => a.place_in_queue - b.place_in_queue || (a.line_number ?? 0) - (b.line_number ?? 0));
        if (!users.length) return [] as JSX.Element[];
        const maxDepth = users[users.length - 1].place_in_queue;
        // Map for quick lookup by (depth, startLine)
        const depthLineMap = new Map<string, User>();
        users.forEach(u => {
            depthLineMap.set(`${u.place_in_queue}:${u.line_number ?? 0}`, u);
        });
        const rows: JSX.Element[] = [];
        for (let depth = 1; depth <= maxDepth; depth++) {
            const cells: JSX.Element[] = [];
            let col = 0;
            while (col < lineCount) {
                // Check if a user starts at this column with this depth
                const key = `${depth}:${col}`;
                const user = depthLineMap.get(key);
                if (user) {
                    const span = Math.min(user.party_size, lineCount - col);
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
    }, [adminQueue, lineCount, handleRemove]);

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div className="admin-view">
            <h2>Admin - Queue Management</h2>
            <p>Columns represent lines. A party may span multiple adjacent columns equal to its party size if space available at that depth.</p>
            <div className="controls" style={{ marginBottom: '0.75rem' }}>
                {nextButtons}
            </div>
            <table className="queue-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                    <tr>
                        {Array.from({ length: lineCount }).map((_, i) => (
                            <th key={i} style={{ border: '1px solid #ccc', padding: '4px', textAlign: 'center' }}>Line {i + 1}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {tableRows}
                </tbody>
            </table>
            <style>{`
                .queue-table td, .queue-table th { border: 1px solid #ccc; padding: 4px; }
                .queue-table td.party { background:#f5faff; position:relative; }
                .party-cell { display:flex; flex-direction:column; gap:2px; font-size:0.8rem; }
                .party-cell .actions { display:flex; gap:4px; }
                .queue-table td.empty { background:#fafafa; height:32px; }
                button { cursor:pointer; }
            `}</style>
        </div>
    );
};

export default AdminView;
