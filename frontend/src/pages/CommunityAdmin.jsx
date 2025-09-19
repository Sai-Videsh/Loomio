import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { communitiesAPI, usersAPI, tasksAPI, attendanceAPI, contributionsAPI } from '../services/api'

const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={
      `px-4 py-2 rounded-md border ${active ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 hover:bg-gray-50'}`
    }
  >
    {children}
  </button>
)

const CommunityAdmin = () => {
  const { user } = useAuth()
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('members')
  const [loading, setLoading] = useState(true)
  const [community, setCommunity] = useState(null)
  const [members, setMembers] = useState([])
  const [tasks, setTasks] = useState([])
  const [attendance, setAttendance] = useState([])
  const [contributions, setContributions] = useState([])

  useEffect(() => {
    let mounted = true
    const fetchAll = async () => {
      try {
        const [cRes, mRes, tRes, aRes, cnRes] = await Promise.all([
          communitiesAPI.getCommunity(id),
          communitiesAPI.getCommunityMembers(id),
          communitiesAPI.getCommunityTasks(id),
          attendanceAPI.getAttendance({ community_id: id }),
          contributionsAPI.getContributions({ community_id: id })
        ])
        if (!mounted) return
        const communityData = cRes.data?.data || cRes.data
        const membersData = mRes.data?.data || mRes.data
        const tasksData = tRes.data?.data || tRes.data
        const attendanceData = aRes.data?.data || aRes.data
        const contributionsData = cnRes.data?.data || cnRes.data

        // Flatten mock members if shaped as { user: {...} }
        const normalizedMembers = (membersData || []).map(m => ({
          id: m.id || m.user?.id,
          name: m.name || m.user?.name,
          email: m.email || m.user?.email,
          role: m.role || m.user?.role,
          is_active: m.is_active ?? true
        }))

        setCommunity(communityData)
        setMembers(normalizedMembers)
        setTasks(tasksData || [])
        setAttendance(attendanceData || [])
        setContributions(contributionsData || [])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetchAll()
    return () => { mounted = false }
  }, [id])

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="rounded-md bg-yellow-50 p-4 text-yellow-800">You need admin access to view this page.</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Community Admin</h1>
          <div className="text-gray-600">{community ? community.name : 'Loading...'}</div>
        </div>
        <Link to="/admin" className="text-primary-600 hover:text-primary-700">Back to Admin Dashboard</Link>
      </div>

      <div className="mb-4 flex gap-2">
        <TabButton active={activeTab === 'members'} onClick={() => setActiveTab('members')}>Members</TabButton>
        <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')}>Tasks</TabButton>
        <TabButton active={activeTab === 'attendance'} onClick={() => setActiveTab('attendance')}>Attendance</TabButton>
        <TabButton active={activeTab === 'contributions'} onClick={() => setActiveTab('contributions')}>Contributions</TabButton>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="rounded-lg border bg-white">
          {activeTab === 'members' && (
            <div className="p-4">
              <div className="overflow-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Role</th>
                      <th className="py-2 pr-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map(m => (
                      <tr key={m.id} className="border-t">
                        <td className="py-2 pr-4">{m.name}</td>
                        <td className="py-2 pr-4">{m.email}</td>
                        <td className="py-2 pr-4 capitalize">{m.role}</td>
                        <td className="py-2 pr-4">{m.is_active ? 'Active' : 'Inactive'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="p-4 space-y-3">
              {tasks.map(t => (
                <div key={t.id} className="rounded border p-4">
                  <div className="font-medium">{t.title}</div>
                  <div className="text-sm text-gray-600">Assigned to: {t.assigned_to_name ?? 'Unassigned'} • Status: {t.status}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="p-4 space-y-3">
              {attendance.map(a => (
                <div key={a.id} className="rounded border p-4">
                  <div className="font-medium">{a.user_name}</div>
                  <div className="text-sm text-gray-600">{a.date} • {a.status}</div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'contributions' && (
            <div className="p-4 space-y-3">
              {contributions.map(c => (
                <div key={c.id} className="rounded border p-4">
                  <div className="font-medium">{c.user_name}</div>
                  <div className="text-sm text-gray-600">{c.contribution_type} • {c.points} pts</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default CommunityAdmin


