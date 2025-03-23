import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '../../config';

import { 
  Shield, 
  Search, 
  UserCheck, 
  Clock, 
  ChevronRight, 
  Star, 
  ArrowRight,
  CreditCard,
  Eye,
  CheckCircle2,
  ChevronDown,
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

const Accordion = ({ 
  children, 
  type = "single", 
  className = "",
  ...props 
}: { 
  children: React.ReactNode, 
  type?: "single" | "multiple", 
  className?: string,
  [key: string]: any 
}) => {
  const items = React.Children.toArray(children);
  
  return (
    <div className={className} {...props}>
      {items.map((child, index) => 
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<{ isLastItem?: boolean }>, {
              isLastItem: index === items.length - 1
            })
          : child
      )}
    </div>
  );
};

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

const AccordionItem = React.forwardRef<
  HTMLDivElement,
  AccordionItemProps & { isLastItem?: boolean }
>(({ children, className = "", isLastItem, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`${isLastItem ? "" : "border-b"} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, className = "", ...props }, ref) => {
  return (
    <div className="flex">
      <button
        ref={ref}
        className={`flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline ${className}`}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" data-state={props['aria-expanded'] ? 'open' : 'closed'} style={{ transform: props['aria-expanded'] ? 'rotate(180deg)' : 'rotate(0deg)' }} />
      </button>
    </div>
  );
});

AccordionTrigger.displayName = "AccordionTrigger";

interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen?: boolean;
}

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  AccordionContentProps
>(({ children, className = "", isOpen, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`overflow-hidden text-sm transition-all ${isOpen ? 'animate-accordion-down' : 'animate-accordion-up'} ${isOpen ? 'max-h-screen' : 'max-h-0'}`}
      {...props}
    >
      <div className={`pb-4 pt-0 ${className}`}>
        {children}
      </div>
    </div>
  );
});

AccordionContent.displayName = "AccordionContent";

const Index = () => {
  const [openAccordion, setOpenAccordion] = useState<string | null>('');
  const navigate = useNavigate();
  const handleLearnMore = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleAccordion = (value: string) => {
    setOpenAccordion(openAccordion === value ? null : value);
  };

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

      <section className="section-padding bg-[#f2f6f8]">
        <div className="flexcrowcontainer mx-auto">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="lg:w-1/2 space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-flexcrow-950 leading-tight">
                Secure Transactions <br/>
                <p className="text-flexcrow-600 mt-4">Made Simple</p>
              </h1>
              <p className="text-lg text-flexcrow-800 max-w-md">
                Flexcrow protects both buyers and sellers by holding funds until all conditions are met. No more risky transactions.
              </p>
              <div className="flex gap-4 pt-4">
                <Button onClick={() => navigate('/auth/signup')} size="lg" className="bg-flexcrow-600 hover:bg-flexcrow-700 text-white">
                  Get Started
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button onClick={handleLearnMore} size="lg" variant="outline" className="border-flexcrow-600 text-flexcrow-600 hover:bg-gray-200">
                  Learn More
                </Button>
              </div>
              <div className="flex items-center gap-2 mutedforeground">
                <CheckCircle2 className="h-5 w-5 text-flexcrow-500" />
                <span>Minimum amount ฿10</span>
              </div>
            </div>
            <div className="hidden lg:block lg:w-1/2 relative">
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-md mx-auto relative z-10 animate-float">
                <div className="absolute -top-4 -left-4 bg-flexcrow-100 rounded-lg w-full h-full z-0"></div>
                <div className="absolute top-0 left-0 bg-white rounded-lg w-full h-full border border-flexcrow-200 z-10"></div>
                <div className="relative z-20">
                  <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-2">
                      <div className="bg-flexcrow-100 p-2 rounded-full">
                        <CreditCard className="h-6 w-6 text-flexcrow-600" />
                      </div>
                      <div>
                        <p className="text-sm mutedforeground">Transaction ID</p>
                        <p className="font-medium text-gray-900">#FC-2025-1234</p>
                      </div>
                    </div>
                    <div className="bg-green-100 px-3 py-1 rounded-full">
                      <p className="text-sm text-green-700 font-medium">Protected</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <p className="mutedforeground">Buyer:</p>
                      <p className="font-medium text-gray-900">Wittawin Susutti</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="mutedforeground">Seller:</p>
                      <p className="font-medium text-gray-900">Warin Wattanapornprom</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="mutedforeground">Product:</p>
                      <p className="font-medium text-gray-900">Model</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="mutedforeground">Amount:</p>
                      <p className="font-bold text-lg text-gray-900">฿2,500,000.00</p>
                    </div>
                    <div className="border-t pt-4 mt-4">
                      <div className="flex justify-between items-center">
                        <p className="mutedforeground">Status:</p>
                        <div className="bg-blue-100 px-3 py-1 rounded-full">
                          <p className="text-sm text-blue-700 font-medium">In Progress</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-[#f9fbfb]" id="how-it-works">
        <div className="flexcrowcontainer mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How Flexcrow Works</h2>
            <p className="mutedforeground max-w-2xl mx-auto">Our simple 4-step process ensures safe and secure transactions between buyers and sellers.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { 
                step: 1, 
                title: "Buyer Pays", 
                description: "Buyer deposits funds into Flexcrow's secure escrow account.",
                icon: CreditCard,
                color: "bg-blue-100 text-blue-600"
              },
              { 
                step: 2, 
                title: "Seller Delivers", 
                description: "Seller delivers the product or service to the buyer.", 
                icon: ArrowRight,
                color: "bg-yellow-100 text-yellow-600" 
              },
              { 
                step: 3, 
                title: "Buyer Inspects", 
                description: "Buyer verifies that the deliverable meets expectations.", 
                icon: Search,
                color: "bg-green-100 text-green-600" 
              },
              { 
                step: 4, 
                title: "Seller Receives", 
                description: "Once approved, the seller receives the payment automatically.", 
                icon: CheckCircle2,
                color: "bg-purple-100 text-purple-600"
              }
            ].map(step => (
              <div 
                key={step.step} 
                className={`p-6 rounded-lg border bg-white hover:border-flexcrow-600 hover:shadow-md transition-all`}
              >
                <div className={`${step.color} w-12 h-12 rounded-full flex items-center justify-center mb-5`}>
                  <step.icon className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="bg-flexcrow-100 text-flexcrow-600 text-sm font-bold px-2.5 py-1 rounded-full">
                    Step {step.step}
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="mutedforeground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-[#f2f6f8]">
        <div className="flexcrowcontainer mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Flexcrow</h2>
            <p className="mutedforeground max-w-2xl mx-auto">Our platform is designed to provide the ultimate protection for both buyers and sellers.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                title: "Secure Payments", 
                description: "Your money is safely held in escrow until both parties are satisfied.",
                icon: Shield 
              },
              { 
                title: "Transparent Process", 
                description: "Track the status of your transaction at every stage of the process.", 
                icon: Eye 
              },
              { 
                title: "Verified Users", 
                description: "All users undergo a thorough verification process to ensure legitimacy.", 
                icon: UserCheck 
              },
              { 
                title: "24/7 Transactions", 
                description: "Our system operates round the clock, allowing you to transact any time.", 
                icon: Clock 
              }
            ].map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-all">
                <div className="bg-flexcrow-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-flexcrow-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="mutedforeground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-[#f9fbfb]">
        <div className="flexcrowcontainer mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
            <p className="mutedforeground max-w-2xl mx-auto">Join thousands of satisfied users who trust Flexcrow for their transaction needs.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                name: "Wittawin Susutti", 
                role: "Buyer",
                text: "The Flexcrow system is outstanding and definitely deserves an A in CSS234.",
                rating: 5
              },
              { 
                name: "Warin Wattanapornprom", 
                role: "Seller",
                text: "I completely agree with Wittawin — this project truly deserves an A in every subject, including the Capstone Project.",
                rating: 5
              },
              { 
                name: "Chukiat Worasucheep", 
                role: "Someone",
                text: "Good, very good, the best! This project was so good that I didn’t need to <b>interrupt</b> or change anything.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-white p-8 rounded-lg shadow-sm border hover:shadow-md transition-all">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-5 w-5 ${i < testimonial.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                <p className="mb-6 text-gray-700 italic">{testimonial.text}</p>
                <div className="flex items-center">
                  <div className="bg-flexcrow-100 text-flexcrow-600 font-bold w-10 h-10 rounded-full flex items-center justify-center mr-4">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm mutedforeground">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-[#f2f6f8]">
        <div className="flexcrowcontainer mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="mutedforeground max-w-2xl mx-auto">Have questions about Flexcrow? Find answers to common questions below.</p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" className="bg-white rounded-lg px-6 shadow-sm">
              <AccordionItem value="item-1">
                <AccordionTrigger 
                  onClick={() => toggleAccordion('item-1')}
                  aria-expanded={openAccordion === 'item-1'}
                  className="text-left font-medium"
                >
                  How does Flexcrow protect my money?
                </AccordionTrigger>
                <AccordionContent isOpen={openAccordion === 'item-1'}>
                  Flexcrow holds your funds in a secure escrow account until all conditions of the transaction are met. Our platform uses bank-level encryption and security measures to ensure your money is safe throughout the process.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-2">
                <AccordionTrigger 
                  onClick={() => toggleAccordion('item-2')}
                  aria-expanded={openAccordion === 'item-2'}
                  className="text-left font-medium"
                >
                  What happens if I'm not satisfied with what I receive?
                </AccordionTrigger>
                <AccordionContent isOpen={openAccordion === 'item-2'}>
                  If you're not satisfied with the product or service, you can raise a dispute within our platform. Our dispute resolution team will review the case and work with both parties to reach a fair resolution.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-3">
                <AccordionTrigger 
                  onClick={() => toggleAccordion('item-3')}
                  aria-expanded={openAccordion === 'item-3'}
                  className="text-left font-medium"
                >
                  How much does Flexcrow cost to use?
                </AccordionTrigger>
                <AccordionContent isOpen={openAccordion === 'item-3'}>
                  Flexcrow charges a small fee of 2-5% depending on the transaction value and type. The fee is only charged when a transaction is successfully completed. There are no monthly fees or hidden charges.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-4">
                <AccordionTrigger 
                  onClick={() => toggleAccordion('item-4')}
                  aria-expanded={openAccordion === 'item-4'}
                  className="text-left font-medium"
                >
                  How long does the escrow process take?
                </AccordionTrigger>
                <AccordionContent isOpen={openAccordion === 'item-4'}>
                  The escrow process timeline varies depending on the transaction. Typically, once the buyer approves the delivery, funds are released to the seller within 1-2 business days.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="item-5">
                <AccordionTrigger 
                  onClick={() => toggleAccordion('item-5')}
                  aria-expanded={openAccordion === 'item-5'}
                  className="text-left font-medium"
                >
                  What types of transactions can I use Flexcrow for?
                </AccordionTrigger>
                <AccordionContent isOpen={openAccordion === 'item-5'}>
                  Flexcrow can be used for a wide range of transactions including freelance services, digital products, high-value physical goods, software development, and more. If you have a specific use case, contact our support team for guidance.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      <section className="section-padding bg-flexcrow-600">
        <div className="flexcrowcontainer mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Transact with Confidence?</h2>
          <p className="max-w-2xl mx-auto text-white mb-8">Join thousands of users who trust Flexcrow to protect their transactions.</p>
          <Button
            onClick={() => navigate('/auth/signup')}
            size="lg" className="bg-white text-flexcrow-600 hover:bg-gray-100"
          >
            Create Your Free Account
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
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
              <p className="text-gray-400 text-sm mb-4 md:mb-0">© 2025 Flexcrow. All rights reserved.</p>
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

export default Index;
