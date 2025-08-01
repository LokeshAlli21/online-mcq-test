const LoadingScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center space-y-8">
            {/* Modern animated loader */}
            <div className="relative">
                <div className="w-16 h-16 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mx-auto"></div>
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-emerald-300 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>

            {/* Modern typography with animations */}
            <div className="space-y-3">
                <h2 className="text-2xl font-bold text-slate-800 animate-pulse">
                    Just a moment
                </h2>
                <p className="text-slate-600 max-w-sm mx-auto leading-relaxed">
                    We're preparing your experience...
                </p>
            </div>

            {/* Progress dots animation */}
            <div className="flex justify-center space-x-2">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                        style={{ 
                            animationDelay: `${i * 0.2}s`,
                            animationDuration: '0.8s'
                        }}
                    />
                ))}
            </div>
        </div>

        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, #10b981 0%, transparent 50%),
                                radial-gradient(circle at 75% 75%, #3b82f6 0%, transparent 50%)`,
                backgroundSize: '100px 100px'
            }} />
        </div>
    </div>
);

export default LoadingScreen;