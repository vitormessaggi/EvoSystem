import React, { useState } from 'react';
import './Login.css'; // Estilos para o login

function Login({ onLoginSuccess }) {
  // Estados para armazenar o nome de usuário e a senha
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
    
  // NOTA: O bypass estático foi removido para usar a API real.

  // Função chamada ao submeter o formulário
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previne o recarregamento padrão da página

    setLoading(true);
    setError('');

    // Tenta a comunicação com o Backend Python/Flask
    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log('Login OK:', data.message);
        onLoginSuccess(data.user);
      } else {
        // Credenciais inválidas (401) ou erro do servidor
        setError(data.message || 'Credenciais inválidas. Tente admin/123.');
      }
    } catch (err) {
      console.error("Falha ao comunicar com a API:", err);
      // Erro de rede (servidor Flask não está rodando)
      setError('Não foi possível conectar ao servidor. O Backend está ativo?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Acesso ao Sistema</h2>
        <form onSubmit={handleSubmit}>
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

          <button type="submit" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </button>

          {error && <p className="error-message">{error}</p>}
        </form>
      </div>
    </div>
  );
}

export default Login;