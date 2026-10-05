import { useState } from 'react';
import JobsView from './pages/JobsView.jsx';
import ListView from './pages/ListView.jsx';
import FormView from './pages/FormView.jsx';
import DetailView from './pages/DetailView.jsx';
import './App.css';

export default function App() {
  const [view, setView] = useState('jobs');
  const [detailId, setDetailId] = useState(null);
  const [vagaSelecionada, setVagaSelecionada] = useState(null);

  if (view === 'form') {
    return (
      <FormView
        vaga={vagaSelecionada}
        onDone={() => { setVagaSelecionada(null); setView('jobs'); }}
      />
    );
  }

  if (view === 'detail') {
    return <DetailView id={detailId} onBack={() => setView('list')} />;
  }

  if (view === 'list') {
    return (
      <ListView
        onNew={() => setView('form')}
        onOpen={(id) => { setDetailId(id); setView('detail'); }}
        onBack={() => setView('jobs')}
      />
    );
  }

  return (
    <JobsView
      onApply={(vaga) => { setVagaSelecionada(vaga); setView('form'); }}
      onGoAdmin={() => setView('list')}
    />
  );
}
