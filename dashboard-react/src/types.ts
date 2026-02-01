export interface Agendamento {
  Unidade: string;
  Profissional: string;
  Especialidade: string;
  CategoriaEspecialidade: string;
  StatusMonitoramento: string;
  Status_Final: string;
  DataQuadro: string;
  HoraInicio: string;
}

export interface KPI {
  total: number;
  agendados: number;
  realizados: number;
  ausentes: number;
  bloqueados: number;
  livres: number;
}