import { Link, useNavigate } from 'react-router-dom'

const Start = () => {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-primary-100">
            <svg className="h-10 w-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3m6 0a3 3 0 00-3-3m0 6a3 3 0 003-3m-6 0a3 3 0 003 3m-9 5a9 9 0 1118 0H3z" />
            </svg>
          </div>
          <h1 className="mt-6 text-3xl font-extrabold text-gray-900">Welcome to Loomio</h1>
          <p className="mt-2 text-gray-600">Choose how you want to get started</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/register')}
            className="p-6 rounded-lg border bg-white hover:shadow focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <div className="text-lg font-semibold">Create account</div>
            <p className="mt-1 text-sm text-gray-600">Join an existing community</p>
          </button>

          <Link
            to={{ pathname: '/login', search: '?role=admin' }}
            className="p-6 rounded-lg border bg-white hover:shadow focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <div className="text-lg font-semibold">Login as Admin</div>
            <p className="mt-1 text-sm text-gray-600">Manage your communities</p>
          </Link>

          <Link
            to={{ pathname: '/login', search: '?role=user' }}
            className="p-6 rounded-lg border bg-white hover:shadow focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <div className="text-lg font-semibold">Login as User</div>
            <p className="mt-1 text-sm text-gray-600">Access your dashboard</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Start


