import React, { useState } from 'react';

const BundleCard = ({ bundle, downloadingMp3, downloadingMp4, downloadProgress, downloadPercentage, onDownloadMp3, onDownloadMp4, user, onBuyClick, downloadTime, remainingTime }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showSongs, setShowSongs] = useState(false);

  const handleToggleSongs = () => {
    if (bundle?.links && bundle.links.length > 0) {
      setShowSongs(s => !s);
    }
  };

  return (
    <div 
      className="specialBundleCard"
      style={{
        ...styles.specialBundleCard,
        transform: isHovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 12px 35px rgba(0,0,0,0.2)' : '0 8px 25px rgba(0,0,0,0.15)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
    <div style={styles.bundleHeader}>
      <h3 className="bundleName" style={styles.bundleName}>{bundle?.name || 'Unknown Bundle'}</h3>
      <div
        className="bundleCount"
        style={{
          ...styles.bundleCount,
          cursor: bundle?.links && bundle.links.length > 0 ? 'pointer' : 'default',
          border: '2px solid #FF6B6B',
          boxShadow: showSongs ? '0 0 0 2px #FF6B6B' : undefined
        }}
        onClick={handleToggleSongs}
        title={bundle?.links && bundle.links.length > 0 ? 'Show song names' : ''}
      >
        {bundle === null ? '...' : (typeof bundle.piece === 'number' ? `${bundle.piece} ширхэг дуу` : `${bundle?.links?.length || 0} ширхэг дуу`)}
      </div>
      {showSongs && bundle?.links && bundle.links.length > 0 && (
        <ul className="songList" style={styles.songList}>
          {bundle.links.map((song, idx) => (
            <li key={idx} className="songListItem" style={styles.songListItem}>
              {song.name ? song.name : song.url}
            </li>
          ))}
        </ul>
      )}
    </div>
    <div className="bundleDescription" style={styles.bundleDescription}>
      {bundle?.imageBase64 ? (
        <img src={bundle.imageBase64} alt={bundle.name} style={styles.bundleImage} />
      ) : bundle?.imageUrl ? (
        <img src={bundle.imageUrl} alt={bundle.name} style={styles.bundleImage} />
      ) : (
        'Монгол уран зохиолын сонгодог дуунууд'
      )}
    </div>
    {downloadProgress && downloadProgress.trim() !== '' && (
      <div className="progressContainer" style={styles.progressContainer}>
        {/* Warning Message */}
        <div style={{
          backgroundColor: '#fff3cd',
          color: '#856404',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid #ffeaa7',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          ⚠️ Анхааруулга: Таталт эхэлсэн үед хуудас шинэчлэхийг хориглоно!
        </div>
        
        <div className="progressText" style={styles.progressText}>
          {downloadProgress}
        </div>
        
        {/* Download Time */}
        <div style={{
          fontSize: '0.85rem',
          color: '#666',
          marginTop: '5px',
          fontStyle: 'italic',
          textAlign: 'center'
        }}>
          Download time: {downloadTime || 'Starting...'}
        </div>
        
        {/* Remaining Time */}
        <div style={{
          fontSize: '0.85rem',
          color: '#e74c3c',
          marginTop: '3px',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          Remaining: {remainingTime || 'Calculating...'}
        </div>
        
        <div className="progressBarContainer" style={styles.progressBarContainer}>
          <div 
            style={{
              ...styles.progressBar,
              width: `${downloadPercentage}%`
            }}
          />
          <span className="progressPercentage" style={styles.progressPercentage}>
            {downloadPercentage > 0 ? `${downloadPercentage}%` : 'Starting...'}
          </span>
        </div>
      </div>
    )}
    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '25px', flexWrap: 'wrap' }}>
      {/* Check if user has access to this bundle's category */}
      {user && user.categories && bundle.category && user.categories.includes(bundle.category) ? (
        // User has access - show download buttons
        <>
          <button
            className="downloadAllButton"
            onClick={onDownloadMp3}
            disabled={downloadingMp3 || downloadingMp4 || !bundle || !bundle.links || bundle.links.length === 0}
            style={{
              ...styles.downloadAllButton,
              opacity: downloadingMp3 ? 0.7 : 1,
              cursor: downloadingMp3 ? 'not-allowed' : 'pointer'
            }}
          >
            {downloadingMp3 ? 'MP3 татаж байна...' : 'Бүгдийг MP3 татах'}
          </button>
          <button
            className="downloadAllButton"
            onClick={onDownloadMp4}
            disabled={downloadingMp3 || downloadingMp4 || !bundle || !bundle.links || bundle.links.length === 0}
            style={{
              ...styles.downloadAllButton,
              opacity: downloadingMp4 ? 0.7 : 1,
              cursor: downloadingMp4 ? 'not-allowed' : 'pointer'
            }}
          >
            {downloadingMp4 ? 'MP4 татаж байна...' : 'Бүгдийг MP4 татах'}
          </button>
        </>
      ) : (
        // User doesn't have access - show buy button
        <button
          className="downloadAllButton"
          onClick={onBuyClick}
          style={{
            ...styles.downloadAllButton,
            backgroundColor: '#27ae60',
            boxShadow: '0 4px 15px rgba(39, 174, 96, 0.3)'
          }}
        >
          Худалдаж авах
        </button>
      )}
    </div>
  </div>
  );
};

const styles = {
  specialBundleCard: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '25px',
    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
    width: '100%',
    minHeight: '300px',
    textAlign: 'center',
    border: '3px solid #FF6B6B',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  bundleHeader: {
    marginBottom: '20px',
    textAlign: 'center'
  },
  bundleName: {
    fontSize: '1.4rem',
    color: '#2c3e50',
    margin: '0 0 15px 0',
    fontWeight: 'bold',
    lineHeight: '1.3'
  },
  bundleCount: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    backgroundColor: '#FF6B6B',
    color: 'white',
    padding: '6px 16px',
    borderRadius: '20px',
    display: 'inline-block',
    marginTop: '10px'
  },
  bundleDescription: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '20px',
    lineHeight: '1.5',
    textAlign: 'center'
  },
  bundleImage: {
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '8px',
    marginBottom: '15px'
  },
  downloadAllButton: {
    padding: '12px 20px',
    backgroundColor: '#FF6B6B',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
    minWidth: '140px',
    whiteSpace: 'nowrap'
  },
  progressText: {
    fontSize: '0.9rem',
    color: '#666',
    marginTop: '10px',
    fontStyle: 'italic'
  },
  progressContainer: {
    marginTop: '15px',
    marginBottom: '10px'
  },
  progressBarContainer: {
    position: 'relative',
    width: '100%',
    height: '20px',
    backgroundColor: '#f0f0f0',
    borderRadius: '10px',
    marginTop: '8px',
    overflow: 'hidden',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: '10px',
    transition: 'width 0.3s ease',
    background: 'linear-gradient(90deg, #FF6B6B 0%, #FF8E8E 100%)',
    boxShadow: '0 1px 3px rgba(255, 107, 107, 0.3)'
  },
  progressPercentage: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '0.8rem',
    fontWeight: 'bold',
    color: '#333',
    textShadow: '0 1px 2px rgba(255,255,255,0.8)'
  },
  songList: {
    margin: '10px 0 0 0',
    padding: 0,
    listStyle: 'none',
    background: '#fff8f8',
    border: '1px solid #FF6B6B',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(255,107,107,0.08)',
    fontSize: '0.98rem',
    color: '#2c3e50',
    maxHeight: '180px',
    overflowY: 'auto',
    textAlign: 'left'
  },
  songListItem: {
    padding: '7px 16px',
    borderBottom: '1px solid #ffeaea',
    fontWeight: 500
  }
};

export default BundleCard; 