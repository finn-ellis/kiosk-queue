import React, { useState, useMemo, useEffect, useRef } from 'react';
import GenericView from '../components/GenericView';
import { useQueue } from '../context/QueueContext';

interface PlayerCountViewProps {
    selectedCount: number;
    onCountSelect: (count: number) => void;
    onNext?: () => void;
    onBack?: () => void;
    currentStep?: number;
    totalSteps?: number;
}

const PlayerCountView: React.FC<PlayerCountViewProps> = ({
    selectedCount,
    onCountSelect,
    onNext,
    onBack,
    currentStep = 1,
    totalSteps = 7
}) => {
    const playerOptions = [1, 2];
    const { waitDetail, queue } = useQueue();

    // Base estimated wait in minutes (recomputed when queue/waitDetail changes)
    const baseEstimatedWait = useMemo(() => {
        if (!waitDetail) return undefined;
        if (selectedCount === 1) {
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
                if (waitDetail.per_line_single.length) {
                    return Math.min(...waitDetail.per_line_single);
                }
            } else {
                if (waitDetail.per_line_single.length) {
                    return Math.min(...waitDetail.per_line_single);
                }
            }
            return undefined;
        }
        return waitDetail.per_span[selectedCount];
    }, [waitDetail, selectedCount, queue]);

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

    return (
        <GenericView  onBack={onBack} onNext={onNext} currentStep={currentStep} totalSteps={totalSteps}>
            {/* Question */}
            <h2 className="question-text">Number of People?</h2>

            {/* Player Count Buttons */}
            <div className="player-buttons-container">
                {playerOptions.map((count) => (
                    <button
                        key={count}
                        type="button"
                        className={`player-button ${selectedCount === count ? 'selected' : ''}`}
                        onClick={() => onCountSelect(count)}
                        aria-pressed={selectedCount === count}
                    >
                        {count}
                    </button>
                ))}
            </div>

            {/* Queue Information */}
            {selectedCount > 0 && (
                <div className="queue-info">
                    <div className="info-row">
                        {queue && queue.length > 0 && (
                            <div className="queue-size">
                                <span className="info-label">Current Queue</span>
                                <span className="info-value queue-count">{queue.length} {queue.length === 1 ? 'person' : 'people'}</span>
                            </div>
                        )}
                        <div className="estimated-wait">
                            <span className="info-label">Estimated Wait</span>
                            {displayWait !== undefined ? (
                                <span className="info-value wait-time">{displayWait}m {selectedCount === 1 && waitDetail?.per_line_single?.length ? '(best line)' : ''}</span>
                            ) : (
                                <span className="info-value fade-text">Calculating...</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Jura:wght@400;700&display=swap');

                .question-text {
                    color: #FFF;
                    text-align: center;
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(2rem, 3.4vw, 3.4rem);
                    font-weight: 700;
                    line-height: 1.5;
                    letter-spacing: 0.1rem;
                    margin-bottom: 4rem;
                    text-shadow: 0 0 0.23rem #FFF;
                    -webkit-text-stroke: 0.06rem rgba(188, 16, 16, 0.22);
                    max-width: 62rem;
                }

                .player-buttons-container {
                    display: flex;
                    gap: clamp(2rem, 8vw, 8rem);
                    margin-bottom: 6rem;
                    flex-wrap: wrap;
                    justify-content: center;
                }

                .player-button {
                    display: flex;
                    width: clamp(9rem, 11.4vw, 11.4rem);
                    height: clamp(9rem, 10.6vw, 10.6rem);
                    justify-content: center;
                    align-items: center;
                    border-radius: 1.56rem;
                    border: 0.06rem solid #FFF;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    position: relative;
                }

                .player-button span,
                .player-button {
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(4rem, 8vw, 8rem);
                    font-weight: 700;
                    line-height: 1.5;
                    letter-spacing: -0.08rem;
                    color: transparent;
                    -webkit-text-stroke: 0.06rem #FFF;
                    text-shadow: 0 0 4rem #FFF,
                                0 0 3rem #FFF,
                                0 0 2rem #FFF;
                }

                .player-button:hover {
                    border-color: #12ECF8;
                    box-shadow: 0 0 2rem rgba(18, 236, 248, 0.4);
                }

                .player-button:hover span,
                .player-button:hover {
                    -webkit-text-stroke-color: #12ECF8;
                    text-shadow: 0 0 15rem #12ECF8,
                                0 0 10rem #12ECF8,
                                0 0 5rem #12ECF8;
                }

                .player-button.selected {
                    border-color: #12ECF8;
                    background: rgba(18, 236, 248, 0.1);
                    box-shadow: 0 0 3rem rgba(18, 236, 248, 0.6),
                               0 0 1.5rem rgba(18, 236, 248, 0.4);
                }

                .player-button.selected span,
                .player-button.selected {
                    color: #12ECF8;
                    -webkit-text-stroke-color: #12ECF8;
                    text-shadow: 0 0 10rem #12ECF8,
                                0 0 5rem #12ECF8,
                                0 0 2rem #12ECF8;
                }

                .queue-info {
                    display: flex;
                    justify-content: center;
                    margin-bottom: 2rem;
                    width: 100%;
                }

                .info-row {
                    display: flex;
                    gap: 4rem;
                    align-items: center;
                    flex-wrap: wrap;
                    justify-content: center;
                }

                .queue-size, .estimated-wait {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-width: 10rem;
                }

                .info-label {
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(0.9rem, 1.2vw, 1.1rem);
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.7);
                    text-transform: uppercase;
                    letter-spacing: 0.1rem;
                    margin-bottom: 0.5rem;
                    text-shadow: 0 0 0.2rem rgba(255, 255, 255, 0.3);
                }

                .info-value {
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(1.2rem, 1.8vw, 1.6rem);
                    font-weight: 700;
                    letter-spacing: 0.05rem;
                    text-align: center;
                    margin-bottom: 1rem;
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(1.5rem, 1.5vw, 1.4rem);
                }

                .queue-count {
                    color: #E6C557;
                    text-shadow: 0 0 1rem #E6C557;
                }

                .wait-time {
                    color: #12ECF8;
                    text-shadow: 0 0 1rem #12ECF8;
                    
                }

                .fade-text {
                    opacity: 0.65;
                    color: rgba(255, 255, 255, 0.6) !important;
                }

                .queue-size strong {
                    color: #E6C557;
                    font-weight: 700;
                    text-shadow: 0 0 0.8rem #E6C557;
                }

                @media (max-width: 768px) {
                    .question-text {
                        margin-bottom: 2rem;
                        padding: 0 1rem;
                    }

                    .player-buttons-container {
                        gap: 3rem;
                        margin-bottom: 3rem;
                    }
                }

                @media (max-width: 480px) {
                    .player-buttons-container {
                        gap: 2rem;
                    }
                }
            `}</style>
        </GenericView>
    );
};

export default PlayerCountView;
