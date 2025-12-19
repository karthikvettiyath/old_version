import React, { useState, useEffect } from 'react';
import { Edit2, Save, X, Trash2 } from 'lucide-react';

const AdminPage = () => {
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [message, setMessage] = useState({ text: '', type: '' });

    const API_URL = '';
    // Relative paths work automatically with Vite proxy (dev) and Netlify redirects (prod)

    const fetchServices = async () => {
        try {
            const response = await fetch(`${API_URL}/api/services`);
            if (!response.ok) throw new Error('Failed to fetch services');
            const data = await response.json();
            setServices(data);
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

    const handleEdit = (service) => {
        setEditingId(service.id);
        setEditForm({
            name: service.name,
            title: service.title,
            description: service.description,
            details: service.details || ''
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSave = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/services/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(editForm),
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
        <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
            <h1 style={{ color: '#2c3e50', marginBottom: '30px' }}>Admin Portal - content Management</h1>

            {message.text && (
                <div style={{
                    padding: '15px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    backgroundColor: message.type === 'error' ? '#fee2e2' : '#dcfce7',
                    color: message.type === 'error' ? '#dc2626' : '#16a34a',
                    transition: 'all 0.3s'
                }}>
                    {message.text}
                    <button onClick={() => setMessage({ text: '', type: '' })} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={18} />
                    </button>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', fontSize: '1.2rem', color: '#666' }}>Loading services...</div>
            ) : (
                <div style={{ display: 'grid', gap: '20px' }}>
                    {services.map((service) => (
                        <div key={service.id} style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '25px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                            border: editingId === service.id ? '2px solid #3498db' : '1px solid #eee'
                        }}>
                            {editingId === service.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h3 style={{ margin: 0, color: '#3498db' }}>Editing Service #{service.id}</h3>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => handleSave(service.id)}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '5px',
                                                    padding: '8px 16px', borderRadius: '6px',
                                                    background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer'
                                                }}
                                            >
                                                <Save size={18} /> Save
                                            </button>
                                            <button
                                                onClick={handleCancel}
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '5px',
                                                    padding: '8px 16px', borderRadius: '6px',
                                                    background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer'
                                                }}
                                            >
                                                <X size={18} /> Cancel
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#4b5563' }}>Category Name</label>
                                        <input
                                            type="text"
                                            value={editForm.name}
                                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#4b5563' }}>Title</label>
                                        <input
                                            type="text"
                                            value={editForm.title}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#4b5563' }}>Description</label>
                                        <textarea
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            rows={3}
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical' }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#4b5563' }}>Detailed View Content (Markdown/HTML)</label>
                                        <textarea
                                            value={editForm.details}
                                            onChange={(e) => setEditForm({ ...editForm, details: e.target.value })}
                                            rows={6}
                                            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', resize: 'vertical', fontFamily: 'monospace' }}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '4px 8px',
                                            background: '#f3f4f6',
                                            color: '#4b5563',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            marginBottom: '8px',
                                            fontWeight: '600'
                                        }}>
                                            {service.name}
                                        </div>
                                        <h3 style={{ margin: '0 0 10px 0', color: '#1f2937' }}>{service.title}</h3>
                                        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.95rem' }}>{service.description}</p>
                                    </div>
                                    <button
                                        onClick={() => handleEdit(service)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '5px',
                                            padding: '8px 16px', borderRadius: '6px',
                                            background: '#3498db', color: '#fff', border: 'none', cursor: 'pointer',
                                            marginLeft: '20px'
                                        }}
                                    >
                                        <Edit2 size={18} /> Edit
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminPage;
