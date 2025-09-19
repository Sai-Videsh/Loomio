import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { communitiesAPI } from '../services/api'

const AdminDashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [communities, setCommunities] = useState([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await communitiesAPI.getCommunities({ adminOnly: true })
        if (mounted) setCommunities(res.data)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="rounded-md bg-yellow-50 p-4 text-yellow-800">You need admin access to view this page.</div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Your Communities</h1>
        <p className="text-gray-600">Select a community to manage its members, tasks, attendance and more.</p>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : communities.length === 0 ? (
        <div className="rounded-md border p-6 bg-white">No communities yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {communities.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate(`/admin/communities/${c.id}`)}
              className="rounded-lg border bg-white p-5 text-left hover:shadow"
            >
              <div className="text-lg font-semibold">{c.name}</div>
              <div className="mt-1 text-sm text-gray-600">Code: {c.code}</div>
              <div className="mt-2 text-sm text-gray-500">Members: {c.member_count ?? '—'}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminDashboard


