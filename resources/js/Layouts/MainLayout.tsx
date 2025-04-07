import React from "react";
import Header from "./Header";
import Footer from "./Footer";

interface MainLayoutProps {
    children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-gray-300 relative">
            {/* Фоновая текстура */}
            <div className="absolute inset-0 bg-[url('/images/parchment-texture.png')] opacity-5 bg-repeat z-0 pointer-events-none"></div>
            <Header />
            <main className="flex-grow relative z-10">{children}</main>
            <Footer />
        </div>
    );
};

export default MainLayout;
