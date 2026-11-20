import { useEffect, useRef, useState } from 'react';
import { FileText, Paperclip, Plus, X } from 'lucide-react';
import { ATTACHMENT_ACCEPT, selectAttachments } from '../data/enquiry-attachments.mjs';

function FilePreview({ file }: { file: File }) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  const isImage = file.type.startsWith('image/');
  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    if (imageRef.current) imageRef.current.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);
  return <span className="attachment-preview" aria-hidden="true">
    {isImage && !failed ? <img ref={imageRef} alt="" width={48} height={48} onError={() => setFailed(true)} /> : <FileText size={20} />}
  </span>;
}

export default function EnquiryAttachments({ files, onChange }: { files: File[]; onChange: (files: File[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const chooseRef = useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState('');

  const addFiles = (incoming: File[]) => {
    const result = selectAttachments(files, incoming);
    onChange(result.files);
    setErrors(result.errors);
    setAnnouncement(`${result.files.length} of 5 files selected.`);
  };
  const remove = (index: number) => {
    const removed = files[index];
    onChange(files.filter((_, position) => position !== index));
    setErrors([]);
    setAnnouncement(`${removed.name} removed.`);
    chooseRef.current?.focus();
  };

  return <div className="enquiry-attachments">
    <div className="attachment-heading"><span id="attachment-title">Files &amp; images <span className="attachment-optional">(optional)</span></span><span>{files.length}/5</span></div>
    <div className={`attachment-dropzone${dragging ? ' is-dragging' : ''}`}
      onDragOver={event => { event.preventDefault(); if (event.dataTransfer.types.includes('Files')) setDragging(true); }}
      onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
      onDrop={event => { event.preventDefault(); setDragging(false); addFiles(Array.from(event.dataTransfer.files)); }}>
      <Paperclip size={24} strokeWidth={1.25} aria-hidden="true" />
      <div><p>A little more to share?</p><span>Drop files here, or choose from your device.</span></div>
      <button ref={chooseRef} type="button" className="attachment-choose" onClick={() => inputRef.current?.click()} aria-describedby="attachment-help"><Plus size={16} aria-hidden="true" />Choose files</button>
      <input ref={inputRef} type="file" name="attachments" aria-labelledby="attachment-title" multiple accept={ATTACHMENT_ACCEPT} hidden onChange={event => { addFiles(Array.from(event.target.files || [])); event.target.value = ''; }} />
    </div>
    <p id="attachment-help" className="attachment-help">Images, PDF, Word or text · Up to 5 files, 10 MB each.</p>
    {files.length > 0 && <ul className="attachment-list">{files.map((file, index) => <li key={`${file.name}-${file.size}-${file.lastModified}`}>
      <FilePreview file={file} /><div><span>{file.name}</span><small>{file.size < 1024 * 1024 ? `${Math.max(1, Math.round(file.size / 1024))} KB` : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}</small></div>
      <button type="button" className="icon-button" aria-label={`Remove ${file.name}`} onClick={() => remove(index)}><X size={16} aria-hidden="true" /></button>
    </li>)}</ul>}
    <div role="status" className="attachment-feedback">{errors.length ? errors.map((error, index) => <p key={index}>{error}</p>) : <span className="visually-hidden">{announcement}</span>}</div>
  </div>;
}
