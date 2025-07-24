import React, { useState, useEffect, useRef } from 'react';

const App = () => {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    revenue: '', cogs: '', expenses: '', netProfit: '',
    assets: '', liabilities: '', equity: '',
    sales: '', purchases: '', vatCharged: '', vatPaid: '',
    income: '', selfAssessmentExpenses: '', allowances: ''
  });
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  // Simulated HMRC Government Gateway authentication
  const handleLogin = () => {
    setUser({ id: '12345', name: 'Business User', utr: '1234567890', vatRegistered: true });
    alert('Logged in with Government Gateway (simulated).');
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Validate form data for HMRC compliance
  const validateForm = () => {
    const requiredFields = [
      'revenue', 'cogs', 'expenses', 'assets', 'liabilities', 'equity',
      'sales', 'purchases', 'vatCharged', 'vatPaid', 'income', 'selfAssessmentExpenses'
    ];
    for (const field of requiredFields) {
      if (!formData[field]) {
        alert(`Field ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required.`);
        return false;
      }
      if (isNaN(formData[field])) {
        alert(`Field ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} must be numeric.`);
        return false;
      }
    }
    if (parseFloat(formData.sales) > 85000 && !user.vatRegistered) {
      alert('Sales exceed £85,000. VAT registration required.');
      return false;
    }
    if (parseFloat(formData.assets) < parseFloat(formData.liabilities) + parseFloat(formData.equity)) {
      alert('Balance Sheet does not balance: Assets must equal Liabilities + Equity.');
      return false;
    }
    return true;
  };

  // Simulated HMRC MTD API submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in with Government Gateway.');
      return;
    }
    if (!validateForm()) return;

    setSubmissionStatus('Submitting...');
    try {
      // Simulated MTD VAT API payload
      const vatPayload = {
        periodKey: '25A1',
        vatDueSales: parseFloat(formData.vatCharged),
        vatDueAcquisitions: 0,
        totalVatDue: parseFloat(formData.vatCharged),
        vatReclaimedCurrPeriod: parseFloat(formData.vatPaid),
        netVatDue: Math.abs(parseFloat(formData.vatCharged) - parseFloat(formData.vatPaid)),
        totalValueSalesExVAT: parseFloat(formData.sales),
        totalValuePurchasesExVAT: parseFloat(formData.purchases),
        totalValueGoodsSuppliedExVAT: 0,
        totalAcquisitionsExVAT: 0,
        finalised: true
      };
      // Simulated Self Assessment payload
      const saPayload = {
        income: parseFloat(formData.income),
        expenses: parseFloat(formData.selfAssessmentExpenses),
        allowances: parseFloat(formData.allowances || 0)
      };
      // P&L and Balance Sheet stored for records
      const plPayload = {
        revenue: parseFloat(formData.revenue),
        cogs: parseFloat(formData.cogs),
        expenses: parseFloat(formData.expenses),
        netProfit: parseFloat(formData.netProfit)
      };
      const bsPayload = {
        assets: parseFloat(formData.assets),
        liabilities: parseFloat(formData.liabilities),
        equity: parseFloat(formData.equity)
      };
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const submission = {
        vat: vatPayload,
        selfAssessment: saPayload,
        profitAndLoss: plPayload,
        balanceSheet: bsPayload,
        timestamp: new Date().toISOString(),
        utr: user.utr,
        status: 'Submitted'
      };
      const updatedHistory = [...submissionHistory, submission];
      setSubmissionHistory(updatedHistory);
      localStorage.setItem('financialRecords', JSON.stringify(updatedHistory));
      setSubmissionStatus('Submission successful! Records saved.');
      updateChart(updatedHistory);
    } catch (error) {
      setSubmissionStatus('Submission failed. Please try again.');
    }
  };

  // Initialize Chart.js bar chart
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      chartRef.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['VAT Returns', 'Self Assessment', 'P&L', 'Balance Sheet'],
          datasets: [{
            label: 'Submissions',
            data: [0, 0, 0, 0],
            backgroundColor: ['#4CAF50', '#2196F3', '#FFC107', '#F44336'],
            borderColor: ['#388E3C', '#1976D2', '#FFA000', '#D32F2F'],
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Number of Submissions' } },
            x: { title: { display: true, text: 'Report Type' } }
          },
          plugins: { title: { display: true, text: 'Submission History' } }
        }
      });
    }
    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, []);

  // Update chart with submission history
  const updateChart = (history) => {
    const vatCount = history.filter(s => s.vat).length;
    const saCount = history.filter(s => s.selfAssessment).length;
    const plCount = history.filter(s => s.profitAndLoss).length;
    const bsCount = history.filter(s => s.balanceSheet).length;
    if (chartRef.current) {
      chartRef.current.data.datasets[0].data = [vatCount, saCount, plCount, bsCount];
      chartRef.current.update();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">HMRC Financial Report Submission</h1>
      {!user ? (
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-xl font-semibold mb-4">Login with Government Gateway</h2>
          <p className="text-gray-600 mb-4">Sign in to submit financial reports to HMRC.</p>
          <button
            onClick={handleLogin}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Login with Government Gateway
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Requires HMRC Government Gateway credentials.{' '}
            <a href="https://www.gov.uk/log-in-register-hmrc-online-services" target="_blank" className="text-blue-500">Register here</a>.
          </p>
        </div>
      ) : (
        <div className="w-full max-w-5xl">
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Dashboard - Welcome, {user.name}</h2>
            <p className="text-gray-600">Unique Taxpayer Reference (UTR): {user.utr}</p>
            <p className="text-gray-600">Self Assessment Deadline: 31 January 2026</p>
            <p className="text-gray-600">VAT Deadline: 7th of next month (quarterly)</p>
            <canvas id="submissionChart" ref={canvasRef} className="mt-4"></canvas>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Submit Financial Report</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <h3 className="text-lg font-medium col-span-2">Profit and Loss (P&L)</h3>
              <div>
                <label className="block text-gray-700">Revenue (£)</label>
                <input
                  type="number"
                  name="revenue"
                  value={formData.revenue}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter total revenue"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Cost of Goods Sold (£)</label>
                <input
                  type="number"
                  name="cogs"
                  value={formData.cogs}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter COGS"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Expenses (£)</label>
                <input
                  type="number"
                  name="expenses"
                  value={formData.expenses}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter total expenses"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Net Profit (£)</label>
                <input
                  type="number"
                  name="netProfit"
                  value={formData.netProfit}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter net profit"
                  required
                />
              </div>
              <h3 className="text-lg font-medium col-span-2 mt-4">Balance Sheet</h3>
              <div>
                <label className="block text-gray-700">Total Assets (£)</label>
                <input
                  type="number"
                  name="assets"
                  value={formData.assets}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter total assets"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Total Liabilities (£)</label>
                <input
                  type="number"
                  name="liabilities"
                  value={formData.liabilities}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter total liabilities"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Equity (£)</label>
                <input
                  type="number"
                  name="equity"
                  value={formData.equity}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter total equity"
                  required
                />
              </div>
              <h3 className="text-lg font-medium col-span-2 mt-4">VAT Return</h3>
              <div>
                <label className="block text-gray-700">Total Sales (£)</label>
                <input
                  type="number"
                  name="sales"
                  value={formData.sales}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter total sales"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Total Purchases (£)</label>
                <input
                  type="number"
                  name="purchases"
                  value={formData.purchases}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter total purchases"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">VAT Charged (Output Tax, £)</label>
                <input
                  type="number"
                  name="vatCharged"
                  value={formData.vatCharged}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter VAT charged"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">VAT Paid (Input Tax, £)</label>
                <input
                  type="number"
                  name="vatPaid"
                  value={formData.vatPaid}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter VAT paid"
                  required
                />
              </div>
              <h3 className="text-lg font-medium col-span-2 mt-4">Self Assessment</h3>
              <div>
                <label className="block text-gray-700">Total Income (£)</label>
                <input
                  type="number"
                  name="income"
                  value={formData.income}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter total income"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Expenses (£)</label>
                <input
                  type="number"
                  name="selfAssessmentExpenses"
                  value={formData.selfAssessmentExpenses}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter total expenses"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700">Allowances (£)</label>
                <input
                  type="number"
                  name="allowances"
                  value={formData.allowances}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded"
                  placeholder="Enter allowances (optional)"
                />
              </div>
              <button
                type="submit"
                className="col-span-2 w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
              >
                Submit to HMRC
              </button>
            </form>
            {submissionStatus && (
              <p className="mt-4 text-center text-gray-700">{submissionStatus}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
