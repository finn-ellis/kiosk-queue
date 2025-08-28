import React, { useEffect, useState, useMemo } from 'react';
import { useQueue } from '../context/QueueContext';
import { User } from '../api/api';
// import './NextUpView.css';
import { useParams } from 'react-router-dom';

const NextUpView: React.FC = () => {
    const { lineNumber } = useParams<{ lineNumber?: string }>();
    const { queue } = useQueue();
    const [frontParties, setFrontParties] = useState<User[]>([]);

    // Build distinct front parties (depth/place_in_queue === 1) honoring spans so one spanning party appears once.
    const computeFront = useMemo(() => {
        const sorted = queue
            .filter(u => u.place_in_queue === 1)
            .sort((a, b) => (a.line_number ?? 0) - (b.line_number ?? 0));
        const distinct: User[] = [];
        let coveredUntil = -1;
        for (const u of sorted) {
            const start = u.line_number ?? 0;
            if (start <= coveredUntil) continue; // inside previous span
            distinct.push(u);
            coveredUntil = start + u.party_size - 1;
        }
        return distinct;
    }, [queue]);

    // Determine current line count (fallback 2 if no data)
    const lineCount = useMemo(() => {
        if (!queue.length) return 2;
        const computed = Math.max(...queue.map(u => (u.line_number ?? 0))) + 1;
        return Math.max(2, computed); // ensure we always show at least 2 parallel lines visually
    }, [queue]);

    useEffect(() => {
        if (lineNumber !== undefined) {
            const ln = parseInt(lineNumber, 10);
            const match = computeFront.find(u => {
                const start = u.line_number ?? 0;
                return start <= ln && ln < start + u.party_size;
            });
            setFrontParties(match ? [match] : []);
        } else {
            setFrontParties(computeFront);
        }
    }, [lineNumber, computeFront]);

    return (
        <div className="next-up-wrapper" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <h1 style={{ margin: 0, fontSize: '4vw', letterSpacing: '0.1em' }}>NEXT UP</h1>
            </div>
            {frontParties.length === 0 && (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3vw' }}>
                    No one is currently up next.
                </div>
            )}
            {frontParties.length > 0 && (
                <div
                    className="next-up-container"
                    style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'stretch',
                        justifyContent: 'center',
                        gap: '1rem',
                        padding: '1rem'
                    }}
                >
                    {(() => {
                        const elements: React.JSX.Element[] = [];
                        const frontMap: Record<number, User> = {};
                        for (const p of frontParties) {
                            frontMap[p.line_number ?? 0] = p;
                        }
                        let col = 0;
                        while (col < lineCount) {
                            const user = frontMap[col];
                            if (user) {
                                const span = Math.min(user.party_size, lineCount - col);
                                const widthPct = (span / lineCount) * 100;
                                elements.push(
                                    <div
                                        key={`p-${user.id}`}
                                        className="next-up-party"
                                        style={{
                                            flex: `0 0 ${widthPct}%`,
                                            border: '4px solid #222',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'linear-gradient(135deg,#ffffff,#eef6ff)',
                                            boxShadow: '0 8px 18px rgba(0,0,0,0.15)',
                                            padding: '2rem',
                                        }}
                                    >
                                        <div style={{ fontSize: '10vw', fontWeight: 700, lineHeight: 1, textAlign: 'center', wordBreak: 'break-word' }}>
                                            {user.name}
                                        </div>
                                        <div style={{ marginTop: '1rem', fontSize: '2.5vw', fontWeight: 500 }}>
                                            Party Size: {user.party_size}
                                        </div>
                                        <div style={{ marginTop: '0.5rem', fontSize: '1.6vw', letterSpacing: '0.05em', opacity: 0.8 }}>
                                            Lines {(user.line_number ?? 0) + 1}{user.party_size > 1 ? `-${(user.line_number ?? 0) + user.party_size}` : ''}
                                        </div>
                                    </div>
                                );
                                col += span;
                            } else {
                                const widthPct = (1 / lineCount) * 100;
                                elements.push(
                                    <div
                                        key={`empty-${col}`}
                                        className="next-up-empty"
                                        style={{
                                            flex: `0 0 ${widthPct}%`,
                                            border: '4px dashed #999',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'repeating-linear-gradient(45deg,#f8f8f8,#f8f8f8 10px,#f0f0f0 10px,#f0f0f0 20px)',
                                            padding: '2rem',
                                            color: '#666',
                                            fontSize: '2vw',
                                            fontWeight: 500
                                        }}
                                    >
                                        Line {col + 1}
                                    </div>
                                );
                                col += 1;
                            }
                        }
                        return elements;
                    })()}
                </div>
            )}
            <style>{`
                @media (max-width: 900px) {
                    .next-up-party div:first-child { font-size: 20vw !important; }
                    .next-up-party { padding: 1rem !important; }
                }
            `}</style>
        </div>
    );
};

export default NextUpView;
