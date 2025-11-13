import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

function UserManagement({ user, onBack }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/users`);
            if (response.ok) {
                const data = await response.json();
                setUsers(data);
            } else {
                setError('Falha ao carregar lista de usuários.');
            }
        } catch (error) {
            setError('Não foi possível conectar ao servidor para carregar usuários.');
        } finally {
            setLoadingUsers(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRegister = async (e) => {
        e.preventDefault();

        setLoading(true);
        setSuccess('');
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccess(`Usuário ${username} cadastrado com sucesso!`);
                setUsername('');
                setPassword('');
                fetchUsers(); // Recarrega a lista
            } else {
                setError(data.message || 'Erro ao cadastrar usuário.');
            }
        } catch (err) {
            setError('Não foi possível conectar ao servidor de registro.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="user-management-container">
            <header className="dashboard-header justify-start">
                <button className="action-button danger" onClick={onBack} style={{ marginRight: '20px' }}>
                    &larr; Voltar ao Dashboard
                </button>
                <h2>Gestão de Usuários (Admin)</h2>
            </header>

            {/* --- Cadastro de Usuário --- */}
            <section className="cadastro-form-section" style={{ maxWidth: '500px', margin: '0 auto' }}>
                <h3>Cadastrar Novo Técnico/Usuário</h3>
                
                {success && <p className="success-message">{success}</p>}
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleRegister} className="cadastro-form">
                    <input 
                        type="text" 
                        placeholder="Nome de Usuário" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required 
                    />
                    <input 
                        type="password" 
                        placeholder="Senha" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                    />
                    
                    <button type="submit" className="action-button primary" disabled={loading}>
                        {loading ? 'Cadastrando...' : 'Cadastrar Usuário'}
                    </button>
                </form>
            </section>
            
            {/* --- Visualização de Usuários --- */}
            <section className="user-list-section">
                <h3>Técnicos Registrados ({users.length})</h3>
                {loadingUsers ? (
                    <div className="loading-state-small">Carregando técnicos...</div>
                ) : (
                    <table className="inventory-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nome de Usuário</th>
                                <th>Senha (Demo)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td>{u.id}</td>
                                    <td>{u.username}</td>
                                    <td>{u.password}</td> 
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    );
}

export default UserManagement;