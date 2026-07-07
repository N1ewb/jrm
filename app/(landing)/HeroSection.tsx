import Link from "next/link";
import Image from "next/image";
import { MapPin, Route, Navigation, Users } from "lucide-react";
import HeroMap from "../assets/undraw_navigation_0q48.png";

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 py-20 lg:py-32">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <h1 className="text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              Navigate the{" "}
              <span className="text-secondary">Jeepney Routes</span> of{" "}
              <span className="text-primary">Iligan City</span>
            </h1>
            <p className="text-base text-muted-foreground mt-4 max-w-lg mx-auto lg:mx-0">
              Community-powered navigation for Philippine public transportation.
              Find routes, calculate fares, and contribute to the most accurate
              jeepney map.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center lg:justify-start">
              <Link
                href="/auth/sign-up"
                className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors inline-flex items-center justify-center"
              >
                Get Started
              </Link>
              <Link
                href="/auth/login"
                className="h-12 px-8 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors inline-flex items-center justify-center"
              >
                Sign In
              </Link>
            </div>
          </div>
          <div className="flex-1 max-w-md lg:max-w-none">
            <Image
              src={HeroMap}
              alt="Navigation illustration"
              className="w-full"
              priority
            />
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-5 py-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Route size={20} className="text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground mt-2">
                Route Finder
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Find the best jeepney routes
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto">
                <Navigation size={20} className="text-secondary" />
              </div>
              <p className="text-sm font-semibold text-foreground mt-2">
                GPS Navigation
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time location tracking
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <MapPin size={20} className="text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground mt-2">
                Fare Calculator
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Know your fare before you ride
              </p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center mx-auto">
                <Users size={20} className="text-secondary" />
              </div>
              <p className="text-sm font-semibold text-foreground mt-2">
                Community Driven
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Routes verified by commuters
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
