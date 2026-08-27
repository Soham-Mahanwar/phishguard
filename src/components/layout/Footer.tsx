import React from 'react';

export function Footer({ onNavigate }: { onNavigate: (page: string) => void }) {
  return (
    <footer className="w-full bg-gray-900/80 backdrop-blur-md border-t border-gray-800 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
        <button onClick={() => onNavigate('landing')} className="text-gray-400 text-sm hover:text-primary transition-colors">
          &copy; {new Date().getFullYear()} KisanSetu. All rights reserved.
        </button>
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm mt-4 md:mt-0">
          <button onClick={() => onNavigate('guide')} className="text-gray-400 hover:text-primary transition-colors">
            User Guide
          </button>
          <button onClick={() => onNavigate('about')} className="text-gray-400 hover:text-primary transition-colors">
            About Us
          </button>
          <button onClick={() => onNavigate('contact')} className="text-gray-400 hover:text-primary transition-colors">
            Contact Us
          </button>
          <button onClick={() => onNavigate('feedback')} className="text-gray-400 hover:text-primary transition-colors">
            Feedback
          </button>
        </div>
      </div>
    </footer>
  );
}
