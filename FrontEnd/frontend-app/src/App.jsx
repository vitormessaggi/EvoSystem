import React, { useState } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import './Dashboard.css'; // Importa o CSS do Dashboard

function App() {
  // Estado para verificar se o usuário está logado
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  const handleLoginSuccess = (username) => {
    setIsLoggedIn(true);
    setUser(username);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser(null);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Sistema EvoSystem - Gestão de Manutenção</h1>
      </header>
      
      {/* Renderiza o Dashboard ou a tela de Login com base no estado */}
      {isLoggedIn ? (
        <Dashboard user={user} onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;