import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, DollarSign, Target, BookOpen, Trash2, AlertCircle, Download, LogOut, ChevronDown } from 'lucide-react';
// ========== CONFIGURAÇÃO DA API ==========
const API_URL = 'https://daytrade-backend.skinalanches.com.br/'; // ⚠️ MUDE PARA SUA URL!

// --- Importações para Gráficos ---
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function DayTradeMonitor() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [showRegister, setShowRegister] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('operacoes');
  const [operacoes, setOperacoes] = useState([]);
  const [diarios, setDiarios] = useState([]);
  const [filtroData, setFiltroData] = useState('todos');
  const [filtroAtivo, setFiltroAtivo] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [operacaoExpandida, setOperacaoExpandida] = useState(null);
  const [mostrarEstatisticasAvancadas, setMostrarEstatisticasAvancadas] = useState(false);
const [novaOperacao, setNovaOperacao] = useState({
  data: '',
  ativo: '',
  tipo: 'compra',
  tipoMercado: 'acoes', // 'acoes', 'indice', 'cripto'
  quantidade: '',
  precoEntrada: '',
  precoSaida: '',
  stopLoss: '',
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
    corretgemPadrao: '0.50',
    emolumentosPadrao: '0.0325',
    taxaLiquidacaoPadrao: '0.0275'
  });

  // ========== VERIFICAR LOGIN AO CARREGAR ==========
  useEffect(() => {
    const userData = localStorage.getItem('current_user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      setIsLoggedIn(true);
      loadUserData(user.id);
    }
  }, []);

  // ========== CARREGAR DADOS DO USUÁRIO ==========
  const loadUserData = async (userId) => {
    try {
      setLoading(true);
      const opsRes = await fetch(`${API_URL}api/operacoes/${userId}`);
      if (opsRes.ok) {
        const opsData = await opsRes.json();
        setOperacoes(opsData);
      }
      const configRes = await fetch(`${API_URL}api/configuracao/${userId}`);
      if (configRes.ok) {
        const configData = await configRes.json();
        if (configData && Object.keys(configData).length > 0) {
          setConfiguracaoRisco({
            capitalTotal: configData.capital_total || '',
            riscoPorOperacao: configData.risco_por_operacao || '2',
            metaDiaria: configData.meta_diaria || '',
            perdaMaximaDiaria: configData.perda_maxima_diaria || '',
            corretgemPadrao: configData.corretagem_padrao || '0.50',
            emolumentosPadrao: configData.emolumentos_padrao || '0.0325',
            taxaLiquidacaoPadrao: configData.taxa_liquidacao_padrao || '0.0275'
          });
        }
      }
      const diariosRes = await fetch(`${API_URL}api/diarios/${userId}`);
      if (diariosRes.ok) {
        const diariosData = await diariosRes.json();
        setDiarios(diariosData);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // ========== SALVAR CONFIGURAÇÕES ==========
  useEffect(() => {
    if (currentUser && isLoggedIn) {
      const timeoutId = setTimeout(async () => {
        try {
          await fetch(`${API_URL}api/configuracao`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: currentUser.id,
              capital_total: parseFloat(configuracaoRisco.capitalTotal) || null,
              risco_por_operacao: parseFloat(configuracaoRisco.riscoPorOperacao) || 2,
              meta_diaria: parseFloat(configuracaoRisco.metaDiaria) || null,
              perda_maxima_diaria: parseFloat(configuracaoRisco.perdaMaximaDiaria) || null,
              corretagem_padrao: parseFloat(configuracaoRisco.corretgemPadrao) || 0.50,
              emolumentos_padrao: parseFloat(configuracaoRisco.emolumentosPadrao) || 0.0325,
              taxa_liquidacao_padrao: parseFloat(configuracaoRisco.taxaLiquidacaoPadrao) || 0.0275
            })
          });
        } catch (error) {
          console.error('Erro ao salvar configuração:', error);
        }
      }, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [configuracaoRisco, currentUser, isLoggedIn]);

  // ========== LOGIN ==========
  const handleLogin = async () => {
    setLoginError('');
    setLoading(true);
    if (!loginForm.username || !loginForm.password) {
      setLoginError('Preencha todos os campos');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro no login');
      }
      const data = await response.json();
      const user = data.user;
      setCurrentUser(user);
      setIsLoggedIn(true);
      localStorage.setItem('current_user', JSON.stringify(user));
      await loadUserData(user.id);
      setLoginForm({ username: '', password: '' });
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== CADASTRO ==========
  const handleRegister = async () => {
    setLoginError('');
    setLoading(true);
    if (!registerForm.username || !registerForm.password || !registerForm.confirmPassword) {
      setLoginError('Preencha todos os campos');
      setLoading(false);
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setLoginError('As senhas não coincidem');
      setLoading(false);
      return;
    }
    if (registerForm.password.length < 4) {
      setLoginError('A senha deve ter no mínimo 4 caracteres');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: registerForm.username,
          password: registerForm.password
        })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro no cadastro');
      }
      const data = await response.json();
      const user = data.user;
      setCurrentUser(user);
      setIsLoggedIn(true);
      localStorage.setItem('current_user', JSON.stringify(user));
      await loadUserData(user.id);
      setRegisterForm({ username: '', password: '', confirmPassword: '' });
      setShowRegister(false);
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== LOGOUT ==========
  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('current_user');
    setOperacoes([]);
    setDiarios([]);
    setConfiguracaoRisco({
      capitalTotal: '',
      riscoPorOperacao: '2',
      metaDiaria: '',
      perdaMaximaDiaria: '',
      corretgemPadrao: '0.50',
      emolumentosPadrao: '0.0325',
      taxaLiquidacaoPadrao: '0.0275'
    });
  };

  // ========== CÁLCULOS ==========
    const calcularOperacao = (operacao = novaOperacao) => {
      const qtd = parseFloat(operacao.quantidade) || 0;
      const entrada = parseFloat(operacao.precoEntrada) || 0;
      const saida = parseFloat(operacao.precoSaida) || 0;
      const multiplicador = operacao.tipo === 'compra' ? 1 : -1;

      // --- Cálculo do volume e resultado bruto por tipo de mercado ---
      let volumeEntrada = 0;
      let volumeSaida = 0;
      let resultadoBruto = 0;

      if (operacao.tipoMercado === 'indice') {
        // Para índices: cada ponto = R$1,00
        // Ex: 1 contrato comprado em 115000 e vendido em 115200 → ganho de 200 pts = R$200
        resultadoBruto = (saida - entrada) * qtd * multiplicador * 0.2; // R$1 por ponto
        volumeEntrada = entrada * qtd * 1.0;
        volumeSaida = saida * qtd * 1.0;
      } else {
        // Ações e Cripto: preço unitário × quantidade
        resultadoBruto = (saida - entrada) * qtd * multiplicador;
        volumeEntrada = entrada * qtd;
        volumeSaida = saida * qtd;
      }

      // --- Cálculo das taxas ---
      const corretagemPadrao = parseFloat(configuracaoRisco.corretgemPadrao) || 0;
      const corretagem = corretagemPadrao * 2;

      const taxaEmolumentos = parseFloat(configuracaoRisco.emolumentosPadrao) / 100;
      const emolumentos = (volumeEntrada + volumeSaida) * taxaEmolumentos;

      const taxaLiquidacaoPerc = parseFloat(configuracaoRisco.taxaLiquidacaoPadrao) / 100;
      const taxaLiquidacao = (volumeEntrada + volumeSaida) * taxaLiquidacaoPerc;

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

  // ========== ADICIONAR OPERAÇÃO ==========
  const adicionarOperacao = async () => {
    if (!novaOperacao.data || !novaOperacao.ativo || !novaOperacao.quantidade ||
        !novaOperacao.precoEntrada || !novaOperacao.precoSaida) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }
    const calculos = calcularOperacao();
    try {
      const response = await fetch(`${API_URL}api/operacoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          data: novaOperacao.data,
          ativo: novaOperacao.ativo,
          tipo_mercado: novaOperacao.tipoMercado,
          tipo: novaOperacao.tipo,
          quantidade: parseInt(novaOperacao.quantidade),
          preco_entrada: parseFloat(novaOperacao.precoEntrada),
          preco_saida: parseFloat(novaOperacao.precoSaida),
          stop_loss: novaOperacao.stopLoss ? parseFloat(novaOperacao.stopLoss) : null,
          resultado_bruto: parseFloat(calculos.resultadoBruto),
          corretagem: parseFloat(calculos.corretagem),
          emolumentos: parseFloat(calculos.emolumentos),
          taxa_liquidacao: parseFloat(calculos.taxaLiquidacao),
          custo_total: parseFloat(calculos.custoTotal),
          imposto: parseFloat(calculos.imposto),
          resultado_final: parseFloat(calculos.resultadoFinal),
          observacoes: novaOperacao.observacoes || null
        })
      });
      if (response.ok) {
        await loadUserData(currentUser.id);
        setNovaOperacao({
          data: '',
          ativo: '',
          tipo: 'compra',
          quantidade: '',
          precoEntrada: '',
          precoSaida: '',
          stopLoss: '',
          observacoes: ''
        });
        alert('Operação adicionada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao adicionar operação:', error);
      alert('Erro ao adicionar operação');
    }
  };

  // ========== DELETAR OPERAÇÃO ==========
  const deletarOperacao = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar esta operação?')) return;
    try {
      const response = await fetch(`${API_URL}api/operacoes/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setOperacoes(operacoes.filter(op => op.id !== id));
        setOperacaoExpandida(null);
        alert('Operação deletada com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao deletar operação:', error);
      alert('Erro ao deletar operação');
    }
  };

  // ========== ADICIONAR DIÁRIO ==========
  const adicionarDiario = async () => {
    if (!novoDiario.data) {
      alert('Preencha a data');
      return;
    }
    try {
      const response = await fetch(`${API_URL}api/diarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: currentUser.id,
          data: novoDiario.data,
          humor: novoDiario.humor,
          disciplina: parseInt(novoDiario.disciplina),
          acertos: novoDiario.acertos || null,
          erros: novoDiario.erros || null,
          aprendizados: novoDiario.aprendizados || null,
          observacoes: novoDiario.observacoes || null
        })
      });
      if (response.ok) {
        await loadUserData(currentUser.id);
        setNovoDiario({
          data: '',
          humor: 'neutro',
          disciplina: '5',
          acertos: '',
          erros: '',
          aprendizados: '',
          observacoes: ''
        });
        alert('Diário salvo com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao adicionar diário:', error);
      alert('Erro ao adicionar diário');
    }
  };

  // ========== DELETAR DIÁRIO ==========
  const deletarDiario = async (id) => {
    if (!window.confirm('Tem certeza que deseja deletar este diário?')) return;
    try {
      const response = await fetch(`${API_URL}api/diarios/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setDiarios(diarios.filter(d => d.id !== id));
        alert('Diário deletado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao deletar diário:', error);
      alert('Erro ao deletar diário');
    }
  };

  // ========== FILTROS ==========
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
        ops = ops.filter(op => parseFloat(op.resultado_final) > 0);
        break;
      case 'losses':
        ops = ops.filter(op => parseFloat(op.resultado_final) < 0);
        break;
      default:
        break;
    }
    return ops;
  };

  // ========== ESTATÍSTICAS DE DIÁRIOS ==========
  const calcularEstatisticasDiarios = () => {
    if (diarios.length === 0) {
      return {
        totalDiarios: 0,
        humorMaisFrequente: 'neutro',
        disciplinaMedia: 0,
        disciplinaAlta: 0,
        disciplinaBaixa: 0,
        humores: {
          neutro: 0,
          otimista: 0,
          pessimista: 0,
          ansioso: 0,
          confiante: 0
        }
      };
    }
    const totalDiarios = diarios.length;
    const humores = {
      neutro: diarios.filter(d => d.humor === 'neutro').length,
      otimista: diarios.filter(d => d.humor === 'otimista').length,
      pessimista: diarios.filter(d => d.humor === 'pessimista').length,
      ansioso: diarios.filter(d => d.humor === 'ansioso').length,
      confiante: diarios.filter(d => d.humor === 'confiante').length
    };
    const humorMaisFrequente = Object.entries(humores).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const disciplinaMedia = (diarios.reduce((acc, d) => acc + parseInt(d.disciplina), 0) / totalDiarios).toFixed(1);
    const disciplinaAlta = diarios.filter(d => parseInt(d.disciplina) >= 7).length;
    const disciplinaBaixa = diarios.filter(d => parseInt(d.disciplina) <= 3).length;
    return {
      totalDiarios,
      humorMaisFrequente,
      disciplinaMedia,
      disciplinaAlta,
      disciplinaBaixa,
      humores
    };
  };

  // ========== ESTATÍSTICAS ==========
  const calcularEstatisticas = () => {
    const operacoesFiltradas = filtrarOperacoes();
    const totalOperacoes = operacoesFiltradas.length;
    const lucroTotal = operacoesFiltradas.reduce((acc, op) => acc + parseFloat(op.resultado_final), 0);
    const custosTotal = operacoesFiltradas.reduce((acc, op) => acc + parseFloat(op.custo_total), 0);
    const impostoTotal = operacoesFiltradas.reduce((acc, op) => acc + parseFloat(op.imposto), 0);
    const wins = operacoesFiltradas.filter(op => parseFloat(op.resultado_final) > 0).length;
    const losses = operacoesFiltradas.filter(op => parseFloat(op.resultado_final) < 0).length;
    const taxaAcerto = totalOperacoes > 0 ? (wins / totalOperacoes * 100).toFixed(1) : 0;
    const operacoesWin = operacoesFiltradas.filter(op => parseFloat(op.resultado_final) > 0);
    const operacoesLoss = operacoesFiltradas.filter(op => parseFloat(op.resultado_final) < 0);
    const lucroMedio = wins > 0 ? operacoesWin.reduce((acc, op) => acc + parseFloat(op.resultado_final), 0) / wins : 0;
    const prejuizoMedio = losses > 0 ? Math.abs(operacoesLoss.reduce((acc, op) => acc + parseFloat(op.resultado_final), 0) / losses) : 0;
    const payoff = prejuizoMedio > 0 ? (lucroMedio / prejuizoMedio).toFixed(2) : 0;
    const maiorGain = operacoesFiltradas.length > 0 ? Math.max(...operacoesFiltradas.map(op => parseFloat(op.resultado_final))) : 0;
    const maiorLoss = operacoesFiltradas.length > 0 ? Math.min(...operacoesFiltradas.map(op => parseFloat(op.resultado_final))) : 0;
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

  // ========== PREPARAR DADOS PARA GRÁFICOS ==========
  const prepararDadosGraficoResultados = () => {
    if (operacoes.length === 0) return [];
    const resultadosPorData = operacoes.reduce((acc, op) => {
      const data = op.data;
      if (!acc[data]) {
        acc[data] = 0;
      }
      acc[data] += parseFloat(op.resultado_final);
      return acc;
    }, {});
    return Object.entries(resultadosPorData)
      .map(([data, resultado]) => ({ data, resultado: parseFloat(resultado.toFixed(2)) }))
      .sort((a, b) => new Date(a.data) - new Date(b.data));
  };

  const prepararDadosGraficoHumores = () => {
    const stats = calcularEstatisticasDiarios();
    if (stats.totalDiarios === 0) return [];
    const humores = stats.humores;
    return Object.entries(humores).map(([nome, valor]) => ({
      name: nome,
      value: valor
    }));
  };

  // ========== EXPORTAR CSV ==========
  const exportarCSV = () => {
    const headers = ['Data', 'Ativo', 'Tipo', 'Quantidade', 'Preço Entrada', 'Preço Saída',
                     'Stop Loss', 'Resultado Bruto', 'Corretagem', 'Emolumentos',
                     'Taxa Liquidação', 'Custos Totais', 'Imposto', 'Resultado Final', 'Observações'];
    const rows = operacoes.map(op => [
      op.data,
      op.ativo,
      op.tipo,
      op.quantidade,
      op.preco_entrada,
      op.preco_saida,
      op.stop_loss || '-',
      op.resultado_bruto,
      op.corretagem,
      op.emolumentos,
      op.taxa_liquidacao,
      op.custo_total,
      op.imposto,
      op.resultado_final,
      (op.observacoes || '-').replace(/,/g, ';')
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `operacoes_${currentUser.username}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // ========== CALCULAR STATS E DADOS DOS GRÁFICOS ==========
  const stats = calcularEstatisticas();
  const statsDiarios = calcularEstatisticasDiarios();
  const dadosGraficoResultados = prepararDadosGraficoResultados();
  const dadosGraficoHumores = prepararDadosGraficoHumores();

  // ========== TELA DE LOGIN ==========
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-blue-600/20 rounded-full mb-4">
              <TrendingUp size={48} className="text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Day Trade Pro
            </h1>
            <p className="text-slate-400">Gerencie suas operações com segurança</p>
          </div>
          {!showRegister ? (
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
              {loginError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                  {loginError}
                </div>
              )}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-3 font-medium transition-colors text-white disabled:opacity-50"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
              {/* <div className="text-center">
                <button
                  onClick={() => {
                    setShowRegister(true);
                    setLoginError('');
                  }}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  Não tem conta? Cadastre-se
                </button>
              </div> */}
            </div>
          ) : (
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
                />
              </div>
              {loginError && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-400 text-sm">
                  {loginError}
                </div>
              )}
              <button
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 rounded-lg px-6 py-3 font-medium transition-colors text-white disabled:opacity-50"
              >
                {loading ? 'Criando...' : 'Criar Conta'}
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
              🔒 Não tem conta? Contate o administrador do sistema.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ========== APP PRINCIPAL ==========
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        {loading && (
          <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
            Carregando...
          </div>
        )}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
              Monitor Day Trade Pro
            </h1>
            <p className="text-slate-400">Bem-vindo, <span className="text-blue-400 font-semibold">{currentUser.username}</span>!</p>
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
              </div>
              <DollarSign className={stats.lucroTotal >= 0 ? 'text-green-400' : 'text-red-400'} size={32} />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Payoff</p>
                <p className="text-2xl font-bold text-purple-400">{stats.payoff}</p>
              </div>
              <TrendingUp className="text-purple-400" size={32} />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Taxa Acerto</p>
                <p className="text-2xl font-bold text-yellow-400">{stats.taxaAcerto}%</p>
              </div>
              <Target className="text-yellow-400" size={32} />
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Impostos</p>
                <p className="text-xl font-bold text-orange-400">R$ {stats.impostoTotal.toFixed(2)}</p>
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

        {/* Gráficos - Agora no dashboard principal */}
        <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">📊 Gráficos de Desempenho</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Linha - Resultado Diário */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
                    <h4 className="text-lg font-semibold mb-2 text-blue-400">Evolução do Resultado Diário</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dadosGraficoResultados}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                            <XAxis dataKey="data" stroke="#aaa" />
                            <YAxis stroke="#aaa" tickFormatter={(value) => `R$${value}`} />
                            <Tooltip formatter={(value) => [`R$${value}`, 'Resultado']} labelFormatter={(label) => `Data: ${label}`} />
                            <Legend />
                            <Line type="monotone" dataKey="resultado" stroke="#4ade80" name="Resultado (R$)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                {/* Gráfico de Pizza - Distribuição de Humores */}
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700">
                    <h4 className="text-lg font-semibold mb-2 text-green-400">Distribuição de Humores nos Diários</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={dadosGraficoHumores}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                                nameKey="name"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            >
                                {dadosGraficoHumores.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={
                                        entry.name === 'otimista' ? '#4ade80' :
                                        entry.name === 'confiante' ? '#8b5cf6' :
                                        entry.name === 'neutro' ? '#94a3b8' :
                                        entry.name === 'ansioso' ? '#f59e0b' :
                                        '#ef4444'
                                    } />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value, name) => [`${value} vezes`, name]} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* Botão de Estatísticas Avançadas */}
        <div className="mb-8 flex justify-center">
          <button
            onClick={() => setMostrarEstatisticasAvancadas(!mostrarEstatisticasAvancadas)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-lg px-6 py-3 font-medium transition-all flex items-center gap-2 text-white shadow-lg"
          >
            <TrendingUp size={20} />
            {mostrarEstatisticasAvancadas ? '🔼 Ocultar Estatísticas Avançadas' : '🔽 Mostrar Estatísticas Avançadas'}
          </button>
        </div>

        {/* Estatísticas Avançadas - Operações */}
        {mostrarEstatisticasAvancadas && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-blue-400">📈 Estatísticas Avançadas - Operações</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-slate-400 text-sm mb-1">Total de Operações</p>
                <p className="text-3xl font-bold text-blue-400">{stats.totalOperacoes}</p>
                <p className="text-xs text-slate-500 mt-1">Wins: {stats.wins} | Losses: {stats.losses}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-slate-400 text-sm mb-1">Payoff Ratio</p>
                <p className="text-3xl font-bold text-purple-400">{stats.payoff}</p>
                <p className="text-xs text-slate-500 mt-1">Lucro médio / Prejuízo médio</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-slate-400 text-sm mb-1">Taxa de Acerto</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.taxaAcerto}%</p>
                <p className="text-xs text-slate-500 mt-1">Wins / Total de ops</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-slate-400 text-sm mb-1">Custos Totais</p>
                <p className="text-3xl font-bold text-orange-400">R$ {stats.custosTotal.toFixed(2)}</p>
                <p className="text-xs text-slate-500 mt-1">Corretagem, emolumentos, taxas</p>
              </div>
            </div>
          </div>
        )}

        {/* Estatísticas Avançadas - Diários */}
        {mostrarEstatisticasAvancadas && diarios.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-green-400">📔 Estatísticas Avançadas - Diários</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-slate-400 text-sm mb-1">Total de Diários</p>
                <p className="text-3xl font-bold text-purple-400">{statsDiarios.totalDiarios}</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-slate-400 text-sm mb-1">Disciplina Média</p>
                <p className="text-3xl font-bold text-pink-400">{statsDiarios.disciplinaMedia}/10</p>
                <div className="mt-2 bg-slate-800/50 px-2 py-1 rounded text-xs">
                  <span className="text-green-400">Alta: {statsDiarios.disciplinaAlta}</span>
                  <span className="text-red-400 ml-2">Baixa: {statsDiarios.disciplinaBaixa}</span>
                </div>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-slate-400 text-sm mb-1">Humor Predominante</p>
                <p className="text-4xl text-center">
                  {statsDiarios.humorMaisFrequente === 'neutro' && '😐'}
                  {statsDiarios.humorMaisFrequente === 'otimista' && '😊'}
                  {statsDiarios.humorMaisFrequente === 'pessimista' && '😞'}
                  {statsDiarios.humorMaisFrequente === 'ansioso' && '😰'}
                  {statsDiarios.humorMaisFrequente === 'confiante' && '😎'}
                </p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                <p className="text-slate-400 text-sm mb-1">Distribuição de Humores</p>
                <div className="space-y-1 text-xs mt-2">
                  <p>😐 Neutro: {statsDiarios.humores.neutro}</p>
                  <p>😊 Otimista: {statsDiarios.humores.otimista}</p>
                  <p>😞 Pessimista: {statsDiarios.humores.pessimista}</p>
                  <p>😰 Ansioso: {statsDiarios.humores.ansioso}</p>
                  <p>😎 Confiante: {statsDiarios.humores.confiante}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {['operacoes', 'diarios', 'risco'].map(tab => (
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
              {tab === 'diarios' && '📔 Diários'}
              {tab === 'risco' && '🎯 Gerenciamento'}
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
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input
                      type="date"
                      value={novaOperacao.data}
                      onChange={(e) => setNovaOperacao({...novaOperacao, data: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                    />
                    <select
                      value={novaOperacao.tipoMercado}
                      onChange={(e) => setNovaOperacao({...novaOperacao, tipoMercado: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                    >
                      <option value="acoes">📊 Ações </option>
                      <option value="indice">📈 Índice </option>
                      <option value="cripto">💰 Cripto </option>
                    </select>
                    <input
                      type="text"
                      placeholder="Ativo "
                      value={novaOperacao.ativo}
                      onChange={(e) => setNovaOperacao({...novaOperacao, ativo: e.target.value.toUpperCase()})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                    />
                    <select
                      value={novaOperacao.tipo}
                      onChange={(e) => setNovaOperacao({...novaOperacao, tipo: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                    >
                      <option value="compra">Compra </option>
                      <option value="venda">Venda </option>
                    </select>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">Preços e Quantidade</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Quantidade */}
                    <input
                      type="number"
                      step={novaOperacao.tipoMercado === 'cripto' ? '0.000001' : '1'}
                      placeholder={
                        novaOperacao.tipoMercado === 'acoes' ? 'Quantidade (ex: 100)' :
                        novaOperacao.tipoMercado === 'indice' ? 'Contratos (ex: 1)' :
                        'Quantidade (ex: 0.05)'
                      }
                      value={novaOperacao.quantidade}
                      onChange={(e) => setNovaOperacao({...novaOperacao, quantidade: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                    />
                    {/* Preço Entrada */}
                    <input
                      type="number"
                      step={novaOperacao.tipoMercado === 'cripto' ? '0.01' : novaOperacao.tipoMercado === 'indice' ? '1' : '0.01'}
                      placeholder={
                        novaOperacao.tipoMercado === 'acoes' ? 'Preço Entrada R$/ação' :
                        novaOperacao.tipoMercado === 'indice' ? 'Entrada em Pontos (ex: 115000)' :
                        'Preço Entrada R$/moeda'
                      }
                      value={novaOperacao.precoEntrada}
                      onChange={(e) => setNovaOperacao({...novaOperacao, precoEntrada: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                    />
                    {/* Preço Saída */}
                    <input
                      type="number"
                      step={novaOperacao.tipoMercado === 'cripto' ? '0.01' : novaOperacao.tipoMercado === 'indice' ? '1' : '0.01'}
                      placeholder={
                        novaOperacao.tipoMercado === 'acoes' ? 'Preço Saída R$/ação' :
                        novaOperacao.tipoMercado === 'indice' ? 'Saída em Pontos (ex: 115200)' :
                        'Preço Saída R$/moeda'
                      }
                      value={novaOperacao.precoSaida}
                      onChange={(e) => setNovaOperacao({...novaOperacao, precoSaida: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                    />
                    {/* Stop Loss */}
                    <input
                      type="number"
                      step={novaOperacao.tipoMercado === 'indice' ? '1' : '0.01'}
                      placeholder={
                        novaOperacao.tipoMercado === 'indice' ? 'Stop Loss em Pontos' : 'Stop Loss'
                      }
                      value={novaOperacao.stopLoss}
                      onChange={(e) => setNovaOperacao({...novaOperacao, stopLoss: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-yellow-500 focus:outline-none text-white"
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
                  className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                  rows="3"
                />

                <button
                  onClick={adicionarOperacao}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 rounded-lg px-6 py-3 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-white"
                >
                  <PlusCircle size={20} />
                  Adicionar Operação
                </button>
              </div>

              {/* Restante do histórico de operações (sem alterações) */}
              <h3 className="text-xl font-bold mb-4">Histórico de Operações</h3>
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <select
                    value={filtroData}
                    onChange={(e) => setFiltroData(e.target.value)}
                    className="bg-slate-700 rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
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
                    className="bg-slate-700 rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
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
                    className="bg-slate-700 rounded-lg px-4 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                  />
                  <button
                    onClick={exportarCSV}
                    className="bg-green-600 hover:bg-green-700 rounded-lg px-4 py-2 font-medium transition-colors flex items-center justify-center gap-2 text-white"
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
                  <div key={op.id}>
                    <div
                      onClick={() => setOperacaoExpandida(operacaoExpandida === op.id ? null : op.id)}
                      className="bg-slate-700/50 rounded-lg p-5 border border-slate-600 cursor-pointer hover:bg-slate-700/70 transition-colors"
                    >
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
                            {op.stop_loss && (
                              <span className="px-2 py-1 bg-yellow-600/30 text-yellow-400 rounded text-xs">
                                SL: R$ {parseFloat(op.stop_loss).toFixed(2)}
                              </span>
                            )}
                          </div>
                          <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-3 rounded-lg border-2 border-slate-600">
                            <span className="text-slate-400 text-sm">Resultado Final:</span>
                            <span className={`ml-3 text-2xl font-bold ${parseFloat(op.resultado_final) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              R$ {parseFloat(op.resultado_final).toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <ChevronDown
                            size={20}
                            className={`transition-transform ${operacaoExpandida === op.id ? 'rotate-180' : ''}`}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deletarOperacao(op.id);
                            }}
                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                    {operacaoExpandida === op.id && (
                      <div className="bg-slate-800/30 border border-slate-600 border-t-0 rounded-b-lg p-4 space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-700/50 p-3 rounded">
                            <p className="text-slate-400 text-xs">Quantidade</p>
                            <p className="text-lg font-bold text-white">{op.quantidade}</p>
                          </div>
                          <div className="bg-slate-700/50 p-3 rounded">
                            <p className="text-slate-400 text-xs">Preço Entrada</p>
                            <p className="text-lg font-bold text-blue-400">R$ {parseFloat(op.preco_entrada).toFixed(2)}</p>
                          </div>
                          <div className="bg-slate-700/50 p-3 rounded">
                            <p className="text-slate-400 text-xs">Preço Saída</p>
                            <p className="text-lg font-bold text-purple-400">R$ {parseFloat(op.preco_saida).toFixed(2)}</p>
                          </div>
                          <div className="bg-slate-700/50 p-3 rounded">
                            <p className="text-slate-400 text-xs">Resultado Bruto</p>
                            <p className={`text-lg font-bold ${parseFloat(op.resultado_bruto) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              R$ {parseFloat(op.resultado_bruto).toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <div className="border-t border-slate-600 pt-3">
                          <p className="text-sm font-semibold text-yellow-400 mb-2">💰 Detalhamento de Custos</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div className="bg-slate-700/50 p-2 rounded">
                              <p className="text-slate-400 text-xs">Corretagem</p>
                              <p className="font-bold text-white">R$ {parseFloat(op.corretagem).toFixed(2)}</p>
                            </div>
                            <div className="bg-slate-700/50 p-2 rounded">
                              <p className="text-slate-400 text-xs">Emolumentos</p>
                              <p className="font-bold text-white">R$ {parseFloat(op.emolumentos).toFixed(2)}</p>
                            </div>
                            <div className="bg-slate-700/50 p-2 rounded">
                              <p className="text-slate-400 text-xs">Taxa Liquidação</p>
                              <p className="font-bold text-white">R$ {parseFloat(op.taxa_liquidacao).toFixed(2)}</p>
                            </div>
                            <div className="bg-orange-700/30 p-2 rounded border border-orange-600/50">
                              <p className="text-orange-300 text-xs">Custo Total</p>
                              <p className="font-bold text-orange-300">R$ {parseFloat(op.custo_total).toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                        {op.observacoes && (
                          <div className="border-t border-slate-600 pt-3">
                            <p className="text-slate-400 text-xs mb-1">Observações</p>
                            <p className="text-slate-300 text-sm p-2 bg-slate-800/50 rounded italic">
                              💭 {op.observacoes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
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
          {activeTab === 'diarios' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <BookOpen size={24} />
                Diário de Trading
              </h2>
              <div className="mb-8 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">Registrar Novo Diário</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="date"
                      value={novoDiario.data}
                      onChange={(e) => setNovoDiario({...novoDiario, data: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                    />
                    <select
                      value={novoDiario.humor}
                      onChange={(e) => setNovoDiario({...novoDiario, humor: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                    >
                      <option value="neutro">😐 Neutro</option>
                      <option value="otimista">😊 Otimista</option>
                      <option value="pessimista">😞 Pessimista</option>
                      <option value="ansioso">😰 Ansioso</option>
                      <option value="confiante">😎 Confiante</option>
                    </select>
                    <div>
                      <label className="block text-slate-400 text-xs mb-1">Disciplina: {novoDiario.disciplina}/10</label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={novoDiario.disciplina}
                        onChange={(e) => setNovoDiario({...novoDiario, disciplina: e.target.value})}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">Reflexão do Dia</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Acertos de hoje (ex: Tive paciência, segui regras)"
                      value={novoDiario.acertos}
                      onChange={(e) => setNovoDiario({...novoDiario, acertos: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                    />
                    <input
                      type="text"
                      placeholder="Erros de hoje (ex: Entrei sem análise)"
                      value={novoDiario.erros}
                      onChange={(e) => setNovoDiario({...novoDiario, erros: e.target.value})}
                      className="bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                    />
                  </div>
                </div>
                <textarea
                  placeholder="O que aprendi hoje? Quais foram os pontos-chave?"
                  value={novoDiario.aprendizados}
                  onChange={(e) => setNovoDiario({...novoDiario, aprendizados: e.target.value})}
                  className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                  rows="3"
                />
                <textarea
                  placeholder="Observações adicionais"
                  value={novoDiario.observacoes}
                  onChange={(e) => setNovoDiario({...novoDiario, observacoes: e.target.value})}
                  className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                  rows="2"
                />
                <button
                  onClick={adicionarDiario}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 rounded-lg px-6 py-3 font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-white"
                >
                  <PlusCircle size={20} />
                  Salvar Diário
                </button>
              </div>
              <h3 className="text-xl font-bold mb-4">Histórico de Diários</h3>
              <div className="space-y-3">
                {[...diarios].reverse().map(diario => (
                  <div key={diario.id} className="bg-slate-700/50 rounded-lg p-5 border border-slate-600">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="font-bold text-lg text-white">{diario.data}</span>
                          <span className="text-2xl">
                            {diario.humor === 'neutro' && '😐'}
                            {diario.humor === 'otimista' && '😊'}
                            {diario.humor === 'pessimista' && '😞'}
                            {diario.humor === 'ansioso' && '😰'}
                            {diario.humor === 'confiante' && '😎'}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            diario.disciplina >= 7 ? 'bg-green-600/30 text-green-400' :
                            diario.disciplina >= 5 ? 'bg-yellow-600/30 text-yellow-400' :
                            'bg-red-600/30 text-red-400'
                          }`}>
                            Disciplina: {diario.disciplina}/10
                          </span>
                        </div>
                        {diario.acertos && (
                          <div className="mb-2 p-2 bg-green-700/20 rounded border border-green-600/30">
                            <p className="text-green-400 text-xs font-semibold">✓ Acertos</p>
                            <p className="text-slate-300 text-sm">{diario.acertos}</p>
                          </div>
                        )}
                        {diario.erros && (
                          <div className="mb-2 p-2 bg-red-700/20 rounded border border-red-600/30">
                            <p className="text-red-400 text-xs font-semibold">✗ Erros</p>
                            <p className="text-slate-300 text-sm">{diario.erros}</p>
                          </div>
                        )}
                        {diario.aprendizados && (
                          <div className="mb-2 p-2 bg-blue-700/20 rounded border border-blue-600/30">
                            <p className="text-blue-400 text-xs font-semibold">💡 Aprendizados</p>
                            <p className="text-slate-300 text-sm">{diario.aprendizados}</p>
                          </div>
                        )}
                        {diario.observacoes && (
                          <div className="p-2 bg-slate-800/50 rounded">
                            <p className="text-slate-400 text-xs mb-1">Observações</p>
                            <p className="text-slate-300 text-sm italic">{diario.observacoes}</p>
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => deletarDiario(diario.id)}
                        className="text-red-400 hover:text-red-300 ml-4 p-2 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
                {diarios.length === 0 && (
                  <p className="text-slate-400 text-center py-8">
                    Nenhum diário registrado ainda. Comece a refletir sobre suas operações!
                  </p>
                )}
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
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">Metas e Limites</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-2 text-sm">Capital Total</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="R$ 10.000,00"
                        value={configuracaoRisco.capitalTotal}
                        onChange={(e) => setConfiguracaoRisco({...configuracaoRisco, capitalTotal: e.target.value})}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2 text-sm">Risco por Operação (%)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="2%"
                        value={configuracaoRisco.riscoPorOperacao}
                        onChange={(e) => setConfiguracaoRisco({...configuracaoRisco, riscoPorOperacao: e.target.value})}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2 text-sm">Meta Diária (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="R$ 200,00"
                        value={configuracaoRisco.metaDiaria}
                        onChange={(e) => setConfiguracaoRisco({...configuracaoRisco, metaDiaria: e.target.value})}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2 text-sm">Perda Máxima Diária (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="R$ 400,00"
                        value={configuracaoRisco.perdaMaximaDiaria}
                        onChange={(e) => setConfiguracaoRisco({...configuracaoRisco, perdaMaximaDiaria: e.target.value})}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="border-t border-slate-600 pt-6">
                  <h3 className="text-lg font-semibold mb-3 text-blue-400">Configuração de Taxas Padrão</h3>
                  <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3 mb-4">
                    <p className="text-blue-300 text-sm font-semibold mb-1">ℹ️ Como as taxas são calculadas:</p>
                    <ul className="text-slate-300 text-xs space-y-1 ml-4">
                      <li>• <strong>Corretagem:</strong> Cobrada 2x (entrada + saída) - valor fixo por operação</li>
                      <li>• <strong>Emolumentos:</strong> Cobrados sobre o volume de entrada E saída (% do valor negociado)</li>
                      <li>• <strong>Taxa de Liquidação:</strong> Cobrada sobre o volume de entrada E saída (% do valor negociado)</li>
                      <li>• <strong>Imposto (IR):</strong> 20% sobre o lucro líquido (apenas se houver ganho)</li>
                    </ul>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-slate-400 mb-2 text-sm">Corretagem (R$/operação)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={configuracaoRisco.corretgemPadrao}
                        onChange={(e) => setConfiguracaoRisco({...configuracaoRisco, corretgemPadrao: e.target.value})}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                      />
                      <p className="text-slate-500 text-xs mt-1">Ex: 0.50 (será cobrado R$ 1,00 total: R$ 0,50 entrada + R$ 0,50 saída)</p>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2 text-sm">Emolumentos (%)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={configuracaoRisco.emolumentosPadrao}
                        onChange={(e) => setConfiguracaoRisco({...configuracaoRisco, emolumentosPadrao: e.target.value})}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                      />
                      <p className="text-slate-500 text-xs mt-1">Ex: 0.0325 (cobrado na entrada e na saída)</p>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-2 text-sm">Taxa de Liquidação (%)</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={configuracaoRisco.taxaLiquidacaoPadrao}
                        onChange={(e) => setConfiguracaoRisco({...configuracaoRisco, taxaLiquidacaoPadrao: e.target.value})}
                        className="w-full bg-slate-700 rounded-lg px-4 py-3 border border-slate-600 focus:border-blue-500 focus:outline-none text-white"
                      />
                      <p className="text-slate-500 text-xs mt-1">Ex: 0.0275 (cobrado na entrada e na saída)</p>
                    </div>
                  </div>
                  <div className="mt-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg p-3">
                    <p className="text-yellow-300 text-xs">
                      💡 <strong>Exemplo prático:</strong> Se você comprar 100 ações a R$ 10 e vender a R$ 11:
                      <br/>• Volume entrada: R$ 1.000 | Volume saída: R$ 1.100
                      <br/>• Corretagem: R$ 0,50 (entrada) + R$ 0,50 (saída) = R$ 1,00
                      <br/>• Emolumentos: 0.0325% de R$ 1.000 + 0.0325% de R$ 1.100 = R$ 0,68
                      <br/>• Taxa Liquidação: 0.0275% de R$ 1.000 + 0.0275% de R$ 1.100 = R$ 0,58
                      <br/>• <strong>Custos totais: R$ 2,26</strong>
                    </p>
                  </div>
                </div>
                {configuracaoRisco.capitalTotal && (
                  <div className="border-t border-slate-600 pt-6">
                    <h3 className="text-xl font-bold mb-4">Cálculos de Risco</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                        <p className="text-slate-400 text-sm">Risco por Operação</p>
                        <p className="text-3xl font-bold text-yellow-400">
                          R$ {(parseFloat(configuracaoRisco.capitalTotal) * parseFloat(configuracaoRisco.riscoPorOperacao) / 100).toFixed(2)}
                        </p>
                        <p className="text-slate-500 text-xs mt-2">Máximo para perder por trade</p>
                      </div>
                      {configuracaoRisco.metaDiaria && (
                        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-600">
                          <p className="text-slate-400 text-sm">Progresso da Meta</p>
                          <p className="text-3xl font-bold text-green-400">
                            {((stats.lucroTotal / parseFloat(configuracaoRisco.metaDiaria)) * 100).toFixed(1)}%
                          </p>
                          <p className="text-slate-500 text-xs mt-2">Da meta de R$ {parseFloat(configuracaoRisco.metaDiaria).toFixed(2)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="mt-8 text-center text-slate-500 text-sm">
          <p>🔗2025 DaVinci Hub</p>
          <p className="text-xs mt-1">Negócios Inteligentes</p>
        </div>
      </div>
    </div>
  );
}
