import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export type Draft = { name: string; email: string; ingredient: string; message: string };
type EnquiryState = { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>>; enquire: (slug: string) => void; focusRequest: number };
const EnquiryContext = createContext<EnquiryState | null>(null);

export function EnquiryProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>({ name: '', email: '', ingredient: '', message: '' });
  const [focusRequest, setFocusRequest] = useState(0);
  const navigate = useNavigate();
  const enquire = useCallback((slug: string) => {
    setDraft(previous => ({ ...previous, ingredient: slug }));
    setFocusRequest(count => count + 1);
    navigate('/#contact');
  }, [navigate]);
  const value = useMemo(() => ({ draft, setDraft, enquire, focusRequest }), [draft, enquire, focusRequest]);
  return <EnquiryContext.Provider value={value}>{children}</EnquiryContext.Provider>;
}

export function useEnquiry() {
  const context = useContext(EnquiryContext);
  if (!context) throw new Error('EnquiryProvider is required');
  return context;
}
