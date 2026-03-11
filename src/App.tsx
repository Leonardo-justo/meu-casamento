import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Heart, Menu, X, Calendar, MapPin, Gift, Image as ImageIcon, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import ErrorBoundary from './components/ErrorBoundary';

// Pages
import Home from './pages/Home';
import Story from './pages/Story';
import Info from './pages/Info';
import RSVP from './pages/RSVP';
import Gifts from './pages/Gifts';
import Gallery from './pages/Gallery';
import PaymentStatusPage from './pages/PaymentStatus';
import Login from './pages/Admin/Login';
import Dashboard from './pages/Admin/Dashboard';
import AdminContent from './pages/Admin/Content';
import AdminGifts from './pages/Admin/Gifts';
import AdminRSVPs from './pages/Admin/RSVPs';
import AdminGallery from './pages/Admin/Gallery';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  const isAdminPath = location.pathname.startsWith('/admin');

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Nossa História', path: '/story' },
    { name: 'Informações', path: '/info' },
    { name: 'RSVP', path: '/rsvp' },
    { name: 'Lista de Presentes', path: '/gifts' },
    { name: 'Galeria', path: '/gallery' },
  ];

  const adminLinks = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Conteúdo', path: '/admin/content' },
    { name: 'Presentes', path: '/admin/gifts' },
    { name: 'Galeria', path: '/admin/gallery' },
    { name: 'RSVPs', path: '/admin/rsvps' },
  ];

  const links = isAdminPath && user ? adminLinks : navLinks;

  return (
    <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Heart className="text-rose-400 fill-rose-400" size={24} />
            <span className="text-2xl font-serif font-semibold tracking-wider text-stone-800">B & L</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-8 items-center">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium tracking-widest uppercase transition-colors hover:text-rose-400 ${
                  location.pathname === link.path ? 'text-rose-500' : 'text-stone-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
            {user && isAdminPath && (
              <button
                onClick={() => signOut(auth)}
                className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-800"
              >
                Sair
              </button>
            )}
            {!user && (
              <Link to="/admin/login" className="text-xs text-stone-300 hover:text-stone-500">
                Área do Casal
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-stone-600">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-b border-stone-100"
          >
            <div className="px-4 pt-2 pb-6 space-y-4">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="block text-lg font-serif text-stone-700 hover:text-rose-400"
                >
                  {link.name}
                </Link>
              ))}
              {user && isAdminPath && (
                <button
                  onClick={() => {
                    signOut(auth);
                    setIsOpen(false);
                  }}
                  className="block w-full text-left text-lg font-serif text-stone-400"
                >
                  Sair
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-stone-50 py-12 border-t border-stone-100">
    <div className="max-w-7xl mx-auto px-4 text-center">
      <div className="flex justify-center items-center space-x-2 mb-4">
        <Heart className="text-rose-300 fill-rose-300" size={16} />
        <span className="font-serif text-xl text-stone-600">B & L</span>
        <Heart className="text-rose-300 fill-rose-300" size={16} />
      </div>
      <p className="text-stone-400 text-sm font-light tracking-widest uppercase">
        Feito com amor para o nosso grande dia
      </p>
    </div>
  </footer>
);

export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow pt-20">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/story" element={<Story />} />
              <Route path="/info" element={<Info />} />
              <Route path="/rsvp" element={<RSVP />} />
              <Route path="/gifts" element={<Gifts />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/payment/:orderId" element={<PaymentStatusPage />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<Login />} />
              <Route path="/admin" element={<Dashboard />} />
              <Route path="/admin/content" element={<AdminContent />} />
              <Route path="/admin/gifts" element={<AdminGifts />} />
              <Route path="/admin/gallery" element={<AdminGallery />} />
              <Route path="/admin/rsvps" element={<AdminRSVPs />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </ErrorBoundary>
  );
}
