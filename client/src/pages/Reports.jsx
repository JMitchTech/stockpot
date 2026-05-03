import { useState } from 'react'
import Layout from '../components/Layout'
import api from '../api'

export default function Reports() {
  const [downloading, setDownloading] = useState('')

  const downloadFile = async (endpoint, filename) => {
    setDownloading(filename)
    try {
      const res = await api.get(endpoint, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to generate report')
      console.error(err)
    } finally {
      setDownloading('')
    }
  }

  const reports = [
    {
      title: 'Food Cost Report',
      description: 'Every active dish with food cost, margin percentage, and status. Ready to hand to your accountant.',
      pdf: { endpoint: '/reports/food-cost/pdf', filename: 'stockpot_food_cost.pdf' },
      csv: { endpoint: '/reports/food-cost/csv', filename: 'stockpot_food_cost.csv' },
    },
    {
      title: 'Waste Log Report',
      description: 'Full waste history with cost breakdown by ingredient. Identifies where money is being thrown away.',
      pdf: { endpoint: '/reports/waste/pdf', filename: 'stockpot_waste.pdf' },
      csv: { endpoint: '/reports/waste/csv', filename: 'stockpot_waste.csv' },
    },
    {
      title: 'Purchasing Forecast',
      description: 'This week\'s smart order list with quantities, waste buffers, and estimated costs.',
      pdf: { endpoint: '/reports/purchasing/pdf', filename: 'stockpot_purchasing.pdf' },
      csv: null,
    },
  ]

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1B2A4A' }}>Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: '#6B4F3A' }}>
            Download reports for your accountant or records
          </p>
        </div>

        {/* Report cards */}
        {reports.map((report) => (
          <div
            key={report.title}
            className="rounded-2xl p-6 shadow-sm"
            style={{ backgroundColor: '#FEFAF4', border: '1px solid #E8D5B7' }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="font-semibold text-base mb-1" style={{ color: '#1B2A4A' }}>
                  {report.title}
                </h2>
                <p className="text-sm" style={{ color: '#6B4F3A' }}>
                  {report.description}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => downloadFile(report.pdf.endpoint, report.pdf.filename)}
                  disabled={downloading === report.pdf.filename}
                  className="text-sm text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
                  style={{ backgroundColor: '#C0392B' }}
                >
                  {downloading === report.pdf.filename ? 'Generating...' : 'PDF'}
                </button>
                {report.csv && (
                  <button
                    onClick={() => downloadFile(report.csv.endpoint, report.csv.filename)}
                    disabled={downloading === report.csv.filename}
                    className="text-sm px-4 py-2 rounded-lg transition disabled:opacity-50"
                    style={{
                      backgroundColor: '#FEFAF4',
                      color: '#1B2A4A',
                      border: '1px solid #1B2A4A'
                    }}
                  >
                    {downloading === report.csv.filename ? 'Generating...' : 'CSV'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Note */}
        <p className="text-xs text-center" style={{ color: '#E8D5B7' }}>
          All reports are generated in real time from your live kitchen data.
          Cook with passion. Manage with clarity.
        </p>

      </div>
    </Layout>
  )
}