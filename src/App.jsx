import { useMemo, useRef, useState } from 'react'
import Spline from '@splinetool/react-spline'
import { Upload, FileText, ReceiptIndianRupee, AlertCircle, BarChart3 } from 'lucide-react'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function formatCurrency(n, currency = '₹') {
  if (n == null || isNaN(n)) return '-'
  return `${currency}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function App() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const inputRef = useRef(null)

  const handleFile = (f) => {
    setError('')
    if (!f) return
    const name = (f.name || '').toLowerCase()
    if (!(name.endsWith('.csv') || name.endsWith('.pdf'))) {
      setError('Please upload a CSV or PDF bank statement')
      return
    }
    setFile(f)
  }

  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    const f = e.dataTransfer.files?.[0]
    handleFile(f)
  }

  const onUpload = async () => {
    if (!file) {
      setError('Choose a CSV or PDF statement first')
      return
    }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${BACKEND_URL}/api/fees/analyze`, { method: 'POST', body: form })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const summary = result?.summary
  const categories = result?.by_category || []
  const matches = result?.matches || []

  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Hero with Spline cover */}
      <div className="relative h-[60vh] w-full overflow-hidden">
        <Spline scene="https://prod.spline.design/8nsoLg1te84JZcE9/scene.splinecode" style={{ width: '100%', height: '100%' }} />
        {/* Gradient overlay for legibility */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent" />
        <div className="absolute inset-0 flex items-end md:items-center justify-center md:justify-between px-6 md:px-12 py-6">
          <div className="max-w-2xl md:max-w-3xl">
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight">Bank Fee & Charges Detector</h1>
            <p className="mt-3 md:mt-4 text-gray-700 text-sm md:text-base">Upload your bank statement and instantly uncover hidden fees: ATM charges, service charges, SMS alerts, annual card fees, NEFT/IMPS and more.</p>
          </div>
          <div className="hidden md:block bg-white/70 backdrop-blur-sm rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <ReceiptIndianRupee className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="text-sm text-gray-600">Last quarter fees</p>
                <p className="text-xl font-semibold">{formatCurrency(summary?.total_fee || 0, summary?.currency || '₹')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Uploader card */}
      <div className="-mt-12 mx-4 md:mx-auto w-auto md:w-[720px] bg-white rounded-2xl shadow-xl p-6">
        <div
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
          className="border-2 border-dashed rounded-xl p-6 md:p-8 text-center cursor-pointer hover:border-emerald-400 transition-colors"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="w-10 h-10 mx-auto text-emerald-600" />
          <p className="mt-3 font-medium">Drag & drop your statement here</p>
          <p className="text-sm text-gray-600">CSV or PDF • bank/export statements work best</p>
          {file && <p className="mt-2 text-sm text-emerald-700">Selected: {file.name}</p>}
          <input ref={inputRef} type="file" accept=".csv,.pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>
        <button onClick={onUpload} disabled={loading} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg">
          {loading ? 'Analyzing…' : 'Scan Fees'}
        </button>
        {error && (
          <div className="mt-3 flex items-start gap-2 text-red-700 bg-red-50 border border-red-200 rounded-md p-3">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="mx-4 md:mx-auto mt-10 mb-20 w-auto md:w-[900px]">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">You paid {formatCurrency(summary.total_fee, summary.currency)} in fees</h2>
                <p className="text-gray-600 text-sm">{summary.start_date && summary.end_date ? `${summary.start_date} to ${summary.end_date}` : 'Detected period'}</p>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm">{summary.total_count} fee entries</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div key={c.category} className="border rounded-xl p-4 bg-gray-50">
                  <p className="text-sm text-gray-600">{c.category}</p>
                  <p className="text-lg font-semibold">{formatCurrency(c.amount, summary.currency)}</p>
                  <p className="text-xs text-gray-500">{c.count} time{c.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
              {categories.length === 0 && (
                <p className="text-gray-600">No fees detected. Try another statement.</p>
              )}
            </div>

            <div className="mt-8">
              <h3 className="font-semibold mb-3">All fee entries</h3>
              <div className="max-h-64 overflow-auto border rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Description</th>
                      <th className="text-right p-2">Amount</th>
                      <th className="text-left p-2">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m, i) => (
                      <tr key={i} className="border-t">
                        <td className="p-2 whitespace-nowrap">{m.date || '-'}</td>
                        <td className="p-2 max-w-[420px] truncate" title={m.description}>{m.description}</td>
                        <td className="p-2 text-right">{formatCurrency(m.amount, summary.currency)}</td>
                        <td className="p-2">{m.category}</td>
                      </tr>
                    ))}
                    {matches.length === 0 && (
                      <tr><td colSpan="4" className="p-4 text-center text-gray-600">No entries</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="mt-auto text-center text-xs text-gray-500 py-6">No bank credentials required. Files are processed in-memory for this demo.</footer>
    </div>
  )
}

export default App
