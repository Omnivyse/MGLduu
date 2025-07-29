import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import config from './config';

const ChooseCompleteGame = () => {
  const { difficulty } = useParams();
  const navigate = useNavigate();
  const [gameCard, setGameCard] = useState(null);
  const [players, setPlayers] = useState(['']);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentChallenge, setCurrentChallenge] = useState('');
  const [usedChallenges, setUsedChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [resultType, setResultType] = useState('');
  const [scoreboard, setScoreboard] = useState({});
  const [showChoice, setShowChoice] = useState(true);
  const [selectedChoice, setSelectedChoice] = useState('');

  useEffect(() => {
    fetchGameCard();
  }, [difficulty]);

  const fetchGameCard = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/game-cards`);
      if (response.ok) {
        const cards = await response.json();
        const card = cards.find(c => c.difficulty === difficulty);
        if (card) {
          setGameCard(card);
        } else {
          navigate('/');
        }
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching game card:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const addPlayer = () => {
    setPlayers([...players, '']);
  };

  const removePlayer = (index) => {
    if (players.length > 1) {
      const newPlayers = players.filter((_, i) => i !== index);
      setPlayers(newPlayers);
    }
  };

  const updatePlayer = (index, value) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const startGame = () => {
    if (players.length < 2) {
      alert('At least 2 players are required!');
      return;
    }
    if (players.some(player => !player.trim())) {
      alert('All players must have names!');
      return;
    }
    
    // Initialize scoreboard
    const initialScoreboard = {};
    players.forEach(player => {
      initialScoreboard[player] = { dares: 0, drinks: 0, skips: 0 };
    });
    setScoreboard(initialScoreboard);
    setGameStarted(true);
    generateNewChallenge();
  };

  const generateNewChallenge = () => {
    if (!gameCard) return;

    // Get available challenges (not used yet)
    const availableChallenges = gameCard.challenges.filter(
      challenge => !usedChallenges.includes(challenge)
    );

    if (availableChallenges.length === 0) {
      // All challenges used, reset
      setUsedChallenges([]);
      const randomChallenge = gameCard.challenges[Math.floor(Math.random() * gameCard.challenges.length)];
      setCurrentChallenge(randomChallenge);
    } else {
      // Pick random available challenge
      const randomChallenge = availableChallenges[Math.floor(Math.random() * availableChallenges.length)];
      setCurrentChallenge(randomChallenge);
      setUsedChallenges([...usedChallenges, randomChallenge]);
    }
    
    // Reset choice state for new player
    setShowChoice(true);
    setSelectedChoice('');
  };

  const handleChoice = (choice) => {
    setSelectedChoice(choice);
    setShowChoice(false);
    
    // Update scoreboard based on choice
    const currentPlayer = players[currentPlayerIndex];
    const updatedScoreboard = { ...scoreboard };
    
    if (choice === 'complete') {
      updatedScoreboard[currentPlayer].dares += 1;
    } else if (choice === 'drink') {
      updatedScoreboard[currentPlayer].drinks += 1;
    }
    
    setScoreboard(updatedScoreboard);
  };

  const handleNext = () => {
    // Move to next player
    const nextPlayerIndex = (currentPlayerIndex + 1) % players.length;
    setCurrentPlayerIndex(nextPlayerIndex);
    
    // Generate new challenge for next player
    generateNewChallenge();
  };

  const goBack = () => {
    navigate(`/game/${difficulty}`);
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!gameCard) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>Game card not found</div>
        <button onClick={goBack} style={styles.backButton}>Go Back</button>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={goBack} style={styles.backButton}>
            ← Back
          </button>
          <h1 style={styles.title}>Сонгоод Биелүүлэх</h1>
          <p style={styles.description}>Add players and start the game</p>
        </div>

        <div style={styles.content}>
          <div style={styles.playerSection}>
            <h2 style={styles.sectionTitle}>Тоглогчид</h2>
            <p style={styles.instruction}>Add player names:</p>
            
            {players.map((player, index) => (
              <div key={index} style={styles.playerInput}>
                <input
                  type="text"
                  value={player}
                  onChange={(e) => updatePlayer(index, e.target.value)}
                  placeholder={`Player ${index + 1} name`}
                  style={styles.input}
                />
                {players.length > 1 && (
                  <button 
                    onClick={() => removePlayer(index)}
                    style={styles.removeButton}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            
            <button onClick={addPlayer} style={styles.addButton}>
              + Add Player
            </button>
          </div>

          <div style={styles.gameInfo}>
            <h3 style={styles.infoTitle}>Game Information</h3>
            <div style={styles.infoGrid}>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Card:</span>
                <span style={styles.infoValue}>{gameCard.name}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Challenges:</span>
                <span style={styles.infoValue}>{gameCard.challenges.length}</span>
              </div>
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>Players:</span>
                <span style={styles.infoValue}>{players.length}</span>
              </div>
            </div>
          </div>

          <button onClick={startGame} style={styles.startButton}>
            Start Game
          </button>
        </div>
      </div>
    );
  }

  // Game in progress
  const currentPlayer = players[currentPlayerIndex];
  const progress = ((usedChallenges.length) / gameCard.challenges.length) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={goBack} style={styles.backButton}>
          ← Back
        </button>
        <h1 style={styles.title}>Сонгоод Биелүүлэх</h1>
        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: `${progress}%`}}></div>
        </div>
        <p style={styles.progressText}>
          Used {usedChallenges.length} of {gameCard.challenges.length} challenges
        </p>
      </div>

      <div style={styles.content}>
        <div style={styles.playerTurn}>
          <h2 style={styles.playerName}>{currentPlayer}'s Turn</h2>
        </div>

        {showChoice ? (
          <div style={styles.choiceSection}>
            <h3 style={styles.choiceTitle}>Эхлээд сонгоно уу:</h3>
            <div style={styles.choiceButtons}>
              <button 
                onClick={() => handleChoice('complete')}
                style={styles.choiceButtonComplete}
              >
                <div style={styles.choiceIcon}>✅</div>
                <div style={styles.choiceText}>Биелүүлэх</div>
                <div style={styles.choiceSubtext}>Complete Challenge</div>
              </button>
              
              <button 
                onClick={() => handleChoice('drink')}
                style={styles.choiceButtonDrink}
              >
                <div style={styles.choiceIcon}>🍺</div>
                <div style={styles.choiceText}>Уух</div>
                <div style={styles.choiceSubtext}>Drink Instead</div>
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={styles.challengeCard}>
              <h3 style={styles.challengeTitle}>Challenge:</h3>
              <p style={styles.challengeText}>{currentChallenge}</p>
              <div style={styles.selectedChoice}>
                <p style={styles.selectedChoiceText}>
                  {selectedChoice === 'complete' ? '✅ Биелүүлэх' : '🍺 Уух'}
                </p>
              </div>
            </div>

            <div style={styles.scoreboardSection}>
              <h3 style={styles.scoreboardTitle}>Scoreboard</h3>
              <div style={styles.scoreboardGrid}>
                {players.map((player, index) => (
                  <div key={index} style={styles.playerScore}>
                    <div style={styles.playerName}>{player}</div>
                    <div style={styles.scoreStats}>
                      <div style={styles.scoreItem}>
                        <span style={styles.scoreLabel}>✅ Dares:</span>
                        <span style={styles.scoreValue}>{scoreboard[player]?.dares || 0}</span>
                      </div>
                      <div style={styles.scoreItem}>
                        <span style={styles.scoreLabel}>🍺 Drinks:</span>
                        <span style={styles.scoreValue}>{scoreboard[player]?.drinks || 0}</span>
                      </div>
                      <div style={styles.scoreItem}>
                        <span style={styles.scoreLabel}>⏭️ Skips:</span>
                        <span style={styles.scoreValue}>{scoreboard[player]?.skips || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.nextSection}>
              <button 
                onClick={handleNext}
                style={styles.nextButton}
              >
                <div style={styles.nextIcon}>⏭️</div>
                <div style={styles.nextText}>Дараагийн тоглогч</div>
                <div style={styles.nextSubtext}>Next Player</div>
              </button>
            </div>
          </>
        )}

        <div style={styles.nextPlayer}>
          <p style={styles.nextPlayerText}>
            Next: {players[(currentPlayerIndex + 1) % players.length]}
          </p>
        </div>
      </div>

      {/* Result Notification */}
      {showResult && (
        <div style={styles.resultOverlay}>
          <div style={{
            ...styles.resultCard,
            ...(resultType === 'do' && styles.resultCardDo),
            ...(resultType === 'drink' && styles.resultCardDrink),
            ...(resultType === 'skip' && styles.resultCardSkip),
            ...(resultType === 'finished' && styles.resultCardFinished)
          }}>
            <div style={styles.resultIcon}>
              {resultType === 'do' && '✅'}
              {resultType === 'drink' && '🍺'}
              {resultType === 'skip' && '⏭️'}
              {resultType === 'finished' && '🎉'}
            </div>
            <h3 style={styles.resultTitle}>
              {resultType === 'do' && 'Биелүүлэх!'}
              {resultType === 'drink' && 'Ууна!'}
              {resultType === 'skip' && 'Алгасагдлаа!'}
              {resultType === 'finished' && 'Тоглоом дууслаа!'}
            </h3>
            <p style={styles.resultText}>{resultMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: '20px',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  backButton: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    background: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '25px',
    padding: '12px 24px',
    fontSize: '16px',
    cursor: 'pointer',
    backdropFilter: 'blur(10px)',
    transition: 'all 0.3s ease'
  },
  title: {
    color: 'white',
    fontSize: '3rem',
    margin: '20px 0 10px 0',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
    fontWeight: 'bold'
  },
  description: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '1.2rem',
    margin: '0',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
  },
  content: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  playerSection: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '30px',
    marginBottom: '30px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  sectionTitle: {
    color: 'white',
    fontSize: '2rem',
    margin: '0 0 10px 0',
    textAlign: 'center',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
  },
  instruction: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '1.1rem',
    textAlign: 'center',
    margin: '0 0 20px 0'
  },
  playerInput: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    alignItems: 'center'
  },
  input: {
    flex: 1,
    padding: '12px 15px',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '10px',
    fontSize: '16px',
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    backdropFilter: 'blur(10px)'
  },
  removeButton: {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '35px',
    height: '35px',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  addButton: {
    background: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    marginTop: '10px',
    width: '100%'
  },
  gameInfo: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '15px',
    padding: '25px',
    marginBottom: '30px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  infoTitle: {
    color: 'white',
    fontSize: '1.3rem',
    margin: '0 0 15px 0',
    textAlign: 'center',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '15px'
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 15px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  infoLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '0.9rem',
    fontWeight: 'bold'
  },
  infoValue: {
    color: 'white',
    fontSize: '1rem',
    fontWeight: 'bold',
    textTransform: 'capitalize'
  },
  startButton: {
    background: '#f39c12',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    padding: '15px 30px',
    fontSize: '1.2rem',
    cursor: 'pointer',
    width: '100%',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    background: 'rgba(255, 255, 255, 0.2)',
    borderRadius: '4px',
    margin: '20px 0',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    background: '#f39c12',
    transition: 'width 0.3s ease'
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '1rem',
    margin: '0'
  },
  playerTurn: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  playerName: {
    color: 'white',
    fontSize: '2.5rem',
    margin: '0',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
    fontWeight: 'bold'
  },
  challengeCard: {
    background: 'rgba(255, 255, 255, 0.15)',
    borderRadius: '20px',
    padding: '40px',
    marginBottom: '40px',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    textAlign: 'center'
  },
  challengeTitle: {
    color: 'white',
    fontSize: '1.5rem',
    margin: '0 0 20px 0',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
  },
  challengeText: {
    color: 'white',
    fontSize: '2rem',
    margin: '0',
    lineHeight: '1.4',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)',
    fontWeight: 'bold'
  },
  swipeSection: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  swipeTitle: {
    color: 'white',
    fontSize: '1.3rem',
    margin: '0 0 20px 0',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
  },
  swipeButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  swipeButtonLeft: {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    padding: '30px 40px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    minWidth: '150px',
    transition: 'all 0.3s ease'
  },
  swipeButtonRight: {
    background: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    padding: '30px 40px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    minWidth: '150px',
    transition: 'all 0.3s ease'
  },
  swipeIcon: {
    fontSize: '3rem'
  },
  swipeText: {
    fontSize: '1.5rem',
    fontWeight: 'bold'
  },
  swipeSubtext: {
    fontSize: '1rem',
    opacity: '0.8'
  },

  skipButton: {
    background: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    padding: '30px 40px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    minWidth: '150px',
    transition: 'all 0.3s ease'
  },
  skipIcon: {
    fontSize: '2rem'
  },
  skipText: {
    fontSize: '1.2rem',
    fontWeight: 'bold'
  },
  skipSubtext: {
    fontSize: '0.9rem',
    opacity: '0.8'
  },
  scoreboardSection: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '15px',
    padding: '25px',
    marginBottom: '30px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  scoreboardTitle: {
    color: 'white',
    fontSize: '1.5rem',
    margin: '0 0 20px 0',
    textAlign: 'center',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
  },
  scoreboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '15px'
  },
  playerScore: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    padding: '15px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  playerName: {
    color: 'white',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '10px',
    textAlign: 'center',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
  },
  scoreStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  scoreItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '5px 0'
  },
  scoreLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '0.9rem'
  },
  scoreValue: {
    color: 'white',
    fontSize: '1rem',
    fontWeight: 'bold'
  },
  choiceSection: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '40px',
    marginBottom: '30px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    textAlign: 'center'
  },
  choiceTitle: {
    color: 'white',
    fontSize: '2rem',
    margin: '0 0 30px 0',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
  },
  choiceButtons: {
    display: 'flex',
    gap: '30px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  choiceButtonComplete: {
    background: '#27ae60',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    padding: '40px 50px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    minWidth: '200px',
    transition: 'all 0.3s ease'
  },
  choiceButtonDrink: {
    background: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    padding: '40px 50px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    minWidth: '200px',
    transition: 'all 0.3s ease'
  },
  choiceIcon: {
    fontSize: '4rem'
  },
  choiceText: {
    fontSize: '2rem',
    fontWeight: 'bold'
  },
  choiceSubtext: {
    fontSize: '1rem',
    opacity: '0.8'
  },
  selectedChoice: {
    marginTop: '20px',
    padding: '15px',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  selectedChoiceText: {
    color: 'white',
    fontSize: '1.2rem',
    margin: '0',
    fontWeight: 'bold',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
  },
  nextSection: {
    textAlign: 'center',
    marginTop: '30px'
  },
  nextButton: {
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '15px',
    padding: '20px 40px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    fontSize: '1.2rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)'
  },
  nextIcon: {
    fontSize: '2rem'
  },
  nextText: {
    fontSize: '1.5rem',
    fontWeight: 'bold'
  },
  nextSubtext: {
    fontSize: '1rem',
    opacity: '0.8'
  },
  nextPlayer: {
    textAlign: 'center',
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '15px',
    padding: '20px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  nextPlayerText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: '1.2rem',
    margin: '0',
    fontWeight: 'bold'
  },
  loading: {
    color: 'white',
    fontSize: '1.5rem',
    textAlign: 'center',
    marginTop: '50px'
  },
  error: {
    color: 'white',
    fontSize: '1.5rem',
    textAlign: 'center',
    marginTop: '50px'
  },
  resultOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(5px)'
  },
  resultCard: {
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    padding: '40px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    animation: 'slideIn 0.3s ease-out'
  },
  resultCardDo: {
    border: '4px solid #27ae60'
  },
  resultCardDrink: {
    border: '4px solid #e74c3c'
  },
  resultCardSkip: {
    border: '4px solid #95a5a6'
  },
  resultCardFinished: {
    border: '4px solid #f39c12'
  },
  resultIcon: {
    fontSize: '4rem',
    marginBottom: '20px'
  },
  resultTitle: {
    fontSize: '2rem',
    margin: '0 0 15px 0',
    fontWeight: 'bold',
    color: '#333'
  },
  resultText: {
    fontSize: '1.2rem',
    margin: '0',
    color: '#666',
    lineHeight: '1.4'
  }
};

export default ChooseCompleteGame; 