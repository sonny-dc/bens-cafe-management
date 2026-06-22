import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, Edit2, Trash2, X, CircleDot, UserPlus } from 'lucide-react';
import { employeeApi, type EmployeeProfile } from '../../api/employeeApi';

export function StaffRegistry() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeProfile | null>(null);

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const data = await employeeApi.getAll();
      setEmployees(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      fullName: formData.get('fullName'),
      username: formData.get('username'),
      jobRole: formData.get('jobRole'),
      hourlyRate: Number(formData.get('hourlyRate')),
    };

    try {
      setIsSubmitting(true);
      await employeeApi.create(data);
      await fetchEmployees();
      setShowAddModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to add employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEmployee) return;
    
    const formData = new FormData(e.currentTarget);
    const jobRole = formData.get('jobRole') as string;
    const hourlyRate = Number(formData.get('hourlyRate'));
    const status = formData.get('employmentStatus') as 'active' | 'inactive';

    try {
      setIsSubmitting(true);
      if (jobRole !== editingEmployee.jobRole) {
        await employeeApi.updateRole(editingEmployee.employeeId, jobRole);
      }
      if (hourlyRate !== Number(editingEmployee.hourlyRate)) {
        await employeeApi.updateHourlyRate(editingEmployee.employeeId, hourlyRate);
      }
      if (status !== editingEmployee.employmentStatus) {
        await employeeApi.updateStatus(editingEmployee.employeeId, status);
      }
      
      await fetchEmployees();
      setEditingEmployee(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEmployee) return;
    try {
      setIsSubmitting(true);
      await employeeApi.delete(deletingEmployee.employeeId);
      await fetchEmployees();
      setDeletingEmployee(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete employee');
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
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div className="relative w-full sm:w-96">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, code, or role..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-2 focus:ring-[#4a6741]/20 outline-none transition-all placeholder:text-gray-400"
          />
        </div>
        
        <button 
          onClick={() => setShowAddModal(true)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-[#4a6741] hover:bg-[#3a5233] text-white text-sm font-bold rounded-xl shadow-sm hover:shadow transition-all"
        >
          <Plus size={18} />
          Add New Employee
        </button>
      </div>

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
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Hourly Rate</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-[3px] border-[#4a6741] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-400 font-medium">Loading staff registry...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
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
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium border border-gray-200 font-mono">
                        {emp.employeeCode}
                      </span>
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
                        ${emp.employmentStatus === 'active' 
                          ? 'bg-green-50 text-green-700 border-green-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-200'}`}
                      >
                        <CircleDot size={10} className={emp.employmentStatus === 'active' ? 'text-green-500 animate-pulse' : 'text-gray-400'} />
                        {emp.employmentStatus === 'active' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => setEditingEmployee(emp)}
                          className="p-2 text-gray-400 hover:text-[#4a6741] hover:bg-[#4a6741]/10 rounded-lg transition-colors"
                          title="Edit Employee"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => setDeletingEmployee(emp)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Employee"
                        >
                          <Trash2 size={16} />
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
                    <UserPlus size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">Add New Employee</h3>
                    <p className="text-xs text-gray-500 font-medium">Create a new staff account</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleAddSubmit} className="p-7 space-y-6">
                
                {/* Personal Section */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-3">Personal Details</h4>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                    <input required name="fullName" type="text" placeholder="e.g. Maria Santos" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-4 focus:ring-[#4a6741]/10 outline-none transition-all placeholder:text-gray-400" />
                  </div>
                </div>
                
                {/* Account Section */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-3">Account Setup</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                      <input required name="username" type="text" placeholder="msantos" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-4 focus:ring-[#4a6741]/10 outline-none transition-all placeholder:text-gray-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Default Password</label>
                      <input disabled type="text" value="password123" className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 font-mono outline-none cursor-not-allowed" />
                    </div>
                  </div>
                </div>

                {/* Employment Section */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-3">Employment Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Job Role</label>
                      <input required name="jobRole" type="text" placeholder="e.g. Barista" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-4 focus:ring-[#4a6741]/10 outline-none transition-all placeholder:text-gray-400" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hourly Rate (₱)</label>
                      <input required name="hourlyRate" type="number" step="0.01" min="0" placeholder="0.00" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-[#4a6741] focus:ring-4 focus:ring-[#4a6741]/10 outline-none transition-all placeholder:text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3.5 bg-[#4a6741] hover:bg-[#3a5233] text-white text-sm font-bold rounded-xl shadow-md shadow-[#4a6741]/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
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
                  onClick={() => setEditingEmployee(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-7 space-y-6">
                
                {/* Employment Details */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-3">Update Role & Pay</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Job Role</label>
                      <input required name="jobRole" type="text" defaultValue={editingEmployee.jobRole} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Hourly Rate (₱)</label>
                      <input required name="hourlyRate" type="number" step="0.01" min="0" defaultValue={Number(editingEmployee.hourlyRate)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all" />
                    </div>
                  </div>
                </div>

                {/* Account Status */}
                <div className="space-y-4">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest border-b pb-2 mb-3">Account Status</h4>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Employment Status</label>
                    <select name="employmentStatus" defaultValue={editingEmployee.employmentStatus} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-black focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all appearance-none cursor-pointer"
                      style={{ backgroundImage: 'url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")', backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}>
                      <option value="active">Active (Can log in)</option>
                      <option value="inactive">Inactive (Account suspended)</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 flex gap-3">
                  <button type="button" onClick={() => setEditingEmployee(null)} className="flex-1 px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {deletingEmployee && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[20px] shadow-xl w-full max-w-[320px] p-6"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1.5 tracking-tight">Delete Employee?</h3>
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Are you sure you want to completely remove <strong>{deletingEmployee.fullName}</strong>? This action cannot be undone.
              </p>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Yes, Delete'}
                </button>
                <button 
                  onClick={() => setDeletingEmployee(null)}
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-transparent hover:bg-gray-50 text-gray-600 text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
