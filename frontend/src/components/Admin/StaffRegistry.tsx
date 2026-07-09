import { useState, useEffect, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, Edit2, X, ShieldCheck, CircleDot } from 'lucide-react';
import { employeeApi } from '../../api/employeeApi';
import  { type EmployeeProfile, type UpdateEmployeeInput } from 'shared/models';
import { EMPLOYMENT_STATUS, type EmploymentStatus } from 'shared/constants';
import { ApiError } from '../../api/apiError';
import { getClientErrorMessage } from '../../api/apiError';

export function StaffRegistry() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Error states
  const [employeeListError, setEmployeeListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const getFieldError = (field: string) => fieldErrors[field]?.[0];

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      setEmployeeListError(null);

      const data = await employeeApi.getEmployeeProfiles();
      setEmployees(data);
    } catch (error) {
      if (error instanceof Error) {
        setEmployeeListError(error.message);
      } else {
        setEmployeeListError('Failed to load employees.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: String(formData.get('fullName') || '').trim(),
      username: String(formData.get('username') || '').trim(),
      password: String(formData.get('password') || '').trim(),
      employeeCode: `EMP-${Date.now()}`,
      jobRole: String(formData.get('jobRole') || '').trim(),
      defaultShiftHours: '8.00',
      hourlyRate: String(formData.get('hourlyRate') || ''),

    };

    try {
      setIsSubmitting(true);
      setFormError(null);
      setFieldErrors({});

      await employeeApi.create(data);
      await fetchEmployees();
      setShowAddModal(false);
    } catch (err) {
      const fallbackMessage = 'Failed to create employee';
      const errorMessage = getClientErrorMessage(err, fallbackMessage);
      if (err instanceof ApiError) {
        const backendFieldErrors = err.errors?.fieldErrors || {};
        const hasFieldErrors = Object.keys(backendFieldErrors).length > 0;

        setFieldErrors(backendFieldErrors);

        if (hasFieldErrors) {
          setFormError(null);
          return;
        }
        const firstFormError = err.errors?.formErrors?.[0];

        setFormError(
          firstFormError || errorMessage
        );
        return;
      }
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEmployee) return;

    const formData = new FormData(e.currentTarget);

    const jobRole = String(formData.get('jobRole') || '').trim();
    const hourlyRate = String(formData.get('hourlyRate') || '0.00');
    const employmentStatus = formData.get('employmentStatus') as EmploymentStatus;

    const payload: UpdateEmployeeInput = {};

    if (jobRole !== editingEmployee.jobRole) {
      payload.jobRole = jobRole;
    }

    if (Number(hourlyRate) !== Number(editingEmployee.hourlyRate)) {
      payload.hourlyRate = hourlyRate;
    }

    if (employmentStatus !== editingEmployee.employmentStatus) {
      payload.employmentStatus = employmentStatus;
    }

    if (Object.keys(payload).length === 0) {
      setEditingEmployee(null);
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);
      setFieldErrors({});

      await employeeApi.update(editingEmployee.employeeId, payload);

      await fetchEmployees();
      setEditingEmployee(null);
    } catch (error) {
      const fallbackMessage = 'Failed to update employee';
      const errorMessage = getClientErrorMessage(error, fallbackMessage);

      if (error instanceof ApiError) {
        const backendFieldErrors = error.errors?.fieldErrors || {};
        const hasFieldErrors = Object.keys(backendFieldErrors).length > 0;

        setFieldErrors(backendFieldErrors);

        if (hasFieldErrors) {
          setFormError(null);
          return;
        }

        const firstFormError = error.errors?.formErrors?.[0];
        setFormError(firstFormError || errorMessage);
        return;
      }

      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => {
    const searchStr = searchTerm.toLowerCase();
    return (emp.fullName?.toLowerCase() || '').includes(searchStr) || 
           (emp.employeeCode?.toLowerCase() || '').includes(searchStr) ||
           (emp.jobRole?.toLowerCase() || '').includes(searchStr);
  });

  return (
    <div className="space-y-6 -mx-4">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            id="staff-search"
            aria-label="Search employees by name, code, or role"
            type="text"
            placeholder="Search by name, code, or role..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
        
        <button 
          onClick={() => {
            setFormError(null);
            setFieldErrors({});
            setShowAddModal(true)
          }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-[#4a6741] hover:bg-[#3a5233] text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all"
        >
          <Plus size={18} />
          Add New Employee
        </button>
      </div>
      {employeeListError && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {employeeListError}
        </div>
      )}

      {/* Main Table */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hourly Rate</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-[3px] border-[#4a6741] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-400 font-medium">Loading staff registry...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users size={24} className="text-gray-400" />
                    </div>
                    <p className="text-sm font-semibold text-gray-900">No employees found</p>
                    <p className="text-sm text-gray-500 mt-1">Try adjusting your search or add a new employee.</p>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => (
                  <tr key={emp.employeeId} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#4a6741]/10 text-[#4a6741] flex items-center justify-center font-bold text-sm shrink-0">
                          {emp.fullName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{emp.fullName}</p>
                          <p className="text-xs text-gray-500">@{emp.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{emp.jobRole}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900">₱{Number(emp.hourlyRate).toFixed(2)}</span>
                      <span className="text-xs text-gray-500 font-medium ml-1">/hr</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border
                        ${emp.employmentStatus === EMPLOYMENT_STATUS.ACTIVE 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                      >
                        <CircleDot size={10} className={emp.employmentStatus === EMPLOYMENT_STATUS.ACTIVE ? 'text-green-500 animate-pulse' : 'text-gray-400'} />
                        {emp.employmentStatus === EMPLOYMENT_STATUS.ACTIVE ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setFormError(null);
                            setFieldErrors({});
                            setEditingEmployee(emp)
                          }}
                          className="p-2 text-gray-400 hover:text-[#4a6741] hover:bg-[#4a6741]/10 rounded-lg transition-colors"
                          title="Edit Employee"
                          aria-label={`Edit ${emp.fullName}'s details`}
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ── ADD EMPLOYEE MODAL ── */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#4a6741]/10 text-[#4a6741] flex items-center justify-center">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Add New Employee</h3>
                    <p className="text-xs text-gray-500 font-medium">Create a new staff account</p>
                  </div>
                </div>
                <button 
                  title='Close add employee modal'
                  onClick={() => {
                    setShowAddModal(false);
                    setFormError(null);
                    setFieldErrors({});
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                  aria-label="Close add employee modal"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} noValidate className="p-6 space-y-5">
                {formError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {formError}
                  </div>
                )}
                <div>
                  <label htmlFor="fullName" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Full Name</label>
                  <input required name="fullName" type="text" id="fullName" placeholder="e.g. Maria Santos" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all" />
                  {getFieldError('fullName') && (
                    <p className="mt-1 text-xs font-medium text-red-600">
                      {getFieldError('fullName')}
                    </p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="username" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Username</label>
                    <input required name="username" type="text" id="username" placeholder="e.g. msantos" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all" />
                    {getFieldError('username') && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {getFieldError('username')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="add-password"
                      className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2"
                    >
                      Password
                    </label>
                    <input
                      required
                      name="password"
                      type="password"
                      id="add-password"
                      placeholder="min. 6 characters"
                      autoComplete="new-password"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all"
                    />
                    {getFieldError('password') && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {getFieldError('password')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="jobRole" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Job Role</label>
                    <input required name="jobRole" type="text" id="jobRole" placeholder="e.g. Barista" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all" />
                    {getFieldError('jobRole') && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {getFieldError('jobRole')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="hourlyRate" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Hourly Rate (₱)</label>
                    <input required name="hourlyRate" type="number" step="0.01" min="0" id="hourlyRate" placeholder="0.00" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all" />
                    {getFieldError('hourlyRate') && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {getFieldError('hourlyRate')}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => {
                    setFormError(null);
                    setFieldErrors({});
                    setShowAddModal(false);
                  }} 
                  className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm 
                  font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 bg-[#4a6741] hover:bg-[#3a5233] text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Create Employee'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── EDIT EMPLOYEE MODAL ── */}
      <AnimatePresence>
        {editingEmployee && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Edit2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Edit {editingEmployee.fullName}</h3>
                    <p className="text-xs text-gray-500 font-medium">Update staff details</p>
                  </div>
                </div>
                <button 
                  title='Close edit employee modal'
                  onClick={() => {
                    setFormError(null);
                    setFieldErrors({});
                    setEditingEmployee(null);
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} noValidate className="p-6 space-y-5">
                {formError && (
                  <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {formError}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-jobRole" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Job Role</label>
                    <input 
                    required
                    name="jobRole" 
                    type="text" 
                    id="edit-jobRole" 
                    defaultValue={editingEmployee.jobRole} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm 
                              text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 
                              focus:ring-[#4a6741]/20 outline-none transition-all" />
                    {getFieldError('jobRole') && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {getFieldError('jobRole')}
                      </p>
                    )}
                    
                  </div>
                  <div>
                    <label htmlFor="edit-hourlyRate" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Hourly Rate (₱)</label>
                    <input 
                    required 
                    name="hourlyRate" 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    id="edit-hourlyRate" 
                    defaultValue={Number(editingEmployee.hourlyRate)} 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl 
                    text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 
                    focus:ring-[#4a6741]/20 outline-none transition-all" />
                    {getFieldError('hourlyRate') && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {getFieldError('hourlyRate')}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="employmentStatus" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Employment Status</label>
                  <select name="employmentStatus" title='Employment Status' id="employmentStatus" defaultValue={editingEmployee.employmentStatus} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all">
                    <option value={EMPLOYMENT_STATUS.ACTIVE}>Active</option>
                    <option value={EMPLOYMENT_STATUS.INACTIVE}>Inactive</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => {
                    setFormError(null);
                    setFieldErrors({});
                    setEditingEmployee(null);
                  }} className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
