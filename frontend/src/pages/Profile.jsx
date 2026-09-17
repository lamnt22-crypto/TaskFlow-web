import React, { useState, useContext, useEffect } from 'react';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import { getProfile, updateProfile, uploadAvatar } from '../services/userService';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { user, setUser, logout } = useContext(AuthContext);
  
  const [profile, setProfile] = useState({ username: '', email: '', theme_color: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = React.useRef(null);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile();
      setProfile({ 
        username: data.data.username, 
        email: data.data.email,
        theme_color: data.data.theme_color || ''
      });
      if (user && (user.username !== data.data.username || user.email !== data.data.email || user.theme_color !== data.data.theme_color || user.avatar_url !== data.data.avatar_url)) {
        setUser({ 
          ...user, 
          username: data.data.username, 
          email: data.data.email,
          theme_color: data.data.theme_color,
          avatar_url: data.data.avatar_url
        });
      }
    } catch (err) {
      console.error('Failed to load profile');
      setError('Could not load profile data from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    if (!profile.username.trim() || !profile.email.trim()) {
      setError('Username and email are required.');
      return;
    }
    
    setSaving(true);
    try {
      const result = await updateProfile(profile);
      setSuccess(true);
      setUser({ ...user, username: result.data.username, email: result.data.email, theme_color: result.data.theme_color });
      toast.success('Profile updated successfully.');
    } catch (err) {
      if (err.response && err.response.status === 409) {
        setError(err.response.data.message || 'Username or email already exists.');
        toast.error(err.response.data.message || 'Username or email already exists.');
      } else if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
        toast.error(err.response.data.message);
      } else {
        setError('Failed to update profile. Please try again.');
        toast.error('Failed to update profile.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setUploadingAvatar(true);
    try {
      const result = await uploadAvatar(formData);
      setUser({ ...user, avatar_url: result.data.avatar_url });
      toast.success('Avatar updated successfully!');
    } catch (err) {
      toast.error('Failed to upload avatar.');
      console.error(err);
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Account Settings</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your profile, preferences, and security settings.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Sidebar Navigation */}
          <div className="w-full md:w-64 shrink-0">
            <nav className="flex flex-col gap-1">
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-semibold transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                Public Profile
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 font-medium transition-colors opacity-60 cursor-not-allowed">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Security
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 font-medium transition-colors opacity-60 cursor-not-allowed">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                Notifications
              </a>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 w-full space-y-6">
            
            {/* Profile Settings Card */}
            <div className="bg-white dark:bg-[#121212] rounded-2xl border border-slate-200 dark:border-white/10 shadow-sm overflow-hidden">
               <div className="px-6 py-5 border-b border-slate-200 dark:border-white/10">
                 <h2 className="text-lg font-bold text-slate-900 dark:text-white">Profile Information</h2>
                 <p className="text-sm text-slate-500 dark:text-slate-400">Update your account's profile information and email address.</p>
               </div>
               
               <div className="p-6 md:p-8">
                 
                 {error && (
                  <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 rounded-xl text-sm font-semibold flex items-center gap-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {error}
                  </div>
                 )}

                 {success && (
                  <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl text-sm font-semibold flex items-center gap-3">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Profile updated successfully.
                  </div>
                 )}

                 {/* Avatar Section - Inline & Clean */}
                 <div className="flex items-center gap-6 mb-8">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-full border-2 border-slate-200 dark:border-zinc-700 overflow-hidden bg-slate-100 dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                            {user?.avatar_url ? (
                              <img src={`http://localhost:5000${user.avatar_url}`} alt={profile.username} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-3xl font-bold text-slate-400">{getInitials(profile.username)}</span>
                            )}
                        </div>
                        <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity rounded-full">
                          <span className="text-xs font-bold">{uploadingAvatar ? '...' : 'Change'}</span>
                          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                        </label>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">{profile.username}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{profile.email}</p>
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                      >
                        {uploadingAvatar ? 'Uploading...' : 'Upload new avatar'}
                      </button>
                    </div>
                 </div>

                 {/* Form Fields */}
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Username</label>
                        <input type="text" name="username" value={profile.username} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                        <input type="email" name="email" value={profile.email} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-sm" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Workspace Theme Color</label>
                      <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-white/10 rounded-xl w-fit shadow-sm">
                        <div className="relative">
                          <input type="color" name="theme_color" value={profile.theme_color || '#4f46e5'} onChange={handleChange} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0 absolute inset-0 opacity-0 z-10" />
                          <div className="w-10 h-10 rounded-lg shadow-sm border border-slate-200 dark:border-zinc-700" style={{ backgroundColor: profile.theme_color || '#4f46e5' }}></div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900 dark:text-white uppercase">{profile.theme_color || 'Default'}</div>
                        </div>
                        {profile.theme_color && (
                          <button type="button" onClick={() => setProfile(prev => ({ ...prev, theme_color: '' }))} className="ml-4 text-xs font-bold text-red-600 hover:text-red-700 px-2 py-1 rounded bg-red-50 dark:bg-red-500/10 transition-colors">Reset</button>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-3">
                      <button type="button" onClick={fetchProfile} className="px-5 py-2 rounded-xl text-sm font-bold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">Cancel</button>
                      <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl text-sm font-bold bg-slate-900 dark:bg-white text-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200 shadow-md transition-colors disabled:opacity-50">Save Changes</button>
                    </div>
                 </form>
               </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-white dark:bg-[#121212] rounded-2xl border border-red-200 dark:border-red-900/30 shadow-sm overflow-hidden">
               <div className="px-6 py-5 border-b border-red-100 dark:border-red-900/20 flex items-center gap-2">
                 <svg className="w-5 h-5 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 <h2 className="text-lg font-bold text-red-600 dark:text-red-500">Danger Zone</h2>
               </div>
               
               <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-center justify-between">
                 <div>
                   <h4 className="text-base font-bold text-slate-900 dark:text-white">Sign Out of Device</h4>
                   <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">End your current session on this device. You will need to log back in.</p>
                 </div>
                 <button onClick={logout} className="shrink-0 w-full md:w-auto px-5 py-2.5 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 transition-colors">Sign Out Now</button>
               </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
