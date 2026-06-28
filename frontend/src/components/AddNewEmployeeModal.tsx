import { useState } from 'react';
import { API_BASE_URL } from 'shared/constants';
import { apiFetch } from '../api/apiFetch';

export const AddNewEmployeeModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Head Barista');
  const [defaultShift, setDefaultShift] = useState<number>(8);
  const [hourlyRate, setHourlyRate] = useState<number>(70);
  // Removed unused status state

  const dailyPay = defaultShift * hourlyRate;
  const estMonthly = dailyPay * 26; // Assuming 26 working days in a month

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddEmployee = async () => {
    setIsLoading(true);
    setError(null);
    
    // The backend expects specific fields according to RegisterEmployeeInput
    const payload = {
      username,
      password,
      fullName,
      employeeCode: 'EMP-' + Date.now().toString().slice(-6), // Auto-generate
      jobRole: role,
      defaultShiftHours: String(defaultShift),
      hourlyRate: String(hourlyRate),
    };

    try {
      const response = await apiFetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add employee');
      }

      console.log('Employee successfully added!');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open bg-black/40 backdrop-blur-sm">
      <div className="modal-box max-w-lg bg-white text-base-content rounded-2xl shadow-xl">
        <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4">✕</button>
        <h3 className="font-bold text-2xl mb-6 text-neutral-800">Add New Employee</h3>

        <div className="space-y-6">
          {/* Authentication Group */}
          <div className="bg-[#faf9f8] p-4 rounded-xl border border-neutral-200 space-y-4">
            <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">Account Credentials</h4>
            <div>
              <label className="label py-1">
                <span className="label-text font-medium text-neutral-700">Username <span className="text-[#c66a46]">*</span></span>
              </label>
              <input
                type="text"
                placeholder="e.g. mariasantos123"
                className="input input-bordered border-neutral-300 w-full bg-white text-neutral-800 placeholder:text-neutral-400 focus:border-[#b2beaf] focus:outline-none rounded-xl"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="label py-1">
                <span className="label-text font-medium text-neutral-700">Password <span className="text-[#c66a46]">*</span></span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="input input-bordered border-neutral-300 w-full bg-white text-neutral-800 placeholder:text-neutral-400 focus:border-[#b2beaf] focus:outline-none rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Operational & Payroll Group */}
          <div className="space-y-4">
            <div>
              <label className="label py-1">
                <span className="label-text font-medium text-neutral-700">Full Name <span className="text-[#c66a46]">*</span></span>
              </label>
              <input
                type="text"
                placeholder="e.g. Maria Santos"
                className="input input-bordered border-neutral-300 w-full bg-white text-neutral-800 placeholder:text-neutral-400 focus:border-[#b2beaf] focus:outline-none rounded-xl"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="label py-1">
                <span className="label-text font-medium text-neutral-700">Role / Position</span>
              </label>
              <select
                title="Select a role"
                className="select select-bordered border-neutral-300 w-full bg-white text-neutral-800 focus:border-[#b2beaf] focus:outline-none rounded-xl"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option>Head Barista</option>
                <option>Kitchen Staff</option>
                <option>Cashier</option>
                <option>Server</option>
                <option>Barista</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label py-1">
                  <span className="label-text font-medium text-neutral-700">Default Shift (hours)</span>
                </label>
                <input
                  type="number"
                  title="Default Shift"
                  className="input input-bordered border-neutral-300 w-full bg-white text-neutral-800 placeholder:text-neutral-400 focus:border-[#b2beaf] focus:outline-none rounded-xl"
                  value={defaultShift}
                  onChange={(e) => setDefaultShift(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="label py-1">
                  <span className="label-text font-medium text-neutral-700">Hourly Rate (₱)</span>
                </label>
                <input
                  title="Hourly Rate"
                  type="number"
                  className="input input-bordered border-neutral-300 w-full bg-white text-neutral-800 placeholder:text-neutral-400 focus:border-[#b2beaf] focus:outline-none rounded-xl"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                />
              </div>
            </div>
            
            {/* Live Calculations Box */}
            <div className="bg-[#eaf1e7] p-4 rounded-xl border border-[#d6e5d1]">
              <p className="font-medium text-[15px] text-[#4b6144]">
                Daily pay: <span className="font-bold">₱{dailyPay.toFixed(2)}</span>{' '}
                <span className="text-[#7d9376] ml-1 font-normal">
                  ({defaultShift}h × ₱{hourlyRate}/hr)
                </span>
              </p>
              <p className="text-sm text-[#7d9376] mt-0.5">Est. monthly: ₱{estMonthly.toFixed(2)}</p>
            </div>

            {/* Status */}
            <div>
              <label className="label py-1">
                <span className="label-text font-medium text-neutral-700">Status</span>
              </label>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f1faef] text-[#3f6d33] border border-[#d3ecd0] rounded-full text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Active
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-3 flex-col">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm mb-2">
              {error}
            </div>
          )}
          <div className="flex gap-3 w-full">
            <button 
              className="btn flex-1 bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 font-medium h-12 rounded-xl" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              className="btn flex-1 border-none text-white hover:brightness-95 font-medium h-12 rounded-xl shadow-sm" 
              style={{ backgroundColor: '#b2beaf' }} 
              onClick={handleAddEmployee}
              disabled={isLoading}
            >
              {isLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Add Employee'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
