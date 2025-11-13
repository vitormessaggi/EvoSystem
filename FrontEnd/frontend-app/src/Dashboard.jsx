import React, { useState, useEffect, useCallback } from 'react';
import './Dashboard.css';
import UserManagement from './UserManagement'; // Importado para Gestão de Admin

// URL base da API
const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Componente para exibir o modal de detalhes e anotações
const OrderDetailModal = ({ order, onClose, user, onUpdate }) => {
    const [annotationText, setAnnotationText] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddAnnotation = async () => {
        if (!annotationText.trim()) return;
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/orders/${order.id}/annotate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    texto: annotationText,
                    tecnico: user
                }),
            });

            if (response.ok) {
                const updatedOrder = await response.json();
                setAnnotationText('');
                onUpdate(updatedOrder); // Atualiza o estado no Dashboard
            } else {
                console.error('Erro ao adicionar anotação:', await response.json());
                alert('Falha ao adicionar anotação.');
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Não foi possível conectar ao servidor.');
        } finally {
            setLoading(false);
        }
    };

    if (!order) return null;

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Detalhes da OS #{order.id}</h3>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <div className="order-summary">
                        <p><strong>Item:</strong> {order.item} ({order.quantidade} un)</p>
                        <p><strong>Cliente:</strong> {order.cliente}</p>
                        <p><strong>OM:</strong> {order.om}</p>
                        <p><strong>Técnico:</strong> {order.tecnico || 'N/A'}</p>
                        <p><strong>NF Entrada:</strong> {order.notaEntrada}</p>
                        <p><strong>NF Saída:</strong> {order.notaSaida || 'N/A'}</p>
                        <p><strong>Status:</strong> <span className={`status-badge status-${order.status.toLowerCase().replace(/\s/g, '-')}`}>{order.status}</span></p>
                        <p><strong>Problema:</strong> {order.descricao}</p>
                    </div>

                    <div className="annotation-history">
                        <h4>Histórico de Anotações</h4>
                        {order.anotacoes && order.anotacoes.length > 0 ? (
                            order.anotacoes.sort((a, b) => new Date(b.data) - new Date(a.data)).map((ann, index) => (
                                <div key={index} className="annotation-item">
                                    <small>{new Date(ann.data).toLocaleDateString()}</small>
                                    <p>{ann.texto}</p>
                                </div>
                            ))
                        ) : (
                            <p className="no-annotations">Nenhuma anotação registrada ainda.</p>
                        )}
                    </div>

                    <div className="new-annotation-form">
                        <textarea
                            placeholder="Adicionar nova anotação/observação"
                            value={annotationText}
                            onChange={(e) => setAnnotationText(e.target.value)}
                        />
                        <button onClick={handleAddAnnotation} disabled={loading || !annotationText.trim()}>
                            {loading ? 'Adicionando...' : 'Adicionar Anotação'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Componente para o Modal de Finalizar Serviço (Saída)
const FinalizeModal = ({ order, onClose, user, onUpdate }) => {
    const [notaSaida, setNotaSaida] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFinalize = async () => {
        if (!notaSaida.trim()) return alert('Por favor, informe a Nota Fiscal de Saída.');

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${order.id}/finalize`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ notaSaida, tecnico: user }),
            });

            if (response.ok) {
                const updatedOrder = await response.json();
                onUpdate(updatedOrder);
                onClose();
            } else {
                console.error('Erro ao finalizar serviço:', await response.json());
                alert('Falha ao finalizar serviço.');
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Não foi possível conectar ao servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Finalizar Serviço (OS #{order.id})</h3>
                    <button className="close-button" onClick={onClose}>&times;</button>
                </div>
                <div className="modal-body">
                    <p>Item: <strong>{order.item}</strong> | Cliente: <strong>{order.cliente}</strong></p>
                    <label>
                        Nota Fiscal de Saída (Faturamento):
                        <input
                            type="text"
                            placeholder="Ex: NFS-12345"
                            value={notaSaida}
                            onChange={(e) => setNotaSaida(e.target.value)}
                            required
                        />
                    </label>
                    <div className="form-buttons justify-end mt-4">
                        <button onClick={onClose} className="action-button danger">Cancelar</button>
                        <button onClick={handleFinalize} disabled={loading || !notaSaida.trim()} className="action-button primary">
                            {loading ? 'Concluindo...' : 'Concluir e Registrar Saída'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


function Dashboard({ user, onLogout }) {
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentView, setCurrentView] = useState('dashboard'); 
    const [isAdding, setIsAdding] = useState(false);
    const isAdmin = user === 'admin';
    const [newOrder, setNewOrder] = useState({
        item: '',
        cliente: '',
        notaEntrada: '',
        om: '',
        quantidade: 1,
        descricao: '',
        tecnico: user,
    });
    
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showFinalizeModal, setShowFinalizeModal] = useState(null);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/orders`);
            if (response.ok) {
                const data = await response.json();
                setOrders(data);
            } else {
                console.error('Falha ao buscar OSs:', response.status);
                setOrders([]);
            }
        } catch (error) {
            console.error('Erro de rede ao buscar OSs:', error);
            alert('Não foi possível conectar ao servidor. Verifique o Backend.');
            setOrders([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (currentView === 'dashboard') {
            fetchOrders();
        }
    }, [fetchOrders, currentView]);

    const updateOrderInState = (updatedOrder) => {
        setOrders(prevOrders => prevOrders.map(order => 
            order.id === updatedOrder.id ? updatedOrder : order
        ));
    };

    const deleteOrderInState = (deletedId) => {
        setOrders(prevOrders => prevOrders.filter(order => order.id !== deletedId));
    };

    // --- Gestão de Status (Cards) ---
    const totalOpen = orders.filter(o => o.status === 'Em Aberto').length;
    const totalInProgress = orders.filter(o => o.status === 'Em Manutenção').length;
    const totalCompleted = orders.filter(o => o.status === 'Concluído').length;
    
    // --- Funções de Ação ---

    // 1. Cadastro de Nova OS
    const handleCadastro = async (e) => {
        e.preventDefault();
        
        if (newOrder.quantidade <= 0) {
            alert("A quantidade deve ser maior que zero.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrder),
            });

            if (response.ok) {
                const addedOrder = await response.json();
                setOrders(prevOrders => [...prevOrders, addedOrder]);
                setIsAdding(false);
                setNewOrder({ // Reseta o formulário
                    item: '', cliente: '', notaEntrada: '', om: '', quantidade: 1, descricao: '', tecnico: user
                });
            } else {
                console.error('Erro ao cadastrar OS:', await response.json());
                alert('Falha ao cadastrar Ordem de Serviço.');
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Não foi possível conectar ao servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    // 2. Assumir Serviço
    const handleAssumirServico = async (orderId) => {
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}/assign`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tecnico: user }),
            });
            
            if (response.ok) {
                const updatedOrder = await response.json();
                updateOrderInState(updatedOrder); // Atualiza a lista
            } else {
                alert('Falha ao assumir serviço.');
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Não foi possível conectar ao servidor.');
        } finally {
            setIsLoading(false);
        }
    };

    // 3. Excluir OS (Admin)
    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm(`Tem certeza que deseja EXCLUIR a OS #${orderId}? Esta ação é irreversível.`)) {
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
                method: 'DELETE',
            });
            
            if (response.ok) {
                deleteOrderInState(orderId);
                alert(`OS #${orderId} excluída com sucesso.`);
            } else {
                alert('Falha ao excluir a Ordem de Serviço.');
            }
        } catch (error) {
            console.error('Erro de rede:', error);
            alert('Não foi possível conectar ao servidor.');
        } finally {
            setIsLoading(false);
        }
    };
    
    // --- Renderização Principal ---
    
    if (currentView === 'management') {
        return <UserManagement user={user} onBack={() => setCurrentView('dashboard')} />;
    }

    if (isLoading) {
        return <div className="loading-state">Carregando Ordens de Serviço...</div>;
    }

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <h2>Olá, {user}! Gestão de Manutenção</h2>
                <div className="dashboard-actions">
                    {isAdmin && (
                        <button 
                            className="action-button admin-management"
                            onClick={() => setCurrentView('management')}
                        >
                            ⚙ Gestão de Usuários
                        </button>
                    )}
                    
                    <button 
                        className="action-button primary"
                        onClick={() => setIsAdding(!isAdding)}
                    >
                        {isAdding ? '✖ Fechar Cadastro' : '➕ Nova Ordem de Serviço'}
                    </button>
                    <button onClick={onLogout} className="logout-button">Sair</button>
                </div>
            </header>

            {/* Cards de Status */}
            <section className="status-cards">
                <div className="card open">
                    <h4>Em Aberto</h4>
                    <p>{totalOpen}</p>
                </div>
                <div className="card in-progress">
                    <h4>Em Manutenção</h4>
                    <p>{totalInProgress}</p>
                </div>
                <div className="card completed">
                    <h4>Concluído</h4>
                    <p>{totalCompleted}</p>
                </div>
            </section>


            {/* Formulário de Cadastro Condicional */}
            {isAdding && (
                <section className="cadastro-form-section">
                    <h3>Registro de Nova OS</h3>
                    <form onSubmit={handleCadastro} className="cadastro-form">
                        <input 
                            type="text" 
                            placeholder="Nome do Equipamento/Item" 
                            value={newOrder.item}
                            onChange={(e) => setNewOrder({...newOrder, item: e.target.value})}
                            required 
                        />
                         <input 
                            type="text" 
                            placeholder="OM do Equipamento (Rastreio Interno)" 
                            value={newOrder.om}
                            onChange={(e) => setNewOrder({...newOrder, om: e.target.value})}
                            required 
                        />
                        <input 
                            type="number" 
                            placeholder="Quantidade" 
                            value={newOrder.quantidade}
                            onChange={(e) => setNewOrder({...newOrder, quantidade: parseInt(e.target.value) || 0})}
                            min="1"
                            required 
                        />
                        <input 
                            type="text" 
                            placeholder="Nome do Cliente" 
                            value={newOrder.cliente}
                            onChange={(e) => setNewOrder({...newOrder, cliente: e.target.value})}
                            required 
                        />
                        <input 
                            type="text" 
                            placeholder="Nota Fiscal de Entrada (NF)" 
                            value={newOrder.notaEntrada}
                            onChange={(e) => setNewOrder({...newOrder, notaEntrada: e.target.value})}
                            required 
                        />
                        <textarea 
                            placeholder="Descrição Detalhada do Problema"
                            value={newOrder.descricao}
                            onChange={(e) => setNewOrder({...newOrder, descricao: e.target.value})}
                            required 
                        />
                        <div className="form-buttons">
                            <button type="submit" className="action-button primary" disabled={isLoading}>
                                Registrar Entrada
                            </button>
                        </div>
                    </form>
                </section>
            )}

            <section className="product-list">
                {/* CORREÇÃO DE SINTAXE APLICADA AQUI: */}
                <h3>Itens em Acompanhamento (Total: {orders.length})</h3> 
                <table className="inventory-table">
                    <thead>
                        <tr>
                            <th>OS #</th>
                            <th>Item</th>
                            <th>OM</th>
                            <th>Qtd</th>
                            <th>Cliente</th>
                            <th>Status</th>
                            <th>Técnico</th>
                            <th>Data Entrada</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map(item => (
                            <tr key={item.id} onClick={() => setSelectedOrder(item)} style={{cursor: 'pointer'}}>
                                <td>{item.id}</td>
                                <td>{item.item}</td>
                                <td>{item.om}</td>
                                <td>{item.quantidade}</td>
                                <td>{item.cliente}</td>
                                <td>
                                    <span className={`status-badge status-${item.status.toLowerCase().replace(/\s/g, '-')}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td>{item.tecnico || 'N/A'}</td>
                                <td>{new Date(item.dataEntrada).toLocaleDateString()}</td>
                                <td>
                                    {isAdmin && (
                                         <button 
                                            onClick={(e) => { e.stopPropagation(); handleDeleteOrder(item.id); }}
                                            className="table-action danger"
                                        >
                                            Excluir
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(item); }}
                                        className="table-action view ml-2"
                                    >
                                        Ver OS
                                    </button>
                                    
                                    {item.status === 'Em Aberto' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleAssumirServico(item.id); }}
                                            className="table-action assign ml-2"
                                            disabled={isLoading}
                                        >
                                            Assumir Serviço
                                        </button>
                                    )}

                                    {item.status === 'Em Manutenção' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setShowFinalizeModal(item); }}
                                            className="table-action complete ml-2"
                                        >
                                            Registrar Saída
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>
            
            {/* Modais */}
            {selectedOrder && (
                <OrderDetailModal 
                    order={selectedOrder} 
                    onClose={() => setSelectedOrder(null)} 
                    user={user} 
                    onUpdate={updateOrderInState}
                />
            )}
             {showFinalizeModal && (
                <FinalizeModal 
                    order={showFinalizeModal} 
                    onClose={() => setShowFinalizeModal(null)} 
                    user={user} 
                    onUpdate={updateOrderInState}
                />
            )}
        </div>
    );
}

export default Dashboard;