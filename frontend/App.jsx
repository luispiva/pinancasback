import React, { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [view, setView] = useState(token ? 'dashboard' : 'login');
  const [form, setForm] = useState({ username: '', password: '' });
  const [despesas, setDespesas] = useState([]);
  const [nova, setNova] = useState({ descricao: '', valor: '', data: '', parcelaTotal: 1 });

  useEffect(() => {
    if (token) {
      api.get('/despesas', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => setDespesas(res.data))
        .catch(() => logout());
    }
  }, [token]);

  const login = () => {
    api.post('/login', form).then(res => {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setView('dashboard');
    }).catch(() => alert('Erro no login'));
  };

  const register = () => {
    api.post('/register', form).then(res => {
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setView('dashboard');
    }).catch(() => alert('Erro no registro'));
  };

  const logout = () => {
    setToken('');
    localStorage.removeItem('token');
    setView('login');
  };

  const salvarDespesa = () => {
    const body = {
      ...nova,
      valor: parseFloat(nova.valor),
      parcelaTotal: parseInt(nova.parcelaTotal),
    };
    api.post('/despesas', body, { headers: { Authorization: `Bearer ${token}` } })
      .then(() => {
        setNova({ descricao: '', valor: '', data: '', parcelaTotal: 1 });
        return api.get('/despesas', { headers: { Authorization: `Bearer ${token}` } });
      })
      .then(res => setDespesas(res.data));
  };

  if (view === 'login') return (
    <div className="p-10 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Pinanças 💸</h1>
      <input placeholder="Usuário" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="border p-2 w-full mb-2" />
      <input type="password" placeholder="Senha" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="border p-2 w-full mb-2" />
      <button onClick={login} className="bg-blue-500 text-white px-4 py-2 mr-2">Entrar</button>
      <button onClick={register} className="bg-gray-500 text-white px-4 py-2">Registrar</button>
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Minhas Finanças</h1>
        <button onClick={logout} className="bg-red-500 text-white px-4 py-1">Sair</button>
      </div>
      <div className="mb-4">
        <input placeholder="Descrição" value={nova.descricao} onChange={e => setNova({ ...nova, descricao: e.target.value })} className="border p-2 mr-2" />
        <input placeholder="Valor" type="number" value={nova.valor} onChange={e => setNova({ ...nova, valor: e.target.value })} className="border p-2 mr-2 w-24" />
        <input type="date" value={nova.data} onChange={e => setNova({ ...nova, data: e.target.value })} className="border p-2 mr-2" />
        <input type="number" min="1" placeholder="Parcelas" value={nova.parcelaTotal} onChange={e => setNova({ ...nova, parcelaTotal: e.target.value })} className="border p-2 w-20 mr-2" />
        <button onClick={salvarDespesa} className="bg-green-500 text-white px-4 py-2">Salvar</button>
      </div>
      <div>
        {despesas.map((d, i) => (
          <div key={i} className="border p-2 my-1 flex justify-between">
            <span>{d.data} - {d.descricao} - R${parseFloat(d.valor).toFixed(2)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
