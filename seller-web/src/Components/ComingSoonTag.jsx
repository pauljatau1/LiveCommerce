const ComingSoonTag = () => {
    return (
        <div className="absolute top-3 right-3">
            <div className="relative">
                {/* Background with gradient */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-full px-4 py-1.5 shadow-lg">
                    {/* Text with glow effect */}
                    <p className="text-white text-xs md:text-sm whitespace-nowrap font-medium tracking-wide animate-pulse">
                        Coming Soon
                    </p>
                </div>
                {/* Optional: Decorative dot */}
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full animate-ping" />
            </div>
        </div>
    );
};

export default ComingSoonTag;