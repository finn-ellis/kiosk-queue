import React from 'react';
import GenericView from '../components/GenericView';

interface ConfirmationViewProps {
    placeInQueue: number;
    waitTime?: number; // legacy raw queue.wait_time (unused if better data)
    initialEstimatedWait?: number; // snapshot from Join step to prevent shifting/doubling
    partySize?: number;
    name: string;
    lineNumber?: number;
    perLineSingle?: number[];
    perSpan?: Record<number, number>;
    onNewSignup?: () => void; // reset to new signup flow
    onBack?: () => void;
    currentStep?: number;
    totalSteps?: number;
}

const ConfirmationView: React.FC<ConfirmationViewProps> = ({ 
    placeInQueue, 
    waitTime, 
    initialEstimatedWait, 
    partySize = 1, 
    name,
    lineNumber,
    perLineSingle, 
    perSpan, 
    onNewSignup,
    onBack,
    currentStep = 7,
    totalSteps = 7
}) => {
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
    const arrivalTime = new Date(Date.now() + detailedWait * 60000).toLocaleTimeString([], { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });

    return (
        <GenericView 
            title="CONFIRMED!" 
            onBack={onBack} 
            currentStep={currentStep} 
            totalSteps={totalSteps}
            backButtonDisabled={false}
        >
            <div className="conf-panel">
                <h2 className="conf-title">You're in the Queue!</h2>
                <div className="conf-grid">
                    <div className="conf-item conf-large">
                        <span className="conf-label">Place</span>
                        <span className="conf-value conf-accent">{placeInQueue}</span>
                    </div>
                    
                    {/* {lineNumber !== undefined && (
                        <div className="conf-item">
                            <span className="conf-label">Line</span>
                            <span className="conf-value">{lineNumber + 1}</span>
                        </div>
                    )} */}
                    <div className="conf-item conf-large">
                        <span className="conf-label">Name</span>
                        <span className="conf-value">{name}</span>
                    </div>
                    <div className="conf-item">
                        <span className="conf-label">Party Size</span>
                        <span className="conf-value">{partySize}</span>
                    </div>
                    <div className="conf-item wide">
                        <span className="conf-label">Estimated Wait</span>
                        <span className="conf-value">{detailedWait}m</span> {/* min{detailedWait === 1 ? '' : 's'} */}
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
                @import url('https://fonts.googleapis.com/css2?family=Jura:wght@400;700&display=swap');

                .conf-panel {
                    background: rgba(255, 255, 255, 0.05);
                    border: 2px solid rgba(18, 236, 248, 0.3);
                    border-radius: 1.5rem;
                    padding: 2.5rem 2rem;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 0 2rem rgba(18, 236, 248, 0.2),
                               0 0 4rem rgba(18, 236, 248, 0.1);
                    max-width: 60rem;
                    width: 100%;
                }

                .conf-title {
                    margin: 0 0 2.5rem;
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(2rem, 3vw, 3rem);
                    font-weight: 700;
                    letter-spacing: 0.2rem;
                    color: #FFF;
                    text-align: center;
                    text-shadow: 0 0 1rem rgba(255, 255, 255, 0.8);
                }

                .conf-grid {
                    display: grid;
                    grid-template-columns: repeat(10, 1fr);
                    gap: 1rem;
                    margin-bottom: 2rem;
                }

                .conf-item {
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(18, 236, 248, 0.2);
                    padding: 1.5rem 1.25rem;
                    border-radius: 1rem;
                    position: relative;
                    backdrop-filter: blur(5px);
                    transition: all 0.3s ease;
                    grid-column: span 2;
                }

                .conf-item.conf-large {
                    grid-column: span 4;
                }

                .conf-item:hover {
                    border-color: rgba(18, 236, 248, 0.4);
                    box-shadow: 0 0 1rem rgba(18, 236, 248, 0.2);
                }

                .conf-item.wide {
                    grid-column: span 5;
                }

                @media (max-width: 768px) {
                    .conf-item.wide {
                        grid-column: span 5;
                    }
                    
                    .conf-panel {
                        padding: 2rem 1.5rem;
                    }
                    
                    .conf-grid {
                        grid-template-columns: 1fr;
                        gap: 1rem;
                    }
                }

                .conf-label {
                    display: block;
                    font-family: 'Jura', sans-serif;
                    font-size: 0.9rem;
                    text-transform: uppercase;
                    letter-spacing: 0.15em;
                    font-weight: 600;
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 0.5rem;
                }

                .conf-value {
                    font-family: 'Jura', sans-serif;
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: #FFF;
                    letter-spacing: 0.1rem;
                    text-shadow: 0 0 0.5rem rgba(255, 255, 255, 0.5);
                }

                .conf-accent {
                    color: #12ECF8;
                    text-shadow: 0 0 1rem #12ECF8;
                }

                .conf-note {
                    font-family: 'Jura', sans-serif;
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.6);
                    text-align: center;
                    line-height: 1.4;
                    margin-top: 1rem;
                    font-style: italic;
                }

                .conf-actions {
                    margin-top: 2.5rem;
                    display: flex;
                    justify-content: center;
                }

                .conf-new {
                    background: linear-gradient(135deg, #12ECF8, #0BA8B8);
                    color: #000;
                    border: none;
                    font-family: 'Jura', sans-serif;
                    font-weight: 700;
                    font-size: 1.1rem;
                    letter-spacing: 0.1rem;
                    padding: 1rem 2.5rem;
                    border-radius: 1rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 0 1rem rgba(18, 236, 248, 0.4),
                               0 4px 15px rgba(0, 0, 0, 0.2);
                    text-transform: uppercase;
                }

                .conf-new:hover {
                    background: linear-gradient(135deg, #0BA8B8, #12ECF8);
                    box-shadow: 0 0 2rem rgba(18, 236, 248, 0.6),
                               0 6px 20px rgba(0, 0, 0, 0.3);
                    transform: translateY(-2px);
                }

                .conf-new:active {
                    transform: translateY(0);
                    box-shadow: 0 0 1rem rgba(18, 236, 248, 0.4),
                               0 2px 10px rgba(0, 0, 0, 0.2);
                }

                @media (max-width: 480px) {
                    .conf-panel {
                        padding: 1.5rem 1rem;
                    }
                    
                    .conf-title {
                        margin-bottom: 2rem;
                    }
                    
                    .conf-value {
                        font-size: 1.5rem;
                    }
                    
                    .conf-new {
                        padding: 0.8rem 2rem;
                        font-size: 1rem;
                    }
                }
            `}</style>
        </GenericView>
    );
};

export default ConfirmationView;
