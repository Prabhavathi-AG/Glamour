"use client";

import { useState, useRef } from "react";
import CameraUpload from "./components/CameraUpload";
import "./page.css"; // We'll create this to hold Page specific css

export default function Home() {
  const [activeTab, setActiveTab] = useState("skin"); // "skin" or "fashion"
  const [skinImage, setSkinImage] = useState(null);
  const [fashionImage, setFashionImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [skinAnalysisResult, setSkinAnalysisResult] = useState(null);

  const [fashionEvent, setFashionEvent] = useState("");
  const [isGeneratingStyle, setIsGeneratingStyle] = useState(false);
  const [fashionResult, setFashionResult] = useState(null);
  const [generatingExtraImage, setGeneratingExtraImage] = useState(null);

  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(null);

  const startCountdown = (seconds) => {
    setCountdown(seconds);
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0; // Wait at 0 until finished
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(0);
  };

  const runFashionStylist = async () => {
    if (!fashionImage || !fashionEvent.trim()) return;
    setIsGeneratingStyle(true);
    startCountdown(15);
    try {
      const response = await fetch('/api/fashion-stylist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: fashionImage, event: fashionEvent }),
      });
      const data = await response.json();
      if (data.analysis) {
        setFashionResult(data.analysis);
      } else {
        alert(data.error || 'Failed to generate style.');
      }
    } catch (error) {
      alert('An error occurred during fashion analysis.');
    } finally {
      setIsGeneratingStyle(false);
      stopCountdown();
    }
  };

  const generateExtraImage = async (index) => {
    setGeneratingExtraImage(index);
    startCountdown(15);
    try {
      const prompt = fashionResult.recommendations[index].generationPrompt;
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await response.json();
      if (data.success && data.imageUrl) {
        const updatedResult = { ...fashionResult };
        updatedResult.recommendations[index].imageUrl = data.imageUrl;
        setFashionResult(updatedResult);
      } else {
        alert('Image generation failed.');
      }
    } catch (error) {
      alert('Error generating image.');
    } finally {
      setGeneratingExtraImage(null);
      stopCountdown();
    }
  };

  const analyzeSkin = async () => {
    if (!skinImage) return;
    setIsAnalyzing(true);
    try {
      const response = await fetch('/api/analyze-skin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: skinImage }),
      });
      const data = await response.json();
      if (data.analysis) {
        setSkinAnalysisResult(data.analysis);
      } else {
        alert(data.error || 'Failed to analyze skin.');
      }
    } catch (error) {
      alert('An error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };


  return (
    <div className="app-container">
      <header className="header">
        <h1 className="logo-text">Glamour</h1>
        <p className="subtitle">Your AI Skin & Fashion Stylist</p>
      </header>

      <main className="main-content">
        <div className="glass-panel main-panel">
          
          <div className="tabs">
            <button 
              className={`tab-btn ${activeTab === "skin" ? "active" : ""}`}
              onClick={() => setActiveTab("skin")}
            >
              Skin Analysis
            </button>
            <button 
              className={`tab-btn ${activeTab === "fashion" ? "active" : ""}`}
              onClick={() => setActiveTab("fashion")}
            >
              Fashion Stylist
            </button>
            <div className="tab-indicator" style={{ transform: `translateX(${activeTab === "skin" ? "0%" : "100%"})` }}></div>
          </div>

          <div className="tab-content">
            {activeTab === "skin" && (
              <div className="tab-pane skin-pane fade-in">
                <h2>Analyze Your Skin</h2>
                <p className="description">Upload a photo or use your camera to get a personalized skincare routine and ingredient recommendations.</p>
                <div className="action-area">
                  {!skinImage ? (
                    <CameraUpload onImageCapture={(dataUrl) => { setSkinImage(dataUrl); setSkinAnalysisResult(null); }} />
                  ) : !skinAnalysisResult ? (
                    <div className="preview-container">
                      <img src={skinImage} alt="Captured for Skin Analysis" className="image-preview" style={{ opacity: isAnalyzing ? 0.5 : 1 }} />
                      <div className="button-group mt-16" style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-secondary" onClick={() => setSkinImage(null)} disabled={isAnalyzing}>
                          Retake
                        </button>
                        <button className="btn-primary" onClick={analyzeSkin} disabled={isAnalyzing}>
                          {isAnalyzing ? "Analyzing..." : "Analyze Skin"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="results-container fade-in">
                      <div className="results-grid">
                        <div className="result-card">
                          <h3>Estimated Type</h3>
                          <p>{skinAnalysisResult.skinType}</p>
                        </div>
                        <div className="result-card">
                          <h3>Concerns</h3>
                          <ul>
                            {skinAnalysisResult.concerns?.map((c, i) => <li key={i}>{c}</li>)}
                          </ul>
                        </div>
                        <div className="result-card">
                          <h3>Beneficial Ingredients</h3>
                          <ul>
                            {skinAnalysisResult.ingredients?.map((c, i) => <li key={i}>{c}</li>)}
                          </ul>
                        </div>
                      </div>
                      <p className="disclaimer">* Note: This is an AI cosmetic analysis, not medical advice.</p>
                      <button className="btn-secondary mt-16" onClick={() => { setSkinImage(null); setSkinAnalysisResult(null); }}>
                        Start Over
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "fashion" && (
              <div className="tab-pane fashion-pane fade-in">
                <h2>Find Your Perfect Look</h2>
                <p className="description">Snap a picture and tell us your event. We'll generate a stunning personalized style for you.</p>
                <div className="action-area">
                  {!fashionImage ? (
                    <CameraUpload onImageCapture={(dataUrl) => { setFashionImage(dataUrl); setFashionResult(null); }} />
                  ) : !fashionResult ? (
                    <div className="preview-container">
                      <img src={fashionImage} alt="Captured for Fashion Stylist" className="image-preview" style={{ opacity: isGeneratingStyle ? 0.5 : 1 }} />
                      <div className="input-group" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '400px' }}>
                        <input 
                          type="text" 
                          placeholder="What's the occasion? (e.g. Summer Wedding)" 
                          className="text-input"
                          value={fashionEvent}
                          onChange={(e) => setFashionEvent(e.target.value)}
                          disabled={isGeneratingStyle}
                        />
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                          <button className="btn-secondary" onClick={() => setFashionImage(null)} disabled={isGeneratingStyle}>
                            Retake Photo
                          </button>
                          <button className="btn-primary" onClick={runFashionStylist} disabled={!fashionEvent.trim() || isGeneratingStyle}>
                            {isGeneratingStyle ? `Generating... (~${countdown}s)` : "Generate Your Style"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="results-container fade-in fashion-results">
                      <h3 style={{marginBottom: '16px', color: 'var(--rose-gold-light)', fontSize: '1.4rem'}}>Recommended Outfits</h3>
                      {fashionResult.recommendations.map((rec, index) => (
                        <div key={index} className="result-card style-card">
                          <div className="style-info">
                            <h4>{rec.name}</h4>
                            <p>{rec.description}</p>
                          </div>
                          <div className="style-image-container">
                            {rec.imageUrl ? (
                               <img src={rec.imageUrl} alt={rec.name} className="dalle-preview" />
                            ) : (
                               <div className="generate-placeholder">
                                  <button 
                                     className="btn-secondary" 
                                     onClick={() => generateExtraImage(index)}
                                     disabled={generatingExtraImage === index}
                                  >
                                    {generatingExtraImage === index ? `Generating... (~${countdown}s)` : "Generate Visual"}
                                  </button>
                               </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <button className="btn-secondary mt-16" onClick={() => { setFashionImage(null); setFashionResult(null); setFashionEvent(""); }}>
                        Start Over
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
