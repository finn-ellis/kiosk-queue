import React, { useState } from 'react';
import GenericView from '../components/GenericView';

interface EmailInputViewProps {
    onNext: (email: string | null) => void;
    onBack?: () => void;
    currentStep?: number;
    totalSteps?: number;
}

const EmailInputView: React.FC<EmailInputViewProps> = ({
    onNext,
    onBack,
    currentStep = 4,
    totalSteps = 7
}) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [touched, setTouched] = useState(false);

    const MAX_EMAIL_LENGTH = 255;

    const validateEmail = (email: string): string | null => {
        if (!email.trim()) return null; // Optional field
        if (email.trim().length > MAX_EMAIL_LENGTH) {
            return `Email must be ${MAX_EMAIL_LENGTH} characters or less`;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return 'Please enter a valid email address';
        }
        return null;
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        
        if (touched) {
            const validationError = validateEmail(newEmail);
            setError(validationError || '');
        }
    };

    const handleBlur = () => {
        setTouched(true);
        const validationError = validateEmail(email);
        setError(validationError || '');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setTouched(true);
        
        const validationError = validateEmail(email);
        if (validationError) {
            setError(validationError);
            return;
        }
        
        onNext(email ? email.trim() : null);
    };

    const handleNext = () => {
        setTouched(true);
        
        const validationError = validateEmail(email);
        if (validationError) {
            setError(validationError);
            return;
        }
        
        onNext(email ? email.trim() : null);
    };

    return (
        <>
            <GenericView  onBack={onBack} onNext={handleNext} currentStep={currentStep} totalSteps={totalSteps}>
                {/* Question */}
                <h2 className="question-text">Email Address?</h2>            {/* Subtitle */}
                <p className="subtitle-text">(OPTIONAL: We'll send your creation to this email)</p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="input-form" noValidate>
                    <div className="input-container">
                        <input
                            type="email"
                            value={email}
                            onChange={handleEmailChange}
                            onBlur={handleBlur}
                            className={`text-input ${error ? 'error' : ''}`}
                            placeholder=""
                        />
                        {error && (
                            <div className="error-message">
                                {error}
                            </div>
                        )}
                        <div className="character-count">
                            {email.length}/{MAX_EMAIL_LENGTH}
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
                    margin-bottom: 1rem;
                    text-shadow: 0 0 0.23rem #FFF;
                    -webkit-text-stroke: 0.06rem rgba(188, 16, 16, 0.22);
                    max-width: 62rem;
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
                    padding: 0.58rem 1.37rem;
                    justify-content: center;
                    align-items: center;
                    border-radius: 2.44rem;
                    border: 0.098rem solid rgba(255, 255, 255, 0.21);
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    font-family: 'Jura', sans-serif;
                    font-size: clamp(2rem, 3.52rem, 3.52rem);
                    font-weight: 700;
                    line-height: 1.5;
                    letter-spacing: -0.035rem;
                    color: transparent;
                    text-shadow: 0 0 24.4rem #FFF,
                                0 0 24.4rem #FFF,
                                0 0 15.01rem #FFF,
                                0 0 7.51rem #FFF,
                                0 0 2.14rem #FFF,
                                0 0 1.07rem #FFF;
                    -webkit-text-stroke: 0.098rem rgba(255, 255, 255, 0.34);
                }

                .submit-button:hover {
                    border-color: #12ECF8;
                    -webkit-text-stroke-color: #12ECF8;
                    text-shadow: 0 0 24.4rem #12ECF8,
                                0 0 24.4rem #12ECF8,
                                0 0 15.01rem #12ECF8,
                                0 0 7.51rem #12ECF8,
                                0 0 2.14rem #12ECF8,
                                0 0 1.07rem #12ECF8;
                    transform: translateX(-50%) scale(1.05);
                }

                @media (max-width: 768px) {
                    .question-text {
                        margin-bottom: 1rem;
                        padding: 0 1rem;
                    }

                    .subtitle-text {
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

export default EmailInputView;
