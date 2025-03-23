import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../config';
import { 
  ChevronRight, 
  Users, 
  Target, 
  Trophy,
  Clock,
  Rocket,
  Heart,
  BadgeCheck,
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

const AboutUs = () => {
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

      <div className="bg-[#f2f6f8] py-16">
        <div className="flexcrowcontainer mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-flexcrow-950 mb-6">About Flexcrow</h1>
            <p className="text-lg text-flexcrow-800 mb-8">
              We're on a mission to make online transactions safer and easier for everyone.
            </p>
            <div className="flex justify-center gap-4">
              <Button 
                onClick={() => navigate('/auth/signup')} 
                size="lg" 
                className="bg-flexcrow-600 hover:bg-flexcrow-700 text-white"
              >
                Get Started
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button 
                onClick={() => navigate('/contact')} 
                size="lg" 
                variant="outline" 
                className="border-flexcrow-600 text-flexcrow-600 hover:bg-gray-200"
              >
                Contact Us
              </Button>
            </div>
          </div>
        </div>
      </div>

      <section className="py-16 bg-white">
        <div className="flexcrowcontainer mx-auto">
          <div className="flex flex-col lg:flex-row gap-14 items-start">
            <div className="lg:w-1/2">
              <h2 className="text-3xl font-bold text-flexcrow-950 mb-6">Our Story</h2>
              <div className="space-y-4 text-flexcrow-800">
                <p>
                  Flexcrow was founded in 2025 by <b>ACS student</b> who experienced firsthand the challenges and risks of online transactions.
                </p>
                <p>
                  We set out to create a platform that would eliminate the trust barrier in online transactions, allowing people to buy and sell with confidence, regardless of whether they're dealing with someone across the street or across the world.
                </p>
                <p>
                  Today, Flexcrow serves thousands of users worldwide, protecting millions in transaction value every month. Our team has grown to include experts in cybersecurity, payment processing, customer service, and dispute resolution.
                </p>
              </div>
            </div>
            <div className="lg:w-1/2 mx-auto">
              <div className="bg-[#f2f6f8] p-8 rounded-lg border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <h3 className="text-4xl font-bold text-flexcrow-600 mb-2">5,000+</h3>
                    <p className="text-flexcrow-800">Satisfied Users</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <h3 className="text-4xl font-bold text-flexcrow-600 mb-2">฿100K+</h3>
                    <p className="text-flexcrow-800">Transaction Volume</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <h3 className="text-4xl font-bold text-flexcrow-600 mb-2">98%</h3>
                    <p className="text-flexcrow-800">Success Rate</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <h3 className="text-4xl font-bold text-flexcrow-600 mb-2">24/7</h3>
                    <p className="text-flexcrow-800">Customer Support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#f9fbfb]">
        <div className="flexcrowcontainer mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-flexcrow-950 mb-4">Our Mission & Values</h2>
            <p className="text-lg text-flexcrow-800 max-w-2xl mx-auto">
              At Flexcrow, we're guided by a set of core principles that drive everything we do.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="bg-flexcrow-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-flexcrow-600" />
              </div>
              <h3 className="text-xl font-semibold text-flexcrow-950 mb-3">Our Mission</h3>
              <p className="text-flexcrow-800">
                To create a world where online transactions are as safe and secure as face-to-face exchanges, empowering people to do business with confidence.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="bg-flexcrow-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Trophy className="h-6 w-6 text-flexcrow-600" />
              </div>
              <h3 className="text-xl font-semibold text-flexcrow-950 mb-3">Our Vision</h3>
              <p className="text-flexcrow-800">
                To become the global standard for secure online transactions, removing the last barrier to global commerce: trust.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-all">
              <div className="bg-flexcrow-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-flexcrow-600" />
              </div>
              <h3 className="text-xl font-semibold text-flexcrow-950 mb-3">Our Team</h3>
              <p className="text-flexcrow-800">
                A diverse group of experts united by a passion for building products that solve real problems and make people's lives better.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="flexcrowcontainer mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-flexcrow-950 mb-4">Our Core Values</h2>
            <p className="text-lg text-flexcrow-800 max-w-2xl mx-auto">
              These principles guide our decisions and shape our company culture.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: BadgeCheck,
                title: "Trust & Transparency",
                desc: "We believe in being completely transparent with our users and earning their trust through consistent reliability."
              },
              {
                icon: Rocket,
                title: "Innovation",
                desc: "We're constantly looking for new ways to improve our service and stay ahead of emerging security threats."
              },
              {
                icon: Heart,
                title: "User-Centered",
                desc: "Every decision we make is guided by what's best for our users, their needs, and their security."
              },
              {
                icon: Clock,
                title: "Reliability",
                desc: "We understand that our users depend on us for their livelihoods, which is why we're committed to 99.9% uptime."
              }
            ].map((value, index) => (
              <div key={index} className="flex gap-4 p-6 bg-[#f9fbfb] rounded-lg border border-gray-100">
                <div className="bg-flexcrow-100 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                  <value.icon className="h-6 w-6 text-flexcrow-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-flexcrow-950 mb-2">{value.title}</h3>
                  <p className="text-flexcrow-800">{value.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#f2f6f8]">
        <div className="flexcrowcontainer mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-flexcrow-950 mb-6">Join Our Team</h2>
            <p className="text-lg text-flexcrow-800 mb-8">
              We're always looking for talented individuals who share our passion for creating a safer digital economy.
            </p>
            <Button
              size="lg" 
              className="bg-flexcrow-600 hover:bg-flexcrow-700 text-white"
            >
              View Open Positions
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
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

export default AboutUs;