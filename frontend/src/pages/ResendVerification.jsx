import React, { useState } from 'react';
import API from '../api/api';

const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await API.post('/auth/resend-verification', { email });
      setStatus('sent');
    } catch (err) {
      setStatus('error');
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Resend Verification Email</h2>
      {status === 'sent' ? (
        <p>Verification email sent — check your inbox.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Resend Verification</button>
        </form>
      )}
      {status === 'error' && <p style={{ color: 'red' }}>Failed to send. Try again later.</p>}
    </div>
  );
};

export default ResendVerification;
