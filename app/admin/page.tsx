"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Users, DollarSign, Plus, Loader2, ArrowLeft, Search } from "lucide-react";
import Link from "next/link";

interface AdminStats {
  totalUsers: number;
  totalRevenue: number;
}

interface UserData {
  _id: string;
  email: string;
  mobileNumber?: string;
  name?: string;
  availableCredits: number;
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [grantCreditsLoading, setGrantCreditsLoading] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchAdminData();
    }
  }, [status, router]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      const statsRes = await fetch("/api/admin/stats");
      if (!statsRes.ok) throw new Error("Failed to fetch stats. You may not be an admin.");
      const statsData = await statsRes.json();
      setStats(statsData);

      const usersRes = await fetch("/api/admin/users");
      if (!usersRes.ok) throw new Error("Failed to fetch users.");
      const usersData = await usersRes.json();
      setUsers(usersData.users);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGrantCredits = async (userId: string, amount: number) => {
    try {
      setGrantCreditsLoading(userId);
      const res = await fetch("/api/admin/users/grant-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, credits: amount }),
      });

      if (!res.ok) {
        throw new Error("Failed to grant credits");
      }

      const data = await res.json();
      
      // Update local state
      setUsers(users.map(u => u._id === userId ? { ...u, availableCredits: data.user.availableCredits } : u));
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGrantCreditsLoading(null);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center p-4">
        <div className="bg-red-950/30 border border-red-900/50 text-red-400 px-6 py-4 rounded-xl font-semibold mb-4 text-center max-w-md">
          {error}
        </div>
        <Link href="/" className="text-white hover:text-emerald-400 font-medium flex items-center gap-2">
          <ArrowLeft size={16} /> Return Home
        </Link>
      </div>
    );
  }

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      (user.name && user.name.toLowerCase().includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query)) ||
      (user.mobileNumber && user.mobileNumber.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-400 mt-1 text-sm font-medium">Manage users and view platform metrics</p>
          </div>
          <Link href="/" className="text-sm font-semibold bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
            <ArrowLeft size={16} /> Dashboard
          </Link>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#131b2c]/80 border border-slate-800/80 p-6 rounded-2xl flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-emerald-500" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-semibold">Total Revenue</p>
              <h2 className="text-3xl font-bold mt-1">₹{stats?.totalRevenue.toLocaleString() || 0}</h2>
            </div>
          </div>
          
          <div className="bg-[#131b2c]/80 border border-slate-800/80 p-6 rounded-2xl flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="w-7 h-7 text-blue-500" />
            </div>
            <div>
              <p className="text-slate-400 text-sm font-semibold">Total Users</p>
              <h2 className="text-3xl font-bold mt-1">{stats?.totalUsers || 0}</h2>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#131b2c]/80 border border-slate-800/80 rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold">User Management</h3>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900/50 border border-slate-700 text-sm rounded-lg block w-full sm:w-72 pl-9 p-2.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/50 text-slate-400 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Joined</th>
                  <th className="px-5 py-4">Credits</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4 font-medium text-white">{user.name || 'Unnamed'}</td>
                    <td className="px-5 py-4">
                      {user.email && <div>{user.email}</div>}
                      {user.mobileNumber && <div className="text-slate-500">{user.mobileNumber}</div>}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-bold text-xs border border-emerald-500/20">
                        {user.availableCredits}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => handleGrantCredits(user._id, 10)}
                        disabled={grantCreditsLoading === user._id}
                        className="inline-flex items-center gap-1.5 bg-white text-slate-900 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg font-bold text-xs transition-colors"
                      >
                        {grantCreditsLoading === user._id ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Plus size={14} />
                        )}
                        Grant 10 Credits
                      </button>
                    </td>
                  </tr>
                ))}
                
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                      {users.length === 0 ? "No users found." : "No users match your search query."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
