import pandas as pd

def investigar_regras_negocio():
    try:
        df = pd.read_excel('Agendas_Jan_2026.xlsx', sheet_name='Planilha3')
        
        print("=== Análise de Colunas de Status ===")
        
        if 'Situacao_Horario' in df.columns:
            print("\nValores únicos em 'Situacao_Horario':")
            print(df['Situacao_Horario'].value_counts(dropna=False))
            
        if 'ocupacao_agenda' in df.columns:
            print("\nValores únicos em 'ocupacao_agenda':")
            print(df['ocupacao_agenda'].value_counts(dropna=False))
            
        if 'StatusMonitoramento' in df.columns:
            print("\nValores únicos em 'StatusMonitoramento':")
            print(df['StatusMonitoramento'].value_counts(dropna=False))

        # Cruzamento para entender a hierarquia
        print("\n=== Cruzamento: Situacao_Horario x StatusMonitoramento ===")
        print(pd.crosstab(df['Situacao_Horario'], df['StatusMonitoramento']))

    except Exception as e:
        print(f"Erro: {e}")

if __name__ == "__main__":
    investigar_regras_negocio()