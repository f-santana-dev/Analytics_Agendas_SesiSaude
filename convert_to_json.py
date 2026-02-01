import pandas as pd
import json
import os

def converter_para_json():
    try:
        print("Lendo planilha...")
        # Ler a aba detalhada
        df = pd.read_excel('Agendas_Jan_2026.xlsx', sheet_name='Planilha3')
        
        # Selecionar apenas colunas relevantes para reduzir tamanho
        colunas = [
            'Unidade', 'Profissional', 'Especialidade', 'CategoriaEspecialidade', 
            'StatusMonitoramento', 'Situacao_Horario', 'DataQuadro', 'HoraInicio'
        ]
        
        # Verificar se colunas existem
        cols_existentes = [c for c in colunas if c in df.columns]
        df = df[cols_existentes]
        
        # Tratamento de Status
        df['Status_Final'] = df['StatusMonitoramento'].map({
            'DISPONIVEL': 'LIVRE',
            'BLOQUEADO': 'BLOQUEADO',
            'Ausente': 'AUSENTE',
            'Realizado': 'REALIZADO',
            'Agendado': 'AGENDADO',
            'Confirmado': 'AGENDADO',
            'Confirmou': 'AGENDADO',
            'Chegou': 'AGENDADO'
        }).fillna('OUTROS')
        
        # Converter datas para string
        if 'DataQuadro' in df.columns:
            df['DataQuadro'] = df['DataQuadro'].astype(str)
        
        # Preencher nulos
        df = df.fillna('')
        
        # Converter para lista de dicionários
        dados = df.to_dict('records')
        
        # Criar estrutura final
        resultado = {
            'meta': {
                'total_registros': len(df),
                'data_geracao': pd.Timestamp.now().isoformat()
            },
            'dados': dados
        }
        
        # Salvar JSON na pasta public do React
        output_dir = os.path.join('dashboard-react', 'public')
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        output_file = os.path.join(output_dir, 'dados.json')
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(resultado, f, ensure_ascii=False, indent=2)
            
        print(f"Arquivo {output_file} gerado com sucesso! ({len(dados)} registros)")
        return True
        
    except Exception as e:
        print(f"Erro ao converter: {e}")
        return False

if __name__ == "__main__":
    converter_para_json()