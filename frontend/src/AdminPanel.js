import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import config from './config';

const AdminPanel = () => {
  const [gameCards, setGameCards] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGameCard, setNewGameCard] = useState({
    name: '',
    difficulty: '',
    description: '',
    color: '#4CAF50',
    challenges: ['']
  });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  // 1. Add state for editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [editGameCard, setEditGameCard] = useState(null);

  // 1. Add state for users
  const [users, setUsers] = useState([]);

  // 1. Add state for packages
  const [packages, setPackages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [showAddPrice, setShowAddPrice] = useState(false);
  const [newPriceName, setNewPriceName] = useState('');
  const [newPriceValue, setNewPriceValue] = useState('');
  const [newPriceDesc, setNewPriceDesc] = useState('');
  const [editDesc, setEditDesc] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(() => {
    const token = localStorage.getItem('adminToken');
    const userData = localStorage.getItem('adminUser');
    
    if (!token || !userData) {
      navigate('/login');
      return;
    }

    try {
      const user = JSON.parse(userData);
      setUser(user);
      fetchGameCards();
      fetchStats();
      fetchUsers(); // <-- add this
      fetchPackages(); // <-- add this
      fetchOrders(); // <-- add this
      fetchCategories(); // <-- add this
    } catch (error) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      navigate('/login');
    }
  }, [navigate]);

  const fetchGameCards = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${config.API_BASE_URL}/api/game-cards`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setGameCards(data);
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching game cards:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${config.API_BASE_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${config.API_BASE_URL}/api/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Fetch packages for price editing
  const fetchPackages = async () => {
    try {
      const res = await fetch(`${config.API_BASE_URL}/api/packages`);
      const data = await res.json();
      setPackages(data);
    } catch (e) {
      showMessage('Failed to load packages', 'error');
    }
  };

  // Fetch orders for admin panel
  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${config.API_BASE_URL}/api/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Fetch categories for admin panel
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/api/categories`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    navigate('/login');
  };

  const deleteGameCard = async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this game card?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${config.API_BASE_URL}/api/game-cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showMessage('Game card deleted successfully', 'success');
        fetchGameCards();
        fetchStats();
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
      } else {
        showMessage('Failed to delete game card', 'error');
      }
    } catch (error) {
      showMessage('Error deleting game card', 'error');
    }
  };

  const openCreateModal = () => {
    setNewGameCard({
      name: '',
      difficulty: '',
      description: '',
      color: '#4CAF50',
      challenges: ['']
    });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewGameCard({
      name: '',
      difficulty: '',
      description: '',
      color: '#4CAF50',
      challenges: ['']
    });
  };

  const addChallengeField = () => {
    setNewGameCard(prev => ({
      ...prev,
      challenges: [...prev.challenges, '']
    }));
  };

  const removeChallengeField = (index) => {
    setNewGameCard(prev => ({
      ...prev,
      challenges: prev.challenges.filter((_, i) => i !== index)
    }));
  };

  const updateChallenge = (index, value) => {
    setNewGameCard(prev => ({
      ...prev,
      challenges: prev.challenges.map((challenge, i) => i === index ? value : challenge)
    }));
  };

  const updateNewGameCard = (field, value) => {
    setNewGameCard(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const createGameCard = async () => {
    if (!newGameCard.name.trim()) {
      showMessage('Game card name is required', 'error');
      return;
    }

    if (!newGameCard.difficulty) {
      showMessage('Difficulty level is required', 'error');
      return;
    }

    if (!newGameCard.description.trim()) {
      showMessage('Description is required', 'error');
      return;
    }

    if (newGameCard.challenges.length === 0 || newGameCard.challenges.every(challenge => !challenge.trim())) {
      showMessage('At least one challenge is required', 'error');
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('adminToken');
      const gameCardData = {
        name: newGameCard.name.trim(),
        difficulty: newGameCard.difficulty,
        description: newGameCard.description.trim(),
        color: newGameCard.color,
        challenges: newGameCard.challenges.filter(challenge => challenge.trim())
      };

      const response = await fetch(`${config.API_BASE_URL}/api/game-cards`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gameCardData),
      });

      if (response.ok) {
        showMessage('Game card created successfully', 'success');
        closeCreateModal();
        fetchGameCards();
        fetchStats();
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Failed to create game card', 'error');
      }
    } catch (error) {
      showMessage('Error creating game card', 'error');
    } finally {
      setCreating(false);
    }
  };



  // 2. Open edit modal
  const openEditModal = (gameCard) => {
    setEditGameCard({ ...gameCard, challenges: [...gameCard.challenges] });
    setShowEditModal(true);
  };

  // 3. Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditGameCard(null);
  };

  // 4. Update edit game card fields
  const updateEditGameCard = (field, value) => {
    setEditGameCard(prev => ({ ...prev, [field]: value }));
  };
  const updateEditChallenge = (index, value) => {
    setEditGameCard(prev => ({
      ...prev,
      challenges: prev.challenges.map((challenge, i) => i === index ? value : challenge)
    }));
  };
  const addEditChallengeField = () => {
    setEditGameCard(prev => ({ ...prev, challenges: [...prev.challenges, ''] }));
  };
  const removeEditChallengeField = (index) => {
    setEditGameCard(prev => ({ ...prev, challenges: prev.challenges.filter((_, i) => i !== index) }));
  };

  // 5. Save edited game card
  const saveEditGameCard = async () => {
    if (!editGameCard.name.trim()) {
      showMessage('Game card name is required', 'error');
      return;
    }
    if (!editGameCard.difficulty) {
      showMessage('Difficulty level is required', 'error');
      return;
    }
    if (!editGameCard.description.trim()) {
      showMessage('Description is required', 'error');
      return;
    }
    if (editGameCard.challenges.length === 0 || editGameCard.challenges.every(challenge => !challenge.trim())) {
      showMessage('At least one challenge is required', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const gameCardData = {
        name: editGameCard.name.trim(),
        difficulty: editGameCard.difficulty,
        description: editGameCard.description.trim(),
        color: editGameCard.color,
        challenges: editGameCard.challenges.filter(challenge => challenge.trim())
      };
      const response = await fetch(`${config.API_BASE_URL}/api/game-cards/${editGameCard._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(gameCardData)
      });
      if (response.ok) {
        showMessage('Game card updated successfully', 'success');
        closeEditModal();
        fetchGameCards();
        fetchStats();
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Failed to update game card', 'error');
      }
    } catch (error) {
      showMessage('Error updating game card', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${config.API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        fetchUsers();
        showMessage('User deleted', 'success');
      } else {
        showMessage('Failed to delete user', 'error');
      }
    } catch (error) {
      showMessage('Error deleting user', 'error');
    }
  };

  const handleEdit = (pkg) => {
    setEditing(pkg._id);
    setEditPrice(pkg.price);
    setEditDesc(pkg.description || '');
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
        body: JSON.stringify({ price: Number(editPrice), description: editDesc })
      });
      if (res.ok) {
        setEditing(null);
        showMessage('Үнэ шинэчлэгдлээ', 'success');
        fetchPackages();
      } else {
        showMessage('Шинэчлэхэд алдаа гарлаа', 'error');
      }
    } catch (e) {
      showMessage('Шинэчлэхэд алдаа гарлаа', 'error');
    }
  };

  const handleAddPrice = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${config.API_BASE_URL}/api/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newPriceName, price: Number(newPriceValue), description: newPriceDesc })
      });
      if (res.ok) {
        setShowAddPrice(false);
        setNewPriceName('');
        setNewPriceValue('');
        setNewPriceDesc('');
        showMessage('Шинэ үнэ нэмэгдлээ', 'success');
        fetchPackages();
      } else {
        showMessage('Нэмэхэд алдаа гарлаа', 'error');
      }
    } catch (e) {
      showMessage('Нэмэхэд алдаа гарлаа', 'error');
    }
  };

  const handleDeletePrice = async (pkg) => {
    if (!window.confirm('Та энэ үнийн дүнг устгахдаа итгэлтэй байна уу?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${config.API_BASE_URL}/api/packages/${pkg._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showMessage('Үнийн дүн устгагдлаа', 'success');
        fetchPackages();
      } else {
        showMessage('Устгахад алдаа гарлаа', 'error');
      }
    } catch (e) {
      showMessage('Устгахад алдаа гарлаа', 'error');
    }
  };

  // Category management functions
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#27ae60');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDesc, setEditCategoryDesc] = useState('');
  const [editCategoryColor, setEditCategoryColor] = useState('');

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      showMessage('Категорийн нэр шаардлагатай', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${config.API_BASE_URL}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newCategoryName,
          description: newCategoryDesc,
          color: newCategoryColor
        })
      });
      if (res.ok) {
        showMessage('Категори нэмэгдлээ', 'success');
        setNewCategoryName('');
        setNewCategoryDesc('');
        setNewCategoryColor('#27ae60');
        setShowAddCategory(false);
        fetchCategories();
      } else {
        showMessage('Нэмэхэд алдаа гарлаа', 'error');
      }
    } catch (e) {
      showMessage('Нэмэхэд алдаа гарлаа', 'error');
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category._id);
    setEditCategoryName(category.name);
    setEditCategoryDesc(category.description || '');
    setEditCategoryColor(category.color || '#27ae60');
  };

  const handleSaveCategory = async (category) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${config.API_BASE_URL}/api/categories/${category._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: editCategoryName,
          description: editCategoryDesc,
          color: editCategoryColor
        })
      });
      if (res.ok) {
        showMessage('Категори хадгалагдлаа', 'success');
        setEditingCategory(null);
        fetchCategories();
      } else {
        showMessage('Хадгалахад алдаа гарлаа', 'error');
      }
    } catch (e) {
      showMessage('Хадгалахад алдаа гарлаа', 'error');
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm('Та энэ категорийг устгахдаа итгэлтэй байна уу?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${config.API_BASE_URL}/api/categories/${category._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showMessage('Категори устгагдлаа', 'success');
        fetchCategories();
      } else {
        showMessage('Устгахад алдаа гарлаа', 'error');
      }
    } catch (e) {
      showMessage('Устгахад алдаа гарлаа', 'error');
    }
  };

  // Order management functions
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Find the current order to get its categories
      const currentOrder = orders.find(order => order._id === orderId);
      const categories = currentOrder?.categories?.map(cat => cat._id) || [];
      
      console.log('Current order:', currentOrder);
      console.log('Categories:', categories);
      console.log('Status:', status);
      
      // If marking as completed, check if at least one category is selected
      if (status === 'completed' && categories.length === 0) {
        showMessage('Захиалгыг дуусгахын тулд эхлээд дор хаяж нэг категори сонгоно уу', 'error');
        return;
      }
      
      const requestBody = { status };
      if (categories.length > 0) {
        requestBody.categories = categories;
      }
      
      console.log('Request body:', requestBody);
      
      const res = await fetch(`${config.API_BASE_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', res.status);
      
      if (res.ok) {
        const result = await res.json();
        console.log('Response result:', result);
        showMessage(`Захиалга ${status === 'completed' ? 'дууссан' : 'цуцлагдсан'}`, 'success');
        fetchOrders();
      } else {
        const errorData = await res.json();
        console.log('Error response:', errorData);
        showMessage('Статус шинэчлэхэд алдаа гарлаа', 'error');
      }
    } catch (e) {
      console.error('Error in handleUpdateOrderStatus:', e);
      showMessage('Статус шинэчлэхэд алдаа гарлаа', 'error');
    }
  };

  const handleUpdateOrderCategories = async (orderId, categoryId, isChecked) => {
    try {
      const token = localStorage.getItem('adminToken');
      const currentOrder = orders.find(order => order._id === orderId);
      const currentCategories = currentOrder?.categories?.map(cat => cat._id) || [];
      
      console.log('Updating categories for order:', orderId);
      console.log('Current categories:', currentCategories);
      console.log('Category to add/remove:', categoryId);
      console.log('Is checked:', isChecked);
      
      let newCategories;
      if (isChecked) {
        // Add category
        newCategories = [...currentCategories, categoryId];
      } else {
        // Remove category
        newCategories = currentCategories.filter(id => id !== categoryId);
      }
      
      console.log('New categories array:', newCategories);
      
      const res = await fetch(`${config.API_BASE_URL}/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ categories: newCategories })
      });
      
      console.log('Category update response status:', res.status);
      
      if (res.ok) {
        const result = await res.json();
        console.log('Category update result:', result);
        showMessage('Категориуд шинэчлэгдлээ', 'success');
        fetchOrders();
      } else {
        const errorData = await res.json();
        console.log('Category update error:', errorData);
        showMessage('Категориуд шинэчлэхэд алдаа гарлаа', 'error');
      }
    } catch (e) {
      console.error('Error in handleUpdateOrderCategories:', e);
      showMessage('Категориуд шинэчлэхэд алдаа гарлаа', 'error');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Та энэ захиалгыг устгахдаа итгэлтэй байна уу?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${config.API_BASE_URL}/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        showMessage('Захиалга устгагдлаа', 'success');
        fetchOrders();
      } else {
        showMessage('Устгахад алдаа гарлаа', 'error');
      }
    } catch (e) {
      showMessage('Устгахад алдаа гарлаа', 'error');
    }
  };

  const renderDashboard = () => (
    <div style={styles.dashboard}>
      <h2>Dashboard</h2>
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3>Total Bundles</h3>
          <p style={styles.statNumber}>{stats.totalBundles || 0}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Total Songs</h3>
          <p style={styles.statNumber}>{stats.totalSongs || 0}</p>
        </div>
        <div style={styles.statCard}>
          <h3>Total Downloads</h3>
          <p style={styles.statNumber}>{stats.totalDownloads || 0}</p>
        </div>
        <div style={styles.statCard}>
          <h3>System Status</h3>
          <p style={styles.statNumber}>🟢 Online</p>
        </div>
      </div>
      
      {/* Categories Section */}
      <div style={{ margin: '30px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>Categories</h3>
          <button onClick={() => setShowAddCategory(v => !v)} style={{ background: '#27ae60', color: 'white', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 600, cursor: 'pointer' }}>
            Add Category
          </button>
        </div>
        
        {showAddCategory && (
          <div style={{ marginBottom: 24, background: '#f8f8f8', borderRadius: 8, padding: 18 }}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontWeight: 500 }}>Name:</label>
              <input type="text" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 6, border: '1.5px solid #27ae60', width: 200 }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontWeight: 500 }}>Description:</label>
              <input type="text" value={newCategoryDesc} onChange={e => setNewCategoryDesc(e.target.value)} style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 6, border: '1.5px solid #27ae60', width: 200 }} />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontWeight: 500 }}>Color:</label>
              <input type="color" value={newCategoryColor} onChange={e => setNewCategoryColor(e.target.value)} style={{ marginLeft: 8, padding: '2px', borderRadius: 6, border: '1.5px solid #27ae60', width: 50 }} />
            </div>
            <button onClick={handleAddCategory} style={{ background: '#27ae60', color: 'white', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 600, marginTop: 8, cursor: 'pointer' }}>Add</button>
          </div>
        )}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {categories.map((category) => (
            <div key={category._id} style={{ 
              border: '1px solid #eee', 
              borderRadius: 8, 
              padding: 16, 
              background: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              {editingCategory === category._id ? (
                <div>
                  <div style={{ marginBottom: 10 }}>
                    <input type="text" value={editCategoryName} onChange={e => setEditCategoryName(e.target.value)} style={{ width: '100%', padding: '6px 12px', borderRadius: 6, border: '1.5px solid #27ae60' }} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <input type="text" value={editCategoryDesc} onChange={e => setEditCategoryDesc(e.target.value)} placeholder="Description" style={{ width: '100%', padding: '6px 12px', borderRadius: 6, border: '1.5px solid #27ae60' }} />
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <input type="color" value={editCategoryColor} onChange={e => setEditCategoryColor(e.target.value)} style={{ padding: '2px', borderRadius: 6, border: '1.5px solid #27ae60' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => handleSaveCategory(category)} style={{ background: '#27ae60', color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer' }}>Save</button>
                    <button onClick={() => setEditingCategory(null)} style={{ background: '#ccc', color: '#222', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <h4 style={{ margin: 0, color: category.color || '#27ae60' }}>{category.name}</h4>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => handleEditCategory(category)} style={{ background: 'none', color: '#27ae60', fontSize: '0.9em', padding: '2px 8px', border: '1px solid #27ae60', borderRadius: 4, cursor: 'pointer' }}>Edit</button>
                      <button onClick={() => handleDeleteCategory(category)} style={{ background: '#ff4d4f', color: 'white', fontSize: '0.9em', padding: '2px 8px', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Delete</button>
                    </div>
                  </div>
                  {category.description && (
                    <p style={{ margin: 0, color: '#666', fontSize: '0.9em' }}>{category.description}</p>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <span style={{ 
                      display: 'inline-block', 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      backgroundColor: category.color || '#27ae60',
                      marginRight: 8
                    }}></span>
                    <span style={{ fontSize: '0.8em', color: '#888' }}>Color: {category.color || '#27ae60'}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        {categories.length === 0 && (
          <p style={{ textAlign: 'center', color: '#666' }}>No categories found. Add some categories to get started.</p>
        )}
      </div>
      
      <div style={{ margin: '30px 0' }}>
        <h3>Registered Users</h3>
        <div style={{ overflowX: 'auto', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, background: '#fff', minWidth: 600 }}>
            <thead>
              <tr style={{ background: 'linear-gradient(90deg,#f5f7fa,#c3cfe2)' }}>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', fontWeight: 700 }}>#</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', fontWeight: 700 }}>Утасны дугаар</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', fontWeight: 700 }}>Role</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', fontWeight: 700 }}>Active</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', fontWeight: 700 }}>Created</th>
                <th style={{ padding: '12px 8px', borderBottom: '2px solid #e0e0e0', fontWeight: 700 }}></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id || u._id} style={{ borderBottom: '1px solid #f0f0f0', background: i % 2 === 0 ? '#fafbfc' : '#fff' }}>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>{i + 1}</td>
                  <td style={{ padding: '10px 8px', fontWeight: 500 }}>{u.username}</td>
                  <td style={{ padding: '10px 8px', textTransform: 'capitalize' }}>{u.role}</td>
                  <td style={{ padding: '10px 8px' }}>{u.isActive ? 'Yes' : 'No'}</td>
                  <td style={{ padding: '10px 8px', fontSize: '0.95em', color: '#888' }}>{u.createdAt ? new Date(u.createdAt).toLocaleString() : ''}</td>
                  <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                    <button onClick={() => handleDeleteUser(u._id)} style={{ background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95em', boxShadow: '0 1px 4px rgba(255,77,79,0.07)' }}>
                      Устгах
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Add a new tab for orders
  const renderOrders = () => (
    <div style={{ maxWidth: 1000, margin: '0 auto', background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 32 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Захиалга</h2>
      {orders.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#666' }}>Одоогоор захиалга байхгүй байна.</p>
      ) : (
        <div>
          {orders.map((order) => (
            <div key={order._id} style={{ 
              border: '1px solid #eee', 
              borderRadius: 8, 
              padding: 20, 
              marginBottom: 16,
              background: '#f9f9f9'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: 8 }}>
                    Account: {order.accountName}
                  </div>
                  <div style={{ color: '#666', marginBottom: 4 }}>
                    Багц: {order.packageName}
                  </div>
                  <div style={{ color: '#27ae60', fontWeight: 600, marginBottom: 8 }}>
                    Үнэ: {order.packagePrice.toLocaleString()}₮
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#888' }}>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: 20 }}>
                  <div style={{ 
                    padding: '6px 16px', 
                    borderRadius: 12, 
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    marginBottom: 12,
                    background: order.status === 'pending' ? '#fff3cd' : 
                               order.status === 'completed' ? '#d4edda' : '#f8d7da',
                    color: order.status === 'pending' ? '#856404' : 
                           order.status === 'completed' ? '#155724' : '#721c24'
                  }}>
                    {order.status === 'pending' ? 'Хүлээгдэж буй' : 
                     order.status === 'completed' ? 'Дууссан' : 'Цуцлагдсан'}
                  </div>
                </div>
              </div>
              
              {/* Category Selection */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontWeight: 500, marginBottom: 8, display: 'block' }}>Категори:</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  {categories.map((category) => {
                    const isSelected = order.categories?.some(cat => cat._id === category._id);
                    return (
                      <label key={category._id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '6px 12px', 
                        borderRadius: 6, 
                        border: `2px solid ${isSelected ? category.color || '#27ae60' : '#ddd'}`,
                        background: isSelected ? `${category.color || '#27ae60'}20` : '#fff',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: isSelected ? 600 : 400
                      }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleUpdateOrderCategories(order._id, category._id, e.target.checked)}
                          style={{ marginRight: 6 }}
                        />
                        <span style={{ 
                          display: 'inline-block', 
                          width: 12, 
                          height: 12, 
                          borderRadius: '50%', 
                          backgroundColor: category.color || '#27ae60',
                          marginRight: 6
                        }}></span>
                        {category.name}
                      </label>
                    );
                  })}
                </div>
                
                {/* Display selected categories details */}
                {order.categories && order.categories.length > 0 && (
                  <div style={{ marginTop: 8, padding: 8, background: '#f0f8ff', borderRadius: 6, border: '1px solid #e0e0e0' }}>
                    <div style={{ fontWeight: 600, marginBottom: 8, color: '#333' }}>Сонгосон категориуд:</div>
                    {order.categories.map((category) => (
                      <div key={category._id} style={{ marginBottom: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
                          <span style={{ 
                            display: 'inline-block', 
                            width: 16, 
                            height: 16, 
                            borderRadius: '50%', 
                            backgroundColor: category.color || '#27ae60',
                            marginRight: 8
                          }}></span>
                          <span style={{ fontWeight: 600, color: category.color || '#27ae60' }}>
                            {category.name}
                          </span>
                        </div>
                        {category.description && (
                          <div style={{ fontSize: '0.9rem', color: '#666', marginLeft: 24 }}>
                            {category.description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleUpdateOrderStatus(order._id, 'completed')}
                  disabled={order.status === 'completed'}
                  style={{ 
                    background: order.status === 'completed' ? '#ccc' : '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 6, 
                    padding: '8px 16px', 
                    fontWeight: 600, 
                    cursor: order.status === 'completed' ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Done
                </button>
                <button 
                  onClick={() => handleUpdateOrderStatus(order._id, 'cancelled')}
                  disabled={order.status === 'cancelled'}
                  style={{ 
                    background: order.status === 'cancelled' ? '#ccc' : '#ffc107', 
                    color: order.status === 'cancelled' ? '#666' : '#212529', 
                    border: 'none', 
                    borderRadius: 6, 
                    padding: '8px 16px', 
                    fontWeight: 600, 
                    cursor: order.status === 'cancelled' ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteOrder(order._id)}
                  style={{ 
                    background: '#dc3545', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: 6, 
                    padding: '8px 16px', 
                    fontWeight: 600, 
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );


  const renderGameCards = () => (
    <div style={styles.bundlesSection}>
      <div style={styles.bundlesHeader}>
        <h2>Manage Game Cards</h2>
        <button onClick={openCreateModal} style={styles.createButton}>
          Create New Game Card
        </button>
      </div>
      <div style={styles.bundlesList}>
        {gameCards.map((card) => (
          <div key={card._id} style={styles.bundleCard}>
            <div style={styles.bundleInfo}>
              <h3>{card.name}</h3>
              <p>Difficulty: {card.difficulty}</p>
              <p>Description: {card.description}</p>
              <p>Challenges: {card.challenges ? card.challenges.length : 0}</p>
              <p>Created: {new Date(card.createdAt).toLocaleDateString()}</p>
            </div>
            <div style={styles.bundleActions}>
              <button
                onClick={() => openEditModal(card)}
                style={{ ...styles.editButton, marginRight: 10 }}
              >
                Edit
              </button>
              <button
                onClick={() => deleteGameCard(card._id)}
                style={styles.deleteButton}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {gameCards.length === 0 && (
          <p style={styles.noBundles}>No game cards found</p>
        )}
      </div>
    </div>
  );

  const renderPrices = () => (
    <div style={{ maxWidth: 600, margin: '0 auto', background: 'white', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', padding: 32 }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Үнийн дүн</h2>
      <button onClick={() => setShowAddPrice(v => !v)} style={{ background: '#27ae60', color: 'white', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 600, marginBottom: 24, cursor: 'pointer' }}>
        Үнийн дүн нэмэх
      </button>
      {showAddPrice && (
        <div style={{ marginBottom: 24, background: '#f8f8f8', borderRadius: 8, padding: 18 }}>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontWeight: 500 }}>Нэр:</label>
            <input type="text" value={newPriceName} onChange={e => setNewPriceName(e.target.value)} style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 6, border: '1.5px solid #27ae60', width: 200 }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontWeight: 500 }}>Үнэ:</label>
            <input type="number" value={newPriceValue} onChange={e => setNewPriceValue(e.target.value)} style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 6, border: '1.5px solid #27ae60', width: 200 }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={{ fontWeight: 500 }}>Тайлбар:</label>
            <input type="text" value={newPriceDesc} onChange={e => setNewPriceDesc(e.target.value)} style={{ marginLeft: 8, padding: '6px 12px', borderRadius: 6, border: '1.5px solid #27ae60', width: 200 }} />
          </div>
          <button onClick={handleAddPrice} style={{ background: '#27ae60', color: 'white', border: 'none', borderRadius: 6, padding: '8px 22px', fontWeight: 600, marginTop: 8, cursor: 'pointer' }}>Нэмэх</button>
        </div>
      )}
      {packages.map((pkg) => (
        <div key={pkg._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, borderBottom: '1px solid #eee', paddingBottom: 12 }}>
          <span style={{ fontWeight: 500, fontSize: '1.1rem' }}>{pkg.name}</span>
          {editing === pkg._id ? (
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{ fontSize: '1.1rem', padding: '6px 12px', borderRadius: 6, border: '1.5px solid #27ae60', width: 100, marginRight: 8 }} />
              <input type="text" value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Тайлбар" style={{ fontSize: '1rem', padding: '6px 12px', borderRadius: 6, border: '1.5px solid #27ae60', width: 200, marginRight: 8 }} />
              <span>
                <button onClick={() => handleSave(pkg)} style={{ background: '#27ae60', color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600, marginRight: 6 }}>Хадгалах</button>
                <button onClick={() => setEditing(null)} style={{ background: '#ccc', color: '#222', border: 'none', borderRadius: 6, padding: '6px 14px', fontWeight: 600 }}>Болих</button>
              </span>
            </span>
          ) : (
            <span style={{ color: '#27ae60', fontWeight: 600, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              {pkg.price.toLocaleString()}₮
              <button onClick={() => handleEdit(pkg)} style={{ background: 'none', color: '#27ae60', fontSize: '0.95em', padding: '2px 10px', border: '1px solid #27ae60', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Засах</button>
              <button onClick={() => handleDeletePrice(pkg)} style={{ background: '#ff4d4f', color: 'white', fontSize: '0.95em', padding: '2px 10px', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>Устгах</button>
            </span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="adminContainer" style={styles.container}>
      <header className="header" style={styles.header}>
        <div style={styles.headerTop}>
          <Link to="/" style={styles.backLink}>← Back to Home</Link>
          <div style={styles.userInfo}>
            <span style={styles.username}>Welcome, {user?.username}</span>
            <button className="logoutButton" onClick={logout} style={styles.logoutButton}>Logout</button>
          </div>
        </div>
        <h1 className="title">Admin Panel</h1>
        <nav className="adminTabs" style={styles.nav}>
          <button
            className="adminTab"
            onClick={() => setActiveTab('dashboard')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'dashboard' && styles.activeNavButton)
            }}
          >
            Dashboard
          </button>
          <button
            className="adminTab"
            onClick={() => setActiveTab('orders')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'orders' && styles.activeNavButton)
            }}
          >
            Захиалга
          </button>
          <button
            className="adminTab"
            onClick={() => setActiveTab('bundles')}
            style={{
              ...styles.navButton,
              ...(activeTab === 'bundles' && styles.activeNavButton)
            }}
          >
            Manage Game Cards
          </button>
          <button
            className="adminTab"
            style={activeTab === 'prices' ? styles.activeNavButton : styles.navButton}
            onClick={() => setActiveTab('prices')}
          >
            Үнийн дүн
          </button>
        </nav>
      </header>

      <main className="adminContent" style={styles.main}>
        {message && (
          <div style={{
            ...styles.message,
            ...(messageType === 'error' ? styles.errorMessage : styles.successMessage)
          }}>
            {message}
          </div>
        )}

        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'orders' && renderOrders()}
        {activeTab === 'bundles' && renderGameCards()}
        {activeTab === 'prices' && renderPrices()}
      </main>

      {/* Create Game Card Modal */}
      {showCreateModal && (
        <div className="modalOverlay" style={styles.modalOverlay}>
          <div className="modalContent" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>Create New Game Card</h2>
              <button className="closeButton" onClick={closeCreateModal} style={styles.closeButton}>
                ×
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Card Name *</label>
                <input
                  type="text"
                  value={newGameCard.name}
                  onChange={(e) => updateNewGameCard('name', e.target.value)}
                  style={styles.input}
                  placeholder="Enter card name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Difficulty Level *</label>
                <select
                  value={newGameCard.difficulty}
                  onChange={(e) => updateNewGameCard('difficulty', e.target.value)}
                  style={styles.input}
                >
                  <option value="">Select Difficulty</option>
                  <option value="friendly">Friendly</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="extreme">Extreme</option>
                  <option value="xxx">XXX</option>
                  <option value="killer">Killer</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Description *</label>
                <input
                  type="text"
                  value={newGameCard.description}
                  onChange={(e) => updateNewGameCard('description', e.target.value)}
                  style={styles.input}
                  placeholder="Enter description"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Color</label>
                <input
                  type="color"
                  value={newGameCard.color}
                  onChange={(e) => updateNewGameCard('color', e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Challenges *</label>
                {newGameCard.challenges.map((challenge, index) => (
                  <div key={index} style={styles.linkRow}>
                    <input
                      type="text"
                      value={challenge}
                      onChange={e => updateChallenge(index, e.target.value)}
                      style={styles.linkInput}
                      placeholder="Enter challenge text"
                    />
                    {newGameCard.challenges.length > 1 && (
                      <button type="button" onClick={() => removeChallengeField(index)} style={styles.removeButton}>Remove</button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addChallengeField}
                  style={styles.addButton}
                >
                  + Add Another Challenge
                </button>
              </div>
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={closeCreateModal}
                style={styles.cancelButton}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={createGameCard}
                style={styles.saveButton}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Game Card'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Game Card Modal */}
      {showEditModal && editGameCard && (
        <div className="modalOverlay" style={styles.modalOverlay}>
          <div className="modalContent" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>Edit Game Card</h2>
              <button className="closeButton" onClick={closeEditModal} style={styles.closeButton}>
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Card Name *</label>
                <input
                  type="text"
                  value={editGameCard.name}
                  onChange={e => updateEditGameCard('name', e.target.value)}
                  style={styles.input}
                  placeholder="Enter card name"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Difficulty Level *</label>
                <select
                  value={editGameCard.difficulty}
                  onChange={e => updateEditGameCard('difficulty', e.target.value)}
                  style={styles.input}
                >
                  <option value="">Select Difficulty</option>
                  <option value="friendly">Friendly</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                  <option value="extreme">Extreme</option>
                  <option value="xxx">XXX</option>
                  <option value="killer">Killer</option>
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Description *</label>
                <input
                  type="text"
                  value={editGameCard.description}
                  onChange={e => updateEditGameCard('description', e.target.value)}
                  style={styles.input}
                  placeholder="Enter description"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Color</label>
                <input
                  type="color"
                  value={editGameCard.color}
                  onChange={e => updateEditGameCard('color', e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Challenges *</label>
                {editGameCard.challenges.map((challenge, index) => (
                  <div key={index} style={styles.linkRow}>
                    <input
                      type="text"
                      value={challenge}
                      onChange={e => updateEditChallenge(index, e.target.value)}
                      style={styles.linkInput}
                      placeholder="Enter challenge text"
                    />
                    {editGameCard.challenges.length > 1 && (
                      <button type="button" onClick={() => removeEditChallengeField(index)} style={styles.removeButton}>Remove</button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEditChallengeField}
                  style={styles.addButton}
                >
                  Add Challenge
                </button>
              </div>
              <button
                onClick={saveEditGameCard}
                style={styles.saveButton}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Arial, sans-serif'
  },
  header: {
    backgroundColor: '#2c3e50',
    color: 'white',
    padding: '20px',
    textAlign: 'center',
    position: 'relative'
  },
  headerTop: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    right: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  backLink: {
    color: 'white',
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '5px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transition: 'background-color 0.3s ease'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  username: {
    color: 'white',
    fontSize: '0.9rem'
  },
  logoutButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: 'white',
    border: '1px solid white',
    padding: '8px 16px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'background-color 0.3s ease'
  },
  nav: {
    marginTop: '20px',
    display: 'flex',
    justifyContent: 'center',
    gap: '10px'
  },
  navButton: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    color: 'white',
    border: '1px solid white',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'all 0.3s ease'
  },
  activeNavButton: {
    backgroundColor: 'white',
    color: '#2c3e50'
  },
  main: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  message: {
    padding: '15px',
    borderRadius: '5px',
    marginBottom: '20px',
    textAlign: 'center'
  },
  successMessage: {
    backgroundColor: '#d4edda',
    color: '#155724',
    border: '1px solid #c3e6cb'
  },
  errorMessage: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    border: '1px solid #f5c6cb'
  },
  dashboard: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #dee2e6'
  },
  statNumber: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#2c3e50',
    margin: '10px 0'
  },

  bundlesSection: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  bundlesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  createButton: {
    backgroundColor: '#3498db',
    color: 'white',
    padding: '10px 20px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  bundlesList: {
    display: 'grid',
    gap: '15px'
  },
  bundleCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa'
  },
  bundleInfo: {
    flex: 1
  },
  bundleActions: {
    display: 'flex',
    gap: '10px'
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  noBundles: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic'
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
  modal: {
    backgroundColor: 'white',
    borderRadius: '10px',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
  },
  modalHeader: {
    padding: '20px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#666',
    padding: '0',
    width: '30px',
    height: '30px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalBody: {
    padding: '20px',
    maxHeight: '60vh',
    overflowY: 'auto'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'bold',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  linkRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '10px',
    alignItems: 'center'
  },
  linkInput: {
    flex: 1,
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '5px',
    fontSize: '14px'
  },
  removeButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '8px 12px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '12px',
    whiteSpace: 'nowrap'
  },
  addButton: {
    backgroundColor: '#27ae60',
    color: 'white',
    border: 'none',
    padding: '10px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '10px'
  },
  modalFooter: {
    padding: '20px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px'
  },
  cancelButton: {
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  saveButton: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  editButton: {
    backgroundColor: '#ffd166',
    color: '#333',
    border: 'none',
    borderRadius: '6px',
    padding: '8px 18px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '1rem',
    transition: 'background 0.2s',
},
      };
    
    export default AdminPanel; 