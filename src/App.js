import React, { useState, useEffect, useMemo } from 'react';
import './App.css';

// --- Fuzzy Matching Helpers ---
function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i-1] === a[j-1]) matrix[i][j] = matrix[i-1][j-1];
      else matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, matrix[i][j-1] + 1, matrix[i-1][j] + 1);
    }
  }
  return matrix[b.length][a.length];
}

function isSimilar(input, answer) {
  const clean = (s) => s.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '');
  const inp = clean(input);
  const ans = clean(answer);
  if (inp === '') return false;
  if (inp === ans) return true;
  if (inp.includes(ans) || ans.includes(inp)) return true;
  if (ans.length > 4 && levenshteinDistance(inp, ans) <= 2) return true;
  return false;
}

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

function App() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentChapterIdx, setCurrentChapterIdx] = useState(0);
  const [sessionWords, setSessionWords] = useState([]);
  const [currentWordPtr, setCurrentWordPtr] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const [inputValue, setInputValue] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [isAnswered, setIsAnswered] = useState(false);

  // NEW: filter state
  const [filter, setFilter] = useState('all');

  // Progress structure
  const [progress, setProgress] = useState({});
  const [showWordModal, setShowWordModal] = useState(false);

  // Load progress
  useEffect(() => {
    const saved = localStorage.getItem('adiboi_a2_progress_v2');
    if (saved) setProgress(JSON.parse(saved));
  }, []);

  // Save progress
  useEffect(() => {
    if (Object.keys(progress).length > 0) {
      localStorage.setItem('adiboi_a2_progress_v2', JSON.stringify(progress));
    }
  }, [progress]);

  // Fetch chapters
  useEffect(() => {
    const chapterPromises = [];
    for (let i = 1; i <= 12; i++) {
      chapterPromises.push(
        fetch(`/data/A2Chapter${i}.json`)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to load A2Chapter${i}.json`);
            return res.json();
          })
      );
    }
    Promise.all(chapterPromises)
      .then(data => {
        setChapters(data);
        setLoading(false);
        // No direct initialize here – the effect below will handle it
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Filtered words based on current chapter + filter
  const filteredWords = useMemo(() => {
    const chapterWords = chapters[currentChapterIdx] || [];
    if (filter === 'all') return chapterWords;
    return chapterWords.filter(word => word.type === filter);
  }, [chapters, currentChapterIdx, filter]);

  // Initialize session when chapter or filter changes
  useEffect(() => {
    if (chapters.length === 0) return;
    initializeChapter(currentChapterIdx, chapters, filteredWords);
  }, [filter, currentChapterIdx, chapters, filteredWords]);

  const initializeChapter = (index, dataArray = chapters, wordList = null) => {
    if (!dataArray[index]) return;
    const sourceWords = wordList || dataArray[index];
    if (sourceWords.length === 0) {
      setSessionWords([]);
      setIsFinished(false);
      return;
    }
    const shuffled = shuffleArray(sourceWords);
    setSessionWords(shuffled);
    setCurrentWordPtr(0);
    setIsFinished(false);
    setInputValue("");
    setShowAnswer(false);
    setIsAnswered(false);
    setShowWordModal(false);
  };

  const handleSelectChapter = (index) => {
    if (index === currentChapterIdx && sessionWords.length > 0) return;
    setCurrentChapterIdx(index);
    setFilter('all'); // Reset filter when switching chapters
  };

  const handleResetChapter = (index) => {
    const total = chapters[index]?.length || 0;
    const prog = progress[index] || { correct: [], wrong: [] };
    if (prog.correct.length < total) {
      if (!window.confirm("Are you sure you want to reset your progress for this chapter?")) return;
    }
    setProgress(prev => ({ ...prev, [index]: { correct: [], wrong: [] } }));
    if (index === currentChapterIdx) {
      initializeChapter(index, chapters, filteredWords); // Respect current filter
    }
  };

  const currentWord = sessionWords[currentWordPtr];
  const totalWordsInChapter = chapters[currentChapterIdx]?.length || 0;
  const progForChapter = progress[currentChapterIdx] || { correct: [], wrong: [] };
  const percentComplete = totalWordsInChapter > 0
    ? Math.round((progForChapter.correct.length / totalWordsInChapter) * 100)
    : 0;

  const handleSubmit = () => {
    if (isAnswered || !currentWord) return;
    const userAnswer = inputValue.trim();
    const correctAnswer = currentWord.english;
    const correct = isSimilar(userAnswer, correctAnswer);

    setShowAnswer(true);
    setIsAnswered(true);

    setProgress(prev => {
      const chapterProg = prev[currentChapterIdx] || { correct: [], wrong: [] };
      return {
        ...prev,
        [currentChapterIdx]: {
          correct: correct ? [...chapterProg.correct, currentWord] : chapterProg.correct,
          wrong: !correct ? [...chapterProg.wrong, currentWord] : chapterProg.wrong
        }
      };
    });
  };

  const handleReveal = () => {
    if (isAnswered) return;
    setShowAnswer(true);
    setIsAnswered(true);
    setProgress(prev => {
      const chapterProg = prev[currentChapterIdx] || { correct: [], wrong: [] };
      return {
        ...prev,
        [currentChapterIdx]: {
          correct: chapterProg.correct,
          wrong: [...chapterProg.wrong, currentWord]
        }
      };
    });
  };

  const handleNext = () => {
    if (!isAnswered) return;
    const nextPtr = currentWordPtr + 1;
    if (nextPtr >= sessionWords.length) {
      setIsFinished(true);
    } else {
      setCurrentWordPtr(nextPtr);
      setInputValue("");
      setShowAnswer(false);
      setIsAnswered(false);
    }
  };

  if (loading) return <div className="app-container"><h1 style={{color:'#58a6ff'}}>Loading your chapters...</h1></div>;
  if (error) return <div className="app-container"><h1 style={{color:'#f85149'}}>Error: {error}</h1><p>Make sure JSON files are in public/data/</p></div>;

  return (
    <div className="app">
      <div className="sidebar-wrapper">
        <div className="sidebar-trigger"></div>
        <div className="sidebar">
          <h2>📚 A2 Kapitel</h2>
          {chapters.map((ch, idx) => {
            const prog = progress[idx] || { correct: [], wrong: [] };
            const total = ch.length;
            const percent = total > 0 ? Math.round((prog.correct.length / total) * 100) : 0;
            return (
              <div key={idx} className="chapter-item">
                <div
                  className={`chapter-button ${currentChapterIdx === idx ? 'active' : ''}`}
                  onClick={() => handleSelectChapter(idx)}
                >
                  <div className="chapter-label">Kapitel {idx + 1}</div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
                  </div>
                  <div className="progress-text">{percent}%</div>
                </div>
                <button className="reset-btn" onClick={() => handleResetChapter(idx)} title="Reset this chapter's progress">Reset</button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="app-container">
        <h1 className="app-title">Adiboi's German Time(A2)</h1>

        {/* FILTER DROPDOWN */}
        <div className="filter-container">
          <label htmlFor="filter-select">Filter: </label>
          <select id="filter-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All words</option>
            <option value="verb">Verbs</option>
            <option value="noun">Nouns</option>
            <option value="adjective">Adjectives</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Top Progress Bar */}
        {currentWord && !isFinished && (
          <div className="top-progress-container">
            <div className="top-progress-info">
              <span><span className="top-progress-label">Word:</span> <span className="top-progress-value">{currentWordPtr + 1} / {sessionWords.length}</span></span>
              <span><span className="top-progress-label">Correct:</span> <span className="top-progress-value">{progForChapter.correct.length} / {totalWordsInChapter}</span></span>
            </div>
            <div className="top-bar-track">
              <div className="top-bar-fill" style={{ width: `${percentComplete}%` }}></div>
            </div>
          </div>
        )}

        {/* Game Card */}
        <div className="card">
          {(!currentWord || isFinished) && sessionWords.length === 0 ? (
            <div className="chapter-complete">
              <h2>No words of this type in this chapter</h2>
              <button className="big-btn" onClick={() => setFilter('all')}>Show all words</button>
            </div>
          ) : (!currentWord || isFinished) ? (
            <div className="chapter-complete">
              <h2>🎉 Kapitel {currentChapterIdx + 1} Abgeschlossen!</h2>
              <p>Correct: {progForChapter.correct.length} / {totalWordsInChapter}</p>
              <button className="big-btn" onClick={() => initializeChapter(currentChapterIdx, chapters, filteredWords)}>Shuffle & Play Again</button>
            </div>
          ) : (
            <>
              <div className="german-word">{currentWord.german}</div>
              <div className="grammar-info">{currentWord.info}</div>
              {currentWord.example && <div className="example-sentence">"{currentWord.example}"</div>}

              <div className="input-group">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !isAnswered && handleSubmit()}
                  disabled={isAnswered}
                  placeholder="Type English meaning..."
                  autoFocus
                />
                <button className="btn-submit" onClick={handleSubmit} disabled={isAnswered}>Submit</button>
                <button className="btn-reveal" onClick={handleReveal} disabled={isAnswered}>Show Answer</button>
              </div>

              {showAnswer && (
                <div className="answer-reveal">
                  <div className="correct-answer">🇬🇧 {currentWord.english}</div>
                  <div className={`result-message ${inputValue.trim() === '' ? 'wrong' : (isSimilar(inputValue.trim(), currentWord.english) ? 'correct' : 'wrong')}`}>
                    {inputValue.trim() === ''
                      ? '👀 Revealed - Marked as Wrong'
                      : isSimilar(inputValue.trim(), currentWord.english)
                        ? '✅ Correct!'
                        : '❌ Wrong!'}
                  </div>
                </div>
              )}

              {isAnswered && (
                <button className="next-btn" onClick={handleNext}>
                  Next → ({currentWordPtr + 1} / {sessionWords.length})
                </button>
              )}
            </>
          )}
        </div>

        {/* Modal Button & Modal */}
        {totalWordsInChapter > 0 && (
          <button className="open-modal-btn" onClick={() => setShowWordModal(true)}>
            📖 View Learned & Failed Words
          </button>
        )}

        {showWordModal && (
          <div className="modal-overlay" onClick={() => setShowWordModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowWordModal(false)}>×</button>
              <h2>Kapitel {currentChapterIdx + 1} - Wortliste</h2>
              <h3>✅ Correct ({progForChapter.correct.length})</h3>
              {progForChapter.correct.length === 0 ? (
                <p style={{color: '#8b949e'}}>No words learned yet.</p>
              ) : (
                progForChapter.correct.map((w, i) => (
                  <div key={i} className="word-list-item correct">
                    <span>{w.german}</span>
                    <span style={{color: '#8b949e', fontSize: '0.85rem'}}>{w.english}</span>
                  </div>
                ))
              )}
              <h3>❌ Wrong ({progForChapter.wrong.length})</h3>
              {progForChapter.wrong.length === 0 ? (
                <p style={{color: '#8b949e'}}>No failed words. Keep it up!</p>
              ) : (
                progForChapter.wrong.map((w, i) => (
                  <div key={i} className="word-list-item wrong">
                    <span>{w.german}</span>
                    <span style={{color: '#8b949e', fontSize: '0.85rem'}}>{w.english}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;