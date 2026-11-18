import { useEffect, useState } from 'react';

export default function useAviso() {
  const [aviso, setAviso] = useState(null);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), 4000);
    return () => clearTimeout(t);
  }, [aviso]);

  return [aviso, setAviso];
}