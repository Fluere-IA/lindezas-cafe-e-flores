import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function LandingHeader() {
  const scrollToPlans = () => {
    const plansSection = document.getElementById("planos");
    plansSection?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="bg-[#1E40AF] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-white tracking-tight">
              Servire
            </span>
          </Link>

          {/* Navigation - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#produto" 
              className="text-white/90 hover:text-white transition-colors text-sm font-medium"
            >
              Produto
            </a>
            <a 
              href="#para-quem" 
              className="text-white/90 hover:text-white transition-colors text-sm font-medium"
            >
              Para quem é
            </a>
            <a 
              href="#planos" 
              className="text-white/90 hover:text-white transition-colors text-sm font-medium"
            >
              Planos
            </a>
            <a 
              href="#faq" 
              className="text-white/90 hover:text-white transition-colors text-sm font-medium"
            >
              Perguntas
            </a>
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              asChild
              className="border-white/80 text-white bg-transparent hover:bg-white/10 hover:text-white"
            >
              <Link to="/auth">Login</Link>
            </Button>
            <Button
              onClick={scrollToPlans}
              className="bg-white text-[#1E40AF] hover:bg-white/90 font-semibold"
            >
              Comece agora
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
