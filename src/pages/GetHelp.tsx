import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, ChevronRight, CircleHelp, CreditCard, Grid2X2, Leaf, List, MessageCircle, Package, Search, ShoppingBag, Sprout, Truck, Coffee, X } from 'lucide-react';
import ResponsiveImage from '../components/ResponsiveImage';
import { helpTopics, searchHelp } from '../data/help.mjs';
import '../help.css';

const icons = { bag: ShoppingBag, truck: Truck, card: CreditCard, package: Package, sprout: Sprout, cup: Coffee, leaf: Leaf, help: CircleHelp, message: MessageCircle };
const helpLink = (topic: string, article?: string) => `/get-help?${new URLSearchParams({ topic, ...(article ? { article } : {}) })}`;

export default function GetHelp() {
  const [params, setParams] = useSearchParams();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const query = params.get('q') || '';
  const searching = Boolean(query.trim());
  const topic = helpTopics.find(item => item.id === params.get('topic'));
  const article = topic?.articles.find(item => item.id === params.get('article'));
  const results = searching ? searchHelp(query) : [];
  const heading = useRef<HTMLHeadingElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const selection = searching ? '' : `${topic?.id || ''}/${article?.id || ''}`;
  const previousSelection = useRef(selection);

  useEffect(() => {
    if (selection !== previousSelection.current && !searching) heading.current?.focus({ preventScroll: true });
    previousSelection.current = selection;
  }, [selection, searching]);

  function updateSearch(value: string) {
    setParams(value ? { q: value } : {}, { replace: true, preventScrollReset: true });
  }

  return <div className="destination-page help-page">
    <section className="help-hero" aria-labelledby="help-title">
      <ResponsiveImage name="garden-aerial" className="help-hero__image" sizes="100vw" priority alt="" />
      <div className="help-hero__content">
        <h1 id="help-title">Need help? We’ve got you covered</h1>
        <form className="help-search" role="search" onSubmit={event => { event.preventDefault(); heading.current?.focus(); }}>
          <Search size={21} strokeWidth={1.7} aria-hidden="true" />
          <input ref={search} type="search" aria-label="Search help articles" placeholder="Search for answers" value={query} onChange={event => updateSearch(event.target.value)} />
          {query && <button type="button" aria-label="Clear search" onClick={() => { updateSearch(''); search.current?.focus(); }}><X size={19} aria-hidden="true" /></button>}
        </form>
      </div>
    </section>

    <div className="help-container">
      <section className="help-directory" aria-labelledby="help-directory-title">
        <div className="help-directory__toolbar">
          <h2 id="help-directory-title" ref={heading} tabIndex={-1}>{searching ? 'Search results' : article ? article.title : topic ? topic.title : 'Get more information'}</h2>
          {!searching && !topic && <div className="help-view-toggle" role="group" aria-label="Topic layout">
            <button type="button" aria-label="Grid view" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><Grid2X2 size={17} aria-hidden="true" /></button>
            <button type="button" aria-label="List view" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={19} aria-hidden="true" /></button>
          </div>}
        </div>

        {searching ? <>
          <p className="help-results-count" role="status">{results.length} {results.length === 1 ? 'answer' : 'answers'} for “{query.trim()}”</p>
          {results.length ? <ul className="help-articles">{results.map(({ topic: resultTopic, article: resultArticle }) => <li key={`${resultTopic.id}/${resultArticle.id}`}>
            <Link to={helpLink(resultTopic.id, resultArticle.id)}><span><small>{resultTopic.title}</small><span>{resultArticle.title}</span></span><ChevronRight size={20} aria-hidden="true" /></Link>
          </li>)}</ul> : <div className="help-empty"><Search size={30} strokeWidth={1.3} aria-hidden="true" /><h3>No answers found just yet.</h3><p>Try a different word, like “delivery”, “ingredients” or “order”.<br />We’re here if you need a hand.</p><button className="text-link" onClick={() => { updateSearch(''); search.current?.focus(); }}>Browse all topics <ArrowRight size={17} aria-hidden="true" /></button></div>}
        </> : topic ? <>
          <nav className="help-breadcrumb" aria-label="Help navigation"><Link to="/get-help"><ArrowLeft size={15} aria-hidden="true" /> All topics</Link>{article && <><ChevronRight size={13} aria-hidden="true" /><Link to={helpLink(topic.id)}>{topic.title}</Link></>}</nav>
          {article ? <article className="help-answer" aria-labelledby="help-directory-title"><p>{article.body}</p><Link className="text-link" to={article.href}>{article.link} <ArrowRight size={17} aria-hidden="true" /></Link><div className="help-answer__note"><BookOpen size={18} aria-hidden="true" /><span>Something else on your mind? <Link to="/contact">Say hello.</Link></span></div></article> : <>
            <p className="help-topic-intro">A little clarity, one question at a time.</p>
            <ul className="help-articles">{topic.articles.map(item => <li key={item.id}><Link to={helpLink(topic.id, item.id)}><span>{item.title}</span><ChevronRight size={20} aria-hidden="true" /></Link></li>)}</ul>
          </>}
        </> : <ul className={`help-topics help-topics--${view}`}>{helpTopics.map(item => {
          const Icon = icons[item.icon as keyof typeof icons];
          return <li key={item.id}><Link className="help-topic" to={helpLink(item.id)}>
            <span className="help-topic__title"><Icon size={21} strokeWidth={1.65} aria-hidden="true" /><span>{item.title}</span></span>
            <span className="help-topic__count">{item.articles.length} articles</span>
            <ChevronRight className="help-topic__arrow" size={18} aria-hidden="true" />
          </Link></li>;
        })}</ul>}
      </section>

      <section className="help-support" aria-labelledby="help-support-title">
        <h2 id="help-support-title">Get support</h2>
        <div className="help-support__grid">
          <Link className="help-support__card" to="/contact"><MessageCircle size={24} strokeWidth={1.4} aria-hidden="true" /><span><h3>A little help from us</h3><p>Have a question of your own? Let’s talk.</p><span className="help-support__action">Say hello <ArrowRight size={17} aria-hidden="true" /></span></span></Link>
          <Link className="help-support__card" to="/faqs"><BookOpen size={24} strokeWidth={1.4} aria-hidden="true" /><span><h3>A few quick answers</h3><p>A good place to begin with Herby Health.</p><span className="help-support__action">Read the FAQs <ArrowRight size={17} aria-hidden="true" /></span></span></Link>
        </div>
      </section>
    </div>
  </div>;
}
