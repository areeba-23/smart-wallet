import { useState } from 'react';
import { useDispatch } from 'react-redux';

/* Runs a thunk, tracks pending/error/success state for the form that called it. */
export function useSubmit() {
  const dispatch = useDispatch();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(thunk, payload, successMessage) {
    setError('');
    setNotice('');
    setBusy(true);
    try {
      await dispatch(thunk(payload)).unwrap();
      if (successMessage) setNotice(successMessage);
      return true;
    } catch (e) {
      setError(typeof e === 'string' ? e : e?.message || 'Something went wrong. Try again.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  return { submit, error, notice, busy, clear: () => { setError(''); setNotice(''); } };
}
