import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { findProduct } from '../data/catalogue.mjs';

export type Draft = { name: string; surname: string; email: string; phone: string; message: string };
type EnquiryState = { draft: Draft; setDraft: React.Dispatch<React.SetStateAction<Draft>>; attachments: File[]; setAttachments: React.Dispatch<React.SetStateAction<File[]>>; enquire: (slug: string) => void; focusRequest: number };
const EnquiryContext = createContext<EnquiryState | null>(null);

export function EnquiryProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>({ name: '', surname: '', email: '', phone: '', message: '' });
  const [focusRequest, setFocusRequest] = useState(0);
  const [attachments, setAttachments] = useState<File[]>([]);
  const navigate = useNavigate();
  const enquire = useCallback((slug: string) => {
    const product = findProduct(slug);
    setDraft(previous => ({ ...previous, message: previous.message.trim() || (product ? `I'd like to know more about ${product.name}.` : '') }));
    setFocusRequest(count => count + 1);
    navigate('/contact');
  }, [navigate]);
  const value = useMemo(() => ({ draft, setDraft, attachments, setAttachments, enquire, focusRequest }), [draft, attachments, enquire, focusRequest]);
  return <EnquiryContext.Provider value={value}>{children}</EnquiryContext.Provider>;
}

export function useEnquiry() {
  const context = useContext(EnquiryContext);
  if (!context) throw new Error('EnquiryProvider is required');
  return context;
}
