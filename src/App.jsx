import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, DollarSign, Target, BookOpen, Trash2, AlertCircle, Download, LogOut, User } from 'lucide-react';

export default function DayTradeMonitor() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [showRegister, setShowRegister] = useState(false);
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState('operacoes');
  const [operacoes, setOperacoes] = useState([]);
  const [diarios, setDiarios] = useState([]);
  const [filtroData, setFiltroData] = useState('todos');
  const [filtroAtivo, setFiltroAtivo] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  
  const [novaOperacao, setNovaOperacao] = useState({
    data: '',
    ativo: '',
    tipo: 'compra',
    quantidade: '',
    precoEntrada: '',
    precoSaida: '',
    stopLoss: '',
    corretagem: '',
    emolumentos: '',
    taxaLiquidacao: '',
    observacoes: ''
  });

  const [novoDiario, setNovoDiario] = useState({
    data: '',
    humor: 'neutro',
    disciplina: '5',
    acertos: '',
    erros: '',
    aprendizados: '',
    observacoes: ''
  });

  const [configuracaoRisco, setConfiguracaoRisco] = useState({
    capitalTotal: '',
    riscoPorOperacao: '2',
    metaDiaria: '',
    perdaMaximaDiaria: '',
    corretgemPadrao: '10',
    emolumentosPadrao: '0.0325',
    taxaLiquidacaoPadrao: '0.0275'
  });

  // Verificar login ao carregar
  useEffect(() => {
    const loggedUser = localStorage.getItem('daytrade_current_user');
    if (loggedUser) {
      setCurrentUser(loggedUser);
      setIsLoggedIn(true);
      loadUserData(loggedUser);
    }
  }, []);

  // Salvar dados do usuário
  useEffect(() => {
    if (currentUser && isLoggedIn) {
      localStorage.setItem(`daytrade_${currentUser}_operacoes`, JSON.stringify(operacoes));
    }
  }, [operacoes, currentUser, isLoggedIn]);

  useEffect(() => {
    if (currentUser && isLoggedIn) {
      localStorage.setItem(`daytrade_${currentUser}_diarios`, JSON.stringify(diarios));
    }
  }, [diarios, currentUser, isLoggedIn]);

  useEffect(() => {
    if (currentUser && isLoggedIn) {
      localStorage.setItem(`daytrade_${currentUser}_risco`, JSON.stringify(configuracaoRisco));
    }
  }, [configuracaoRisco, currentUser, isLoggedIn]);

  const loadUserData = (username) => {
    const ops = localStorage.getItem(`daytrade_${username}_operacoes`);
    const diar = localStorage.getItem(`daytrade_${username}_diarios`);
    const risc = localStorage.getItem(`daytrade_${username}_risco`);
    
    if (ops) setOperacoes(JSON.parse(ops));
    if (diar) setDiarios(JSON.parse(diar));
    if (risc) setConfiguracaoRisco(JSON.parse(risc));
  };

  const handleLogin = () => {
    setLoginError('');
    
    if (!loginForm.username || !loginForm.password) {
      setLoginError('Preencha todos os campos');
      return;
    }

    const users = JSON.parse(localStorage.getItem('daytrade_users') || '{}');
    
    if (users[loginForm.username] && users[loginForm.username] === loginForm.password) {
      setCurrentUser(loginForm.username);
      setIsLoggedIn(true);
      localStorage.setItem('daytrade_current_user', loginForm.username);
      loadUserData(loginForm.username);
      setLoginForm({ username: '', password: '' });
    } else {
      setLoginError('Usuário ou senha incorretos');
    }
  };

  const handleRegister = () => {
    setLoginError('');
    
    if (!registerForm.username || !registerForm.password || !registerForm.confirmPassword) {
      setLoginError('Preencha todos os campos');
      return;
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setLoginError('As senhas não coincidem');
      return;
    }

    if (registerForm.password.length < 4) {
      setLoginError('A senha deve ter no mínimo 4 caracteres');
      return;
    }

    const users = JSON.parse(localStorage.getItem('daytrade_users') || '{}');
    
    if (users[registerForm.username]) {
      setLoginError('Usuário já existe');
      return;
    }

    users[registerForm.username] = registerForm.password;
    localStorage.setItem('daytrade_users', JSON.stringify(users));
    
    setCurrentUser(registerForm.username);
    setIsLoggedIn(true);
    localStorage.setItem('daytrade_current_user', registerForm.username);
    setRegisterForm({ username: '', password: '', confirmPassword: '' });
    setShowRegister(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('daytrade_current_user');
    setOperacoes([]);
    setDiarios([]);
    setConfiguracaoRisco({
      capitalTotal: '',
      riscoPorOperacao: '2',
      metaDiaria: '',
      perdaMaximaDiaria: '',
      corretgemPadrao: '10',
      emolumentosPadrao: '0.0325',
      taxaLiquidacaoPadrao: '0.0275'
    });
  };

  const calcularOperacao = () => {
    const qtd = parseFloat(novaOperacao.quantidade) || 0;
    const entrada = parseFloat(novaOperacao.precoEntrada) || 0;
    const saida = parseFloat(novaOperacao.precoSaida) || 0;
    const multiplicador = novaOperacao.tipo === 'compra' ? 1 : -1;
    
    const resultadoBruto = (saida - entrada) * qtd * multiplicador;
    
    const corretagem = parseFloat(novaOperacao.corretagem) || parseFloat(configuracaoRisco.corretgemPadrao) || 0;
    const volumeTotal = (entrada * qtd) + (saida * qtd);
    const emolumentos = volumeTotal * (parseFloat(novaOperacao.emolumentos || configuracaoRisco.emolumentosPadrao) / 100);
    const taxaLiquidacao = volumeTotal * (parseFloat(novaOperacao.taxaLiquidacao || configuracaoRisco.taxaLiquidacaoPadrao) / 100);
    
    const custoTotal = corretagem + emolumentos + taxaLiquidacao;
    const resultadoLiquido = resultadoBruto - custoTotal;
    
    const imposto = resultadoLiquido > 0 ? resultadoLiquido * 0.20 : 0;
    const resultadoFinal = resultadoLiquido - imposto;
    
    return {
      resultadoBruto: resultadoBruto.toFixed(2),
      corretagem: corretagem.toFixed(2),
      emolumentos: emolumentos.toFixed(2),
      taxaLiquidacao: taxaLiquidacao.toFixed(2),
      custoTotal: custoTotal.toFixed(2),
      resultadoLiquido: resultadoLiquido.toFixed(2),
      imposto: imposto.toFixed(2),
      resultadoFinal: resultadoFinal.toFixed(2)
    };
  };

  const adicionarOperacao = () => {
    if (!novaOperacao.data || !novaOperacao.ativo || !novaOperacao.quantidade || 
        !novaOperacao.precoEntrada || !novaOperacao.precoSaida) {
      return;
    }
    
    const calculos = calcularOperacao();
    
    const operacao = {
      id: Date.now(),
      ...novaOperacao,
      ...calculos
    };
    
    setOperacoes([operacao, ...operacoes]);
    setNovaOperacao({
      data: '',
      ativo: '',
      tipo: 'compra',
      quantidade: '',
      precoEntrada: '',
      precoSaida: '',
      stopLoss: '',
      corretagem: '',
      emolumentos: '',
      taxaLiquidacao: '',
      observacoes: ''
    });
  };

  const adicionarDiario = () => {
    if (!novoDiario.data) {
      return;
    }
    
    const diario = {
      id: Date.now(),
      ...novoDiario
    };
    
    setDiarios([diario, ...diarios]);
    setNovoDiario({
      data: '',
      humor: 'neutro',
      disciplina: '5',
      acertos: '',
      erros: '',
      aprendizados: '',
      observacoes: ''
    });
  };

  const deletarOperacao = (id) => {
    setOperacoes(operacoes.filter(op => op.id !== id));
  };

  const deletarDiario = (id) => {
    setDiarios(diarios.filter(d => d.id !== id));
  };

  const filtrarOperacoes = () => {
    let ops = [...operacoes];
    
    if (filtroAtivo) {
      ops = ops.filter(op => op.ativo.toUpperCase().includes(filtroAtivo.toUpperCase()));
    }
    
    if (filtroTipo !== 'todos') {
      ops = ops.filter(op => op.tipo === filtroTipo);
    }
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    switch(filtroData) {
      case 'hoje':
        ops = ops.filter(op => {
          const dataOp = new Date(op.data + 'T00:00:00');
          return dataOp.getTime() === hoje.getTime();
        });
        break;
      case 'semana':
        const inicioSemana = new Date(hoje);
        inicioSemana.setDate(hoje.getDate() - hoje.getDay());
        ops = ops.filter(op => {
          const dataOp = new Date(op.data + 'T00:00:00');
          return dataOp >= inicioSemana;
        });
        break;
      case 'mes':
        const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        ops = ops.filter(op => {
          const dataOp = new Date(op.data + 'T00:00:00');
          return dataOp >= inicioMes;
        });
        break;
      case 'wins':
        ops = ops.filter(op => parseFloat(op.resultadoFinal) > 0);
        break;
      case 'losses':
        ops = ops.filter(op => parseFloat(op.resultadoFinal) < 0);
        break;
    }
    
    return ops;
  };

  const calcularEstatisticas = () => {
    const operacoesFiltradas = filtrarOperacoes();
    const totalOperacoes = operacoesFiltradas.length;
    const lucroTotal = operacoesFiltradas.reduce((acc, op) => acc + parseFloat(op.resultadoFinal), 0);
    const custosTotal = operacoesFiltradas.reduce((acc, op) => acc + parseFloat(op.custoTotal), 0);
    const impostoTotal = operacoesFiltradas.reduce((acc, op) => acc + parseFloat(op.imposto), 0);
    const wins = operacoesFiltradas.filter(op => parseFloat(op.resultadoFinal) > 0).length;
    const losses = operacoesFiltradas.filter(op => parseFloat(op.resultadoFinal) < 0).length;
    const taxaAcerto = totalOperacoes > 0 ? (wins / totalOperacoes * 100).toFixed(1) : 0;
    
    const operacoesWin = operacoesFiltradas.filter(op => parseFloat(op.resultadoFinal) > 0);
    const operacoesLoss = operacoesFiltradas.filter(op => parseFloat(op.resultadoFinal) < 0);
    const lucroMedio = wins > 0 ? operacoesWin.reduce((acc, op) => acc + parseFloat(op.resultadoFinal), 0) / wins : 0;
    const prejuizoMedio = losses > 0 ? Math.abs(operacoesLoss.reduce((acc, op) => acc + parseFloat(op.resultadoFinal), 0) / losses) : 0;
    
    const payoff = prejuizoMedio > 0 ? (lucroMedio / prejuizoMedio).toFixed(2) : 0;
    
    const maiorGain = operacoesFiltradas.length > 0 ? Math.max(...operacoesFiltradas.map(op => parseFloat(op.resultadoFinal))) : 0;
    const maiorLoss = operacoesFiltradas.length > 0 ? Math.min(...operacoesFiltradas.map(op => parseFloat(op.resultadoFinal))) : 0;
    
    return { 
      totalOperacoes, 
      lucroTotal, 
      custosTotal, 
      impostoTotal, 
      wins, 
      losses, 
      taxaAcerto,
      lucroMedio,
      prejuizoMedio,
      payoff,
      maiorGain,
      maiorLoss
    };
  };

  const exportarCSV = () => {
    const headers = ['Data', 'Ativo', 'Tipo', 'Quantidade', 'Preço Entrada', 'Preço Saída', 
                     'Stop Loss', 'Resultado Bruto', 'Corretagem', 'Emolumentos', 
                     'Taxa Liquidação', 'Custos Totais', 'Imposto', 'Resultado Final', 'Observações'];
    
    const rows = operacoes.map(op => [
      op.data,
      op.ativo,
      op.tipo,
      op.quantidade,
      op.precoEntrada,
      op.precoSaida,
      op.stopLoss || '-',
      op.resultadoBruto,
      op.corretagem,
      op.emolumentos,
      op.taxaLiquidacao,
      op.custoTotal,
      op.imposto,
      op.resultadoFinal,
      (op.observacoes || '-').replace(/,/g, ';')
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operacoes_${currentUser}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const stats = calcularEstatisticas();

  // Tela de Login
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-blue-600/20 rounded-full mb-4">
              <TrendingUp size={48} className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Monitor Day Trade Pro
            </h1>
            <p className="text-slate-400">Gerencie suas operações com segurança</p>
          </div>

          {!showRegister ? (
            // Login Form
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Entrar</h2>
              
              <div>
                <label className="block text-slate-400 text-sm mb-2">Usuário</label>
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({...loginForm, username: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                  placeholder="Digite seu usuário"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Senha</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                  placeholder="Digite sua senha"
                />
              </div>

              {loginError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                  {loginError}
                </div>
              )}

              <button
                onClick={handleLogin}
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-3 font-medium transition-colors text-white"
              >
                Entrar
              </button>

              <div className="text-center">
                <button
                  onClick={() => {
                    setShowRegister(true);
                    setLoginError('');
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Não tem conta? Cadastre-se
                </button>
              </div>
            </div>
          ) : (
            // Register Form
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white mb-4">Criar Conta</h2>
              
              <div>
                <label className="block text-slate-400 text-sm mb-2">Usuário</label>
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                  className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                  placeholder="Escolha um usuário"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Senha</label>
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                  placeholder="Mínimo 4 caracteres"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-sm mb-2">Confirmar Senha</label>
                <input
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({...registerForm, confirmPassword: e.target.value})}
                  onKeyPress={(e) => e.key === 'Enter' && handleRegister()}
                  className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                  placeholder="Digite a senha novamente"
                />
              </div>

              {loginError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                  {loginError}
                </div>
              )}

              <button
                onClick={handleRegister}
                className="w-full bg-green-600 hover:bg-green-700 rounded-lg px-6 py-3 font-medium transition-colors text-white"
              >
                Criar Conta
              </button>

              <div className="text-center">
                <button
                  onClick={() => {
                    setShowRegister(false);
                    setLoginError('');
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Já tem conta? Faça login
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-slate-500 text-xs text-center">
              🔒 Seus dados ficam salvos apenas no seu navegador
            </p>
          </div>
        </div>
      </div>
    );
  }

  // App Principal (após login)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Monitor Day Trade Pro
            </h1>
            <p className="text-slate-400">Bem-vindo, <span className="text-blue-400 font-semibold">{currentUser}</span>!</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Operações</p>
                <p className="text-3xl font-bold">{stats.totalOperacoes}</p>
                <p className="text-green-400 text-xs mt-1">✓ {stats.wins} · ✗ {stats.losses}</p>
              </div>
              <Target className="text-blue-400" size={32} />
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Resultado Final</p>
                <p className={`text-2xl font-bold ${stats.lucroTotal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  R$ {stats.lucroTotal.toFixed(2)}
                </p>
                <p className="text-slate-500 text-xs mt-1">após custos</p>
              </div>
              <DollarSign className={stats.lucroTotal >= 0 ? 'text-green-400' : 'text-red-400'} size={32} />
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Payoff</p>
                <p className="text-2xl font-bold text-purple-400">
                  {stats.payoff}
                </p>
                <p className="text-slate-500 text-xs mt-1">L/P médio</p>
              </div>
              <TrendingUp className="text-purple-400" size={32} />
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Taxa Acerto</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.taxaAcerto}%</p>
                <p className="text-slate-500 text-xs mt-1">win rate</p>
              </div>
              <Target className="text-yellow-400" size={32} />
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Impostos</p>
                <p className="text-xl font-bold text-orange-400">R$ {stats.impostoTotal.toFixed(2)}</p>
                <p className="text-slate-500 text-xs mt-1">a pagar</p>
              </div>
              <AlertCircle className="text-orange-400" size={32} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-900/30 to-green-800/20 rounded-lg p-4 border border-green-700/50">
            <p className="text-green-400 text-sm font-medium mb-1">Maior Gain</p>
            <p className="text-2xl font-bold text-green-300">R$ {stats.maiorGain.toFixed(2)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-red-900/30 to-red-800/20 rounded-lg p-4 border border-red-700/50">
            <p className="text-red-400 text-sm font-medium mb-1">Maior Loss</p>
            <p className="text-2xl font-bold text-red-300">R$ {stats.maiorLoss.toFixed(2)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 rounded-lg p-4 border border-blue-700/50">
            <p className="text-blue-400 text-sm font-medium mb-1">Lucro Médio</p>
            <p className="text-2xl font-bold text-blue-300">R$ {stats.lucroMedio.toFixed(2)}</p>
          </div>
          
          <div className="bg-gradient-to-br from-orange-900/30 to-orange-800/20 rounded-lg p-4 border border-orange-700/50">
            <p className="text-orange-400 text-sm font-medium mb-1">Prejuízo Médio</p>
            <p className="text-2xl font-bold text-orange-300">R$ {stats.prejuizoMedio.toFixed(2)}</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['operacoes', 'estatisticas', 'risco', 'diario'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
              }`}
            >
              {tab === 'operacoes' && '📊 Operações'}
              {tab === 'estatisticas' && '📈 Estatísticas'}
              {tab === 'risco' && '🎯 Gerenciamento'}
              {tab === 'diario' && '📔 Diário'}
            </button>
          ))}
        </div>

        <div className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
          {activeTab === 'operacoes' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp size={24} />
                Registrar Nova Operação
              </h2>
              
              <div className="mb-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">Dados da Operação</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="date"
                      value={novaOperacao.data}
                      onChange={(e) => setNovaOperacao({...novaOperacao, data: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                    
                    <input
                      type="text"
                      placeholder="Ativo (ex: PETR4)"
                      value={novaOperacao.ativo}
                      onChange={(e) => setNovaOperacao({...novaOperacao, ativo: e.target.value.toUpperCase()})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                    
                    <select
                      value={novaOperacao.tipo}
                      onChange={(e) => setNovaOperacao({...novaOperacao, tipo: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="compra">Compra (Long)</option>
                      <option value="venda">Venda (Short)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">Preços e Quantidade</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="number"
                      placeholder="Quantidade"
                      value={novaOperacao.quantidade}
                      onChange={(e) => setNovaOperacao({...novaOperacao, quantidade: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                    
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Preço de Entrada"
                      value={novaOperacao.precoEntrada}
                      onChange={(e) => setNovaOperacao({...novaOperacao, precoEntrada: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                    
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Preço de Saída"
                      value={novaOperacao.precoSaida}
                      onChange={(e) => setNovaOperacao({...novaOperacao, precoSaida: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                    
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Stop Loss (opcional)"
                      value={novaOperacao.stopLoss}
                      onChange={(e) => setNovaOperacao({...novaOperacao, stopLoss: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-yellow-500 focus:outline-none"
                    />
                  </div>
                </div>

                {novaOperacao.quantidade && novaOperacao.precoEntrada && novaOperacao.precoSaida && (
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <h3 className="text-lg font-semibold mb-3 text-green-400">Preview do Resultado</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Resultado Bruto</p>
                        <p className={`text-xl font-bold ${parseFloat(calcularOperacao().resultadoBruto) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          R$ {calcularOperacao().resultadoBruto}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Custos Totais</p>
                        <p className="text-xl font-bold text-orange-400">
                          - R$ {calcularOperacao().custoTotal}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Imposto (20%)</p>
                        <p className="text-xl font-bold text-yellow-400">
                          - R$ {calcularOperacao().imposto}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Resultado Final</p>
                        <p className={`text-2xl font-bold ${parseFloat(calcularOperacao().resultadoFinal) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          R$ {calcularOperacao().resultadoFinal}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <textarea
                  placeholder="Observações sobre a operação"
                  value={novaOperacao.observacoes}
                  onChange={(e) => setNovaOperacao({...novaOperacao, observacoes: e.target.value})}
                  className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                  rows="3"
                />
                
                <button
                  onClick={adicionarOperacao}
                  className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-3 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <PlusCircle size={20} />
                  Adicionar Operação
                </button>
              </div>

              <h3 className="text-xl font-bold mb-4">Histórico de Operações</h3>
              
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select
                    value={filtroData}
                    onChange={(e) => setFiltroData(e.target.value)}
                    className="bg-slate-700 rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="todos">📅 Todas as datas</option>
                    <option value="hoje">Hoje</option>
                    <option value="semana">Esta semana</option>
                    <option value="mes">Este mês</option>
                    <option value="wins">✓ Apenas Wins</option>
                    <option value="losses">✗ Apenas Losses</option>
                  </select>
                  
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="bg-slate-700 rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="todos">Todos os tipos</option>
                    <option value="compra">🟢 Long</option>
                    <option value="venda">🔴 Short</option>
                  </select>
                  
                  <input
                    type="text"
                    placeholder="🔍 Filtrar por ativo..."
                    value={filtroAtivo}
                    onChange={(e) => setFiltroAtivo(e.target.value)}
                    className="bg-slate-700 rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                  
                  <button
                    onClick={exportarCSV}
                    className="bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Download size={18} />
                    Exportar CSV
                  </button>
                </div>
                
                {(filtroData !== 'todos' || filtroAtivo || filtroTipo !== 'todos') && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400">
                      Mostrando {filtrarOperacoes().length} de {operacoes.length} operações
                    </span>
                    <button
                      onClick={() => {
                        setFiltroData('todos');
                        setFiltroAtivo('');
                        setFiltroTipo('todos');
                      }}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      Limpar filtros
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-3">
                {filtrarOperacoes().map(op => (
                  <div key={op.id} className="bg-slate-700/50 rounded-lg p-5 border border-slate-600">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="font-bold text-xl">{op.ativo}</span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            op.tipo === 'compra' ? 'bg-green-600/30 text-green-400' : 'bg-red-600/30 text-red-400'
                          }`}>
                            {op.tipo === 'compra' ? 'LONG' : 'SHORT'}
                          </span>
                          <span className="text-slate-400 text-sm">{op.data}</span>
                          {op.stopLoss && (
                            <span className="px-2 py-1 bg-yellow-600/30 text-yellow-400 rounded text-xs">
                              SL: R$ {parseFloat(op.stopLoss).toFixed(2)}
                            </span>
                          )}
                        </div>
                        
                        <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-3 rounded-lg border-2 border-slate-600">
                          <span className="text-slate-400 text-sm">Resultado Final:</span>
                          <span className={`ml-3 text-2xl font-bold ${parseFloat(op.resultadoFinal) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            R$ {op.resultadoFinal}
                          </span>
                        </div>
                        
                        {op.observacoes && (
                          <p className="text-slate-400 text-sm mt-3 p-2 bg-slate-800/50 rounded italic">
                            💭 {op.observacoes}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => deletarOperacao(op.id)}
                        className="text-red-400 hover:text-red-300 ml-4 p-2 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {filtrarOperacoes().length === 0 && (
                  <p className="text-slate-400 text-center py-8">
                    {operacoes.length === 0 ? 'Nenhuma operação registrada ainda' : 'Nenhuma operação encontrada'}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'estatisticas' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp size={24} />
                Análise Estatística Completa
              </h2>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4 text-blue-400">Performance por Ativo</h3>
                {(() => {
                  const ativoStats = {};
                  operacoes.forEach(op => {
                    if (!ativoStats[op.ativo]) {
                      ativoStats[op.ativo] = { 
                        wins: 0, 
                        losses: 0, 
                        lucro: 0,
                        operacoes: 0
                      };
                    }
                    ativoStats[op.ativo].operacoes++;
                    ativoStats[op.ativo].lucro += parseFloat(op.resultadoFinal);
                    if (parseFloat(op.resultadoFinal) > 0) {
                      ativoStats[op.ativo].wins++;
                    } else if (parseFloat(op.resultadoFinal) < 0) {
                      ativoStats[op.ativo].losses++;
                    }
                  });

                  return Object.keys(ativoStats).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(ativoStats)
                        .sort((a, b) => b[1].lucro - a[1].lucro)
                        .map(([ativo, dados]) => {
                          const taxaAcerto = dados.operacoes > 0 ? (dados.wins / dados.operacoes * 100).toFixed(1) : 0;
                          return (
                            <div key={ativo} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-lg">{ativo}</span>
                                <span className={`text-xl font-bold ${dados.lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  R$ {dados.lucro.toFixed(2)}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-400">Operações:</span>
                                  <span className="ml-2 font-semibold">{dados.operacoes}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400">Acerto:</span>
                                  <span className="ml-2 font-semibold text-blue-400">{taxaAcerto}%</span>
                                </div>
                                <div>
                                  <span className="text-green-400">W:{dados.wins}</span>
                                  <span className="mx-2 text-slate-500">/</span>
                                  <span className="text-red-400">L:{dados.losses}</span>
                                </div>
                              </div>
                              <div className="mt-2 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${dados.lucro >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ 
                                    width: `${Math.min(Math.abs(dados.lucro) / 100, 100)}%` 
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-8">Nenhum dado disponível ainda</p>
                  );
                })()}
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4 text-blue-400">Performance Mensal</h3>
                {(() => {
                  const mesesStats = {};
                  operacoes.forEach(op => {
                    const data = new Date(op.data + 'T00:00:00');
                    const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
                    if (!mesesStats[mesAno]) {
                      mesesStats[mesAno] = { lucro: 0, operacoes: 0, wins: 0, losses: 0 };
                    }
                    mesesStats[mesAno].lucro += parseFloat(op.resultadoFinal);
                    mesesStats[mesAno].operacoes++;
                    if (parseFloat(op.resultadoFinal) > 0) mesesStats[mesAno].wins++;
                    else if (parseFloat(op.resultadoFinal) < 0) mesesStats[mesAno].losses++;
                  });

                  const mesesOrdenados = Object.entries(mesesStats).sort((a, b) => b[0].localeCompare(a[0]));

                  return mesesOrdenados.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mesesOrdenados.map(([mes, dados]) => {
                        const [ano, mesNum] = mes.split('-');
                        const nomeMes = new Date(ano, mesNum - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
                        const taxaAcerto = dados.operacoes > 0 ? (dados.wins / dados.operacoes * 100).toFixed(1) : 0;
                        
                        return (
                          <div key={mes} className={`rounded-lg p-4 border ${dados.lucro >= 0 ? 'bg-green-900/20 border-green-700/50' : 'bg-red-900/20 border-red-700/50'}`}>
                            <h4 className="font-semibold capitalize mb-2">{nomeMes}</h4>
                            <p className={`text-2xl font-bold mb-2 ${dados.lucro >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              R$ {dados.lucro.toFixed(2)}
                            </p>
                            <div className="text-sm space-y-1">
                              <p className="text-slate-400">
                                {dados.operacoes} operações · {taxaAcerto}% acerto
                              </p>
                              <p>
                                <span className="text-green-400">✓ {dados.wins}</span>
                                <span className="mx-2 text-slate-500">/</span>
                                <span className="text-red-400">✗ {dados.losses}</span>
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-center py-8">Nenhum dado disponível ainda</p>
                  );
                })()}
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-4 text-blue-400">Análise Avançada</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <h4 className="text-slate-400 text-sm mb-2">Expectativa Matemática</h4>
                    <p className="text-2xl font-bold text-purple-400">
                      R$ {stats.totalOperacoes > 0 ? (stats.lucroTotal / stats.totalOperacoes).toFixed(2) : '0.00'}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">por operação</p>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <h4 className="text-slate-400 text-sm mb-2">Fator de Lucro</h4>
                    <p className="text-2xl font-bold text-cyan-400">
                      {(() => {
                        const totalWins = operacoes.filter(op => parseFloat(op.resultadoFinal) > 0)
                          .reduce((acc, op) => acc + parseFloat(op.resultadoFinal), 0);
                        const totalLosses = Math.abs(operacoes.filter(op => parseFloat(op.resultadoFinal) < 0)
                          .reduce((acc, op) => acc + parseFloat(op.resultadoFinal), 0));
                        return totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : '0.00';
                      })()}
                    </p>
                    <p className="text-slate-500 text-xs mt-1">lucro / prejuízo</p>
                  </div>
                  
                  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <h4 className="text-slate-400 text-sm mb-2">ROI Total</h4>
                    <p className="text-2xl font-bold text-yellow-400">
                      {configuracaoRisco.capitalTotal ? 
                        ((stats.lucroTotal / parseFloat(configuracaoRisco.capitalTotal)) * 100).toFixed(2) 
                        : '0.00'}%
                    </p>
                    <p className="text-slate-500 text-xs mt-1">sobre capital</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'risco' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Target size={24} />
                Gerenciamento de Risco
              </h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">Configurações</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-2">Capital Total</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="R$ 10.000,00"
                        value={configuracaoRisco.capitalTotal}
                        onChange={(e) => setConfiguracaoRisco({...configuracaoRisco, capitalTotal: e.target.value})}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-slate-400 mb-2">Risco por Operação (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="2%"
                        value={configuracaoRisco.riscoPorOperacao}
                        onChange={(e) => setConfiguracaoRisco({...configuracaoRisco, riscoPorOperacao: e.target.value})}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-slate-400 mb-2">Meta Diária (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="R$ 200,00"
                        value={configuracaoRisco.metaDiaria}
                        onChange={(e) => setConfiguracaoRisco({...configuracaoRisco, metaDiaria: e.target.value})}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-slate-400 mb-2">Perda Máxima Diária (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="R$ 400,00"
                        value={configuracaoRisco.perdaMaximaDiaria}
                        onChange={(e) => setConfiguracaoRisco({...configuracaoRisco, perdaMaximaDiaria: e.target.value})}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {configuracaoRisco.capitalTotal && (
                  <div className="bg-slate-700/50 rounded-lg p-6 border border-slate-600">
                    <h3 className="text-xl font-bold mb-4">Cálculos de Risco</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 p-4 rounded-lg">
                        <p className="text-slate-400">Risco por Operação</p>
                        <p className="text-3xl font-bold text-yellow-400">
                          R$ {(parseFloat(configuracaoRisco.capitalTotal) * parseFloat(configuracaoRisco.riscoPorOperacao) / 100).toFixed(2)}
                        </p>
                      </div>
                      
                      {configuracaoRisco.metaDiaria && (
                        <div className="bg-slate-800/50 p-4 rounded-lg">
                          <p className="text-slate-400">Progresso da Meta</p>
                          <p className="text-3xl font-bold text-green-400">
                            {((stats.lucroTotal / parseFloat(configuracaoRisco.metaDiaria)) * 100).toFixed(1)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'diario' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BookOpen size={24} />
                Diário de Trading
              </h2>
              
              <div className="mb-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="date"
                    value={novoDiario.data}
                    onChange={(e) => setNovoDiario({...novoDiario, data: e.target.value})}
                    className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                  
                  <select
                    value={novoDiario.humor}
                    onChange={(e) => setNovoDiario({...novoDiario, humor: e.target.value})}
                    className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="otimo">😊 Ótimo</option>
                    <option value="bom">🙂 Bom</option>
                    <option value="neutro">😐 Neutro</option>
                    <option value="ruim">😟 Ruim</option>
                    <option value="pessimo">😞 Péssimo</option>
                  </select>
                  
                  <div>
                    <label className="block text-slate-400 text-sm mb-1">Disciplina (1-10)</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={novoDiario.disciplina}
                      onChange={(e) => setNovoDiario({...novoDiario, disciplina: e.target.value})}
                      className="w-full"
                    />
                    <div className="text-center text-2xl font-bold text-blue-400">{novoDiario.disciplina}</div>
                  </div>
                </div>
                
                <textarea
                  placeholder="O que fiz certo hoje?"
                  value={novoDiario.acertos}
                  onChange={(e) => setNovoDiario({...novoDiario, acertos: e.target.value})}
                  className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                  rows="3"
                />
                
                <textarea
                  placeholder="O que fiz errado hoje?"
                  value={novoDiario.erros}
                  onChange={(e) => setNovoDiario({...novoDiario, erros: e.target.value})}
                  className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none"
                  rows="3"
                />
                
                <button
                  onClick={adicionarDiario}
                  className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-3 font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <PlusCircle size={20} />
                  Salvar Diário
                </button>
              </div>

              <h3 className="text-xl font-bold mb-4">Histórico do Diário</h3>
              <div className="space-y-4">
                {diarios.map(diario => (
                  <div key={diario.id} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400">{diario.data}</span>
                        <span className="text-2xl">
                          {diario.humor === 'otimo' && '😊'}
                          {diario.humor === 'bom' && '🙂'}
                          {diario.humor === 'neutro' && '😐'}
                          {diario.humor === 'ruim' && '😟'}
                          {diario.humor === 'pessimo' && '😞'}
                        </span>
                        <span className="text-slate-400">Disciplina: <span className="text-blue-400 font-bold">{diario.disciplina}/10</span></span>
                      </div>
                      <button
                        onClick={() => deletarDiario(diario.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    {diario.acertos && (
                      <div className="mb-2">
                        <p className="text-green-400 font-medium">✓ Acertos:</p>
                        <p className="text-slate-300">{diario.acertos}</p>
                      </div>
                    )}
                    
                    {diario.erros && (
                      <div className="mb-2">
                        <p className="text-red-400 font-medium">✗ Erros:</p>
                        <p className="text-slate-300">{diario.erros}</p>
                      </div>
                    )}
                  </div>
                ))}
                {diarios.length === 0 && (
                  <p className="text-slate-400 text-center py-8">Nenhum registro no diário ainda</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}