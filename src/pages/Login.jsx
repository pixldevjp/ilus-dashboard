function Login() {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center">
      <div className="mb-8 text-center">
        
        <img src="https://pinadesign.jp/FNSC/FNSC_logo_512.png" className="w-64 h-64 mx-auto mb-4"/>
        <h1 className="text-4xl font-bold text-white tracking-widest uppercase">FNSC</h1>
        <p className="text-cyan-400 tracking-widest text-sm mt-2">Free Navy Star Citizen</p>
      </div>
      <a
        href="https://ilus.app/auth/discord"
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-8 py-3 rounded-lg tracking-wide transition-colors"
      >
        Login with Discord
      </a>
    </div>
  )
}

export default Login