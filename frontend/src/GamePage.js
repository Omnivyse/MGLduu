import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import config from './config';

const GamePage = () => {
  const { difficulty } = useParams();
  const navigate = useNavigate();
  const [gameCard, setGameCard] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const handleGameMode = (mode) => {
    // Navigate to the specific game mode
    if (mode === 'read-choose') {
      navigate(`/game/${difficulty}/read-choose`);
    } else if (mode === 'choose-complete') {
      navigate(`/game/${difficulty}/choose-complete`);
    }
  };

  const goBack = () => {
    navigate('/');
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

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={goBack} style={styles.backButton}>
          ← Back to Home
        </button>
        <h1 style={styles.title}>{gameCard.name}</h1>
        <p style={styles.description}>{gameCard.description}</p>
      </div>

      <div style={styles.content}>
        <div style={styles.gameModes}>
          <h2 style={styles.subtitle}>Тоглох арга сонгох</h2>
          <p style={styles.instruction}>Choose your game mode:</p>
          
          <div style={styles.modeButtons}>
            <button 
              onClick={() => handleGameMode('read-choose')}
              style={styles.modeButton}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                e.target.style.border = '2px solid rgba(255, 255, 255, 0.5)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <div style={styles.modeIcon}>📖</div>
              <div style={styles.modeContent}>
                <h3 style={styles.modeTitle}>Уншаад сонгох</h3>
                <p style={styles.modeDescription}>
                  Read all challenges first, then choose which one to complete
                </p>
              </div>
            </button>

            <button 
              onClick={() => handleGameMode('choose-complete')}
              style={styles.modeButton}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                e.target.style.border = '2px solid rgba(255, 255, 255, 0.5)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.border = '2px solid rgba(255, 255, 255, 0.3)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <div style={styles.modeIcon}>🎯</div>
              <div style={styles.modeContent}>
                <h3 style={styles.modeTitle}>Сонгоод Биелүүлэх</h3>
                <p style={styles.modeDescription}>
                  Choose a challenge randomly and complete it immediately
                </p>
              </div>
            </button>
          </div>
        </div>

        <div style={styles.cardInfo}>
          <h3 style={styles.infoTitle}>Card Information</h3>
          <div style={styles.infoGrid}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Difficulty:</span>
              <span style={styles.infoValue}>{gameCard.difficulty}</span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>Challenges:</span>
              <span style={styles.infoValue}>{gameCard.challenges.length}</span>
            </div>
          </div>
        </div>
      </div>
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
  gameModes: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '20px',
    padding: '40px',
    marginBottom: '30px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  },
  subtitle: {
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
    margin: '0 0 30px 0'
  },
  modeButtons: {
    display: 'flex',
    gap: '20px',
    flexDirection: 'column'
  },
  modeButton: {
    background: 'rgba(255, 255, 255, 0.15)',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    borderRadius: '15px',
    padding: '25px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)'
  },
  modeIcon: {
    fontSize: '3rem',
    minWidth: '60px',
    textAlign: 'center'
  },
  modeContent: {
    flex: 1
  },
  modeTitle: {
    color: 'white',
    fontSize: '1.5rem',
    margin: '0 0 8px 0',
    fontWeight: 'bold',
    textShadow: '1px 1px 2px rgba(0, 0, 0, 0.3)'
  },
  modeDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '1rem',
    margin: '0',
    lineHeight: '1.4'
  },
  cardInfo: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '15px',
    padding: '25px',
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
    gridTemplateColumns: '1fr 1fr',
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
  }
};

export default GamePage; 