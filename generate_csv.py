import pandas as pd
import numpy as np

def generate_csv():
    np.random.seed(42)
    n = 1000
    dates = pd.date_range(start='2023-01-01', periods=n, freq='10h')
    
    data = {
        'invoice_id': [f"INV-{i}" for i in range(n)],
        'buyer_id': np.random.choice([f"BUYER-{i}" for i in range(30)], n),
        'amount': np.random.uniform(500, 50000, n),
        'industry': np.random.choice(['Tech', 'Retail', 'Manufacturing', 'Healthcare'], n),
        'due_date': dates.strftime('%Y-%m-%d'),
    }
    
    df = pd.DataFrame(data)
    
    delays = np.random.normal(loc=12, scale=15, size=n).astype(int)
    # Using a safer date addition method
    df['actual_payment_date'] = (pd.to_datetime(df['due_date']) + pd.to_timedelta(delays, unit='D')).dt.strftime('%Y-%m-%d')
    
    df.to_csv('dataset.csv', index=False)
    print("Successfully generated 'dataset.csv'!")

if __name__ == '__main__':
    generate_csv()
