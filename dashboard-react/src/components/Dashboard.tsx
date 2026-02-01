import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ComposedChart, Line } from 'recharts';
import { Filter, ArrowUp, ArrowDown, Calendar, Users, Activity, LayoutGrid, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface Agendamento {
  Unidade: string;
  Profissional: string;
  Especialidade: string;
  CategoriaEspecialidade: string;
  StatusMonitoramento: string;
  Situacao_Horario: string;
  Status_Final: string;
  DataQuadro: string;
  HoraInicio: string;
}

interface KPI {
  total: number;
  agendados: number; // Agora inclui Realizados, Ausentes e Futuros
  realizados: number;
  ausentes: number;
  bloqueados: number;
  livres: number;
  ocupacao: number;
  absenteismo: number;
}

const COLORS = {
  REALIZADO: '#10B981',    // Emerald 500
  LIVRE: '#94A3B8',        // Slate 400
  BLOQUEADO: '#EF4444',    // Red 500
  AUSENTE: '#F59E0B',      // Amber 500
  AGENDADO: '#3B82F6',     // Blue 500
  ATENDIDO: '#10B981'      // Emerald 500
};

const FilterSection = ({ title, icon: Icon, children, className }: { title: string, icon?: any, children: React.ReactNode, className?: string }) => (
  <div className={clsx("flex flex-col gap-2", className)}>
    <div className="flex items-center gap-2 text-slate-400 border-b border-slate-700/50 pb-1">
      {Icon && <Icon className="w-3.5 h-3.5 text-[#F39C45]" />}
      <h3 className="text-[11px] font-bold uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

const FilterButton = ({ label, active, onClick, multi = false }: { label: string, active: boolean, onClick: () => void, multi?: boolean }) => (
  <button
    onClick={onClick}
    className={clsx(
      "px-3 py-2 rounded-lg text-[11px] font-medium transition-all text-left w-full border border-transparent leading-tight flex justify-between items-center group",
      active 
        ? "bg-[#F39C45] text-white shadow-md border-[#F39C45]" 
        : "bg-[#0F2645] text-slate-300 hover:bg-[#1E3A5F] border-slate-700/30 hover:border-slate-600"
    )}
    title={label}
  >
    <span className="truncate">{label}</span>
    {active && multi && <Check className="w-3 h-3 text-white ml-2" />}
  </button>
);

const KPICard = ({ title, value, total, colorClass, prevValue, isPercent = false, invertTrend = false }: { title: string, value: number, total: number, colorClass: string, prevValue?: number, isPercent?: boolean, invertTrend?: boolean }) => {
  const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  let change = null;
  
  if (prevValue !== undefined && prevValue !== 0) {
      const diff = value - prevValue;
      
      // Se invertTrend for true (ex: Absenteísmo), aumento é RUIM (vermelho), queda é BOM (verde)
      const isGood = invertTrend ? diff < 0 : diff > 0;
      const color = isGood ? 'text-emerald-400 bg-emerald-900/20' : 'text-rose-400 bg-rose-900/20';
      const Icon = diff > 0 ? ArrowUp : ArrowDown;

      if (diff !== 0) {
         change = <span className={clsx("text-[10px] flex items-center px-1.5 py-0.5 rounded-full font-medium", color)}><Icon className="w-3 h-3 mr-0.5" /> {isPercent ? '' : (diff > 0 ? '+' : '')}{isPercent ? diff.toFixed(1) + '%' : Math.abs(diff)}</span>;
      } else {
         change = <span className="text-[10px] flex items-center text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded-full"><Minus className="w-3 h-3" /></span>;
      }
  }

  return (
    <div className="flex-1 bg-[#0F2645] border border-slate-700/50 rounded-xl p-3 shadow-lg flex flex-col justify-between min-w-[110px] hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {title}
        </span>
        {change}
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-white tracking-tight">
            {isPercent ? `${value.toFixed(1)}%` : value.toLocaleString()}
        </span>
        {!isPercent && (
             <div className="flex items-center gap-1 mt-1">
                <div className="h-1.5 flex-1 rounded-full bg-slate-800 overflow-hidden">
                    <div className={clsx("h-full rounded-full", colorClass)} style={{ width: `${percent}%` }} />
                </div>
                <span className="text-[10px] text-slate-400 font-medium w-8 text-right">{percent}%</span>
             </div>
        )}
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedUnidade, setSelectedUnidade] = useState<string | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | null>(null);
  const [selectedEspecialidade, setSelectedEspecialidade] = useState<string | null>(null);
  
  // MULTI-SELECT for Weeks
  const [selectedSemanas, setSelectedSemanas] = useState<string[]>(['Todas']);

  // Table Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' }>({ key: 'total', direction: 'desc' });

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  useEffect(() => {
    fetch('/dados.json')
      .then(res => res.json())
      .then(json => {
        setData(json.dados);
        setLoading(false);
      });
  }, []);

  const unidades = useMemo(() => Array.from(new Set(data.map(d => d.Unidade))).sort(), [data]);
  const categorias = useMemo(() => Array.from(new Set(data.map(d => d.CategoriaEspecialidade))).sort(), [data]);
  const especialidades = useMemo(() => {
    let filtered = data;
    if (selectedCategoria) filtered = filtered.filter(d => d.CategoriaEspecialidade === selectedCategoria);
    return Array.from(new Set(filtered.map(d => d.Especialidade))).sort();
  }, [data, selectedCategoria]);

  const semanas = [
      { label: 'Todas', value: 'Todas' },
      { label: 'Semana 1', value: '1' },
      { label: 'Semana 2', value: '2' },
      { label: 'Semana 3', value: '3' },
      { label: 'Semana 4', value: '4' },
      { label: 'Semana 5', value: '5' }
  ];

  const getWeekNumber = (dateStr: string) => {
      const day = parseInt(dateStr.split('-')[2] || '1');
      if (day <= 3) return 1;
      if (day <= 10) return 2;
      if (day <= 17) return 3;
      if (day <= 24) return 4;
      return 5;
  };

  const toggleSemana = (val: string) => {
      if (val === 'Todas') {
          setSelectedSemanas(['Todas']);
          return;
      }
      
      let newSelection = [...selectedSemanas];
      if (newSelection.includes('Todas')) {
          newSelection = [];
      }

      if (newSelection.includes(val)) {
          newSelection = newSelection.filter(s => s !== val);
      } else {
          newSelection.push(val);
      }

      if (newSelection.length === 0) {
          setSelectedSemanas(['Todas']);
      } else {
          setSelectedSemanas(newSelection);
      }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchUnidade = !selectedUnidade || item.Unidade === selectedUnidade;
      const matchCategoria = !selectedCategoria || item.CategoriaEspecialidade === selectedCategoria;
      const matchEspecialidade = !selectedEspecialidade || item.Especialidade === selectedEspecialidade;
      
      let matchSemana = true;
      if (!selectedSemanas.includes('Todas')) {
          const weekNum = getWeekNumber(item.DataQuadro);
          matchSemana = selectedSemanas.includes(weekNum.toString());
      }

      return matchUnidade && matchCategoria && matchEspecialidade && matchSemana;
    });
  }, [data, selectedUnidade, selectedCategoria, selectedEspecialidade, selectedSemanas]);

  // Comparison Logic: Only active if SINGLE WEEK is selected and it's not week 1
  const showComparison = selectedSemanas.length === 1 && selectedSemanas[0] !== 'Todas' && selectedSemanas[0] !== '1';
  
  const prevWeekData = useMemo(() => {
      if (!showComparison) return [];
      const currentWeekNum = parseInt(selectedSemanas[0]);
      
      return data.filter(item => {
          const matchUnidade = !selectedUnidade || item.Unidade === selectedUnidade;
          const matchCategoria = !selectedCategoria || item.CategoriaEspecialidade === selectedCategoria;
          const matchEspecialidade = !selectedEspecialidade || item.Especialidade === selectedEspecialidade;
          const weekNum = getWeekNumber(item.DataQuadro);
          return matchUnidade && matchCategoria && matchEspecialidade && weekNum === (currentWeekNum - 1);
      });
  }, [data, selectedUnidade, selectedCategoria, selectedEspecialidade, selectedSemanas, showComparison]);

  const calcKPIs = (dataset: Agendamento[]): KPI => {
      const initial = { realizados: 0, livres: 0, bloqueados: 0, ausentes: 0, agendados: 0, total: 0, ocupacao: 0, absenteismo: 0 };
      const stats = dataset.reduce((acc, curr) => {
          acc.total++;
          
          // Lógica baseada em Situacao_Horario (Macro)
          if (curr.Situacao_Horario === 'Agendado') {
              acc.agendados++;
              
              // Lógica baseada em StatusMonitoramento (Micro) dentro de Agendados
              if (curr.StatusMonitoramento === 'Realizado') {
                  acc.realizados++;
              } else if (curr.StatusMonitoramento === 'Ausente') {
                  acc.ausentes++;
              }
          } else if (curr.Situacao_Horario === 'Livre') {
              acc.livres++;
          } else if (curr.Situacao_Horario === 'Bloqueado') {
              acc.bloqueados++;
          }
          
          return acc;
      }, initial);
      
      // Ocupação = Agendados / (Total - Bloqueados)
      const capacity = stats.total - stats.bloqueados;
      stats.ocupacao = capacity > 0 ? (stats.agendados / capacity) * 100 : 0;
      
      // Absenteísmo = Ausentes / Agendados
      stats.absenteismo = stats.agendados > 0 ? (stats.ausentes / stats.agendados) * 100 : 0;
      
      return stats;
  };

  const currentKPIs = useMemo(() => calcKPIs(filteredData), [filteredData]);
  const prevKPIs = useMemo(() => calcKPIs(prevWeekData), [prevWeekData]);

  // TABELA DE ESPECIALIDADES (Substitui o gráfico de barras)
  const specialtiesTableData = useMemo(() => {
      const grouped = filteredData.reduce((acc, curr) => {
          const key = curr.Especialidade;
          if (!acc[key]) acc[key] = { name: key, REALIZADO: 0, LIVRE: 0, BLOQUEADO: 0, AUSENTE: 0, AGENDADO: 0, total: 0 };
          
          acc[key].total++;

          if (curr.Situacao_Horario === 'Agendado') {
             acc[key].AGENDADO++; // Total de agendados
             if (curr.StatusMonitoramento === 'Realizado') acc[key].REALIZADO++;
             if (curr.StatusMonitoramento === 'Ausente') acc[key].AUSENTE++;
          } else if (curr.Situacao_Horario === 'Livre') {
             acc[key].LIVRE++;
          } else if (curr.Situacao_Horario === 'Bloqueado') {
             acc[key].BLOQUEADO++;
          }

          return acc;
      }, {} as any);
      
      return Object.values(grouped).map((item: any) => {
          const capacity = item.total - item.BLOQUEADO;
          const ocupacao = capacity > 0 ? (item.AGENDADO / capacity) * 100 : 0;
          const absenteismo = item.AGENDADO > 0 ? (item.AUSENTE / item.AGENDADO) * 100 : 0;
          return { ...item, ocupacao, absenteismo };
      }).sort((a: any, b: any) => {
          const aValue = a[sortConfig.key];
          const bValue = b[sortConfig.key];
          
          if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
          if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
      });
  }, [filteredData, sortConfig]);

  const chart2Data = useMemo(() => {
      const grouped = filteredData.reduce((acc, curr) => {
          const key = curr.Profissional;
          if (!acc[key]) acc[key] = { name: key, REALIZADO: 0, LIVRE: 0, BLOQUEADO: 0, AUSENTE: 0, AGENDADO: 0, total: 0 };
          
          acc[key].total++;
          
          if (curr.Situacao_Horario === 'Agendado') {
             acc[key].AGENDADO++;
             if (curr.StatusMonitoramento === 'Realizado') acc[key].REALIZADO++;
          } else if (curr.Situacao_Horario === 'Bloqueado') {
             acc[key].BLOQUEADO++;
          }

          return acc;
      }, {} as any);
      
      return Object.values(grouped)
        .filter((item: any) => item.AGENDADO > 0) // REMOVE PROFISSIONAIS SEM AGENDAMENTO
        .map((item: any) => {
           // Create a shorter name for X-Axis (First + Last)
           const nameParts = item.name.split(' ');
           const shortName = nameParts.length > 1 
             ? `${nameParts[0]} ${nameParts[nameParts.length - 1]}`
             : item.name;
            return { ...item, shortName };
      }).sort((a: any, b: any) => b.REALIZADO - a.REALIZADO).slice(0, 10);
  }, [filteredData]);

  const blockedProfessionalsData = useMemo(() => {
      const grouped = filteredData.reduce((acc, curr) => {
          if (curr.Situacao_Horario === 'Bloqueado') {
              const key = curr.Profissional;
              if (!acc[key]) acc[key] = { name: key, count: 0, days: new Set() };
              acc[key].count++;
              acc[key].days.add(curr.DataQuadro);
          }
          return acc;
      }, {} as any);

      return Object.values(grouped)
          .map((item: any) => ({
              ...item,
              daysCount: item.days.size,
              daysList: Array.from(item.days).sort().slice(0, 3).map((d: any) => d.split('-').reverse().join('/')).join(', ') + (item.days.size > 3 ? '...' : '') // Show first 3 days
          }))
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 5); // Top 5 blockers
  }, [filteredData]);

  const isMultiWeek = selectedSemanas.includes('Todas') || selectedSemanas.length > 1;

  const chart3Data = useMemo(() => {
      const grouped = filteredData.reduce((acc, curr) => {
          let key;
          
          if (isMultiWeek) {
              const weekNum = getWeekNumber(curr.DataQuadro);
              key = `Semana ${weekNum}`;
          } else {
              key = curr.DataQuadro.split('-')[2];
          }

          if (!acc[key]) acc[key] = { name: key, REALIZADO: 0, LIVRE: 0, BLOQUEADO: 0, AUSENTE: 0, PENDENTE: 0, AGENDADO_TOTAL: 0, total: 0 };
          
          acc[key].total++;

          if (curr.Situacao_Horario === 'Agendado') {
              acc[key].AGENDADO_TOTAL++;
              if (curr.StatusMonitoramento === 'Realizado') acc[key].REALIZADO++;
              else if (curr.StatusMonitoramento === 'Ausente') acc[key].AUSENTE++;
              else acc[key].PENDENTE++; // Agendados futuros/pendentes
          } else if (curr.Situacao_Horario === 'Livre') {
              acc[key].LIVRE++;
          } else if (curr.Situacao_Horario === 'Bloqueado') {
              acc[key].BLOQUEADO++;
          }
          
          return acc;
      }, {} as any);
      
      let result = [];
      if (isMultiWeek) {
          const weekOrder = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4', 'Semana 5'];
          result = weekOrder.map(w => grouped[w] || { name: w, REALIZADO: 0, LIVRE: 0, BLOQUEADO: 0, AUSENTE: 0, PENDENTE: 0, AGENDADO_TOTAL: 0, total: 0 });
      } else {
          const days = Array.from({length: 31}, (_, i) => (i + 1).toString().padStart(2, '0'));
          result = days.map(d => grouped[d] || { name: d, REALIZADO: 0, LIVRE: 0, BLOQUEADO: 0, AUSENTE: 0, PENDENTE: 0, AGENDADO_TOTAL: 0, total: 0 });
      }

      // Calcular Taxa de Ocupação para a Linha
      return result.map((item: any) => {
          const capacity = item.total - item.BLOQUEADO;
          const ocupacao = capacity > 0 ? (item.AGENDADO_TOTAL / capacity) * 100 : 0;
          return { ...item, ocupacao: parseFloat(ocupacao.toFixed(1)) };
      });

  }, [filteredData, isMultiWeek]);

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig.key !== columnKey) return <ArrowDown className="w-3 h-3 ml-1 text-slate-600 opacity-0 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-3 h-3 ml-1 text-[#F39C45]" /> 
      : <ArrowDown className="w-3 h-3 ml-1 text-[#F39C45]" />;
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0B1E3B] text-white animate-pulse">Carregando Dashboard...</div>;

  return (
    <div className="h-screen w-screen bg-[#020617] text-slate-100 overflow-hidden flex font-sans text-sm selection:bg-[#F39C45] selection:text-white">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1E293B; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        
        table { border-collapse: separate; border-spacing: 0 4px; }
        th { font-weight: 600; text-transform: uppercase; font-size: 10px; color: #94a3b8; padding: 0 8px; text-align: left; cursor: pointer; user-select: none; }
        th:hover { color: #F39C45; }
        td { padding: 8px; font-size: 11px; }
        tr.data-row:hover { background-color: #1e293b; }
      `}</style>
      
      {/* Sidebar - Wider for better text visibility */}
      <aside className="w-72 bg-[#08162B] border-r border-slate-800 flex flex-col p-5 gap-6 overflow-hidden shadow-2xl z-20">
        <div className="shrink-0 flex items-center gap-3 text-[#F39C45] mb-2">
          <div className="p-2 bg-[#F39C45]/10 rounded-lg border border-[#F39C45]/20">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">Gestão de Agendas</h1>
            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Analytics Pro</span>
          </div>
        </div>

        <FilterSection title="Período de Análise" icon={Calendar} className="shrink-0">
             <div className="grid grid-cols-2 gap-2">
                 {semanas.map(s => (
                     <FilterButton 
                        key={s.value} 
                        label={s.label.replace(' (Janeiro)', '').replace(' (01-03 Jan)', '').replace(/ \(.+\)/, '')}
                        active={selectedSemanas.includes(s.value)} 
                        onClick={() => toggleSemana(s.value)}
                        multi={true}
                     />
                 ))}
             </div>
        </FilterSection>

        <FilterSection title="Unidade" icon={Filter} className="shrink-0">
             <div className="flex flex-col gap-1.5">
                {unidades.map(u => (
                    <FilterButton key={u} label={u} active={selectedUnidade === u} onClick={() => setSelectedUnidade(selectedUnidade === u ? null : u)} />
                ))}
             </div>
        </FilterSection>

        <FilterSection title="Categoria" icon={Filter} className="shrink-0 max-h-[20%] flex flex-col min-h-0">
             <div className="overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-1.5">
                {categorias.map(c => (
                    <FilterButton key={c} label={c} active={selectedCategoria === c} onClick={() => setSelectedCategoria(selectedCategoria === c ? null : c)} />
                ))}
             </div>
        </FilterSection>

        <FilterSection title="Especialidade" icon={Activity} className="flex-1 min-h-0 flex flex-col">
             <div className="overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-1.5 pb-2">
                {especialidades.map(e => (
                    <FilterButton key={e} label={e} active={selectedEspecialidade === e} onClick={() => setSelectedEspecialidade(selectedEspecialidade === e ? null : e)} />
                ))}
             </div>
        </FilterSection>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#020617]">
        
        {/* Top Bar */}
        <div className="h-16 border-b border-slate-800 bg-[#08162B]/50 flex items-center justify-between px-6 shrink-0 backdrop-blur-sm">
            <div className="flex flex-col">
                <h2 className="text-xl font-bold text-white tracking-tight">Visão Geral</h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Dados atualizados em tempo real
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                 {showComparison && (
                    <div className="flex items-center gap-2 bg-[#0F2645] px-3 py-1.5 rounded-full border border-slate-700/50 shadow-sm">
                        <TrendingUp className="w-3.5 h-3.5 text-[#F39C45]" />
                        <span className="text-xs font-medium text-slate-300">Comparando com semana anterior</span>
                    </div>
                )}
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
                    FS
                </div>
            </div>
        </div>

        {/* Scrollable Content Area - Adjusted for Single Screen View */}
        <div className="flex-1 p-4 gap-3 flex flex-col overflow-hidden">
            
            {/* KPIs */}
            <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 shrink-0">
                <KPICard title="Total Ofertado" value={currentKPIs.total} total={currentKPIs.total} colorClass="bg-blue-500" prevValue={showComparison ? prevKPIs.total : undefined} />
                <KPICard title="Taxa Ocupação" value={currentKPIs.ocupacao} total={0} colorClass="bg-emerald-500" prevValue={showComparison ? prevKPIs.ocupacao : undefined} isPercent={true} />
                <KPICard title="Absenteísmo" value={currentKPIs.absenteismo} total={0} colorClass="bg-rose-500" prevValue={showComparison ? prevKPIs.absenteismo : undefined} isPercent={true} invertTrend={true} />
                <KPICard title="Realizados" value={currentKPIs.realizados} total={currentKPIs.total} colorClass="bg-emerald-500" prevValue={showComparison ? prevKPIs.realizados : undefined} />
                <KPICard title="Agendados" value={currentKPIs.agendados} total={currentKPIs.total} colorClass="bg-[#3B82F6]" prevValue={showComparison ? prevKPIs.agendados : undefined} />
                <KPICard title="Livres" value={currentKPIs.livres} total={currentKPIs.total} colorClass="bg-slate-400" prevValue={showComparison ? prevKPIs.livres : undefined} />
                <KPICard title="Ausentes" value={currentKPIs.ausentes} total={currentKPIs.total} colorClass="bg-[#F59E0B]" prevValue={showComparison ? prevKPIs.ausentes : undefined} />
                <KPICard title="Bloqueados" value={currentKPIs.bloqueados} total={currentKPIs.total} colorClass="bg-[#EF4444]" prevValue={showComparison ? prevKPIs.bloqueados : undefined} />
            </div>

            {/* Main Chart Area - Reduced Height */}
            <div className="h-60 bg-[#0F2645] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col shrink-0">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-blue-400" /> {isMultiWeek ? 'Comparativo Semanal' : 'Evolução Diária'}
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                            {isMultiWeek ? 'Volume e Taxa de Ocupação por Semana' : 'Volume e Taxa de Ocupação por Dia'}
                        </p>
                    </div>
                    <div className="flex gap-3 text-[10px] font-medium bg-[#08162B] p-1.5 rounded-lg border border-slate-700/50">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500"></span>Realizado</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-blue-500"></span>Agendado</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-slate-400"></span>Livre</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-rose-500"></span>Bloqueado</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-amber-500"></span>Ausente</span>
                        <span className="flex items-center gap-1.5"><span className="w-2.5 h-0.5 bg-[#F39C45]"></span>Ocupação %</span>
                    </div>
                </div>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={chart3Data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorRealizado" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.9}/>
                                    <stop offset="95%" stopColor="#059669" stopOpacity={0.9}/>
                                </linearGradient>
                                <linearGradient id="colorLivre" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.8}/>
                                    <stop offset="95%" stopColor="#64748B" stopOpacity={0.8}/>
                                </linearGradient>
                                <linearGradient id="colorBloqueado" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.9}/>
                                    <stop offset="95%" stopColor="#B91C1C" stopOpacity={0.9}/>
                                </linearGradient>
                                <linearGradient id="colorAusente" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.9}/>
                                    <stop offset="95%" stopColor="#D97706" stopOpacity={0.9}/>
                                </linearGradient>
                                <linearGradient id="colorAgendado" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.9}/>
                                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.9}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke="#1E293B" strokeDasharray="3 3" />
                            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                            <YAxis yAxisId="left" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                            <YAxis yAxisId="right" orientation="right" stroke="#F39C45" fontSize={11} tickLine={false} axisLine={false} unit="%" />
                            <Tooltip 
                                cursor={{fill: 'rgba(255,255,255,0.03)'}} 
                                contentStyle={{ backgroundColor: '#020617', borderColor: '#1E293B', borderRadius: '12px', fontSize: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }} 
                            />
                            <Bar yAxisId="left" dataKey="REALIZADO" stackId="a" fill="url(#colorRealizado)" radius={[0, 0, 0, 0]} barSize={isMultiWeek ? 40 : 20} />
                            <Bar yAxisId="left" dataKey="PENDENTE" name="AGENDADO" stackId="a" fill="url(#colorAgendado)" barSize={isMultiWeek ? 40 : 20} />
                            <Bar yAxisId="left" dataKey="LIVRE" stackId="a" fill="url(#colorLivre)" barSize={isMultiWeek ? 40 : 20} />
                            <Bar yAxisId="left" dataKey="BLOQUEADO" stackId="a" fill="url(#colorBloqueado)" barSize={isMultiWeek ? 40 : 20} />
                            <Bar yAxisId="left" dataKey="AUSENTE" stackId="a" fill="url(#colorAusente)" radius={[4, 4, 0, 0]} barSize={isMultiWeek ? 40 : 20} />
                            
                            <Line yAxisId="right" type="monotone" dataKey="ocupacao" name="Taxa Ocupação" stroke="#F39C45" strokeWidth={3} dot={{r: 4, fill: '#F39C45', strokeWidth: 2, stroke: '#fff'}} />
                            
                            {/* Linhas separadoras de semana (Jan 2026: 3, 10, 17, 24) */}
                            {!isMultiWeek && (
                                <>
                                    <ReferenceLine x="3.5" yAxisId="left" stroke="#334155" strokeDasharray="3 3" label={{ position: 'top', value: 'S1', fill: '#475569', fontSize: 10 }} />
                                    <ReferenceLine x="10.5" yAxisId="left" stroke="#334155" strokeDasharray="3 3" label={{ position: 'top', value: 'S2', fill: '#475569', fontSize: 10 }} />
                                    <ReferenceLine x="17.5" yAxisId="left" stroke="#334155" strokeDasharray="3 3" label={{ position: 'top', value: 'S3', fill: '#475569', fontSize: 10 }} />
                                    <ReferenceLine x="24.5" yAxisId="left" stroke="#334155" strokeDasharray="3 3" label={{ position: 'top', value: 'S4', fill: '#475569', fontSize: 10 }} />
                                </>
                            )}
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Bottom Grid: Table & Pro Chart - Expanded to Fill Space */}
            <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
                
                {/* Table: Top Specialties */}
                <div className="bg-[#0F2645] border border-slate-800 rounded-2xl p-4 flex flex-col shadow-xl overflow-hidden">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2 flex items-center gap-2">
                        <Activity className="w-3.5 h-3.5 text-[#F39C45]" /> Ranking de Especialidades
                    </h3>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-[#0F2645] z-10">
                                <tr>
                                    <th onClick={() => handleSort('name')} className="group flex items-center py-1">Especialidade <SortIcon columnKey="name" /></th>
                                    <th onClick={() => handleSort('total')} className="text-right group hover:bg-[#1E3A5F] rounded transition-colors py-1"><div className="flex items-center justify-end">Total <SortIcon columnKey="total" /></div></th>
                                    <th onClick={() => handleSort('REALIZADO')} className="text-right group hover:bg-[#1E3A5F] rounded transition-colors py-1"><div className="flex items-center justify-end">Real. <SortIcon columnKey="REALIZADO" /></div></th>
                                    <th onClick={() => handleSort('BLOQUEADO')} className="text-right group hover:bg-[#1E3A5F] rounded transition-colors py-1"><div className="flex items-center justify-end">Bloq. <SortIcon columnKey="BLOQUEADO" /></div></th>
                                    <th onClick={() => handleSort('ocupacao')} className="text-right group hover:bg-[#1E3A5F] rounded transition-colors py-1"><div className="flex items-center justify-end">Ocup. <SortIcon columnKey="ocupacao" /></div></th>
                                    <th onClick={() => handleSort('absenteismo')} className="text-right group hover:bg-[#1E3A5F] rounded transition-colors py-1"><div className="flex items-center justify-end">Abs. <SortIcon columnKey="absenteismo" /></div></th>
                                </tr>
                            </thead>
                            <tbody>
                                {specialtiesTableData.map((s: any) => (
                                    <tr key={s.name} className="data-row border-b border-slate-800/50 text-[10px]">
                                        <td className="font-medium text-slate-200 py-1.5">{s.name}</td>
                                        <td className="text-right text-slate-400 py-1.5">{s.total}</td>
                                        <td className="text-right text-emerald-400 font-bold py-1.5">{s.REALIZADO}</td>
                                        <td className="text-right text-rose-400 font-bold py-1.5">{s.BLOQUEADO}</td>
                                        <td className="text-right py-1.5">
                                            <span className={clsx("px-1.5 py-0.5 rounded text-[9px] font-bold", s.ocupacao >= 70 ? 'bg-emerald-900/30 text-emerald-400' : s.ocupacao >= 40 ? 'bg-amber-900/30 text-amber-400' : 'bg-rose-900/30 text-rose-400')}>
                                                {s.ocupacao.toFixed(0)}%
                                            </span>
                                        </td>
                                        <td className="text-right text-rose-400 py-1.5">{s.absenteismo.toFixed(1)}%</td>
                                    </tr>
                                ))}
                                {specialtiesTableData.length === 0 && (
                                    <tr><td colSpan={6} className="text-center py-4 text-slate-500">Sem dados</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Chart: Top Professionals */}
                <div className="bg-[#0F2645] border border-slate-800 rounded-2xl p-4 flex flex-col shadow-xl">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-[#3B82F6]" /> Eficiência Profissional
                    </h3>
                    <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chart2Data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }} barGap={1}>
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="shortName" stroke="#94a3b8" fontSize={10} width={100} tickLine={false} axisLine={false} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.03)'}} contentStyle={{ backgroundColor: '#020617', borderColor: '#1E293B', borderRadius: '8px', fontSize: '10px', color: '#fff' }} />
                                <Legend wrapperStyle={{ fontSize: '9px', paddingTop: '5px' }} iconSize={8} />
                                <Bar dataKey="AGENDADO" name="Agendado" fill={COLORS.AGENDADO} radius={[0, 3, 3, 0]} barSize={8} />
                                <Bar dataKey="REALIZADO" name="Realizado" fill={COLORS.REALIZADO} radius={[0, 3, 3, 0]} barSize={8} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            {/* New Card: Top Blockers - Reduced Height */}
            <div className="h-40 shrink-0">
                 <div className="bg-[#0F2645] border border-slate-800 rounded-2xl p-4 flex flex-col shadow-xl h-full overflow-hidden">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Top 5 Profissionais com Mais Bloqueios
                    </h3>
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-[#0F2645] z-10">
                                <tr>
                                    <th className="py-1">Profissional</th>
                                    <th className="text-right py-1">Bloqueios</th>
                                    <th className="text-right py-1">Dias</th>
                                    <th className="text-right py-1">Datas</th>
                                </tr>
                            </thead>
                            <tbody>
                                {blockedProfessionalsData.map((p: any) => (
                                    <tr key={p.name} className="data-row border-b border-slate-800/50 text-[10px]">
                                        <td className="font-medium text-slate-200 py-1.5">{p.name}</td>
                                        <td className="text-right text-rose-400 font-bold py-1.5">{p.count}</td>
                                        <td className="text-right text-slate-400 py-1.5">{p.daysCount}</td>
                                        <td className="text-right text-slate-500 text-[9px] py-1.5">{p.daysList}</td>
                                    </tr>
                                ))}
                                {blockedProfessionalsData.length === 0 && (
                                    <tr><td colSpan={4} className="text-center py-4 text-slate-500">Nenhum bloqueio registrado</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
};