import { useState, useRef } from 'react'
import Layout from '../components/Layout'
import api from '../api'

export default function Scan() {
  const [mode, setMode] = useState('menu')
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [results, setResults] = useState(null)
  const [importing, setImporting] = useState(false)
  const [imported, setImported] = useState(false)
  const [ingredientCount, setIngredientCount] = useState(0)
  const fileRef = useRef(null)
  const cameraRef = useRef(null)

  const reset = () => {
    setFile(null)
    setPreview(null)
    setResults(null)
    setImported(false)
    setIngredientCount(0)
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0]
    if (!selected) return
    reset()
    setFile(selected)
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(selected)
  }

  const handleScan = async () => {
    if (!file) return
    setScanning(true)
    setResults(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const endpoint = mode === 'menu' ? '/scanning/menu' : '/scanning/invoice'
      const res = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResults(res.data)
    } catch (err) {
      alert(err.response?.data?.detail || 'Scan failed')
    } finally {
      setScanning(false)
    }
  }

  const handleImportAll = async () => {
    if (!results?.items) return
    setImporting(true)

    // Get existing ingredients to avoid duplicates
    let existingIngredients = []
    try {
      const res = await api.get('/ingredients/')
      existingIngredients = res.data.map(i => i.name.toLowerCase())
    } catch {}

    // Collect all unique ingredient names across all dishes
    const allIngredients = new Set()
    for (const item of results.items) {
      if (item.potential_ingredients) {
        item.potential_ingredients.forEach(ing => {
          allIngredients.add(ing.trim().toLowerCase())
        })
      }
    }

    // Import dishes
    for (const item of results.items) {
      try {
        await api.post('/menu/', {
          name: item.name,
          category: item.category || '',
          sale_price: item.price || 0,
          recipe_lines: []
        })
      } catch {}
    }

    // Import ingredients — skip duplicates
    let count = 0
    const toImport = [...allIngredients].filter(name => !existingIngredients.includes(name))
    for (const name of toImport) {
      try {
        await api.post('/ingredients/', {
          name: name.charAt(0).toUpperCase() + name.slice(1),
          unit: 'unit',
          cost_per_unit: 0.00,
          par_level: 0,
          current_stock: 0,
          allergens: []
        })
        count++
      } catch {}
    }

    setIngredientCount(count)
    setImported(true)
    setImporting(false)
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>Scan</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B4F3A' }}>
            Snap a photo of your menu or a supplier invoice and Nonna will read it for you
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2">
          {['menu', 'invoice'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); reset() }}
              className="px-5 py-2 rounded-lg text-sm font-medium transition"
              style={{
                backgroundColor: mode === m ? '#1B2A4A' : '#FEFAF4',
                color: mode === m ? 'white' : '#3D2B1F',
                border: '1px solid #E8D5B7'
              }}
            >
              {m === 'menu' ? 'Menu Photo' : 'Invoice Photo'}
            </button>
          ))}
        </div>

        {/* Upload area */}
        <div
          className="rounded-2xl p-8 text-center shadow-sm"
          style={{ backgroundColor: '#FEFAF4', border: '2px dashed #E8D5B7' }}
        >
          {preview ? (
            <div className="space-y-4">
              <img
                src={preview}
                alt="Preview"
                className="max-h-64 mx-auto rounded-xl object-contain shadow"
              />
              <button
                onClick={reset}
                className="text-xs underline"
                style={{ color: '#C0392B' }}
              >
                Remove and choose another
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-4xl">📷</p>
              <p className="font-medium" style={{ color: '#1B2A4A' }}>
                {mode === 'menu' ? 'Upload your menu' : 'Upload your invoice'}
              </p>
              <p className="text-sm" style={{ color: '#6B4F3A' }}>
                On mobile you can take a photo directly. On desktop upload an image file.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => fileRef.current.click()}
                  className="text-sm px-5 py-2 rounded-lg transition"
                  style={{ backgroundColor: '#1B2A4A', color: 'white' }}
                >
                  Choose File
                </button>
                <button
                  onClick={() => cameraRef.current.click()}
                  className="text-sm px-5 py-2 rounded-lg transition"
                  style={{ backgroundColor: '#FEFAF4', color: '#1B2A4A', border: '1px solid #1B2A4A' }}
                >
                  Take Photo
                </button>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <input
                ref={cameraRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          )}
        </div>

        {/* Scan button */}
        {file && !results && (
          <button
            onClick={handleScan}
            disabled={scanning}
            className="w-full text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            style={{ backgroundColor: '#C0392B' }}
          >
            {scanning
              ? mode === 'menu' ? 'Nonna is reading your menu...' : 'Nonna is reading your invoice...'
              : mode === 'menu' ? 'Scan Menu' : 'Scan Invoice'
            }
          </button>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">

            {/* Summary + import button */}
            <div
              className="px-5 py-4 rounded-2xl shadow-sm"
              style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}
            >
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-sm" style={{ color: '#1B2A4A' }}>
                    Nonna found {results.items_found} {mode === 'menu' ? 'dishes' : 'line items'}
                  </p>
                  {results.extraction_notes && (
                    <p className="text-xs mt-0.5" style={{ color: '#6B4F3A' }}>
                      {results.extraction_notes}
                    </p>
                  )}
                </div>

                {mode === 'menu' && results.items_found > 0 && (
                  !imported ? (
                    <button
                      onClick={handleImportAll}
                      disabled={importing}
                      className="text-sm text-white px-4 py-2 rounded-lg disabled:opacity-50"
                      style={{ backgroundColor: '#1B2A4A' }}
                    >
                      {importing ? 'Importing...' : 'Import to Stockpot'}
                    </button>
                  ) : (
                    <span className="text-sm font-medium text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                      {results.items_found} dishes and {ingredientCount} ingredients imported
                    </span>
                  )
                )}
              </div>

              {/* Import note */}
              {mode === 'menu' && !imported && (
                <p className="text-xs mt-3 pt-3" style={{ color: '#6B4F3A', borderTop: '1px solid #E8D5B7' }}>
                  Importing will add all dishes to your Menu and all detected ingredients to your Ingredients library with $0 cost. Visit Ingredients to fill in real costs so Nonna can calculate your food margins.
                </p>
              )}
            </div>

            {/* Results table */}
            <div className="rounded-2xl overflow-hidden shadow-sm" style={{ border: '1px solid #E8D5B7' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ backgroundColor: '#F5ECD7' }}>
                    {mode === 'menu' ? (
                      <>
                        <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Dish</th>
                        <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Category</th>
                        <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Price</th>
                        <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Ingredients Detected</th>
                      </>
                    ) : (
                      <>
                        <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Item</th>
                        <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Quantity</th>
                        <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Unit Cost</th>
                        <th className="text-left px-5 py-3 font-semibold" style={{ color: '#1B2A4A' }}>Total</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {results.items.map((item, i) => (
                    <tr
                      key={i}
                      style={{
                        backgroundColor: i % 2 === 0 ? '#FEFAF4' : '#FDF6EC',
                        borderTop: '1px solid #E8D5B7'
                      }}
                    >
                      {mode === 'menu' ? (
                        <>
                          <td className="px-5 py-3 font-medium" style={{ color: '#3D2B1F' }}>{item.name}</td>
                          <td className="px-5 py-3" style={{ color: '#6B4F3A' }}>{item.category || '—'}</td>
                          <td className="px-5 py-3" style={{ color: '#3D2B1F' }}>
                            {item.price ? `$${item.price.toFixed(2)}` : '—'}
                          </td>
                          <td className="px-5 py-3" style={{ color: '#6B4F3A' }}>
                            {item.potential_ingredients?.join(', ') || '—'}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3 font-medium" style={{ color: '#3D2B1F' }}>{item.name}</td>
                          <td className="px-5 py-3" style={{ color: '#6B4F3A' }}>{item.quantity} {item.unit}</td>
                          <td className="px-5 py-3" style={{ color: '#3D2B1F' }}>${item.unit_cost?.toFixed(2)}</td>
                          <td className="px-5 py-3 font-medium" style={{ color: '#C0392B' }}>${item.total_cost?.toFixed(2)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        )}

      </div>
    </Layout>
  )
}