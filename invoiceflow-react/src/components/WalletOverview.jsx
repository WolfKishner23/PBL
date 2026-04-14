import React, { useState, useEffect } from 'react';
import { walletAPI } from '../services/api';

export default function WalletOverview() {
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWallet = async () => {
            try {
                const res = await walletAPI.getHistory();
                setBalance(res.data.balance);
                setTransactions(res.data.transactions);
            } catch (err) {
                console.error('Failed to fetch wallet:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchWallet();
    }, []);

    const formatCurr = (val) => new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(val);

    if (loading) return <div style={{ color: 'var(--gray-400)', padding: '20px' }}>Loading wallet...</div>;

    return (
        <div className="wallet-container" style={{ marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
                {/* Balance Card */}
                <div style={{ 
                    background: 'linear-gradient(135deg, #3B82F6 0%, #1E40AF 100%)',
                    borderRadius: '16px',
                    padding: '24px',
                    color: 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.2)'
                }}>
                    <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.8, fontWeight: 600 }}>Wallet Balance</span>
                    <h2 style={{ fontSize: '32px', fontWeight: 800, margin: '8px 0 4px', letterSpacing: '-0.5px' }}>{formatCurr(balance)}</h2>
                    <span style={{ fontSize: '11px', opacity: 0.7 }}>Simulated Currency (INR)</span>
                </div>

                {/* Transaction History */}
                <div style={{ 
                    background: 'var(--bg-card)', 
                    border: '1px solid var(--border-dim)',
                    borderRadius: '16px',
                    padding: '20px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    <h3 style={{ fontSize: '14px', color: 'var(--white)', fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        Transaction History
                    </h3>
                    
                    {transactions.length === 0 ? (
                        <p style={{ color: 'var(--gray-500)', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>No transactions yet</p>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                            <tbody>
                                {transactions.map(tx => (
                                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-dim)' }}>
                                        <td style={{ padding: '8px 0', color: 'var(--gray-400)', width: '100px' }}>
                                            {new Date(tx.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '8px 0', color: 'var(--white)' }}>
                                            {tx.description}
                                        </td>
                                        <td style={{ padding: '8px 0', textAlign: 'right', fontWeight: 700, color: tx.type === 'credit' ? 'var(--green)' : 'var(--red)' }}>
                                            {tx.type === 'credit' ? '+' : '-'}{formatCurr(tx.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}
