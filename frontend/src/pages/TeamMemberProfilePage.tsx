import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileCheck2,
  Eye,
  TrendingUp,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { usersApi, UserProfileResponse } from '../api/usersApi';
import { ReportStatus } from '../types/report';
import { useToast } from '../context/ToastContext';

export const TeamMemberProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const userId = id ? parseInt(id, 10) : null;

  const [profileData, setProfileData] = useState<UserProfileResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await usersApi.getUserProfile(userId);
        setProfileData(res);
      } catch (err: any) {
        showToast(err.response?.data?.message || 'Failed to load team member profile', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-4 rounded-2xl shadow-xl">
          <div className="w-6 h-6 border-3 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium">Loading employee profile...</span>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="p-12 text-center text-slate-400 space-y-4">
        <Users className="w-12 h-12 text-sky-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Employee Not Found</h2>
        <button
          type="button"
          onClick={() => navigate('/team')}
          className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 text-xs font-semibold hover:bg-slate-700"
        >
          Back to Team List
        </button>
      </div>
    );
  }

  const { user, stats, reports } = profileData;

  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Approved
          </span>
        );
      case 'needs_correction':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Needs Correction
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-semibold">
            <Clock className="w-3.5 h-3.5" />
            Submitted
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold">
            <FileCheck2 className="w-3.5 h-3.5" />
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl backdrop-blur-md sticky top-0 z-20 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/team')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-sky-500 to-emerald-500 text-slate-950 font-bold text-lg flex items-center justify-center shadow-md">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                {user.name}
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 capitalize">
                  {user.role.replace('_', ' ')}
                </span>
              </h1>
              <p className="text-xs text-slate-400 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {user.email}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">
            Joined: {formatDate(user.created_at)}
          </span>
        </div>
      </div>

      {/* Compliance Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Compliance Rate</p>
            <p className="text-3xl font-bold text-emerald-400 font-mono mt-1">{stats.complianceRate}%</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Submission timeliness</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Reports</p>
            <p className="text-3xl font-bold text-sky-400 font-mono mt-1">{stats.totalReports}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Lifetime reports created</p>
          </div>
          <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Approved Reports</p>
            <p className="text-3xl font-bold text-emerald-400 font-mono mt-1">{stats.approvedCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Fully approved & verified</p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Needs Correction</p>
            <p className="text-3xl font-bold text-amber-400 font-mono mt-1">{stats.needsCorrectionCount}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Correction cycles requested</p>
          </div>
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Employee Report History Table */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-white flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-400" />
          Weekly Report Submissions History
        </h3>

        <div className="border border-slate-800 rounded-2xl bg-slate-900/60 overflow-hidden shadow-xl">
          {reports.length === 0 ? (
            <div className="py-12 text-center text-slate-500 italic">
              No reports submitted by this employee yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4 w-[220px]">Week Date Range</th>
                    <th className="py-3.5 px-4 w-[180px]">Project / Tag</th>
                    <th className="py-3.5 px-4 w-[140px]">Status</th>
                    <th className="py-3.5 px-4 w-[110px]">Version</th>
                    <th className="py-3.5 px-4 w-[160px]">Last Updated</th>
                    <th className="py-3.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4 align-middle font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-sky-400 shrink-0" />
                          <span>
                            {formatDate(report.week_start_date)} – {formatDate(report.week_end_date)}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 align-middle">
                        {report.project ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: report.project.color_code || '#3B82F6' }}
                            />
                            {report.project.name}
                          </span>
                        ) : (
                          <span className="text-slate-500 italic">No Project Tag</span>
                        )}
                      </td>

                      <td className="p-4 align-middle">{getStatusBadge(report.status)}</td>

                      <td className="p-4 align-middle font-mono text-slate-400">
                        v{report.current_version}
                      </td>

                      <td className="p-4 align-middle text-slate-400 font-mono">
                        {formatDate(report.updated_at)}
                      </td>

                      <td className="p-4 align-middle text-right">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              report.status === 'submitted'
                                ? `/reports/${report.id}/review`
                                : `/reports/${report.id}`,
                            )
                          }
                          className="p-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 border border-transparent hover:border-sky-500/20 transition-all inline-flex items-center gap-1 text-xs font-medium"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
