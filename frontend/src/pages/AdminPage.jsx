import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Trash2, Plus, Search, FileText, List, HelpCircle } from 'lucide-react';

const AdminPage = () => {
    const [services, setServices] = useState([]);
    const [filteredServices, setFilteredServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Editing state
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [activeEditTab, setActiveEditTab] = useState('general'); // 'general', 'content', 'faq'

    const [message, setMessage] = useState({ text: '', type: '' });

    const API_URL = '';
    // Relative paths work automatically with Vite proxy (dev) and Netlify redirects (prod)

    const fetchServices = async () => {
        try {
            const response = await fetch(`${API_URL}/api/services`);
            if (!response.ok) throw new Error('Failed to fetch services');
            const data = await response.json();
            setServices(data);
            setFilteredServices(data);
        } catch (error) {
            console.error('Error:', error);
            setMessage({ text: 'Failed to load services', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    // Handle search
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredServices(services);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            const filtered = services.filter(service =>
                service.name.toLowerCase().includes(lowerQuery) ||
                service.title.toLowerCase().includes(lowerQuery)
            );
            setFilteredServices(filtered);
        }
    }, [searchQuery, services]);

    const handleEdit = (service) => {
        setEditingId(service.id);

        let details = {};
        try {
            details = typeof service.details === 'string' ? JSON.parse(service.details) : service.details;
        } catch (e) {
            details = { cards: [], faqs: [] };
        }

        setEditForm({
            name: service.name,
            title: service.title,
            description: service.description,
            cards: details?.cards || [],
            faqs: details?.faqs || []
        });
        setActiveEditTab('general');
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
        setSearchQuery('');
    };

    // --- Content (Cards) Helpers ---
    const handleCardChange = (index, field, value) => {
        const newCards = [...editForm.cards];
        newCards[index] = { ...newCards[index], [field]: value };
        setEditForm({ ...editForm, cards: newCards });
    };

    const handleCardItemsChange = (index, value) => {
        // value is a string from textarea, split by newlines for array
        const items = value.split('\n').filter(item => item.trim() !== '');
        const newCards = [...editForm.cards];
        newCards[index] = { ...newCards[index], items };
        setEditForm({ ...editForm, cards: newCards });
    };

    // --- FAQ Helpers ---
    const handleFaqChange = (index, field, value) => {
        const newFaqs = [...editForm.faqs];
        newFaqs[index] = { ...newFaqs[index], [field]: value };
        setEditForm({ ...editForm, faqs: newFaqs });
    };

    const addFaq = () => {
        setEditForm({ ...editForm, faqs: [...editForm.faqs, { q: '', a: '' }] });
    };

    const removeFaq = (index) => {
        const newFaqs = editForm.faqs.filter((_, i) => i !== index);
        setEditForm({ ...editForm, faqs: newFaqs });
    };

    const handleSave = async (id) => {
        try {
            // Reconstruct the payload
            const detailsObj = {
                cards: editForm.cards,
                faqs: editForm.faqs
            };

            const payload = {
                name: editForm.name,
                title: editForm.title,
                description: editForm.description,
                details: JSON.stringify(detailsObj)
            };

            const response = await fetch(`${API_URL}/api/services/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Failed to update service');

            setMessage({ text: 'Service updated successfully!', type: 'success' });
            setEditingId(null);
            fetchServices(); // Refresh list
        } catch (error) {
            console.error('Error:', error);
            setMessage({ text: 'Failed to update service', type: 'error' });
        }
    };

    return (
        <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto', background: '#f8f9fa', minHeight: '100vh' }}>

            {/* Header & Search */}
            <div style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                <h1 style={{ color: '#2c3e50', margin: 0 }}>Admin Dashboard</h1>

                <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '12px 20px',
                            paddingLeft: '40px',
                            borderRadius: '25px',
                            border: '1px solid #ddd',
                            outline: 'none',
                            fontSize: '1rem'
                        }}
                    />
                    <Search color="#999" size={18} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
            </div>

            {/* Notification */}
            {message.text && (
                <div style={{
                    padding: '15px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                    color: message.type === 'error' ? '#dc2626' : '#16a34a',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                    <span>{message.text}</span>
                    <button onClick={() => setMessage({ text: '', type: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666', marginTop: '50px' }}>Loading...</div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {filteredServices.map((service) => (
                        <div key={service.id} style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '25px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            border: editingId === service.id ? '2px solid #3498db' : '1px solid #eee'
                        }}>
                            {editingId === service.id ? (
                                // --- EDIT MODE ---
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                    {/* Edit Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                                        <h3 style={{ margin: 0, color: '#3498db' }}>Editing: {service.name}</h3>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => handleSave(service.id)}
                                                className="btn-save"
                                                style={{ padding: '8px 16px', borderRadius: '6px', background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                            >
                                                <Save size={18} /> Save Changes
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                style={{ padding: '8px 16px', borderRadius: '6px', background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                            >
                                                <X size={18} /> Cancel
                                            </button>
                                        </div>
                                    </div>

                                    {/* Tabs */}
                                    <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #eee' }}>
                                        {[
                                            { id: 'general', label: 'General Info', icon: FileText },
                                            { id: 'content', label: 'Process & Docs', icon: List },
                                            { id: 'faq', label: 'FAQs', icon: HelpCircle },
                                        ].map(tab => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveEditTab(tab.id)}
                                                style={{
                                                    padding: '10px 20px',
                                                    background: 'none',
                                                    border: 'none',
                                                    borderBottom: activeEditTab === tab.id ? '3px solid #3498db' : '3px solid transparent',
                                                    color: activeEditTab === tab.id ? '#3498db' : '#666',
                                                    cursor: 'pointer',
                                                    fontWeight: '600',
                                                    display: 'flex', alignItems: 'center', gap: '8px'
                                                }}
                                            >
                                                <tab.icon size={18} /> {tab.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Tab Content */}
                                    <div style={{ padding: '10px 0' }}>

                                        {/* 1. GENERAL TAB */}
                                        {activeEditTab === 'general' && (
                                            <div style={{ display: 'grid', gap: '15px' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#4b5563' }}>Service Name (Category)</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#4b5563' }}>Display Title</label>
                                                    <input
                                                        type="text"
                                                        value={editForm.title}
                                                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#4b5563' }}>Short Description</label>
                                                    <textarea
                                                        value={editForm.description}
                                                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                        rows={3}
                                                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical' }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* 2. CONTENT TAB */}
                                        {activeEditTab === 'content' && (
                                            <div style={{ display: 'grid', gap: '25px' }}>
                                                {editForm.cards.map((card, index) => (
                                                    <div key={index} style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#334155' }}>Section #{index + 1}</div>

                                                        <div style={{ marginBottom: '10px' }}>
                                                            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#64748b' }}>Section Title</label>
                                                            <input
                                                                type="text"
                                                                value={card.title}
                                                                onChange={(e) => handleCardChange(index, 'title', e.target.value)}
                                                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1' }}
                                                            />
                                                        </div>

                                                        {card.items ? (
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#64748b' }}>List Items (One per line)</label>
                                                                <textarea
                                                                    value={card.items.join('\n')}
                                                                    onChange={(e) => handleCardItemsChange(index, e.target.value)}
                                                                    rows={5}
                                                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                                                                    placeholder="Item 1&#10;Item 2&#10;Item 3"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#64748b' }}>Content Text</label>
                                                                <textarea
                                                                    value={card.content || ''}
                                                                    onChange={(e) => handleCardChange(index, 'content', e.target.value)}
                                                                    rows={5}
                                                                    style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* 3. FAQ TAB */}
                                        {activeEditTab === 'faq' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                {editForm.faqs.map((faq, index) => (
                                                    <div key={index} style={{ display: 'flex', gap: '15px', alignItems: 'start', background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                                        <div style={{ flex: 1, display: 'grid', gap: '10px' }}>
                                                            <input
                                                                type="text"
                                                                value={faq.q}
                                                                onChange={(e) => handleFaqChange(index, 'q', e.target.value)}
                                                                placeholder="Question"
                                                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontWeight: '500' }}
                                                            />
                                                            <textarea
                                                                value={faq.a}
                                                                onChange={(e) => handleFaqChange(index, 'a', e.target.value)}
                                                                placeholder="Answer"
                                                                rows={2}
                                                                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', resize: 'vertical' }}
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => removeFaq(index)}
                                                            title="Delete FAQ"
                                                            style={{ padding: '8px', borderRadius: '4px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer', marginTop: '5px' }}
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                ))}

                                                <button
                                                    onClick={addFaq}
                                                    style={{ alignSelf: 'center', padding: '10px 20px', borderRadius: '25px', background: '#e0f2fe', color: '#0ea5e9', border: 'none', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                                                >
                                                    <Plus size={18} /> Add New FAQ
                                                </button>
                                            </div>
                                        )}

                                    </div>
                                </div>
                            ) : (
                                // --- VIEW MODE ---
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '4px 10px',
                                            background: '#f1f5f9',
                                            color: '#64748b',
                                            borderRadius: '15px',
                                            fontSize: '0.8rem',
                                            marginBottom: '8px',
                                            fontWeight: '600',
                                            textTransform: 'uppercase', letterSpacing: '0.5px'
                                        }}>
                                            {service.name}
                                        </div>
                                        <h3 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '1.25rem' }}>{service.title}</h3>
                                        <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>{service.description}</p>
                                    </div>
                                    <button
                                        onClick={() => handleEdit(service)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '8px',
                                            padding: '10px 20px', borderRadius: '8px',
                                            background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer',
                                            marginLeft: '20px', fontWeight: '500', transition: 'background 0.2s'
                                        }}
                                        className="hover-btn"
                                    >
                                        <Edit2 size={18} /> Edit
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {!loading && filteredServices.length === 0 && (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                            No services found matching "{searchQuery}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminPage;
