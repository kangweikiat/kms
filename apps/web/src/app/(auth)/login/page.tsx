import { login } from './actions'

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<{ message?: string }>
}) {
    const { message } = await searchParams

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
                <div className="mb-6 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Admin Login</h1>
                    <p className="text-sm text-gray-600 mt-2">Sign in to access the dashboard</p>
                </div>

                {message && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm text-center">
                        {message}
                    </div>
                )}

                <form action={login} className="flex flex-col gap-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            Email Address
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            defaultValue="admin@maria.my"
                            placeholder="admin@maria.my"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                            Password
                        </label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            defaultValue="P@ssw0rd!@#$"
                            placeholder="••••••••"
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    )
}
