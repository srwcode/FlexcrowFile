import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../config';
import { 
  Mail, 
  MapPin, 
  Phone, 
  Facebook, 
  Linkedin, 
  Instagram
} from 'lucide-react';

const Button = React.forwardRef<
  HTMLButtonElement, 
  React.ButtonHTMLAttributes<HTMLButtonElement> & { 
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link',
    size?: 'default' | 'sm' | 'lg' | 'icon',
    children: React.ReactNode
  }
>(({ 
  className = "", 
  variant = "default", 
  size = "default", 
  children, 
  ...props 
}, ref) => {
  
  const getVariantClasses = () => {
    switch(variant) {
      case "default":
        return "bg-flexcrow-600 hover:bg-flexcrow-700";
      case "destructive":
        return "bg-destructive text-white hover:bg-destructive/90";
      case "outline":
        return "border border-input bg-background hover:bg-accent hover:text-accent-foreground";
      case "secondary":
        return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
      case "ghost":
        return "hover:bg-accent hover:text-accent-foreground";
      case "link":
        return "text-primary underline-offset-4 hover:underline";
      default:
        return "bg-flexcrow-600 hover:bg-flexcrow-700";
    }
  };

  const getSizeClasses = () => {
    switch(size) {
      case "default":
        return "h-10 px-4 py-2";
      case "sm":
        return "h-9 rounded-md px-3";
      case "lg":
        return "h-11 rounded-md px-8";
      case "icon":
        return "h-10 w-10";
      default:
        return "h-10 px-4 py-2";
    }
  };

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus:outline-none disabled:pointer-events-none disabled:opacity-50 ${getVariantClasses()} ${getSizeClasses()} ${className}`}
      ref={ref}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

const Contact = () => {
  const navigate = useNavigate();

  const [userType, setUserType] = useState<string | null>(null);

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    
    if (authToken) {
      fetch(`${config.API_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'token': authToken || ''
        }
      })
        .then((response) => response.json())
        .then((data) => {
          setUserType(data.user_type);
        })
        .catch((error) => {
          console.error('Error fetching user type:', error);
          setUserType(null);
        });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flexcrowcontainer mx-auto flex items-center justify-between py-4">
          <div className="flex items-center">
            <div className="text-flexcrow-600 font-bold text-2xl cursor-pointer" onClick={() => navigate('/')}>
              <span>Flex</span>
              <span className="relative text-gray-500">
                crow
                <span className="absolute -top-0.5 right-0 w-2 h-2 bg-flexcrow-500 rounded-full"></span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {userType === "ADMIN" ? (
              <Button
                onClick={() => navigate('/admin')}
                variant="ghost" className="bg-flexcrow-600 hover:bg-flexcrow-700 text-white"
              >
                Go to Admin Dashboard
              </Button>
            ) : userType === "USER" ? (
              <Button
                onClick={() => navigate('/member')}
                variant="ghost" className="bg-flexcrow-600 hover:bg-flexcrow-700 text-white"
              >
                Go to Dashboard
              </Button>
            ) :
              <>
                <Button
                  onClick={() => navigate('/auth/signin')}
                  variant="ghost" className="border-2 border-transparent text-flexcrow-600 hover:border-flexcrow-600 hover:bg-gray-50"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate('/auth/signup')}
                  className="bg-flexcrow-600 hover:bg-flexcrow-700 text-white"
                >
                  Sign Up
                </Button>
              </>
            }
          </div>
        </div>
      </header>

      <section className="bg-[#f2f6f8] py-12">
        <div className="flexcrowcontainer mx-auto">
          <h1 className="text-4xl font-bold text-flexcrow-950 mb-4">Contact Us</h1>
          <p className="text-lg text-flexcrow-800 max-w-2xl mb-2">
            Have questions or need assistance? Our team is here to help! Get in touch with us using any of the methods below.
          </p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="flexcrowcontainer mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all border">
              <div className="bg-flexcrow-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-6 w-6 text-flexcrow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Email Us</h3>
              <p className="text-gray-600 mb-4">
                For general inquiries or support, feel free to reach out via email. We typically respond within 24 hours.
              </p>
              <a href="mailto:contact@flexcrow.com" className="text-flexcrow-600 font-medium hover:underline">
                contact@flexcrow.com
              </a>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all border">
              <div className="bg-flexcrow-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Phone className="h-6 w-6 text-flexcrow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Call Us</h3>
              <p className="text-gray-600 mb-4">
                Need to speak to someone directly? Our customer service team is available during business hours.
              </p>
              <a href="tel:+6623456789" className="text-flexcrow-600 font-medium hover:underline">
                +66 2 345 6789
              </a>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm hover:shadow-md transition-all border">
              <div className="bg-flexcrow-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6 text-flexcrow-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Visit Us</h3>
              <p className="text-gray-600 mb-4">
                Our office is located at King Mongkut's University of Technology Thonburi (KMUTT).
              </p>
              <a href="https://maps.app.goo.gl/yVqqFJQQ7dQ7pAAp9" target="_blank" className="text-flexcrow-600 font-medium hover:underline">
                126 Pracha Uthit Rd, Bang Mot, Thung Khru, Bangkok 10140, Thailand
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#f2f6f8]">
        <div className="flexcrowcontainer mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Connect With Us</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Follow us on social media to stay updated with the latest news, features, and promotions.
            </p>
          </div>
          
          <div className="flex justify-center space-x-8">
            <a href="#" rel="noopener noreferrer" className="flex flex-col items-center group">
              <div className="bg-flexcrow-100 p-5 rounded-full flex items-center justify-center mb-3 group-hover:bg-flexcrow-200 transition-all">
                <Facebook className="h-8 w-8 text-flexcrow-600" />
              </div>
              <span className="text-gray-700 group-hover:text-flexcrow-600 transition-all">Facebook</span>
            </a>

            <a href="#" rel="noopener noreferrer" className="flex flex-col items-center group">
              <div className="bg-flexcrow-100 p-5 rounded-full flex items-center justify-center mb-3 group-hover:bg-flexcrow-200 transition-all">
                <Instagram className="h-8 w-8 text-flexcrow-600" />
              </div>
              <span className="text-gray-700 group-hover:text-flexcrow-600 transition-all">Instagram</span>
            </a>

            <a href="#" rel="noopener noreferrer" className="flex flex-col items-center group">
              <div className="bg-flexcrow-100 p-5 rounded-full flex items-center justify-center mb-3 group-hover:bg-flexcrow-200 transition-all">
                <Linkedin className="h-8 w-8 text-flexcrow-600" />
              </div>
              <span className="text-gray-700 group-hover:text-flexcrow-600 transition-all">LinkedIn</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-flexcrow-950 text-white pt-16 pb-8">
        <div className="flexcrowcontainer mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="font-bold text-2xl mb-4">
                <span>Flex</span>
                <span className="relative">
                  crow
                  <span className="absolute -top-0.5 right-0 w-2 h-2 bg-white rounded-full"></span>
                </span>
              </div>
              <p className="text-gray-400 mb-4">Secure transactions made simple for everyone.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <Facebook className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Instagram className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Linkedin className="h-6 w-6" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Company</h3>
              <ul className="space-y-2">
                <li><a href="/about" className="text-gray-400 hover:text-white">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Careers</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Press</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white">Help Center</a></li>
                <li><a href="/contact" className="text-gray-400 hover:text-white">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">FAQ</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Security</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><a href="/terms" className="text-gray-400 hover:text-white">Terms of Service</a></li>
                <li><a href="/privacy" className="text-gray-400 hover:text-white">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Cookie Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-600 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm mb-4 md:mb-0">© 2024 Flexcrow. All rights reserved.</p>
              <div className="flex space-x-4">
                <a href="/terms" className="text-gray-400 hover:text-white text-sm">Terms of Service</a>
                <a href="/privacy" className="text-gray-400 hover:text-white text-sm">Privacy Policy</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;