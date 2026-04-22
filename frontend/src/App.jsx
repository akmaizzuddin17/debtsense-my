import { useState } from 'react'
import Header from './components/Header.jsx'
import InputForm from './components/InputForm.jsx'
import Results from './components/Results.jsx'
import MonthlyTracker, { saveMonthEntry } from './components/MonthlyTracker.jsx'

const HISTORY_KEY = 'debtsense_my_history'

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]') } catch { return [] }
}

export default function App() {
  const [page,        setPage]        = useState('home')
  const [results,     setResults]     = useState(null)
  const [formData,    setFormData]    = useState(null)
  const [history,     setHistory]     = useState(() => loadHistory())
  const [viewKey,     setViewKey]     = useState(0)
  const [trackerData, setTrackerData] = useState(null)

  const handleAnalyze = (data, resultsData) => {
    const income = Object.values(data.income || {}).reduce((a, b) => a + (Number(b) || 0), 0)
    const entry = {
      id:      Date.now(),
      date:    new Date().toISOString(),
      label:   `Analysis — ${new Date().toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}`,
      dsr:     resultsData.dsr?.dsr_percentage,
      status:  resultsData.dsr?.dsr_status,
      income,
      formData: data,
      results:  resultsData,
    }
    const updated = [entry, ...history].slice(0, 10)
    setHistory(updated)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))

    // Auto-save to monthly tracker
    const ym = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
    const trackerEntry = {
      dsr:          resultsData.dsr?.dsr_percentage,
      dsrStatus:    resultsData.dsr?.dsr_status === 'SAFE' ? 'SAFE' : resultsData.dsr?.dsr_status === 'DANGER' ? 'DANGER' : 'WARNING',
      riskLevel:    resultsData.risk?.overall_risk,
      savingsRate:  resultsData.risk?.savings_rate_percentage,
      shieldScore:  resultsData.shield?.score ?? null,
      income,
      results:      resultsData,
    }
    const newTrackerData = saveMonthEntry(ym, trackerEntry)
    setTrackerData(newTrackerData)

    setFormData(data)
    setResults(resultsData)
    setPage('results')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReset = () => {
    setPage('home')
    setResults(null)
    setFormData(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleViewHistory = (entry) => {
    setFormData(entry.formData || null)
    setResults(entry.results)
    setViewKey(k => k + 1)
    setPage('results')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleViewMonth = (entry) => {
    if (entry?.results) handleViewHistory({ formData: null, results: entry.results })
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <Header onLogoClick={handleReset} />
      <MonthlyTracker
        onViewMonth={handleViewMonth}
        onSaveTrackerData={setTrackerData}
      />
      {page === 'home'
        ? <InputForm onAnalyze={handleAnalyze} />
        : <Results
            key={viewKey}
            results={results}
            formData={formData}
            history={history}
            onReset={handleReset}
            onViewHistory={handleViewHistory}
          />
      }
    </div>
  )
}
