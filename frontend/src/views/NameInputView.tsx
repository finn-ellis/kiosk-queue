import React, { useState } from 'react';
import GenericView from '../components/GenericView';

interface NameInputViewProps {
    onNext: (name: string) => void;
    onBack?: () => void;
    currentStep?: number;
    totalSteps?: number;
}

const NameInputView: React.FC<NameInputViewProps> = ({
    onNext,
    onBack,
    currentStep = 2,
    totalSteps = 7
}) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [touched, setTouched] = useState(false);

    const MAX_NAME_LENGTH = 25;

    const validateName = (name: string): string | null => {
        if (!name.trim()) {
            return 'Name is required';
        }
        if (name.trim().length > MAX_NAME_LENGTH) {
            return `Name must be ${MAX_NAME_LENGTH} characters or less`;
        }
        return null;
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newName = e.target.value;
        setName(newName);
        
        if (touched) {
            const validationError = validateName(newName);
            setError(validationError || '');
        }
    };

    const handleBlur = () => {
        setTouched(true);
        const validationError = validateName(name);
        setError(validationError || '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        
        const validationError = validateName(name);
        if (validationError) {
            setError(validationError);
            return;
        }
        
        if (name.trim()) {
            onNext(name.trim());
        }
    };

    const handleNext = () => {
        setTouched(true);
        
        const validationError = validateName(name);
        if (validationError) {
            setError(validationError);
            return;
        }
        
        if (name.trim()) {
            onNext(name.trim());
        }
    };

    return (
        <>
            <GenericView 
                 
                onBack={onBack} 
                onNext={name.trim() && !error ? handleNext : undefined} 
                currentStep={currentStep} 
                totalSteps={totalSteps}
            >
                {/* Question */}
                <h2 className="question-text">Name</h2>

                {/* Form */}
                <form onSubmit={handleSubmit} className="input-form" noValidate>
                    <div className="input-container">
                        <input
                            type="text"
                            value={name}
                            onChange={handleNameChange}
                            onBlur={handleBlur}
                            className={`text-input ${error ? 'error' : ''}`}
                            placeholder=""
                            required
                        />
                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}
                        <div className="character-count">
                            {name.length}/{MAX_NAME_LENGTH}
                        </div>
                    </div>
                </form>

                {/* Submit Button */}
                {/* <button type="submit" onClick={handleSubmit} className="submit-button">
                    Submit
                </button> */}
            </GenericView>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Jura:wght@400;700&display=swap');

                .question-text {
                    color: #FFF;
                    text-align: center;
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(2rem, 3.4vw, 3.4rem);
                    font-weight: 700;
                    line-height: 1.5;
                    letter-spacing: 0.275rem;
                    margin-bottom: 4rem;
                    text-shadow: 0 0 0.23rem #FFF;
                    -webkit-text-stroke: 0.06rem rgba(188, 16, 16, 0.22);
                    max-width: 62rem;
                }

                .input-form {
                    margin-bottom: 6rem;
                }

                .input-container {
                    position: relative;
                }

                .text-input {
                    width: clamp(20rem, 29rem, 29rem);
                    height: clamp(3rem, 4.25rem, 4.25rem);
                    padding: 1rem 1.5rem;
                    border-radius: 0.66rem;
                    border: 0.05rem solid #FFF;
                    background: rgba(255, 255, 255, 0.61);
                    box-shadow: 0 0.25rem 0.25rem rgba(0, 0, 0, 0.25);
                    font-family: 'Jura', sans-serif;
                    font-size: 2.5rem;
                    font-weight: 600;
                    color: #333;
                    outline: none;
                    transition: all 0.3s ease;
                }

                .text-input:focus {
                    border-color: #12ECF8;
                    box-shadow: 0 0 1rem rgba(18, 236, 248, 0.4);
                    background: rgba(255, 255, 255, 0.8);
                }

                .text-input.error {
                    border-color: #FF4444;
                    box-shadow: 0 0 1rem rgba(255, 68, 68, 0.4);
                    background: rgba(255, 255, 255, 0.9);
                }

                .text-input.error:focus {
                    border-color: #FF4444;
                    box-shadow: 0 0 1rem rgba(255, 68, 68, 0.6);
                }

                .error-message {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    margin-top: 0.5rem;
                    padding: 0.75rem 1rem;
                    background: rgba(255, 68, 68, 0.1);
                    border: 0.05rem solid #FF4444;
                    border-radius: 0.5rem;
                    backdrop-filter: blur(10px);
                    font-family: 'Jura', sans-serif;
                    font-size: 0.9rem;
                    font-weight: 600;
                    color: #FF4444;
                    text-align: center;
                    text-shadow: 0 0 0.5rem rgba(255, 68, 68, 0.6);
                    animation: errorSlideIn 0.3s ease-out;
                }

                .character-count {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    margin-top: 0.25rem;
                    font-family: 'Jura', sans-serif;
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: rgba(255, 255, 255, 0.6);
                    text-shadow: 0 0 0.3rem rgba(255, 255, 255, 0.3);
                }

                @keyframes errorSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .submit-button {
                    position: absolute;
                    bottom: 12rem;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    padding: 0.56rem 1.31rem;
                    justify-content: center;
                    align-items: center;
                    border-radius: 2.34rem;
                    border: 0.09rem solid rgba(255, 255, 255, 0.21);
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(2rem, 3.37rem, 3.37rem);
                    font-weight: 700;
                    line-height: 1.5;
                    letter-spacing: -0.034rem;
                    color: transparent;
                    text-shadow: 0 0 24rem #FFF,
                                0 0 24rem #FFF,
                                0 0 15rem #FFF,
                                0 0 7.5rem #FFF,
                                0 0 2.14rem #FFF,
                                0 0 1.07rem #FFF;
                    -webkit-text-stroke: 0.098rem rgba(255, 255, 255, 0.34);
                }

                .submit-button:hover {
                    border-color: #12ECF8;
                    -webkit-text-stroke-color: #12ECF8;
                    text-shadow: 0 0 24rem #12ECF8,
                                0 0 24rem #12ECF8,
                                0 0 15rem #12ECF8,
                                0 0 7.5rem #12ECF8,
                                0 0 2.14rem #12ECF8,
                                0 0 1.07rem #12ECF8;
                    transform: translateX(-50%) scale(1.05);
                }

                @media (max-width: 768px) {
                    .question-text {
                        margin-bottom: 2rem;
                        padding: 0 1rem;
                    }

                    .input-form {
                        margin-bottom: 3rem;
                    }

                    .submit-button {
                        bottom: 8rem;
                    }
                }
            `}</style>
        </>
    );
};

export default NameInputView;
