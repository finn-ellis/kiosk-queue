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

    // Build preview rows for depths 2-4 (next in queue after immediate next-up)
    const previewRows = useMemo(() => {
        const maxPreviewDepth = 4;
        const rows: { depth: number; parties: (User | null)[] }[] = [];
        
        for (let depth = 2; depth <= maxPreviewDepth; depth++) {
            const partiesAtDepth = queue.filter(u => u.place_in_queue === depth)
                .sort((a, b) => (a.line_number ?? 0) - (b.line_number ?? 0));
            
            if (partiesAtDepth.length === 0) continue;
            
            // Create array representing each line position
            const linePositions: (User | null)[] = new Array(lineCount).fill(null);
            
            // Map parties to their line positions, handling spans
            const depthLineMap = new Map<number, User>();
            partiesAtDepth.forEach(u => {
                depthLineMap.set(u.line_number ?? 0, u);
            });
            
            let col = 0;
            while (col < lineCount) {
                const user = depthLineMap.get(col);
                if (user) {
                    const span = Math.min(user.party_size, lineCount - col);
                    // Place user at starting position, nulls will be handled in rendering
                    linePositions[col] = user;
                    col += span;
                } else {
                    col += 1;
                }
            }
            
            rows.push({ depth, parties: linePositions });
        }
        
        return rows;
    }, [queue, lineCount]);

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
        <div className="next-up-container">
            {/* Main Title */}
            <div className="main-title">
                <div className="title-border">
                    <div className="title-text">NEXT UP</div>
                </div>
            </div>
            
            {/* Content Container */}
            <div className="content-container">
                {frontParties.length === 0 && (
                    <div className="no-parties-message">
                        Sign up at a kiosk station!
                    </div>
                )}
                {frontParties.length > 0 && (
                    <div className="parties-container">
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
                                            style={{ flex: `0 0 ${widthPct}%` }}
                                        >
                                            <div className="party-lines">
                                                Line {(user.line_number ?? 0) + 1}{user.party_size > 1 ? `-${(user.line_number ?? 0) + user.party_size}` : ''}
                                            </div>
                                            <div className="party-name">
                                                {user.name}
                                            </div>
                                            {/* <div className="party-size">
                                                Party Size: {user.party_size}
                                            </div> */}
                                            
                                        </div>
                                    );
                                    col += span;
                                } else {
                                    const widthPct = (1 / lineCount) * 100;
                                    elements.push(
                                        <div
                                            key={`empty-${col}`}
                                            className="next-up-empty"
                                            style={{ flex: `0 0 ${widthPct}%` }}
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
            </div>

            {/* Queue Preview Section */}
            {previewRows.length > 0 && (
                <div className="queue-preview-section">
                    <div className="preview-title">FOLLOWED BY...</div>
                    {previewRows.map(({ depth, parties }, rowIndex) => (
                        <div key={`preview-${depth}`} className={`preview-row preview-depth-${depth}`}>
                            {(() => {
                                const elements: React.JSX.Element[] = [];
                                let col = 0;
                                while (col < lineCount) {
                                    const user = parties[col];
                                    if (user) {
                                        const span = Math.min(user.party_size, lineCount - col);
                                        const widthPct = (span / lineCount) * 100;
                                        elements.push(
                                            <div
                                                key={`preview-${user.id}`}
                                                className="preview-party"
                                                style={{ flex: `0 0 ${widthPct}%` }}
                                            >
                                                <div className="preview-party-name">
                                                    {user.name}
                                                </div>
                                                {/* <div className="preview-party-info">
                                                    PS: {user.party_size}
                                                </div> */}
                                            </div>
                                        );
                                        col += span;
                                    } else {
                                        // Check if covered by a spanning party
                                        let covered = false;
                                        for (let checkCol = col - 1; checkCol >= 0; checkCol--) {
                                            const checkUser = parties[checkCol];
                                            if (checkUser && (checkUser.line_number ?? 0) + checkUser.party_size > col) {
                                                covered = true;
                                                break;
                                            }
                                        }
                                        
                                        if (!covered) {
                                            const widthPct = (1 / lineCount) * 100;
                                            elements.push(
                                                <div
                                                    key={`preview-empty-${depth}-${col}`}
                                                    className="preview-empty"
                                                    style={{ flex: `0 0 ${widthPct}%` }}
                                                />
                                            );
                                        }
                                        col += 1;
                                    }
                                }
                                return elements;
                            })()}
                        </div>
                    ))}
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Jura:wght@400;700&display=swap');
                
                .next-up-container {
                    height: 100vh;
                    background: linear-gradient(180deg, #371935 0%, #161111 100%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: relative;
                    font-family: 'Jura', -apple-system, Roboto, Helvetica, sans-serif;
                    overflow: hidden;
                    box-sizing: border-box;
                }

                .main-title {
                    position: relative;
                    flex-shrink: 0;
                    margin: 2rem 0;
                }

                .title-border {
                    position: relative;
                    padding: 1.5rem 3rem;
                    border-radius: 1.5rem;
                    border: 0.5rem solid #eecfa1ff;
                    background: transparent;
                    filter: drop-shadow(0 0 5rem rgba(228, 150, 150, 0.6))
                           drop-shadow(0 0 .5rem rgba(228, 150, 150, 0.4))
                           drop-shadow(0 0 1rem rgba(228, 150, 150, 0.3))
                           drop-shadow(0 0 .2rem #f49696ff)
                           drop-shadow(0 0 .5rem #e4969697);
                }

                .title-text {
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(2.5rem, 5vw, 5rem);
                    font-weight: 700;
                    letter-spacing: 0.2rem;
                    text-align: center;
                    color: transparent;
                    text-shadow: 0 0 5rem rgba(18, 236, 248, 0.3),
                                0 0 4rem rgba(18, 236, 248, 0.2),
                                0 0 4rem rgba(18, 236, 248, 0.3),
                                0 0 1rem rgba(18, 236, 248, 0.3),
                                0 0 0.3rem rgba(18, 236, 248, 0.2),
                                0 0 0.1rem rgba(18, 236, 248, .5);
                    -webkit-text-stroke: 0.15rem #12ECF8;
                    position: relative;
                }

                .content-container {
                    padding: 2rem 0rem 2rem 0rem;
                    width: 100%;
                    max-width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                    justify-content: center;
                    min-height: 0;
                    box-sizing: border-box;
                    gap: 2rem;
                }

                .no-parties-message {
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(2rem, 4vw, 3rem);
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.8);
                    text-align: center;
                    text-shadow: 0 0 1rem rgba(18, 236, 248, 0.3);
                }

                .parties-container {
                    display: flex;
                    flex-direction: row;
                    align-items: stretch;
                    justify-content: center;
                    gap: 2rem;
                    width: 100%;
                    height: 90%;
                    max-width: 90vw;
                    flex: 0 0 auto;
                    min-height: 30vh;
                    max-height: 100vh;
                }

                .next-up-party {
                    background: rgba(255, 255, 255, 0.05);
                    border: 3px solid rgba(18, 236, 248, 0.4);
                    border-radius: 1.5rem;
                    backdrop-filter: blur(15px);
                    box-shadow: 0 0 2rem rgba(18, 236, 248, 0.2),
                               0 0 4rem rgba(18, 236, 248, 0.1),
                               inset 0 0 1rem rgba(255, 255, 255, 0.1);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    transition: all 0.3s ease;
                    flex: 1;
                    height: 100%;
                }

                .next-up-party:hover {
                    border-color: rgba(18, 236, 248, 0.6);
                    box-shadow: 0 0 3rem rgba(18, 236, 248, 0.3),
                               0 0 5rem rgba(18, 236, 248, 0.15);
                    transform: translateY(-5px);
                }

                .party-name {
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(9rem, 5vw, 14rem);
                    font-weight: 700;
                    line-height: 1;
                    text-align: center;
                    word-break: break-word;
                    color: #FFF;
                    text-shadow: 0 0 2rem rgba(18, 236, 248, 0.5),
                                0 0 1rem rgba(18, 236, 248, 0.3);
                    margin-bottom: 1rem;
                    letter-spacing: 0.1rem;
                }

                .party-lines {
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(2rem, 2.5vw, 2rem);
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.9);
                    text-align: center;
                    margin-bottom: 0.5rem;
                    text-shadow: 0 0 0.5rem rgba(255, 255, 255, 0.3);
                }

                // .party-lines {
                //     font-family: 'Jura', sans-serif;
                //     font-size: clamp(0.9rem, 1.6vw, 1.2rem);
                //     font-weight: 500;
                //     color: rgba(255, 255, 255, 0.7);
                //     text-align: center;
                //     letter-spacing: 0.05em;
                //     text-transform: uppercase;
                // }

                .next-up-empty {
                    border: 3px dashed rgba(255, 255, 255, 0.3);
                    border-radius: 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(5px);
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(1.5rem, 3vw, 2rem);
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.5);
                    text-align: center;
                    transition: all 0.3s ease;
                    flex: 1;
                    height: 100%;
                }

                .next-up-empty:hover {
                    border-color: rgba(255, 255, 255, 0.4);
                    background: rgba(255, 255, 255, 0.05);
                }

                .queue-preview-section {
                    margin-top: 2rem;
                    padding-bottom: 2rem;
                    width: 100%;
                    max-width: 90rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0rem;
                    opacity: 0.8;
                }

                .preview-title {
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(1.2rem, 2.5vw, 1.8rem);
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.6);
                    text-align: center;
                    margin-bottom: 1rem;
                    letter-spacing: 0.1rem;
                    text-transform: uppercase;
                    text-shadow: 0 0 0.5rem rgba(18, 236, 248, 0.2);
                }

                .preview-row {
                    display: flex;
                    flex-direction: row;
                    align-items: center;
                    justify-content: center;
                    gap: 1rem;
                    width: 100%;
                    transition: all 0.3s ease;
                }

                .preview-depth-2 {
                    transform: scale(0.75);
                    opacity: 0.7;
                }

                .preview-depth-3 {
                    transform: scale(0.6);
                    opacity: 0.5;
                }

                .preview-depth-4 {
                    transform: scale(0.5);
                    opacity: 0.35;
                }

                .preview-party {
                    background: rgba(255, 255, 255, 0.03);
                    border: 2px solid rgba(18, 236, 248, 0.25);
                    border-radius: 1rem;
                    padding: 1rem 0.75rem;
                    backdrop-filter: blur(8px);
                    box-shadow: 0 0 1rem rgba(18, 236, 248, 0.1),
                               inset 0 0 0.5rem rgba(255, 255, 255, 0.05);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 4rem;
                    transition: all 0.3s ease;
                }

                .preview-party:hover {
                    border-color: rgba(18, 236, 248, 0.4);
                    box-shadow: 0 0 1.5rem rgba(18, 236, 248, 0.15);
                    transform: translateY(-2px);
                }

                .preview-party-name {
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(2rem, 2vw, 2rem);
                    font-weight: 600;
                    line-height: 1.2;
                    text-align: center;
                    word-break: break-word;
                    color: rgba(255, 255, 255, 0.85);
                    text-shadow: 0 0 0.5rem rgba(18, 236, 248, 0.3);
                    margin-bottom: 0.25rem;
                }

                .preview-party-info {
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(0.7rem, 1.4vw, 0.9rem);
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.6);
                    text-align: center;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }

                .preview-empty {
                    border: 2px dashed rgba(255, 255, 255, 0.15);
                    border-radius: 1rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255, 255, 255, 0.01);
                    backdrop-filter: blur(3px);
                    padding: 1rem 0.75rem;
                    min-height: 4rem;
                    transition: all 0.3s ease;
                }

                @media (max-width: 768px) {
                    .next-up-container {
                        padding: 0 1rem;
                    }

                    .main-title {
                        margin: 1.5rem 0;
                    }

                    .title-border {
                        padding: 1rem 2rem;
                        border-radius: 1rem;
                        border-width: 0.3rem;
                    }

                    .content-container {
                        padding: 4rem 1rem;
                    }

                    .parties-container {
                        flex-direction: column;
                        gap: 1rem;
                    }

                    .next-up-party,
                    .next-up-empty {
                        padding: 1.5rem 1rem;
                    }

                    .party-name {
                        font-size: clamp(2rem, 10vw, 4rem);
                    }

                    .queue-preview-section {
                        margin-top: 1.5rem;
                        padding: 0 1rem;
                    }

                    .preview-row {
                        flex-direction: column;
                        gap: 0.75rem;
                    }

                    .preview-party,
                    .preview-empty {
                        width: 100%;
                        max-width: 20rem;
                    }

                    .preview-depth-2,
                    .preview-depth-3,
                    .preview-depth-4 {
                        transform: scale(1);
                    }

                    .preview-depth-2 { opacity: 0.8; }
                    .preview-depth-3 { opacity: 0.6; }
                    .preview-depth-4 { opacity: 0.4; }
                }

                @media (max-width: 480px) {
                    .title-border {
                        padding: 0.8rem 1.5rem;
                    }

                    .next-up-party,
                    .next-up-empty {
                        padding: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default NextUpView;
