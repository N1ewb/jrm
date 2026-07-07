import HeroSection from "./HeroSection";
import Link from "next/link";
import { MapPin, DollarSign } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col">
      <HeroSection />

      <section className="py-20 bg-primary">
        <div className="max-w-6xl mx-auto px-5 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-white">
            How It Works
          </h2>
          <p className="text-sm text-white/70 mt-2 max-w-lg mx-auto">
            Three simple steps to navigate Iligan City like a local.
          </p>
          <div className="grid sm:grid-cols-3 gap-8 mt-10">
            {[
              {
                step: "01",
                title: "Find Your Route",
                desc: "Search destinations or browse community-verified jeepney routes on the interactive map.",
              },
              {
                step: "02",
                title: "Know the Fare",
                desc: "Get accurate fare estimates before you ride. First 4km at ₱13, ₱1 per succeeding km.",
              },
              {
                step: "03",
                title: "Contribute",
                desc: "Submit new routes, report changes, and help keep the community map accurate.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 text-left"
              >
                <span className="text-3xl font-bold text-white/20">
                  {item.step}
                </span>
                <h3 className="text-white font-semibold mt-2">{item.title}</h3>
                <p className="text-sm text-white/70 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
                Built for Iligan City
              </h2>
              <p className="text-sm text-muted-foreground mt-3">
                JRM is designed specifically for Iligan City&apos;s unique
                transportation network. From Suarez to Buru-un, Tominobo to
                Fuentes — every route is mapped and verified by the community.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                {[
                  "Suarez",
                  "Buru-un",
                  "Tominobo",
                  "Fuentes",
                  "Tibanga",
                  "Pala-o",
                  "Hinaplanon",
                  "Mahayahay",
                ].map((line) => (
                  <span
                    key={line}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-secondary/10 text-secondary"
                  >
                    {line}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 max-w-sm">
              <div className="rounded-2xl bg-muted/50 p-6 border border-border">
                <DollarSign size={32} className="text-secondary" />
                <h3 className="font-semibold text-foreground mt-3">
                  Transparent Fare System
                </h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      First 4 kilometers
                    </span>
                    <span className="font-semibold text-foreground">₱13.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Per succeeding km
                    </span>
                    <span className="font-semibold text-foreground">+₱1.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Shudad discount zone
                    </span>
                    <span className="font-semibold text-green-600">Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-muted/30 border-t border-border">
        <div className="max-w-6xl mx-auto px-5 text-center">
          <h2 className="text-2xl lg:text-3xl font-bold text-foreground">
            Join the Community
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
            Help build the most accurate jeepney navigation map for Iligan
            City.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 mt-8 justify-center">
            <Link
              href="/auth/sign-up"
              className="h-12 px-8 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors inline-flex items-center justify-center"
            >
              Create Account
            </Link>
            <Link
              href="/auth/login"
              className="h-12 px-8 rounded-xl border border-border bg-card text-foreground font-medium text-sm hover:bg-muted transition-colors inline-flex items-center justify-center"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background py-8">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin size={14} className="text-secondary" />
            <span className="font-semibold text-foreground">JRM</span>
            <span>Jeep Route Maps</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Community-powered navigation for Iligan City
          </p>
        </div>
      </footer>
    </div>
  );
}
