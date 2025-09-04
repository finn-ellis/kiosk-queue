import React, { useState } from 'react';
import GenericView from '../components/GenericView';

interface EmailOptInViewProps {
    onNext: (optIn: boolean) => void;
    onBack?: () => void;
    currentStep?: number;
    totalSteps?: number;
}

const EmailOptInView: React.FC<EmailOptInViewProps> = ({
    onNext,
    onBack,
    currentStep = 5,
    totalSteps = 7
}) => {
    const [selectedOption, setSelectedOption] = useState<boolean | null>(null);

    const handleOptionSelect = (optIn: boolean) => {
        console.log(optIn);
        setSelectedOption(optIn);
        // Immediately proceed to next step when option is selected
        onNext(optIn);
    };

    return (
        <>
            <GenericView onBack={onBack} onNext={() => {}} currentStep={currentStep} totalSteps={totalSteps} nextButtonDisabled={true}>
                {/* Question */}
                <h2 className="question-text">Join the UNM ARTSLab email list?</h2>
                {/* <p className="subtitle-text">()</p> */}

                {/* Option Buttons */}
                <div className="options-container">
                    <button
                        type="button"
                        className={`option-button ${selectedOption === true ? 'selected' : ''}`}
                        onClick={() => handleOptionSelect(true)}
                    >
                        Yes
                    </button>
                    <button
                        type="button"
                        className={`option-button ${selectedOption === false ? 'selected' : ''}`}
                        onClick={() => handleOptionSelect(false)}
                    >
                        No
                    </button>
                </div>
            </GenericView>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Jura:wght@400;700&display=swap');

                .question-text {
                    color: #FFF;
                    text-align: center;
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(1.8rem, 3rem, 3rem);
                    font-weight: 700;
                    line-height: 1.5;
                    letter-spacing: 0.24rem;
                    margin-bottom: 4rem;
                    text-shadow: 0 0 0.23rem #FFF;
                    -webkit-text-stroke: 0.06rem rgba(188, 16, 16, 0.22);
                    max-width: 79rem;
                    padding: 0 1rem;
                }

                .subtitle-text {
                    color: #E6C557;
                    text-align: center;
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(1.5rem, 1rem, 2rem);
                    font-weight: 700;
                    line-height: 1.5;
                    letter-spacing: 0.16rem;
                    margin-bottom: 3rem;
                    text-shadow: 0 0 0.23rem #FFF;
                    max-width: 50rem;
                }

                .options-container {
                    display: flex;
                    gap: clamp(3rem, 8vw, 8rem);
                    margin-bottom: 6rem;
                    flex-wrap: wrap;
                    justify-content: center;
                }

                .option-button {
                    display: inline-flex;
                    padding: 0.8rem 1.87rem;
                    justify-content: center;
                    align-items: center;
                    border-radius: 3.31rem;
                    border: 0.13rem solid #FFF;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(3rem, 4.8rem, 4.8rem);
                    font-weight: 700;
                    line-height: 1.5;
                    letter-spacing: 0.34rem;
                    color: transparent;
                    text-shadow: 0 0 33rem #FFF,
                                0 0 33rem #FFF,
                                0 0 20.6rem #FFF,
                                0 0 10.3rem #FFF,
                                0 0 2.94rem #FFF,
                                0 0 1.47rem #FFF;
                    -webkit-text-stroke: 0.13rem #FFF;
                    position: relative;
                    min-width: clamp(8rem, 12rem, 12rem);
                    min-height: clamp(6rem, 8.8rem, 8.8rem);
                }

                .option-button:hover {
                    border-color: #12ECF8;
                    -webkit-text-stroke-color: #12ECF8;
                    text-shadow: 0 0 33rem #12ECF8,
                                0 0 33rem #12ECF8,
                                0 0 20.6rem #12ECF8,
                                0 0 10.3rem #12ECF8,
                                0 0 2.94rem #12ECF8,
                                0 0 1.47rem #12ECF8;
                    transform: scale(1.05);
                }

                .option-button.selected {
                    border-color: #12ECF8;
                    background: rgba(18, 236, 248, 0.1);
                    -webkit-text-stroke-color: #12ECF8;
                    color: #12ECF8;
                    text-shadow: 0 0 33rem #12ECF8,
                                0 0 33rem #12ECF8,
                                0 0 20.6rem #12ECF8,
                                0 0 10.3rem #12ECF8,
                                0 0 2.94rem #12ECF8,
                                0 0 1.47rem #12ECF8;
                    box-shadow: 0 0 3rem rgba(18, 236, 248, 0.6),
                               0 0 1.5rem rgba(18, 236, 248, 0.4);
                }

                @media (max-width: 768px) {
                    .question-text {
                        margin-bottom: 2rem;
                        padding: 0 1rem;
                    }

                    .subtitle-text {
                        margin-bottom: 2rem;
                        padding: 0 1rem;
                    }

                    .options-container {
                        gap: 3rem;
                        margin-bottom: 3rem;
                    }
                }

                @media (max-width: 480px) {
                    .options-container {
                        gap: 2rem;
                    }
                }
            `}</style>
        </>
    );
};

export default EmailOptInView;