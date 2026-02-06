import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KPICard } from './components/KPICard';
import { RevenueAnalysis } from './components/Charts/RevenueAnalysis';
import { PaymentMethodChart } from './components/Charts/PaymentMethodChart';
import { useSimulatedData } from './hooks/useSimulatedData';
import { PeriodFilter, Currency } from './types';
import { PERIOD_OPTIONS, PLATFORM_OPTIONS, EXCHANGE_RATE_EUR } from './constants';
import {
  ChevronDown,
  RefreshCcw,
  CheckCircle,
  Search,
  MapPin,
  Download,
  Loader2,
  Filter,
  Star,
  ExternalLink,
  DollarSign
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";

const App: React.FC = () => {
  const [view, setView] = useState<'dashboard' | 'leads'>('dashboard');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currency, setCurrency] = useState<Currency>('BRL');

  // Initialize state from URL search params
  const [params, setParams] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      period: (searchParams.get('period') as PeriodFilter) || 'this-month',
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || ''
    };
  });

  const { sales, kpis } = useSimulatedData(params);

  // Helper to convert values based on currency
  const getConvertedValue = (val: number) => {
    return currency === 'EUR' ? val / EXCHANGE_RATE_EUR : val;
  };

  // Leads Prospecção State
  const [nicho, setNicho] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update logic for state and browser history
  const handlePeriodSelection = useCallback((newPeriod: PeriodFilter) => {
    const nextParams = { ...params, period: newPeriod, from: '', to: '' };

    const searchParams = new URLSearchParams();
    searchParams.set('period', nextParams.period);
    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, '', newUrl);

    setParams(nextParams);
    setDropdownOpen(false);
  }, [params]);

  const handleCustomDateChange = useCallback((field: 'from' | 'to', value: string) => {
    const nextParams = { ...params, [field]: value };

    const searchParams = new URLSearchParams();
    searchParams.set('period', nextParams.period);
    if (nextParams.from) searchParams.set('from', nextParams.from);
    if (nextParams.to) searchParams.set('to', nextParams.to);

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState({}, '', newUrl);

    setParams(nextParams);
  }, [params]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const sp = new URLSearchParams(window.location.search);
      setParams({
        period: (sp.get('period') as PeriodFilter) || 'this-month',
        from: sp.get('from') || '',
        to: sp.get('to') || ''
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const buscarLeads = async () => {
    if (!nicho || !localizacao) return;
    setLoadingLeads(true);
    try {
      // Corrected: directly using process.env.API_KEY per rules
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Encontre 5 empresas reais do nicho "${nicho}" em "${localizacao}". Retorne apenas JSON com: nome, endereco, telefone, website (ou 'Sem Site') e rating (float).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                nome: { type: Type.STRING },
                endereco: { type: Type.STRING },
                telefone: { type: Type.STRING },
                website: { type: Type.STRING },
                rating: { type: Type.NUMBER }
              },
              required: ["nome", "endereco", "telefone", "website", "rating"]
            }
          }
        }
      });

      const rawText = response.text;
      if (rawText) {
        try {
          const data = JSON.parse(rawText.trim());
          setLeads(data);
        } catch (parseError) {
          console.error("Erro ao processar JSON da IA:", parseError);
          const jsonMatch = rawText.match(/\[.*\]/s);
          if (jsonMatch) {
            setLeads(JSON.parse(jsonMatch[0].trim()));
          } else {
            throw new Error("Formato de resposta inválido");
          }
        }
      } else {
        throw new Error("Resposta vazia da IA");
      }
    } catch (error: any) {
      console.error("Erro na busca de leads:", error);
      alert(error?.message || "Erro ao prospectar leads. Verifique sua conexão e tente novamente.");
    } finally {
      setLoadingLeads(false);
    }
  };

  const exportLeadsJSON = () => {
    if (!leads.length) return;
    const blob = new Blob([JSON.stringify(leads, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${nicho.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const weekdayData = React.useMemo(() => {
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    sales.forEach(s => counts[s.date.getDay()]++);
    return days.map((day, i) => ({ day, count: counts[i] }));
  }, [sales]);

  const hourlyData = React.useMemo(() => {
    const hours = Array.from({ length: 12 }, (_, i) => ({
      range: `${String(i * 2).padStart(2, '0')}:00 - ${String((i * 2) + 2).padStart(2, '0')}:00`,
      count: 0
    }));
    sales.forEach(s => {
      const h = s.date.getHours();
      const idx = Math.floor(h / 2);
      if (hours[idx]) hours[idx].count++;
    });
    return hours;
  }, [sales]);

  const activePeriodLabel = PERIOD_OPTIONS.find(o => o.value === params.period)?.label || 'Período';

  return (
    <div className="flex h-screen overflow-hidden text-gray-900 bg-[#f8fafc]">
      <Sidebar currentView={view} onViewChange={setView} />

      <main className="flex-1 flex flex-col min-w-0">
        <Header />

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {view === 'dashboard' ? (
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">Painel de Performance</h1>
                  <p className="text-gray-500 font-medium">Dashboard consolidado Ad Dashboard Pro</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-full text-xs font-bold border border-green-100">
                    <CheckCircle size={14} /> Sistema Ativo
                  </div>
                  <button onClick={() => window.location.reload()} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all active:scale-95">
                    <RefreshCcw size={18} /> Sincronizar
                  </button>
                </div>
              </div>

              {/* Filter Section */}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative z-50">
                <div className="flex flex-wrap items-end gap-6">
                  <div className="flex-1 min-w-[240px] relative" ref={dropdownRef}>
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Período de Análise</label>
                    <button
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 hover:bg-gray-100 transition-all focus:ring-4 focus:ring-indigo-500/5"
                    >
                      <span className="font-bold text-gray-700">{activePeriodLabel}</span>
                      <ChevronDown size={20} className={`text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl z-[100] py-3 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                        {PERIOD_OPTIONS.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => handlePeriodSelection(opt.value)}
                            className={`w-full text-left px-5 py-3 text-sm transition-colors ${params.period === opt.value ? 'bg-indigo-50 text-indigo-700 font-black border-l-4 border-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {params.period === 'custom' && (
                    <div className="flex gap-4 flex-1 min-w-[320px]">
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">De</label>
                        <input
                          type="date"
                          value={params.from}
                          onChange={(e) => handleCustomDateChange('from', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-4 focus:ring-indigo-500/5"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Até</label>
                        <input
                          type="date"
                          value={params.to}
                          onChange={(e) => handleCustomDateChange('to', e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-4 focus:ring-indigo-500/5"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Plataforma</label>
                    <div className="relative">
                      <select className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 pr-12 focus:outline-none font-bold text-gray-700">
                        {PLATFORM_OPTIONS.map(p => <option key={p}>{p}</option>)}
                      </select>
                      <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>

                  <div className="w-[180px]">
                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Moeda</label>
                    <div className="relative">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as Currency)}
                        className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 pr-12 focus:outline-none font-bold text-gray-700"
                      >
                        <option value="BRL">BRL (R$)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                      <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                    </div>
                  </div>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard label="Faturamento Bruto" value={getConvertedValue(kpis.grossRevenue)} currency={currency} colorClass="text-green-600" tooltip="Total acumulado em vendas pagas." />
                <KPICard label="Faturamento Líquido" value={getConvertedValue(kpis.netRevenue)} currency={currency} colorClass="text-green-600" tooltip="Saldo após taxas (2.5%) e impostos (6%)." />
                <KPICard label="Lucro" value={getConvertedValue(kpis.profit)} currency={currency} colorClass="text-green-600" />
                <KPICard label="Margem de Lucro" value={kpis.margin.toFixed(2).replace('.', ',') + '%'} isCurrency={false} colorClass="text-green-600" />
              </div>

              <RevenueAnalysis sales={sales} period={params.period} currency={currency} />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KPICard label="Gasto com Ads" value={getConvertedValue(kpis.adSpend)} isCurrency={true} currency={currency} colorClass="text-gray-900" tooltip="Investimento em tráfego pago." />
                <KPICard label="Vendas Pendentes" value={kpis.pendingSales} colorClass="text-gray-900" />
                <KPICard label="Taxa de Conversão" value="2,50%" isCurrency={false} colorClass="text-gray-900" />
                <KPICard label="ARPU" value={getConvertedValue(kpis.arpu)} currency={currency} colorClass="text-gray-900" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <PaymentMethodChart sales={sales} />
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-[400px] flex flex-col">
                  <h3 className="font-black text-gray-800 mb-8 uppercase text-xs tracking-widest">Performance Semanal</h3>
                  <div className="flex-1 w-full min-h-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weekdayData}>
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }} />
                        <YAxis hide />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Bar dataKey="count" radius={[8, 8, 0, 0]} animationDuration={1200}>
                          {weekdayData.map((entry, index) => <Cell key={`cell-${index}`} fill={index === new Date().getDay() ? '#6366f1' : '#cbd5e1'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="font-black text-gray-800 mb-10 uppercase text-xs tracking-widest">Intensidade por Horário</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  {hourlyData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-5 group">
                      <span className="w-24 text-sm text-gray-400 font-bold group-hover:text-gray-900 transition-colors">{item.range}</span>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out"
                          style={{
                            width: `${(item.count / Math.max(...hourlyData.map(d => d.count), 1)) * 100}%`,
                            backgroundColor: idx % 2 === 0 ? '#6366f1' : '#a5b4fc'
                          }}
                        ></div>
                      </div>
                      <span className="w-8 text-sm font-black text-gray-800 text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-12">
                <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tighter">Prospecção Inteligente</h1>
                <p className="text-gray-500 text-xl font-medium">Capture leads qualificados diretamente do Google Maps</p>
              </div>

              <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-2xl shadow-indigo-100/50 mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nicho / Setor</label>
                    <div className="relative">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                      <input
                        type="text"
                        placeholder="Ex: Clínicas, Pizzarias..."
                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl pl-16 pr-8 py-5 focus:outline-none focus:border-indigo-500/20 focus:bg-white transition-all text-gray-800 font-bold text-lg"
                        value={nicho}
                        onChange={(e) => setNicho(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Cidade / Região</label>
                    <div className="relative">
                      <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
                      <input
                        type="text"
                        placeholder="Ex: São Paulo, SP"
                        className="w-full bg-gray-50 border-2 border-transparent rounded-2xl pl-16 pr-8 py-5 focus:outline-none focus:border-indigo-500/20 focus:bg-white transition-all text-gray-800 font-bold text-lg"
                        value={localizacao}
                        onChange={(e) => setLocalizacao(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={buscarLeads}
                  disabled={loadingLeads || !nicho || !localizacao}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-200 text-white px-10 py-6 rounded-3xl font-black text-2xl flex items-center justify-center gap-5 transition-all active:scale-[0.98] shadow-2xl shadow-indigo-600/20"
                >
                  {loadingLeads ? <Loader2 className="animate-spin" size={32} /> : <Search size={32} />}
                  <span>{loadingLeads ? 'Vasculhando o Google Maps...' : 'Extrair Leads'}</span>
                </button>
              </div>

              {leads.length > 0 && (
                <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl overflow-hidden">
                  <div className="p-10 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 gap-6">
                    <div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tight">Leads Encontrados</h3>
                      <p className="text-sm text-gray-500 font-black uppercase tracking-widest">Base de dados reais minerada por IA</p>
                    </div>
                    <button
                      onClick={exportLeadsJSON}
                      className="bg-white text-indigo-700 border-2 border-indigo-100 hover:bg-indigo-50 px-8 py-4 rounded-2xl font-black flex items-center gap-3 transition-all shadow-sm"
                    >
                      <Download size={24} /> Exportar
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-white text-gray-400 text-[11px] font-black uppercase tracking-[0.2em]">
                          <th className="px-10 py-8">Razão Social</th>
                          <th className="px-10 py-8">Endereço</th>
                          <th className="px-10 py-8">Contato</th>
                          <th className="px-10 py-8">Avaliação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {leads.map((lead, idx) => (
                          <tr key={idx} className="hover:bg-indigo-50/20 transition-colors group">
                            <td className="px-10 py-10">
                              <span className="font-black text-gray-900 text-xl block mb-2">{lead.nome}</span>
                              {lead.website !== 'Sem Site' ? (
                                <a href={lead.website} target="_blank" rel="noreferrer" className="text-indigo-600 hover:text-indigo-800 font-bold text-sm flex items-center gap-2">
                                  {lead.website.replace(/^https?:\/\/(www\.)?/, '')} <ExternalLink size={14} />
                                </a>
                              ) : (
                                <span className="text-[10px] bg-red-100 text-red-600 px-3 py-1.5 rounded-full font-black uppercase tracking-tighter">Sem Site</span>
                              )}
                            </td>
                            <td className="px-10 py-10 text-sm text-gray-500 font-bold leading-relaxed max-w-[240px]">{lead.endereco}</td>
                            <td className="px-10 py-10 text-base font-black text-gray-800">{lead.telefone}</td>
                            <td className="px-10 py-10">
                              <div className="flex items-center gap-2.5 bg-orange-50 text-orange-600 px-5 py-2.5 rounded-2xl w-fit border border-orange-100">
                                <Star size={20} fill="currentColor" />
                                <span className="text-xl font-black">{lead.rating.toFixed(1)}</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;