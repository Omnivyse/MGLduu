import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const [bundles, setBundles] = useState([]);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBundle, setNewBundle] = useState({
    name: '',
    imageBase64: '',
    links: [{ name: '', url: '' }],
    piece: 1,
    category: ''
  });
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  // 1. Add state for editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [editBundle, setEditBundle] = useState(null);

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
      fetchBundles();
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

  const fetchBundles = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:4000/api/song-bundle/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setBundles(data);
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error fetching bundles:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:4000/api/admin/stats', {
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
      const response = await fetch('http://localhost:4000/api/admin/users', {
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
      const res = await fetch('http://localhost:4000/api/packages');
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
      const response = await fetch('http://localhost:4000/api/orders', {
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
      const response = await fetch('http://localhost:4000/api/categories');
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

  const deleteBundle = async (bundleId) => {
    if (!window.confirm('Are you sure you want to delete this bundle?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:4000/api/song-bundle/${bundleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        showMessage('Bundle deleted successfully', 'success');
        fetchBundles();
        fetchStats();
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
      } else {
        showMessage('Failed to delete bundle', 'error');
      }
    } catch (error) {
      showMessage('Error deleting bundle', 'error');
    }
  };

  const openCreateModal = () => {
    setNewBundle({
      name: '',
      imageBase64: '',
      links: [{ name: '', url: '' }],
      piece: 0
    });
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewBundle({
      name: '',
      imageBase64: '',
      links: [{ name: '', url: '' }],
      piece: 0
    });
  };

  const addLinkField = () => {
    setNewBundle(prev => ({
      ...prev,
      links: [...prev.links, { name: '', url: '' }]
    }));
  };

  const removeLinkField = (index) => {
    setNewBundle(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  const updateLink = (index, field, value) => {
    setNewBundle(prev => ({
      ...prev,
      links: prev.links.map((link, i) => i === index ? { ...link, [field]: value } : link)
    }));
  };

  const updateNewBundle = (field, value) => {
    setNewBundle(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const createBundle = async () => {
    if (!newBundle.name.trim()) {
      showMessage('Bundle name is required', 'error');
      return;
    }

    if (newBundle.links.length === 0 || newBundle.links.every(link => !link.name.trim() || !link.url.trim())) {
      showMessage('At least one link with name and URL is required', 'error');
      return;
    }

    setCreating(true);
    try {
      const token = localStorage.getItem('adminToken');
      const bundleData = {
        name: newBundle.name.trim(),
        imageBase64: newBundle.imageBase64,
        links: newBundle.links.filter(link => link.name.trim() && link.url.trim()),
        piece: parseInt(newBundle.piece) || 0,
        category: newBundle.category
      };

      const response = await fetch('http://localhost:4000/api/song-bundle', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bundleData),
      });

      if (response.ok) {
        showMessage('Bundle created successfully', 'success');
        closeCreateModal();
        fetchBundles();
        fetchStats();
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Failed to create bundle', 'error');
      }
    } catch (error) {
      showMessage('Error creating bundle', 'error');
    } finally {
      setCreating(false);
    }
  };

  // For create modal
  const handleCreateImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewBundle(prev => ({ ...prev, imageBase64: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // For edit modal
  const handleEditImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditBundle(prev => ({ ...prev, imageBase64: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // 2. Open edit modal
  const openEditModal = (bundle) => {
    setEditBundle({ ...bundle, links: [...bundle.links] });
    setShowEditModal(true);
  };

  // 3. Close edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    setEditBundle(null);
  };

  // 4. Update edit bundle fields
  const updateEditBundle = (field, value) => {
    setEditBundle(prev => ({ ...prev, [field]: value }));
  };
  const updateEditLink = (index, field, value) => {
    setEditBundle(prev => ({
      ...prev,
      links: prev.links.map((link, i) => i === index ? { ...link, [field]: value } : link)
    }));
  };
  const addEditLinkField = () => {
    setEditBundle(prev => ({ ...prev, links: [...prev.links, { name: '', url: '' }] }));
  };
  const removeEditLinkField = (index) => {
    setEditBundle(prev => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
  };

  // 5. Save edited bundle
  const saveEditBundle = async () => {
    if (!editBundle.name.trim()) {
      showMessage('Bundle name is required', 'error');
      return;
    }
    if (editBundle.links.length === 0 || editBundle.links.every(link => !link.name.trim() || !link.url.trim())) {
      showMessage('At least one link with name and URL is required', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('adminToken');
      const bundleData = {
        name: editBundle.name.trim(),
        imageBase64: editBundle.imageBase64,
        links: editBundle.links.filter(link => link.name.trim() && link.url.trim()),
        piece: parseInt(editBundle.piece) || 0,
        category: editBundle.category
      };
      const response = await fetch(`http://localhost:4000/api/song-bundle/${editBundle._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bundleData)
      });
      if (response.ok) {
        showMessage('Bundle updated successfully', 'success');
        closeEditModal();
        fetchBundles();
        fetchStats();
      } else if (response.status === 401) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        navigate('/login');
      } else {
        const errorData = await response.json();
        showMessage(errorData.error || 'Failed to update bundle', 'error');
      }
    } catch (error) {
      showMessage('Error updating bundle', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:4000/api/admin/users/${userId}`, {
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
      const res = await fetch(`http://localhost:4000/api/packages/${pkg._id}`, {
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
      const res = await fetch('http://localhost:4000/api/packages', {
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
      const res = await fetch(`http://localhost:4000/api/packages/${pkg._id}`, {
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
      const res = await fetch('http://localhost:4000/api/categories', {
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
      const res = await fetch(`http://localhost:4000/api/categories/${category._id}`, {
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
      const res = await fetch(`http://localhost:4000/api/categories/${category._id}`, {
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
      
      const res = await fetch(`http://localhost:4000/api/orders/${orderId}`, {
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
      
      const res = await fetch(`http://localhost:4000/api/orders/${orderId}`, {
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
      const res = await fetch(`http://localhost:4000/api/orders/${orderId}`, {
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


  const renderBundles = () => (
    <div style={styles.bundlesSection}>
      <div style={styles.bundlesHeader}>
        <h2>Manage Bundles</h2>
        <button onClick={openCreateModal} style={styles.createButton}>
          Create New Bundle
        </button>
      </div>
      <div style={styles.bundlesList}>
        {bundles.map((bundle) => (
          <div key={bundle._id} style={styles.bundleCard}>
            <div style={styles.bundleInfo}>
              <h3>{bundle.name}</h3>
              <p>Songs: {bundle.links ? bundle.links.length : 0}</p>
              <p>Created: {new Date(bundle.createdAt).toLocaleDateString()}</p>
            </div>
            <div style={styles.bundleActions}>
              <button
                onClick={() => openEditModal(bundle)}
                style={{ ...styles.editButton, marginRight: 10 }}
              >
                Edit
              </button>
              <button
                onClick={() => deleteBundle(bundle._id)}
                style={styles.deleteButton}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {bundles.length === 0 && (
          <p style={styles.noBundles}>No bundles found</p>
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
            Manage Bundles
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
        {activeTab === 'bundles' && renderBundles()}
        {activeTab === 'prices' && renderPrices()}
      </main>

      {/* Create Bundle Modal */}
      {showCreateModal && (
        <div className="modalOverlay" style={styles.modalOverlay}>
          <div className="modalContent" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>Create New Bundle</h2>
              <button className="closeButton" onClick={closeCreateModal} style={styles.closeButton}>
                ×
              </button>
            </div>
            
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Bundle Name *</label>
                <input
                  type="text"
                  value={newBundle.name}
                  onChange={(e) => updateNewBundle('name', e.target.value)}
                  style={styles.input}
                  placeholder="Enter bundle name"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCreateImageUpload}
                  style={styles.input}
                />
                {newBundle.imageBase64 && (
                  <img src={newBundle.imageBase64} alt="Preview" style={{ maxWidth: 120, marginTop: 10 }} />
                )}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Song Piece Number</label>
                <select
                  value={newBundle.piece}
                  onChange={(e) => updateNewBundle('piece', e.target.value)}
                  style={styles.input}
                >
                  <option value="1">1</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="25">25</option>
                  <option value="30">30</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  value={newBundle.category}
                  onChange={(e) => updateNewBundle('category', e.target.value)}
                  style={styles.input}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>YouTube Links *</label>
                {newBundle.links.map((link, index) => (
                  <div key={index} style={styles.linkRow}>
                    <input
                      type="text"
                      value={link.name}
                      onChange={e => updateLink(index, 'name', e.target.value)}
                      style={styles.linkInput}
                      placeholder="Song name"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={e => updateLink(index, 'url', e.target.value)}
                      style={styles.linkInput}
                      placeholder="https://youtu.be/..."
                    />
                    {newBundle.links.length > 1 && (
                      <button type="button" onClick={() => removeLinkField(index)} style={styles.removeButton}>Remove</button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addLinkField}
                  style={styles.addButton}
                >
                  + Add Another Link
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
                onClick={createBundle}
                style={styles.saveButton}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Bundle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Bundle Modal */}
      {showEditModal && editBundle && (
        <div className="modalOverlay" style={styles.modalOverlay}>
          <div className="modalContent" style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>Edit Bundle</h2>
              <button className="closeButton" onClick={closeEditModal} style={styles.closeButton}>
                ×
              </button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Bundle Name *</label>
                <input
                  type="text"
                  value={editBundle.name}
                  onChange={e => updateEditBundle('name', e.target.value)}
                  style={styles.input}
                  placeholder="Enter bundle name"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Image *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageUpload}
                  style={styles.input}
                />
                {editBundle.imageBase64 && (
                  <img src={editBundle.imageBase64} alt="Preview" style={{ maxWidth: 120, marginTop: 10 }} />
                )}
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Song Piece Number</label>
                <select
                  value={editBundle.piece}
                  onChange={e => updateEditBundle('piece', e.target.value)}
                  style={styles.input}
                >
                  <option value="1">1</option>
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="15">15</option>
                  <option value="20">20</option>
                  <option value="25">25</option>
                  <option value="30">30</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Category</label>
                <select
                  value={editBundle.category || ''}
                  onChange={e => updateEditBundle('category', e.target.value)}
                  style={styles.input}
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>YouTube Links *</label>
                {editBundle.links.map((link, index) => (
                  <div key={index} style={styles.linkRow}>
                    <input
                      type="text"
                      value={link.name}
                      onChange={e => updateEditLink(index, 'name', e.target.value)}
                      style={styles.linkInput}
                      placeholder="Song name"
                    />
                    <input
                      type="url"
                      value={link.url}
                      onChange={e => updateEditLink(index, 'url', e.target.value)}
                      style={styles.linkInput}
                      placeholder="https://youtu.be/..."
                    />
                    {editBundle.links.length > 1 && (
                      <button type="button" onClick={() => removeEditLinkField(index)} style={styles.removeButton}>Remove</button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addEditLinkField}
                  style={styles.addButton}
                >
                  Add Link
                </button>
              </div>
              <button
                onClick={saveEditBundle}
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