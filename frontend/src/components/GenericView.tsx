import React from 'react';

interface GenericViewProps {
    title?: string;
    children: React.ReactNode;
    onBack?: () => void;
    onNext?: () => void;
    currentStep?: number;
    totalSteps?: number;
    backButtonDisabled?: boolean;
    nextButtonDisabled?: boolean;
}

const GenericView: React.FC<GenericViewProps> = ({
    title,
    children,
    onBack,
    onNext,
    currentStep = 1,
    totalSteps = 7,
    backButtonDisabled = false,
    nextButtonDisabled = false
}) => {
    return (
        <div className="generic-view-container">
            {/* Main Title */}
            <div className="main-title">
                <div className="title-border">
                    <div className="title-text">{title || 'Join Queue'}</div>
                </div>
            </div>

            {/* Main Content */}
            <div className="content-container">
                {children}
            </div>

            {/* Navigation Arrows */}
            <div className="navigation-container">
                {onBack && (
                    <button 
                        className={`nav-arrow nav-arrow-left ${backButtonDisabled ? 'disabled' : ''}`} 
                        onClick={backButtonDisabled ? undefined : onBack} 
                        disabled={backButtonDisabled}
                        aria-label="Go back"
                    >
                        <svg width="139" height="158" viewBox="0 0 100 100" fill="none">
                            <path d="M35.7 82.8C34.7 83.3 33.7 83.4 33.1 83.1L33.0 83.0L33.0 83.0L32.9 82.9L32.9 82.9L20.6 72.4C20.5 72.3 20.4 72.1 20.4 72.0C20.4 71.9 20.5 71.7 20.6 71.6L32.9 61.1C33.6 60.5 34.5 60.3 35.3 60.5C36.6 60.9 37.2 62.3 36.9 63.6L36.9 63.7L36.8 63.9C36.8 63.9 36.8 63.9 36.8 63.9L33.5 68.7H36.2C39.5 68.7 42.5 66.7 42.5 64.2V51.1C42.5 50.8 42.7 50.5 43.0 50.5H48.7C49.0 50.5 49.2 50.8 49.2 51.1V64.2C49.2 69.5 43.3 74.8 36.2 74.8H33.3L36.8 81.2C37.1 81.9 37.0 82.8 36.6 83.3C36.6 83.3 36.6 83.3 36.6 83.3L36.4 83.4L36.3 83.4C36.3 83.4 36.3 83.4 36.3 83.4C36.3 83.4 36.3 83.4 35.7 82.8Z" 
                                stroke="#FFF4F4" strokeOpacity="0.04" strokeWidth="0.8" strokeLinejoin="round"/>
                        </svg>
                    </button>
                )}

                {onNext && (
                    <button 
                        className={`nav-arrow nav-arrow-right ${nextButtonDisabled ? 'disabled' : ''}`} 
                        onClick={nextButtonDisabled ? undefined : onNext} 
                        disabled={nextButtonDisabled}
                        aria-label="Continue"
                    >
                        <svg width="139" height="158" viewBox="0 0 100 100" fill="none">
                            <path d="M64.3 82.8C65.3 83.3 66.3 83.4 66.9 83.1L67.0 83.0L67.0 83.0L67.1 82.9L67.1 82.9L79.4 72.4C79.5 72.3 79.6 72.1 79.6 72.0C79.6 71.9 79.5 71.7 79.4 71.6L67.1 61.1C66.4 60.5 65.5 60.3 64.7 60.5C63.4 60.9 62.8 62.3 63.1 63.6L63.1 63.7L63.2 63.9C63.2 63.9 63.2 63.9 63.2 63.9L66.5 68.7H63.8C60.5 68.7 57.5 66.7 57.5 64.2V51.1C57.5 50.8 57.3 50.5 57.0 50.5H51.3C51.0 50.5 50.8 50.8 50.8 51.1V64.2C50.8 69.5 56.7 74.8 63.8 74.8H66.7L63.2 81.2C62.9 81.9 63.0 82.8 63.4 83.3C63.4 83.3 63.4 83.3 63.4 83.3L63.6 83.4L63.7 83.4C63.7 83.4 63.7 83.4 63.7 83.4C63.7 83.4 63.7 83.4 64.3 82.8Z" 
                                stroke="#FFF4F4" strokeOpacity="0.04" strokeWidth="0.8" strokeLinejoin="round"/>
                        </svg>
                    </button>
                )}
            </div>

            {/* Progress Indicator */}
            <div className="progress-container">
                {Array.from({ length: totalSteps }, (_, index) => (
                    <div
                        key={index}
                        className={`progress-dot ${index < currentStep ? 'active' : ''}`}
                    />
                ))}
            </div>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Jura:wght@400;700&display=swap');
                
                .generic-view-container {
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

                .content-container {
                    padding: 0 2rem;
                    width: 100%;
                    max-width: 100%;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    flex: 1;
                    justify-content: center;
                    min-height: 0;
                    box-sizing: border-box;
                }

                .progress-container {
                    position: relative;
                    margin: 2rem 0;
                    flex-shrink: 0;
                    display: flex;
                    gap: 2rem;
                    align-items: center;
                    justify-content: center;
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
                           drop-shadow(0 0 .2rem #f49696ff);
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

                .navigation-container {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    top: 0;
                    left: 0;
                    pointer-events: none;
                }

                .nav-arrow {
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    filter: drop-shadow(0 0 2rem #ffffff70)
                           drop-shadow(0 0 1.5rem #ffffff8a)
                           drop-shadow(0 0 0.5rem rgba(255, 255, 255, 0.72));
                    pointer-events: auto;
                    width: 20rem;
                    height: 20rem;
                    position: absolute;
                    bottom: 5%;
                    transform: translateY(0%);
                }

                .nav-arrow-left {
                    left: 3rem;
                }

                .nav-arrow-right {
                    right: 3rem;
                }

                .nav-arrow svg {
                    width: 100%;
                    height: 100%;
                    fill: #FFF;
                }

                .nav-arrow:hover {
                    filter: drop-shadow(0 0 2rem #12ECF8)
                           drop-shadow(0 0 1.5rem #12ECF8)
                           drop-shadow(0 0 0.5rem #12ECF8);
                    transform: scale(1.1);
                }

                .nav-arrow.disabled {
                    cursor: not-allowed;
                    opacity: 0.4;
                    filter: grayscale(100%) brightness(0.5);
                    transform: scale(0.9);
                }

                .nav-arrow.disabled:hover {
                    filter: grayscale(100%) brightness(0.5);
                    transform: scale(0.9);
                }

                .nav-arrow:hover svg path {
                    stroke: #12ECF8;
                }

                .progress-dot {
                    width: clamp(1rem, 1.2vw, 1.2rem);
                    height: clamp(1rem, 1.3vw, 1.3rem);
                    border-radius: 0.66rem;
                    border: 0.05rem solid #12ECF8;
                    background: #FFF;
                    transition: all 0.3s ease;
                }

                .progress-dot.active {
                    background: linear-gradient(0deg, rgba(255, 255, 255, 0.54) 0%, rgba(255, 255, 255, 0.54) 100%), rgba(18, 236, 248, 0.40);
                    box-shadow: 0 0 15rem #12ECF8,
                               0 0 15rem #12ECF8,
                               0 0 13.4rem #12ECF8,
                               0 0 6.7rem #12ECF8,
                               0 0 1.9rem #12ECF8,
                               0 0 0.96rem #12ECF8;
                }

                @media (max-width: 768px) {
                    .generic-view-container {
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
                        padding: 0 1rem;
                    }

                    .progress-container {
                        margin: 1.5rem 0;
                        gap: 1rem;
                    }

                    .navigation-container {
                        padding: 0 1rem;
                    }

                    .nav-arrow-left {
                        left: 1rem;
                    }

                    .nav-arrow-right {
                        right: 1rem;
                    }
                }

                @media (max-width: 480px) {
                    .title-border {
                        padding: 0.8rem 1.5rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default GenericView;
